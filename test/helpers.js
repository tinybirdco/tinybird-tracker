const fs = require('fs')

global.flushPromises = () => new Promise(setImmediate)
