import secrets from './secrets.json'

const config = Object.keys(secrets).reduce((acc, key) => {
	acc[key] = process.env[key] || secrets[key]
	return acc
}, {})

export default config
