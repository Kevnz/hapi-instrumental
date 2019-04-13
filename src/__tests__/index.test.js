const Hapi = require('hapi')
const { delay } = require('@kev_nz/async-tools')

jest.mock('instrumental-agent')

const agent = require('instrumental-agent')
// Create a server with a host and port
let server
const KEY = 'app.web.request'

beforeEach(() => {
  agent.__clear()
  server = Hapi.Server({
    port: 0,
  })
})

describe('The Instrumental Plugin', () => {
  it('should register the plugin successfully', async () => {
    expect(async () => {
      await server.register({
        plugin: require('../index'),
        options: {
          apiKey: 'asiw1231312fs9sd9g',
        },
      })
    }).not.toThrow()
  })

  it('should not register the plugin when no api key is passed', async () => {
    expect(
      server.register({
        plugin: require('../index'),
        options: {},
      })
    ).rejects.toThrow('The Instrumental API key is required')
  })
  it('should register the plugin with correct details', async () => {
    await server.register({
      plugin: require('../index'),
      options: {
        apiKey: 'asiw1231312fs9sd9g',
      },
    })

    const pluginInfo = server.registrations['hapi-instrumental']
    expect(pluginInfo).toBeDefined()
    expect(pluginInfo.options).toEqual({
      apiKey: 'asiw1231312fs9sd9g',
    })
  })

  it('the plugin should increment app.web.request', async () => {
    await server.register({
      plugin: require('../index'),
      options: {
        apiKey: 'asiw1231312fs9sd9g',
      },
    })

    server.route({
      method: 'GET',
      path: '/',
      handler: () => {
        return 'Boom!'
      },
    })
    await server.inject({
      url: '/',
    })

    expect(agent.__metrics.incs[KEY]).toEqual(1)

    expect(agent.__metrics.gauges[KEY].length).toEqual(1)
  })

  it('the plugin should update gauge app.web.request', async () => {
    await server.register({
      plugin: require('../index'),
      options: {
        apiKey: 'asiw1231312fs9sd9g',
      },
    })

    server.route({
      method: 'GET',
      path: '/',
      handler: () => {
        return 'Boom!'
      },
    })
    await server.inject({
      url: '/',
    })

    expect(agent.__metrics.incs[KEY]).toEqual(1)
  })
  it('the plugin adds instrument and gauge methods on request', async () => {
    await server.register({
      plugin: require('../index'),
      options: {
        apiKey: 'asiw1231312fs9sd9g',
      },
    })
    server.route({
      method: 'GET',
      path: '/hi',
      handler: request => {
        expect(request.increment).toBeDefined()
        expect(request.gauge).toBeDefined()
        return 'Nice!'
      },
    })

    await server.inject({
      url: '/hi',
    })
  })
  it('the plugin adds instrument and gauge methods on request', async () => {
    await server.register({
      plugin: require('../index'),
      options: {
        apiKey: 'asiw1231312fs9sd9g',
      },
    })
    server.route({
      method: 'GET',
      path: '/hi',
      handler: request => {
        expect(request.increment).toBeDefined()
        expect(request.gauge).toBeDefined()
        return 'Methods!'
      },
    })

    const response = await server.inject({
      url: '/hi',
    })
    expect(response.statusCode).toBe(200)
  })
  it('the plugin adds measure method on request', async () => {
    await server.register({
      plugin: require('../index'),
      options: {
        apiKey: 'asiw1231312fs9sd9g',
        url: 'http://www.example.com',
      },
    })
    server.route({
      method: 'GET',
      path: '/hi',
      handler: request => {
        expect(request.measure).toBeDefined()
        return 'Nice!'
      },
    })

    const response = await server.inject({
      url: '/hi',
    })
    expect(response.statusCode).toBe(200)
  })
  it('should measure the time from start to measure called ', async () => {
    await server.register({
      plugin: require('../index'),
      options: {
        apiKey: 'asiw1231312fs9sd9g',
      },
    })

    server.route({
      method: 'GET',
      path: '/',
      handler: async (request, h) => {
        await delay(10)
        request.measure('first.delay')
        await delay(20)
        request.measure('second.delay')
        return 'Boom!'
      },
    })

    const response = await server.inject({
      url: '/',
    })
    expect(response.statusCode).toBe(200)

    expect(agent.__metrics.gauges['first.delay'][0]).toBeGreaterThan(9)
    expect(agent.__metrics.gauges['second.delay'][0]).toBeGreaterThan(29)
  })
  it('should have the plugin add startMeasuring andMeasuring methods on request', async () => {
    await server.register({
      plugin: require('../index'),
      options: {
        apiKey: 'asiw1231312fs9sd9g',
      },
    })
    server.route({
      method: 'GET',
      path: '/hi',
      handler: request => {
        expect(request.startMeasuring).toBeDefined()
        expect(request.endMeasuring).toBeDefined()
        return 'Nice!'
      },
    })

    const response = await server.inject({ url: '/hi' })
    expect(response.statusCode).toBe(200)
  })
  it('should measure the time from when startMeasure and endMeasure when used ', async () => {
    const KEY = 'first.measure'
    await server.register({
      plugin: require('../index'),
      options: {
        apiKey: 'asiw1231312fs9sd9g',
      },
    })

    server.route({
      method: 'GET',
      path: '/',
      handler: async (request, h) => {
        await delay(10)
        request.startMeasuring(KEY)
        await delay(20)
        request.endMeasuring(KEY)
        return 'Boom!'
      },
    })

    const response = await server.inject({
      url: '/',
    })
    expect(response.statusCode).toBe(200)
    expect(agent.__metrics.gauges[KEY][0]).toBeGreaterThan(19)
  })
  it('should measure the time from when startMeasure and endMeasure when used and calling start twice does not', async () => {
    const KEY = 'start.measure'
    await server.register({
      plugin: require('../index'),
      options: {
        apiKey: 'asiw1231312fs9sd9g',
      },
    })

    server.route({
      method: 'GET',
      path: '/',
      handler: async (request, h) => {
        await delay(10)
        request.startMeasuring(KEY)
        await delay(20)

        request.startMeasuring(KEY)
        await delay(10)
        request.endMeasuring(KEY)
        return 'Boom!'
      },
    })

    const response = await server.inject({
      url: '/',
    })
    expect(response.statusCode).toBe(200)
    expect(agent.__metrics.gauges[KEY][0]).toBeGreaterThan(9)
    expect(agent.__metrics.gauges[KEY][0]).toBeLessThan(13)
  })
  it('should measure the time from when startMeasure and endMeasure when used and calling start twice does not', async () => {
    const KEY = 'twice.measure'
    await server.register({
      plugin: require('../index'),
      options: {
        apiKey: 'asiw1231312fs9sd9g',
      },
    })

    server.route({
      method: 'GET',
      path: '/',
      handler: async (request, h) => {
        await delay(10)
        request.endMeasuring(KEY)
        return 'Boom!'
      },
    })

    const response = await server.inject({
      url: '/',
    })
    expect(response.statusCode).toBe(200)
    expect(agent.__metrics.gauges[KEY]).not.toBeDefined()
  })
})
