const ia = jest.genMockFromModule('instrumental-agent')

const metrics = {
  gauges: {},
  incs: {},
}

ia.configure = () => {}

ia.increment = key => {
  if (!metrics.incs[key]) {
    metrics.incs[key] = 0
  }
  metrics.incs[key] = metrics.incs[key] + 1
}

ia.gauge = (key, value) => {
  if (!metrics.gauges[key]) {
    metrics.gauges[key] = []
  }
  metrics.gauges[key].push(value)
}

ia.__metrics = metrics

ia.__clear = () => {
  metrics.gauges = {}
  metrics.incs = {}
}

module.exports = ia
