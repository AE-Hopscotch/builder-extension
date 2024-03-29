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
        case 'midiHackImport': return this.openMIDIHackPopup()
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
    modeTable.addEventListener('input', e => {
      const value = e.target.value
      colorContainer.querySelectorAll('[type]').forEach(element => element.setAttribute('type', value))
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
    closeBtn.addEventListener('click', () => {
      ScrollLocker.unlock()
      dialog.remove()
    })
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
      bgHsv: dialog.querySelector('[name="_AE_bg-mode"]:checked').value === 'hsb',
      colors: [...document.getElementById('color-preview-box').children]
        .map(input => input.value)
    }
    const start = performance.now() * 100
    PresetManager.loadPreset(hsProject, 'bg-' + type, options)
    const str = '%cCreated Gradient BG Rule ' +
      `(${Math.round(performance.now() * 100 - start) / 100}ms)`
    console.log(str, PresetManager.consoleMainStyle)

    ScrollLocker.unlock()
    dialog.remove()
  },
  openMIDIHackPopup: function () {
    const dialog = document.createElement('dialog')
    const header = document.createElement('h2')
    header.innerText = 'Hopscotch MIDI Hack'
    dialog.appendChild(header)

    const infoText = document.createElement('p')
    infoText.innerText = 'The Hopscotch MIDI Hack was orignially made by MR.GAM3R, allowing you to convert MIDI files into Hopscotch notes.'
    infoText.classList.add('info')
    dialog.appendChild(infoText)

    const nameLabel = document.createElement('p')
    nameLabel.innerText = 'Ability Name'
    dialog.appendChild(nameLabel)

    const nameInput = document.createElement('input')
    nameInput.placeholder = 'Never Gonna Give You Up'
    nameInput.type = 'text'
    nameInput.id = '_AE_midi-ability-input'
    dialog.appendChild(nameInput)

    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = '.mid,.midi'
    fileInput.id = '_AE_midi-hack-input'
    dialog.appendChild(fileInput)

    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0]
      if (nameInput.value || !file) return
      nameInput.value = this.dashedToTitle(file.name.replace(/\.midi?$/, ''))
    })

    const { closeBtn, saveBtn } = AEAddButtons(dialog)
    closeBtn.addEventListener('click', () => dialog.remove())
    saveBtn.addEventListener('click', () => this.importMIDI(dialog))
    dialog.classList.add('midi-hack-popup')
    document.body.appendChild(dialog)
    dialog.showModal()
  },
  dashedToTitle: function (string) {
    // Convert dashes and underscores to capital letters
    return string.replace(/(^\w)|[-_](?![a-hj-zA-HJ-Z]\b|the|an|and|but|for|or|nor|of|in)(.)|([-_])/g, function (m0, m1, m2, m3) { return m1 ? m1.toUpperCase() : m3 ? ' ' : ' ' + m2.toUpperCase() })
  },
  importMIDI: async function (dialog) {
    const file = document.getElementById('_AE_midi-hack-input').files[0]
    if (!file) return
    const start = performance.now() * 100
    const dataURL = await PresetManager.readFile('dataURL', file)
    const blocks = JSON.parse(`[${await this.base64ToMidi(dataURL)}]`)
    const ability = new ProjectAbility(blocks)
    const nameInput = document.getElementById('_AE_midi-ability-input')
    ability.name = nameInput.value || this.dashedToTitle(file.name.replace(/\.midi?$/, ''))
    console.log(`%cImported MIDI (${Math.round(performance.now() * 100 - start) / 100}ms)`, PresetManager.consoleMainStyle)
    // Remove dialog before creating project revision
    dialog.remove()
    const revision = new ProjectRevision({
      type: 'EditCustomBlock',
      blockID: ability.abilityID,
      blockClass: ProjectAbility,
      oldItem: null,
      newItem: ability
    })
    CustomBlockEditor.reloadExistingBlocks(revision.newItem.abilityID, true)
  },
  base64ToMidi: async function (base64AudioURL) {
    /* eslint-disable */
    !function(t, e){"object"==typeof exports && "object"==typeof module ? module.exports=e() : "function"==typeof define &&define.amd ? define([], e) : "object"==typeof exports ? exports.MidiConvert=e() : t.MidiConvert=e()}(ImportedLibraries, function(){return function(t){function e(r){if (n[r]) return n[r].exports;var i=n[r]={exports:{},id: r,loaded: !1};return t[r].call(i.exports, i, i.exports, e), i.loaded=!0, i.exports}var n={};return e.m=t, e.c=n, e.p="", e(0)}([function(t, e, n){"use strict";Object.defineProperty(e, "__esModule",{value: !0});var r=n(7),i=n(2),a={instrumentByPatchID: i.instrumentByPatchID,instrumentFamilyByID: i.instrumentFamilyByID,parse: function(t){return (new r.Midi).decode(t)},load: function(t, e){var n=(new r.Midi).load(t);return e && n.then(e), n},create: function(){return new r.Midi}};e.default=a, t.exports=a}, function(t, e){"use strict";function n(t){return t.replace(/\u0000/g, "")}function r(t, e){return 60 / e.bpm * (t / e.PPQ)}function i(t){return "number"==typeof t}function a(t){return "string"==typeof t}function o(t){var e=["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],n=Math.floor(t / 12) - 1,r=t % 12;return e[r] + n}var s=function(){var t=/^([a-g]{1}(?:b|#|x|bb)?)(-?[0-9]+)/i;return function(e){return a(e) && t.test(e)}}(),u=function(){var t=/^([a-g]{1}(?:b|#|x|bb)?)(-?[0-9]+)/i,e={cbb: -2,cb: -1,c: 0,"c#": 1,cx: 2,dbb: 0,db: 1,d: 2,"d#": 3,dx: 4,ebb: 2,eb: 3,e: 4,"e#": 5,ex: 6,fbb: 3,fb: 4,f: 5,"f#": 6,fx: 7,gbb: 5,gb: 6,g: 7,"g#": 8,gx: 9,abb: 7,ab: 8,a: 9,"a#": 10,ax: 11,bbb: 9,bb: 10,b: 11,"b#": 12,bx: 13};return function(n){var r=t.exec(n),i=r[1],a=r[2],o=e[i.toLowerCase()];return o + 12 * (parseInt(a) + 1)}}();t.exports={cleanName: n,ticksToSeconds: r,isString: a,isNumber: i,isPitch: s,midiToPitch: o,pitchToMidi: u}}, function(t, e){"use strict";function n(t, e, n){return e in t ? Object.defineProperty(t, e,{value: n,enumerable: !0,configurable: !0,writable: !0}) : t[e]=n, t}Object.defineProperty(e, "__esModule",{value: !0});var r;e.instrumentByPatchID=["acoustic grand piano", "bright acoustic piano","electric grand piano", "honky-tonk piano", "electric piano 1","electric piano 2", "harpsichord", "clavi", "celesta", "glockenspiel","music box", "vibraphone", "marimba", "xylophone", "tubular bells","dulcimer", "drawbar organ", "percussive organ", "rock organ", "church organ","reed organ", "accordion", "harmonica", "tango accordion","acoustic guitar (nylon)", "acoustic guitar (steel)","electric guitar (jazz)", "electric guitar (clean)","electric guitar (muted)", "overdriven guitar", "distortion guitar","guitar harmonics", "acoustic bass", "electric bass (finger)","electric bass (pick)", "fretless bass", "slap bass 1", "slap bass 2","synth bass 1", "synth bass 2", "violin", "viola", "cello", "contrabass","tremolo strings", "pizzicato strings", "orchestral harp", "timpani","string ensemble 1", "string ensemble 2", "synthstrings 1", "synthstrings 2","choir aahs", "voice oohs", "synth voice", "orchestra hit", "trumpet","trombone", "tuba", "muted trumpet", "french horn", "brass section","synthbrass 1", "synthbrass 2", "soprano sax", "alto sax", "tenor sax","baritone sax", "oboe", "english horn", "bassoon", "clarinet", "piccolo","flute", "recorder", "pan flute", "blown bottle", "shakuhachi", "whistle","ocarina", "lead 1 (square)", "lead 2 (sawtooth)", "lead 3 (calliope)","lead 4 (chiff)", "lead 5 (charang)", "lead 6 (voice)", "lead 7 (fifths)","lead 8 (bass + lead)", "pad 1 (new age)", "pad 2 (warm)","pad 3 (polysynth)", "pad 4 (choir)", "pad 5 (bowed)", "pad 6 (metallic)","pad 7 (halo)", "pad 8 (sweep)", "fx 1 (rain)", "fx 2 (soundtrack)","fx 3 (crystal)", "fx 4 (atmosphere)", "fx 5 (brightness)", "fx 6 (goblins)","fx 7 (echoes)", "fx 8 (sci-fi)", "sitar", "banjo", "shamisen", "koto","kalimba", "bag pipe", "fiddle", "shanai", "tinkle bell", "agogo","steel drums", "woodblock", "taiko drum", "melodic tom", "synth drum","reverse cymbal", "guitar fret noise", "breath noise", "seashore","bird tweet", "telephone ring", "helicopter", "applause", "gunshot"], e.instrumentFamilyByID=["piano", "chromatic percussion", "organ", "guitar","bass", "strings", "ensemble", "brass", "reed", "pipe", "synth lead","synth pad", "synth effects", "ethnic", "percussive", "sound effects"], e.drumKitByPatchID=(r={}, n(r, 0, "standard kit"), n(r, 8, "room kit"), n(r, 16, "power kit"), n(r, 24, "electronic kit"), n(r, 25, "tr-808 kit"),n(r, 32, "jazz kit"), n(r, 40, "brush kit"), n(r, 48, "orchestra kit"), n(r,56, "sound fx kit"), r)}, function(t, e){"use strict";function n(t, e){var n=0,r=t.length,i=r;if (r > 0 && t[r - 1].time <=e) return r - 1;for (; n < i;){var a=Math.floor(n + (i - n) / 2),o=t[a],s=t[a + 1];if (o.time===e){for (var u=a; u < t.length; u++){var c=t[u];c.time===e && (a=u)}return a}if (o.time < e && s.time > e) return a;o.time > e ? i=a : o.time < e && (n=a + 1)}return -1}function r(t, e){if (t.length){var r=n(t, e.time);t.splice(r + 1, 0, e)}else t.push(e)}Object.defineProperty(e, "__esModule",{value: !0}), e.BinaryInsert=r}, function(t, e){"use strict";function n(t, e){if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function")}Object.defineProperty(e, "__esModule",{value: !0});var r=function(){function t(t, e){for (var n=0; n < e.length; n++){var r=e[n];r.enumerable=r.enumerable || !1, r.configurable=!0, "value" in r &&(r.writable=!0), Object.defineProperty(t, r.key, r)}}return function(e, n, r){return n && t(e.prototype, n), r && t(e, r), e}}(),i={1: "modulationWheel",2: "breath",4: "footController",5: "portamentoTime",7: "volume",8: "balance",10: "pan",64: "sustain",65: "portamentoTime",66: "sostenuto",67: "softPedal",68: "legatoFootswitch",84: "portamentoContro"},a=function(){function t(e, r, i){n(this, t), this.number=e, this.time=r, this.value=i}return r(t, [{key: "name",get: function(){if (i.hasOwnProperty(this.number)) return i[this.number]}}]), t}();e.Control=a}, function(t, e){"use strict";function n(t){for (var e={PPQ: t.header.ticksPerBeat}, n=0; n < t.tracks.length; n++)for (var r=t.tracks[n], i=0; i < r.length; i++){var a=r[i];"meta"===a.type && ("timeSignature"===a.subtype ? e.timeSignature=[a.numerator, a.denominator] : "setTempo"===a.subtype && (e.bpm || (e.bpm=6e7 / a.microsecondsPerBeat)))}return e.bpm=e.bpm || 120, e}Object.defineProperty(e, "__esModule",{value: !0}), e.parseHeader=n}, function(t, e){"use strict";function n(t, e){for (var n=0; n < t.length; n++){var r=t[n],i=e[n];if (r.length > i) return !0}return !1}function r(t, e, n){for (var r=0, i=1 / 0, a=0; a < t.length; a++){var o=t[a],s=e[a];o[s] && o[s].time < i && (r=a, i=o[s].time)}n[r](t[r][e[r]]), e[r] +=1}function i(){for (var t=arguments.length, e=Array(t), i=0; i < t; i++) e[i]=arguments[i];for (var a=e.filter(function(t, e){return e % 2===0}), o=new Uint32Array(a.length), s=e.filter(function(t, e){return e % 2===1}); n(a, o);) r(a, o, s)}Object.defineProperty(e, "__esModule",{value: !0}), e.Merge=i}, function(t, e, n){"use strict";function r(t){return t && t.__esModule ? t :{default: t}}function i(t, e){if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function")}Object.defineProperty(e, "__esModule",{value: !0}), e.Midi=void 0;var a=function(){function t(t, e){for (var n=0; n < e.length; n++){var r=e[n];r.enumerable=r.enumerable || !1, r.configurable=!0, "value" in r &&(r.writable=!0), Object.defineProperty(t, r.key, r)}}return function(e, n, r){return n && t(e.prototype, n), r && t(e, r), e}}(),o=n(11),s=r(o),u=n(10),c=r(u),h=n(1),f=r(h),d=n(9),l=n(5),p=function(){function t(){i(this, t), this.header={bpm: 120,timeSignature: [4, 4],PPQ: 480}, this.tracks=[]}return a(t, [{key: "load",value: function(t){var e=this,n=arguments.length > 1 && void 0 !==arguments[1] ? arguments[1] : null,r=arguments.length > 2 && void 0 !==arguments[2] ? arguments[2] : "GET";return new Promise(function(i, a){var o=new XMLHttpRequest;o.open(r, t), o.responseType="arraybuffer", o.addEventListener("load",function(){4===o.readyState && 200===o.status ? i(e.decode(o.response)) :a(o.status)}), o.addEventListener("error", a),o.send(n)})}},{key: "decode",value: function(t){var e=this;if (t instanceof ArrayBuffer){var n=new Uint8Array(t);t=String.fromCharCode.apply(null, n)}var r=(0, s.default)(t);return this.header=(0, l.parseHeader)(r), this.tracks=[],r.tracks.forEach(function(t, n){var r=new d.Track;r.id=n, e.tracks.push(r);var i=0;t.forEach(function(t){i +=f.default.ticksToSeconds(t.deltaTime, e.header), "meta"===t.type &&"trackName"===t.subtype ?r.name=f.default.cleanName(t.text) : "noteOn"===t.subtype ? (r.noteOn(t.noteNumber,i, t.velocity /127), r.channelNumber===-1 && (r.channelNumber=t.channel)) :"noteOff"===t.subtype ?r.noteOff(t.noteNumber, i) :"controller"===t.subtype &&t.controllerType ? r.cc(t.controllerType, i, t.value / 127) :"meta"===t.type &&"instrumentName"===t.subtype ?r.instrument=t.text :"channel"===t.type &&"programChange"===t.subtype &&(r.patch(t.programNumber),r.channelNumber=t.channel)}), e.header.name || r.length || !r.name ||(e.header.name=r.name)}), this}},{key: "encode",value: function(){var t=this,e=new c.default.File({ticks: this.header.PPQ}),n=this.tracks.filter(function(t){return !t.length})[0];if (this.header.name && (!n || n.name !==this.header.name)){var r=e.addTrack();r.addEvent(new c.default.MetaEvent({time: 0,type: c.default.MetaEvent.TRACK_NAME,data: this.header.name}))}return this.tracks.forEach(function(n){var r=e.addTrack();r.setTempo(t.bpm), n.encode(r, t.header)}), e.toBytes()}},{key: "toArray",value: function(){for (var t=this.encode(), e=new Array(t.length),n=0; n < t.length; n++) e[n]=t.charCodeAt(n);return e}},{key: "toJSON",value: function(){return{header: this.header,startTime: this.startTime,duration: this.duration,tracks: (this.tracks || []).map(function(t){return t.toJSON()})}}},{key: "track",value: function t(e){var t=new d.Track(e);return this.tracks.push(t), t}},{key: "get",value: function(t){return f.default.isNumber(t) ? this.tracks[t] : this.tracks.find(function(e){return e.name===t})}},{key: "slice",value: function(){var e=arguments.length > 0 && void 0 !==arguments[0] ? arguments[0] : 0,n=arguments.length > 1 && void 0 !==arguments[1] ? arguments[1] : this.duration,r=new t;return r.header=this.header, r.tracks=this.tracks.map(function(t){return t.slice(e, n)}), r}},{key: "startTime",get: function(){var t=this.tracks.map(function(t){return t.startTime});return Math.min.apply(Math, t)}},{key: "bpm",get: function(){return this.header.bpm},set: function(t){var e=this.header.bpm;this.header.bpm=t;var n=e / t;this.tracks.forEach(function(t){return t.scale(n)})}},{key: "timeSignature",get: function(){return this.header.timeSignature},set: function(t){this.header.timeSignature=t}},{key: "duration",get: function(){var t=this.tracks.map(function(t){return t.duration});return Math.max.apply(Math, t)}}]), t}();e.Midi=p}, function(t, e, n){"use strict";function r(t){return t && t.__esModule ? t :{default: t}}function i(t, e){if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function")}Object.defineProperty(e, "__esModule",{value: !0}), e.Note=void 0;var a=function(){function t(t, e){for (var n=0; n < e.length; n++){var r=e[n];r.enumerable=r.enumerable || !1, r.configurable=!0, "value" in r &&(r.writable=!0), Object.defineProperty(t, r.key, r)}}return function(e, n, r){return n && t(e.prototype, n), r && t(e, r), e}}(),o=n(1),s=r(o),u=function(){function t(e, n){var r=arguments.length > 2 && void 0 !==arguments[2] ? arguments[2] :0,a=arguments.length > 3 && void 0 !==arguments[3] ? arguments[3] :1;if (i(this, t), s.default.isNumber(e)) this.midi=e;else{if (!s.default.isPitch(e)) throw new Error("the midi value must either be in Pitch Notation (e.g. C#4) or a midi value");this.name=e}this.time=n, this.duration=r, this.velocity=a}return a(t, [{key: "match",value: function(t){return s.default.isNumber(t) ? this.midi===t : s.default.isPitch(t) ? this.name.toLowerCase()===t.toLowerCase() :void 0}},{key: "toJSON",value: function(){return{name: this.name,midi: this.midi,time: this.time,velocity: this.velocity,duration: this.duration}}},{key: "name",get: function(){return s.default.midiToPitch(this.midi)},set: function(t){this.midi=s.default.pitchToMidi(t)}},{key: "noteOn",get: function(){return this.time},set: function(t){this.time=t}},{key: "noteOff",get: function(){return this.time + this.duration},set: function(t){this.duration=t - this.time}}]), t}();e.Note=u}, function(t, e, n){"use strict";function r(t, e){if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function")}Object.defineProperty(e, "__esModule",{value: !0}), e.Track=void 0;var i=function(){function t(t, e){for (var n=0; n < e.length; n++){var r=e[n];r.enumerable=r.enumerable || !1, r.configurable=!0, "value" in r &&(r.writable=!0), Object.defineProperty(t, r.key, r)}}return function(e, n, r){return n && t(e.prototype, n), r && t(e, r), e}}(),a=n(3),o=n(4),s=n(6),u=n(8),c=n(2),h=function(){function t(e){var n=arguments.length > 1 && void 0 !==arguments[1] ? arguments[1] :-1,i=arguments.length > 2 && void 0 !==arguments[2] ? arguments[2] :-1;r(this, t), this.name=e, this.channelNumber=i, this.notes=[], this.controlChanges={},this.instrumentNumber=n}return i(t, [{key: "note",value: function t(e, n){var r=arguments.length > 2 && void 0 !==arguments[2] ? arguments[2] : 0,i=arguments.length > 3 && void 0 !==arguments[3] ? arguments[3] : 1,t=new u.Note(e, n, r, i);return (0, a.BinaryInsert)(this.notes, t), this}},{key: "noteOn",value: function(t, e){var n=arguments.length > 2 && void 0 !==arguments[2] ? arguments[2] : 1,r=new u.Note(t, e, 0, n);return (0, a.BinaryInsert)(this.notes, r), this}},{key: "noteOff",value: function(t, e){for (var n=0; n < this.notes.length; n++){var r=this.notes[n];if (r.match(t) && 0===r.duration){r.noteOff=e;break}}return this}},{key: "cc",value: function t(e, n, r){this.controlChanges.hasOwnProperty(e) || (this.controlChanges[e]=[]);var t=new o.Control(e, n, r);return (0, a.BinaryInsert)(this.controlChanges[e], t),this}},{key: "patch",value: function(t){return this.instrumentNumber=t, this}},{key: "channel",value: function(t){return this.channelNumber=t, this}},{key: "scale",value: function(t){return this.notes.forEach(function(e){e.time *=t, e.duration *=t}), this}},{key: "slice",value: function(){var e=arguments.length > 0 && void 0 !==arguments[0] ? arguments[0] : 0,n=arguments.length > 1 && void 0 !==arguments[1] ? arguments[1] : this.duration,r=Math.max(this.notes.findIndex(function(t){return t.time >=e}), 0),i=this.notes.findIndex(function(t){return t.noteOff >=n}) + 1,a=new t(this.name);return a.notes=this.notes.slice(r, i), a.notes.forEach(function(t){return t.time=t.time - e}), a}},{key: "encode",value: function(t, e){function n(t){var e=Math.floor(r * t),n=Math.max(e - i, 0);return i=e, n}var r=e.PPQ / (60 / e.bpm),i=0,a=Math.max(0, this.channelNumber);this.instrumentNumber !==-1 && t.instrument(a, this.instrumentNumber),(0, s.Merge)(this.noteOns, function(e){t.addNoteOn(a, e.name, n(e.time), Math.floor(127 * e.velocity))}, this.noteOffs, function(e){t.addNoteOff(a, e.name, n(e.time))})}},{key: "toJSON",value: function(){var t={startTime: this.startTime,duration: this.duration,length: this.length};return "undefined" !=typeof this.id && (t.id=this.id),this.name && (t.name=this.name), this.instrumentNumber !==-1 && (t.instrumentNumber=this.instrumentNumber,t.instrument=this.instrument, t.instrumentFamily=this.instrumentFamily), this.channelNumber !==-1 && (t.channelNumber=this.channelNumber, t.isPercussion=this.isPercussion), this.notes.length && (t.notes=this.notes.map(function(t){return t.toJSON()})), Object.keys(this.controlChanges).length &&(t.controlChanges=this.controlChanges), t}},{key: "noteOns",get: function(){var t=[];return this.notes.forEach(function(e){t.push({time: e.noteOn,midi: e.midi,name: e.name,velocity: e.velocity})}), t}},{key: "noteOffs",get: function(){var t=[];return this.notes.forEach(function(e){t.push({time: e.noteOff,midi: e.midi,name: e.name})}), t}},{key: "length",get: function(){return this.notes.length}},{key: "startTime",get: function(){if (this.notes.length){var t=this.notes[0];return t.noteOn}return 0}},{key: "duration",get: function(){if (this.notes.length){var t=this.notes[this.notes.length - 1];return t.noteOff}return 0}},{key: "instrument",get: function(){return this.isPercussion ? c.drumKitByPatchID[this.instrumentNumber] :c.instrumentByPatchID[this.instrumentNumber]},set: function(t){var e=c.instrumentByPatchID.indexOf(t);e !==-1 && (this.instrumentNumber=e)}},{key: "isPercussion",get: function(){return [9, 10].includes(this.channelNumber)}},{key: "instrumentFamily",get: function(){return this.isPercussion ? "drums" : c.instrumentFamilyByID[Math.floor(this.instrumentNumber / 8)]}}]), 
    t}();e.Track=h}, function(t, e, n){(function(t){var n={};! function(t){var e=t.DEFAULT_VOLUME=90,n=(t.DEFAULT_DURATION=128, t.DEFAULT_CHANNEL=0,{midi_letter_pitches:{a: 21,b: 23,c: 12,d: 14,e: 16,f: 17,g: 19},midiPitchFromNote: function(t){var e=/([a-g])(#+|b+)?([0-9]+)$/i.exec(t),r=e[1].toLowerCase(),i=e[2] || "",a=parseInt(e[3], 10);return 12 * a + n.midi_letter_pitches[r] + ("#"==i.substr(0, 1) ? 1 : -1) * i.length},ensureMidiPitch: function(t){return "number" !=typeof t && /[^0-9]/.test(t) ? n.midiPitchFromNote(t) : parseInt(t, 10)},midi_pitches_letter:{12: "c",13: "c#",14: "d",15: "d#",16: "e",17: "f",18: "f#",19: "g",20: "g#",21: "a",22: "a#",23: "b"},midi_flattened_notes:{"a#": "bb","c#": "db","d#": "eb","f#": "gb","g#": "ab"},noteFromMidiPitch: function(t, e){var r, i=0,a=t,e=e || !1;return t > 23 && (i=Math.floor(t / 12) - 1, a=t -12 * i), r=n.midi_pitches_letter[a], e && r.indexOf("#") > 0 && (r=n.midi_flattened_notes[r]), r + i},mpqnFromBpm: function(t){var e=Math.floor(6e7 / t),n=[];do n.unshift(255 & e), e >>=8; while (e);for (; n.length < 3;) n.push(0);return n},bpmFromMpqn: function(t){var e=t;if ("undefined" !=typeof t[0]){e=0;for (var n=0, r=t.length - 1; r >=0; ++n, --r) e |=t[n] << r}return Math.floor(6e7 / t)},codes2Str: function(t){return String.fromCharCode.apply(null, t)},str2Bytes: function(t, e){if (e)for (; t.length / 2 < e;) t="0" + t;for (var n=[], r=t.length - 1; r >=0; r -=2){var i=0===r ? t[r] : t[r - 1] + t[r];n.unshift(parseInt(i, 16))}return n},translateTickTime: function(t){for (var e=127 & t; t >>=7;) e <<=8, e |=127 & t |128;for (var n=[];;){if (n.push(255 & e), !(128 & e)) break;e >>=8}return n}}),r=function(t){return this ? void(!t || null===t.type && void 0===t.type ||null===t.channel && void 0===t.channel || null===t.param1 &&void 0===t.param1 || (this.setTime(t.time), this.setType(t.type), this.setChannel(t.channel), this.setParam1(t.param1), this.setParam2(t.param2))) : new r(t)};r.NOTE_OFF=128, r.NOTE_ON=144, r.AFTER_TOUCH=160, r.CONTROLLER=176, r.PROGRAM_CHANGE=192, r.CHANNEL_AFTERTOUCH=208, r.PITCH_BEND=224, r.prototype.setTime=function(t){this.time=n.translateTickTime(t || 0)}, r.prototype.setType=function(t){if (t < r.NOTE_OFF || t > r.PITCH_BEND) throw new Error("Trying to set an unknown event: " + t);this.type=t}, r.prototype.setChannel=function(t){if (t < 0 || t > 15) throw new Error("Channel is out of bounds.");this.channel=t}, r.prototype.setParam1=function(t){this.param1=t}, r.prototype.setParam2=function(t){this.param2=t}, r.prototype.toBytes=function(){var t=[],e=this.type | 15 & this.channel;return t.push.apply(t, this.time), t.push(e), t.push(this.param1),void 0 !==this.param2 && null !==this.param2 && t.push(this.param2), t};var i=function(t){if (!this) return new i(t);this.setTime(t.time), this.setType(t.type), this.setData(t.data)};i.SEQUENCE=0, i.TEXT=1, i.COPYRIGHT=2, i.TRACK_NAME=3, i.INSTRUMENT=4, i.LYRIC=5, i.MARKER=6, i.CUE_POINT=7, i.CHANNEL_PREFIX=32,i.END_OF_TRACK=47, i.TEMPO=81, i.SMPTE=84, i.TIME_SIG=88, i.KEY_SIG=89, i.SEQ_EVENT=127, i.prototype.setTime=function(t){this.time=n.translateTickTime(t || 0)}, i.prototype.setType=function(t){this.type=t}, i.prototype.setData=function(t){this.data=t}, i.prototype.toBytes=function(){if (!this.type) throw new Error("Type for meta-event not specified.");var t=[];if (t.push.apply(t, this.time), t.push(255, this.type), Array.isArray(this.data)) t.push(this.data.length), t.push.apply(t,this.data);else if ("number"==typeof this.data) t.push(1, this.data);else if (null !==this.data && void 0 !==this.data){t.push(this.data.length);var e=this.data.split("").map(function(t){return t.charCodeAt(0)});t.push.apply(t, e)}else t.push(0);return t};var a=function(t){if (!this) return new a(t);var e=t ||{};this.events=e.events || []};a.START_BYTES=[77, 84, 114, 107], a.END_BYTES=[0, 255, 47, 0], a.prototype.addEvent=function(t){return this.events.push(t), this}, a.prototype.addNoteOn=a.prototype.noteOn=function(t, i, a, o){return this.events.push(new r({type: r.NOTE_ON,channel: t,param1: n.ensureMidiPitch(i),param2: o || e,time: a || 0})), this}, a.prototype.addNoteOff=a.prototype.noteOff=function(t, i, a, o){return this.events.push(new r({type: r.NOTE_OFF,channel: t,param1: n.ensureMidiPitch(i),param2: o || e,time: a || 0})), this}, a.prototype.addNote=a.prototype.note=function(t, e, n, r, i){return this.noteOn(t, e, r, i), n && this.noteOff(t, e, n, i),this}, a.prototype.addChord=a.prototype.chord=function(t, e, n, r){if (!Array.isArray(e) && !e.length) throw new Error("Chord must be an array of pitches");return e.forEach(function(e){this.noteOn(t, e, 0, r)}, this), e.forEach(function(e, r){0===r ? this.noteOff(t, e, n) : this.noteOff(t, e)}, this), this}, a.prototype.setInstrument=a.prototype.instrument=function(t, e,n){return this.events.push(new r({type: r.PROGRAM_CHANGE,channel: t,param1: e,time: n || 0})), this}, a.prototype.setTempo=a.prototype.tempo=function(t, e){return this.events.push(new i({type: i.TEMPO,data: n.mpqnFromBpm(t),time: e || 0})), this}, a.prototype.toBytes=function(){var t=0,e=[],r=a.START_BYTES,i=a.END_BYTES,o=function(n){var r=n.toBytes();t +=r.length, e.push.apply(e, r)};this.events.forEach(o), t +=i.length;var s=n.str2Bytes(t.toString(16), 4);return r.concat(s, e, i)};var o=function(t){if (!this) return new o(t);var e=t ||{};if (e.ticks){if ("number" !=typeof e.ticks) throw new Error("Ticks per beat must be a number!");if (e.ticks <=0 || e.ticks >=32768 || e.ticks % 1 !==0)throw new Error("Ticks per beat must be an integer between 1 and 32767!")}this.ticks=e.ticks || 128, this.tracks=e.tracks || []};o.HDR_CHUNKID="MThd", o.HDR_CHUNK_SIZE="\0\0\0", o.HDR_TYPE0="\0\0", o.HDR_TYPE1="\0", o.prototype.addTrack=function(t){return t ? (this.tracks.push(t), this) : (t=new a, this.tracks.push(t), t)}, o.prototype.toBytes=function(){var t=this.tracks.length.toString(16),e=o.HDR_CHUNKID + o.HDR_CHUNK_SIZE;return e +=parseInt(t, 16) > 1 ? o.HDR_TYPE1 : o.HDR_TYPE0, e +=n.codes2Str(n.str2Bytes(t, 2)), e +=String.fromCharCode(this.ticks / 256, this.ticks % 256), this.tracks.forEach(function(t){e +=n.codes2Str(t.toBytes())}), e}, t.Util=n, t.File=o, t.Track=a, t.Event=r, t.MetaEvent=i}(n), "undefined" !=typeof t && null !==t ? t.exports=n : "undefined" !=typeof e && null !==e ? e=n : this.Midi=n}).call(e, n(12)(t))}, function(t, e){function n(t){function e(t){var e=t.read(4),n=t.readInt32();return{id: e,length: n,data: t.read(n)}}function n(t){var e={};e.deltaTime=t.readVarInt();var n=t.readInt8();if (240==(240 & n)){if (255==n){e.type="meta";var r=t.readInt8(),a=t.readVarInt();switch (r){case 0:if (e.subtype="sequenceNumber", 2 !=a) throw "Expected length for sequenceNumber event is 2, got " +a;return e.number=t.readInt16(), e;case 1:return e.subtype="text", e.text=t.read(a), e;case 2:return e.subtype="copyrightNotice", e.text=t.read(a), e;case 3:return e.subtype="trackName", e.text=t.read(a), e;case 4:return e.subtype="instrumentName", e.text=t.read(a), e;case 5:return e.subtype="lyrics", e.text=t.read(a), e;case 6:return e.subtype="marker", e.text=t.read(a), e;case 7:return e.subtype="cuePoint", e.text=t.read(a), e;case 32:if (e.subtype="midiChannelPrefix", 1 !=a) throw "Expected length for midiChannelPrefix event is 1, got " +a;return e.channel=t.readInt8(), e;case 47:if (e.subtype="endOfTrack", 0 !=a) throw "Expected length for endOfTrack event is 0, got " +a;return e;case 81:if (e.subtype="setTempo", 3 !=a) throw "Expected length for setTempo event is 3, got " +a;return e.microsecondsPerBeat=(t.readInt8() << 16) + (t.readInt8() <<8) + t.readInt8(), e;case 84:if (e.subtype="smpteOffset", 5 !=a) throw "Expected length for smpteOffset event is 5, got " +a;var o=t.readInt8();return e.frameRate={0: 24,32: 25,64: 29,96: 30}[96 & o], e.hour=31 & o, e.min=t.readInt8(), e.sec=t.readInt8(), e.frame=t.readInt8(), e.subframe=t.readInt8(),e;case 88:if (e.subtype="timeSignature", 4 !=a) throw "Expected length for timeSignature event is 4, got " +a;return e.numerator=t.readInt8(), e.denominator=Math.pow(2,t.readInt8()), e.metronome=t.readInt8(), e.thirtyseconds=t.readInt8(), e;case 89:if (e.subtype="keySignature", 2 !=a) throw "Expected length for keySignature event is 2, got " +a;return e.key=t.readInt8(!0), e.scale=t.readInt8(), e;case 127:return e.subtype="sequencerSpecific", e.data=t.read(a), e;default:return e.subtype="unknown", e.data=t.read(a), e}return e.data=t.read(a), e}if (240==n){e.type="sysEx";var a=t.readVarInt();return e.data=t.read(a), e}if (247==n){e.type="dividedSysEx";var a=t.readVarInt();return e.data=t.read(a), e}throw "Unrecognised MIDI event type byte: " + n}var s;0==(128 & n) ? (s=n, n=i) : (s=t.readInt8(), i=n);var u=n >> 4;switch (e.channel=15 & n, e.type="channel", u){case 8:return e.subtype="noteOff", e.noteNumber=s, e.velocity=t.readInt8(),e;case 9:return e.noteNumber=s, e.velocity=t.readInt8(), 0==e.velocity ?e.subtype="noteOff" : e.subtype="noteOn", e;case 10:return e.subtype="noteAftertouch", e.noteNumber=s, e.amount=t.readInt8(),e;case 11:return e.subtype="controller", e.controllerType=s, e.value=t.readInt8(),e;case 12:return e.subtype="programChange", e.programNumber=s, e;case 13:return e.subtype="channelAftertouch", e.amount=s, e;case 14:return e.subtype="pitchBend", e.value=s + (t.readInt8() << 7), e;default:throw "Unrecognised MIDI event type: " + u}}var i;stream=r(t);var a=e(stream);if ("MThd" !=a.id || 6 !=a.length) throw "Bad .mid file - header not found";var o=r(a.data),s=o.readInt16(),u=o.readInt16(),c=o.readInt16();if (32768 & c) throw "Expressing time division in SMTPE frames is not supported yet";ticksPerBeat=c;for (var h={formatType: s,trackCount: u,ticksPerBeat: ticksPerBeat}, f=[], d=0; d < h.trackCount; d++){f[d]=[];var l=e(stream);if ("MTrk" !=l.id) throw "Unexpected chunk - expected MTrk, got " + l.id;for (var p=r(l.data); !p.eof();){var m=n(p);f[d].push(m)}}return{header: h,tracks: f}}function r(t){function e(e){var n=t.substr(s, e);return s +=e, n}function n(){var e=(t.charCodeAt(s) << 24) + (t.charCodeAt(s + 1) << 16) + (t.charCodeAt(s + 2) << 8) + t.charCodeAt(s + 3);return s +=4, e}function r(){var e=(t.charCodeAt(s) << 8) + t.charCodeAt(s + 1);return s +=2, e}function i(e){var n=t.charCodeAt(s);return e && n > 127 && (n -=256), s +=1, n}function a(){return s >=t.length}function o(){for (var t=0;;){var e=i();if (!(128 & e)) return t + e;t +=127 & e, t <<=7}}var s=0;return{eof: a,read: e,readInt32: n,readInt16: r,readInt8: i,readVarInt: o}}t.exports=function(t){return n(t)}}, function(t, e){t.exports=function(t){return t.webpackPolyfill || (t.deprecate=function(){}, t.paths=[], t.children=[],t.webpackPolyfill=1), t}}])});/*# sourceMappingURL=MidiConvert.js.map*/
    /*/																														/*/
    /*		Huge credit to MIDIConvert (https://tonejs.github.io/MidiConvert/) for the MIDI to JSON code!					 */
    /*		Without it, this would not have been possible! Also credit to BuildASnowman for making the original MIDI hack!	 */
    /*		MIDI Hack made by MR.GAM3R. Integrated into Siri Shortcuts + the Web Editor by Awesome_E			 */
    /*/																														/*/
    function parseFile(file){return new Promise(resolve=>{/*read the file*/var reader=new FileReader();reader.onload=function(e){var partsData=ImportedLibraries.MidiConvert.parse(e.target.result);var data=JSON.stringify(partsData, undefined, 2);var json=JSON.parse(data);var tracks=json.tracks; var oldFormatNotes=[]; var oldFormatTimes=[];for (var z=0; z < tracks.length; z++){var track=tracks[z]; var notes=track.notes;if (track.notes !==undefined){for (var x=0; x < notes.length; x++){oldFormatNotes.push(notes[x].name); oldFormatTimes.push(notes[x].time);}/* end for */}/* end if */}/* end for */ var list=[]; for (var j=0; j < oldFormatNotes.length; j++){list.push({'note_name': oldFormatNotes[j], 'note_time': oldFormatTimes[j]});}/* end for */ list.sort(function(a, b){return ((a.note_time < b.note_time) ? -1 : ((a.note_time==b.note_time) ? 0 : 1));}); for (var k=0; k < list.length; k++){oldFormatNotes[k]=list[k].note_name; oldFormatTimes[k]=list[k].note_time;}/* end for */ var hopscotchCode="";var currentTime=0;var midiTimes=[];var midiNotes=[]; for (var i=0; i < oldFormatNotes.length; i++){var note=oldFormatNotes[i]; var first=note.charAt(0); var last=note.charAt(note.length); var accidental=""; var low=""; if (note.length===3){if (first.toLowerCase()=="g" || first.toLowerCase()=="d" || first.toLowerCase()=="a"){if (first.toLowerCase()=="g"){first="a";}/* end if */ else if (first.toLowerCase()=="a"){first="b";}/* end else/if */ else if (first.toLowerCase()=="d"){first="e";}/* end else/if */ accidental="flat";}/* end if */ else{accidental="sharp"}/* end else */ last=note.charAt(1)}/* end if */ if (last <="3"){low="low-";}var currentValue=low + first.toLowerCase() + accidental; midiNotes.push(currentValue); var previousTime=currentTime; currentTime=oldFormatTimes[i]; var time=(currentTime - previousTime); midiTimes.push(Math.round(time * 1000));}/* end for */ var index=midiTimes.indexOf(1);midiTimes.splice(0, 1);midiTimes.push(0);for (var q=0; q < midiTimes.length; q++){hopscotchCode=hopscotchCode + "\n" + "{"+ "\n" + "\"block_class\" : \"method\","+ "\n" + "\"type\" : 52,"+ "\n" + "\"description\" : \"Start Sound\","+ "\n" + "\"parameters\" : ["+ "\n" + "{"+ "\n" + "\"defaultValue\" : \"clickPlayable\","+ "\n" + "\"value\" : \"" + midiNotes[q] + "\","+ "\n" + "\"key\" : \"\","+ "\n" + "\"type\" : 51"+ "\n" + "},"+ "\n" + "{"+ "\n" + "\"defaultValue\" : \"500\","+ "\n" + "\"value\" : \"" + midiTimes[q] + "\","+ "\n" + "\"key\" : \"wait\","+ "\n" + "\"type\" : 42"+ "\n" + "}"+ "\n" + "]"+ "\n" + "}";if (q < midiTimes.length - 1){hopscotchCode=hopscotchCode + ",";}}/* end for *//*document.getElementById("ResultsText").innerHTML=*/;resolve(hopscotchCode);};reader.readAsBinaryString(file);})}function dataURLtoFile(dataurl, filename){var arr=dataurl.split(','), mime=arr[0].match(/:(.*?);/)[1],bstr=atob(arr[1]), n=bstr.length, u8arr=new Uint8Array(n);while(n--){u8arr[n]=bstr.charCodeAt(n);}return new File([u8arr], filename,{type:mime});}var file=dataURLtoFile(base64AudioURL, 'test.mid');return await parseFile(file);
    /* eslint-enable */
  }
}

ImportedLibraries.init()
