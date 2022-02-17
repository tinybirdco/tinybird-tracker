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
      return Promise.resolve({ status: 202 })
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
          ),
          addEventListener: jest.fn()
        },
        addEventListener: jest.fn(),
        localStorage: new localstorage(),
        location: {
          hostname: 'tinybird.co'
        }
      }

      tracker(w)

      jest.advanceTimersByTime(1000)

      expect(w.tinybird).toBeDefined()
      expect(w.tinybird).toEqual(jasmine.any(Function))
    })

    it('should init properly using another function', () => {
      let w = {
        document: {
          cookie: 'coooooookie',
          currentScript: new CurrentScript(
            'https://cdn.tinybird.co/static/js/t.js',
            {
              'data-source': 'hey',
              'data-token': 'token',
              'data-function': 'tbt'
            }
          ),
          addEventListener: jest.fn()
        },
        addEventListener: jest.fn(),
        localStorage: new localstorage(),
        location: {
          hostname: 'tinybird.co'
        }
      }

      tracker(w)

      jest.advanceTimersByTime(1000)

      expect(w.tbt).toBeDefined()
      expect(w.tinybird).not.toBeDefined()
      expect(w.tbt).toEqual(jasmine.any(Function))
      expect(w.tinybird).not.toEqual(jasmine.any(Function))
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
          ),
          addEventListener: jest.fn()
        },
        addEventListener: jest.fn(),
        localStorage: new localstorage(),
        location: {
          hostname: 'tinybird.co'
        }
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
          ),
          addEventListener: jest.fn()
        },
        addEventListener: jest.fn(),
        localStorage: new localstorage(),
        location: {
          hostname: 'tinybird.co'
        }
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
        }),
        addEventListener: jest.fn()
      },
      addEventListener: jest.fn(),
      localStorage: new localstorage(),
      location: {
        hostname: 'tinybird.co'
      }
    }

    w.tinybird = [['pageload', { url: 'https://tinybird.co' }]]

    fetch.mockImplementation((url, formData) => {
      const ndjson = formData.body
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
      return Promise.resolve({ status: 202 })
    })

    tracker(w)

    jest.advanceTimersByTime(1000)

    await flushPromises()

    expect(fetch).toHaveBeenCalledWith(
      'https://api.tinybird.co/v0/events?name=events&token=token',
      {
        body: jasmine.any(String),
        method: 'POST'
      }
    )

    done()
  })

  it('should send a new event after 1 second', async done => {
    let a = {
      document: {
        cookie: 'coooooookie',
        currentScript: new CurrentScript('https://cdn.tinybird.co/static/js/t.js', {
          'data-source': 'hey',
          'data-token': 'token'
        }),
        addEventListener: jest.fn()
      },
      addEventListener: jest.fn(),
      localStorage: new localstorage(),
      location: {
        hostname: 'tinybird.co'
      }
    }

    fetch.mockImplementation((url, formData) => {
      const ndjson = formData.body
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
      return Promise.resolve({ status: 202 })
    })

    tracker(a)

    expect(fetch).not.toHaveBeenCalled()

    a.tinybird('click', {
      url: 'https://blog.tinybird.co',
      action: 'sign up',
      email: 'whatever@hey.com'
    })

    expect(fetch).not.toHaveBeenCalled()

    jest.advanceTimersByTime(1000)

    await flushPromises()

    expect(fetch).toHaveBeenCalledWith(
      'https://api.tinybird.co/v0/events?name=hey&token=token',
      {
        body: jasmine.any(String),
        method: 'POST'
      }
    )

    done()
  })

  it('should send pending localStorage events after 1 second', async done => {
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
        }),
        addEventListener: jest.fn()
      },
      addEventListener: jest.fn(),
      localStorage: ls,
      location: {
        hostname: 'tinybird.co'
      }
    }

    fetch.mockImplementation((url, formData) => {
      const ndjson = formData.body
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
      return Promise.resolve({ status: 202 })
    })

    tracker(w)

    expect(fetch).not.toHaveBeenCalled()

    jest.advanceTimersByTime(1000)

    await flushPromises()

    expect(fetch).toHaveBeenCalledWith(
      'https://api.tinybird.co/v0/events?name=hey&token=token',
      {
        body: jasmine.any(String),
        method: 'POST'
      }
    )

    done()
  })

  it('should retry 5 times more if the first fetch failed', async done => {
    const ls = new localstorage()
    let w = {
      document: {
        cookie: 'coooooookie',
        currentScript: new CurrentScript('https://cdn.tinybird.co/static/js/t.js', {
          'data-source': 'hey',
          'data-token': 'token'
        }),
        addEventListener: jest.fn()
      },
      addEventListener: jest.fn(),
      localStorage: ls,
      location: {
        hostname: 'tinybird.co'
      }
    }

    w.tinybird = [['pageload', { url: 'https://tinybird.co', page: 'landing' }]]

    fetch.mockImplementation((url, formData) => {
      return Promise.resolve({ status: 400 })
    })

    fetch.mockClear()

    tracker(w)

    await flushPromises()

    jest.advanceTimersByTime(1000)

    await flushPromises()

    jest.advanceTimersByTime(1000)

    await flushPromises()

    jest.advanceTimersByTime(1000)

    await flushPromises()

    jest.advanceTimersByTime(1000)

    await flushPromises()

    jest.advanceTimersByTime(1000)

    await flushPromises()

    jest.advanceTimersByTime(1000)

    await flushPromises()

    expect(fetch.mock.calls.length).toBe(6)

    jest.advanceTimersByTime(1000)

    expect(fetch.mock.calls.length).toBe(6)

    jest.advanceTimersByTime(1000)

    expect(fetch.mock.calls.length).toBe(6)

    done()
  })

  it('allow to not send the generated uuid', async function () {
    let w = {
      document: {
        currentScript: new CurrentScript(
          'https://cdn.tinybird.co/static/js/t.js',
          {
            'data-source': 'hey',
            'data-token': 'token'
          }
        ),
        addEventListener: jest.fn()
      },
      addEventListener: jest.fn(),
      localStorage: new localstorage(),
      location: {
        hostname: 'tinybird.co'
      }
    }
    tracker(w)

    w.tinybird('pageView', { whatever: 'hey' }, true)

    await flushPromises()
    jest.advanceTimersByTime(1000)
    await flushPromises()

    const calls = fetch.mock.calls
    expect(calls[0][0]).toEqual(
      'https://api.tinybird.co/v0/events?name=hey&token=token'
    )
    expect(calls[0][1].body).toBeTruthy()
    expect(JSON.parse(calls[0][1].body)).toEqual(
      expect.objectContaining({
        event: 'pageView',
        uuid: '',
        session_start: jasmine.any(String),
        whatever: 'hey'
      })
    )
  })

  describe('cookie management', () => {
    it('when there is no cookie, we create one', () => {
      const ls = new localstorage()
      let w = {
        document: {
          currentScript: new CurrentScript(
            'https://cdn.tinybird.co/static/js/t.js',
            {
              'data-source': 'hey',
              'data-token': 'token'
            }
          ),
          addEventListener: jest.fn()
        },
        addEventListener: jest.fn(),
        localStorage: ls,
        location: {
          hostname: 'tinybird.co'
        }
      }

      tracker(w)

      expect(w.document.cookie).toMatch(
        /tinybird=[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}:\d{13}; path=\/; domain=tinybird.co/
      )
    })

    it('when there is cookie, we parse correctly its contents', async () => {
      const ls = new localstorage()
      let w = {
        document: {
          currentScript: new CurrentScript(
            'https://cdn.tinybird.co/static/js/t.js',
            {
              'data-source': 'hey',
              'data-token': 'token'
            }
          ),
          addEventListener: jest.fn(),
          cookie: 'tinybird=98d935c1-63b1-4dcd-aded-e84856c57711:1644413400000' // 2022-02-09 13:30:00
        },
        addEventListener: jest.fn(),
        localStorage: ls,
        location: {
          hostname: 'tinybird.co'
        }
      }
      tracker(w)

      w.tinybird('test')

      await flushPromises()
      jest.advanceTimersByTime(1000)
      await flushPromises()

      const calls = fetch.mock.calls
      expect(calls[0][0]).toEqual(
        'https://api.tinybird.co/v0/events?name=hey&token=token'
      )
      expect(calls[0][1].body).toBeTruthy()
      expect(JSON.parse(calls[0][1].body)).toEqual(
        expect.objectContaining({
          event: 'test',
          uuid: '98d935c1-63b1-4dcd-aded-e84856c57711',
          session_start: '2022-02-09 13:30:00'
        })
      )
    })

    it('allow to not send the cookie uuid', async function () {
      const ls = new localstorage()
      let w = {
        document: {
          currentScript: new CurrentScript(
            'https://cdn.tinybird.co/static/js/t.js',
            {
              'data-source': 'hey',
              'data-token': 'token'
            }
          ),
          addEventListener: jest.fn(),
          cookie: 'tinybird=98d935c1-63b1-4dcd-aded-e84856c57711:1644413400000' // 2022-02-09 13:30:00
        },
        addEventListener: jest.fn(),
        localStorage: ls,
        location: {
          hostname: 'tinybird.co'
        }
      }
      tracker(w)

      w.tinybird('test', null, true)

      await flushPromises()
      jest.advanceTimersByTime(1000)
      await flushPromises()

      const calls = fetch.mock.calls
      expect(calls[0][0]).toEqual(
        'https://api.tinybird.co/v0/events?name=hey&token=token'
      )
      expect(calls[0][1].body).toBeTruthy()
      expect(JSON.parse(calls[0][1].body)).toEqual(
        expect.objectContaining({
          event: 'test',
          uuid: '',
          session_start: '2022-02-09 13:30:00'
        })
      )
    })

    it('force to send the cookie uuid', async function () {
      const ls = new localstorage()
      let w = {
        document: {
          currentScript: new CurrentScript(
            'https://cdn.tinybird.co/static/js/t.js',
            {
              'data-source': 'hey',
              'data-token': 'token'
            }
          ),
          addEventListener: jest.fn(),
          cookie: 'tinybird=98d935c1-63b1-4dcd-aded-e84856c57711:1644413400000' // 2022-02-09 13:30:00
        },
        addEventListener: jest.fn(),
        localStorage: ls,
        location: {
          hostname: 'tinybird.co'
        }
      }
      tracker(w)

      w.tinybird('test', null, false)

      await flushPromises()
      jest.advanceTimersByTime(1000)
      await flushPromises()

      const calls = fetch.mock.calls
      expect(calls[0][0]).toEqual(
        'https://api.tinybird.co/v0/events?name=hey&token=token'
      )
      expect(calls[0][1].body).toBeTruthy()
      expect(JSON.parse(calls[0][1].body)).toEqual(
        expect.objectContaining({
          event: 'test',
          uuid: '98d935c1-63b1-4dcd-aded-e84856c57711',
          session_start: '2022-02-09 13:30:00'
        })
      )
    })

    it('if more than 30 minutes have elapsed since the last activity, we reset the session start', async () => {
      const ls = new localstorage()
      ls.setItem('tinybird_last_activity', Date.now() - 31 * 60 * 1000)
      let w = {
        document: {
          currentScript: new CurrentScript(
            'https://cdn.tinybird.co/static/js/t.js',
            {
              'data-source': 'hey',
              'data-token': 'token'
            }
          ),
          addEventListener: jest.fn(),
          cookie: 'tinybird=98d935c1-63b1-4dcd-aded-e84856c57711:1644413400000' // 2022-02-09 13:30:00
        },
        addEventListener: jest.fn(),
        localStorage: ls,
        location: {
          hostname: 'tinybird.co'
        }
      }
      tracker(w)

      w.tinybird('test')

      await flushPromises()
      jest.advanceTimersByTime(1000)
      await flushPromises()

      const calls = fetch.mock.calls
      expect(calls[0][0]).toEqual(
        'https://api.tinybird.co/v0/events?name=hey&token=token'
      )
      expect(calls[0][1].body).toBeTruthy()
      const newSessionStart = JSON.parse(calls[0][1].body).session_start
      const newSessionStartUTC = Date.parse(newSessionStart.replace(' ', 'T') + 'Z')
      expect(newSessionStartUTC > 1644413400000).toBe(true)
    })
  })
})
