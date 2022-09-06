const searchOptions = [
  [
    { id: 'opt_ww', text: 'Whole word only', attributes: [] },
    { id: 'opt_cs', text: 'Case Sensitive', attributes: [] },
    { id: 'opt_nl', text: '\\n matches new line', attributes: [] },
    { id: 'opt_ev', text: 'Match entire value only', attributes: [] },
    { id: 'opt_rg', text: 'Regular expression', attributes: [] },
    { id: 'opt_dc', text: 'Match deleted code', attributes: ['checked', 'disabled'] }
  ],
  [
    { id: 'ft_ai', text: 'Match ability IDs', attributes: ['checked'] },
    { id: 'ft_bn', text: 'Match block names', attributes: ['checked'] },
    { id: 'ft_ci', text: 'Match Custom Rule IDs', attributes: ['checked'] },
    { id: 'ft_oi', text: 'Match object IDs', attributes: ['checked'] },
    { id: 'ft_ri', text: 'Match rule IDs', attributes: ['checked'] },
    { id: 'ft_vi', text: 'Match variable IDs', attributes: ['checked'] }
  ],
  [
    { id: 'ft_cs', text: 'Match control scripts', attributes: ['checked'] },
    { id: 'ft_pv', text: 'Match parameter values', attributes: ['checked'] },
    { id: 'ft_cr', text: 'Match custom rule names', attributes: ['checked'] },
    { id: 'ft_ob', text: 'Match object names', attributes: ['checked'] },
    { id: 'ft_rs', text: 'Match rule scripts', attributes: ['checked'] },
    { id: 'ft_vr', text: 'Match variable names', attributes: ['checked'] }
  ],
  [
    { id: 'ft_fs', text: 'Match false scripts', attributes: ['checked'] },
    { id: 'ft_dd', text: 'Match data descriptions', attributes: ['checked'] },
    { id: 'ft_sc', text: 'Match scene names', attributes: ['checked'] },
    { id: 'ft_on', text: 'Match object texts', attributes: ['checked'] },
    { id: 'ft_rd', text: 'Match rule descriptions', attributes: ['checked'] },
    { id: 'ft_ab', text: 'Match ability names', attributes: ['checked'] }
  ]
]

const ProjectSearch = {
  container: null,
  initSearchBar: function () {
    // Desktop Search Bar Container
    const desktopSearchContainer = document.createElement('div')
    desktopSearchContainer.classList.add('keyboard-section', 'keyboard-header', 'kb-hide', 'search-input-container-desktop')
    const desktopSibling = document.querySelector('.keyboard-section[data-tab="search"]')
    desktopSibling.parentNode.insertBefore(desktopSearchContainer, desktopSibling)
    desktopSearchContainer.dataset.tab = 'search'

    // Mobile Search Bar Container
    const mobileSearchContainer = document.createElement('div')
    mobileSearchContainer.classList.add('category-label', 'kb-hide', 'search-input-container-mobile', 'expand')
    const mobileSibling = document.querySelector('.category-label[data-tab="search"][data-name]')
    mobileSibling.parentNode.insertBefore(mobileSearchContainer, mobileSibling)
    mobileSearchContainer.dataset.tab = 'search'

    // Inputs
    const desktopInput = document.createElement('input')
    desktopSearchContainer.appendChild(desktopInput)
    const mobileInput = document.createElement('input')
    mobileSearchContainer.appendChild(mobileInput)
    desktopInput.type = mobileInput.type = 'search'
    desktopInput.placeholder = mobileInput.placeholder = 'Search Project...'

    // Buttons
    const desktopButton = document.createElement('button')
    desktopSearchContainer.appendChild(desktopButton)
    const mobileButton = document.createElement('button')
    mobileSearchContainer.appendChild(mobileButton)
    desktopButton.innerText = mobileButton.innerText = 'Go'
  },
  initOptions: function () {
    const container = this.container = document.getElementById('_AE_search-options')
    const optionsTable = document.createElement('div')
    optionsTable.classList.add('option-rows-container')
    searchOptions.forEach(rowData => {
      const rowEl = document.createElement('div')
      rowEl.classList.add('option-row')
      rowData.forEach(item => {
        const label = document.createElement('label')
        const checkbox = document.createElement('input')
        checkbox.id = '_AE_search-' + item.id
        checkbox.type = 'checkbox'
        item.attributes.forEach(attr => checkbox.setAttribute(attr, ''))
        label.appendChild(checkbox)
        const span = document.createElement('span')
        span.innerText = item.text
        label.appendChild(span)
        rowEl.appendChild(label)
      })
      optionsTable.appendChild(rowEl)
    })
    container.appendChild(optionsTable)
    // Collapse the options by default
    container.parentNode.classList.add('collapsed')
    container.parentNode.style.maxHeight = '60px'
    container.parentNode.querySelector('.hs-icon').classList.remove('open')
  }
}

ProjectSearch.initSearchBar()
ProjectSearch.initOptions()
