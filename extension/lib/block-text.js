/* eslint-disable no-undef */
function AEAddButtons (dialog) {
  const closeBtn = document.createElement('button')
  closeBtn.classList.add('solid')
  closeBtn.innerText = 'Close'
  closeBtn.role = 'cancel'
  dialog.appendChild(closeBtn)

  const saveBtn = document.createElement('button')
  saveBtn.classList.add('accent')
  saveBtn.innerText = 'Save'
  saveBtn.role = 'save'
  dialog.appendChild(saveBtn)

  return { closeBtn, saveBtn }
}

// Right click to edit block
document.body.addEventListener('contextmenu', e => {
  function closeCustomEditor () {
    dialog.remove()
    ScrollLocker.unlock()

    if (self === top) return
    const event = { type: 'fullscreen-change', hasFullscreenPopup: false }
    window.top.postMessage(event, '*')
  }

  const block = nodeTree(e.target).find(x => x.matches('.block-wrapper'))
  if (!block) return
  e.preventDefault()
  const dialog = document.createElement('dialog')
  dialog.classList.add('fullscreen', 'block-json-editor')

  const preview = document.createElement('div')
  preview.classList.add('block-preview')
  dialog.appendChild(preview)

  const { closeBtn, saveBtn } = AEAddButtons(dialog)

  const textarea = document.createElement('textarea')
  dialog.appendChild(textarea)
  textarea.style = 'width: 60vw; height: 40vh'
  textarea.value = JSON.stringify(getBlockJSON(block), null, 2)
  document.body.appendChild(dialog)
  dialog.showModal()
  ScrollLocker.lock()

  closeBtn.addEventListener('click', closeCustomEditor)
  saveBtn.addEventListener('click', () => {
    const oldData = getBlockJSON(block)
    let json
    try { json = JSON.parse(cmEditor.getValue()) } catch (e) { return alert('Invalid JSON') }
    closeCustomEditor()
    rerenderBlock(block, json)
    ProjectBlock.update(block)
    ProjectRevision.fromBlockUpdate(block, oldData, json)
  })

  const cmEditor = CodeMirror.fromTextArea(textarea, {
    matchBrackets: true,
    autoCloseBrackets: true,
    mode: 'application/ld+json',
    foldGutter: true,
    lint: true,
    gutters: ['CodeMirror-lint-markers', 'CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
    lineWrapping: false,
    value: '{}',
    lineNumbers: true,
    indentWithTabs: true,
    tabSize: 2
  })
  function renderPreview () {
    preview.innerHTML = jsonToHtml(JSON.parse(cmEditor.getValue())).innerHTML.replace(/ class="(bl-handle|openbtn)/g, ' style="cursor:unset;opacity:1;" class="' + '$1')
  }
  renderPreview()
  cmEditor.on('change', function (e) {
    try {
      JSON.parse(cmEditor.getValue())
      // console.log("Successful JSON Parse")
      renderPreview()
    } catch (E) {}
    const currentCursor = cmEditor.getCursor()
    const currentLine = cmEditor.getLine(currentCursor.line)
    function addShorthand (regEx, value) {
      try {
        cmEditor.setValue(JSON.stringify(JSON.parse(cmEditor.getValue().replace(regEx, JSON.stringify(value))), null, '\t'))
        cmEditor.setCursor(currentCursor.line + Object.keys(value).length + 1 + !cmEditor.getLine(currentCursor.line).match(/\{$/m), 999999)
      } catch (E) {
        console.error('Could not add Parameter: Invalid JSON')
      }
    }
    const shorthandDict = {
      PARAM: { value: '', defaultValue: '', key: '', type: 57 },
      OPERATOR: { block_class: 'operator', type: 4000, description: '+', params: [] },
      VAR: { type: 8003, variable: '', description: 'Variable' },
      TRAIT: { HSTraitTypeKey: 3000, HSTraitIDKey: '', description: '' },
      EVENTPARAM: { value: '', defaultValue: '', key: '', type: 50, variable: '' },
      IMAGE: { type: 1, text: '', name: '', description: '' }
    }
    Object.keys(shorthandDict).forEach(key => {
      const regEx = new RegExp(`{${key}}`, 'g')
      if (currentLine.match(regEx)) addShorthand(regEx, shorthandDict[key])
    })
  })

  dialog.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeCustomEditor()
  })

  if (self === top) return
  const event = {
    type: 'fullscreen-change',
    hasFullscreenPopup: true
  }
  window.top.postMessage(event, '*')
})
const modKeyboard = document.querySelector('._AE-hs-tools-keyboard')
document.querySelector('._AE-left-btn-container button').addEventListener('click', () => {
  if (typeof BlockParameter === 'undefined') return
  const keyboardOpen = modKeyboard.matches('.open')
  if (keyboardOpen) BlockParameter.deselectAll()
})
const blocksWrapper = document.getElementById('blocks-container-wrapper')
if (blocksWrapper && typeof nodeTree !== 'undefined') {
  blocksWrapper.addEventListener('click', e => {
    const tree = nodeTree(e.target)
    if (!tree.find(el => el.matches('.param-bubble'))) return
    modKeyboard.classList.remove('open')
  })
}

function getAEModPref (name) {
  let prefs = {
    allowAllDrags: true,
    useDarkMode: false
  }
  try {
    prefs = JSON.parse(localStorage._AE_modPreferences)
  } catch {}
  return name ? prefs[name] : prefs
}
// eslint-disable-next-line no-unused-vars
function setAEModPref (name, value) {
  const prefs = getAEModPref()
  prefs[name] = value
  localStorage._AE_modPreferences = JSON.stringify(prefs)
}
function AEShowDarkMode () {
  const dark = getAEModPref('useDarkMode')
  document.body.classList.toggle('_AE_dark-mode', dark)
}
AEShowDarkMode()

// Redefine function to include class list
function rerenderBlock (blockEl, json) {
  const info = jsonToHtml(json, null, true)

  blockEl.dataset.id = info.id
  blockEl.dataset.json = info.data

  const tempElement = document.createElement('div')
  tempElement.innerHTML = info.innerHTML

  // Replace the HTML of only the main block content
  // rather than also replacing inner blocks
  blockEl.querySelector('.block-content').innerHTML =
    tempElement.querySelector('.block-content').innerHTML

  blockEl.querySelector('.block').classList.value =
    tempElement.querySelector('.block').classList.value

  if (typeof BlockParameter === 'undefined') return
  blockEl.querySelectorAll('.param-bubble').forEach(parameter => {
    // Re-initiate dragging on all parameters
    BlockParameter.create(parameter)
  })
}

// Redefine can drag for custom definitions
// eslint-disable-next-line no-unused-vars
function canDragOperator (parameterType, operatorType) {
  const variables = ['var', 'trait']
  const varAndMath = ['math', ...variables]
  const numberAndString = ['math', 'text', ...variables]
  const color = ['color', ...numberAndString]
  const supportedOperators = {
    Default: numberAndString,
    LineWidth: numberAndString,
    LineColor: color,
    RandomLow: numberAndString,
    RandomHigh: numberAndString,
    Variable: ['var'],
    VariableValue: numberAndString,
    Conditional: ['conditional', 'product'],
    HSObject: [], // Stage object is selection menu only
    Sound: varAndMath, // Can be dragged on
    Event: ['rule', 'conditional', 'product'],
    SetText: ['math', 'text', ...variables],
    Object: ['image'],
    TextOnly: [],
    Scene: varAndMath,
    MultiPurposeNumberDefault: numberAndString,
    Product: ['product'],
    Rhythm: varAndMath,
    MusicNote: varAndMath,
    Instrument: varAndMath
  }
  const allowedTypes = supportedOperators[parameterType]
  if (parameterType !== 'HSObject' && operatorType && getAEModPref('allowAllDrags')) return true
  return allowedTypes.includes(operatorType)
}

DragValidator.validateParameter = function (to, from, item) {
  const targetGroup = to.el.dataset.type
  const operatorGroup = item.dataset.type
  // Redefine validate parameter but with updated can drag function
  const result = canDragOperator(targetGroup, operatorGroup)
  return result
}
