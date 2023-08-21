module.exports = function (isFF) {
  const manifest = {
    name: 'Spider HS',
    description: 'Take the power of Hopscotch Project Builder with you into the Web Explorer!',
    version: '0.1',
    host_permissions: [
      'https://c.gethopscotch.com/p/*',
      'https://explore.gethopscotch.com/edit/*',
      'https://explore.gethopscotch.com/create'
    ],
    permissions: [
      'scripting',
      'storage'
    ],
    web_accessible_resources: [{
      resources: [
        '/content-scripts/page.css',
        '/content-scripts/page.css.map',
        '/content-scripts/codemirror.css',
        '/lib/codemirror.min.js',
        '/lib/jszip.min.js',
        '/lib/jscolor.js',
        '/lib/block-text.js',
        '/content-scripts/traits.js',
        '/content-scripts/enhancements.js',
        '/content-scripts/presets.js',
        '/content-scripts/libraries.js',
        '/content-scripts/search.js',
        '/content-scripts/quicktype.js',
        '/images/sliders.svg',
        '/images/wand.svg',
        '/images/templates.svg',
        '/images/books.svg',
        '/images/gear.svg',
        '/images/search-list.svg',
        '/images/wrench.svg'
      ],
      matches: ['https://explore.gethopscotch.com/*']
    }],
    background: isFF ? { scripts: ['background.js'] } : { service_worker: 'background.js' },
    content_scripts: [
      {
        matches: ['https://explore.gethopscotch.com/edit/*', 'https://explore.gethopscotch.com/create'],
        js: ['/content-scripts/loader.js'],
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
    manifest.permissions.push(...manifest.host_permissions)
    delete manifest.host_permissions
    manifest.web_accessible_resources = manifest.web_accessible_resources.flatMap(r => r.resources)
  } else {
    // manifest.permissions.push('tabGroups')
  }
  manifest[isFF ? 'browser_action' : 'action'] = {
    default_title: 'Spider HS',
    default_icon: 'icons/pack-icon-64.png'
  }
  return manifest
}
