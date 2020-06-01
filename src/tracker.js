import fetch from 'unfetch'

var TRACKER_COLUMNS = 14
var COOKIE_NAME = '_track'
var LOCAL_STORAGE = window.localStorage
var STORAGE_ITEM = 'tinybird_events'
var DATASOURCE_NAME = 'tracker'
var MAX_RETRIES = 5
var TIMEOUT = 2000

/**
 * install a tracker for the user
 */
function tracker(token, accountName, globalFunctionName, host) {
  globalFunctionName = globalFunctionName || 'tracker_ga'
  var userCookie = getCookie(COOKIE_NAME)
  var events = JSON.parse(LOCAL_STORAGE.getItem(STORAGE_ITEM) || '[]')
  var session = dateFormatted()
  var uploading = false

  if (!userCookie) {
    userCookie = uuidv4()
    setCookie(COOKIE_NAME, userCookie)
  }

  function uploadEvents(n) {
    if (uploading) return

    function onError () {
      if (n > 0) {
        // set uploading to false to allow recheck
        uploading = false
        delayUpload(TIMEOUT, n - 1)
      }
    }

    if (events.length > 0) {
      uploading = true
      var formData = new FormData()
      formData.append('csv', events)

      fetch(`${host || 'https://api.tinybird.co'}/v0/datasources?mode=append&name=${DATASOURCE_NAME}&token=${token}`, {
        method: 'POST',
        body: formData
      })
      .then(function (r) {
        return r.json()
      })
      .then(function (res) {
        if (res && !res.error) {
          events = []
          LOCAL_STORAGE.setItem(STORAGE_ITEM, '[]')
          delayUpload(TIMEOUT, MAX_RETRIES)
        } else {
          onError()
        }
        uploading = false
      })
      .catch(err => {
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

  delayUpload(TIMEOUT, MAX_RETRIES)

  tracker.flush = uploadEvents

  window[globalFunctionName] = function () {
    var ev = [dateFormatted(), session, accountName, userCookie, document.location.href, navigator.userAgent].concat(Array.prototype.slice.call(arguments))
    if (ev.length < TRACKER_COLUMNS) {
      ev = ev.concat(Array(TRACKER_COLUMNS - ev.length).fill(''))
    }
    events.push(ev)

    // If the event is pageload, don't wait to the flush
    if(arguments[0] === 'pageload') {
      uploadEvents()
    }
  }

  function die() {
    LOCAL_STORAGE.setItem(STORAGE_ITEM, JSON.stringify(events))
    uploadEvents()
  }

  window.addEventListener('beforeunload', die)
  window.addEventListener('unload', die, false)
}

window['tracker'] = tracker

/**
 * utility methods
 */

function dateFormatted(d) {
  d = d || new Date()
  return d.toISOString().replace('T', ' ').split('.')[0]
}

function setCookie(name, value) {
  document.cookie = name + "=" + (value || "") + "; path=/"
}

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0
    var v = c == 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

function getCookie(name) {
  var nameEQ = name + "="
  var ca = document.cookie.split(';')
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

export default tracker