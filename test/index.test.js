import fetch from 'unfetch'
import tracker from '../src'

jest.mock('unfetch', () => jest.fn())

describe('Tracker', () => {
  const localstorage = function () {
    let store = {}
    return {
      getItem: function (key) {
        return store[key] || null
      },
      setItem: function (key, value) {
        store[key] = value.toString()
      },
      removeItem: function (key) {
        delete store[key]
      },
      clear: function () {
        store = {}
      }
    }
  }

  function CurrentScript(src, dataProps) {
    this['src'] = src
    this['getAttribute'] = function (m) {
      return dataProps[m]
    }
  }

  function parseEvents(content) {
    return content
      .split('\n')
      .map(row => {
        if (!row) return null
        return JSON.parse(row)
      })
      .filter(r => !!r)
  }

  beforeEach(() => {
    jest.useFakeTimers()

    fetch.mockImplementation(() => {
      return Promise.resolve({
        json: () => Promise.resolve('a')
      })
    })
  })

  afterEach(() => {
    fetch.mockClear()
    jest.clearAllTimers()
  })

  it('should be truthy', () => {
    expect(true).toBe(true)
  })

  describe('initialization', () => {
    it('should init properly', () => {
      let w = {
        document: {
          cookie: 'coooooookie',
          currentScript: new CurrentScript(
            'https://cdn.tinybird.co/static/js/t.js',
            {
              'data-source': 'hey',
              'data-token': 'token'
            }
          )
        },
        addEventListener: jest.fn(),
        localStorage: new localstorage()
      }

      tracker(w)

      jest.advanceTimersByTime(5000)

      expect(w.tinybird).toBeDefined()
      expect(w.tinybird).toEqual(jasmine.any(Function))
    })

    it('should not initialize without a Data Source', () => {
      let w = {
        document: {
          cookie: 'coooooookie',
          currentScript: new CurrentScript(
            'https://cdn.tinybird.co/static/js/t.js',
            {
              'data-token': 'hey'
            }
          )
        },
        addEventListener: jest.fn(),
        localStorage: new localstorage()
      }
      expect(() => {
        tracker(w)
      }).toThrow("'dataSource' name is required to start sending events")
    })

    it('should not initialize without a token', () => {
      let w = {
        document: {
          cookie: 'coooooookie',
          currentScript: new CurrentScript(
            'https://cdn.tinybird.co/static/js/t.js',
            {
              'data-source': 'hey'
            }
          )
        },
        addEventListener: jest.fn(),
        localStorage: new localstorage()
      }
      expect(() => {
        tracker(w)
      }).toThrow("'token' is required to start sending events")
    })
  })

  it('should parse those events already included', async done => {
    let w = {
      document: {
        cookie: 'coooooookie',
        currentScript: new CurrentScript('https://cdn.tinybird.co/static/js/t.js', {
          'data-token': 'token',
          'data-source': 'events'
        })
      },
      addEventListener: jest.fn(),
      localStorage: new localstorage()
    }

    w.tinybird = [['pageload', { url: 'https://tinybird.co' }]]

    fetch.mockImplementation((url, formData) => {
      const ndjson = formData.body.get('ndjson')
      const events = parseEvents(ndjson)
      expect(events.length).toBe(1)
      const event = events[0]
      expect(event).toEqual({
        url: 'https://tinybird.co',
        event: 'pageload',
        timestamp: jasmine.any(String),
        session_start: jasmine.any(String),
        uuid: jasmine.any(String)
      })
      return Promise.resolve({
        json: () => Promise.resolve('a')
      })
    })

    tracker(w)

    jest.advanceTimersByTime(5000)

    await flushPromises()

    expect(fetch).toHaveBeenCalledWith(
      'https://cdn.tinybird.co/v0/events?name=events&token=token',
      {
        body: jasmine.any(FormData),
        method: 'POST'
      }
    )

    done()
  })

  it('should send a new event after 2secs', async done => {
    let a = {
      document: {
        cookie: 'coooooookie',
        currentScript: new CurrentScript('https://cdn.tinybird.co/static/js/t.js', {
          'data-source': 'hey',
          'data-token': 'token'
        })
      },
      addEventListener: jest.fn(),
      localStorage: new localstorage()
    }

    fetch.mockImplementation((url, formData) => {
      const ndjson = formData.body.get('ndjson')
      const events = parseEvents(ndjson)
      expect(events.length).toBe(1)
      const event = events[0]
      expect(event).toEqual({
        url: 'https://blog.tinybird.co',
        action: 'sign up',
        email: 'whatever@hey.com',
        event: 'click',
        timestamp: jasmine.any(String),
        session_start: jasmine.any(String),
        uuid: jasmine.any(String)
      })
      return Promise.resolve({
        json: () => Promise.resolve('a')
      })
    })

    tracker(a)

    expect(fetch).not.toHaveBeenCalled()

    a.tinybird('click', {
      url: 'https://blog.tinybird.co',
      action: 'sign up',
      email: 'whatever@hey.com'
    })

    expect(fetch).not.toHaveBeenCalled()

    jest.advanceTimersByTime(5000)

    await flushPromises()

    expect(fetch).toHaveBeenCalledWith(
      'https://cdn.tinybird.co/v0/events?name=hey&token=token',
      {
        body: jasmine.any(FormData),
        method: 'POST'
      }
    )

    done()
  })

  it('should send pending localStorage events after 2sec', async done => {
    const ls = new localstorage()
    ls.setItem(
      'tinybird_events',
      '[{"action": "sign up", "email": "whatever@hey.com", "event": "click", "session_start": "2020-10-10 10:10:10", "timestamp": "2020-10-10 10:10:10", "url": "https://blog.tinybird.co", "uuid": "1111-1111-1111-1111"}]'
    )

    let w = {
      document: {
        cookie: 'coooooookie',
        currentScript: new CurrentScript('https://cdn.tinybird.co/static/js/t.js', {
          'data-source': 'hey',
          'data-token': 'token'
        })
      },
      addEventListener: jest.fn(),
      localStorage: ls
    }

    fetch.mockImplementation((url, formData) => {
      const ndjson = formData.body.get('ndjson')
      const events = parseEvents(ndjson)
      expect(events.length).toBe(1)
      const event = events[0]
      expect(event).toEqual({
        url: 'https://blog.tinybird.co',
        action: 'sign up',
        email: 'whatever@hey.com',
        event: 'click',
        timestamp: jasmine.any(String),
        session_start: jasmine.any(String),
        uuid: jasmine.any(String)
      })
      return Promise.resolve({
        json: () => Promise.resolve('a')
      })
    })

    tracker(w)

    expect(fetch).not.toHaveBeenCalled()

    jest.advanceTimersByTime(5000)

    await flushPromises()

    expect(fetch).toHaveBeenCalledWith(
      'https://cdn.tinybird.co/v0/events?name=hey&token=token',
      {
        body: jasmine.any(FormData),
        method: 'POST'
      }
    )

    done()
  })

  it('should retry 6 times more if the first fetch failed', async done => {
    const ls = new localstorage()
    let w = {
      document: {
        cookie: 'coooooookie',
        currentScript: new CurrentScript('https://cdn.tinybird.co/static/js/t.js', {
          'data-source': 'hey',
          'data-token': 'token'
        })
      },
      addEventListener: jest.fn(),
      localStorage: ls
    }

    w.tinybird = [['pageload', { url: 'https://tinybird.co', page: 'landing' }]]

    fetch.mockImplementation((url, formData) => {
      return Promise.reject()
    })

    fetch.mockClear()

    tracker(w)

    await flushPromises()

    jest.advanceTimersByTime(5000)

    await flushPromises()

    jest.advanceTimersByTime(5000)

    await flushPromises()

    jest.advanceTimersByTime(5000)

    await flushPromises()

    jest.advanceTimersByTime(5000)

    await flushPromises()

    jest.advanceTimersByTime(5000)

    await flushPromises()

    jest.advanceTimersByTime(5000)

    await flushPromises()

    expect(fetch.mock.calls.length).toBe(6)

    jest.advanceTimersByTime(5000)

    expect(fetch.mock.calls.length).toBe(6)

    jest.advanceTimersByTime(5000)

    expect(fetch.mock.calls.length).toBe(6)

    done()
  })
})
