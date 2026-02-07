// --- MAIN CARD ---
class CrowMediaPlayerCard2 extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._timer = null;
    this._manualSelection = false;
    this._entity = null;
  }

  static getConfigElement() {
    return document.createElement("crow-media-player-card-2-editor");
  }

  static getStubConfig() {
    return { entities: [], auto_switch: true, accent_color: '#007AFF' };
  }

  setConfig(config) {
    if (!config.entities || config.entities.length === 0) throw new Error("Please define entities");
    this._config = {
      accent_color: '#007AFF',
      auto_switch: true,
      ...config
    };
    // Initialize with the first entity in the list if no entity is currently tracked
    if (!this._entity) this._entity = this._config.entities[0];
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.shadowRoot.innerHTML) {
      this.render();
      this.setupListeners();
    }

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
  }

  connectedCallback() {
    this._timer = setInterval(() => this.updateLiveProgress(), 1000);
    this._alexaPulse = setInterval(() => {
      if (this._hass && this._entity) {
        this._hass.callService('homeassistant', 'update_entity', { entity_id: this._entity });
      }
    }, 10000);
  }

  disconnectedCallback() {
    if (this._timer) clearInterval(this._timer);
    if (this._alexaPulse) clearInterval(this._alexaPulse);
  }

  getDeviceIcon(stateObj) {
    const name = (stateObj?.attributes?.friendly_name || "").toLowerCase();
    if (name.includes('tv')) return `<svg viewBox="0 0 24 24" width="120" height="120" fill="rgba(255,255,255,0.3)"><path d="M21,3H3C1.89,3 1,3.89 1,5V17A2,2 0 0,0 3,19H8V21H16V19H21A2,2 0 0,0 23,17V5C23,3.89 22.1,3 21,3M21,17H3V5H21V17Z"/></svg>`;
    return `<svg viewBox="0 0 24 24" width="120" height="120" fill="rgba(255,255,255,0.3)"><path d="M12,3V13.55C11.41,13.21 10.73,13 10,13C7.79,13 6,14.79 6,17C6,19.21 7.79,21 10,21C12.21,21 14,19.21 14,17V7H18V3H12Z"/></svg>`;
  }

  updateLiveProgress() {
    const state = this._hass?.states[this._entity];
    if (!state || state.state !== 'playing') return;
    const r = this.shadowRoot;
    const duration = state.attributes.media_duration;
    let pos = state.attributes.media_position;
    if (pos !== undefined && state.attributes.media_position_updated_at) {
      pos += (Date.now() - new Date(state.attributes.media_position_updated_at).getTime()) / 1000;
    }
    if (duration && pos !== undefined) {
      const percent = Math.min((pos / duration) * 100, 100);
      const fill = r.getElementById('progFill');
      if (fill) fill.style.width = `${percent}%`;
      const cur = r.getElementById('pCur');
      if (cur) cur.textContent = this.formatTime(pos);
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        :host { display: block; --accent: #007AFF; }
        
        ha-card { 
          background: rgba(28, 28, 30, 0.72) !important;
          backdrop-filter: blur(40px) saturate(180%) !important;
          -webkit-backdrop-filter: blur(40px) saturate(180%) !important;
          color: #fff !important; 
          border-radius: 24px !important; 
          overflow: hidden; 
          padding-bottom: 15px; 
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif; 
          position: relative; 
          border: 1px solid rgba(255, 255, 255, 0.18) !important;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2) !important;
        }
        
        .size-toggle { 
          position: absolute; 
          top: 14px; 
          right: 14px; 
          background: rgba(255, 255, 255, 0.15); 
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2); 
          border-radius: 50%; 
          width: 36px; 
          height: 36px; 
          cursor: pointer; 
          color: #fff; 
          z-index: 10; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }
        .size-toggle:active { 
          transform: scale(0.92); 
          background: rgba(255, 255, 255, 0.25);
        }
        
        .art-wrapper { 
          width: 100%; 
          aspect-ratio: 1; 
          background: linear-gradient(135deg, rgba(40, 40, 45, 0.8), rgba(28, 28, 30, 0.9)); 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          overflow: hidden; 
          cursor: pointer;
          position: relative;
        }
        .art-wrapper::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.1) 100%);
          pointer-events: none;
        }
        .art-wrapper img { 
          width: 100%; 
          height: 100%; 
          object-fit: cover; 
        }
        
        .content { padding: 22px 20px 20px; }
        
        .info-row { 
          display: flex; 
          align-items: center; 
          gap: 15px; 
          margin-bottom: 12px; 
        }
        
        .mini-art { 
          display: none; 
          width: 54px; 
          height: 54px; 
          border-radius: 10px; 
          overflow: hidden; 
          background: linear-gradient(135deg, rgba(40, 40, 45, 0.6), rgba(28, 28, 30, 0.8));
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          display: flex; 
          align-items: center; 
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }
        .mini-art img { 
          width: 100%; 
          height: 100%; 
          object-fit: cover; 
        }
        
        .track-title { 
          font-size: 19px; 
          font-weight: 600; 
          white-space: nowrap; 
          overflow: hidden; 
          text-overflow: ellipsis;
          letter-spacing: -0.3px;
          color: #fff;
        }
        .track-artist { 
          font-size: 15px; 
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 12px;
          font-weight: 400;
        }
        
        .progress-bar { 
          height: 5px; 
          background: rgba(255, 255, 255, 0.12); 
          border-radius: 3px; 
          margin-bottom: 6px; 
          cursor: pointer;
          overflow: hidden;
        }
        .progress-fill { 
          height: 100%; 
          background: linear-gradient(90deg, var(--accent), var(--accent));
          width: 0%; 
          border-radius: 3px;
          box-shadow: 0 0 8px rgba(0, 122, 255, 0.4);
          transition: width 0.3s ease;
        }
        
        .progress-times { 
          display: flex; 
          justify-content: space-between; 
          font-size: 12px; 
          color: rgba(255, 255, 255, 0.5);
          font-weight: 500;
          font-variant-numeric: tabular-nums;
        }
        
        .controls { 
          display: flex; 
          justify-content: center; 
          align-items: center; 
          margin: 24px 0 20px; 
          gap: 18px; 
        }
        
        .play-btn svg { 
          width: 48px; 
          height: 48px; 
          fill: #fff; 
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
        }
        .nav-btn svg { 
          width: 32px; 
          height: 32px; 
          fill: rgba(255, 255, 255, 0.9);
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.15));
        }
        .extra-btn svg { 
          width: 28px; 
          height: 28px; 
          fill: rgba(255, 255, 255, 0.5);
          transition: all 0.3s ease; 
        }
        .extra-btn.active svg { 
          fill: var(--accent);
          filter: drop-shadow(0 0 4px var(--accent));
        }
        
        .volume-slider { 
          width: 100%; 
          height: 5px; 
          accent-color: var(--accent);
          margin-top: 12px;
          background: rgba(255, 255, 255, 0.12);
          border-radius: 3px;
        }
        .volume-slider::-webkit-slider-thumb {
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }
        
        .selector { 
          width: 100%; 
          padding: 11px 14px; 
          background: rgba(58, 58, 60, 0.6);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          color: #fff; 
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px; 
          margin-top: 16px; 
          text-align: center; 
          text-align-last: center;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .selector:hover {
          background: rgba(68, 68, 70, 0.7);
        }
        .selector:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.2);
        }
        
        .mode-compact .art-wrapper { display: none; }
        .mode-compact .mini-art { display: flex; }
        .hidden { display: none !important; }
        
        button { 
          background: none; 
          border: none; 
          cursor: pointer; 
          position: relative;
          transition: transform 0.15s ease;
        }
        
        /* Button press effects with glass morphism */
        button.pressed .play-btn svg,
        button.pressed .nav-btn svg {
          filter: drop-shadow(0 0 16px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 8px rgba(255, 255, 255, 0.5)) brightness(1.2);
        }
        
        button.pressed .extra-btn svg {
          filter: drop-shadow(0 0 16px var(--accent)) drop-shadow(0 0 8px var(--accent)) brightness(1.3);
        }
        
        button.extra-btn.active.pressed svg {
          filter: drop-shadow(0 0 20px var(--accent)) drop-shadow(0 0 12px var(--accent)) brightness(1.4);
        }
        
        .play-btn:active svg,
        .nav-btn:active svg {
          transform: scale(0.92);
        }
        
        .extra-btn:active svg {
          transform: scale(0.92);
        }
        
        .play-btn:active svg,
        .nav-btn:active svg {
          filter: drop-shadow(0 0 16px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 8px rgba(255, 255, 255, 0.5)) brightness(1.2);
        }
        
        .extra-btn:active svg {
          filter: drop-shadow(0 0 16px var(--accent)) drop-shadow(0 0 8px var(--accent)) brightness(1.3);
        }
        
        .extra-btn.active:active svg {
          filter: drop-shadow(0 0 20px var(--accent)) drop-shadow(0 0 12px var(--accent)) brightness(1.4);
        }
        
        .placeholder-svg { 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          width: 100%; 
          height: 100%; 
        }
      </style>
      <ha-card id="cardOuter" class="mode-compact">
        <button class="size-toggle" id="modeBtn"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg></button>
        <div class="art-wrapper" id="artClick"><img id="albumImg"><div id="mainPlaceholder" class="placeholder-svg"></div></div>
        <div class="content">
          <div class="info-row">
            <div class="mini-art" id="miniArtClick"><img id="miniImg"><div id="miniPlaceholder" class="placeholder-svg"></div></div>
            <div style="flex:1; overflow:hidden;">
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
          </div>
          <input type="range" class="volume-slider" id="vSlider" min="0" max="100">
          <select class="selector" id="eSelector"></select>
        </div>
      </ha-card>
    `;
  }

  setupListeners() {
    const r = this.shadowRoot;
    const openMediaBrowser = () => {
      const event = new Event("hass-more-info", { bubbles: true, composed: true });
      event.detail = { entityId: this._entity };
      this.dispatchEvent(event);
    };
    
    // Helper function to add button press effect
    const addPressEffect = (button) => {
      button.addEventListener('mousedown', () => button.classList.add('pressed'));
      button.addEventListener('mouseup', () => button.classList.remove('pressed'));
      button.addEventListener('mouseleave', () => button.classList.remove('pressed'));
      button.addEventListener('touchstart', () => button.classList.add('pressed'));
      button.addEventListener('touchend', () => button.classList.remove('pressed'));
      button.addEventListener('touchcancel', () => button.classList.remove('pressed'));
    };
    
    r.getElementById('modeBtn').onclick = () => r.getElementById('cardOuter').classList.toggle('mode-compact');
    r.getElementById('artClick').onclick = openMediaBrowser;
    r.getElementById('miniArtClick').onclick = openMediaBrowser;
    
    const btnPlay = r.getElementById('btnPlay');
    const btnPrev = r.getElementById('btnPrev');
    const btnNext = r.getElementById('btnNext');
    const btnShuffle = r.getElementById('btnShuffle');
    const btnRepeat = r.getElementById('btnRepeat');
    
    btnPlay.onclick = () => this.call('media_play_pause');
    btnPrev.onclick = () => this.call('media_previous_track');
    btnNext.onclick = () => this.call('media_next_track');
    btnShuffle.onclick = () => {
      const state = this._hass.states[this._entity];
      this.call('shuffle_set', { shuffle: !state.attributes.shuffle });
    };
    btnRepeat.onclick = () => {
      const state = this._hass.states[this._entity];
      const next = state.attributes.repeat === 'all' ? 'one' : state.attributes.repeat === 'one' ? 'off' : 'all';
      this.call('repeat_set', { repeat: next });
    };
    
    // Add press effects to all buttons
    addPressEffect(btnPlay);
    addPressEffect(btnPrev);
    addPressEffect(btnNext);
    addPressEffect(btnShuffle);
    addPressEffect(btnRepeat);
    
    r.getElementById('vSlider').oninput = (e) => this.call('volume_set', { volume_level: e.target.value / 100 });
    r.getElementById('eSelector').onchange = (e) => { 
      this._entity = e.target.value; 
      this._manualSelection = true;
      this.updateContent(this._hass.states[this._entity]);
    };
    r.getElementById('progWrap').onclick = (e) => this.doSeek(e);
  }

  call(svc, data = {}) {
    this._hass.callService('media_player', svc, { entity_id: this._entity, ...data });
  }

  doSeek(e) {
    const state = this._hass.states[this._entity];
    if (!state || !state.attributes.media_duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const seekPos = state.attributes.media_duration * percent;
    this.call('media_seek', { seek_position: seekPos });
  }

  updateContent(state) {
    const r = this.shadowRoot;
    if (!state || !r) return;
    const isPlaying = state.state === 'playing';
    r.host.style.setProperty('--accent', this._config.accent_color);
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
    const mainPl = r.getElementById('mainPlaceholder');
    const miniPl = r.getElementById('miniPlaceholder');

    if (isPlaying && artUrl) {
      const bustUrl = artUrl.includes('?') ? `${artUrl}&t=${Date.now()}` : `${artUrl}?t=${Date.now()}`;
      if (mainImg.src !== bustUrl) { mainImg.src = bustUrl; miniImg.src = bustUrl; }
      [mainImg, miniImg].forEach(el => el.classList.remove('hidden'));
      [mainPl, miniPl].forEach(el => el.classList.add('hidden'));
    } else {
      mainPl.innerHTML = this.getDeviceIcon(state);
      miniPl.innerHTML = this.getDeviceIcon(state).replace('width="120" height="120"', 'width="30" height="30"');
      [mainImg, miniImg].forEach(el => el.classList.add('hidden'));
      [mainPl, miniPl].forEach(el => el.classList.remove('hidden'));
    }

    r.getElementById('playIcon').innerHTML = isPlaying ? '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>' : '<path d="M8 5v14l11-7z"/>';
    r.getElementById('vSlider').value = (state.attributes.volume_level || 0) * 100;
    r.getElementById('pTot').textContent = this.formatTime(state.attributes.media_duration || 0);

    const sel = r.getElementById('eSelector');
    if (sel) {
      sel.innerHTML = (this._config.entities || []).map(ent => {
        const s = this._hass.states[ent];
        return `<option value="${ent}" ${ent === this._entity ? 'selected' : ''}>${s?.attributes?.friendly_name || ent}</option>`;
      }).join('');
    }
  }

  formatTime(s) {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60), rs = Math.floor(s % 60);
    return `${m}:${rs < 10 ? '0' : ''}${rs}`;
  }
}

// --- VISUAL EDITOR ---
class CrowMediaPlayerCard2Editor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._initialized = false;
    this._searchTerm = "";
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
    const colorInput = root.getElementById('accent_color');
    if (colorInput) colorInput.value = this._config.accent_color || '#007AFF';
    const autoSwitchInput = root.getElementById('auto_switch');
    if (autoSwitchInput) autoSwitchInput.checked = this._config.auto_switch !== false;
  }

  render() {
    if (!this._hass || !this._config) return;
    this._initialized = true;

    const selected = this._config.entities || [];
    const others = Object.keys(this._hass.states)
      .filter(e => e.startsWith('media_player.') && !selected.includes(e))
      .sort();
    
    const sortedList = [...selected, ...others];

    this.shadowRoot.innerHTML = `
      <style>
        .container { display: flex; flex-direction: column; gap: 18px; padding: 10px; color: var(--primary-text-color); }
        .row { display: flex; flex-direction: column; gap: 8px; }
        label { font-weight: bold; font-size: 14px; }
        select, input[type="text"] { padding: 10px; border-radius: 4px; border: 1px solid #444; background: var(--card-background-color); color: var(--primary-text-color); width: 100%; }
        .checklist { max-height: 250px; overflow-y: auto; border: 1px solid #444; border-radius: 0 0 4px 4px; background: var(--card-background-color); position: relative; }
        .check-item { display: flex; align-items: center; padding: 8px 12px; border-bottom: 1px solid #333; transition: background 0.2s; position: relative; background: var(--card-background-color); touch-action: none; }
        .check-item:hover { background: rgba(255,255,255,0.05); }
        .check-item.dragging { opacity: 0.2; background: #007AFF; z-index: 1000; }
        .drag-handle { cursor: grab; padding: 10px; margin-right: 8px; display: flex; align-items: center; color: #888; }
        .drag-handle:active { cursor: grabbing; }
        .check-label { flex: 1; display: flex; align-items: center; cursor: pointer; user-select: none; }
        .check-label input { margin-right: 12px; width: 18px; height: 18px; }
        .check-label span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .hint { font-size: 12px; color: #888; font-style: italic; }
        .search-bar { border-bottom-left-radius: 0; border-bottom-right-radius: 0; border: 1px solid #444; }
        .toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 15px; }
        .toggle-switch { position: relative; display: inline-block; width: 50px; height: 24px; flex-shrink: 0; }
        .toggle-switch input { opacity: 0; width: 0; height: 0; }
        .toggle-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #444; transition: .3s; border-radius: 24px; }
        .toggle-slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .3s; border-radius: 50%; }
        input:checked + .toggle-slider { background-color: #007AFF; }
        input:checked + .toggle-slider:before { transform: translateX(26px); }
      </style>
      
      <div class="container">
        <div class="row">
          <label>Accent Color</label>
          <input type="color" id="accent_color" style="width: 100%; height: 40px; border: none; cursor: pointer;" value="${this._config.accent_color || '#007AFF'}">
        </div>

        <div class="row">
          <label style="margin-bottom: 8px;">Auto Switch to Playing Media</label>
          <div class="toggle-row">
            <span class="hint" style="flex: 1; margin: 0;">Automatically switch to whichever media player is currently playing</span>
            <label class="toggle-switch">
              <input type="checkbox" id="auto_switch" ${this._config.auto_switch !== false ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div class="row">
          <label>Media Players</label>
          <input type="text" id="search" class="search-bar" placeholder="Filter entities..." value="${this._searchTerm}">
          <div class="checklist" id="entityList">
            ${sortedList.map(ent => {
              const isSelected = selected.includes(ent);
              return `
                <div class="check-item" data-id="${ent}" draggable="${isSelected}">
                  ${isSelected ? `<div class="drag-handle"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M7,15V17H17V15H7M7,7V9H17V7H7M7,11V13H17V11H7Z"/></svg></div>` : '<div style="width:40px"></div>'}
                  <div class="check-label">
                    <input type="checkbox" ${isSelected ? 'checked' : ''}>
                    <span>${this._hass.states[ent]?.attributes?.friendly_name || ent}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          <span class="hint">Check a player to reorder.</span>
        </div>
      </div>
    `;

    this._setupSearch();
    this._setupDragAndDrop();
    this._setupListeners();
    this.updateUI();
  }

  _setupSearch() {
    const searchInput = this.shadowRoot.getElementById('search');
    const items = this.shadowRoot.querySelectorAll('.check-item');
    const filterItems = (term) => {
      items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(term.toLowerCase()) ? 'flex' : 'none';
      });
    };
    filterItems(this._searchTerm);
    searchInput.addEventListener('input', (e) => {
      this._searchTerm = e.target.value;
      filterItems(this._searchTerm);
    });
  }

  _setupDragAndDrop() {
    const list = this.shadowRoot.getElementById('entityList');
    let draggedItem = null;

    list.addEventListener('dragstart', (e) => {
      const item = e.target.closest('.check-item');
      if (!item || item.getAttribute('draggable') !== 'true') { e.preventDefault(); return; }
      draggedItem = item;
      setTimeout(() => item.classList.add('dragging'), 0);
    });

    list.addEventListener('dragend', (e) => {
      const item = e.target.closest('.check-item');
      if (item) item.classList.remove('dragging');
      this._saveOrder();
    });

    list.addEventListener('dragover', (e) => {
      e.preventDefault();
      const afterElement = this._getDragAfterElement(list, e.clientY);
      if (draggedItem) {
        if (afterElement == null) list.appendChild(draggedItem);
        else list.insertBefore(draggedItem, afterElement);
      }
    });

    list.addEventListener('touchstart', (e) => {
      const handle = e.target.closest('.drag-handle');
      if (!handle) return;
      const item = handle.closest('.check-item');
      if (!item || item.getAttribute('draggable') !== 'true') return;
      
      draggedItem = item;
      item.classList.add('dragging');
      e.preventDefault();
    }, { passive: false });

    list.addEventListener('touchmove', (e) => {
      if (!draggedItem) return;
      const touch = e.touches[0];
      const afterElement = this._getDragAfterElement(list, touch.clientY);
      if (afterElement == null) list.appendChild(draggedItem);
      else list.insertBefore(draggedItem, afterElement);
      e.preventDefault();
    }, { passive: false });

    list.addEventListener('touchend', () => {
      if (!draggedItem) return;
      draggedItem.classList.remove('dragging');
      this._saveOrder();
      draggedItem = null;
    });
  }

  _saveOrder() {
    const list = this.shadowRoot.getElementById('entityList');
    const newOrder = Array.from(list.querySelectorAll('.check-item'))
      .filter(i => i.querySelector('input').checked)
      .map(i => i.getAttribute('data-id'));
    this._updateConfig('entities', newOrder);
  }

  _getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.check-item:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  _setupListeners() {
    const items = this.shadowRoot.querySelectorAll('.check-item');
    items.forEach(item => {
      const checkbox = item.querySelector('input[type="checkbox"]');
      checkbox.addEventListener('change', (e) => {
        e.stopPropagation();
        const entId = item.getAttribute('data-id');
        let currentEntities = [...(this._config.entities || [])];
        if (e.target.checked) {
          if (!currentEntities.includes(entId)) {
            currentEntities.push(entId);
          }
        } else {
          currentEntities = currentEntities.filter(id => id !== entId);
        }
        this._updateConfig('entities', currentEntities);
        this.render();
      });
    });

    this.shadowRoot.querySelectorAll('#accent_color, #auto_switch').forEach(el => {
      el.addEventListener('change', (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        this._updateConfig(e.target.id, value);
      });
    });
  }

  _updateConfig(key, value) {
    const newConfig = { ...this._config, [key]: value };
    const event = new CustomEvent("config-changed", {
      detail: { config: newConfig },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }
}

customElements.define('crow-media-player-card-2', CrowMediaPlayerCard2);
customElements.define('crow-media-player-card-2-editor', CrowMediaPlayerCard2Editor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "crow-media-player-card-2",
  name: "Crow Media Player 2",
  description: "Apple-style glass media player with device switching.",
  preview: true
});
