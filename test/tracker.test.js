import fetch from 'unfetch'
jest.mock('unfetch', () => jest.fn())
import tracker from '../src/tracker'

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
      },
    }
  }

  beforeEach(() => {
    fetch.mockImplementation(() => {
      return Promise.resolve()
    })
  })

  afterEach(() => {
    fetch.mockClear()
  })

  describe('initialization', () => {
    it('should init properly', () => {
      let w = {
        document: {
          currentScript: {
            src: 'https://cdn.tinybird.co/static/js/t.js?t=ouch'
          }
        },
        addEventListener: jest.fn(),
        localStorage: new localstorage()
      }
      tracker(w)
  
      expect(w.tbt).toBeDefined()
      expect(w.tbt.push).toEqual(jasmine.any(Function))
    })

    it('should not initialize without a token', () => {
      let w = {
        document: {
          currentScript: {
            src: 'https://cdn.tinybird.co/static/js/t.js'
          }
        },
        addEventListener: jest.fn(),
        localStorage: new localstorage()
      }
      expect(() => {
        tracker(w)
      }).toThrow('token is needed for sending events')
    })

    it('should initialize with a different function', () => {
      let w = {
        document: {
          currentScript: {
            src: 'https://cdn.tinybird.co/static/js/t.js?t=the_token&f=guacho'
          }
        },
        addEventListener: jest.fn(),
        localStorage: new localstorage()
      }
      tracker(w)

      expect(w.tbt).not.toBeDefined()
      expect(w.guacho).toBeDefined()
      expect(w.guacho.push).toEqual(jasmine.any(Function))
    })
  })

  it('should parse those events already included', () => {
    let w = {
      document: {
        currentScript: {
          src: 'https://cdn.tinybird.co/static/js/t.js?t=the_token'
        }
      },
      addEventListener: jest.fn(),
      localStorage: new localstorage()
    }

    w.tbt = [['pageload', 'https://tinybird.co', 'landing']]

    fetch.mockImplementation((url,formData) => {
      const csv = formData.body.get('csv')
      const parts = csv.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
      expect(parts.length).toBe(14)

      expect(parts[6]).toBe('\"pageload\"')
      expect(parts[7]).toBe('\"https://tinybird.co\"')
      expect(parts[8]).toBe('\"landing\"')
      return Promise.resolve()
    })

    tracker(w)

    expect(fetch).toHaveBeenCalledWith(
      'https://api.tinybird.co/v0/datasources?mode=append&name=tracker&token=the_token',
      {
        body: jasmine.any(FormData),
        method: 'POST'
      }
    )
  })

  it('should send a new event after 2secs', async () => {
    jest.useFakeTimers()

    let a = {
      document: {
        currentScript: {
          src: 'https://cdn.tinybird.co/static/js/t.js?t=the_token'
        }
      },
      addEventListener: jest.fn(),
      localStorage: new localstorage()
    }

    fetch.mockImplementation((url,formData) => {
      const csv = formData.body.get('csv')
      const parts = csv.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
      expect(parts.length).toBe(14)

      expect(parts[6]).toBe('\"click\"')
      expect(parts[7]).toBe('\"https://blog.tinybird.co\"')
      expect(parts[8]).toBe('\"sign up\"')
      expect(parts[9]).toBe('\"whatever@hey.com\"')
      return Promise.resolve({})
    })

    tracker(a)

    expect(fetch).not.toHaveBeenCalled()

    a.tbt.push(['click', 'https://blog.tinybird.co', 'sign up', 'whatever@hey.com'])

    expect(fetch).not.toHaveBeenCalled()

    jest.advanceTimersByTime(2000)
    await flushPromises()

    expect(fetch).toHaveBeenCalled()

    jest.clearAllTimers()
  })

  it('should allow to send several events at the same time', async () => {
    jest.useFakeTimers()

    let w = {
      document: {
        currentScript: {
          src: 'https://cdn.tinybird.co/static/js/t.js?t=the_token'
        }
      },
      addEventListener: jest.fn(),
      localStorage: new localstorage()
    }

    fetch.mockImplementation((url,formData) => {
      const csv = formData.body.get('csv')
      const rows = csv.split(/\n/)
      expect(rows.length).toBe(2)
      
      const firstRowParts = rows[0].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
      expect(firstRowParts.length).toBe(14)
      expect(firstRowParts[6]).toBe('\"hover\"')
      expect(firstRowParts[7]).toBe('\"https://docs.tinybird.co\"')
      expect(firstRowParts[8]).toBe('\"section 1\"')

      const sndRowParts = rows[1].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
      expect(sndRowParts.length).toBe(14)
      expect(sndRowParts[6]).toBe('\"hover\"')
      expect(sndRowParts[7]).toBe('\"https://docs.tinybird.co\"')
      expect(sndRowParts[8]).toBe('\"section 2\"')

      return Promise.resolve({})
    })

    tracker(w)

    w.tbt.push(
      ['hover', 'https://docs.tinybird.co', 'section 1'],
      ['hover', 'https://docs.tinybird.co', 'section 2']
    )

    jest.runOnlyPendingTimers()
    await flushPromises()

    expect(fetch).toHaveBeenCalled()

    jest.clearAllTimers()
  })

  it('should send pending localStorage events after 2sec', async () => {
    jest.useFakeTimers()

    const ls = new localstorage()
    ls.setItem(
      'tinybird_events',
      '[["2020-06-09 15:47:52","2020-06-09 15:47:52","main","37b60067-9209-40de-8b59-09459981446b","http://localhost/","Mozilla/5.0 (darwin) AppleWebKit/537.36 (KHTML, like Gecko) jsdom/16.2.2","click","https://ui.tinybird.co","sign up","hello@hey.com","","","",""]]'
    )

    let w = {
      document: {
        currentScript: {
          src: 'https://cdn.tinybird.co/static/js/t.js?t=the_token'
        }
      },
      addEventListener: jest.fn(),
      localStorage: ls
    }

    fetch.mockImplementation((url,formData) => {
      const csv = formData.body.get('csv')
      const parts = csv.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
      expect(parts.length).toBe(14)

      expect(parts[6]).toBe('\"click\"')
      expect(parts[7]).toBe('\"https://ui.tinybird.co\"')
      expect(parts[8]).toBe('\"sign up\"')
      expect(parts[9]).toBe('\"hello@hey.com\"')
      return Promise.resolve({})
    })

    tracker(w)

    expect(fetch).not.toHaveBeenCalled()

    jest.advanceTimersByTime(2000)
    await flushPromises()

    expect(fetch).toHaveBeenCalled()

    jest.clearAllTimers()
  })

  it('should retry 6 times more if the first fetch fails', async () => {
    jest.useFakeTimers()
    const ls = new localstorage()

    let w = {
      document: {
        currentScript: {
          src: 'https://cdn.tinybird.co/static/js/t.js?t=the_token'
        }
      },
      addEventListener: jest.fn(),
      localStorage: ls
    }

    w.tbt = [['pageload', 'https://tinybird.co', 'landing']]

    fetch.mockImplementation((url,formData) => {
      return Promise.resolve({})
    })

    tracker(w)
    await flushPromises()

    jest.advanceTimersByTime(2000)
    await flushPromises()

    jest.advanceTimersByTime(2000)
    await flushPromises()

    jest.advanceTimersByTime(2000)
    await flushPromises()

    jest.advanceTimersByTime(2000)
    await flushPromises()

    jest.advanceTimersByTime(2000)
    await flushPromises()

    expect(fetch.mock.calls.length).toBe(6)

    jest.advanceTimersByTime(2000)
    await flushPromises()

    expect(fetch.mock.calls.length).toBe(7)

    jest.advanceTimersByTime(2000)
    await flushPromises()

    expect(fetch.mock.calls.length).toBe(7)

    jest.clearAllTimers()
  })
})