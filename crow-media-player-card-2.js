/**

- Crow Media Player Card 2
- Includes: Reordering, Mobile Support, Pressed Glow Effects, Connection Safety, and Mute Toggle.
  */

class CrowMediaPlayerCard2 extends HTMLElement {
constructor() {
super();
this.attachShadow({ mode: ‘open’ });
this._timer = null;
this._manualSelection = false;
this._entity = null;
}

static getConfigElement() {
return document.createElement(“crow-media-player-card-2-editor”);
}

static getStubConfig() {
return { entities: [], auto_switch: true, accent_color: ‘#007AFF’, volume_accent: ‘#007AFF’ };
}

setConfig(config) {
if (!config.entities || config.entities.length === 0) throw new Error(“Please define entities”);
this._config = {
accent_color: ‘#007AFF’,
volume_accent: ‘#007AFF’,
auto_switch: true,
…config
};
if (!this._entity) this._entity = this._config.entities[0];
}

set hass(hass) {
this._hass = hass;
if (!this.shadowRoot.innerHTML) {
this.render();
this.setupListeners();
}

```
if (this._config.auto_switch) {
  const activeEntity = this._config.entities.find(ent => hass.states[ent]?.state === 'playing');
  if (activeEntity && (this._entity !== activeEntity || !this._manualSelection)) {
    if (this._entity !== activeEntity) {
      this._entity = activeEntity;
      this._manualSelection = false;
    }
  }
}

const stateObj = hass.states[this._entity];
if (stateObj) this.updateContent(stateObj);
```

}

connectedCallback() {
this._timer = setInterval(() => this.updateLiveProgress(), 1000);
this._alexaPulse = setInterval(() => {
if (this._hass && this._hass.connected && this._entity && this._hass.states[this._entity]) {
this._hass.callService(‘homeassistant’, ‘update_entity’, { entity_id: this._entity }).catch(() => {});
}
}, 10000);
}

disconnectedCallback() {
if (this._timer) clearInterval(this._timer);
if (this._alexaPulse) clearInterval(this._alexaPulse);
}

getDeviceIcon(stateObj) {
const name = (stateObj?.attributes?.friendly_name || “”).toLowerCase();
if (name.includes(‘tv’)) return `<svg viewBox="0 0 24 24" width="120" height="120" fill="rgba(255,255,255,0.3)"><path d="M21,3H3C1.89,3 1,3.89 1,5V17A2,2 0 0,0 3,19H8V21H16V19H21A2,2 0 0,0 23,17V5C23,3.89 22.1,3 21,3M21,17H3V5H21V17Z"/></svg>`;
return `<svg viewBox="0 0 24 24" width="120" height="120" fill="rgba(255,255,255,0.3)"><path d="M12,3V13.55C11.41,13.21 10.73,13 10,13C7.79,13 6,14.79 6,17C6,19.21 7.79,21 10,21C12.21,21 14,19.21 14,17V7H18V3H12Z"/></svg>`;
}

updateLiveProgress() {
const state = this._hass?.states[this._entity];
if (!state || state.state !== ‘playing’) return;
const r = this.shadowRoot;
const duration = state.attributes.media_duration;
let pos = state.attributes.media_position;
if (pos !== undefined && state.attributes.media_position_updated_at) {
pos += (Date.now() - new Date(state.attributes.media_position_updated_at).getTime()) / 1000;
}
if (duration && pos !== undefined) {
const percent = Math.min((pos / duration) * 100, 100);
const fill = r.getElementById(‘progFill’);
if (fill) fill.style.width = `${percent}%`;
const cur = r.getElementById(‘pCur’);
if (cur) cur.textContent = this.formatTime(pos);
}
}

render() {
this.shadowRoot.innerHTML = `
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
:host { display: block; –accent: #007AFF; –vol-accent: #007AFF; }
ha-card {
background: rgba(28, 28, 30, 0.72) !important;
backdrop-filter: blur(40px) saturate(180%) !important;
-webkit-backdrop-filter: blur(40px) saturate(180%) !important;
color: #fff !important;
border-radius: 24px !important;
overflow: hidden;
font-family: -apple-system, BlinkMacSystemFont, ‘SF Pro Display’, ‘Segoe UI’, sans-serif;
position: relative;
border: 1px solid rgba(255, 255, 255, 0.18) !important;
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4) !important;
transition: all 0.3s ease;
}
.size-toggle {
position: absolute; top: 12px; right: 12px; background: rgba(255, 255, 255, 0.15);
border-radius: 50%; width: 32px; height: 32px; cursor: pointer; color: #fff; z-index: 10;
display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;
}
.size-toggle svg { width: 18px; height: 18px; }
.art-wrapper { width: 100%; aspect-ratio: 1; background: linear-gradient(135deg, rgba(40, 40, 45, 0.8), rgba(28, 28, 30, 0.9)); display: flex; align-items: center; justify-content: center; overflow: hidden; cursor: pointer; }
.art-wrapper img { width: 100%; height: 100%; object-fit: cover; }
.content { padding: 20px; display: flex; flex-direction: column; }
.info-row { display: flex; align-items: center; gap: 15px; margin-bottom: 12px; }
.mini-art { display: none; width: 54px; height: 54px; border-radius: 10px; overflow: hidden; background: rgba(40, 40, 45, 0.6); flex-shrink: 0; align-items: center; justify-content: center; border: 1px solid rgba(255, 255, 255, 0.1); cursor: pointer; }
.mini-art img { width: 100%; height: 100%; object-fit: cover; }
.track-title { font-size: 19px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: -0.3px; color: #fff; }
.track-artist { font-size: 15px; color: rgba(255, 255, 255, 0.7); margin-bottom: 12px; font-weight: 400; }
.progress-bar { height: 5px; background: rgba(255, 255, 255, 0.12); border-radius: 3px; margin-bottom: 6px; cursor: pointer; overflow: hidden; }
.progress-fill { height: 100%; background: var(–accent); width: 0%; border-radius: 3px; transition: width 0.3s ease; }
.progress-times { display: flex; justify-content: space-between; font-size: 12px; color: rgba(255, 255, 255, 0.5); font-variant-numeric: tabular-nums; }
.controls { display: flex; justify-content: center; align-items: center; margin: 15px 0; gap: 20px; position: relative; }

```
    .play-btn svg { width: 44px; height: 44px; fill: #fff; }
    .nav-btn svg { width: 28px; height: 28px; fill: rgba(255, 255, 255, 0.9); }
    .extra-btn svg { width: 24px; height: 24px; fill: rgba(255, 255, 255, 0.5); }
    .extra-btn.active svg { fill: var(--accent); }
    
    button { background: none; border: none; cursor: pointer; padding: 0; display: flex; align-items: center; justify-content: center; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); border-radius: 50%; }
    button.pressed { 
      transform: scale(0.92);
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      box-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
    }
    button.pressed svg { 
      filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.8));
    }

