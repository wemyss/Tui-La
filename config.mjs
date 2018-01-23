import secrets from './secrets.json';

const config = Object.keys(secrets).map(key => process.env[key] || secrets[key]);

export default config;
