const browserContext = typeof browser !== 'undefined' ? 'firefox' : 'chrome'
let api = null
let browserAction
let scripting = 'tabs'
if (typeof browser !== 'undefined') {
  api = browser
  browserAction = 'browserAction'
} else if (typeof chrome !== 'undefined') {
  api = chrome
  browserAction = 'action'
  scripting = 'scripting'
}

console.log(browserContext, api, scripting)

async function updatePopup () {
  const [tab] = await api.tabs.query({ active: true, currentWindow: true })
  if (!tab) return
  const isProject = /^https:\/\/(c|community|explore)\.gethopscotch\.com\/(p|e|projects|edit)\/[\w-]+/.test(tab.url)
  if (isProject) {
    api[browserAction].setIcon({ tabId: tab.id, path: '/icons/pack-icon-64.png' })
    api[browserAction].setPopup({ tabId: tab.id, popup: '/popup/index.html' })
    return
  } else if (tab.url === 'https://explore.gethopscotch.com/create') {
    api[browserAction].setIcon({ tabId: tab.id, path: '/icons/pack-icon-64.png' })
    api[browserAction].setPopup({ tabId: tab.id, popup: '' })
    return
  }
  api[browserAction].setIcon({ tabId: tab.id, path: '/icons/pack-icon-inactive-64.png' })
  api[browserAction].setPopup({ tabId: tab.id, popup: '' })
}

api.tabs.onActivated.addListener(updatePopup)
api.tabs.onUpdated.addListener(updatePopup)

updatePopup()

// Expose for test
if (typeof module !== 'undefined') module.exports = {}
