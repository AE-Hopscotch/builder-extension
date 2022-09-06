/* eslint-disable no-undef */

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
  initSearchBar: function () {
    function fireSearchEvent (target) {
      const searchEvent = new Event('search', { bubbles: true })
      target.dispatchEvent(searchEvent)
    }

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
    desktopButton.addEventListener('click', function () { fireSearchEvent(this.previousElementSibling) })
    mobileButton.addEventListener('click', function () { fireSearchEvent(this.previousElementSibling) })

    // Search Listener
    modKeyboard.addEventListener('search', (event) => {
      this.search(event.target.value)
      setTimeout(() => {
        const optionsContainer = document.getElementById('_AE_search-options')
        const closeOptionsBtn = optionsContainer.parentNode.querySelector('.openbtn .hs-icon.open')
        if (closeOptionsBtn) closeOptionsBtn.click()
      }, 50)
    })

    if ('onsearch' in desktopInput) return
    // If search event isn't supported
    desktopInput.addEventListener('change', function () { fireSearchEvent(this) })
    mobileInput.addEventListener('change', function () { fireSearchEvent(this) })
  },
  initOptions: function () {
    const container = document.getElementById('_AE_search-options')
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
  },
  initResults: function () {
    const container = document.getElementById('_AE_search-results')
    container.parentNode.dataset.darken = 'false'

    container.addEventListener('click', e => {
      if (!nodeTree(e.target).find(el => el.matches('.search-result'))) return
      // Has search result as a parent element; update max size
      setTimeout(() => {
        container.parentNode.style.maxHeight = container.getBoundingClientRect().height + 60 + 'px'
      }, 80)
    })
  },
  fullBlockNames: {
    44: ['var', 'Increase variable by', '', 'by'],
    45: ['var', 'Set variable to', '', 'to'],
    57: ['looks', 'Set Width and Height', 'width', 'height']
  },
  traceIcons: '<i class="hs-icon hs-see-code"></i><i class="hs-icon hs-close"></i>',
  search: function (searchText, options) {
    const searchElements = {
      searchPopup: document.getElementById('search-popup'),
      resultsBox: document.getElementById('_AE_search-results')
    }
    function addCloseTraceListener (resultElement) {
      const traceElement = resultElement.querySelector('.trace')
      resultElement.querySelector('.hs-close').addEventListener('click', () => {
        traceElement.remove()
      })
    }

    if (!options) searchElements.resultsBox.innerHTML = ''
    function escapeRegExp (str) {
      return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
    }
    function getVar (id) {
      const name = (ProjectVariable.get(id) || {}).name
      return (name || '').htmlEscape() || '<span style="color:red;">unknown</span>'
    }
    function optVal (id) {
      // options = included with automated search
      if (options) return options[id] || false
      const optionEl = document.getElementById('_AE_search-' + id)
      return optionEl ? optionEl.checked : false
    }
    if (!searchText) return
    if (!searchText.match(/\w{3,}|[^\w\s\t]/) && !optVal('opt_ev') && !optVal('opt_ww')) {
      searchElements.resultsBox.innerHTML = '<div class="flex">Query is too short</div>'
      return
    }
    const textItems = []
    let searchResults = [];
    (hsProject.abilities || []).forEach((a) => {
      if (a.name && optVal('ft_ab')) textItems.push({ type: 'ability_name', value: a.name, id: a.abilityID, data: a })
      if (a.name && optVal('ft_ai')) textItems.push({ type: 'ability_id', value: a.abilityID, id: a.abilityID, data: a })
      for (let i = 0; i < (a.blocks || []).length; i++) {
        const b = a.blocks[i]
        const labels = ProjectSearch.fullBlockNames[b.type] || blockLabels[b.type] || []
        const blockId = `${a.abilityID}_b${i}`
        if (optVal('ft_bn')) textItems.push({ type: 'blockName', value: labels[1], id: blockId, data: b })
        if (optVal('ft_pv')) {
          (JSON.stringify(b).match(/"value":"(?:|.*?[^\\\n])(?:\\{2})*"/gi) || []).forEach((m) => { textItems.push(JSON.parse(`{"type":"block",${m},"id":"${blockId}","data":${JSON.stringify(b)}}`)) });
          // Include Variable ID and Name
          (JSON.stringify(b).match(/"variable":"(?:|.*?[^\\\n])(?:\\{2})*"/gi) || []).forEach((m) => {
            textItems.push(
              optVal('ft_vi') ? JSON.parse(`{"type":"block",${m.replace(/^"variable"/, '"value"')},"id":"${blockId}","data":${JSON.stringify(b)}}`) : undefined,
              optVal('ft_vr')
                ? JSON.parse(`{"type":"block",${m.replace(/^"variable"/, '"value"').replace(/"value":"((?:|.*?[^\\\n])(?:\\{2})*)"/, function (m0, m1, m2) {
                      return `"value":"${getVar(m1)}"`
                    })},"id":"${blockId}","data":${JSON.stringify(b)}}`)
                : undefined
            )
          })
          if (optVal('ft_vr')) {
            // Include Local Variable Names
            (JSON.stringify(b).match(/"name":"(?:|.*?[^\\\n])(?:\\{2})*"/gi) || []).forEach((m) => {
              textItems.push(
                JSON.parse(`{"type":"block",${m.replace(/^"name"/, '"value"')},"id":"${blockId}","data":${JSON.stringify(b)}}`)
              )
            })
          }
        }
        if (optVal('ft_dd') && (b.params || b.parameters)) (JSON.stringify(b.params || b.parameters).match(/"(?:description|key)":"(?:|.*?[^\\\n])(?:\\{2})*"/gi) || []).forEach((m) => { textItems.push(JSON.parse(`{"type":"data",${m.replace(/^"(?:description|key)"/, '"value"')},"id":"${blockId}","data":${JSON.stringify(b)}}`)) })
        if (optVal('ft_cs') && b.controlScript) textItems.push({ type: 'controlScript', value: b.controlScript.abilityID || '', id: blockId, data: b })
        if (optVal('ft_fs') && b.controlFalseScript) textItems.push({ type: 'controlScript', value: b.controlFalseScript.abilityID || '', id: blockId, data: b })
      }
    });
    (hsProject.customRules || []).forEach((c) => {
      if (optVal('ft_cr')) textItems.push({ type: 'customRule', value: c.name, id: c.id, data: c })
      if (optVal('ft_ci')) textItems.push({ type: 'customRule', value: c.id, id: c.id, data: c })
    });
    (hsProject.objects || []).forEach((o) => {
      if (optVal('ft_ob')) textItems.push({ type: 'object_name', value: o.name, id: o.objectID, data: o })
      if (optVal('ft_on')) textItems.push({ type: 'object_text', value: o.text, id: o.objectID, data: o })
      if (optVal('ft_oi')) textItems.push({ type: 'object_id', value: o.objectID, id: o.objectID, data: o })
    });
    (hsProject.rules || []).forEach((r) => {
      if (optVal('ft_ri')) textItems.push({ type: 'rule_id', value: r.id, id: r.id, data: r })
      if (optVal('ft_rd')) textItems.push({ type: 'rule_desc', value: (((r.parameters || [])[0] || {}).datum || {}).description || '', id: r.id, data: r })
      if (optVal('ft_rs')) textItems.push({ type: 'rule_script', value: r.abilityID, id: r.id, data: r })
      if (optVal('ft_dd') && (r.params || r.parameters)) (JSON.stringify(r.params || r.parameters).match(/"(?:description|key)":"(?:|.*?[^\\\n])(?:\\{2})*"/gi) || []).forEach((m) => { textItems.push(JSON.parse(`{"type":"rule_data",${m.replace(/^"(?:description|key)"/, '"value"')},"id":"${r.id}","data":${JSON.stringify(r)}}`)) })
    })
    if (optVal('ft_sc')) {
      (hsProject.scenes || []).forEach((s) => {
        textItems.push({ type: 'scene', value: s.name, id: s.web_id, data: s })
      })
    }
    (hsProject.variables || []).forEach((v) => {
      // Don't search variables for now
      // if (optVal('ft_vr')) textItems.push({ type: 'var', value: v.name, id: v.objectIdString, data: v })
      // if (optVal('ft_vi')) textItems.push({ type: 'var', value: v.objectIdString, id: v.objectIdString, data: v })
    })
    try {
      const searchRegex = new RegExp((optVal('opt_rg')) ? searchText : (optVal('opt_ev') ? '^' : '') + (optVal('opt_ww') ? '\\b' : '') + escapeRegExp(optVal('opt_nl') ? JSON.parse('"' + searchText + '"') : searchText) + (optVal('opt_ww') ? '\\b' : '') + (optVal('opt_ev') ? '$' : '') || '$.^', (optVal('opt_cs') ? '' : 'i'))
      // if (String(searchRegex).replace(/\w+$/,'').length < 5) return searchElements.resultsBox.innerHTML = '<div class="flex">Query is too short</div>';
      textItems.forEach((t) => { if (t?.value?.match(searchRegex)) searchResults.push(t) })
      // Remove Duplicate Results
      const existingIdList = []
      searchResults = searchResults.filter(item => {
        if (existingIdList.indexOf(item.id) === -1) return existingIdList.push(item.id)
        return undefined
      })
      console.groupCollapsed('Search Results')
      console.log(textItems, searchRegex, searchResults)
      console.groupEnd()
      if (!options && searchResults.length === 0) searchElements.resultsBox.innerHTML = '<span class="center">No Results</div>'
      function doParameter (p) {
        if (p.datum && p.datum.objectIdString) {
          p.datum = Object.detach(p.datum)
          p.datum.variable = p.datum.objectIdString
          if (p.datum.type === 8000) p.datum.type = 8004
        }
        return ParameterRenderer.renderWrapped(p)
      }
      searchResults.forEach(res => {
        let className = ''; let blockData = null
        function setClass (name) { className = className || name }
        /* eslint-disable no-fallthrough */
        switch (true) {
          case !!res.type.match(/^(rule_id|rule_desc|rule_data|rule_script)/): // "draw"
            setClass('rule')
            if (res.data.objectID === '') {
              const ruleReferences = (hsProject.customRules || []).filter(cr => cr.rules.indexOf(res.id) !== -1).concat((hsProject.objects || []).filter(o => o.rules.indexOf(res.id) !== -1))
              if (ruleReferences.length === 1) {
                enclosingAbilityID = ruleReferences[0].objectID || ruleReferences[0].id
                blockData = ruleReferences[0]
                setClass(blockData.objectID ? 'obj' : 'crule')
              }
            } else {
              blockData = ProjectStageObject.get(res.data.objectID)
              setClass('obj')
            }
          case !!res.type.match(/^customRule/): // also "draw"
            setClass('crule')
          case !!res.type.match(/^object_/): // also "draw"
            setClass('obj')
          case !!res.type.match(/^scene/): // "scene 1"
            setClass('scn')
          case !!res.type.match(/^ability/): // "secret blocks"
            if (!className) {
              // Matched a named ability -> render as block
              res.data = {
                block_class: 'control',
                type: 123,
                description: res.data.name,
                controlScript: { abilityID: res.id.replace(/_b\d+$/, '') }
              }
              setClass('abil')
            }
          case !!res.type.match(/^(block|data)/): // search "position"
          case !!res.type.match(/^controlScript/): {
            // 822794E9-0725-4400-A8D5-EF4502B33677-12414-00000B9C467DB348 <- T F -> 4BD1AEF7-6C89-43D7-B150-B865DF97F38F-12414-00000B9C467DB5B2
            if (options) break // exit if automated because we don't want to append to the results box
            // output
            const htmlRes = jsonToHtml(res.data, undefined, true)
            searchElements.resultsBox.innerHTML += `<div data-id="${res.id}" class="block-wrapper search-result disabled ${className}" data-group="${htmlRes.sortGroup}">${htmlRes.innerHTML}</div>`
            setTimeout(() => {
              searchElements.resultsBox.querySelector(`.block-wrapper[data-id="${res.id}"]`).addEventListener('click', function (e) {
                if (e.target.matches('.hs-close')) return
                const resultElement = searchElements.resultsBox.querySelector(`.block-wrapper[data-id="${res.id}"]`)
                if (e.target.classList.contains('disabled')) return
                console.groupCollapsed('Block Trace Info')
                const abilityIdTree = []
                if (!className) {
                  // Applies to all blocks
                  // Keep searching until we find an enclosing ability, custom rule, or object, or if we have a duplicate reference then just show the ID that is beign referenced.
                  let enclosingAbilityID = res.id.replace(/_b\d+$/, '')
                  let safetyCounter = 0; let secondarySearch = [{}]
                  while (secondarySearch.length > 0 && enclosingAbilityID !== secondarySearch[0].value && safetyCounter < 512) {
                    safetyCounter++
                    abilityIdTree.unshift(secondarySearch[0].id || enclosingAbilityID)
                    if (safetyCounter === 512) console.error('safety net reached')
                    secondarySearch = ProjectSearch.search(`^${enclosingAbilityID}$`, {
                      ft_ai: true,
                      ft_ri: true,
                      ft_oi: true,
                      ft_ci: true,
                      ft_rs: true,
                      ft_cs: true,
                      ft_fs: true,
                      opt_rg: true,
                      opt_cs: true,
                      opt_nl: true
                    })
                    if (secondarySearch.length > 1) {
                      console.warn('More than one ID Reference')
                      // break
                    }
                    if (secondarySearch.length > 0) {
                      // Get Object ID of rule if it exists
                      const data = secondarySearch[0].data
                      let containerID
                      if (getDataType(data) === 'rule') {
                        console.log(data)
                        let parent = hsProject.objects.find(o => o.rules.includes(data.id))
                        if (!parent) parent = hsProject.customRules.find(cr => cr.rules.includes(data.id))
                        if (!parent) parent = {}
                        containerID = data.objectID || parent.objectID || parent.id
                      }
                      console.log(secondarySearch, containerID)
                      enclosingAbilityID = containerID || secondarySearch[0].id?.replace(/_b\d+$/, '') || enclosingAbilityID
                    } else {
                      if (resultElement.querySelector('.trace')) {
                        resultElement.querySelector('.trace').remove()
                        console.groupEnd()
                      }
                      const icons = ProjectSearch.traceIcons
                      resultElement.innerHTML += `<div class="trace">Contained in deleted code ${icons}</div>`
                      addCloseTraceListener(resultElement)
                      return
                    }
                  }
                  blockData = {
                    block_class: 'control',
                    type: 123,
                    description: enclosingAbilityID.replace(/^(.{24}).*?$/, '$1...'),
                    controlScript: { abilityID: enclosingAbilityID }
                  }
                  const firstResult = secondarySearch[0]
                  if (firstResult.data.objectID === '') {
                    const ruleReferences = (hsProject.customRules || []).filter(cr => cr.rules.indexOf(secondarySearch[0].id) !== -1).concat((hsProject.objects || []).filter(o => o.rules.indexOf(secondarySearch[0].id) !== -1))
                    if (ruleReferences.length === 1) {
                      enclosingAbilityID = ruleReferences[0].objectID || ruleReferences[0].id
                      blockData = ruleReferences[0]
                      setClass(blockData.objectID ? 'obj' : 'crule')
                    }
                  } else {
                    blockData = firstResult.data
                  }
                  console.log(enclosingAbilityID, abilityIdTree)
                  console.log(safetyCounter, blockData)
                }
                if (!e.target.matches('.hs-see-code')) {
                  if (resultElement.querySelector('.trace')) {
                    resultElement.querySelector('.trace').remove()
                  }
                  if (blockData) {
                    console.log(blockData)
                    const name = htmlEscape(blockData.name || blockData.description)
                    const type = blockData.xPosition
                      ? 'object'
                      : (blockData.rules ? 'custom rule' : 'ability')
                    const icons = ProjectSearch.traceIcons
                    resultElement.innerHTML += `<div class="trace">Found in ${type} &ldquo;${name}&rdquo; ${icons}</div>`
                    addCloseTraceListener(resultElement)
                  }
                  console.log('Container Script vs Self', blockData, res)
                  console.groupEnd()
                  return
                }
                console.log(blockData || res.data)
                // console.log(res.data.controlScript?.abilityID);
                resultElement.removeAttribute('data')
                const id = blockData[getTargetClass(blockData)?.identifier]
                if (!id) return
                [id, ...abilityIdTree].forEach(id => {
                  const collapsedTarget = document.querySelector(`.bl-container [data-id*="${id}"]:not(.collapsible-container)`)
                  if (!collapsedTarget) return
                  const expandBtn = collapsedTarget.querySelector('.openbtn')
                  if (expandBtn) expandBlock({ target: expandBtn })
                })
                const targetBlock = document.querySelector(`.bl-container :is([data-id*="${res.id}"], [data-id*="${res.data.controlScript?.abilityID}"]) .block`)
                if (targetBlock) {
                  const onIos = (!!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform)) ||
                    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
                  targetBlock.classList.add(onIos ? 'focus-ios' : 'focus')
                  typeof targetBlock.scrollIntoViewIfNeeded === 'function' ? targetBlock.scrollIntoViewIfNeeded() : targetBlock.scrollIntoView()
                  setTimeout(function () { targetBlock.classList.remove('focus', 'focus-ios') }, 3000)
                }
                console.log(/* "Target to Open", collapsedTarget, */ 'Target Block', targetBlock)
                console.groupEnd()
              })
            }, 50)
            return htmlRes
          }
          case !!res.type.match(/^var/): // "velocity"
            searchElements.resultsBox.innerHTML += `<div class="search-result" data-id="${res.id}"><div class="block-wrapper disabled var-container">${doParameter({ datum: res.data })}</div></div>`
            searchElements.resultsBox.querySelector(`[data-id="${res.id}"] i.fa-external-link`).addEventListener('click', function (e) {
              console.log(res.data)
            })
            return doParameter({ datum: res.data })
        }
        /* eslint-enable no-fallthrough */
      })
      return searchResults
    } catch (e) {
      console.error(e)
      searchElements.resultsBox.innerHTML = '<span class="center">Invalid Expression</span>'
    }
  }
}

ProjectSearch.initSearchBar()
ProjectSearch.initOptions()
ProjectSearch.initResults()
