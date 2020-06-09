const Mustache = require('mustache')

describe('Tracker', () => {
  beforeEach(() => {
    const script = document.createElement('script')
    script.src = 'https://cdn.tinybird.co/static/js/t.js?client=whatever&t=the_token'

    Object.defineProperty(document, 'currentScript', {
      value: script
    })
  })

  it('should init properly', () => {
    require('../dist/tinybird-tracker')

    expect(window.tbt).toBeDefined()
    expect(window.tbt.push).toEqual(jasmine.any(Function))
  })
})