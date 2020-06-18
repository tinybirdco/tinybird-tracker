import fetch from 'unfetch'

var tracker = (function (w) {
  if (!w || !w.document.currentScript) {
    return
  }

  var TRACKER_COLUMNS = 14
  var COOKIE_NAME = '_track'
  var LOCAL_STORAGE = w.localStorage
  var STORAGE_ITEM = 'tinybird_events'
  var DATASOURCE_NAME = 'tracker'
  var ACCOUNT_NAME = 'main'
  var MAX_RETRIES = 5
  var TIMEOUT = 2000
  var DEFAULT_FUNCTION_NAME = 'tbt'
  var HOST = 'https://api.tinybird.co'

  var token
  var accountName
  var datasourceName
  var functionName
  var host
  
  var userCookie = getCookie(COOKIE_NAME)
  var events = JSON.parse(LOCAL_STORAGE.getItem(STORAGE_ITEM) || '[]')
  var session = dateFormatted()
  var uploading = false

  if (!userCookie) {
    userCookie = uuidv4()
    setCookie(COOKIE_NAME, userCookie)
  }
  
  function init() {
    if (!getParameterByName('t')) {
      throw new Error('token is needed for sending events') 
    }

    token = decodeURIComponent(getParameterByName('t'))
    accountName = getParameterByName('a') || ACCOUNT_NAME
    functionName = getParameterByName('f') || DEFAULT_FUNCTION_NAME
    datasourceName = getParameterByName('d') || DATASOURCE_NAME
    host = getParameterByName('h') && decodeURIComponent(getParameterByName('h')) || HOST
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
      
      var url = host +
        '/v0/datasources?mode=append&name=' + datasourceName +
        '&token=' + token  +
        '&dialect_delimiter=' + encodeURIComponent(',')
      var formData = new FormData()
      formData.append('csv', rowsToCSV(events))

      fetch(url, {
        method: 'POST',
        body: formData
      })
      .then(function (r) {
        return r.json()
      })
      .then(function (res) {
        if (res) {
          events = []
          LOCAL_STORAGE.setItem(STORAGE_ITEM, '[]')
          delayUpload(TIMEOUT, MAX_RETRIES)
        } else {
          onError()
        }
        uploading = false
      })
      .catch(function () {
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

  function flush() {
    uploadEvents()
  }

  function addEvent() {
    var argsArray = Array.prototype.slice.call(arguments)[0]
    var ev = [
      dateFormatted(),
      session,
      accountName,
      userCookie,
      document.location.href,
      navigator.userAgent
    ].concat(argsArray)
    if (ev.length < TRACKER_COLUMNS) {
      ev = ev.concat(Array(TRACKER_COLUMNS - ev.length).fill(''))
    }
    events.push(ev)

    // If the event is pageload, don't wait to the flush
    if(argsArray[0] === 'pageload') {
      uploadEvents(MAX_RETRIES)
    }
  }

  function parseItems(items) {
    function parseItem(item) {
      if (!Array.isArray(item)) {
        throw new Error('Only array events are allowed')
      }
      addEvent(item)
    }

    if (!items) {
      return
    }

    if (!Array.isArray(items)) {
      throw new Error('Events can only be sent as an array')
    }

    for (var i = 0, l = items.length; i < l; i++) {
      parseItem(Array.prototype.slice.call(items[i]))
    }
  }

  function die() {
    LOCAL_STORAGE.setItem(STORAGE_ITEM, JSON.stringify(events))
    uploadEvents()
  }

  w.addEventListener('beforeunload', die)
  w.addEventListener('unload', die, false)

  // Initialize tracker
  init()

  // Parse first what tbt contains
  parseItems(w[functionName])

  // Overwritte tbt.push function
  w[functionName] = {
    push: function (item) {
      var items
      if (arguments.length > 1) {
        items = Array.prototype.slice.call(arguments)
      } else {
        items = [item]
      }

      parseItems(items)
    }
  } 

  // Start upload
  delayUpload(TIMEOUT, MAX_RETRIES)
  
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

  function rowsToCSV(rows) {
    var escapeQuotes = function (str) {
      return str.replace(/\"/g, '""')
    }

    return rows.map(function (r) {
      return r.map(function (field) {
        if (typeof(field) === 'string') {
          field = escapeQuotes(field)
          if (field[0] !== '"' || field[field.length - 1] !== '"') {
            field = '"' + field  + '"'
          }
          return field
        }
        return field
      }).join(',')
    }).join('\n')
  }

  function getParameterByName(name, url) {
    if (!url) url = w.document.currentScript.src || '';
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  }
})

tracker(window)

export default tracker