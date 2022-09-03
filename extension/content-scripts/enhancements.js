/* eslint-disable no-undef */
function getRange (a, b) {
  const rangeList = []
  for (let i = a; i < b + 1; i++) { rangeList.push(i) }
  return rangeList // Includes b
}

// DIRECTLY FROM HS BUILDER
const checkAbility = {
  checkBlock: function (block, checkAgainst) {
    block.parameters = block.parameters || []
    let i = -1; const passingParams = checkAgainst.parameters.map(p => {
      i++
      return Object.keys(p).map(k => {
        block = Object.detach(block)
        if (typeof (block.parameters[i] || {}).datum === 'object') block.parameters[i].datum = JSON.stringify(block.parameters[i].datum)
        return ((block.parameters[i] && new RegExp(p[k]).test((block.parameters[i] || {})[k] || '')) || (p[k] === -1 && (block.parameters[i] || {})[k] != null)) || null
      }).filter(x => x != null).length === Object.keys(p).length || null
    }).filter(x => x != null).length
    return ((block.type === checkAgainst.type || checkAgainst.type === -1) && passingParams === checkAgainst.parameters.length)
  },
  checkScript: function (blocks, checkArray) {
    return (checkArray.map(item => {
      return (blocks.map(b => {
        return checkAbility.checkBlock(b, item) || null
      }).filter(x => x != null).length > 0) || null
    }).filter(x => x != null).length === checkArray.length)
  },
  secretBlocks: function (a) {
    const blocks = a.blocks || []
    // Required Blocks since version 0.1; -1 means must exist
    const cloneBlock = { type: 53, parameters: [{ key: 'times', type: -1 }] }
    const timestampBlock = { type: 19, parameters: [{ type: -1 }] }
    const scaleBlock = { type: 29, parameters: [{ type: -1 }] }
    // Required Blocks in order to identify as the newest secret blocks
    const cmtVarCond = { type: 45, parameters: [{ type: -1 }, { datum: '{"block_class":"conditionalOperator","type":10[0-1][0-9],[^\\{\\}\\[\\]]*?"params":\\[\\{[^\\{\\}\\[\\]]*?"datum":\\{[^\\{\\}\\[\\]]*?"type":22,[^\\{\\}\\[\\]]*?"params":\\[\\{[^\\{\\}\\[\\]]*?("value":".*?")?[^\\{\\}\\[\\]]*?\\}\\]\\},[^\\{\\}\\[\\]]*?"type":[0-9]{1,3}\\},\\{[^\\{\\}\\[\\]]*?"type":[0-9]{1,3}[^\\{\\}\\[\\]]*?\\}\\]}', type: '^49$' }] }
    const cdtVarCond = { type: 44, parameters: [{ type: -1 }, { datum: '({"block_class":"conditionalOperator","type":10[0-1][0-9],[^\\{\\}\\[\\]]*?"params":\\[)(\\{.*?"type":4000[^\\{\\}\\[\\]]*?"params":\\[\\{[^\\{\\}\\[\\]]*?"datum":\\{[^\\{\\}\\[\\]]*?"type":22[^\\{\\}\\[\\]]*?"params":\\[\\{[^\\{\\}\\[\\]]*?("value":".*?)?[^\\{\\}\\[\\]]*?"type":[0-9]{1,3}\\}[^\\{\\}\\[\\]]*?\\]\\},[^\\{\\}\\[\\]]*?"type":[0-9]{1,3}\\}(,\\{.*?\\})\\]\\}[^\\{\\}\\[\\]]*?"type":[0-9]{1,3}\\},?)(\\{.*?"type":4000[^\\{\\}\\[\\]]*?"params":\\[\\{[^\\{\\}\\[\\]]*?"datum":\\{[^\\{\\}\\[\\]]*?"type":22[^\\{\\}\\[\\]]*?"params":\\[(\\{[^\\{\\}\\[\\]]*?("value":".*?)?[^\\{\\}\\[\\]]*?"type":[0-9]{1,3}\\},?){2}(,\\{.*?\\})\\]\\})(.*?"type":[0-9]{1,3},?\\}(,\\{*?\\})?\\]\\})', type: '^49$' }] }
    const inputDeflt = { type: 63, parameters: [{ type: '^47$' }, { type: '^53$' }, { type: '^53$' }] }
    const multByCond = { type: -1, parameters: [{ datum: '\\{[^\\{\\}\\[\\]]*?"type":4002[^\\{\\}\\[\\]]*?"params":\\[\\{[^\\{\\}\\[\\]]*?"type":49[^\\{\\}\\[\\]]*?\\},\\{[^\\{\\}\\[\\]]*?"type":42[^\\{\\}\\[\\]]*?\\}\\]\\}', type: -1 }] }
    const sceneTextB = { type: 125, parameters: [{ type: '^53$' }] }
    const hiddenAbil = { type: 123, parameters: [{ key: '^[Cc]ustom', type: '^55$' }] }
    const setOpacity = { type: 36, parameters: [{ type: -1 }] }
    const commentBlk = { type: 22, parameters: [{ type: -1 }] }
    const cDataBlock = { type: 22, parameters: [{ type: -1 }, { key: '^data$', type: '^53$' }] }
    const ImgFreezeB = { type: 56, parameters: [{ datum: '\\{(?:"name":".*?",)?"type":4004,"description":""\\}', type: '^54$' }] }
    // reqSeedsBl = {"type":127,"parameters":[{"type":"^57$"},{"type":"^58$"}]};
    const isSecretBlocks = (checkAbility.checkScript(blocks, [cloneBlock, timestampBlock, scaleBlock]))
    const hasNewest = (isSecretBlocks && checkAbility.checkScript(blocks, [cmtVarCond, cdtVarCond, inputDeflt, multByCond, sceneTextB, hiddenAbil, setOpacity, commentBlk, cDataBlock, ImgFreezeB/*, reqSeedsBl */]))
    return { contains: isSecretBlocks, newest: hasNewest }
  },
  setImgBlocks: function (a) {
    const blocks = a.blocks || []
    // Required blocks since version 0.1; -1 means must exist
    const halloweenChars = getRange(11, 19).map(id => { return { type: 56, parameters: [{ type: -1, datum: '^\\{"type":' + id + ',"description":""\\}$' }] } })
    const winterChars = getRange(64, 74).map(id => { return { type: 56, parameters: [{ type: -1, datum: '^\\{"type":' + id + ',"description":""\\}$' }] } })
    const eosBlock = getRange(3e4, 3e4).map(id => { return { type: 56, parameters: [{ type: -1, datum: '^\\{"type":' + id + ',"description":""\\}$' }] } })
    const originalChars1 = getRange(0, 10).map(id => { return { type: 56, parameters: [{ type: -1, datum: '^\\{"type":' + id + ',("text":"[\\s\\w]+",)?"description":""\\}$' }] } })
    const originalChars2 = getRange(20, 32).map(id => { return { type: 56, parameters: [{ type: -1, datum: '^\\{"type":' + id + ',"description":""\\}$' }] } })
    const originalShapes = getRange(34, 56).map(id => { return { type: 56, parameters: [{ type: -1, datum: '^\\{"type":' + id + ',"description":""\\}$' }] } })
    const jungleCharacts = getRange(58, 63).map(id => { return { type: 56, parameters: [{ type: -1, datum: '^\\{"type":' + id + ',"description":""\\}$' }] } })
    const fullSizeShapes = getRange(100, 126).map(id => { return { type: 56, parameters: [{ type: -1, datum: '^\\{"type":' + id + ',"description":""\\}$' }] } })
    const fullSzV3Shapes = getRange(150, 164).map(id => { return { type: 56, parameters: [{ type: -1, datum: '^\\{"type":' + id + ',"description":""\\}$' }] } })
    const version2Chars = getRange(3001, 3002).map(id => { return { type: 56, parameters: [{ type: -1, datum: '^\\{"type":' + id + ',"description":""\\}$' }] } })
    const fullBlocksList = halloweenChars.concat(winterChars, eosBlock, originalChars1, originalChars2, originalShapes, jungleCharacts, fullSizeShapes, fullSzV3Shapes, version2Chars)
    const isImageBlocks = (checkAbility.checkScript(blocks, halloweenChars))
    const hasNewestImgB = (checkAbility.checkScript(blocks, fullBlocksList))
    return { contains: isImageBlocks, newest: hasNewestImgB }
  },
  // IMPORTED INTO OBJECT FROM HS BUILDER
  getSbAbility: function () {
    const hasSbAbilityName = !hsProject.abilities
      ? null
      : (hsProject.abilities.map(a => {
          if (a.name && checkAbility.secretBlocks(a).contains) return (a.name.length > 29) ? a.name.substr(0, 27) + '...' : a.name
          return undefined
        }) || []).filter(x => !!x)[0]
    const fullSbAbilityName = !hsProject.abilities
      ? null
      : (hsProject.abilities.map(a => {
          if (a.name && checkAbility.secretBlocks(a).newest) return (a.name.length > 29) ? a.name.substr(0, 27) + '...' : a.name
          return undefined
        }) || []).filter(x => !!x)[0]
    const name = fullSbAbilityName || hasSbAbilityName
    return name ? name.replace(/(^.{13})(.+)/, '$1\u2026') : ''
  },
  getIbAbility: function () {
    const fullIbAbilityName = !hsProject.abilities
      ? null
      : (hsProject.abilities.map(a => {
          if (a.name && checkAbility.setImgBlocks(a).newest) return (a.name.length > 29) ? a.name.substr(0, 27) + '...' : a.name
          return undefined
        }) || []).filter(x => !!x)[0]
    return fullIbAbilityName ? fullIbAbilityName.replace(/(^.{13})(.+)/, '$1\u2026') : ''
  }
}

