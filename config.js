const secrets = require('./secrets.json')

const config = Object.keys(secrets).reduce((acc, key) => {
	acc[key] = process.env[key] || secrets[key]
	return acc
}, {})

module.exports = config
