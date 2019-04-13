const agent = require('instrumental-agent')
const pkg = require('../package.json')
const register = (server, options) => {
  if (!options.apiKey) {
    throw new Error('The Instrumental API key is required')
  }
  agent.configure({
    apiKey: options.apiKey,
    enabled: true,
  })
  server.decorate('request', 'increment', agent.increment)
  server.decorate('request', 'gauge', agent.gauge)

  server.decorate('request', 'measure', function(key) {
    const hrstart = this.pre.hrstart
    const hrend = process.hrtime(hrstart)
    agent.gauge(key, hrend[1] / 1000000)
  })

  server.decorate('request', 'startMeasuring', function(key) {
    if (this.pre._starts[key]) {
      console.warn(`The key: ${key} was already being measured`)
      delete this.pre._starts[key]
    }
    this.pre._starts[key] = process.hrtime()
  })

  server.decorate('request', 'endMeasuring', function(key) {
    if (!this.pre._starts[key]) {
      console.warn(`The key: ${key} was not being measured`)
      return
    }
    const hrend = process.hrtime(this.pre._starts[key])
    agent.gauge(key, hrend[1] / 1000000)
    delete this.pre._starts[key]
  })

  server.ext('onRequest', (request, h) => {
    agent.increment('app.web.request')
    request.pre.hrstart = process.hrtime()
    request.pre._starts = {}
    request.pre.I = agent
    return h.continue
  })

  server.ext('onPreResponse', (request, h) => {
    const hrstart = request.pre.hrstart
    const hrend = process.hrtime(hrstart)
    agent.gauge('app.web.request', hrend[1] / 1000000)
    return h.continue
  })
}

const { name, version } = pkg

module.exports = { register, name, version }
