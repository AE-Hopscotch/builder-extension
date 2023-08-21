/* eslint-disable no-undef */
function getCursorContainer (cursor) {
  return cursor.cursorParent.matches('.collapsible')
    ? cursor.cursorParent
    : cursor.cursorParent.parentNode
}

const QuickType = {
  currentCursor: null,
  currentBlocks: {},
  replacements: { '\uff1c': '<', '\uff1e': '>', '≠': '!=' },
  refocusShown: false,
  populateOptions: function (input, optsContainer, selector) {
    const nameQuery = input.value.toLowerCase()
    const blocks = (nameQuery && Object.fromEntries([...blocksKeyboard.querySelectorAll(selector)]
      .filter(b => b.innerText.toLowerCase().includes(nameQuery))
      .map(b => [b.innerText.replace(/[\uff1c\uff1e≠]/, m0 => QuickType.replacements[m0]), b])
    )) || []
    QuickType.currentBlocks = blocks

    const options = Object.keys(blocks).sort((a, b) => {
      const startDiff = a.startsWith(nameQuery) - b.startsWith(nameQuery)
      if (startDiff) return startDiff
      return a < b ? -1 : 1
    })
    optsContainer.innerHTML = ''
    options.forEach((opt, index) => {
      const label = optsContainer.appendChild(document.createElement('label'))
      const radio = label.appendChild(document.createElement('input'))
      label.appendChild(document.createElement('span')).innerText = opt
      Object.assign(radio, { name: '_AE_quicktype-block', type: 'radio', value: opt })
      if (index === 0) label.classList.add('selected')
    })
  },
  /**
   * Adds a quicktype input where the current project cursor is
   * @param {any} cursor The Project Cursor
   */
  create: function (cursor) {
    /** @type {HTMLElement} */
    const parent = cursor.element.parentNode
    const container = parent.appendChild(document.createElement('div'))
    container.classList.add('_AE_quicktype-container')
    QuickType.currentCursor = cursor
    container.style = cursor.element.getAttribute('style')

    const input = container.appendChild(document.createElement('input'))
    input.placeholder = 'Type a block name...'
    const optsContainer = container.appendChild(document.createElement('div'))

    container.querySelector('input').focus()
    container.addEventListener('blur', QuickType.handleBlur, { capture: true })
    container.addEventListener('click', QuickType.handleBlur, { capture: true })
    input.addEventListener('keydown', e => QuickType.handleInputKey(container, e))
    const selector = '.keyboard-section:not(.kb-hide) .keyboard-blocks-container [data-group][data-json] > .block'
    input.addEventListener('input', () => QuickType.populateOptions(input, optsContainer, selector))
  },
  destroy: function (container, currentCursor, selected) {
    container.removeEventListener('blur', QuickType.destroy)
    container.removeEventListener('click', QuickType.destroy)
    container.remove()

    const position = currentCursor?.position
    if (!selected) return
    const block = QuickType.currentBlocks[selected.value]
    if (!block) return

    block.click()
    const parent = getCursorContainer(currentCursor)
    const newBlock = parent.children[position]
    if (!newBlock) return
    const newContainer = newBlock.querySelector('.collapsible')
    if (newContainer) {
      const pseudoFrame = newContainer.querySelector('.pseudo-frame') // can be null
      ProjectCursor.current = new ProjectCursor(newContainer, pseudoFrame, newBlock.dataset.group, newContainer)
    } else {
      ProjectCursor.current = new ProjectCursor(parent, newBlock, parent.parentNode.dataset.group, newBlock)
    }
    // Since we want to allow keyboard to invoke the quicktype again, show instructions if a parameter is selected
    if (BlockParameter.selected && !QuickType.refocusShown) {
      showTooltip(ProjectCursor.current, 'Esc to refocus')
      QuickType.refocusShown = true
    }
  },
  handleBlur: function (event) {
    const currentCursor = ProjectCursor.current
    const container = document.querySelector('._AE_quicktype-container')
    const activeEl = container?.querySelector(':active')
    const selected = event.relatedTarget || container?.querySelector('input:checked')
    const clicking = !selected && container.contains(event.target) && event.target !== container
    const focusWithin = !container || activeEl || clicking
    if (focusWithin && QuickType.currentCursor === currentCursor) return
    if (event.type === 'blur' && event.target.name === '_AE_quicktype-block') return

    event.stopPropagation()
    QuickType.destroy(container, currentCursor, selected)
  },
  handleInputKey: function (container, event) {
    if (event.metaKey || event.altKey || event.shiftKey || event.ctrlKey) return
    if (!['Escape', 'Enter', 'Tab', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
    event.preventDefault()
    event.stopPropagation()
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      return QuickType.changeSelection(container, event.key === 'ArrowUp')
    }
    if (event.key !== 'Escape') return container.querySelector('label.selected input').focus()
    QuickType.destroy(container, ProjectCursor.current, false)
  },
  changeSelection: function (container, previous = false) {
    const selected = container.querySelector('label.selected')
    if (!selected) return
    const labels = [...selected.parentNode.children]
    const selectedIndex = labels.indexOf(selected)
    const target = labels[selectedIndex + (previous ? -1 : 1)]
    if (!target) return
    selected.classList.remove('selected')
    target.classList.add('selected')
  },
  moveCursorIntoContainer: function (container, end = false) {
    const children = [...container.children]
    const target = (end ? children.reverse() : children).find(c => c.matches('.block-wrapper:not(.pseudo-frame)'))
    ProjectCursor.current?.destroy()
    ProjectCursor.current = new ProjectCursor(container, target || container, container.parentNode.dataset.group, !target || end)
  },
  moveCursor: function (previous = false) {
    const cursor = ProjectCursor.current
    const block = cursor && cursor.cursorParent
    if (!block) return

    const siblingKey = previous ? 'previousElementSibling' : 'nextElementSibling'
    const inverseSelector = previous ? '.cursor-after' : '.cursor-before'
    const sibling = block.matches(inverseSelector) ? block : block[siblingKey]
    if (sibling && sibling.matches('.block-wrapper:not(.collapsible-container)')) {
      // Just move the cursor to after
      const target = block.matches(inverseSelector) ? block : sibling
      ProjectCursor.current?.destroy()
      ProjectCursor.current = new ProjectCursor(block.parentNode, target, nodeTree(block, 2).dataset.group, !previous)
    } else if (sibling?.matches('.collapsible-container:not(.pseudo-frame)')) {
      // Entering a container
      const children = [...sibling.children]
      const script = (previous ? children.reverse() : children).find(c => c.matches('.collapsible'))
      this.moveCursorIntoContainer(script, previous)
    } else {
      // Exiting a container (may also be entering "else")
      const currentWrapper = block.matches('.collapsible') ? block : block.parentNode
      const nextWrapper = currentWrapper[siblingKey]
      if (nextWrapper && nextWrapper.matches('.collapsible')) return this.moveCursorIntoContainer(nextWrapper, previous)
      if (currentWrapper.parentNode === blocksWrapper) return
      ProjectCursor.current?.destroy()
      const target = currentWrapper.parentNode
      ProjectCursor.current = new ProjectCursor(target.parentNode, target, nodeTree(target, 2).dataset.group, !previous)
    }
  }
}

function showTooltip (cursor, message) {
  ContainerTooltip.destroyAll()
  const tooltip = new ContainerTooltip(cursor.element)
  document.getElementById('blocks-container-wrapper').appendChild(tooltip.element)
  const span = tooltip.element.appendChild(document.createElement('span'))
  span.innerText = message
  ContainerTooltip.selected = tooltip

  document.body.addEventListener('keydown', () => tooltip.destroy(), { once: true })
  document.body.addEventListener('click', () => tooltip.destroy(), { once: true })
  setTimeout(() => tooltip.destroy(true), 2000)
}

document.body.addEventListener('keydown', e => {
  if (e.key !== '/' || e.metaKey || e.altKey || e.shiftKey || e.ctrlKey) return
  const cursor = ProjectCursor.current
  if (!cursor) return
  if (BlockParameter.selected || document.querySelector('._AE_quicktype-container')) return
  e.preventDefault()
  QuickType.create(cursor)
})
document.body.addEventListener('keydown', e => {
  if (!['ArrowUp', 'ArrowDown'].includes(e.key) || e.metaKey || e.altKey || e.shiftKey || e.ctrlKey) return
  e.preventDefault()
  QuickType.moveCursor(e.key === 'ArrowUp')
})
