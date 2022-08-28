/* eslint-disable no-undef */
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
  dialog.classList.add('fullscreen')

  const preview = document.createElement('div')
  preview.classList.add('block-preview')
  dialog.appendChild(preview)

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
});
// Style
(() => {
  setTimeout(() => {
    ([
      'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.53.2/codemirror.min.css',
      'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.53.2/addon/fold/foldgutter.min.css',
      'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.53.2/addon/lint/lint.min.css'
    ]).forEach(url => {
      const element = document.createElement('link')
      element.href = url
      element.setAttribute('rel', 'stylesheet')
      document.querySelector('head').appendChild(element)
    })
  }, 600)
  const style = document.createElement('style')
  style.innerText = `.CodeMirror{height:100%!important;font-size:14px!important;background:#2e3836!important;box-shadow:2px 2px 10px #293d3a inset;font-family:'Source Code Pro',monospace;border-radius:4px;padding-right:8px!important}
    .CodeMirror-cursor{height:17px!important;margin-top:4px!important;background:#fff!important;border-color:#fff!important}
    .CodeMirror-gutters{left:0!important;background:#3e4c49!important;border-right:1px solid #7b8a88!important;box-shadow:2px 0 10px #293d3a;margin-left:-1px;position:absolute}
    .CodeMirror-guttermarker-subtle{transform:translate(-6px,3px);}
    .CodeMirror-sizer{margin-left:3px!important;margin-bottom:-17px!important;border-right-width:13px!important;min-height:29px!important;min-width:7px!important;padding:5px 20px 0 5px !important}
    .CodeMirror-line{line-height:1.7!important;padding-left:52px!important}
    .CodeMirror-linenumber{color:#fff!important;width:28px!important;margin-left:-5px!important;padding-right:4px!important;padding-left:0!important;top:3px;left:12px!important}
    .CodeMirror-linenumbers{width:31px!important}
    .CodeMirror-lint-tooltip{z-index:102!important}
    .cm-qualifier{color:#eee!important}
    .cm-punctuation,.cm-unit,.cm-negative{color:#e09142!important}
    .cm-string{color:#ffa852!important}
    .cm-positive{color:#6a51e6!important}
    .cm-def{color:#eee!important}
    .cm-variable{color:#888!important}
    .cm-variable-2,.cm-variable-3,.cm-string-2,.cm-url{color:#6a51e6!important}
    .cm-tag{color:#eee!important}
    .cm-bracket,/*.cm-comment,*/ .CodeMirror{color:#20b2aa!important}
    .cm-string{color:#ffc0cb!important}
    .cm-atom{color:#fafad2!important}
    .cm-number{color:#0ff!important}
    .cm-property{color:#add8e6!important}
    .cm-keyword,.cm-operator,.cm-attribute{color:#ff4aae!important}
    .CodeMirror-cursor{border-left:1px solid #eee}
    .CodeMirror-selected{background:rgba(200,200,200,0.1)!important}
    .CodeMirror-activeline-background{background:transparent!important}
    .CodeMirror-focused .CodeMirror-activeline-background{background:rgba(0,0,60,0.1)!important}
    .CodeMirror-matchingbracket{color:lime!important}
    .CodeMirror-nonmatchingbracket{color:red!important}
    .CodeMirror-focused .CodeMirror-matchingbracket,.CodeMirror-focused .CodeMirror-matchingtag.cm-tag{background:rgba(255,255,255,0.2)!important;border-radius:2px;padding-bottom:3px}
    .CodeMirror-focused .CodeMirror-matchingtag.cm-tag{padding-bottom:1px!important}
    .CodeMirror-matchingtag,.CodeMirror-matchingtag.cm-bracket{background:transparent!important}
    .CodeMirror-focused .CodeMirror-matchingtag.cm-bracket{background:transparent!important}
    .cm-searching{background-color:rgba(0,0,0,0.8);border-radius:3px;padding:0 5px}
    .CodeMirror-scroll{max-width:100%;max-height:calc(100% - 16px)}
    .CodeMirror-scroll::-webkit-scrollbar{display:none}
    .CodeMirror-scrollbar-filler{background:#2e3836!important}
    .CodeMirror-vscrollbar,.CodeMirror-hscrollbar{outline:none}
    .CodeMirror-vscrollbar-filler,.CodeMirror-hscrollbar-filler{position:absolute;bottom:0;right:0;background:transparent;border-radius:0 0 5px 0;z-index:2}
    .CodeMirror-vscrollbar-filler{width:10px;top:70px}
    .CodeMirror-hscrollbar-filler{left:30px;height:10px}
    .CodeMirror-vscrollbar::-webkit-scrollbar{width:6px!important}
    .CodeMirror-hscrollbar::-webkit-scrollbar{height:6px!important}
    .CodeMirror-vscrollbar::-webkit-scrollbar-track,.CodeMirror-hscrollbar::-webkit-scrollbar-track{background:transparent!important}
    .CodeMirror-vscrollbar::-webkit-scrollbar-thumb,.CodeMirror-hscrollbar::-webkit-scrollbar-thumb{background:#859391!important;border-radius:3px}
    .CodeMirror-vscrollbar::-webkit-scrollbar-thumb:hover,.CodeMirror-hscrollbar::-webkit-scrollbar-thumb:hover{background:#939f9d!important}
    .CodeMirror-foldmarker{color:aqua!important;text-shadow:#9df 1px 1px 2px, #9df -1px -1px 2px, #9df 1px -1px 2px, #9df -1px 1px 2px!important}
    .CodeMirror-lint-marker-error{top:3px!important;left:-4px!important}
    dialog{background-color:black;width:80%;height:75%;}
    dialog::backdrop{backdrop-filter:blur(2px);background-color:#8888}
    dialog button{position:fixed;top:0;right:96px;padding:8px 14px;margin:16px;font-family:inherit;font-size:18px;min-width:80px;border-radius:4px;}
    dialog button.accent{right:0;background-color:#11e4c8;color:white;}
    dialog .block-preview{position:fixed;top:0.625%;left:0;width:100%;text-align:center;}`
  document.head.appendChild(style)
})()
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
  const image = `url("${
    dark ? 'https://files.catbox.moe/kcwhbr.jpeg' : '/images/editor_bg.png'
  }")`
  document.documentElement.style.backgroundImage = image
  document.body.style.backgroundImage = image
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
