import fetch from 'node-fetch'

/** Slack incoming webhook, basic messenger */
export default class Webhook {
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
