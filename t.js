const TRACKER_COLUMNS = 14
const cookieName = '_track'
const localStorage = window.localStorage
const storageItem = 'tinybird_events'
const datasourceName = 'tracker'
const MAX_RETRIES = 5
const TIMEOUT = 2000

/**
 * install a tracker for the user
 */
function tracker(token, accountName, globalFunctionName, host) {
  globalFunctionName = globalFunctionName || 'tracker_ga'
  let userCookie = getCookie(cookieName)

  if (!userCookie) {
    userCookie = uuidv4()
    setCookie(cookieName, userCookie)
  }

  const session = dateFormatted()
  let events = JSON.parse(localStorage.getItem(storageItem) || '[]')

  var uploading = false
  function uploadEvents(n) {
    if (uploading) return

    if (events.length > 0) {
      uploading = true
      tinybird(token, host)
        .datasource(datasourceName)
        .append(events)
        .then(res => {
          if (res && !res.error) {
            events = []
            window.localStorage.setItem(storageItem, '[]')
            delayUpload(TIMEOUT, MAX_RETRIES)
          } else {
            if (n > 0) {
              // set uploading to false to allow recheck
              uploading = false
              delayUpload(TIMEOUT, n - 1)
            }
          }
          uploading = false
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
    let ev = [dateFormatted(), session, accountName, userCookie, document.location.href, navigator.userAgent].concat(Array.prototype.slice.call(arguments))
    if (ev.length < TRACKER_COLUMNS) {
      ev = ev.concat(Array(TRACKER_COLUMNS - ev.length).fill(''))
    }
    events.push(ev)

    // when the event is pageload send it right awat, do not wait to the flush
    if(arguments[0] === 'pageload') {
      uploadEvents();
    }
  }

  function die() {
    localStorage.setItem(storageItem, JSON.stringify(events))
    uploadEvents()
  }

  window.addEventListener('beforeunload', die)
  window.addEventListener('unload', die, false)
}

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
    const r = Math.random() * 16 | 0
    const v = c == 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

function getCookie(name) {
  const nameEQ = name + "="
  const ca = document.cookie.split(';')
  for (let i = 0; i < ca.length; ++i) {
    let c = ca[i]
    while (c.charAt(0) === ' ') {
      c = c.substring(1, c.length)
    }
    if (c.indexOf(nameEQ) === 0) {
      return c.substring(nameEQ.length, c.length)
    }
  }
  return null
}