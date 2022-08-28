const fs = require('fs')

function build () {
  delete require.cache[require.resolve('./manifest')]

  const chromeManifest = require('./manifest')(false)
  const ffManifest = require('./manifest')(true)

  fs.writeFileSync('./build/chrome/manifest.json', JSON.stringify(chromeManifest))
  fs.writeFileSync('./build/firefox/manifest.json', JSON.stringify(ffManifest))
}
build()

console.log('\x1b[32mBuild successful\x1b[0m')
