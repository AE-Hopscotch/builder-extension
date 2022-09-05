/* eslint-disable no-undef */
const ImportedLibraries = {
  container: null,
  init: function () {
    const container = this.container = document.getElementById('_AE_imported-libraries')
    const traits = [
      { id: 'gradientBg', name: 'Gradient Background', buttons: ['Create'] },
      { id: 'midiHack', name: 'MIDI Hack', buttons: ['Import'] }
    ]
    const html = traits.map(t => {
      const buttons = t.buttons.map(name => `<button id="_AE_${t.id}${name.replace(/\s/g, '')}_btn">${name}</button>`).join('')
      return `<div class="row">${t.name}${buttons}</div>`
    }).join('')
    container.innerHTML = html
    this.extendRevisionHandler()

    container.addEventListener('click', e => {
      if (!['BUTTON', 'INPUT'].includes(e.target.tagName)) return
      switch (e.target.id.replace(/^_AE_|_btn$/g, '')) {
        case 'gradientBgCreate': return this.openGradientPopup()
      }
    })
  },
  extendRevisionHandler: function () {
    // Probably not needed?
  },
  openGradientPopup: function () {
    const dialog = document.createElement('dialog')
    dialog.classList.add('gradient-bg')

    const container = document.createElement('form')
    container.method = 'dialog'
    const header = document.createElement('h2')
    header.innerText = 'Configure Instant Background'
    container.appendChild(header)
    const typeHeader = document.createElement('p')
    typeHeader.innerText = 'Gradient Type'
    container.appendChild(typeHeader)

    // Table
    const modeTable = document.createElement('table')
    container.appendChild(modeTable)
    const modeLayout = [
      [{ value: 'quad', text: 'Four Corners', checked: true }, { value: 'radial', text: 'Radial Gradient' }],
      [{ value: 'horizontal', text: 'Horizontal Gradient' }, { value: 'vertical', text: 'Vertical Gradient' }],
      [{ value: 'nesw', text: 'NE-SW Diagonal' }, { value: 'nwse', text: 'NW-SE Diagonal' }]
    ]
    modeLayout.forEach(row => {
      const element = document.createElement('tr')
      element.innerHTML = row.map(item => {
        const checkedIfNeeded = item.checked ? 'checked' : ''
        return `<td><label><input type="radio" name="bg-type" value="${item.value}" ${checkedIfNeeded}>${item.text}</label></td>`
      }).join('')
      modeTable.appendChild(element)
    })

    // Type Selector
    const modeHeader = document.createElement('p')
    modeHeader.innerHTML = '<span class="small-block">HS Color Mode:</span>'
    modeHeader.innerHTML += '<label><input type="radio" name="_AE_bg-mode" value="rgb" checked=""><span>RGB (Blend)</span></label>' +
      '<label><input type="radio" name="_AE_bg-mode" value="hsb"><span>HSB (Shift)</span></label>'
    modeHeader.addEventListener('input', e => {
      const value = nodeTree(e.target).find(e => e.matches('label')).querySelector('input').value
      document.getElementById('gradient-preview').classList.value = value
    })
    container.appendChild(modeHeader)

    // Custom Rule Name
    const nameHeader = document.createElement('p')
    nameHeader.innerText = 'Custom Rule Name'
    container.appendChild(nameHeader)
    const nameInput = document.createElement('input')
    nameInput.placeholder = 'Gradient Background'
    container.appendChild(nameInput)

    // Color Preview
    const previewHeader = document.createElement('p')
    previewHeader.innerText = 'Preview and Colors'
    container.appendChild(previewHeader)
    const colorContainer = document.createElement('div')
    colorContainer.classList.add('color-preview')
    colorContainer.innerHTML = `<div id="gradient-preview" class="rgb" type="quad">
        <p>⚠ Preview may<br>not be accurate</p>
      </div>
      <div id="color-preview-box" type="quad">
        <input autocomplete="off" id="_AE_gradientBg-col1" required>
        <input autocomplete="off" id="_AE_gradientBg-col2" required>
        <input autocomplete="off" id="_AE_gradientBg-col3" required>
        <input autocomplete="off" id="_AE_gradientBg-col4" required>
      </div>
    `
    colorContainer.querySelectorAll('#color-preview-box input[autocomplete="off"]').forEach((input, index) => {
      const colorVal = 'xxxxxx'.split('').map(() => { return '0123456789ABCDEF'.substr(Math.round(Math.random() * 4 + 2), 1) }).join('')
      // eslint-disable-next-line no-new, new-cap
      new jscolor(input, {
        backgroundColor: '#000d',
        borderColor: '#666e',
        hash: true,
        closable: true,
        inI: true,
        closeText: 'Close Color Picker',
        value: colorVal,
        scrollKeepLocked: true
      })
      colorContainer.querySelector('#gradient-preview').style.setProperty('--col-g' + (index + 1), '#' + colorVal)
      input.addEventListener('focus', e => {
        // Move picker inside of dialog
        const picker = document.querySelector('.jscolor-picker')
        dialog.appendChild(picker)
      })
      input.addEventListener('change', e => {
        colorContainer.querySelector('#gradient-preview').style.setProperty('--col-g' + (index + 1), e.target.value)
      })
    })
    container.appendChild(colorContainer)

    const { closeBtn, saveBtn } = AEAddButtons(dialog)
    closeBtn.addEventListener('click', () => dialog.remove())
    saveBtn.addEventListener('click', () => this.saveGradient())

    dialog.appendChild(container)
    dialog.classList.add('gradient-bg')
    document.body.appendChild(dialog)
    dialog.showModal()
  },
  saveGradient: function () {
    const dialog = document.querySelector('dialog.gradient-bg')
    const nameInputVal = dialog.querySelector('form > input').value || 'Gradient BG'
    let ruleName = nameInputVal
    let i = 2
    while (hsProject.customRules.find(cr => cr.name === ruleName)) {
      ruleName = `${nameInputVal} ${i}`
      i++
    }
    const type = dialog.querySelector('[name="bg-type"]:checked').value
    const options = {
      newVarNames: false,
      alwaysMerge: true,
      originalCreateDates: false,
      name: ruleName || 'Gradient BG',
      bgHsv: dialog.querySelector('[name="_AE_bg-mode"]:checked').value,
      colors: [...document.getElementById('color-preview-box').children]
        .map(input => input.value)
    }
    const start = performance.now() * 100
    PresetManager.loadPreset(hsProject, 'bg-' + type, options)
    const str = '%cCreated Gradient BG Rule ' +
      `(${Math.round(performance.now() * 100 - start) / 100}ms)`
    console.log(str, PresetManager.consoleMainStyle)

    dialog.remove()
  }
}

ImportedLibraries.init()
