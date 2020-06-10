  
const fs = require('fs')
const Mustache = require('mustache')
const path = require('path')
const markdownMagic = require('markdown-magic')

const config = {
  transforms: {
    customTransform(content, options) {
      const snippetContent = fs.readFileSync('./src/snippet.js', 'utf8')
      return `\`\`\`html
<script>
  ${Mustache.render(snippetContent, {
    functionName: options.functionName,
    token: options.token,
    accountName: options.accountName,
    src: options.src,
    dataSourceName: options.dataSourceName,
    host: options.host
  })}
</script>
\`\`\``
    }
  }
}

/* This example callback automatically updates Readme.md and commits the changes */
const callback = function autoGitCommit(err, output) {
  // output is array of file information
  output.forEach(function(data) {
    const mdPath = data.outputFilePath
    if(!mdPath) return false
  })
}

const markdownPath = path.join(__dirname, '..', 'README.md')
markdownMagic(markdownPath, config, callback)