import fetch from 'node-fetch'

import config from './config'
import { findMedian, findMax } from './helpers'

const DATA_POINTS = 6
const MIN_WATER_HEIGHT = 1000

/**
Fetch water data from thingspeak
**/
function fetchWaterData() {
	return fetch(`https://api.thingspeak.com/channels/${config.CHANNEL_ID}/feeds.json?api_key=${config.THINGSPEAK_READ_KEY}&results=${DATA_POINTS}`)
		.then(res => res.json())
		.catch(err => console.err(err))
}

/**
* Analyse the tank data from thingspeak and return condensed version with calculated tank height and names
**/
function analyseTanks(data) {
	return [1,2].map(x => {
		const field = `field${x}`
		return {
			name: data.channel[field],
			// FIXME: distributed water height. Should I use max or median? There is a lot of 0's atm so max will be better for now.
			height: findMax(data, field),
		}
	})
}

/**
* Notify via viber that the tank levels have dropped
**/
function notify(tank) {
	console.log(tank)
	// TODO: Send notification when water height changes more than 50cm since last notifcation? - DynamoDB
	if (tank.height < MIN_WATER_HEIGHT) {
		// send viber message
	} else {
		//  ignore
	}
}




fetchWaterData()
	.then(data => analyseTanks(data))
	.then(tanks => tanks.map(t => notify(t)))
