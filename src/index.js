import fetch from 'unfetch'

var tracker = function (w) {
  var doc = w.document
  var storage = w.localStorage

  if (!w || !w.document || !w.document.currentScript) {
    return
  }

  var apiUrl =
    (getParameterByName('api') || 'https://api.tinybird.co') + '/v0/events'
  var dataSource = getParameterByName('source')
  var token = getParameterByName('token')
  var cookieDomain = getParameterByName('cookie-domain') || w.location.hostname
  var functionName = getParameterByName('function') || 'tinybird'

  if (!dataSource) {
    throw new Error("'dataSource' name is required to start sending events")
  }
  if (!token) {
    throw new Error("'token' is required to start sending events")
  }

  var COOKIE_NAME = 'tinybird'
  var STORAGE_ITEM = 'tinybird_events'
  var STORAGE_LAST_TIMESTAMP = 'tinybird_last_activity'
  var MAX_RETRIES = 5
  var TIMEOUT = 1000
  var REFRESH_SESSION = 30 * 60 * 1000

  var userCookie = getCookie(COOKIE_NAME)
  var events = JSON.parse(storage.getItem(STORAGE_ITEM) || '[]')
  var uuid = uuidv4()
  var sessionStart = getUTCNow()
  var uploading = false

  if (!userCookie) {
    setCookie(COOKIE_NAME, formatCookieValue(uuid, sessionStart))
  } else {
    var cookieValue = parseCookieValue(getCookie(COOKIE_NAME))
    if (cookieValue) {
      uuid = cookieValue.id
      sessionStart = cookieValue.sessionStart
    } else {
      // Old cookie format - Let's reset it with a new value
      setCookie(COOKIE_NAME, formatCookieValue(uuid, sessionStart))
    }
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
          var status = r ? r.status : 0
          if (status === 200 || status === 202) {
            clearEvents()
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

  function saveLastActivityTimestamp() {
    storage.setItem(STORAGE_LAST_TIMESTAMP, JSON.stringify(getUTCNow()))
  }

  function addEvent(eventName, eventProps) {
    var timestamp = getUTCNow()
    var ev = eventProps || {}
    ev['event'] = eventName || ''
    ev['timestamp'] = utcToFormattedDate(timestamp)
    ev['session_start'] = utcToFormattedDate(sessionStart)
    ev['uuid'] = uuid
    events.push(ev)

    saveLastActivityTimestamp()
  }

  function die() {
    storage.setItem(STORAGE_ITEM, JSON.stringify(events))
    uploadEvents()
  }

  function refreshSessionStart() {
    var now = getUTCNow()
    var lastActivityTimestamp = storage.getItem(STORAGE_LAST_TIMESTAMP)
    if (lastActivityTimestamp !== null) {
      var elapsed = now - parseInt(lastActivityTimestamp, 10)
      if (elapsed > REFRESH_SESSION) {
        sessionStart = now
        setCookie(COOKIE_NAME, formatCookieValue(uuid, sessionStart))
        saveLastActivityTimestamp()
      }
    }
  }

  var hidden, visibilityChange
  if (typeof doc.hidden !== 'undefined') {
    // Opera 12.10 and Firefox 18 and later support
    hidden = 'hidden'
    visibilityChange = 'visibilitychange'
  } else if (typeof doc.msHidden !== 'undefined') {
    hidden = 'msHidden'
    visibilityChange = 'msvisibilitychange'
  } else if (typeof doc.webkitHidden !== 'undefined') {
    hidden = 'webkitHidden'
    visibilityChange = 'webkitvisibilitychange'
  }

  function handleVisibilityChange() {
    if (!doc[hidden]) {
      refreshSessionStart()
    }
  }

  w.addEventListener('beforeunload', die)
  w.addEventListener('unload', die, false)
  doc.addEventListener(visibilityChange, handleVisibilityChange, false)

  refreshSessionStart()

  // Overwritte main function
  var queue = w[functionName] || []
  w[functionName] = addEvent
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

  function utcToFormattedDate(utcDate) {
    var date = new Date(utcDate)
    return date.toISOString().replace('T', ' ').split('.')[0]
  }

  function getUTCNow() {
    var date = new Date()
    var utcNow = Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds()
    )

    return utcNow
  }

  function formatCookieValue(id, sessionStart) {
    return id + ':' + sessionStart
  }

  function parseCookieValue(cookieValue) {
    if (cookieValue) {
      var slices = cookieValue.split(':')
      if (slices.length === 2) {
        return {
          id: slices[0],
          sessionStart: parseInt(slices[1], 10)
        }
      }
    }
    return null
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
      name + '=' + (value || '') + '; path=/' + '; domain=' + cookieDomain
  }

  function getCookie(name) {
    var nameEQ = name + '='
    if (w.document.cookie) {
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
    }
    return null
  }

  function getParameterByName(name) {
    return doc.currentScript.getAttribute('data-' + name)
  }

  function clearEvents() {
    events = []
    storage.setItem(STORAGE_ITEM, JSON.stringify([]))
  }
}

tracker(window)

export default tracker
