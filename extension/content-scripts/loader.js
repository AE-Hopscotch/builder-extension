/* eslint-disable no-undef */
let api = null
if (typeof browser !== 'undefined') {
  api = browser
} else if (typeof chrome !== 'undefined') {
  api = chrome
}

const sections = [
  { id: 'traits-editor', title: 'Project Traits', tab: 'modding', icon: 'sliders', short: 'Properties' },
  { id: 'project-enhancements', title: 'Enhancements', tab: 'modding', icon: 'wand', short: 'Features' },
  { id: 'code-management', title: 'Code Management', tab: 'modding', icon: 'templates', tabName: 'Aggregation' },
  { id: 'imported-libraries', title: 'Libraries', tab: 'modding', icon: 'books' }
]

function generateTabIconHTML (section) {
  const longTitle = section.tabName || section.title
  const shortTitle = section.short || longTitle
  return `<div class="category-label" data-tab="${section.tab}" data-name="${section.title}">
    <img src="${api.runtime.getURL('/images/' + section.icon)}.svg" alt="${section.icon}">
    <span class="medium-screen">${longTitle}</span>
    <span class="small-screen">${shortTitle}</span>
  </div>`
}

function generateSectionHTML (section) {
  return `<div class="keyboard-section" data-tab="${section.tab}">
    <div class="keyboard-header">
      <b class="title">${section.title}</b>
      <button class="openbtn"><i class="hs-icon open"></i></button>
    </div>
    <div id="_AE_${section.id}" class="keyboard-blocks-container" data-blocklist="[]"></div>
  </div>`
}

function highlightFocused (keyboard) {
  const visibleTitles = keyboard.querySelectorAll('.keyboard-section:not(.kb-hide) .title')
  const elementData = [...visibleTitles].map(title => {
    return { title, position: title.getBoundingClientRect().x }
  })
  const scrolledPast = elementData.filter(el => el.position < 60)
  const lastScrolledPast = scrolledPast.reverse()[0] || elementData[0]

  // If there's nothing to highlight
  if (!lastScrolledPast) return

  // Get Keyboard button from last scrolled title element
  const titleGroup = lastScrolledPast.title.parentNode.parentNode.dataset.tab
  const visibleButtonsQuery = `.category-label[data-tab="${titleGroup}"]`
  const buttonList = [...keyboard.querySelectorAll(visibleButtonsQuery)]
  buttonList.forEach(btn => {
    const isMatch = btn.dataset.name === lastScrolledPast.title.textContent
    btn.classList.toggle('kb-selected', isMatch)
  })
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
    ${sections.map(s => generateTabIconHTML(s)).join('')}
  </div><div class="keyboard-blocks-wrapper">${
    sections.map(s => generateSectionHTML(s)).join('')
  }</div>`
  document.body.insertBefore(modKeyboard, operatorsKeyboard)
  // Listeners
  wrenchBtn.addEventListener('click', () => {
    modKeyboard.classList.toggle('open')
  })
  // Section change listener
  modKeyboard.querySelector('.keyboard-category-selector').addEventListener('input', e => {
    document.getElementById('_ae-kb-option-selector').value = e.target.value
    modKeyboard.querySelectorAll('.category-label, .keyboard-section').forEach(label => {
      label.classList.toggle('kb-hide', label.dataset.tab !== e.target.value)
    })
  })
  // Scroll highlight listener
  modKeyboard.addEventListener('scroll', () => highlightFocused(modKeyboard), { passive: true })
  highlightFocused(modKeyboard)
  // Tab click listener
  modKeyboard.querySelectorAll('.category-label').forEach(label => {
    label.addEventListener('click', () => {
      const tabs = modKeyboard.querySelectorAll(`.keyboard-section[data-tab="${label.dataset.tab}"]`)
      const matchingTab = [...tabs].find(tab => tab.querySelector('.title').textContent === label.dataset.name)
      if (!matchingTab) return
      modKeyboard.scrollTo({
        left: modKeyboard.scrollLeft + matchingTab.getBoundingClientRect().x - 8,
        behavior: 'smooth'
      })
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
    '/lib/jszip.min.js',
    '/lib/jscolor.js',
    '/lib/block-text.js',
    '/content-scripts/traits.js',
    '/content-scripts/enhancements.js',
    '/content-scripts/presets.js',
    '/content-scripts/libraries.js'
  ])
  injectStyle([
    '/content-scripts/codemirror.css',
    '/content-scripts/page.css'
  ])
})

document.body.addEventListener('_AE_start-worker', e => {
  api.runtime.sendMessage({
    type: 'run-preset-import',
    arguments: e.detail.arguments
  }, response => {
    console.log(response)
  })
})