    .volume-slider { width: 100%; height: 5px; accent-color: var(--vol-accent); margin-top: 10px; cursor: pointer; }
    .vol-section { display: contents; }
    .vol-icon { display: none; width: 22px; height: 22px; fill: rgba(255,255,255,0.7); cursor: pointer; transition: all 0.2s ease; flex-shrink: 0; }
    .vol-icon:hover { fill: rgba(255,255,255,0.9); }
    .vol-icon.muted { fill: var(--vol-accent); }
    .selector { width: 100%; padding: 10px; background: rgba(58, 58, 60, 0.6); color: #fff; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px; margin-top: 15px; font-size: 13px; cursor: pointer; text-align: center; text-align-last: center; }
    
    .mode-compact .art-wrapper { display: none; }
    .mode-compact .mini-art { display: flex; width: 44px; height: 44px; }
    .mode-compact .content { padding: 10px; gap: 2px; }
    .mode-compact .info-row { margin-bottom: 0; }
    .mode-compact .track-title { font-size: 14px; }
    .mode-compact .track-artist { font-size: 12px; margin-bottom: 0; }
    .mode-compact .controls { margin: 6px 0 2px 0; gap: 12px; justify-content: center; }
    .mode-compact .play-btn svg { width: 30px; height: 30px; }
    .mode-compact .nav-btn svg { width: 20px; height: 20px; }
    .mode-compact .vol-section { display: flex; align-items: center; flex: 1; margin-left: 10px; gap: 8px; }
    .mode-compact .vol-icon { display: block; }
    .mode-compact .volume-slider { margin-top: 0; flex: 1; min-width: 60px; }
    .mode-compact .selector, .mode-compact .extra-btn, .mode-compact .progress-times { display: none; }
    .mode-compact .size-toggle { top: 8px; right: 8px; width: 28px; height: 28px; background: rgba(255, 255, 255, 0.1); }
    .mode-compact .size-toggle svg { width: 14px; height: 14px; }

    .hidden { display: none !important; }
    .placeholder-svg { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }
  </style>
  <ha-card id="cardOuter" class="mode-compact">
    <button class="size-toggle" id="modeBtn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg></button>
    <div class="art-wrapper" id="artClick"><img id="albumImg"><div id="mainPlaceholder" class="placeholder-svg"></div></div>
    <div class="content">
      <div class="info-row">
        <div class="mini-art" id="miniArtClick"><img id="miniImg"><div id="miniPlaceholder" class="placeholder-svg"></div></div>
        <div style="flex:1; overflow:hidden; padding-right: 25px;">
          <div class="track-title" id="tTitle">Loading...</div>
          <div class="track-artist" id="tArtist"></div>
        </div>
      </div>
      <div class="progress-bar" id="progWrap"><div class="progress-fill" id="progFill"></div></div>
      <div class="progress-times"><span id="pCur">0:00</span><span id="pTot">0:00</span></div>
      <div class="controls">
        <button class="extra-btn" id="btnShuffle"><svg viewBox="0 0 24 24"><path d="M14.83,13.41L13.42,14.82L16.55,17.95L14.5,20H20V14.5L17.96,16.54L14.83,13.41M14.5,4H20V9.5L17.96,7.46L5.41,20L4,18.59L16.54,6.04L14.5,4M10.59,9.17L5.41,4L4,5.41L9.17,10.58L10.59,9.17Z"/></svg></button>
        <button class="nav-btn" id="btnPrev"><svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg></button>
        <button class="play-btn" id="btnPlay"><svg viewBox="0 0 24 24" id="playIcon"></svg></button>
        <button class="nav-btn" id="btnNext"><svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg></button>
        <button class="extra-btn" id="btnRepeat"><svg viewBox="0 0 24 24" id="repeatIcon"></svg></button>
        <div class="vol-section">
            <svg class="vol-icon" id="volMuteBtn" viewBox="0 0 24 24"><path id="volMuteIcon" d=""/></svg>
            <input type="range" class="volume-slider" id="vSlider" min="0" max="100">
        </div>
      </div>
      <select class="selector" id="eSelector"></select>
    </div>
  </ha-card>
`;
```

}

setupListeners() {
const r = this.shadowRoot;
const addPressEffect = (button) => {
button.addEventListener(‘pointerdown’, () => button.classList.add(‘pressed’));
button.addEventListener(‘pointerup’, () => button.classList.remove(‘pressed’));
button.addEventListener(‘pointerleave’, () => button.classList.remove(‘pressed’));
};

```
r.getElementById('modeBtn').onclick = () => r.getElementById('cardOuter').classList.toggle('mode-compact');
r.getElementById('artClick').onclick = () => this._openMoreInfo();
r.getElementById('miniArtClick').onclick = () => this._openMoreInfo();

r.getElementById('btnPlay').onclick = () => this.call('media_play_pause');
r.getElementById('btnPrev').onclick = () => this.call('media_previous_track');
r.getElementById('btnNext').onclick = () => this.call('media_next_track');
r.getElementById('btnShuffle').onclick = () => {
  const state = this._hass.states[this._entity];
  this.call('shuffle_set', { shuffle: !state.attributes.shuffle });
};
r.getElementById('btnRepeat').onclick = () => {
  const state = this._hass.states[this._entity];
  const next = state.attributes.repeat === 'all' ? 'one' : state.attributes.repeat === 'one' ? 'off' : 'all';
  this.call('repeat_set', { repeat: next });
};

// Mute toggle button
r.getElementById('volMuteBtn').onclick = () => {
  const state = this._hass.states[this._entity];
  const isMuted = state.attributes.is_volume_muted;
  this.call('volume_mute', { is_volume_muted: !isMuted });
};

['btnPlay', 'btnPrev', 'btnNext', 'btnShuffle', 'btnRepeat', 'modeBtn'].forEach(id => addPressEffect(r.getElementById(id)));

r.getElementById('vSlider').oninput = (e) => this.call('volume_set', { volume_level: e.target.value / 100 });
r.getElementById('eSelector').onchange = (e) => { 
  this._entity = e.target.value; 
  this._manualSelection = true;
  this.updateContent(this._hass.states[this._entity]);
};
r.getElementById('progWrap').onclick = (e) => this.doSeek(e);
```

}

_openMoreInfo() {
const event = new Event(“hass-more-info”, { bubbles: true, composed: true });
event.detail = { entityId: this._entity };
this.dispatchEvent(event);
}

call(svc, data = {}) {
this._hass.callService(‘media_player’, svc, { entity_id: this._entity, …data });
}

doSeek(e) {
const state = this._hass.states[this._entity];
if (!state || !state.attributes.media_duration) return;
const rect = e.currentTarget.getBoundingClientRect();
const percent = (e.clientX - rect.left) / rect.width;
this.call(‘media_seek’, { seek_position: state.attributes.media_duration * percent });
}

updateContent(state) {
const r = this.shadowRoot;
if (!state || !r) return;
const isPlaying = state.state === ‘playing’;
r.host.style.setProperty(’–accent’, this._config.accent_color);
r.host.style.setProperty(’–vol-accent’, this._config.volume_accent || this._config.accent_color);

```
r.getElementById('tTitle').textContent = state.attributes.media_title || (isPlaying ? 'Music' : 'Idle');
r.getElementById('tArtist').textContent = state.attributes.media_artist || state.attributes.friendly_name || '';

r.getElementById('btnShuffle').classList.toggle('active', isPlaying && state.attributes.shuffle === true);
const rep = state.attributes.repeat;
r.getElementById('btnRepeat').classList.toggle('active', isPlaying && rep !== undefined && rep !== 'off');
r.getElementById('repeatIcon').innerHTML = rep === 'one' 
  ? '<path d="M7,7H17V10L21,6L17,2V5H5V11H7V7M17,17H7V14L3,18L7,22V19H19V13H17V17M10.75,15V13H9.5V12L10.7,11.9V11H11.75V15H10.75Z"/>'
  : '<path d="M7,7H17V10L21,6L17,2V5H5V11H7V7M17,17H7V14L3,18L7,22V19H19V13H17V17Z"/>';

const artUrl = state.attributes.entity_picture;
const mainImg = r.getElementById('albumImg');
const miniImg = r.getElementById('miniImg');
if (isPlaying && artUrl) {
  mainImg.src = artUrl; miniImg.src = artUrl;
  mainImg.classList.remove('hidden'); miniImg.classList.remove('hidden');
  r.getElementById('mainPlaceholder').classList.add('hidden');
  r.getElementById('miniPlaceholder').classList.add('hidden');
} else {
  mainImg.classList.add('hidden'); miniImg.classList.add('hidden');
  r.getElementById('mainPlaceholder').innerHTML = this.getDeviceIcon(state);
  r.getElementById('miniPlaceholder').innerHTML = this.getDeviceIcon(state).replace('width="120" height="120"', 'width="24" height="24"');
  r.getElementById('mainPlaceholder').classList.remove('hidden');
  r.getElementById('miniPlaceholder').classList.remove('hidden');
}

r.getElementById('playIcon').innerHTML = isPlaying ? '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>' : '<path d="M8 5v14l11-7z"/>';

// Update volume slider
r.getElementById('vSlider').value = (state.attributes.volume_level || 0) * 100;

// Update mute icon
const isMuted = state.attributes.is_volume_muted;
const volumeLevel = state.attributes.volume_level || 0;
const muteIcon = r.getElementById('volMuteIcon');
const muteBtn = r.getElementById('volMuteBtn');

if (isMuted) {
  muteIcon.setAttribute('d', 'M12,4L9.91,6.09L12,8.18M4.27,3L3,4.27L7.73,9H3V15H7L12,20V13.27L16.25,17.53C15.58,18.04 14.83,18.46 14,18.7V20.77C15.38,20.45 16.63,19.82 17.68,18.96L19.73,21L21,19.73M19,12C19,12.94 18.8,13.82 18.46,14.64L19.97,16.15C20.62,14.91 21,13.5 21,12C21,7.72 18,4.14 14,3.23V5.29C16.89,6.15 19,8.83 19,12M16.5,12C16.5,10.23 15.5,8.71 14,7.97V10.18L16.45,12.63C16.5,12.43 16.5,12.21 16.5,12Z');
  muteBtn.classList.add('muted');
} else if (volumeLevel === 0) {
  muteIcon.setAttribute('d', 'M12,4L9.91,6.09L12,8.18M4.27,3L3,4.27L7.73,9H3V15H7L12,20V13.27L16.25,17.53C15.58,18.04 14.83,18.46 14,18.7V20.77C15.38,20.45 16.63,19.82 17.68,18.96L19.73,21L21,19.73M19,12C19,12.94 18.8,13.82 18.46,14.64L19.97,16.15C20.62,14.91 21,13.5 21,12C21,7.72 18,4.14 14,3.23V5.29C16.89,6.15 19,8.83 19,12M16.5,12C16.5,10.23 15.5,8.71 14,7.97V10.18L16.45,12.63C16.5,12.43 16.5,12.21 16.5,12Z');
  muteBtn.classList.remove('muted');
} else if (volumeLevel < 0.5) {
  muteIcon.setAttribute('d', 'M5,9V15H9L14,20V4L9,9M18.5,12C18.5,10.23 17.5,8.71 16,7.97V16C17.5,15.29 18.5,13.76 18.5,12Z');
  muteBtn.classList.remove('muted');
} else {
  muteIcon.setAttribute('d', 'M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.84 14,18.7V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z');
  muteBtn.classList.remove('muted');
}

r.getElementById('pTot').textContent = this.formatTime(state.attributes.media_duration || 0);

const sel = r.getElementById('eSelector');
if (sel) {
  sel.innerHTML = (this._config.entities || []).map(ent => {
    const s = this._hass.states[ent];
    return `<option value="${ent}" ${ent === this._entity ? 'selected' : ''}>${s?.attributes?.friendly_name || ent}</option>`;
  }).join('');
}
```

}

formatTime(s) {
if (!s || isNaN(s)) return “0:00”;
const m = Math.floor(s / 60), rs = Math.floor(s % 60);
return `${m}:${rs < 10 ? '0' : ''}${rs}`;
}
}

