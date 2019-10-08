mbot.Client = class {
  constructor(client) {
    this.client = client
    for (let h of mbot.client.handlers) {
      this.client.on(h.event, h.handler)
    }
    return this.client
  }

  static on(event, handler) {
    mbot.client.handlers.push({event, handler})
  }
}

mbot.client = mbot.Client
mbot.client.handlers = []