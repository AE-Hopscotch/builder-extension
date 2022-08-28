module.exports = function (isFF) {
  const manifest = {
    name: 'Spider HS',
    description: 'Take the power of Hopscotch Project Builder with you into the Web Explorer!',
    version: '0.1',
    host_permissions: ['<all_urls>'],
    permissions: [
      'activeTab',
      'tabs',
      'scripting',
      'storage'
    ],
    web_accessible_resources: [{
      resources: [
        '/content-scripts/page.css',
        '/content-scripts/page.css.map',
        '/lib/codemirror.min.js',
        '/lib/block-text.js',
        '/images/wrench.svg'
      ],
      matches: ['<all_urls>']
    }],
    background: isFF ? { scripts: ['background.js'] } : { service_worker: 'background.js' },
    content_scripts: [
      {
        matches: ['https://explore.gethopscotch.com/edit/*'],
        js: ['/content-scripts/loader.js'],
        popup: '/popup/index.html',
        all_frames: true
      }
    ],
    icons: {
      16: 'icons/pack-icon-16.png',
      32: 'icons/pack-icon-32.png',
      48: 'icons/pack-icon-48.png'
    },
    minimum_chrome_version: '80.0.3987',
    manifest_version: isFF ? 2 : 3
  }
  if (isFF) {
    manifest.browser_specific_settings = { gecko: { id: '{56354600-651e-6aa2-0c85-f893565de3f9}' } }
  } else {
    // manifest.permissions.push('tabGroups')
  }
  manifest[isFF ? 'browser_action' : 'action'] = {
    default_title: 'Spider HS',
    default_icon: 'icons/pack-icon-64.png'
  }
  return manifest
}
