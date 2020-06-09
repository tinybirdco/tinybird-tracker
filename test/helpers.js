const fs = require('fs')
const Mustache = require('mustache')

global.generateSnippet = (functionName, token, accountName, dataSourceName, host) => {
  const snippet = fs.readFileSync('./src/snippet.js', { encoding: 'utf-8' })
  return Mustache.render(snippet, {
    functionName,
    token,
    accountName,
    dataSourceName,
    host
  })
}

global.flushPromises = () => new Promise(setImmediate)