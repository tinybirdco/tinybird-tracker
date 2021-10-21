const fs = require('fs')
const { JSDOM } = require('jsdom')
const jsdom = new JSDOM('')

global.flushPromises = () => new Promise(jest.requireActual('timers').setImmediate)
global.FormData = jsdom.window.FormData
