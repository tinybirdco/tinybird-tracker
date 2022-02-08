import fetch from 'unfetch'

var tracker = function (w) {
  var doc = w.document
  var storage = w.localStorage

  if (!w || !w.document || !w.document.currentScript) {
    return
  }

  var apiUrl =
    (getParameterByName('api') || new URL(doc.currentScript.src).origin) +
    '/v0/events'
  var dataSource = getParameterByName('source')
  var token = getParameterByName('token')
  var cookieDomain = getParameterByName('cookie-domain')

  if (!dataSource)
    throw new Error("'dataSource' name is required to start sending events")
  if (!token) throw new Error("'token' is required to start sending events")

  var COOKIE_NAME = 'tinybird'
  var STORAGE_ITEM = 'tinybird_events'
  var MAX_RETRIES = 5
  var TIMEOUT = 5000

  var userCookie = getCookie(COOKIE_NAME)
  var events = JSON.parse(storage.getItem(STORAGE_ITEM) || '[]')
  var session = dateFormatted()
  var uploading = false

  if (!userCookie) {
    userCookie = uuidv4()
    setCookie(COOKIE_NAME, userCookie)
  }

  function uploadEvents(n) {
    if (uploading) return

    function onError() {
      if (n > 0) {
        // set uploading to false to allow recheck
        uploading = false
        delayUpload(TIMEOUT, n - 1)
      }
    }

    if (events.length > 0) {
      uploading = true

      var url = apiUrl + '?name=' + dataSource + '&token=' + token

      fetch(url, {
        method: 'POST',
        body: rowsToNDJSON(events)
      })
        .then(function (r) {
          return r.json()
        })
        .then(function (res) {
          if (res) {
            events = []
            storage.setItem(STORAGE_ITEM, '[]')
            delayUpload(TIMEOUT, MAX_RETRIES)
          } else {
            onError()
          }
          uploading = false
        })
        .catch(function (e) {
          onError()
        })
    } else {
      delayUpload(TIMEOUT, MAX_RETRIES)
    }
  }

  function delayUpload(t, retries) {
    setTimeout(function () {
      uploadEvents(retries)
    }, t)
  }

  function addEvent(eventName, eventProps) {
    var ev = eventProps || {}
    ev['event'] = eventName || ''
    ev['timestamp'] = dateFormatted()
    ev['session_start'] = session
    ev['uuid'] = userCookie

    events.push(ev)
  }

  function die() {
    storage.setItem(STORAGE_ITEM, JSON.stringify(events))
    uploadEvents()
  }

  w.addEventListener('beforeunload', die)
  w.addEventListener('unload', die, false)

  // Overwritte tinybird function
  var queue = w.tinybird || []
  w.tinybird = addEvent
  for (var i = 0; i < queue.length; i++) {
    addEvent.apply(this, queue[i])
  }

  // Start upload
  delayUpload(TIMEOUT, MAX_RETRIES)

  /**
   * utility methods
   */

  function rowsToNDJSON(events) {
    const stringEvents = events.map(e => JSON.stringify(e))
    return stringEvents.join('\n')
  }

  function dateFormatted(d) {
    d = d || new Date()
    return d.toISOString().replace('T', ' ').split('.')[0]
  }

  function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0
      var v = c == 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  function setCookie(name, value) {
    w.document.cookie =
      name +
      '=' +
      (value || '') +
      '; path=/' +
      '; domain=' +
      (cookieDomain || w.location.hostname)
  }

  function getCookie(name) {
    var nameEQ = name + '='
    var ca = w.document.cookie.split(';')
    for (var i = 0; i < ca.length; ++i) {
      var c = ca[i]
      while (c.charAt(0) === ' ') {
        c = c.substring(1, c.length)
      }
      if (c.indexOf(nameEQ) === 0) {
        return c.substring(nameEQ.length, c.length)
      }
    }
    return null
  }

  function getParameterByName(name) {
    return doc.currentScript.getAttribute('data-' + name)
  }
}

tracker(window)

export default tracker
