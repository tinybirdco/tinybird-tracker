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

  fetch.mockImplementation(() => {
    return Promise.resolve()
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
})