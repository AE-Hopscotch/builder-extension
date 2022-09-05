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
        case 'presetsImport': PresetManager.openLoadPresetDialog(); break
        case 'presetsExport': PresetManager.openSavePresetDialog(); break
        case 'deletedCodeRemove': PresetManager.removeCode(); break
        case 'unusedCodeRemove': PresetManager.removeCode(true); break
        case 'codeViewExpandAll': PresetManager.printCode()
      }
    })
  },
  extendRevisionHandler: function () {
    RevisionAction.undoAEOverrideProject = function (info) {
      hsProject = info.oldData
      PresetManager.reloadKeyboard()
      if (info.rerender) PresetManager.rerenderProject()
    }
    RevisionAction.redoAEOverrideProject = function (info) {
      hsProject = info.newData
      PresetManager.reloadKeyboard()
      if (info.rerender) PresetManager.rerenderProject()
    }
  },
  printCode: function (root = document) {
    if (ProjectCursor.current) ProjectCursor.current.destroy()
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
  consoleMainStyle: 'color: white; background: #357; padding: 4px 6px;',
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
    const oldProject = Object.detach(hsProject)
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
    const newProject = Object.detach(hsProject)
    this.createOverride(oldProject, newProject)
    const str = `%cRemoved all ${allUnused ? 'unused' : 'deleted'} code (${Math.round(performance.now() - start)}ms)%c\n` +
      `${removedCount.abilities} abilities, ${removedCount.rules} rules, ${removedCount.objects} objects,` +
      ` ${removedCount.eventParameters} event parameters, ${removedCount.customObjects} custom objects, ` +
      `${removedCount.variables} variables`
    console.log(str, this.consoleMainStyle, 'color: #777; background: #0000')

    this.reloadKeyboard()
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
  },
  presetArray: [],
  readFile: function (method, file) {
    const reader = new FileReader()
    return new Promise((resolve, reject) => {
      reader.onload = event => resolve(event.target.result)
      reader.onerror = error => reject(error)
      switch (method) {
        case 'text':
          reader.readAsText(file)
          break
        case 'dataURL':
          reader.readAsDataURL(file)
          break
        default:
          throw new TypeError('Unsupported Read Method')
      }
    })
  },
  presetFileChangeListener: async function () {
    let invalidPresetCount = 0
    const presetArray = []
    function contentHandler (content, filename, ext) {
      if (!/^\.(hspre|txt|json|hopscotch)$/.test(ext)) return invalidPresetCount++
      // These are the individual preset files
      let presetProject = {}
      try {
        // Old .hspre format
        presetProject = JSON.parse(Base64.decode(Base64.decode(content)).replace(/_\\EQUALS/g, '='))
      } catch (e) {
        try {
          // New .hspre format
          presetProject = JSON.parse(content)
        } catch (e) {
          return invalidPresetCount++
        }
      }
      presetArray.push(presetProject)
    }
    function handleFile (file, name) {
      return new Promise(resolve => {
        JSZip.loadAsync(file)
          .then(function (zip) {
            zip.forEach(function (relativePath, zipEntry) {
              zipEntry.async('string').then(function (fileData) {
                contentHandler(fileData, zipEntry.name.replace(/\..*?$/, ''), zipEntry.name.match(/\..*?$/)[0])
                resolve()
              })
            })
          }, function (e) {
            PresetManager.readFile('text', file).then(content => {
              contentHandler(content, name.replace(/\..*?$/, ''), name.match(/\..*?$/)[0])
              resolve()
            })
          })
      })
    }
    const files = document.getElementById('_AE_preset-import-file').files
    for (let i = 0; i < files.length; i++) {
      await handleFile(files[i], files[i].name)
    }
    this.presetArray = presetArray
    if (invalidPresetCount > 0) alert(invalidPresetCount + ' of your preset files ' + (invalidPresetCount === 1 ? 'is' : 'are') + ' corrupted')
  },
  openLoadPresetDialog: function () {
    const dialog = document.createElement('dialog')
    const header = document.createElement('h2')
    header.innerText = 'Choose .hspre, .hsprez, .hopscotch, or .zip files to merge with your project.'
    dialog.appendChild(header)
    this.presetArray = []
    const options = [
      ['newVarNames', 'Prefer the new variable names for duplicate IDs'],
      ['alwaysMerge', 'Merge the presets regardless of player versions', true],
      ['originalCreateDates', 'Use the original createdAt date for abilities rather than pushing setting new abilities as created last']
    ]
    options.forEach(([id, text, checked]) => {
      const label = document.createElement('label')
      const input = document.createElement('input')
      input.type = 'checkbox'
      input.name = input.id = id
      input.checked = checked
      label.appendChild(input)
      const span = document.createElement('span')
      span.innerText = text
      label.appendChild(span)
      dialog.appendChild(label)
    })

    const onIos = (!!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform)) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    const fileInput = document.createElement('input')
    fileInput.id = '_AE_preset-import-file'
    fileInput.type = 'file'
    fileInput.multiple = true
    if (!onIos) fileInput.accept = '.hopscotch,.hspre,.hsprez,.zip,.txt,.json'
    fileInput.addEventListener('change', () => this.presetFileChangeListener())

    dialog.appendChild(fileInput)

    const { closeBtn, saveBtn } = AEAddButtons(dialog)
    closeBtn.addEventListener('click', () => {
      dialog.remove()
    })
    saveBtn.innerText = 'Import'
    saveBtn.addEventListener('click', () => {
      // Create config from option checkbox IDs and values
      const config = Object.fromEntries(
        options.map(([id]) => {
          return [id, document.getElementById(id).checked]
        })
      )
      const start = performance.now() * 100
      const results = this.loadPreset(hsProject, this.presetArray, config)
      const str = `%cMerged ${results.mergeCount} preset${results.mergeCount === 1 ? '' : 's'} ` +
        `(${Math.round(performance.now() * 100 - start) / 100}ms)`
      console.log(str, this.consoleMainStyle)
      console.log(this.presetArray)

      dialog.remove()
    })
    dialog.classList.add('load-preset-dialog')

    document.body.appendChild(dialog)
    dialog.showModal()
  },
  loadPreset: function (project, presetArray, options) {
    const oldProject = Object.detach(project)
    options = options || {}
    presetArray = presetArray || []
    let newestCreateDate = 0
    function rgbToHsv (r, g, b) {
      r /= 255; g /= 255; b /= 255
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      let h; const v = max
      const d = max - min
      const s = max === 0 ? 0 : d / max
      if (max === min) {
        h = 0
      } else {
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break
          case g: h = (b - r) / d + 2; break
          case b: h = (r - g) / d + 4; break
        }
        h /= 6
      } return [h * 360, s * 100, v * 100]
    }
    function removeDuplicateHsIds (input, reverseMode) {
      const outputs = []
      const idList = []
      function addToList (i) {
        const myId = (input[i].id || input[i].objectID || input[i].abilityID || input[i].objectIdString)
        if (idList.indexOf(myId) === -1) {
          if (myId) idList.push(myId)
          outputs.push(input[i])
        } else {
          console.log(input[i], 'is a duplicate')
        }
      }
      if (reverseMode) {
        for (let i = input.length - 1; i >= 0; i--) { addToList(i) }
      } else {
        for (let i = 0; i < input.length; i++) { addToList(i) }
      }
      return outputs
    }
    if (typeof presetArray === 'string' && /bg-/.test(presetArray)) {
      const rgbColors = [0, 1, 2, 3].map(i => (options.colors[i] || 'FFFFFF').match(/[0-9A-F]{2}/gi).map(r => parseInt(r, 16)))
      let R1 = rgbColors[0][0]; let R2 = rgbColors[1][0]; let R3 = rgbColors[2][0]; let R4 = rgbColors[3][0]
      let G1 = rgbColors[0][1]; let G2 = rgbColors[1][1]; let G3 = rgbColors[2][1]; let G4 = rgbColors[3][1]
      let B1 = rgbColors[0][2]; let B2 = rgbColors[1][2]; let B3 = rgbColors[2][2]; let B4 = rgbColors[3][2]
      if (options.bgHsv) {
        const hsvColors = [[R1, G1, B1], [R2, G2, B2], [R3, G3, B3], [R4, G4, B4]].map(rgb => {
          return rgbToHsv(rgb[0], rgb[1], rgb[2])
        })
        R1 = hsvColors[0][0]
        R2 = hsvColors[1][0]
        R3 = hsvColors[2][0]
        R4 = hsvColors[3][0]
        G1 = hsvColors[0][1]
        G2 = hsvColors[1][1]
        G3 = hsvColors[2][1]
        G4 = hsvColors[3][1]
        B1 = hsvColors[0][2]
        B2 = hsvColors[1][2]
        B3 = hsvColors[2][2]
        B4 = hsvColors[3][2]
      }
      switch (presetArray) {
        case 'bg-quad':
          presetArray = [JSON.parse(`{"abilities":[{"abilityID":"CA33C272-33B3-659A-6AD8-D75FBC4C7B2E","blocks":[{"block_class":"method","description":"Set","type":45,"parameters":[{"defaultValue":"","value":"","key":"","datum":{"type":8003,"variable":"56EFA38C-7D18-4DFC-BDB2-054BA38153EE-1617-0000034D1C6941A1","description":"Variable"},"type":47},{"defaultValue":"10","value":"${R1}","key":"to","type":48}]},{"block_class":"method","description":"Set","type":45,"parameters":[{"defaultValue":"","value":"","key":"","datum":{"type":8003,"variable":"3226ED07-20DB-40B1-AC16-D6D15C297AF5-1617-0000034D1FD0ACB4","description":"Variable"},"type":47},{"defaultValue":"10","value":"${G1}","key":"to","type":48}]},{"block_class":"method","type":45,"description":"Set","parameters":[{"defaultValue":"","value":"","key":"","datum":{"type":8003,"variable":"F19B36B9-5B29-4E08-8C71-36AE4EF3C70A-1617-0000034D27A0C8AF","description":"Variable"},"type":47},{"defaultValue":"10","value":"${B1}","key":"to","type":48}]},{"block_class":"method","type":45,"description":"Set","parameters":[{"defaultValue":"","value":"","key":"","datum":{"type":8003,"variable":"2A985977-F799-4386-873F-1E99D430B068-1617-0000034D2B1AC765","description":"Variable"},"type":47},{"defaultValue":"10","value":"${R2}","key":"to","type":48}]},{"block_class":"method","description":"Set","type":45,"parameters":[{"defaultValue":"","value":"","key":"","datum":{"type":8003,"variable":"E4E4D92A-7B39-43CB-ABE5-39A5961355BC-1617-0000034D2DFBAA30","description":"Variable"},"type":47},{"defaultValue":"10","value":"${G2}","key":"to","type":48}]},{"block_class":"method","type":45,"description":"Set","parameters":[{"defaultValue":"","value":"","key":"","datum":{"type":8003,"variable":"3A755D58-F48D-48F6-AB6A-BB89CCB99196-1617-0000034D3170FDDD","description":"Variable"},"type":47},{"defaultValue":"10","value":"${B2}","key":"to","type":48}]},{"block_class":"method","description":"Set","type":45,"parameters":[{"defaultValue":"","value":"","key":"","datum":{"type":8003,"variable":"EA57774B-D0D5-4766-99D1-649A3A32AC9D-1617-00000352069B9381","description":"Variable"},"type":47},{"defaultValue":"10","value":"${R3}","key":"to","type":48}]},{"block_class":"method","type":45,"description":"Set","parameters":[{"defaultValue":"","value":"","key":"","datum":{"type":8003,"variable":"D66504A8-20EB-4D20-8250-334B8D2A4D63-1617-000003520A660AB2","description":"Variable"},"type":47},{"defaultValue":"10","value":"${G3}","key":"to","type":48}]},{"block_class":"method","description":"Set","type":45,"parameters":[{"defaultValue":"","value":"","key":"","datum":{"type":8003,"variable":"6A2669EC-43B6-4E04-B7EF-900A6C0703AB-1617-0000035210581D61","description":"Variable"},"type":47},{"defaultValue":"10","value":"${B3}","key":"to","type":48}]},{"block_class":"method","type":45,"description":"Set","parameters":[{"defaultValue":"","value":"","key":"","datum":{"type":8003,"variable":"6AD4CA77-C6EC-4991-AB29-5FACB92E7405-1617-00000352148749BA","description":"Variable"},"type":47},{"defaultValue":"10","value":"${R4}","key":"to","type":48}]},{"block_class":"method","description":"Set","type":45,"parameters":[{"defaultValue":"","value":"","key":"","datum":{"type":8003,"variable":"90BD8917-D494-46E5-B2DD-EFCA155F10D4-1617-0000035218B6B72C","description":"Variable"},"type":47},{"defaultValue":"10","value":"${G4}","key":"to","type":48}]},{"block_class":"method","type":45,"description":"Set","parameters":[{"defaultValue":"","value":"","key":"","datum":{"type":8003,"variable":"DBC97C9B-F8C1-4585-9CF9-551B3589277C-1617-000003521C401B51","description":"Variable"},"type":47},{"defaultValue":"10","value":"${B4}","key":"to","type":48}]},{"block_class":"method","type":53,"description":"Create a Clone of This Object","parameters":[{"defaultValue":"5","value":"2050","key":"times","datum":{"block_class":"operator","type":4002,"description":"×","params":[{"defaultValue":"2","value":"2050","key":"","datum":{"HSTraitIDKey":"ED4EF3D0-CFD2-4279-B028-8EA2F783680F-1890-0000036D44911DC5","HSTraitTypeKey":3000,"description":"Width"},"type":42},{"defaultValue":"3","value":"2","key":"×","type":42}]},"type":42}]}],"createdAt":0},{"abilityID":"880347C8-D013-0D6D-877E-8A6CF35E598B","blocks":[{"block_class":"method","description":"Set Position","type":41,"parameters":[{"defaultValue":"200","value":"100","key":"to x","datum":{"block_class":"operator","type":4000,"description":"+","params":[{"defaultValue":"2","value":"-1","key":"","type":42},{"defaultValue":"3","value":"","key":"+","datum":{"block_class":"operator","type":4003,"description":"÷","params":[{"defaultValue":"5","value":"5","key":"","datum":{"HSTraitTypeKey":2006,"HSTraitIDKey":"1B3B12AB-C1F2-4A67-AC0A-F7C332CA4D67-1890-0000036D448872AC","HSTraitObjectParameterTypeKey":8004,"description":"Clone Index"},"type":42},{"defaultValue":"2","value":"2","key":"÷","type":42}]},"type":42}]},"type":42},{"defaultValue":"200","value":"512","key":"y","datum":{"block_class":"operator","type":4002,"description":"×","params":[{"defaultValue":"2","value":"","key":"","datum":{"HSTraitIDKey":"1648035F-CF24-430D-96AC-E3B4E3BB53B3-1890-0000036D4488A492","HSTraitTypeKey":3001,"description":"Height"},"type":42},{"defaultValue":"3","value":"3","key":"×","datum":{"block_class":"operator","type":4011,"description":"%","params":[{"defaultValue":"5","value":"5","key":"","datum":{"HSTraitTypeKey":2006,"HSTraitIDKey":"1B3B12AB-C1F2-4A67-AC0A-F7C332CA4D67-1890-0000036D448872AC","HSTraitObjectParameterTypeKey":8004,"description":"Clone Index"},"type":42},{"defaultValue":"2","value":"2","key":"%","type":42}]},"type":42}]},"type":42}]},{"controlScript":{"abilityID":"CED22272-4146-FB8C-D1E6-A3F8253183D3"},"block_class":"control","description":"Draw a Trail","type":26,"parameters":[{"defaultValue":"HSB(288,57,43)","value":"HSB(288,57,43)","key":"color","datum":{"block_class":"operator","type":${options.bgHsv ? 5002 : 5001},"description":"${options.bgHsv ? 'HSB' : 'RGB'}","params":[{"defaultValue":"34","value":"","key":"${options.bgHsv ? 'H' : 'R'}","datum":{"block_class":"operator","type":4000,"description":"+","params":[{"defaultValue":"2","value":"2","key":"","datum":{"block_class":"operator","type":4002,"description":"×","params":[{"defaultValue":"2","value":"2","key":"","datum":{"block_class":"operator","type":4000,"description":"+","params":[{"defaultValue":"2","value":"","key":"","datum":{"type":8003,"variable":"56EFA38C-7D18-4DFC-BDB2-054BA38153EE-1617-0000034D1C6941A1","description":"Variable"},"type":42},{"defaultValue":"3","value":"","key":"+","datum":{"block_class":"operator","type":4003,"description":"÷","params":[{"defaultValue":"5","value":"","key":"","datum":{"block_class":"operator","type":4002,"description":"×","params":[{"defaultValue":"2","value":"2","key":"","datum":{"HSTraitTypeKey":2001,"HSTraitIDKey":"6E20CB5F-D82A-40A5-A1AE-734966110C46-1890-0000036D44896C8D","HSTraitObjectParameterTypeKey":8004,"description":"X Position"},"type":42},{"defaultValue":"3","value":"","key":"×","datum":{"block_class":"operator","type":4001,"description":"−","params":[{"defaultValue":"5","value":"","key":"","datum":{"type":8003,"variable":"2A985977-F799-4386-873F-1E99D430B068-1617-0000034D2B1AC765","description":"Variable"},"type":42},{"defaultValue":"2","value":"","key":"−","datum":{"type":8003,"variable":"56EFA38C-7D18-4DFC-BDB2-054BA38153EE-1617-0000034D1C6941A1","description":"Variable"},"type":42}]},"type":42}]},"type":42},{"defaultValue":"2","value":"128","key":"÷","datum":{"HSTraitIDKey":"63F5C64C-1950-4BF3-8A85-25493700BD02-1890-0000036D4489A6C6","HSTraitTypeKey":3000,"description":"Width"},"type":42}]},"type":42}]},"type":42},{"defaultValue":"3","value":"","key":"×","datum":{"block_class":"operator","type":4011,"description":"%","params":[{"defaultValue":"5","value":"5","key":"","datum":{"HSTraitTypeKey":2006,"HSTraitIDKey":"C3929730-4603-447B-8DCB-3E1846843F5E-1890-0000036D4489C294","HSTraitObjectParameterTypeKey":8004,"description":"Clone Index"},"type":42},{"defaultValue":"2","value":"2","key":"%","type":42}]},"type":42}]},"type":42},{"defaultValue":"3","value":"3","key":"+","datum":{"block_class":"operator","type":4002,"description":"×","params":[{"defaultValue":"2","value":"2","key":"","datum":{"block_class":"operator","type":4000,"description":"+","params":[{"defaultValue":"2","value":"","key":"","datum":{"type":8003,"variable":"EA57774B-D0D5-4766-99D1-649A3A32AC9D-1617-00000352069B9381","description":"Variable"},"type":42},{"defaultValue":"3","value":"","key":"+","datum":{"block_class":"operator","type":4003,"description":"÷","params":[{"defaultValue":"5","value":"","key":"","datum":{"block_class":"operator","type":4002,"description":"×","params":[{"defaultValue":"2","value":"2","key":"","datum":{"HSTraitTypeKey":2001,"HSTraitIDKey":"593F6FA8-1673-4651-AE9C-097FC5F20586-1890-0000036D448A0AB8","HSTraitObjectParameterTypeKey":8004,"description":"X Position"},"type":42},{"defaultValue":"3","value":"","key":"×","datum":{"block_class":"operator","type":4001,"description":"−","params":[{"defaultValue":"5","value":"","key":"","datum":{"type":8003,"variable":"6AD4CA77-C6EC-4991-AB29-5FACB92E7405-1617-00000352148749BA","description":"Variable"},"type":42},{"defaultValue":"2","value":"","key":"−","datum":{"type":8003,"variable":"EA57774B-D0D5-4766-99D1-649A3A32AC9D-1617-00000352069B9381","description":"Variable"},"type":42}]},"type":42}]},"type":42},{"defaultValue":"2","value":"128","key":"÷","datum":{"HSTraitTypeKey":3000,"HSTraitIDKey":"A8D3631C-E789-4979-B2EC-282FECBA9E7F-1890-0000036D448A4235","description":"Width"},"type":42}]},"type":42}]},"type":42},{"defaultValue":"3","value":"","key":"×","datum":{"block_class":"operator","type":4011,"description":"%","params":[{"defaultValue":"5","value":"5","key":"","datum":{"block_class":"operator","type":4000,"description":"+","params":[{"defaultValue":"2","value":"5","key":"","datum":{"HSTraitTypeKey":2006,"HSTraitIDKey":"1C6E00F0-68DA-4FB1-8271-328895335C04-1890-0000036D448A6CE4","HSTraitObjectParameterTypeKey":8004,"description":"Clone Index"},"type":42},{"defaultValue":"3","value":"1","key":"+","type":42}]},"type":42},{"defaultValue":"2","value":"2","key":"%","type":42}]},"type":42}]},"type":42}]},"type":42},{"defaultValue":"246","value":"246","key":"${options.bgHsv ? 'S' : 'G'}","datum":{"block_class":"operator","type":4000,"description":"+","params":[{"defaultValue":"2","value":"2","key":"","datum":{"block_class":"operator","type":4002,"description":"×","params":[{"defaultValue":"2","value":"2","key":"","datum":{"block_class":"operator","type":4000,"description":"+","params":[{"defaultValue":"2","value":"","key":"","datum":{"type":8003,"variable":"3226ED07-20DB-40B1-AC16-D6D15C297AF5-1617-0000034D1FD0ACB4","description":"Variable"},"type":42},{"defaultValue":"3","value":"","key":"+","datum":{"block_class":"operator","type":4003,"description":"÷","params":[{"defaultValue":"5","value":"","key":"","datum":{"block_class":"operator","type":4002,"description":"×","params":[{"defaultValue":"2","value":"2","key":"","datum":{"HSTraitTypeKey":2001,"HSTraitIDKey":"531A3BFE-E614-4803-94A0-AC29C2BDCDA9-1890-0000036D448AE3C6","HSTraitObjectParameterTypeKey":8004,"description":"X Position"},"type":42},{"defaultValue":"3","value":"","key":"×","datum":{"block_class":"operator","type":4001,"description":"−","params":[{"defaultValue":"5","value":"","key":"","datum":{"type":8003,"variable":"E4E4D92A-7B39-43CB-ABE5-39A5961355BC-1617-0000034D2DFBAA30","description":"Variable"},"type":42},{"defaultValue":"2","value":"","key":"−","datum":{"type":8003,"variable":"3226ED07-20DB-40B1-AC16-D6D15C297AF5-1617-0000034D1FD0ACB4","description":"Variable"},"type":42}]},"type":42}]},"type":42},{"defaultValue":"2","value":"128","key":"÷","datum":{"HSTraitIDKey":"EC508648-62B7-4440-A300-F69B9660F06D-1890-0000036D448B20C6","HSTraitTypeKey":3000,"description":"Width"},"type":42}]},"type":42}]},"type":42},{"defaultValue":"3","value":"","key":"×","datum":{"block_class":"operator","type":4011,"description":"%","params":[{"defaultValue":"5","value":"5","key":"","datum":{"HSTraitTypeKey":2006,"HSTraitIDKey":"35AEE991-2049-404C-B245-9D0137DE3F27-1890-0000036D448B3C80","HSTraitObjectParameterTypeKey":8004,"description":"Clone Index"},"type":42},{"defaultValue":"2","value":"2","key":"%","type":42}]},"type":42}]},"type":42},{"defaultValue":"3","value":"3","key":"+","datum":{"block_class":"operator","type":4002,"description":"×","params":[{"defaultValue":"2","value":"2","key":"","datum":{"block_class":"operator","type":4000,"description":"+","params":[{"defaultValue":"2","value":"","key":"","datum":{"type":8003,"variable":"D66504A8-20EB-4D20-8250-334B8D2A4D63-1617-000003520A660AB2","description":"Variable"},"type":42},{"defaultValue":"3","value":"","key":"+","datum":{"block_class":"operator","type":4003,"description":"÷","params":[{"defaultValue":"5","value":"","key":"","datum":{"block_class":"operator","type":4002,"description":"×","params":[{"defaultValue":"2","value":"2","key":"","datum":{"HSTraitTypeKey":2001,"HSTraitIDKey":"73354278-E0AF-4927-871D-BC6A0DEC191E-1890-0000036D448B85D9","HSTraitObjectParameterTypeKey":8004,"description":"X Position"},"type":42},{"defaultValue":"3","value":"","key":"×","datum":{"block_class":"operator","type":4001,"description":"−","params":[{"defaultValue":"5","value":"","key":"","datum":{"type":8003,"variable":"90BD8917-D494-46E5-B2DD-EFCA155F10D4-1617-0000035218B6B72C","description":"Variable"},"type":42},{"defaultValue":"2","value":"","key":"−","datum":{"type":8003,"variable":"D66504A8-20EB-4D20-8250-334B8D2A4D63-1617-000003520A660AB2","description":"Variable"},"type":42}]},"type":42}]},"type":42},{"defaultValue":"2","value":"128","key":"÷","datum":{"HSTraitTypeKey":3000,"HSTraitIDKey":"56E686CA-E4D5-4DF3-8658-0DB577B98566-1890-0000036D448BBF45","description":"Width"},"type":42}]},"type":42}]},"type":42},{"defaultValue":"3","value":"","key":"×","datum":{"block_class":"operator","type":4011,"description":"%","params":[{"defaultValue":"5","value":"5","key":"","datum":{"block_class":"operator","type":4000,"description":"+","params":[{"defaultValue":"2","value":"5","key":"","datum":{"HSTraitTypeKey":2006,"HSTraitIDKey":"2BC968A5-4BC0-4715-8D61-7A5D099C09F7-1890-0000036D448BF7C9","HSTraitObjectParameterTypeKey":8004,"description":"Clone Index"},"type":42},{"defaultValue":"3","value":"1","key":"+","type":42}]},"type":42},{"defaultValue":"2","value":"2","key":"%","type":42}]},"type":42}]},"type":42}]},"type":42},{"defaultValue":"217","value":"217","key":"B","datum":{"block_class":"operator","type":4000,"description":"+","params":[{"defaultValue":"2","value":"2","key":"","datum":{"block_class":"operator","type":4002,"description":"×","params":[{"defaultValue":"2","value":"2","key":"","datum":{"block_class":"operator","type":4000,"description":"+","params":[{"defaultValue":"2","value":"","key":"","datum":{"type":8003,"variable":"F19B36B9-5B29-4E08-8C71-36AE4EF3C70A-1617-0000034D27A0C8AF","description":"Variable"},"type":42},{"defaultValue":"3","value":"","key":"+","datum":{"block_class":"operator","type":4003,"description":"÷","params":[{"defaultValue":"5","value":"","key":"","datum":{"block_class":"operator","type":4002,"description":"×","params":[{"defaultValue":"2","value":"2","key":"","datum":{"HSTraitTypeKey":2001,"HSTraitIDKey":"3B0854F8-BF3E-4921-9D99-A7612BDE8999-1890-0000036D448C533D","HSTraitObjectParameterTypeKey":8004,"description":"X Position"},"type":42},{"defaultValue":"3","value":"","key":"×","datum":{"block_class":"operator","type":4001,"description":"−","params":[{"defaultValue":"5","value":"","key":"","datum":{"type":8003,"variable":"3A755D58-F48D-48F6-AB6A-BB89CCB99196-1617-0000034D3170FDDD","description":"Variable"},"type":42},{"defaultValue":"2","value":"","key":"−","datum":{"type":8003,"variable":"F19B36B9-5B29-4E08-8C71-36AE4EF3C70A-1617-0000034D27A0C8AF","description":"Variable"},"type":42}]},"type":42}]},"type":42},{"defaultValue":"2","value":"128","key":"÷","datum":{"HSTraitTypeKey":3000,"HSTraitIDKey":"002334C0-C15B-46DB-A88B-1D201B71E518-1890-0000036D448CA0C9","description":"Width"},"type":42}]},"type":42}]},"type":42},{"defaultValue":"3","value":"","key":"×","datum":{"block_class":"operator","type":4011,"description":"%","params":[{"defaultValue":"5","value":"5","key":"","datum":{"HSTraitTypeKey":2006,"HSTraitIDKey":"B381660D-E9B3-43CA-8E10-60873D919088-1890-0000036D448CD71B","HSTraitObjectParameterTypeKey":8004,"description":"Clone Index"},"type":42},{"defaultValue":"2","value":"2","key":"%","type":42}]},"type":42}]},"type":42},{"defaultValue":"3","value":"3","key":"+","datum":{"block_class":"operator","type":4002,"description":"×","params":[{"defaultValue":"2","value":"2","key":"","datum":{"block_class":"operator","type":4000,"description":"+","params":[{"defaultValue":"2","value":"","key":"","datum":{"type":8003,"variable":"6A2669EC-43B6-4E04-B7EF-900A6C0703AB-1617-0000035210581D61","description":"Variable"},"type":42},{"defaultValue":"3","value":"","key":"+","datum":{"block_class":"operator","type":4003,"description":"÷","params":[{"defaultValue":"5","value":"","key":"","datum":{"block_class":"operator","type":4002,"description":"×","params":[{"defaultValue":"2","value":"2","key":"","datum":{"HSTraitTypeKey":2001,"HSTraitIDKey":"EC14EC62-E6E7-427A-840F-D498C3C4F444-1890-0000036D448D29D6","HSTraitObjectParameterTypeKey":8004,"description":"X Position"},"type":42},{"defaultValue":"3","value":"","key":"×","datum":{"block_class":"operator","type":4001,"description":"−","params":[{"defaultValue":"5","value":"","key":"","datum":{"type":8003,"variable":"DBC97C9B-F8C1-4585-9CF9-551B3589277C-1617-000003521C401B51","description":"Variable"},"type":42},{"defaultValue":"2","value":"","key":"−","datum":{"type":8003,"variable":"6A2669EC-43B6-4E04-B7EF-900A6C0703AB-1617-0000035210581D61","description":"Variable"},"type":42}]},"type":42}]},"type":42},{"defaultValue":"2","value":"128","key":"÷","datum":{"HSTraitIDKey":"BF6D83AE-5994-423E-BBF6-593741538C23-1890-0000036D448D620E","HSTraitTypeKey":3000,"description":"Width"},"type":42}]},"type":42}]},"type":42},{"defaultValue":"3","value":"","key":"×","datum":{"block_class":"operator","type":4011,"description":"%","params":[{"defaultValue":"5","value":"5","key":"","datum":{"block_class":"operator","type":4000,"description":"+","params":[{"defaultValue":"2","value":"5","key":"","datum":{"HSTraitTypeKey":2006,"HSTraitIDKey":"6439460F-0CBD-4085-8EDA-F0E8D8E51CE7-1890-0000036D448D9886","HSTraitObjectParameterTypeKey":8004,"description":"Clone Index"},"type":42},{"defaultValue":"3","value":"1","key":"+","type":42}]},"type":42},{"defaultValue":"2","value":"2","key":"%","type":42}]},"type":42}]},"type":42}]},"type":42}]},"type":44},{"defaultValue":"10","value":"2","key":"width","type":43}]},{"block_class":"method","type":55,"description":"Destroy"}],"createdAt":0},{"createdAt":0,"blocks":[{"block_class":"method","description":"Set Position","type":41,"parameters":[{"defaultValue":"200","value":"","key":"to x","datum":{"block_class":"operator","type":4000,"description":"+","params":[{"defaultValue":"2","value":"2","key":"","datum":{"HSTraitTypeKey":2001,"HSTraitIDKey":"0F1E913E-E14B-4D7E-ABD0-4CC7ABB5E03F-1890-0000036D448E3920","HSTraitObjectParameterTypeKey":8004,"description":"X Position"},"type":42},{"defaultValue":"3","value":"0.5","key":"+","type":42}]},"type":42},{"defaultValue":"200","value":"256","key":"y","datum":{"block_class":"operator","type":4001,"description":"−","params":[{"defaultValue":"5","value":"","key":"","datum":{"HSTraitTypeKey":3001,"HSTraitIDKey":"E3FE84F9-6ED6-41D5-82B2-DE15D7179AC4-1890-0000036D448E573F","description":"Height"},"type":42},{"defaultValue":"2","value":"","key":"−","datum":{"HSTraitTypeKey":2002,"HSTraitIDKey":"5FB18E01-0584-4103-B44E-18BF1A076F38-1890-0000036D448E66F8","HSTraitObjectParameterTypeKey":8004,"description":"Y Position"},"type":42}]},"type":42}]}],"abilityID":"CED22272-4146-FB8C-D1E6-A3F8253183D3"}],"eventParameters":[],"objects":[],"rules":[{"ruleBlockType":6000,"id":"DA6486B1-F78F-E495-F1CC-3A8C2F4E2C53","abilityID":"CA33C272-33B3-659A-6AD8-D75FBC4C7B2E","name":"","objectID":"","parameters":[{"datum":{"type":7000,"block_class":"operator","description":"Game Starts"},"value":"","key":"","defaultValue":"","type":52}]},{"ruleBlockType":6000,"id":"3DFC0616-9061-E503-7395-397A0A48205C","abilityID":"880347C8-D013-0D6D-877E-8A6CF35E598B","objectID":"","name":"","parameters":[{"datum":{"type":7015,"block_class":"operator","description":"Object is Cloned"},"value":"","key":"","defaultValue":"","type":52}]}],"customRules":[{"name":"${options.name}","rules":["DA6486B1-F78F-E495-F1CC-3A8C2F4E2C53","3DFC0616-9061-E503-7395-397A0A48205C"],"id":"23FE2F00-5259-7B01-E3E9-41C8A62DF2E2"}],"variables":[{"type":8003,"objectIdString":"56EFA38C-7D18-4DFC-BDB2-054BA38153EE-1617-0000034D1C6941A1","name":"R1"},{"name":"G1","objectIdString":"3226ED07-20DB-40B1-AC16-D6D15C297AF5-1617-0000034D1FD0ACB4","type":8003},{"type":8003,"objectIdString":"F19B36B9-5B29-4E08-8C71-36AE4EF3C70A-1617-0000034D27A0C8AF","name":"B1"},{"type":8003,"name":"R2","objectIdString":"2A985977-F799-4386-873F-1E99D430B068-1617-0000034D2B1AC765"},{"type":8003,"objectIdString":"E4E4D92A-7B39-43CB-ABE5-39A5961355BC-1617-0000034D2DFBAA30","name":"G2"},{"type":8003,"objectIdString":"3A755D58-F48D-48F6-AB6A-BB89CCB99196-1617-0000034D3170FDDD","name":"B2"},{"type":8003,"objectIdString":"EA57774B-D0D5-4766-99D1-649A3A32AC9D-1617-00000352069B9381","name":"R3"},{"type":8003,"objectIdString":"D66504A8-20EB-4D20-8250-334B8D2A4D63-1617-000003520A660AB2","name":"G3"},{"name":"B3","type":8003,"objectIdString":"6A2669EC-43B6-4E04-B7EF-900A6C0703AB-1617-0000035210581D61"},{"type":8003,"objectIdString":"6AD4CA77-C6EC-4991-AB29-5FACB92E7405-1617-00000352148749BA","name":"R4"},{"type":8003,"objectIdString":"90BD8917-D494-46E5-B2DD-EFCA155F10D4-1617-0000035218B6B72C","name":"G4"},{"type":8003,"objectIdString":"DBC97C9B-F8C1-4585-9CF9-551B3589277C-1617-000003521C401B51","name":"B4"}],"scenes":[],"customObjects":[],"remote_asset_urls":[],"playerVersion":"1.5.0"}`)]
          break
        case 'bg-radial':
          R3 = R1; R1 = R2; R2 = R3; G3 = G1; G1 = G2; G2 = G3; B3 = B1; B1 = B2; B2 = B3
          presetArray = [JSON.parse(`{"abilities":[{"abilityID":"8371E1B0-C070-99EE-707C-28DC8AEC2720","blocks":[{"controlScript":{"abilityID":"9234E040-E148-B230-0792-76129705A399"},"block_class":"control","type":26,"description":"Draw a Trail","parameters":[{"defaultValue":"","value":"","key":"color","datum":{"block_class":"operator","type":${options.bgHsv ? 5002 : 5001},"description":"${options.bgHsv ? 'HSB' : 'RGB'}","params":[{"defaultValue":"","value":"${R1}","key":"${options.bgHsv ? 'H' : 'R'}","type":42},{"defaultValue":"","value":"${G1}","key":"${options.bgHsv ? 'S' : 'G'}","type":42},{"defaultValue":"","value":"${B1}","key":"B","type":42}]},"type":44},{"defaultValue":"10","value":"4096","key":"width","type":43}]},{"block_class":"method","description":"Create a Clone of This Object","type":53,"parameters":[{"defaultValue":"5","value":"","key":"times","datum":{"block_class":"operator","type":4003,"description":"÷","params":[{"defaultValue":"5","value":"5","key":"","datum":{"HSTraitIDKey":"1612DCED-3F1E-4FB9-8E8D-92A781AACF60-1890-0000036E68C2C325","HSTraitTypeKey":3000,"description":"Width"},"type":42},{"defaultValue":"2","value":"4","key":"÷","type":42}]},"type":42}]}],"createdAt":0},{"createdAt":0,"blocks":[{"block_class":"method","type":41,"description":"Set Position","parameters":[{"defaultValue":"200","value":"0","key":"to x","type":42},{"defaultValue":"200","value":"0","key":"y","type":42}]}],"abilityID":"9234E040-E148-B230-0792-76129705A399"},{"abilityID":"CFEF83AF-CEAD-B4D4-90F7-13CAE236D9CE","blocks":[{"block_class":"method","type":41,"description":"Set Position","parameters":[{"defaultValue":"200","value":"200","key":"to x","datum":{"block_class":"operator","type":4003,"description":"÷","params":[{"defaultValue":"5","value":"5","key":"","datum":{"HSTraitIDKey":"D4AC7E7B-CF9A-4110-8139-A1F2833DDB9E-1890-0000036E68D46224","HSTraitTypeKey":3000,"description":"Width"},"type":42},{"defaultValue":"2","value":"2","key":"÷","type":42}]},"type":42},{"defaultValue":"200","value":"","key":"y","datum":{"block_class":"operator","type":4003,"description":"÷","params":[{"defaultValue":"5","value":"5","key":"","datum":{"HSTraitIDKey":"AEBF3710-D38E-4610-A959-6CE0EFB66ED1-1890-0000036E68D47682","HSTraitTypeKey":3001,"description":"Height"},"type":42},{"defaultValue":"2","value":"2","key":"÷","type":42}]},"type":42}]},{"block_class":"method","description":"Set Angle","type":39,"parameters":[{"defaultValue":"30","value":"0","key":"","datum":{"block_class":"operator","type":4003,"description":"÷","params":[{"defaultValue":"5","value":"5","key":"","datum":{"block_class":"operator","type":4003,"description":"÷","params":[{"defaultValue":"5","value":"5","key":"","datum":{"HSTraitTypeKey":2006,"HSTraitIDKey":"F9F79F8E-1C17-4C15-800C-65CFF3A800F5-1890-0000036E68D49E81","HSTraitObjectParameterTypeKey":8004,"description":"Clone Index"},"type":42},{"defaultValue":"2","value":"100","key":"÷","type":42}]},"type":42},{"defaultValue":"2","value":"2","key":"÷","datum":{"block_class":"operator","type":4003,"description":"÷","params":[{"defaultValue":"5","value":"5","key":"","datum":{"HSTraitIDKey":"B75F6DB7-A383-4D7C-9AC9-EB8491ADA334-1890-0000036E68D4BAD7","HSTraitTypeKey":3000,"description":"Width"},"type":42},{"defaultValue":"2","value":"4","key":"÷","type":42}]},"type":42}]},"type":42}]},{"description":"Draw a Trail","block_class":"control","type":26,"controlScript":{"abilityID":"00E544BB-F2E0-002E-9CC0-545D651DC77B"},"parameters":[{"defaultValue":"","value":"","key":"color","datum":{"block_class":"operator","type":${options.bgHsv ? 5002 : 5001},"description":"${options.bgHsv ? 'HSB' : 'RGB'}","params":[{"defaultValue":"","value":"","key":"${options.bgHsv ? 'H' : 'R'}","datum":{"block_class":"operator","type":4000,"description":"+","params":[{"defaultValue":"","value":"${R1}","key":"","type":42},{"defaultValue":"","value":"","key":"+","datum":{"block_class":"operator","type":4002,"description":"×","params":[{"defaultValue":"","value":"","key":"","datum":{"HSTraitTypeKey":2000,"HSTraitIDKey":"9F3219DA-B5AE-45A9-959F-553BFAA98184-1890-0000036E68D4E3B0","HSTraitObjectParameterTypeKey":8004,"description":"Rotation"},"type":42},{"defaultValue":"","value":"${(R2 - R1) * 100}","key":"×","type":42}]},"type":42}]},"type":42},{"defaultValue":"","value":"","key":"${options.bgHsv ? 'S' : 'G'}","datum":{"block_class":"operator","type":4000,"description":"+","params":[{"defaultValue":"","value":"${G1}","key":"","type":42},{"defaultValue":"","value":"","key":"+","datum":{"block_class":"operator","type":4002,"description":"×","params":[{"defaultValue":"","value":"","key":"","datum":{"HSTraitTypeKey":2000,"HSTraitIDKey":"8B2F7201-9183-403E-983C-FED345646E15-1890-0000036E68D4FAA8","HSTraitObjectParameterTypeKey":8004,"description":"Rotation"},"type":42},{"defaultValue":"","value":"${(G2 - G1) * 100}","key":"×","type":42}]},"type":42}]},"type":42},{"defaultValue":"96","value":"100","key":"B","datum":{"block_class":"operator","type":4000,"description":"+","params":[{"defaultValue":"","value":"${B1}","key":"","type":42},{"defaultValue":"","value":"","key":"+","datum":{"block_class":"operator","type":4002,"description":"×","params":[{"defaultValue":"","value":"","key":"","datum":{"HSTraitTypeKey":2000,"HSTraitIDKey":"1597696D-010F-4AD5-A1D8-B4897D48DF6C-1890-0000036E68D51958","HSTraitObjectParameterTypeKey":8004,"description":"Rotation"},"type":42},{"defaultValue":"","value":"${(B2 - B1) * 100}","key":"×","type":42}]},"type":42}]},"type":42}]},"type":44},{"defaultValue":"10","value":"","key":"width","datum":{"block_class":"operator","type":4001,"description":"−","params":[{"defaultValue":"5","value":"5","key":"","datum":{"HSTraitIDKey":"954B8E75-CA13-4F58-859E-92B76AE6A9BE-1890-0000036E68D52A3B","HSTraitTypeKey":3000,"description":"Width"},"type":42},{"defaultValue":"2","value":"2","key":"−","datum":{"block_class":"operator","type":4002,"description":"×","params":[{"defaultValue":"2","value":"2","key":"","datum":{"HSTraitTypeKey":2006,"HSTraitIDKey":"0729ED12-9EC2-49C8-9EDF-6AE1DBDE0A4C-1890-0000036E68D538E5","HSTraitObjectParameterTypeKey":8004,"description":"Clone Index"},"type":42},{"defaultValue":"3","value":"4","key":"×","type":42}]},"type":42}]},"type":43}]}],"createdAt":0},{"createdAt":0,"blocks":[{"block_class":"method","type":41,"description":"Set Position","parameters":[{"defaultValue":"200","value":"200","key":"to x","datum":{"block_class":"operator","type":4003,"description":"÷","params":[{"defaultValue":"5","value":"5","key":"","datum":{"HSTraitIDKey":"9E8623D5-94C9-4183-831F-6A34F4EBF3A6-1890-0000036E68D704DB","HSTraitTypeKey":3000,"description":"Width"},"type":42},{"defaultValue":"2","value":"2","key":"÷","type":42}]},"type":42},{"defaultValue":"200","value":"","key":"y","datum":{"block_class":"operator","type":4003,"description":"÷","params":[{"defaultValue":"5","value":"5","key":"","datum":{"HSTraitTypeKey":3001,"HSTraitIDKey":"7080CC42-4817-44AF-A2FB-0388B052BA88-1890-0000036E68D71468","description":"Height"},"type":42},{"defaultValue":"2","value":"2","key":"÷","type":42}]},"type":42}]}],"abilityID":"00E544BB-F2E0-002E-9CC0-545D651DC77B"}],"eventParameters":[],"objects":[],"rules":[{"ruleBlockType":6000,"id":"D32038AD-D0F0-705C-41E5-CF4C7703D2B1","abilityID":"8371E1B0-C070-99EE-707C-28DC8AEC2720","name":"","objectID":"","parameters":[{"defaultValue":"","datum":{"type":7000,"block_class":"operator","description":"Game Starts"},"key":"","value":"","type":52}]},{"ruleBlockType":6000,"id":"1EE920D4-5537-3094-142A-7F4497249E07","objectID":"","name":"","abilityID":"CFEF83AF-CEAD-B4D4-90F7-13CAE236D9CE","parameters":[{"defaultValue":"","value":"","key":"","datum":{"type":7015,"block_class":"operator","description":"Object is Cloned"},"type":52}]}],"customRules":[{"name":"${options.name}","rules":["D32038AD-D0F0-705C-41E5-CF4C7703D2B1","1EE920D4-5537-3094-142A-7F4497249E07"],"id":"693F4B12-CDE8-874B-131E-B138C5407553"}],"variables":[],"scenes":[],"customObjects":[],"remote_asset_urls":[],"playerVersion":"1.5.0"}`)]
          break
        case 'bg-horizontal':
          presetArray = [JSON.parse(`{"abilities":[{"abilityID":"D328B748-CA85-4F59-8321-EC5565083AD2-1890-0000036E68D731BB","blocks":[{"controlScript":{"abilityID":"2D329500-83EC-4B68-A8CE-A4A029931A54-1890-0000036F7B822360"},"block_class":"control","type":26,"description":"Draw a Trail","parameters":[{"defaultValue":"","value":"","key":"color","datum":{"block_class":"operator","type":${options.bgHsv ? 5002 : 5001},"description":"${options.bgHsv ? 'HSB' : 'RGB'}","params":[{"defaultValue":"","value":"${R1}","key":"${options.bgHsv ? 'H' : 'R'}","type":42},{"defaultValue":"","value":"${G1}","key":"${options.bgHsv ? 'S' : 'G'}","type":42},{"defaultValue":"","value":"${B1}","key":"B","type":42}]},"type":44},{"defaultValue":"10","value":"4096","key":"width","type":43}]},{"block_class":"method","description":"Create a Clone of This Object","type":53,"parameters":[{"defaultValue":"5","value":"5","key":"times","datum":{"HSTraitTypeKey":3000,"HSTraitIDKey":"787B95A8-34C2-4D82-9F7A-3F3E7655F459-1890-0000036E68D75476","description":"Width"},"type":42}]}],"createdAt":0},{"createdAt":0,"blocks":[{"block_class":"method","type":41,"description":"Set Position","parameters":[{"defaultValue":"200","value":"0","key":"to x","type":42},{"defaultValue":"200","value":"0","key":"y","type":42}]}],"abilityID":"2D329500-83EC-4B68-A8CE-A4A029931A54-1890-0000036F7B822360"},{"abilityID":"A15CA08F-3861-453F-9AA7-99331B01378B-1890-0000036E68D764CC","blocks":[{"block_class":"method","type":41,"description":"Set Position","parameters":[{"defaultValue":"200","value":"0","key":"to x","datum":{"HSTraitTypeKey":2006,"HSTraitIDKey":"82AC6A63-9E7C-4A1B-96C1-4A3853EC7E6B-1890-0000036E68D771D6","HSTraitObjectParameterTypeKey":8004,"description":"Clone Index"},"type":42},{"defaultValue":"200","value":"0","key":"y","type":42}]},{"parameters":[{"defaultValue":"","value":"","key":"color","datum":{"block_class":"operator","type":${options.bgHsv ? 5002 : 5001},"description":"${options.bgHsv ? 'HSB' : 'RGB'}","params":[{"defaultValue":"","value":"","key":"${options.bgHsv ? 'H' : 'R'}","datum":{"block_class":"operator","type":4000,"description":"+","params":[{"defaultValue":"","value":"${R1}","key":"","type":42},{"defaultValue":"","value":"","key":"+","datum":{"block_class":"operator","type":4002,"description":"×","params":[{"defaultValue":"","value":"","key":"","datum":{"block_class":"operator","type":4003,"description":"÷","params":[{"defaultValue":"","value":"","key":"","datum":{"HSTraitTypeKey":2006,"HSTraitIDKey":"0B989EF8-EB5F-4338-8475-4C7AF49FDC6F-1890-0000036E68D7A935","HSTraitObjectParameterTypeKey":8004,"description":"Clone Index"},"type":42},{"defaultValue":"","value":"","key":"÷","datum":{"HSTraitTypeKey":3000,"HSTraitIDKey":"787B95A8-34C2-4D82-9F7A-3F3E7655F459-1890-0000036E68D75476","description":"Width"},"type":42}]},"type":42},{"defaultValue":"","value":"${R2 - R1}","key":"×","type":42}]},"type":42}]},"type":42},{"defaultValue":"","value":"","key":"${options.bgHsv ? 'S' : 'G'}","datum":{"block_class":"operator","type":4000,"description":"+","params":[{"defaultValue":"","value":"${G1}","key":"","type":42},{"defaultValue":"","value":"","key":"+","datum":{"block_class":"operator","type":4002,"description":"×","params":[{"defaultValue":"","value":"","key":"","datum":{"block_class":"operator","type":4003,"description":"÷","params":[{"defaultValue":"","value":"","key":"","datum":{"HSTraitTypeKey":2006,"HSTraitIDKey":"7DBDD4A3-8FFF-4F91-896B-BF43962A4A1C-1890-0000036E68D7D49E","HSTraitObjectParameterTypeKey":8004,"description":"Clone Index"},"type":42},{"defaultValue":"","value":"","key":"÷","datum":{"HSTraitTypeKey":3000,"HSTraitIDKey":"787B95A8-34C2-4D82-9F7A-3F3E7655F459-1890-0000036E68D75476","description":"Width"},"type":42}]},"type":42},{"defaultValue":"","value":"${G2 - G1}","key":"×","type":42}]},"type":42}]},"type":42},{"defaultValue":"","value":"","key":"B","datum":{"block_class":"operator","type":4000,"description":"+","params":[{"defaultValue":"","value":"${B1}","key":"","type":42},{"defaultValue":"","value":"","key":"+","datum":{"block_class":"operator","type":4002,"description":"×","params":[{"defaultValue":"","value":"","key":"","datum":{"block_class":"operator","type":4003,"description":"÷","params":[{"defaultValue":"","value":"","key":"","datum":{"HSTraitTypeKey":2006,"HSTraitIDKey":"1E4EEE3D-B404-48AC-AAC8-40C9359672A6-1890-0000036E68D7FD53","HSTraitObjectParameterTypeKey":8004,"description":"Clone Index"},"type":42},{"defaultValue":"","value":"","key":"÷","datum":{"HSTraitTypeKey":3000,"HSTraitIDKey":"787B95A8-34C2-4D82-9F7A-3F3E7655F459-1890-0000036E68D75476","description":"Width"},"type":42}]},"type":42},{"defaultValue":"","value":"${B2 - B1}","key":"×","type":42}]},"type":42}]},"type":42}]},"type":44},{"defaultValue":"10","value":"2","key":"width","type":43}],"block_class":"control","type":26,"description":"Draw a Trail","controlScript":{"abilityID":"959E4133-7B5B-4DEA-961E-BC163F8A9B48-1890-0000036E68D80C28"}}],"createdAt":0},{"createdAt":0,"blocks":[{"block_class":"method","description":"Set Position","type":41,"parameters":[{"defaultValue":"200","value":"","key":"to x","datum":{"HSTraitTypeKey":2006,"HSTraitIDKey":"666D03EF-A51F-4230-B77A-423713A2A2B4-1890-0000036E68D81F7A","HSTraitObjectParameterTypeKey":8004,"description":"Clone Index"},"type":42},{"defaultValue":"200","value":"","key":"y","datum":{"HSTraitIDKey":"DA14A6AA-E89C-428B-B5E0-0F3F349FD177-1890-0000036E68D82958","HSTraitTypeKey":3001,"description":"Height"},"type":42}]}],"abilityID":"959E4133-7B5B-4DEA-961E-BC163F8A9B48-1890-0000036E68D80C28"}],"eventParameters":[],"objects":[],"rules":[{"ruleBlockType":6000,"id":"FEFC7ABE-7700-4B12-83F0-09E0B320BDA5-1890-0000036E68DC0D75","abilityID":"D328B748-CA85-4F59-8321-EC5565083AD2-1890-0000036E68D731BB","objectID":"","name":"","parameters":[{"defaultValue":"","value":"","key":"","datum":{"type":7000,"block_class":"operator","description":"Game Starts"},"type":52}]},{"ruleBlockType":6000,"id":"8A56FC96-F5DF-414C-AED0-85DA471CE600-1890-0000036E68DC19C9","abilityID":"A15CA08F-3861-453F-9AA7-99331B01378B-1890-0000036E68D764CC","objectID":"","name":"","parameters":[{"datum":{"type":7015,"block_class":"operator","description":"Object is Cloned"},"value":"","key":"","defaultValue":"","type":52}]}],"customRules":[{"name":"${options.name}","rules":["FEFC7ABE-7700-4B12-83F0-09E0B320BDA5-1890-0000036E68DC0D75","8A56FC96-F5DF-414C-AED0-85DA471CE600-1890-0000036E68DC19C9"],"id":"DA2678E0-7755-470D-A3D1-0AEBE36F44B7-1890-0000036E68DCB23C"}],"variables":[],"scenes":[],"customObjects":[],"remote_asset_urls":[],"playerVersion":"1.5.0"}`)]
          break
        case 'bg-vertical':
          R3 = R1; R1 = R2; R2 = R3; G3 = G1; G1 = G2; G2 = G3; B3 = B1; B1 = B2; B2 = B3
          presetArray = [JSON.parse(`{"abilities":[{"abilityID":"A6E9E0D1-D4E5-8165-1A8C-8E608D1ACE04","blocks":[{"controlScript":{"abilityID":"68ACA643-740F-14F4-8669-C9FCDE8ACD18"},"block_class":"control","type":26,"description":"Draw a Trail","parameters":[{"defaultValue":"","value":"","key":"color","datum":{"block_class":"operator","type":${options.bgHsv ? 5002 : 5001},"description":"${options.bgHsv ? 'HSB' : 'RGB'}","params":[{"defaultValue":"","value":"${R1}","key":"${options.bgHsv ? 'H' : 'R'}","type":42},{"defaultValue":"","value":"${G1}","key":"${options.bgHsv ? 'S' : 'G'}","type":42},{"defaultValue":"","value":"${B1}","key":"B","type":42}]},"type":44},{"defaultValue":"10","value":"4096","key":"width","type":43}]},{"block_class":"method","description":"Create a Clone of This Object","type":53,"parameters":[{"defaultValue":"5","value":"5","key":"times","datum":{"HSTraitTypeKey":3001,"HSTraitIDKey":"B3C32104-080B-46F5-BA94-BCAD1EED0E8E-1890-0000036E68D85C34","description":"Height"},"type":42}]}],"createdAt":0},{"createdAt":0,"blocks":[{"block_class":"method","type":41,"description":"Set Position","parameters":[{"defaultValue":"200","value":"0","key":"to x","type":42},{"defaultValue":"200","value":"0","key":"y","type":42}]}],"abilityID":"68ACA643-740F-14F4-8669-C9FCDE8ACD18"},{"abilityID":"DF71D382-4A9C-02BE-C7EC-3161BE7864FF","blocks":[{"block_class":"method","type":41,"description":"Set Position","parameters":[{"defaultValue":"200","value":"0","key":"to x","type":42},{"defaultValue":"200","value":"0","key":"y","datum":{"HSTraitTypeKey":2006,"HSTraitIDKey":"B60ADABA-39DE-4A13-A11B-B38524359405-1890-0000036E68D886F3","HSTraitObjectParameterTypeKey":8004,"description":"Clone Index"},"type":42}]},{"parameters":[{"defaultValue":"","value":"","key":"color","datum":{"block_class":"operator","type":${options.bgHsv ? 5002 : 5001},"description":"${options.bgHsv ? 'HSB' : 'RGB'}","params":[{"defaultValue":"","value":"","key":"${options.bgHsv ? 'H' : 'R'}","datum":{"block_class":"operator","type":4000,"description":"+","params":[{"defaultValue":"","value":"${R1}","key":"","type":42},{"defaultValue":"","value":"","key":"+","datum":{"block_class":"operator","type":4002,"description":"×","params":[{"defaultValue":"","value":"","key":"","datum":{"block_class":"operator","type":4003,"description":"÷","params":[{"defaultValue":"","value":"","key":"","datum":{"HSTraitTypeKey":2006,"HSTraitIDKey":"AF838937-41F0-4938-A5AA-2321084F38FC-1890-0000036E68D8C2D5","HSTraitObjectParameterTypeKey":8004,"description":"Clone Index"},"type":42},{"defaultValue":"","value":"","key":"÷","datum":{"HSTraitTypeKey":3001,"HSTraitIDKey":"4B79AC56-4637-4011-8967-CCFA3B80C0AE-1890-0000036E68D8CD8D","description":"Height"},"type":42}]},"type":42},{"defaultValue":"","value":"${R2 - R1}","key":"×","type":42}]},"type":42}]},"type":42},{"defaultValue":"","value":"","key":"${options.bgHsv ? 'S' : 'G'}","datum":{"block_class":"operator","type":4000,"description":"+","params":[{"defaultValue":"","value":"${G1}","key":"","type":42},{"defaultValue":"","value":"","key":"+","datum":{"block_class":"operator","type":4002,"description":"×","params":[{"defaultValue":"","value":"","key":"","datum":{"block_class":"operator","type":4003,"description":"÷","params":[{"defaultValue":"","value":"","key":"","datum":{"HSTraitTypeKey":2006,"HSTraitIDKey":"82E060E5-B807-4FBE-90EC-08B129F1BB92-1890-0000036E68D8E91B","HSTraitObjectParameterTypeKey":8004,"description":"Clone Index"},"type":42},{"defaultValue":"","value":"","key":"÷","datum":{"HSTraitIDKey":"41ADD362-3162-4CF8-B0BB-A02825C49092-1890-0000036E68D8F5EF","HSTraitTypeKey":3001,"description":"Height"},"type":42}]},"type":42},{"defaultValue":"","value":"${G2 - G1}","key":"×","type":42}]},"type":42}]},"type":42},{"defaultValue":"","value":"","key":"B","datum":{"block_class":"operator","type":4000,"description":"+","params":[{"defaultValue":"","value":"${B1}","key":"","type":42},{"defaultValue":"","value":"","key":"+","datum":{"block_class":"operator","type":4002,"description":"×","params":[{"defaultValue":"2","value":"2","key":"","datum":{"block_class":"operator","type":4003,"description":"÷","params":[{"defaultValue":"","value":"","key":"","datum":{"HSTraitTypeKey":2006,"HSTraitIDKey":"C4C6CCC6-B7BE-446B-A953-0C963A220138-1890-0000036E68D9113F","HSTraitObjectParameterTypeKey":8004,"description":"Clone Index"},"type":42},{"defaultValue":"2","value":"2","key":"÷","datum":{"HSTraitTypeKey":3001,"HSTraitIDKey":"A4F01B8B-A984-41C0-98FE-9B6A3FD908E8-1890-0000036E68D91A79","description":"Height"},"type":42}]},"type":42},{"defaultValue":"","value":"${B2 - B1}","key":"×","type":42}]},"type":42}]},"type":42}]},"type":44},{"defaultValue":"10","value":"2","key":"width","type":43}],"block_class":"control","type":26,"controlScript":{"abilityID":"CA7121AF-BFD7-943B-0318-216D2B1E2827"},"description":"Draw a Trail"},{"block_class":"method","description":"Destroy","type":55}],"createdAt":0},{"blocks":[{"block_class":"method","type":41,"description":"Set Position","parameters":[{"defaultValue":"200","value":"","key":"to x","datum":{"HSTraitTypeKey":3000,"HSTraitIDKey":"3D13D739-3CD2-4001-90E1-84A76F471630-1890-0000036E68D93252","description":"Width"},"type":42},{"defaultValue":"200","value":"","key":"y","datum":{"HSTraitTypeKey":2006,"HSTraitIDKey":"FDC7D150-28FE-42B7-A3A3-06C27C3F1432-1890-0000036E68D93B1C","HSTraitObjectParameterTypeKey":8004,"description":"Clone Index"},"type":42}]}],"createdAt":0,"abilityID":"CA7121AF-BFD7-943B-0318-216D2B1E2827"}],"eventParameters":[],"objects":[],"rules":[{"ruleBlockType":6000,"id":"362771F0-3793-16E9-6520-58C9F9F302A8","objectID":"","name":"","abilityID":"A6E9E0D1-D4E5-8165-1A8C-8E608D1ACE04","parameters":[{"datum":{"type":7000,"block_class":"operator","description":"Game Starts"},"defaultValue":"","key":"","value":"","type":52}]},{"ruleBlockType":6000,"id":"21597407-BF9E-081C-14EF-89DE791716C1","abilityID":"DF71D382-4A9C-02BE-C7EC-3161BE7864FF","name":"","objectID":"","parameters":[{"defaultValue":"","value":"","key":"","datum":{"type":7015,"block_class":"operator","description":"Object is Cloned"},"type":52}]}],"customRules":[{"name":"${options.name}","rules":["362771F0-3793-16E9-6520-58C9F9F302A8","21597407-BF9E-081C-14EF-89DE791716C1"],"id":"27BFE11F-DE1F-BE2A-75EF-A1C94C0F4916"}],"variables":[],"scenes":[],"customObjects":[],"remote_asset_urls":[],"playerVersion":"1.5.0"}`)]
          break
        case 'bg-nesw':
          presetArray = [JSON.parse(`{"abilities":[{"abilityID":"11C5A271-3EB1-4A6E-8855-1E3A4E3764F0-1890-0000036E68D97D27","blocks":[{"controlScript":{"abilityID":"2D329500-83EC-4B68-A8CE-A4A029931A54-1890-0000036F7B822360"},"block_class":"control","type":26,"description":"Draw a Trail","parameters":[{"defaultValue":"","value":"","key":"color","datum":{"block_class":"operator","type":${options.bgHsv ? 5002 : 5001},"description":"${options.bgHsv ? 'HSB' : 'RGB'}","params":[{"defaultValue":"","value":"${R1}","key":"${options.bgHsv ? 'H' : 'R'}","type":42},{"defaultValue":"","value":"${G1}","key":"${options.bgHsv ? 'S' : 'G'}","type":42},{"defaultValue":"","value":"${B1}","key":"B","type":42}]},"type":44},{"defaultValue":"10","value":"4096","key":"width","type":43}]},{"block_class":"method","type":53,"description":"Create a Clone of This Object","parameters":[{"defaultValue":"5","value":"5","key":"times","datum":{"HSTraitIDKey":"EB791663-2129-4365-A8DD-1D9174F0E4E5-1890-0000036E68D9A4FC","HSTraitTypeKey":3001,"description":"Height"},"type":42}]}],"createdAt":0},{"createdAt":0,"blocks":[{"block_class":"method","type":41,"description":"Set Position","parameters":[{"defaultValue":"200","value":"0","key":"to x","type":42},{"defaultValue":"200","value":"0","key":"y","type":42}]}],"abilityID":"2D329500-83EC-4B68-A8CE-A4A029931A54-1890-0000036F7B822360"},{"abilityID":"34215CD2-1ED7-4C17-B704-BA04F5F60322-1890-0000036E878DDEB8","blocks":[{"block_class":"method","type":41,"description":"Set Position","parameters":[{"defaultValue":"200","value":"0","key":"to x","type":42},{"defaultValue":"200","value":"200","key":"y","datum":{"block_class":"operator","type":4002,"description":"×","params":[{"defaultValue":"2","value":"2","key":"","datum":{"HSTraitTypeKey":2006,"HSTraitIDKey":"CC91DD07-D94B-455A-9A7B-881778B85B89-1890-0000036E914F7F19","HSTraitObjectParameterTypeKey":8004,"description":"Clone Index"},"type":42},{"defaultValue":"3","value":"2","key":"×","type":42}]},"type":42}]},{"type":26,"block_class":"control","description":"Draw a Trail","controlScript":{"abilityID":"87895CF5-45E2-4FC8-B4B7-17EF1DB70834-1890-0000036E95496023"},"parameters":[{"defaultValue":"","value":"","key":"color","datum":{"block_class":"operator","type":${options.bgHsv ? 5002 : 5001},"description":"${options.bgHsv ? 'HSB' : 'RGB'}","params":[{"defaultValue":"","value":"","key":"${options.bgHsv ? 'H' : 'R'}","datum":{"block_class":"operator","type":4000,"description":"+","params":[{"defaultValue":"","value":"${R1}","key":"","type":42},{"defaultValue":"","value":"","key":"+","datum":{"block_class":"operator","type":4002,"description":"×","params":[{"defaultValue":"","value":"","key":"","datum":{"block_class":"operator","type":4003,"description":"÷","params":[{"defaultValue":"","value":"","key":"","datum":{"HSTraitTypeKey":2006,"HSTraitIDKey":"C0478744-C7EA-4E0B-AFEF-50793C0AB9A1-1890-0000036F829F2E7B","HSTraitObjectParameterTypeKey":8004,"description":"Clone Index"},"type":42},{"defaultValue":"","value":"","key":"÷","datum":{"HSTraitIDKey":"D601C255-108D-4969-B43A-2E7F4F453955-1890-0000036F829F37E6","HSTraitTypeKey":3001,"description":"Height"},"type":42}]},"type":42},{"defaultValue":"","value":"${R2 - R1}","key":"×","type":42}]},"type":42}]},"type":42},{"defaultValue":"","value":"","key":"${options.bgHsv ? 'S' : 'G'}","datum":{"block_class":"operator","type":4000,"description":"+","params":[{"defaultValue":"","value":"${G1}","key":"","type":42},{"defaultValue":"","value":"","key":"+","datum":{"block_class":"operator","type":4002,"description":"×","params":[{"defaultValue":"","value":"","key":"","datum":{"block_class":"operator","type":4003,"description":"÷","params":[{"defaultValue":"","value":"","key":"","datum":{"HSTraitTypeKey":2006,"HSTraitIDKey":"BD75D6AB-4B08-4C88-BB70-79F072F89FBC-1890-0000036F829F52C8","HSTraitObjectParameterTypeKey":8004,"description":"Clone Index"},"type":42},{"defaultValue":"","value":"","key":"÷","datum":{"HSTraitIDKey":"CBCDEA5E-FC0B-4F3F-8D6F-411DCDD80FD6-1890-0000036F829F5C15","HSTraitTypeKey":3001,"description":"Height"},"type":42}]},"type":42},{"defaultValue":"","value":"${G2 - G1}","key":"×","type":42}]},"type":42}]},"type":42},{"defaultValue":"","value":"","key":"B","datum":{"block_class":"operator","type":4000,"description":"+","params":[{"defaultValue":"","value":"${B1}","key":"","type":42},{"defaultValue":"","value":"","key":"+","datum":{"block_class":"operator","type":4002,"description":"×","params":[{"defaultValue":"","value":"","key":"","datum":{"block_class":"operator","type":4003,"description":"÷","params":[{"defaultValue":"","value":"","key":"","datum":{"HSTraitTypeKey":2006,"HSTraitIDKey":"9BC95402-9B0B-45CC-ADDB-565E98A1E84E-1890-0000036F829F77BF","HSTraitObjectParameterTypeKey":8004,"description":"Clone Index"},"type":42},{"defaultValue":"","value":"","key":"÷","datum":{"HSTraitTypeKey":3001,"HSTraitIDKey":"9D68CA22-C240-478B-AF18-E6D84442FC9E-1890-0000036F829F8102","description":"Height"},"type":42}]},"type":42},{"defaultValue":"","value":"${B2 - B1}","key":"×","type":42}]},"type":42}]},"type":42}]},"type":44},{"defaultValue":"10","value":"4","key":"width","type":43}]}],"createdAt":0},{"createdAt":0,"blocks":[{"block_class":"method","type":41,"description":"Set Position","parameters":[{"defaultValue":"200","value":"20","key":"to x","datum":{"block_class":"operator","type":4002,"description":"×","params":[{"defaultValue":"2","value":"2","key":"","datum":{"block_class":"operator","type":4002,"description":"×","params":[{"defaultValue":"2","value":"2","key":"","datum":{"HSTraitTypeKey":2006,"HSTraitIDKey":"9116E853-75BE-4661-BD33-FFADACBDA053-1890-0000036EA7A56C74","HSTraitObjectParameterTypeKey":8004,"description":"Clone Index"},"type":42},{"defaultValue":"3","value":"2","key":"×","type":42}]},"type":42},{"defaultValue":"3","value":"3","key":"×","datum":{"block_class":"operator","type":4003,"description":"÷","params":[{"defaultValue":"5","value":"5","key":"","datum":{"HSTraitIDKey":"71162EF5-4382-442B-A10E-6898DB9C4986-1890-0000036EAC16D65C","HSTraitTypeKey":3000,"description":"Width"},"type":42},{"defaultValue":"2","value":"2","key":"÷","datum":{"HSTraitTypeKey":3001,"HSTraitIDKey":"A408A08D-BBEB-4E34-9DE7-F51C02D5EF5E-1890-0000036EAF89E99B","description":"Height"},"type":42}]},"type":42}]},"type":42},{"defaultValue":"200","value":"0","key":"y","type":42}]}],"abilityID":"87895CF5-45E2-4FC8-B4B7-17EF1DB70834-1890-0000036E95496023"}],"eventParameters":[],"objects":[],"rules":[{"ruleBlockType":6000,"id":"3DFBBC2E-1A9E-4D62-ADA6-E4D3FDD74602-1890-0000036E68A871FA","abilityID":"11C5A271-3EB1-4A6E-8855-1E3A4E3764F0-1890-0000036E68D97D27","objectID":"","name":"","parameters":[{"defaultValue":"","value":"","datum":{"type":7000,"block_class":"operator","description":"Game Starts"},"key":"","type":52}]},{"ruleBlockType":6000,"id":"4901DB53-CC1F-42C2-A8AB-DEDA718E3345-1890-0000036E82EEBC62","abilityID":"34215CD2-1ED7-4C17-B704-BA04F5F60322-1890-0000036E878DDEB8","objectID":"","name":"","parameters":[{"defaultValue":"","value":"","key":"","datum":{"type":7015,"block_class":"operator","description":"Object is Cloned"},"type":52}]}],"customRules":[{"name":"${options.name}","rules":["3DFBBC2E-1A9E-4D62-ADA6-E4D3FDD74602-1890-0000036E68A871FA","4901DB53-CC1F-42C2-A8AB-DEDA718E3345-1890-0000036E82EEBC62"],"id":"D8595B21-0BB7-4E84-B48F-83090BA8E1A4-1890-0000036F72DC18B1"}],"variables":[],"scenes":[],"customObjects":[],"remote_asset_urls":[],"playerVersion":"1.5.0"}`)]
          break
        case 'bg-nwse':
          R3 = R1; R1 = R2; R2 = R3; G3 = G1; G1 = G2; G2 = G3; B3 = B1; B1 = B2; B2 = B3
          presetArray = [JSON.parse(`{"abilities":[{"abilityID":"01DA5985-7846-4345-A04F-D76C54A8FB32-1890-0000036F7B81FA15","blocks":[{"controlScript":{"abilityID":"2D329500-83EC-4B68-A8CE-A4A029931A54-1890-0000036F7B822360"},"block_class":"control","type":26,"description":"Draw a Trail","parameters":[{"defaultValue":"","value":"","key":"color","datum":{"block_class":"operator","type":${options.bgHsv ? 5002 : 5001},"description":"${options.bgHsv ? 'HSB' : 'RGB'}","params":[{"defaultValue":"","value":"${R1}","key":"${options.bgHsv ? 'H' : 'R'}","type":42},{"defaultValue":"","value":"${G1}","key":"${options.bgHsv ? 'S' : 'G'}","type":42},{"defaultValue":"","value":"${B1}","key":"B","type":42}]},"type":44},{"defaultValue":"10","value":"4096","key":"width","type":43}]},{"block_class":"method","description":"Create a Clone of This Object","type":53,"parameters":[{"defaultValue":"5","value":"5","key":"times","datum":{"HSTraitIDKey":"BE9E8BA4-ACD4-408F-B4F6-294E50D53404-1890-0000036F7B825221","HSTraitTypeKey":3001,"description":"Height"},"type":42}]}],"createdAt":0},{"createdAt":0,"blocks":[{"block_class":"method","type":41,"description":"Set Position","parameters":[{"defaultValue":"200","value":"0","key":"to x","type":42},{"defaultValue":"200","value":"0","key":"y","type":42}]}],"abilityID":"2D329500-83EC-4B68-A8CE-A4A029931A54-1890-0000036F7B822360"},{"abilityID":"FED09EC8-96B9-4EA7-94CD-1F0054E78F86-1890-0000036F829EF20B","blocks":[{"block_class":"method","type":41,"description":"Set Position","parameters":[{"defaultValue":"200","value":"0","key":"to x","datum":{"HSTraitTypeKey":3000,"HSTraitIDKey":"C3CA6D32-FF90-4F8F-B823-20C118E4C41A-1890-0000036F926266F4","description":"Width"},"type":42},{"defaultValue":"200","value":"200","key":"y","datum":{"block_class":"operator","type":4002,"description":"×","params":[{"defaultValue":"2","value":"2","key":"","datum":{"HSTraitTypeKey":2006,"HSTraitIDKey":"94203982-DAD8-4765-9DDA-36B8850694CF-1890-0000036F829F0575","HSTraitObjectParameterTypeKey":8004,"description":"Clone Index"},"type":42},{"defaultValue":"3","value":"2","key":"×","type":42}]},"type":42}]},{"type":26,"block_class":"control","description":"Draw a Trail","controlScript":{"abilityID":"C2C0649F-DEC1-4D0A-8E88-23B8123C0956-1890-0000036F829F85A1"},"parameters":[{"defaultValue":"","value":"","key":"color","datum":{"block_class":"operator","type":${options.bgHsv ? 5002 : 5001},"description":"${options.bgHsv ? 'HSB' : 'RGB'}","params":[{"defaultValue":"","value":"","key":"${options.bgHsv ? 'H' : 'R'}","datum":{"block_class":"operator","type":4000,"description":"+","params":[{"defaultValue":"","value":"${R1}","key":"","type":42},{"defaultValue":"","value":"","key":"+","datum":{"block_class":"operator","type":4002,"description":"×","params":[{"defaultValue":"","value":"","key":"","datum":{"block_class":"operator","type":4003,"description":"÷","params":[{"defaultValue":"","value":"","key":"","datum":{"HSTraitTypeKey":2006,"HSTraitIDKey":"C0478744-C7EA-4E0B-AFEF-50793C0AB9A1-1890-0000036F829F2E7B","HSTraitObjectParameterTypeKey":8004,"description":"Clone Index"},"type":42},{"defaultValue":"","value":"","key":"÷","datum":{"HSTraitIDKey":"D601C255-108D-4969-B43A-2E7F4F453955-1890-0000036F829F37E6","HSTraitTypeKey":3001,"description":"Height"},"type":42}]},"type":42},{"defaultValue":"","value":"${R2 - R1}","key":"×","type":42}]},"type":42}]},"type":42},{"defaultValue":"","value":"","key":"${options.bgHsv ? 'S' : 'G'}","datum":{"block_class":"operator","type":4000,"description":"+","params":[{"defaultValue":"","value":"${G1}","key":"","type":42},{"defaultValue":"","value":"","key":"+","datum":{"block_class":"operator","type":4002,"description":"×","params":[{"defaultValue":"","value":"","key":"","datum":{"block_class":"operator","type":4003,"description":"÷","params":[{"defaultValue":"","value":"","key":"","datum":{"HSTraitTypeKey":2006,"HSTraitIDKey":"BD75D6AB-4B08-4C88-BB70-79F072F89FBC-1890-0000036F829F52C8","HSTraitObjectParameterTypeKey":8004,"description":"Clone Index"},"type":42},{"defaultValue":"","value":"","key":"÷","datum":{"HSTraitIDKey":"CBCDEA5E-FC0B-4F3F-8D6F-411DCDD80FD6-1890-0000036F829F5C15","HSTraitTypeKey":3001,"description":"Height"},"type":42}]},"type":42},{"defaultValue":"","value":"${G2 - G1}","key":"×","type":42}]},"type":42}]},"type":42},{"defaultValue":"","value":"","key":"B","datum":{"block_class":"operator","type":4000,"description":"+","params":[{"defaultValue":"","value":"${B1}","key":"","type":42},{"defaultValue":"","value":"","key":"+","datum":{"block_class":"operator","type":4002,"description":"×","params":[{"defaultValue":"","value":"","key":"","datum":{"block_class":"operator","type":4003,"description":"÷","params":[{"defaultValue":"","value":"","key":"","datum":{"HSTraitTypeKey":2006,"HSTraitIDKey":"9BC95402-9B0B-45CC-ADDB-565E98A1E84E-1890-0000036F829F77BF","HSTraitObjectParameterTypeKey":8004,"description":"Clone Index"},"type":42},{"defaultValue":"","value":"","key":"÷","datum":{"HSTraitTypeKey":3001,"HSTraitIDKey":"9D68CA22-C240-478B-AF18-E6D84442FC9E-1890-0000036F829F8102","description":"Height"},"type":42}]},"type":42},{"defaultValue":"","value":"${B2 - B1}","key":"×","type":42}]},"type":42}]},"type":42}]},"type":44},{"defaultValue":"10","value":"4","key":"width","type":43}]},{"block_class":"method","description":"Destroy","type":55}],"createdAt":0},{"createdAt":0,"blocks":[{"block_class":"method","type":41,"description":"Set Position","parameters":[{"defaultValue":"200","value":"20","key":"to x","datum":{"block_class":"operator","type":4000,"description":"+","params":[{"defaultValue":"2","value":"20","key":"","datum":{"block_class":"operator","type":4002,"description":"×","params":[{"defaultValue":"2","value":"2","key":"","datum":{"block_class":"operator","type":4002,"description":"×","params":[{"defaultValue":"2","value":"2","key":"","datum":{"HSTraitTypeKey":2006,"HSTraitIDKey":"F3AE3298-4F79-416E-88FE-8DC649571F72-1890-0000036F829FA26E","HSTraitObjectParameterTypeKey":8004,"description":"Clone Index"},"type":42},{"defaultValue":"3","value":"-2","key":"×","type":42}]},"type":42},{"defaultValue":"3","value":"3","key":"×","datum":{"block_class":"operator","type":4003,"description":"÷","params":[{"defaultValue":"5","value":"5","key":"","datum":{"HSTraitTypeKey":3000,"HSTraitIDKey":"23B099BF-07C1-4B8C-80EC-C34B9B04E9A6-1890-0000036F829FB1E8","description":"Width"},"type":42},{"defaultValue":"2","value":"2","key":"÷","datum":{"HSTraitTypeKey":3001,"HSTraitIDKey":"9E73FB6B-AA96-4A9A-9945-48CDF839B7DD-1890-0000036F829FBA67","description":"Height"},"type":42}]},"type":42}]},"type":42},{"defaultValue":"3","value":"3","key":"+","datum":{"HSTraitIDKey":"9EAAE7A4-ECA4-429B-A8EC-9EE040E4BF96-1890-0000036F9C8980DD","HSTraitTypeKey":3000,"description":"Width"},"type":42}]},"type":42},{"defaultValue":"200","value":"0","key":"y","type":42}]}],"abilityID":"C2C0649F-DEC1-4D0A-8E88-23B8123C0956-1890-0000036F829F85A1"}],"eventParameters":[],"objects":[],"rules":[{"ruleBlockType":6000,"id":"E4A5C4CC-AA3E-4F1B-95D7-AAB912C1621C-1890-0000036F7B597679","objectID":"","name":"","abilityID":"01DA5985-7846-4345-A04F-D76C54A8FB32-1890-0000036F7B81FA15","parameters":[{"defaultValue":"","datum":{"type":7000,"block_class":"operator","description":"Game Starts"},"value":"","key":"","type":52}]},{"ruleBlockType":6000,"id":"541FF5C6-A9EA-4294-BE89-365B736F37D8-1890-0000036F826FAA0D","abilityID":"FED09EC8-96B9-4EA7-94CD-1F0054E78F86-1890-0000036F829EF20B","objectID":"","name":"","parameters":[{"defaultValue":"","value":"","key":"","datum":{"type":7015,"block_class":"operator","description":"Object is Cloned"},"type":52}]}],"customRules":[{"name":"${options.name}","rules":["E4A5C4CC-AA3E-4F1B-95D7-AAB912C1621C-1890-0000036F7B597679","541FF5C6-A9EA-4294-BE89-365B736F37D8-1890-0000036F826FAA0D"],"id":"7C60D40D-6594-4C2C-8A5E-8F72B2C597AB-1890-0000036F8B5044A1"}],"variables":[],"scenes":[],"customObjects":[],"remote_asset_urls":[],"playerVersion":"1.5.0"}`)]
          break
      }
    }
    let presetsMerged = 0
    presetArray.forEach(preset => {
      // Shuffle the UUIDs for all keys except variables
      const newIdDictionary = {}
      Object.keys(preset).forEach(key => {
        if (Array.isArray(preset[key])) {
          if (key !== 'variables') {
            preset[key].forEach(item => {
              const id = (item.id || item.objectID || item.abilityID || item.objectIdString)
              if (id) newIdDictionary[id] = tempUuid().toUpperCase()
            })
          }
        }
      })
      const expression = new RegExp('"(' + Object.keys(newIdDictionary).join('|') + ')"', 'g')
      preset = JSON.parse(JSON.stringify(preset).replace(expression, function (m0, m1) {
        return JSON.stringify(newIdDictionary[m1])
      }).replace(/([^\\](\\\\)*"):undefined($|[,}](?!"[,}\]]|"$)(?=["}\]]|$))/g, '$1:""$2')) // MODIFIED REGEX
      if (preset.playerVersion === project.playerVersion || options.alwaysMerge) {
        Object.keys(preset).forEach(key => {
          if (key === 'abilities' && !options.originalCreateDates) {
            // Override CreatedAt Dates
            newestCreateDate = Math.max(project.abilities.map(a => { return a.createdAt || 0 }).sort((a, b) => b - a)[0] + 12.345678 || 0, newestCreateDate)
            for (i = 0; i < preset.abilities.length; i++) {
              preset.abilities[i].createdAt = newestCreateDate + 12.345678 * (i + 1)
            };
          }
          if (Array.isArray(preset[key])) {
            project[key] = removeDuplicateHsIds((project[key] || []).concat(preset[key]), key === 'variables' && options.newVarNames)
          }
        })
        presetsMerged++
      }
    })
    if (project.scenes) {
      // Can't have duplicate scene names
      const sceneNames = []
      project.scenes.forEach(s => {
        const base = s.name.replace(/\s\d+$/, '')
        const numberMatch = s.name.match(/\s(\d+)$/)
        let i = numberMatch ? numberMatch[1] : 1
        while (sceneNames.includes(s.name)) {
          i++
          s.name = `${base} ${i}`
        }
        sceneNames.push(s.name)
      })
    }
    const newProject = Object.detach(project)
    this.createOverride(oldProject, newProject)
    return { project: project, mergeCount: presetsMerged }
  },
  createOverride: function (oldData, newData) {
    // Rerender only if number of scenes changes
    const rerender = oldData.scenes.length !== newData.scenes.length
    setTimeout(() => new ProjectRevision({ type: 'AEOverrideProject', oldData, newData, rerender }), 10)
    if (rerender) this.rerenderProject()
    this.reloadKeyboard()
  },
  rerenderProject: function () {
    blocksContainer.innerHTML = ''
    infoElement.dataset.project = JSON.stringify(hsProject)
    // Re-render the entire project because of scenes
    render()
  },
  reloadKeyboard: function () {
    // Reload Abilities and Custom Rules
    const abilityContainer = document.querySelector('[data-blocksource="custom-abilities"]')
    const customRulesContainer = document.querySelector('[data-blocksource="custom-rules"]')
    loadBlockList(abilityContainer.parentNode, abilityContainer)
    loadBlockList(customRulesContainer.parentNode, customRulesContainer)
  },
  extensionURL: new URL(document.currentScript.src).origin
}

PresetManager.init()
