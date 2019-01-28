import fetch from 'node-fetch'

import Webhook from './Webhook'
import config from './config'
import { extractFieldValues } from './helpers'

// Data points are created on thinkspeak ~12min
const DATA_POINTS = 4	// Number of data points to fetch
const MIN_BORE_WATER_HEIGHT = 800	// mm
const MAX_DROP_RATE_RAIN_WATER = 20 // mm

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
		}
	})
}

/** Notify via viber that the tank levels have dropped */
function maybeNotify({ name, heights }) {
	const hook = new Webhook(config.SLACK_WEBHOOK_URL)
	if (!heights.length) {
		hook.send(`The past ${DATA_POINTS} data points for ${name} have been 0mm...`)
	}
	console.log(name, heights)

	switch (name) {
		case 'Bore tank (A)':
			const height = heights[heights.length - 1]
			if (height < MIN_BORE_WATER_HEIGHT) {
				hook.send(`Bore tank level is ${height}mm`)
			}
			break
		case 'Rain Water (B)':
			const delta = heights[0] - heights[heights.length - 1]
			if (delta > MAX_DROP_RATE_RAIN_WATER) {
				hook.send(`Rain tank has dropped ${delta}mm over the past ${DATA_POINTS} data points`)
			}
			break
		default:
			const err = `Unhandled tank name: '${name}'`
			hooks.send(err)
			throw new Error(err)
	}
}


// Main
// ------------------------------------------
fetchWaterData()
	.then(data => analyseTanks(data))
	.then(tanks => tanks.map(t => maybeNotify(t)))