class CrowMediaPlayerCard2Editor extends HTMLElement {
constructor() {
super();
this.attachShadow({ mode: ‘open’ });
this._initialized = false;
this._searchTerm = “”;
}

set hass(hass) {
this._hass = hass;
if (!this._initialized) this.render();
}

setConfig(config) {
this._config = config;
if (this._initialized) this.updateUI();
}

updateUI() {
const root = this.shadowRoot;
if (!root) return;
const colorInput = root.getElementById(‘accent_color’);
if (colorInput) colorInput.value = this._config.accent_color || ‘#007AFF’;
const volColorInput = root.getElementById(‘volume_accent’);
if (volColorInput) volColorInput.value = this._config.volume_accent || this._config.accent_color || ‘#007AFF’;
const autoSwitchInput = root.getElementById(‘auto_switch’);
if (autoSwitchInput) autoSwitchInput.checked = this._config.auto_switch !== false;
}

render() {
if (!this._hass || !this._config) return;
this._initialized = true;
const selected = this._config.entities || [];
const others = Object.keys(this._hass.states)
.filter(e => e.startsWith(‘media_player.’) && !selected.includes(e))
.sort();
const sortedList = […selected, …others];

```
this.shadowRoot.innerHTML = `
  <style>
    .container { display: flex; flex-direction: column; gap: 18px; padding: 10px; color: var(--primary-text-color); font-family: sans-serif; }
    .row { display: flex; flex-direction: column; gap: 8px; }
    label { font-weight: bold; font-size: 14px; }
    input[type="text"], .checklist { width: 100%; background: var(--card-background-color); color: var(--primary-text-color); border: 1px solid #444; border-radius: 4px; }
    .checklist { max-height: 300px; overflow-y: auto; margin-top: 5px; -webkit-overflow-scrolling: touch; }
    .check-item { display: flex; align-items: center; padding: 8px 12px; border-bottom: 1px solid #333; background: var(--card-background-color); touch-action: none; }
    .dragging { opacity: 0.5; background: #444 !important; }
    .drag-handle { cursor: grab; padding: 10px; color: #888; font-size: 20px; user-select: none; }
    .toggle-row { display: flex; align-items: center; justify-content: space-between; }
    .color-section { display: flex; gap: 15px; }
    .color-item { flex: 1; display: flex; flex-direction: column; gap: 5px; }
    input[type="color"] { width: 100%; height: 40px; cursor: pointer; border: 1px solid #444; border-radius: 4px; background: none; }
  </style>
  <div class="container">
    <div class="color-section">
      <div class="color-item">
        <label>Main Accent</label>
        <input type="color" id="accent_color">
      </div>
      <div class="color-item">
        <label>Volume Accent</label>
        <input type="color" id="volume_accent">
      </div>
    </div>
    <div class="row">
      <div class="toggle-row">
        <label>Auto Switch Entities</label>
        <input type="checkbox" id="auto_switch">
      </div>
    </div>
    <div class="row">
      <label>Manage & Reorder Media Players</label>
      <input type="text" id="search" placeholder="Filter entities...">
      <div class="checklist" id="entityList">
        ${sortedList.map(ent => {
          const isSelected = selected.includes(ent);
          return `
            <div class="check-item" data-id="${ent}" draggable="${isSelected}">
              <div class="drag-handle">☰</div>
              <input type="checkbox" ${isSelected ? 'checked' : ''}>
              <span style="margin-left: 10px; flex: 1;">${this._hass.states[ent]?.attributes?.friendly_name || ent}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  </div>
`;

this._setupSearch();
this._setupReordering();
this._setupListeners();
this.updateUI();
```

}

_setupSearch() {
const searchInput = this.shadowRoot.getElementById(‘search’);
searchInput.addEventListener(‘input’, (e) => {
this._searchTerm = e.target.value.toLowerCase();
this.shadowRoot.querySelectorAll(’.check-item’).forEach(item => {
item.style.display = item.textContent.toLowerCase().includes(this._searchTerm) ? ‘flex’ : ‘none’;
});
});
}

_setupReordering() {
const list = this.shadowRoot.getElementById(‘entityList’);
let draggedItem = null;

```
list.addEventListener('dragstart', (e) => {
  draggedItem = e.target.closest('.check-item');
  if (!draggedItem.querySelector('input').checked) { e.preventDefault(); return; }
  draggedItem.classList.add('dragging');
});

list.addEventListener('dragover', (e) => {
  e.preventDefault();
  const afterElement = this._getDragAfterElement(list, e.clientY);
  if (afterElement == null) list.appendChild(draggedItem);
  else list.insertBefore(draggedItem, afterElement);
});

list.addEventListener('dragend', () => {
  draggedItem.classList.remove('dragging');
  this._saveOrder();
});

list.addEventListener('touchstart', (e) => {
  if (e.target.classList.contains('drag-handle')) {
    draggedItem = e.target.closest('.check-item');
    if (!draggedItem.querySelector('input').checked) return;
    draggedItem.classList.add('dragging');
  }
}, { passive: false });

list.addEventListener('touchmove', (e) => {
  if (!draggedItem) return;
  e.preventDefault();
  const touch = e.touches[0];
  const afterElement = this._getDragAfterElement(list, touch.clientY);
  if (afterElement == null) list.appendChild(draggedItem);
  else list.insertBefore(draggedItem, afterElement);
}, { passive: false });

list.addEventListener('touchend', () => {
  if (!draggedItem) return;
  draggedItem.classList.remove('dragging');
  draggedItem = null;
  this._saveOrder();
});
```

}

_getDragAfterElement(container, y) {
const draggables = […container.querySelectorAll(’.check-item:not(.dragging)’)];
return draggables.reduce((closest, child) => {
const box = child.getBoundingClientRect();
const offset = y - box.top - box.height / 2;
if (offset < 0 && offset > closest.offset) return { offset: offset, element: child };
else return closest;
}, { offset: Number.NEGATIVE_INFINITY }).element;
}

_saveOrder() {
const newOrder = Array.from(this.shadowRoot.querySelectorAll(’.check-item’))
.filter(i => i.querySelector(‘input’).checked)
.map(i => i.getAttribute(‘data-id’));
this._updateConfig(‘entities’, newOrder);
}

_setupListeners() {
const root = this.shadowRoot;
root.querySelectorAll(’.check-item input’).forEach(cb => {
cb.onclick = () => this._saveOrder();
});
root.getElementById(‘accent_color’).oninput = (e) => this._updateConfig(‘accent_color’, e.target.value);
root.getElementById(‘volume_accent’).oninput = (e) => this._updateConfig(‘volume_accent’, e.target.value);
root.getElementById(‘auto_switch’).onchange = (e) => this._updateConfig(‘auto_switch’, e.target.checked);
}

_updateConfig(key, value) {
if (!this._config) return;
const newConfig = { …this._config, [key]: value };
this.dispatchEvent(new CustomEvent(“config-changed”, { detail: { config: newConfig }, bubbles: true, composed: true }));
}
}

// Register custom elements
customElements.define(‘crow-media-player-card-2’, CrowMediaPlayerCard2);
customElements.define(‘crow-media-player-card-2-editor’, CrowMediaPlayerCard2Editor);

// Register with Home Assistant
window.customCards = window.customCards || [];
window.customCards.push({
type: “crow-media-player-card-2”,
name: “Crow Media Player Card 2”,
preview: true,
description: “A sleek media player with mute toggle, device switching and visual editor.”
});

console.info(
’%c CROW-MEDIA-PLAYER-CARD-2 %c Version 2.0 with Mute Toggle ’,
‘color: white; background: #007AFF; font-weight: 700;’,
‘color: #007AFF; background: white; font-weight: 700;’
);