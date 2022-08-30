/* eslint-disable no-undef */
const TraitEditor = {
  container: null,
  prefill: function () {
    const project = hsProject
    const labels = this.container.querySelectorAll('label')
    labels.forEach(label => {
      const traitValue = project[label.dataset.traitName]
      if (!traitValue || typeof traitValue === 'object') return
      label.querySelector('input').value = traitValue
    })
    const stageSizeLabel = document.querySelector('[data-trait-name="stageSize"]')
    stageSizeLabel.children[0].value = project.stageSize.width
    stageSizeLabel.children[1].value = project.stageSize.height
  },
  init: function () {
    const container = this.container = document.getElementById('_AE_traits-editor')
    const traits = [
      { id: 'stageSize', name: 'Stage Size', type: 'number', fields: 2, separator: '\u00d7', pattern: '\\d+', required: true },
      { id: 'version', name: 'Editor Version', type: 'number', fields: 1, pattern: '\\d+', required: true },
      { id: 'playerVersion', name: 'Player Version', type: 'text', fields: 1, pattern: '^\\d+\\.\\d+\\.\\d+', required: true },
      { id: 'edited_at', name: 'Edited At', type: 'text', fields: 1, pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2}T([0-9]{2}(:(?!$)|Z$)){3}$', required: true, expand: true },
      { id: 'baseObjectScale', name: 'Base Object Scale', type: 'number', step: 'any', fields: 1, pattern: '(0\\.)?\\d+', required: true },
      { id: 'fontSize', name: 'Font Size', type: 'number', fields: 1, required: true },
      { id: 'video_url_path', name: 'Video URL Path', type: 'url', fields: 1, expand: true }
    ]
    const html = traits.map(t => {
      const stepIfNeeded = t.type === 'number' ? `step="${t.step || 1}"` : ''
      const patternIfNeeded = t.pattern ? `pattern="${t.pattern}" ${t.required ? 'required' : ''}` : ''
      const forIfNeeded = t.fields > 1 ? 'for' : ''
      const expandIfNeeded = t.expand ? 'class="expand"' : ''
      return `<label data-trait-name="${t.id}" ${forIfNeeded}>${t.name}: ${
        new Array(t.fields).fill(`<input type="${t.type}" ${expandIfNeeded} ${stepIfNeeded} ${patternIfNeeded}>`).join(t.separator)
      }</label>`
    }).join('')
    container.innerHTML = html
    this.prefill()
    container.addEventListener('focusout', this.updateTrait, { capture: true })
    this.extendRevisionHandler()
  },
  extendRevisionHandler: function () {
    RevisionAction.undoAETraitEdit = function (info) {
      RevisionAction.AETraitEdit(info, 'before')
    }
    RevisionAction.redoAETraitEdit = function (info) {
      RevisionAction.AETraitEdit(info, 'after')
    }
    RevisionAction.AETraitEdit = function (info, key) {
      hsProject[info.traitName] = info[key]
      TraitEditor.prefill()
    }
  },
  updateTrait: event => {
    const input = event.target
    if (input.tagName !== 'INPUT') return
    let value = input.type === 'number' ? parseFloat(input.value) : input.value
    const label = input.parentNode
    // Don't take invalid values
    if ([...label.children].some(l => !l.checkValidity())) return
    const trait = label.dataset.traitName
    if (trait === 'stageSize') {
      value = {
        width: parseInt(label.children[0].value),
        height: parseInt(label.children[1].value)
      }
      const oldSize = hsProject.stageSize
      // Return if no change
      if (oldSize.width === value.width && oldSize.height === value.height) return
    }
    if (value === '') value = undefined // Empty input = undefined
    const oldValue = hsProject[trait]
    // Return if no change
    if (oldValue === value) return
    // Update project trait
    hsProject[trait] = value
    // Replace node
    // eslint-disable-next-line no-self-assign
    input.outerHTML = input.outerHTML
    TraitEditor.prefill()
    return new ProjectRevision({
      type: 'AETraitEdit',
      traitName: trait,
      before: oldValue,
      after: value
    })
  }
}

TraitEditor.init()
window.addEventListener('project-load', () => TraitEditor.prefill(), { once: true })
