const fetch = require('node-fetch')

const config = require('./config')

// Data points are created on thingspeak ~12min
const DATA_POINTS = 5	// Number of data points to fetch
const MIN_BORE_WATER_HEIGHT = 1300  // mm
const MAX_DROP_RATE_RAIN_WATER = 25 // mm
const MAX_TIME_SINCE_LAST_DATA = 3  // hrs

/** Slack incoming webhook, basic messenger */
class Webhook {
  constructor(webhookURL) {
    this.url = webhookURL
  }

  send(text) {
    return fetch(this.url, {
        method: 'POST',
        body: JSON.stringify({ text }),
        headers: { 'Content-Type': 'application/json' },
      })
  }
}

/** Extracts the list of values for the given field name */
function extractFieldValues(data, field) {
	return data.feeds
		.map(x => x[field])
		.map(x => parseInt(x, 10))
}

/**
 * Fetch water data from thingspeak
 */
function fetchWaterData() {
	return fetch(`https://api.thingspeak.com/channels/${config.CHANNEL_ID}/feeds.json?api_key=${config.THINGSPEAK_READ_KEY}&results=${DATA_POINTS}`)
		.then(res => res.json())
		.catch(err => console.err(err))
}

/**
 * Analyse the tank data from thingspeak and return condensed version with
 * calculated tank height and names.
 */
function analyseTanks(data) {
	return [1,2].map(x => {
		const field = `field${x}`
		return {
			name: data.channel[field],
			heights: extractFieldValues(data, field),
			latestDate: new Date(data.feeds[data.feeds.length - 1].created_at),
		}
	})
}

/** Return a new date `n` hours ago from now. Accepts decimals */
function nHoursAgo(n) {
	const d = new Date()
	d.setMinutes(d.getMinutes() - (n * 60))
	return d
}

/** Notify via viber that the tank levels have dropped */
function maybeNotify({ name, heights, latestDate }) {
	console.log(name, heights, latestDate)
	const hook = new Webhook(config.SLACK_WEBHOOK_URL)
	if (latestDate < nHoursAgo(MAX_TIME_SINCE_LAST_DATA) &&
			latestDate > nHoursAgo(MAX_TIME_SINCE_LAST_DATA + .5)) {
		return hook.send(`Most recent data point was around ${MAX_TIME_SINCE_LAST_DATA}hrs ago for ${name}`)
	}

	// Non zero data points
	const points = heights.filter(x => x > 0)

	if (points.length === 0) {
		// All points were 0, we've already sent a notification
		return;
	}
	if (points.length === 1 && heights[0] !== 0) {
		return hook.send(`The past ${DATA_POINTS - 1} data points for ${name} have been 0mm...`)
	}

	switch (name) {
		case 'Bore tank (A)':
			const height = points[points.length - 1]
			if (points.slice(Math.max(points.length - 3, 1)).every(h => h < MIN_BORE_WATER_HEIGHT)) {
				// 3 most recent points are less than the min bore water height, stop sending spam notifications
				return;
			}
			if (height < MIN_BORE_WATER_HEIGHT) {
				hook.send(`Bore tank level is ${height}mm`)
			}
			break
		case 'Rain Water (B)':
			const delta = points[0] - points[points.length - 1]
			if (delta > MAX_DROP_RATE_RAIN_WATER) {
				hook.send(`Rain tank has dropped ${delta}mm over the past ${DATA_POINTS} data points`)
			}
			break
		default:
			const err = `Unhandled tank name: '${name}'`
			hook.send(err)
			throw new Error(err)
	}
}

function main() {
	fetchWaterData()
		.then(data => analyseTanks(data))
		.then(tanks => tanks.map(t => maybeNotify(t)))
}

if (config.MY_ENV === 'development') {
	main()
}

module.exports.handler = (event) => {
	main()
}
