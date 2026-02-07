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
    return { entities: [], auto_switch: true, accent_color: '#007AFF', volume_accent: '#007AFF' };
  }

  setConfig(config) {
    if (!config.entities || config.entities.length === 0) throw new Error("Please define entities");
    this._config = {
      accent_color: '#007AFF',
      volume_accent: '#007AFF',
      auto_switch: true,
      ...config
    };
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
      if (this._hass && this._hass.connected && this._entity) {
        try {
          this._hass.callService('homeassistant', 'update_entity', { entity_id: this._entity }).catch(() => {});
        } catch (e) {}
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
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        :host { display: block; --accent: #007AFF; --vol-accent: #007AFF; }
        ha-card { 
          background: rgba(28, 28, 30, 0.72) !important;
          backdrop-filter: blur(40px) saturate(180%) !important;
          -webkit-backdrop-filter: blur(40px) saturate(180%) !important;
          color: #fff !important; 
          border-radius: 24px !important; 
          overflow: hidden; 
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif; 
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
        .mini-art { display: none; width: 54px; height: 54px; border-radius: 10px; overflow: hidden; background: rgba(40, 40, 45, 0.6); align-items: center; justify-content: center; border: 1px solid rgba(255, 255, 255, 0.1); cursor: pointer; flex-shrink: 0; }
        .mini-art img { width: 100%; height: 100%; object-fit: cover; }
        
        .marquee-container { overflow: hidden; white-space: nowrap; width: 100%; }
        .marquee-text { display: inline-block; }
        @keyframes marquee { 
          0%, 10% { transform: translateX(0); }
          90%, 100% { transform: translateX(calc(-100% + 120px)); }
        }

        .track-title { font-size: 18px; font-weight: 600; letter-spacing: -0.3px; color: #fff; }
        .track-artist { font-size: 14px; color: rgba(255, 255, 255, 0.6); }
        .progress-bar { height: 4px; background: rgba(255, 255, 255, 0.12); border-radius: 2px; margin-bottom: 4px; cursor: pointer; overflow: hidden; }
        .progress-fill { height: 100%; background: var(--accent); width: 0%; border-radius: 2px; transition: width 0.3s ease; }
        .controls { display: flex; justify-content: center; align-items: center; margin: 15px 0; gap: 20px; position: relative; }
        
        button:active svg, .vol-icon:active { 
          filter: drop-shadow(0 0 8px var(--accent));
          transform: scale(0.95);
        }
        input[type="range"]:active::-webkit-slider-thumb {
          box-shadow: 0 0 10px var(--vol-accent);
        }

        .play-btn svg { width: 44px; height: 44px; fill: #fff; }
        .nav-btn svg { width: 28px; height: 28px; fill: rgba(255, 255, 255, 0.9); }
        .volume-slider { width: 100%; height: 4px; accent-color: var(--vol-accent); margin-top: 10px; }
        .vol-section { display: contents; }
        .vol-icon { display: none; width: 18px; height: 18px; fill: rgba(255,255,255,0.5); cursor: pointer; transition: transform 0.1s ease; }

        .selector { width: 100%; padding: 10px; background: rgba(58, 58, 60, 0.6); color: #fff; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px; margin-top: 15px; font-size: 13px; cursor: pointer; }
        
        /* MODE COMPACT */
        .mode-compact .art-wrapper { display: none; }
        .mode-compact .mini-art { display: flex; width: 44px; height: 44px; }
        .mode-compact .content { padding: 10px; gap: 2px; }
        .mode-compact .info-row { margin-bottom: 0; }
        .mode-compact .track-title { font-size: 14px; }
        .mode-compact .track-artist { font-size: 12px; }
        .mode-compact .controls { margin: 6px 0 2px 0; gap: 12px; justify-content: center; }
        .mode-compact .play-btn svg { width: 30px; height: 30px; }
        .mode-compact .nav-btn svg { width: 20px; height: 20px; }
        .mode-compact .vol-section { display: flex; align-items: center; flex: 1; margin-left: 10px; }
        .mode-compact .vol-icon { display: block; flex-shrink: 0; }
        .mode-compact .volume-slider { margin-top: 0; flex: 1; margin-left: 6px; min-width: 60px; }
        .mode-compact .selector, .mode-compact .extra-btn { display: none; }
        
        /* Increased Circle size for Resize Icon in Compact mode */
        .mode-compact .size-toggle { top: 8px; right: 8px; width: 28px; height: 28px; background: rgba(255, 255, 255, 0.1); }
        .mode-compact .size-toggle svg { width: 14px; height: 14px; }

        .hidden { display: none !important; }
        button { background: none; border: none; cursor: pointer; padding: 0; display: flex; align-items: center; justify-content: center; transition: transform 0.1s ease; }
        .placeholder-svg { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }
      </style>
      <ha-card id="cardOuter" class="mode-compact">
        <button class="size-toggle" id="modeBtn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg></button>
        <div class="art-wrapper" id="artClick"><img id="albumImg"><div id="mainPlaceholder" class="placeholder-svg"></div></div>
        <div class="content">
          <div class="info-row">
            <div class="mini-art" id="miniArtClick"><img id="miniImg"><div id="miniPlaceholder" class="placeholder-svg"></div></div>
            <div style="flex:1; overflow:hidden; padding-right: 35px;">
              <div class="marquee-container"><div class="track-title marquee-text" id="tTitle">Loading...</div></div>
              <div class="track-artist" id="tArtist"></div>
            </div>
          </div>
          <div class="progress-bar" id="progWrap"><div class="progress-fill" id="progFill"></div></div>
          
          <div class="controls">
            <button class="nav-btn" id="btnPrev"><svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg></button>
            <button class="play-btn" id="btnPlay"><svg viewBox="0 0 24 24" id="playIcon"></svg></button>
            <button class="nav-btn" id="btnNext"><svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg></button>
            <div class="vol-section">
                <svg class="vol-icon" id="volMuteBtn" viewBox="0 0 24 24"></svg>
                <input type="range" class="volume-slider" id="vSlider" min="0" max="100">
            </div>
          </div>

          <select class="selector" id="eSelector"></select>
        </div>
      </ha-card>
    `;
  }

  setupListeners() {
    const r = this.shadowRoot;
    r.getElementById('modeBtn').onclick = () => r.getElementById('cardOuter').classList.toggle('mode-compact');
    r.getElementById('artClick').onclick = () => this.openMoreInfo();
    r.getElementById('miniArtClick').onclick = () => this.openMoreInfo();
    r.getElementById('btnPlay').onclick = (e) => { e.stopPropagation(); this.call('media_play_pause'); };
    r.getElementById('btnPrev').onclick = (e) => { e.stopPropagation(); this.call('media_previous_track'); };
    r.getElementById('btnNext').onclick = (e) => { e.stopPropagation(); this.call('media_next_track'); };
    
    r.getElementById('volMuteBtn').onclick = (e) => {
      e.stopPropagation();
      const state = this._hass.states[this._entity];
      this.call('volume_mute', { is_volume_muted: !state.attributes.is_volume_muted });
    };

    r.getElementById('vSlider').oninput = (e) => this.call('volume_set', { volume_level: e.target.value / 100 });
    r.getElementById('progWrap').onclick = (e) => this.doSeek(e);
    
    r.getElementById('eSelector').onchange = (e) => { 
      this._entity = e.target.value; 
      this._manualSelection = true;
      this.updateContent(this._hass.states[this._entity]);
    };
  }

  openMoreInfo() {
    const event = new Event("hass-more-info", { bubbles: true, composed: true });
    event.detail = { entityId: this._entity };
    this.dispatchEvent(event);
  }

  call(svc, data = {}) {
    this._hass.callService('media_player', svc, { entity_id: this._entity, ...data });
  }

  doSeek(e) {
    const state = this._hass.states[this._entity];
    if (!state || !state.attributes.media_duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    this.call('media_seek', { seek_position: state.attributes.media_duration * percent });
  }

  updateContent(state) {
    const r = this.shadowRoot;
    if (!state || !r) return;
    const isPlaying = state.state === 'playing';
    
    r.host.style.setProperty('--accent', this._config.accent_color);
    r.host.style.setProperty('--vol-accent', this._config.volume_accent || this._config.accent_color);

    const titleEl = r.getElementById('tTitle');
    titleEl.textContent = state.attributes.media_title || (isPlaying ? 'Music' : 'Idle');
    titleEl.style.animation = titleEl.textContent.length > 20 ? "marquee 8s linear infinite alternate" : "none";

    r.getElementById('tArtist').textContent = state.attributes.media_artist || state.attributes.friendly_name || '';

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
    r.getElementById('vSlider').value = (state.attributes.volume_level || 0) * 100;

    const muteBtn = r.getElementById('volMuteBtn');
    if (state.attributes.is_volume_muted) {
      muteBtn.innerHTML = '<path d="M3.27,3L2,4.27L9.73,12L2,19.73L3.27,21L11,13.27L18.73,21L20,19.73L12.27,12L20,4.27L18.73,3L11,10.73L3.27,3Z"/>';
      muteBtn.style.fill = 'rgba(255,0,0,0.6)';
    } else {
      muteBtn.innerHTML = '<path d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.85 14,18.71V20.77C18.01,19.86 21,16.28 21,12C21,7.72 18.01,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16.02C15.5,15.29 16.5,13.77 16.5,12M3,9V15H7L12,20V4L7,9H3Z"/>';
      muteBtn.style.fill = 'rgba(255,255,255,0.5)';
    }

    const sel = r.getElementById('eSelector');
    if (sel) {
      sel.innerHTML = (this._config.entities || []).map(ent => {
        const s = this._hass.states[ent];
        return `<option value="${ent}" ${ent === this._entity ? 'selected' : ''}>${s?.attributes?.friendly_name || ent}</option>`;
      }).join('');
    }
  }
}

if (!customElements.get('crow-media-player-card-2')) {
  customElements.define('crow-media-player-card-2', CrowMediaPlayerCard2);
}
