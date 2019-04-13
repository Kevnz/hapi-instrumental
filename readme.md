# Hapi Instrumentation Plugin

Instrument your Hapi app with instrumental service [Instrumental](https://instrumentalapp.com)

## Usage

## Register plugin

```javascript
// register plugin
server.register({
  register: require('hapi-instrumental'),
  options: {
    apiKey: 'jlsdfjklsjfs3242423432' //instrumental api key
  }
})
```

## Usage

In addition to logging responses you can both increment and use the gauge functionality (please see instrumentalapp.com docs) as you would from the agent. The plugin also provides the ability to gauge the time from the start of the request as well as gauging start and stop keys.

```javascript
server.route({
  method: 'GET',
  path: '/',
  handler: (request, h) => {
    request.increment('web.request.home')
    return  'Hi There'
  }
})

// with startMeasuring and endMeasuring
server.route({
  method: 'GET',
  path: '/slowquery',
  handler: async (request, h) => {
    request.startMeasuring('api.dataquery.time')
    const result = await getSomeData()
    request.endMeasuring('api.dataquery.time')
    return result
  }
})

// gauge from the start of the reqest
server.route({
  method: 'GET',
  path: '/slowquery',
  handler: async (request, h) => {

    const result = await getSomeData()
    request.measure('web.dataquery.time') // from start
    const result2 = await getSomeOtherData()

    return { ...result, ...result2 }
  }
})
// using the gauge directly
server.route({
  method: 'GET',
  path: '/slowquery',
  handler: async (request, h) => {
    const hrstart = process.hrtime()
    const result = await getSomeData()
    const hrend = process.hrtime(hrstart)
    request.gauge(
      'api.dataquery.time',
      hrend[1] / 1000000 /*, time = now, count = 1 */
    )
    return result
  }
})

```
