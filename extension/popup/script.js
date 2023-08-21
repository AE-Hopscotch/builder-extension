// Copy Text
function copyText (txt) {
  // Create a textbox field where we can insert text to.
  const copyTextArea = document.createElement('textarea')
  copyTextArea.value = txt
  document.body.appendChild(copyTextArea)
  copyTextArea.select()
  copyTextArea.setSelectionRange(0, 9999999) // Mobile
  document.execCommand('copy')
  document.body.removeChild(copyTextArea)
}

chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
  const uuid = tabs[0].url.replace(/.*\//, '')
  fetch('https://corsproxy.io/?url=https://community.gethopscotch.com/api/v1/projects/' + uuid)
    .then(x => x.json()).then(p => {
      const r = Math.round(JSON.stringify(p).length / 10) / 100
      const resultText = 'Hopscotch Web Explorer Info, v1.0.0r1' +
        '\nTitle: ' + p.title +
        `\nMade by: ${(p.user) ? p.user.nickname : p.author}\u202D (user id: ${(p.user != null) ? p.user.id : 'unknown'}) ` +
        // eslint-disable-next-line eqeqeq
        ((p.original_user != null && p.original_user.id != p.user.id) ? `\nRemixed from:  ${p.original_user.nickname}\u202D (user id: ${p.original_user.id}) ` : '') +
        '\nProject UUID: ' + p.uuid +
        '\nFile ID: ' + (p.filename || '').replace(/\.hopscotch/, '') + ' (' + ((r < 1000) ? r + 'KB)' : Math.round(r / 10) / 100 + 'MB)') +
        '\n&#x2764; ' + p.number_of_stars + '  &#x25B6; ' + p.play_count +
        ' | Remixes: ' + p.project_remixes_count + ', Published: ' + p.published_remixes_count +
        '\nPublish Time: ' + (p.correct_published_at || 'null').replace('T', ' at ').replace('Z', ' GMT') +
        '\nVersion: Editor ' + p.version + ', Player ' + (p.playerVersion || '1.0.0') + ' (' + Object.keys(p.playerUpgrades || {}).length + ' upgrades)' +
        '\nNumber of Scenes: ' + (p.scenes || '_').length + ', Number of Objects: ' + p.objects.length +
        '\nNumber of Rules: ' + (p.rules || '').length + ', Number of Abilities: ' + (p.abilities || '').length +
        '\nNumber of Variables: ' + (p.variables || '').length + ', Custom Images: ' + (p.customObjects || '').length +
        '\nObject Scale: ' + (p.baseObjectScale || 1) + ', Font Size: ' + (p.fontSize || 80) +
        '\nStage Size: ' + (p.stageSize || { width: 1024 }).width + 'x' + (p.stageSize || { height: 768 }).height
      document.getElementById('content').innerHTML = '<pre>' + resultText + `</pre>
        <div class="flex"><button id="copy">Copy Information</button> <button id="play">Play in Modded Player</button></div>`
      document.getElementById('copy').addEventListener('click', function () {
        copyText(document.querySelector('pre').innerHTML)
      })
      document.getElementById('play').addEventListener('click', function () {
        chrome.tabs.update({
          url: 'https://ae-hopscotch.github.io/hs-tools/play-project/?id=' + uuid
        })
      })
    })
})
