const { JSDOM } = require('jsdom')
const fs = require('fs')
const Mustache = require('mustache')

function generateSnippet(functionName, token, accountName, dataSourceName, host) {
  const snippet = fs.readFileSync('./src/snippet.js', { encoding: 'utf-8' })
  return Mustache.render(snippet, {
    functionName,
    token,
    accountName,
    dataSourceName,
    host
  })
}

function generateDefaultDOM(functionName, token, accountName, dataSourceName, host) {
  return `
  <html>
    <head>
      <script>
        window.tbt = window.tbt || []
        tbt.push(['pageload', document.referrer, 'test_page_1' ])
      </script>

      <script>
        ${generateSnippet(functionName, token, accountName, dataSourceName, host)}
      </script>
    </head>
    <body>
      <h1>Hello world</h1>

      <button onclick="tbt.push()">
        no event
      </button>
      
      <button onclick="tbt.push(['click', document.referrer, 'whatever'])">
        single event
      </button>

      <button onclick="tbt.push(['click', document.referrer, 'whatever'], ['click', document.referrer, 'whatever 2'])">
        multiple events
      </button>
    </body>
  </html>
  `
}

describe('Tracker in DOM', () => {
  it('should append the tracker script properly', (done) => {
    const { window: { document } } = new JSDOM(
      generateDefaultDOM('tbt', 'aaaaaaaa'), {
        runScripts: 'dangerously'
      }
    )
    const script = document.getElementsByTagName('script')[0]
    expect(script).toBeDefined()
    expect(script.async).toBeTruthy()
    expect(script.src).toBeDefined()
    done()
  })
})