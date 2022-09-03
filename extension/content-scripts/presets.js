/* eslint-disable no-undef */
const PresetManager = {
  container: null,
  init: function () {
    const container = this.container = document.getElementById('_AE_code-management')
    const traits = [
      { id: 'presets', name: 'Presets', buttons: ['Import', 'Export'] },
      { id: 'deletedCode', name: 'Deleted Code', buttons: ['Remove'] },
      { id: 'unusedCode', name: 'Unused Code', buttons: ['Remove'] },
      { id: 'codeView', name: 'Code Viewing', buttons: ['Expand All'] }
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
        case 'presetsExport': PresetManager.openSavePresetDialog(); break
        case 'deletedCodeRemove': PresetManager.removeCode(); break
        case 'unusedCodeRemove': PresetManager.removeCode(true); break
        case 'codeViewExpandAll': PresetManager.printCode()
      }
    })
  },
  extendRevisionHandler: function () {
    //
  },
  printCode: function (root = document) {
    root.querySelectorAll('#blocks-container > div:not(.collapsible-container) > .block > .openbtn').forEach(s => expandBlock({ target: s }))
    const selector = '.collapsible > div:not(.collapsible-container, .disabled) > .block .openbtn:not(.print-keep-closed)'
    let buttons = root.querySelectorAll(selector)
    const clickedList = []
    while (buttons.length > 0) {
      buttons.forEach(b => {
        const parent = b.parentNode.parentNode
        const parentID = parent ? parent.getAttribute('data-id') : null
        if (clickedList.indexOf(parentID) !== -1) return b.classList.add('print-keep-closed')
        expandBlock({ target: b }, true)
        if (parentID) clickedList.push(parentID)
      })
      buttons = root.querySelectorAll(selector)
    }
  },
  projectItemChecklist: function (names, type) {
    return names.map(str => {
      const text = htmlEscape(str)
      return `<label><input type="checkbox" value="${text}" data-type="${type}"> ${text}</label>`
    })
  },
  openSavePresetDialog: function () {
    const dialog = document.createElement('dialog')
    const customBlockNames = hsProject.abilities.map(a => a.name).filter(name => !!name)
    const customRuleNames = hsProject.customRules.map(r => r.name)
    const projectSceneNames = hsProject.scenes.map(scene => scene.name);

    [
      ['Scenes', projectSceneNames],
      ['Custom Rules', customRuleNames],
      ['Custom Abilities', customBlockNames]
    ].forEach(([title, names], index) => {
      const type = ['scene', 'customRule', 'ability'][index]
      const listHTML = PresetManager.projectItemChecklist(names, type).join('\n')
      const container = document.createElement('div')
      const titleEl = document.createElement('h2')
      titleEl.innerText = title
      container.appendChild(titleEl)
      container.innerHTML += listHTML
      dialog.appendChild(container)
    })

    const { closeBtn, saveBtn } = AEAddButtons(dialog)
    closeBtn.addEventListener('click', () => {
      dialog.remove()
    })
    saveBtn.addEventListener('click', () => {
      const abilties = [...dialog.querySelectorAll('input:checked[data-type="ability"]')]
      const customRules = [...dialog.querySelectorAll('input:checked[data-type="customRule"]')]
      const scenes = [...dialog.querySelectorAll('input:checked[data-type="scene"]')]

      const names = {
        abilities: abilties.map(a => a.value),
        customRules: customRules.map(r => r.value),
        scenes: scenes.map(s => s.value)
      }

      const preset = this.savePreset(hsProject, names)
      const blob = new Blob([JSON.stringify(preset)], { type: 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${hsProject.title.replace(/\s/g, '_')}-${new Date().toISOString()}.hspre`
      anchor.click()

      dialog.remove()
    })
    dialog.classList.add('save-preset-dialog')

    document.body.appendChild(dialog)
    dialog.showModal()
  },
  removeCode: function (allUnused) {
    const start = performance.now()
    const scenes = hsProject.scenes.map(s => s.name)
    const customRules = allUnused ? [] : hsProject.customRules.map(cr => cr.name)
    const abilities = allUnused ? [] : hsProject.abilities.filter(a => !!a.name).map(a => a.name)
    const preset = this.savePreset(hsProject, { scenes, customRules, abilities }, allUnused)
    const removedCount = {
      abilities: hsProject.abilities.length - preset.abilities.length,
      rules: hsProject.rules.length - preset.rules.length,
      objects: hsProject.objects.length - preset.objects.length,
      eventParameters: hsProject.eventParameters.length - preset.eventParameters.length,
      customObjects: hsProject.customObjects.length - preset.customObjects.length,
      variables: hsProject.variables.length - preset.variables.length
    }
    hsProject.abilities = preset.abilities
    hsProject.rules = preset.rules
    hsProject.customRules = preset.customRules
    hsProject.objects = preset.objects
    hsProject.scenes = preset.scenes
    hsProject.eventParameters = preset.eventParameters
    if (allUnused) {
      hsProject.customObjects = preset.customObjects
      hsProject.remote_asset_urls = preset.remote_asset_urls
      hsProject.variables = preset.variables
    }
    const str = `%cRemoved all ${allUnused ? 'unused' : 'deleted'} code (${Math.round(performance.now() - start)}ms)%c\n` +
      `${removedCount.abilities} abilities, ${removedCount.rules} rules, ${removedCount.objects} objects,` +
      ` ${removedCount.eventParameters} event parameters, ${removedCount.customObjects} custom objects, ` +
      `${removedCount.variables} variables`
    const style1 = 'color: white; background: #357; padding: 4px 6px;'
    console.log(str, style1, 'color: #777; background: #0000')

    // Reload Keyboard
    const abilityContainer = document.querySelector('[data-blocksource="custom-abilities"]')
    const customRulesContainer = document.querySelector('[data-blocksource="custom-rules"]')
    loadBlockList(abilityContainer.parentNode, abilityContainer)
    loadBlockList(customRulesContainer.parentNode, customRulesContainer)
  },
  savePreset: function (project, namesDict, doCustomObjs) {
    doCustomObjs = doCustomObjs || false
    const presetProject = {
      abilities: [],
      eventParameters: [],
      objects: [],
      rules: [],
      customRules: [],
      customRuleInstances: [],
      variables: [],
      scenes: [],
      customObjects: [],
      remote_asset_urls: [],
      playerVersion: project.playerVersion
    }
    const abilityIdList = []
    const cRuleIdList = []
    const eventParamIdList = []
    const objIdList = []
    const ruleIdList = []
    const scnNameList = []
    const variableList = []
    const customObjList = []
    function pushAbility (id) {
      project.abilities.forEach(abl => {
        if (abl.abilityID === id && abilityIdList.indexOf(id) === -1) {
          abilityIdList.push(id)
          presetProject.abilities.push(abl)
          // Get Variables within this ability (this does not include traits)
          JSON.stringify(abl.blocks || []).replace(/.*?"datum":\{[^{}[\]]*?"variable":"([0-9a-fA-F-]*?)"[^{}[\]]*?\}(?:.(?!"datum"))*|^.*$/g, '$1\n')
            .replace(/\n$/, '').split('\n').forEach(vId => {
              if (variableList.indexOf(vId) === -1) {
                variableList.push(vId)
                project.variables.forEach(v => {
                  if (v.objectIdString === vId) presetProject.variables.push(v)
                })
              }
            })
          // For each control script, add the ability to the list
          JSON.stringify(abl.blocks || []).replace(/.*?"control(?:False)?Script":\{"abilityID":"([0-9a-fA-F-]*?)"\}(?:.(?!"control(?:False)?Script"))*|^.*$/g, '$1\n')
            .replace(/\n$/, '').split('\n').forEach(id => {
              pushAbility(id)
            })
          // For each custom image in a set image block, add the custom image
          if (doCustomObjs) {
            JSON.stringify(abl.blocks || []).replace(/.*?"datum":\{[^{}[\]]*?"customObject":"([0-9a-fA-F-]*?)"[^{}[\]]*?\}(?:.(?!"datum"))*|^.*$/g, '$1\n')
              .replace(/\n$/, '').split('\n').forEach(coId => {
                if (customObjList.indexOf(coId) === -1) {
                  customObjList.push(coId)
                }
              })
          }
        }
      })
    }
    function pushRule (id) {
      const rule = ProjectRule.get(id)
      if (rule && ruleIdList.indexOf(id) === -1) {
        ruleIdList.push(id)
        presetProject.rules.push(rule)
        // Push the ability that the rule contains
        pushAbility(rule.abilityID)
        JSON.stringify(rule).replace(/.*?\{[^{}[\]]*?(?:"type":50,[^{}[\]]*?"variable":"([0-9a-fA-F-]*?)"|"variable":"([0-9a-fA-F-]*?)",[^{}[\]]*?"type":50)[^{}[\]]*?\}(?:.(?!\{))*|^.*$/g, '$1$2\n')
          .replace(/\n$/, '').split('\n').forEach(epId => {
            if (eventParamIdList.indexOf(epId) === -1) {
              eventParamIdList.push(epId)
              const eventParam = ProjectEventParameter.get(epId)
              if (eventParam) presetProject.eventParameters.push(eventParam)
            }
          })
        // Get Variables within this rule block
        JSON.stringify(rule).replace(/.*?"datum":\{[^{}[\]]*?"variable":"([0-9a-fA-F-]*?)"[^{}[\]]*?\}(?:.(?!"datum"))*|^.*$/g, '$1\n')
          .replace(/\n$/, '').split('\n').forEach(vId => {
            if (variableList.indexOf(vId) === -1) {
              variableList.push(vId)
              const variable = ProjectVariable.get(vId)
              if (variable) presetProject.variables.push(variable)
            }
          })
        return
      }
      // If the rule is instead a custom rule instance, push that
      const crInstance = ProjectCustomRuleInstance.get(id)
      if (crInstance && !cRuleIdList.includes(id)) {
        cRuleIdList.push(id)
        presetProject.customRuleInstances.push(crInstance)
        const customRuleID = crInstance.customRuleID
        const customRule = ProjectCustomRule.get(customRuleID)
        if (!customRule || cRuleIdList.includes(customRuleID)) return
        pushRule(customRule.id)
        return
      }
      // If it's a custom rule
      const customRule = ProjectCustomRule.get(id)
      if (customRule && !cRuleIdList.includes(id)) {
        cRuleIdList.push(id)
        pushAbility(customRule.abilityID)
        presetProject.customRules.push(customRule);
        (customRule.rules || []).forEach(r => { pushRule(r) })
      }
    }
    function pushScene (name) {
      (project.scenes || []).forEach(scn => {
        if (scn.name === name && scnNameList.indexOf(name) === -1) {
          scnNameList.push(name)
          presetProject.scenes.push(scn)
          // Push the ability that the rule contains
          scn.objects.forEach(objId => {
            const stageObject = ProjectStageObject.get(objId)
            if (!stageObject || objIdList.includes(objId)) return
            objIdList.push(objId)
            presetProject.objects.push(stageObject)
            pushAbility(stageObject.abilityID)
            // Push all of the rules that the object contains
            const rules = stageObject.rules || []
            rules.forEach(r => { pushRule(r) })
            // If it is a custom object, add that to the list
            if (doCustomObjs && stageObject.customObjectID) {
              customObjList.push(stageObject.customObjectID)
            }
          })
        }
      })
    }
    project.abilities.forEach(abl => {
      if (namesDict.abilities.indexOf(abl.name) !== -1) {
        pushAbility(abl.abilityID)
      }
    })
    project.customRules.forEach(cr => {
      if (namesDict.customRules.indexOf(cr.name) !== -1) {
        pushAbility(cr.abilityID)
        pushRule(cr.id)
      }
    })
    project.scenes.forEach(scn => {
      if (namesDict.scenes.indexOf(scn.name) !== -1) {
        pushScene(scn.name)
      }
    })
    // For each Custom Object ID in the list, add the custom object and the remote asset url to the preset project
    if (doCustomObjs) {
      customObjList.forEach(id => {
        project.customObjects.forEach(co => {
          if (co.id === id) {
            presetProject.customObjects.push(co)
            presetProject.remote_asset_urls.push(co.fileName)
          }
        })
      })
    }
    return presetProject
  }
}

PresetManager.init()