const ProjectEnhancer = {
  container: null,
  init: function () {
    const container = this.container = document.getElementById('_AE_project-enhancements')
    const actions = [
      { id: 'addSecretBlocks', name: 'Secret Blocks', button: 'Add' },
      { id: 'addSetImgBlocks', name: 'Set Image Blocks', button: 'Add' },
      { id: 'optimizeColorSlots', name: 'Color Slots', button: 'Optimize' },
      { id: 'evaluateMath', name: 'Math Operators', button: 'Evaluate' },
      { id: 'setDarkMode', name: 'Force Dark Theme', input: 'checkbox', checked: getAEModPref('useDarkMode') },
      { id: 'restrictOperators', name: 'Restrict Operator Drags', input: 'checkbox' }
    ]
    const html = actions.map(a => {
      const buttonIfNeeded = a.button ? `<button id="_AE_${a.id}_btn">${a.button}</button>` : ''
      const checkedIfNeeded = a.checked ? 'checked' : ''
      const inputIfNeeded = a.input ? `<input id="_AE_${a.id}_input" type="${a.input}" ${checkedIfNeeded}>` : ''
      return `<div class="row">${a.name}` +
        `${buttonIfNeeded}${inputIfNeeded}
        <i hidden class="hs-icon hs-confirm"></i></div>`
    }).join('')
    container.innerHTML = html
    this.prefill()
    this.extendRevisionHandler()

    container.addEventListener('click', e => {
      if (!['BUTTON', 'INPUT'].includes(e.target.tagName)) return
      switch (e.target.id) {
        case '_AE_addSecretBlocks_btn': {
          const abilities = ProjectEnhancer.addSecretBlocks()
          return new ProjectRevision({
            type: 'AEAddAbilities',
            function: 'addSecretBlocks',
            abilityIDs: abilities.map(a => a.abilityID)
          })
        }
        case '_AE_addSetImgBlocks_btn': {
          const abilities = ProjectEnhancer.addSetImgBlocks()
          return new ProjectRevision({
            type: 'AEAddAbilities',
            function: 'addSetImgBlocks',
            abilityIDs: abilities.map(a => a.abilityID)
          })
        }
        case '_AE_optimizeColorSlots_btn': {
          const result = ProjectEnhancer.optimizeColors()
          if (result.count === 0) return
          const revision = new ProjectRevision({
            type: 'AEMassBlockUpdate',
            modifiedBlocks: result.changedBlocks
          })
          return RevisionAction.redoAEMassBlockUpdate(revision)
        }
        case '_AE_evaluateMath_btn': {
          const result = ProjectEnhancer.evaluateMath()
          if (result.count === 0) return
          const revision = new ProjectRevision({
            type: 'AEMassBlockUpdate',
            modifiedBlocks: result.changedBlocks
          })
          return RevisionAction.redoAEMassBlockUpdate(revision)
        }
        case '_AE_restrictOperators_input': {
          return setAEModPref('allowAllDrags', !e.target.checked)
        }
        case '_AE_setDarkMode_input': {
          setAEModPref('useDarkMode', e.target.checked)
          return AEShowDarkMode()
        }
      }
    })
  },
  prefill: function () {
    this.container.querySelectorAll('button').forEach(button => {
      let showCheck = false
      switch (button.id.replace(/^_AE_|_btn$/g, '')) {
        case 'addSecretBlocks': showCheck = !!checkAbility.getSbAbility(); break
        case 'addSetImgBlocks': showCheck = !!checkAbility.getIbAbility(); break
      }
      button.hidden = showCheck
      button.nextElementSibling.hidden = !showCheck
    })
  },
  extendRevisionHandler: function () {
    RevisionAction.undoAEAddAbilities = function (info) {
      info.abilityIDs.forEach(id => ProjectAbility.delete(id))
      ProjectEnhancer.refreshBlocksKeyboard()
      ProjectEnhancer.prefill()
    }
    RevisionAction.redoAEAddAbilities = function (info) {
      const abilities = ProjectEnhancer[info.function]()
      ProjectRevision.current.abilityIDs = abilities.map(a => a.abilityID)
    }
    RevisionAction.undoAEMassBlockUpdate = function (record) {
      const blocksToChange = record.modifiedBlocks.slice().reverse()
      RevisionAction.performBlockUpdates(blocksToChange, 'oldData')
    }
    RevisionAction.redoAEMassBlockUpdate = function (record) {
      const blocksToChange = record.modifiedBlocks
      RevisionAction.performBlockUpdates(blocksToChange, 'newData')
    }
  },
  presetCode: {
    // The 5th block is the rainbow block holding the hidden abilities
    secretBlocksAbility: { abilityID: '_TOP_ABILITY_ID', blocks: [{ block_class: 'method', description: 'Set', type: 45, parameters: [{ defaultValue: '', value: '', key: '', type: 47 }, { defaultValue: '10', value: '10', key: 'to', datum: { block_class: 'conditionalOperator', type: 1000, description: '=', params: [{ defaultValue: '', value: '', key: '', datum: { block_class: 'operator', type: 22, description: '', params: [{ defaultValue: '', value: '', key: '\u00BB', type: 55 }] }, type: 42 }, { defaultValue: '7', value: '', key: '=', type: 42 }] }, type: 49 }] }, { block_class: 'method', type: 44, description: 'Increase', parameters: [{ defaultValue: '', value: '', key: '', type: 47 }, { defaultValue: '', value: '', key: 'by', datum: { block_class: 'conditionalOperator', type: 1000, description: '=', params: [{ defaultValue: '', value: '', key: '', datum: { block_class: 'operator', type: 4000, description: '+', params: [{ defaultValue: '', value: '', key: '', datum: { block_class: 'operator', type: 22, description: '', params: [{ defaultValue: '', value: '', key: '»', type: 55 }] }, type: 53 }, { defaultValue: '', value: '', key: '+', type: 53 }] }, type: 53 }, { defaultValue: '', value: '', key: '=', datum: { block_class: 'operator', type: 4000, description: '+', params: [{ defaultValue: '', value: '', key: '', datum: { block_class: 'operator', type: 22, description: '', params: [{ defaultValue: '', value: '', key: '»', type: 55 }, { defaultValue: '', value: '', key: 'data', type: 53 }] }, type: 53 }, { defaultValue: '', value: '', key: '+', type: 53 }] }, type: 53 }] }, type: 49 }] }, { block_class: 'method', description: 'Set', type: 63, parameters: [{ defaultValue: '', value: '', key: '', type: 47 }, { defaultValue: '', value: '', key: 'prompt', type: 53 }, { defaultValue: '', value: '_ae_webplayer_hide_prompt_input', key: 'default', type: 53 }] }, { block_class: 'method', type: 125, description: 'Change Scene', parameters: [{ defaultValue: 'Scene 1', value: '', key: 'to', type: 53, datum: { block_class: 'operator', type: 4002, description: '×', params: [{ defaultValue: '2', value: '', key: '', type: 49 }, { defaultValue: '3', value: '', key: '×', type: 42 }] } }] }, { parameters: [{ defaultValue: '', value: 'Custom Abilities', key: 'Custom', type: 55 }], block_class: 'control', description: '', controlScript: { abilityID: '_HIDDEN_SCRIPTS_ABILITY_ID' }, type: 123 }, { block_class: 'method', description: 'Create a Clone of This Object', type: 53, parameters: [{ defaultValue: '5', value: '5', key: 'times', type: 42 }] }, { block_class: 'method', type: 19, description: '', parameters: [{ defaultValue: '1538918950', value: '', key: 'Wait Until Unix Timestamp', type: 42 }] }, { block_class: 'method', description: 'Change Scene', type: 125, parameters: [{ defaultValue: 'Scene 1', value: '', key: 'to', type: 56 }] }, { type: 55, block_class: 'method', description: 'Destroy' }, { block_class: 'method', type: 29, description: 'Scale by', parameters: [{ defaultValue: '100', value: '80', key: 'percent', type: 42 }] }, { block_class: 'method', description: 'Set Opacity', type: 36, parameters: [{ defaultValue: '80', value: '80', key: '', type: 42 }] }, { block_class: 'method', type: 22, description: '', parameters: [{ defaultValue: '', value: '', key: 'Comment', type: 55 }] }, { block_class: 'method', type: 22, description: '', parameters: [{ defaultValue: '', value: '', key: 'Comment', type: 55 }, { defaultValue: '', value: '', key: 'data', type: 53 }] }, { block_class: 'method', description: 'Set Image', type: 56, parameters: [{ defaultValue: '', value: '', key: '', datum: { type: 4004, description: '' }, type: 54 }] }, { block_class: 'method', type: 35, description: 'Wait', parameters: [{ defaultValue: '500', value: '500', key: 'milliseconds', type: 42 }] }, { block_class: 'method', type: 52, description: 'Start Sound', parameters: [{ defaultValue: 'clickPlayable', value: 'clickPlayable', key: '', type: 51 }, { defaultValue: '500', value: '500', key: 'wait', type: 42 }] }, /* {"block_class":"method","type":127,"description":"Request Seeds","parameters":[{"defaultValue":"5","value":"5","key":"","type":57},{"defaultValue":"","value":"","key":"for","type":58}]}, */{ block_class: 'method', description: 'Set Angle', type: 39, parameters: [{ defaultValue: '30', value: '30', key: '', datum: { block_class: 'operator', type: 4002, description: '×', params: [{ defaultValue: '2', value: '2', key: '', datum: { block_class: 'operator', type: 4014, description: 'Arccos', params: [{ defaultValue: '0.5', value: '0.5', key: '', datum: { block_class: 'operator', type: 4003, description: '÷', params: [{ defaultValue: '5', value: '5', key: '', datum: { block_class: 'operator', type: 4001, description: '−', params: [{ defaultValue: '5', value: '5', key: '', datum: { HSTraitTypeKey: 2001, HSTraitIDKey: '47FEC2FE-4F06-4EC5-B615-F29A82453906-1995-000006129EB7BBDD', HSTraitObjectParameterTypeKey: 8000, description: 'X Position' }, type: 42 }, { defaultValue: '2', value: '2', key: '−', datum: { HSTraitTypeKey: 2001, HSTraitIDKey: 'B62E526E-1936-4080-B8CA-9FFA2FEF0480-1995-000006129EE2CCB6', HSTraitObjectParameterTypeKey: 8004, description: 'X Position' }, type: 42 }] }, type: 42 }, { defaultValue: '2', value: '2', key: '÷', datum: { block_class: 'operator', type: 4006, description: '√', params: [{ defaultValue: '25', value: '25', key: '', datum: { block_class: 'operator', type: 4000, description: '+', params: [{ defaultValue: '2', value: '2', key: '', datum: { block_class: 'operator', type: 4005, description: '^', params: [{ defaultValue: '2', value: '', key: '', datum: { block_class: 'operator', type: 4001, description: '−', params: [{ defaultValue: '5', value: '', key: '', datum: { HSTraitTypeKey: 2001, HSTraitIDKey: 'F5FB8A3A-E004-4042-89B2-CCAF34EAB413-1995-000006129EB7E581', HSTraitObjectParameterTypeKey: 8000, description: 'X Position' }, type: 42 }, { defaultValue: '2', value: '', key: '−', datum: { HSTraitTypeKey: 2001, HSTraitIDKey: '75208AE2-B5D8-4990-9330-93BC96018A04-1995-000006129EE2F99A', HSTraitObjectParameterTypeKey: 8004, description: 'X Position' }, type: 42 }] }, type: 42 }, { defaultValue: '3', value: '2', key: '^', type: 42 }] }, type: 42 }, { defaultValue: '3', value: '3', key: '+', datum: { block_class: 'operator', type: 4005, description: '^', params: [{ defaultValue: '2', value: '', key: '', datum: { block_class: 'operator', type: 4001, description: '−', params: [{ defaultValue: '5', value: '', key: '', datum: { HSTraitTypeKey: 2002, HSTraitIDKey: 'E53EEC06-BA3C-4AE6-BFC5-2603FA921A8B-1995-000006129EB80E73', HSTraitObjectParameterTypeKey: 8000, description: 'Y Position' }, type: 42 }, { defaultValue: '2', value: '', key: '−', datum: { HSTraitTypeKey: 2002, HSTraitIDKey: '044627E9-C3E7-4339-BE6D-A19591A97B00-1995-000006129EE319CE', HSTraitObjectParameterTypeKey: 8004, description: 'Y Position' }, type: 42 }] }, type: 42 }, { defaultValue: '3', value: '2', key: '^', type: 42 }] }, type: 42 }] }, type: 42 }] }, type: 42 }] }, type: 42 }] }, type: 42 }, { defaultValue: '3', value: '-1', key: '×', datum: { block_class: 'operator', type: 4000, description: '+', params: [{ defaultValue: '2', value: '-1', key: '', type: 42 }, { defaultValue: '3', value: '3', key: '+', datum: { block_class: 'operator', type: 4002, description: '×', params: [{ defaultValue: '2', value: '', key: '', datum: { block_class: 'conditionalOperator', type: 1003, description: '＞', params: [{ defaultValue: '8', value: '8', key: '', datum: { HSTraitTypeKey: 2002, HSTraitIDKey: 'FEC9904A-D2E1-4A01-B11B-CA6FF31E03E0-1995-000006129EB840BC', HSTraitObjectParameterTypeKey: 8000, description: 'Y Position' }, type: 42 }, { defaultValue: '7', value: '7', key: '＞', datum: { HSTraitTypeKey: 2002, HSTraitIDKey: '4A3CBCEE-D917-4FF4-8E53-061DFB740885-1995-000006129EE34456', HSTraitObjectParameterTypeKey: 8004, description: 'Y Position' }, type: 42 }] }, type: 49 }, { defaultValue: '3', value: '2', key: '×', type: 42 }] }, type: 42 }] }, type: 42 }] }, type: 42 }] }], createdAt: 0, name: '_TOP_ABILITY_NAME' },
    hiddenAbilityBlock: '{"parameters":[{"defaultValue":"","value":"Hidden","key":"Custom","type":55}],"block_class":"control","type":123,"description":"","controlScript":{"abilityID":"_CONTROL_SCRIPT_ABILITY_ID"}}',
    setImageBlocksList: [{ block_class: 'method', type: 56, description: 'Set Image', parameters: [{ defaultValue: '', value: '', key: '', datum: { type: 3e4, description: '' }, type: 54 }] }, { block_class: 'method', type: 56, description: 'Set Image', parameters: [{ defaultValue: '', value: '', key: '', datum: { type: 1, text: 'Above does not Freeze', description: '' }, type: 54 }] }].concat([0].concat(getRange(2, 32), getRange(34, 56), getRange(58, 74), getRange(100, 126), getRange(150, 164), [3001, 3002]).map(id => { return { block_class: 'method', type: 56, description: 'Set Image', parameters: [{ defaultValue: '', value: '', key: '', datum: { type: id, description: '' }, type: 54 }] } }))
  },
  nextAbilityTime: function () {
    return hsProject.abilities.map(a => { return a.createdAt || 0 }).sort((a, b) => b - a)[0] + 12.345678 || 0
  },
  refreshBlocksKeyboard: function () {
    const kbContainer = blocksKeyboard.querySelector('[data-blocksource="custom-abilities"]')
    loadBlockList(kbContainer.parentNode, kbContainer)
  },
  addSecretBlocks: function () {
    const code = this.presetCode
    const hiddenScriptId = tempUuid().toUpperCase()
    const createTime = this.nextAbilityTime()
    const sbAbility = {
      name: 'Secret Blocks',
      createdAt: createTime,
      abilityID: tempUuid().toUpperCase(),
      blocks: JSON.parse(JSON.stringify(code.secretBlocksAbility.blocks).replace(/_HIDDEN_SCRIPTS_ABILITY_ID/, hiddenScriptId))
    }
    const hbAbility = {
      createdAt: createTime + 12.345678,
      abilityID: hiddenScriptId,
      blocks: (function (i) { return '.'.repeat(i).split('').map(() => { return JSON.parse(code.hiddenAbilityBlock.replace(/_CONTROL_SCRIPT_ABILITY_ID/, tempUuid().toUpperCase())) }) })(50)
    }
    hsProject.abilities.push(sbAbility)
    hsProject.abilities.push(hbAbility)
    this.refreshBlocksKeyboard()
    this.prefill()
    return [sbAbility, hbAbility]
  },
  addSetImgBlocks: function () {
    const imgBlocksAbility = {
      name: 'Set Image Blocks',
      createdAt: this.nextAbilityTime(),
      abilityID: tempUuid().toUpperCase(),
      blocks: this.presetCode.setImageBlocksList
    }
    hsProject.abilities.push(imgBlocksAbility)
    this.refreshBlocksKeyboard()
    this.prefill()
    return [imgBlocksAbility]
  },
  // From HS Builder, with some modifications
  optimizeColors: function () {
    const project = hsProject
    let count = 0
    const changedBlocks = []

    function rgbToHsv (r, g, b) {
      r /= 255
      g /= 255
      b /= 255
      const max = Math.max(r, g, b); const min = Math.min(r, g, b)
      let h; const v = max
      const d = max - min
      const s = max === 0 ? 0 : d / max
      if (max === min) {
        h = 0 // achromatic
      } else {
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break
          case g: h = (b - r) / d + 2; break
          case b: h = (r - g) / d + 4; break
        }
        h /= 6
      }
      return [h * 360, s * 100, v * 100]
    }
    function colorParameter (param) {
      if (!param.datum) return { data: param }
      if (param.datum.block_class === 'operator' && (param.datum.type === 5001 || param.datum.type === 5002)) {
        const dParams = param.datum.params || param.datum.parameters || []
        dParams[0] = dParams[0] || {}
        dParams[1] = dParams[1] || {}
        dParams[2] = dParams[2] || {}
        if (dParams[0].datum || dParams[1].datum || dParams[2].datum || dParams[0].variable || dParams[1].variable || dParams[2].variable) return { data: param } // Do not override anything if there is data such as math or variables.
        const colorArray = param.datum.type === 5001 ? rgbToHsv((Number(dParams[0].value) || 0), (Number(dParams[1].value) || 0), (Number(dParams[2].value) || 0)) : [(Number(dParams[0].value) || 0), (Number(dParams[1].value) || 0), (Number(dParams[2].value) || 0)]
        const colorString = 'HSB(' + colorArray.map(item => { const val = Math.round(item * 100) / 100; return (val > 0 && val <= 1) ? 1.01 : val }).join(',') + ')'
        param.value = colorString
        delete param.datum
        count++
        return { data: param, changed: true }
      } else {
        if (param.datum.params) param.datum.params = param.datum.params.map(p => { return colorParameter(p).data })
        return { data: param }
      }
    }
    project.abilities = (project.abilities || []).map(a => {
      a.blocks = (a.blocks || []).map((b, index) => {
        if (!b.parameters) return b
        const blockBefore = Object.detach(b)
        let changed = false
        b.parameters = b.parameters.map(p => {
          const result = colorParameter(p)
          if (result.changed) changed = true
          return result.data
        })
        if (changed) {
          changedBlocks.push({
            abilityID: a.abilityID,
            index,
            oldData: blockBefore,
            newData: Object.detach(b)
          })
        }
        return b
      })
      return a
    })
    return { changedBlocks, count }
  },
  evaluateMath: function () {
    const project = hsProject
    let count = 0
    const changedBlocks = []

    function calcParameter (param) {
      if (!param.datum) return { data: param }
      if (param.datum.block_class === 'operator' && param.datum.type >= 4e3 && param.datum.type <= 4019 && param.datum.type !== 4004) {
        let dParams = param.datum.params || param.datum.parameters || []
        dParams[0] = dParams[0] || {}
        dParams[1] = dParams[1] || {}
        if (dParams[0].datum || dParams[1].datum) dParams = dParams.map(p => { return calcParameter(p).data })
        if (dParams[0].datum || dParams[1].datum || dParams[0].variable || dParams[1].variable) return { data: param } // After simplifying math inside these parameters, quit if there is still data
        if (dParams[0].type === 49 || dParams[1].type === 49) return { data: param } // Return if either parameter slot is a conditional (to keep multiplying by conditional in secret blocks)
        function numVal (p) {
          return (Number(p.value) || 0)
        }
        const stringsSupported = /^([2-9]|\d{2,})\.\d+\.\d+$|^1\.(\d{2,}|[5-9])\.\d+$/.test(project.playerVersion)
        switch (param.datum.type) {
          case 4000:
            // Addition
            param.value = numVal(dParams[0]) + numVal(dParams[1])
            // Handle Strings
            // eslint-disable-next-line no-self-compare
            if (stringsSupported && (Number(dParams[0].value) !== Number(dParams[0].value) || Number(dParams[1].value) !== Number(dParams[1].value))) param.value = dParams[0].value + dParams[1].value
            break
          case 4001: // Subtraction
            param.value = numVal(dParams[0]) - numVal(dParams[1])
            break
          case 4002: // Multiplication
            param.value = numVal(dParams[0]) * numVal(dParams[1])
            break
          case 4003: // Division
            param.value = numVal(dParams[1]) === 0 ? 0 : numVal(dParams[0]) / numVal(dParams[1])
            // Treat it like Hopscotch would treat it - dividing by zero always returns zero
            break
          case 4005: // Power
            param.value = Math.pow(numVal(dParams[0]), numVal(dParams[1]))
            break
          case 4006: // Square Root
            param.value = Math.sqrt(numVal(dParams[0]))
            break
          case 4007: // Sine
            param.value = Math.sin(numVal(dParams[0]) * Math.PI / 180)
            break
          case 4008: // Cosine
            param.value = Math.cos(numVal(dParams[0]) * Math.PI / 180)
            break
          case 4009: // Round
            param.value = Math.round(numVal(dParams[0]))
            break
          case 4010: // Absolute Value
            param.value = Math.abs(numVal(dParams[0]))
            break
          case 4011: // Modulo
            param.value = numVal(dParams[1]) === 0 ? 0 : numVal(dParams[0]) % numVal(dParams[1])
            break
          case 4012: // Tangent
            param.value = Math.tan(numVal(dParams[0]) * Math.PI / 180)
            break
          case 4013: // Arcsine
            param.value = Math.asin(numVal(dParams[0])) * 180 / Math.PI
            break
          case 4014: // Arccosine
            param.value = Math.acos(numVal(dParams[0])) * 180 / Math.PI
            break
          case 4015: // Arctan
            param.value = Math.atan(numVal(dParams[0])) * 180 / Math.PI
            break
          case 4016: {
            // Max
            let first = dParams[0]
            let second = dParams[1]
            param.value = Math.max(numVal(first), numVal(second))
            first = first.value
            second = second.value
            // From HS Webplayer - modified to check player version, then test if either parameter is not a number
            // eslint-disable-next-line no-self-compare
            if (stringsSupported && (Number(first) !== Number(first) || Number(second) !== Number(second))) {
              const B = first.toString()
              const F = second.toString()
              param.value = B.localeCompare(F) >= 0 ? B : F
            }
            break
          }
          case 4017: {
            // Min
            let first = dParams[0]
            let second = dParams[1]
            param.value = Math.min(numVal(first), numVal(second))
            first = first.value
            second = second.value
            // From HS Webplayer - modified to check player version, then test if either parameter is not a number
            // eslint-disable-next-line no-self-compare
            if (stringsSupported && (Number(first) !== Number(first) || Number(second) !== Number(second))) {
              const B = first.toString()
              const F = second.toString()
              param.value = B.localeCompare(F) <= 0 ? B : F
            }
            break
          }
          case 4018: // Floor
            param.value = Math.floor(numVal(dParams[0]))
            break
          case 4019: // Ceil
            param.value = Math.ceil(numVal(dParams[0]))
            break
        }
        if (typeof param.value === 'number') {
          const sciPwr = Number(((String(param.value).match(/(e)[+-]\d+/) || [])[0] || '').replace(/^e/, ''))
          param.value = ((Math.round(Number(String(param.value).replace(/e.*$/, '')) * 10 ** 12) / 10 ** 12) * 10 ** sciPwr).toLocaleString('fullwide', { useGrouping: false })
        }
        param.value = String(param.value)
        delete param.datum
        count++
        return { data: param, changed: true }
      } else {
        if (param.datum.params) param.datum.params = param.datum.params.map(p => { return calcParameter(p).data })
        return { data: param }
      }
    }
    project.abilities = (project.abilities || []).map(a => {
      a.blocks = (a.blocks || []).map((b, index) => {
        if (!b.parameters) return b
        const blockBefore = Object.detach(b)
        let changed = false
        b.parameters = b.parameters.map(p => {
          const result = calcParameter(p)
          if (result.changed) changed = true
          return result.data
        })
        if (changed) {
          changedBlocks.push({
            abilityID: a.abilityID,
            index,
            oldData: blockBefore,
            newData: Object.detach(b)
          })
        }
        return b
      })
      return a
    })
    project.rules = (project.rules || []).map(r => {
      if (!r.parameters) return r
      const ruleBefore = Object.detach(r)
      let changed = false
      r.parameters = r.parameters.map(p => {
        const result = calcParameter(p)
        if (result.changed) changed = true
        return result.data
      })
      if (changed) {
        changedBlocks.push({
          oldData: ruleBefore,
          newData: Object.detach(b)
        })
      }
      return r
    })
    return { changedBlocks, count }
  }
}

ProjectEnhancer.init()
window.addEventListener('project-load', () => ProjectEnhancer.prefill(), { once: true })
