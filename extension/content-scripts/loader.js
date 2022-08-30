/* eslint-disable no-undef */
let api = null
if (typeof browser !== 'undefined') {
  api = browser
} else if (typeof chrome !== 'undefined') {
  api = chrome
}

const sections = [
  { id: 'traits-editor', title: 'Project Traits', tab: 'modding' },
  { id: 'project-enhancements', title: 'Enhancements', tab: 'modding' },
  { id: 'code-management', title: 'Code Management', tab: 'modding' },
  { id: 'imported-libraries', title: 'Libraries', tab: 'modding' }
]

function generateSectionHTML (section) {
  return `<div class="keyboard-section" data-tab="${section.tab}">
    <div class="keyboard-header">
      <b class="title">${section.title}</b>
      <button class="openbtn"><i class="hs-icon open"></i></button>
    </div>
    <div id="_AE_${section.id}" class="keyboard-blocks-container" data-blocklist="[]"></div>
  </div>`
}

function createToolbar () {
  const operatorsKeyboard = document.querySelector('.operators-keyboard')
  if (!operatorsKeyboard) return // View only
  // Button container
  const btnContainer = document.createElement('div')
  btnContainer.classList.add('_AE-left-btn-container')
  // Wrench button
  const wrenchBtn = document.createElement('button')
  wrenchBtn.classList.add('ui-button')
  // Wrench Image
  const wrenchImg = document.createElement('img')
  wrenchImg.src = api.runtime.getURL('/images/wrench.svg')
  // Content tree
  wrenchBtn.appendChild(wrenchImg)
  btnContainer.appendChild(wrenchBtn)
  // Appending to body
  const editorControls = document.getElementById('editor-controls-container')
  document.body.insertBefore(btnContainer, editorControls)
  // Keyboard
  const modKeyboard = document.createElement('div')
  modKeyboard.classList.add('operators-keyboard', '_AE-hs-tools-keyboard')
  modKeyboard.innerHTML = `<div class="keyboard-category-selector">
    <select id="_ae-kb-option-selector">
      <option value="modding">Modding Tools</option>
      <option value="search">Project Search</option>
    </select>
    <input type="checkbox" class="kb-hide" name="_ae-kb-category" id="ae-modding-tab" value="modding" hidden="">
    <input type="checkbox" class="kb-hide" name="_ae-kb-category" id="ae-search-tab" value="search" hidden="">
    <label for="ae-modding-tab">
      <div class="category-label" data-tab="modding" data-blockset>
        <p class="icon">🛠</p>
        <span>Modding Tools</span>
      </div>
    </label>
    <label for="ae-search-tab">
      <div class="category-label kb-hide" data-tab="search" data-blockset>
        <p class="icon"><i class="hs-icon hs-search"></i></p>
        <span>Project Search</span>
      </div>
    </label>
  </div><div class="keyboard-blocks-wrapper">${
    sections.map(s => generateSectionHTML(s)).join('')
  }</div>`
  document.body.insertBefore(modKeyboard, operatorsKeyboard)
  // Listeners
  wrenchBtn.addEventListener('click', () => {
    modKeyboard.classList.toggle('open')
  })
  modKeyboard.querySelector('.keyboard-category-selector').addEventListener('input', e => {
    document.getElementById('_ae-kb-option-selector').value = e.target.value
    modKeyboard.querySelectorAll('.category-label, .keyboard-section').forEach(label => {
      label.classList.toggle('kb-hide', label.dataset.tab !== e.target.value)
    })
  })
}
createToolbar()

function injectScript (list) {
  list.forEach(filename => {
    const src = api.runtime.getURL(filename)
    const script = document.createElement('script')
    script.src = src
    document.body.appendChild(script)
  })
}
function injectStyle (list) {
  list.forEach(filename => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = api.runtime.getURL(filename)
    document.head.appendChild(link)
  })
}
window.addEventListener('load', () => {
  if (document.querySelector('.viewonly-message')) return
  injectScript([
    '/lib/codemirror.min.js',
    '/lib/block-text.js',
    '/content-scripts/traits.js',
    '/content-scripts/enhancements.js',
    '/content-scripts/presets.js'
  ])
  injectStyle([
    '/content-scripts/codemirror.css',
    '/content-scripts/page.css'
  ])
})
