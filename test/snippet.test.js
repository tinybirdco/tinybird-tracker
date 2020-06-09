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
        window.${functionName} = window.${functionName} || []
        ${functionName}.push(['pageload', document.referrer, 'test'])
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

describe('Snippet', () => {
  it('should append the tracker script properly', done => {
    const { window } = new JSDOM(
      generateDefaultDOM('tbt', 'aaaaaaaa'), {
        runScripts: 'dangerously'
      }
    )
    const document = window.document
    const script = document.getElementsByTagName('script')[0]
    expect(window.tbt).toBeDefined()
    expect(window.tbt).toEqual([[ 'pageload', document.referrer, 'test' ]])
    expect(script).toBeDefined()
    expect(script.src).toContain('/dist/tinybird-tracker.js?client=whatever')
    expect(script.async).toBeTruthy()
    expect(script.src).toBeDefined()
    done()
  })

  it('should not include any query parameter not needed', done => {
    const { window: { document } } = new JSDOM(
      generateDefaultDOM('tbt', 'aaaaaaaa'), {
        runScripts: 'dangerously'
      }
    )
    const { src } = document.getElementsByTagName('script')[0]
    const params = new URLSearchParams(src.split('?')[1])
    expect(params.get('client')).toBe('whatever')
    expect(params.get('t')).toBe('aaaaaaaa')
    expect(params.get('a')).toBeNull()
    expect(params.get('f')).toBeNull()
    expect(params.get('h')).toBeNull()
    expect(params.get('d')).toBeNull()
    done()
  })

  it('should allow to use any custom function', done => {
    const { window } = new JSDOM(
      generateDefaultDOM('customTBT', 'b'), {
        runScripts: 'dangerously'
      }
    )
    const document = window.document

    expect(window.tbt).not.toBeDefined()
    expect(window.customTBT).toBeDefined()
    expect(window.customTBT).toEqual([[ 'pageload', document.referrer, 'test' ]])

    const { src } = document.getElementsByTagName('script')[0]
    const params = new URLSearchParams(src.split('?')[1])
    
    expect(params.get('client')).toBe('whatever')
    expect(params.get('t')).toBe('b')
    expect(params.get('a')).toBeNull()
    expect(params.get('f')).toBe('customTBT')
    expect(params.get('h')).toBeNull()
    expect(params.get('d')).toBeNull()
    done()
  })

  it('should allow to use any account name', done => {
    const { window: { document } } = new JSDOM(
      generateDefaultDOM('tbt', 'c', 'chanchun'), {
        runScripts: 'dangerously'
      }
    )

    const { src } = document.getElementsByTagName('script')[0]
    const params = new URLSearchParams(src.split('?')[1])
    
    expect(params.get('client')).toBe('whatever')
    expect(params.get('t')).toBe('c')
    expect(params.get('f')).toBeNull()
    expect(params.get('a')).toBe('chanchun')
    expect(params.get('h')).toBeNull()
    expect(params.get('d')).toBeNull()
    done()
  })

  it('should allow to define the Data Source Name', done => {
    const { window: { document } } = new JSDOM(
      generateDefaultDOM('tbt', 'the_token', 'main', 'track_er'), {
        runScripts: 'dangerously'
      }
    )

    const { src } = document.getElementsByTagName('script')[0]
    const params = new URLSearchParams(src.split('?')[1])
    
    expect(params.get('client')).toBe('whatever')
    expect(params.get('t')).toBe('the_token')
    expect(params.get('f')).toBeNull()
    expect(params.get('a')).toBe('main')
    expect(params.get('h')).toBeNull()
    expect(params.get('d')).toBe('track_er')
    done()
  })

  it('should allow to set the host', done => {
    const { window: { document } } = new JSDOM(
      generateDefaultDOM('tbt', '1111', 'main', 'track_er', 'https://ati.tinybird.co'), {
        runScripts: 'dangerously'
      }
    )

    const { src } = document.getElementsByTagName('script')[0]
    const params = new URLSearchParams(src.split('?')[1])
    
    expect(params.get('client')).toBe('whatever')
    expect(params.get('t')).toBe('1111')
    expect(params.get('f')).toBeNull()
    expect(params.get('a')).toBe('main')
    expect(params.get('h')).toBe('https:&#x2F;&#x2F;ati.tinybird.co')
    expect(params.get('d')).toBe('track_er')
    done()
  })
})