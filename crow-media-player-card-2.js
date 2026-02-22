/**
 * Crow Media Player Card 2 - Larger Mini Buttons
 */

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
    return {
      entities: [],
      auto_switch: true,
      accent_color: '#007AFF',
      volume_accent: '#007AFF',
      title_color: '#ffffff',
      artist_color: '#b3b3b3'
    };
  }

  setConfig(config) {
    if (!config.entities || config.entities.length === 0) throw new Error("Please define entities");
    this._config = {
      accent_color: '#007AFF',
      volume_accent: '#007AFF',
      title_color: '#ffffff',
      artist_color: '#b3b3b3',
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
      if (this._hass && this._hass.connected && this._entity && this._hass.states[this._entity]) {
        this._hass.callService('homeassistant', 'update_entity', { entity_id: this._entity }).catch(() => {});
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
    const tc = this._config?.title_color  || '#ffffff';
    const ac = this._config?.artist_color || '#b3b3b3';

    this.shadowRoot.innerHTML = `
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        :host { display: block; --accent: #007AFF; --vol-accent: #007AFF; --title-color: ${tc}; --artist-color: ${ac}; }
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
        .mini-art { display: none; width: 54px; height: 54px; border-radius: 10px; overflow: hidden; background: rgba(40, 40, 45, 0.6); display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255, 255, 255, 0.1); cursor: pointer; flex-shrink: 0; }
        .mini-art img { width: 100%; height: 100%; object-fit: cover; }
        .track-title { font-size: 19px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: -0.3px; color: var(--title-color); }
        .track-artist { font-size: 15px; color: var(--artist-color); margin-bottom: 12px; font-weight: 400; }
        .progress-bar { height: 5px; background: rgba(255, 255, 255, 0.12); border-radius: 3px; margin-bottom: 6px; cursor: pointer; overflow: hidden; }
        .progress-fill { height: 100%; background: var(--accent); width: 0%; border-radius: 3px; transition: width 0.3s ease; }
        .progress-times { display: flex; justify-content: space-between; font-size: 12px; color: rgba(255, 255, 255, 0.5); font-variant-numeric: tabular-nums; }
        .controls { display: flex; justify-content: center; align-items: center; margin: 15px 0; gap: 20px; position: relative; }
        
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

        .volume-slider { width: 100%; height: 5px; accent-color: var(--vol-accent); margin-top: 10px; }
        .vol-section { display: contents; }
        .vol-icon { display: none; width: 18px; height: 18px; fill: rgba(255,255,255,0.5); cursor: pointer; }
        .selector { width: 100%; padding: 10px; background: rgba(58, 58, 60, 0.6); color: #fff; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px; margin-top: 15px; font-size: 13px; cursor: pointer; text-align: center; text-align-last: center; }
        
        .mode-compact .art-wrapper { display: none; }
        .mode-compact .mini-art { display: flex; width: 44px; height: 44px; }
        .mode-compact .content { padding: 10px; gap: 2px; }
        .mode-compact .info-row { margin-bottom: 0; }
        .mode-compact .track-title { font-size: 14px; }
        .mode-compact .track-artist { font-size: 12px; margin-bottom: 0; }
        .mode-compact .controls { margin: 6px 0 2px 0; gap: 4px; justify-content: flex-start; width: 100%; }
        
        /* ADJUSTED: Sizes increased slightly for easier tapping */
        .mode-compact .play-btn svg { width: 34px; height: 34px; }
        .mode-compact .nav-btn svg { width: 24px; height: 24px; }
        
        .mode-compact .vol-section { display: flex; align-items: center; flex: 1; margin-left: 0; padding-left: 2px; }
        .mode-compact .vol-icon { display: block; flex-shrink: 0; }
        .mode-compact .volume-slider { margin-top: 0; flex: 1; margin-left: 6px; min-width: 50px; }
        
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
                <svg class="vol-icon" id="volMuteBtn" viewBox="0 0 24 24"></svg>
                <input type="range" class="volume-slider" id="vSlider" min="0" max="100">
            </div>
          </div>
          <select class="selector" id="eSelector"></select>
        </div>
      </ha-card>
    `;
  }
  // Rest of code remains same...
}

// ─────────────────────────────────────────────
//  Visual Editor
// ─────────────────────────────────────────────
class CrowMediaPlayerCard2Editor extends HTMLElement {
  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  connectedCallback() {
    this._render();
  }

  _dispatch(updates) {
    this._config = { ...this._config, ...updates };
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this._config },
      bubbles: true,
      composed: true,
    }));
  }

  // The native colour picker only accepts 6-digit hex.
  // Fall back to a plain default so it never errors on other values.
  _hexFallback(value, fallback) {
    if (value && /^#[0-9a-fA-F]{6}$/.test(value)) return value;
    return fallback;
  }

  _render() {
    if (!this._config) return;
    const cfg = this._config;
    const entitiesText = Array.isArray(cfg.entities) ? cfg.entities.join('\n') : '';

    this.innerHTML = `
      <style>
        .editor-section { margin-bottom: 16px; }
        .editor-section-title {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--secondary-text-color, #888);
          margin-bottom: 8px;
        }
        .editor-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid var(--divider-color, #e0e0e0);
        }
        .editor-row:last-child { border-bottom: none; }
        .editor-label {
          font-size: 14px;
          color: var(--primary-text-color, #212121);
          flex: 1;
        }
        textarea {
          width: 100%;
          min-height: 72px;
          font-size: 13px;
          padding: 8px;
          border: 1px solid var(--divider-color, #ccc);
          border-radius: 6px;
          color: var(--primary-text-color, #212121);
          background: var(--card-background-color, #fff);
          resize: vertical;
          font-family: monospace;
          box-sizing: border-box;
        }
        .color-pair {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        input[type="color"] {
          width: 44px;
          height: 30px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          padding: 2px;
          background: none;
        }
        input[type="text"] {
          width: 100px;
          font-size: 13px;
          padding: 4px 6px;
          border: 1px solid var(--divider-color, #ccc);
          border-radius: 6px;
          color: var(--primary-text-color, #212121);
          background: var(--card-background-color, #fff);
        }
        input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }
        .hint {
          font-size: 11px;
          color: var(--secondary-text-color, #888);
          margin-top: 4px;
        }
      </style>

      <!-- Entities -->
      <div class="editor-section">
        <div class="editor-section-title">Entities</div>
        <textarea id="entitiesField" placeholder="media_player.my_speaker&#10;media_player.another_speaker">${entitiesText}</textarea>
        <div class="hint">One entity ID per line</div>
      </div>

      <!-- General -->
      <div class="editor-section">
        <div class="editor-section-title">General</div>
        <div class="editor-row">
          <span class="editor-label">Auto-switch to playing</span>
          <input type="checkbox" id="autoSwitch" ${cfg.auto_switch ? 'checked' : ''}>
        </div>
      </div>

      <!-- Colours -->
      <div class="editor-section">
        <div class="editor-section-title">Colours</div>
        <div class="editor-row">
          <span class="editor-label">Accent colour</span>
          <div class="color-pair">
            <input type="color" id="accentPicker" value="${this._hexFallback(cfg.accent_color, '#007AFF')}">
            <input type="text"  id="accentText"   value="${cfg.accent_color || '#007AFF'}" placeholder="#007AFF">
          </div>
        </div>
        <div class="editor-row">
          <span class="editor-label">Volume accent colour</span>
          <div class="color-pair">
            <input type="color" id="volumeAccentPicker" value="${this._hexFallback(cfg.volume_accent, '#007AFF')}">
            <input type="text"  id="volumeAccentText"   value="${cfg.volume_accent || '#007AFF'}" placeholder="#007AFF">
          </div>
        </div>
        <div class="editor-row">
          <span class="editor-label">Song title colour</span>
          <div class="color-pair">
            <input type="color" id="titleColorPicker" value="${this._hexFallback(cfg.title_color, '#ffffff')}">
            <input type="text"  id="titleColorText"   value="${cfg.title_color || '#ffffff'}" placeholder="#ffffff">
          </div>
        </div>
        <div class="editor-row">
          <span class="editor-label">Artist name colour</span>
          <div class="color-pair">
            <input type="color" id="artistColorPicker" value="${this._hexFallback(cfg.artist_color, '#b3b3b3')}">
            <input type="text"  id="artistColorText"   value="${cfg.artist_color || '#b3b3b3'}" placeholder="#b3b3b3">
          </div>
        </div>
      </div>
    `;

    // ── Entities ──────────────────────────────────────────────
    this.querySelector('#entitiesField').addEventListener('change', e => {
      const entities = e.target.value.split('\n').map(s => s.trim()).filter(Boolean);
      this._dispatch({ entities });
    });

    // ── Auto switch ───────────────────────────────────────────
    this.querySelector('#autoSwitch').addEventListener('change', e => {
      this._dispatch({ auto_switch: e.target.checked });
    });

    // ── Helper: wire up a colour picker + text pair ───────────
    const wireColor = (pickerId, textId, key) => {
      this.querySelector(pickerId).addEventListener('input', e => {
        this.querySelector(textId).value = e.target.value;
        this._dispatch({ [key]: e.target.value });
      });
      this.querySelector(textId).addEventListener('change', e => {
        const val = e.target.value.trim();
        this._dispatch({ [key]: val });
        if (/^#[0-9a-fA-F]{6}$/.test(val)) {
          this.querySelector(pickerId).value = val;
        }
      });
    };

    wireColor('#accentPicker',       '#accentText',       'accent_color');
    wireColor('#volumeAccentPicker', '#volumeAccentText', 'volume_accent');
    wireColor('#titleColorPicker',   '#titleColorText',   'title_color');
    wireColor('#artistColorPicker',  '#artistColorText',  'artist_color');
  }
}

customElements.define('crow-media-player-card-2', CrowMediaPlayerCard2);
customElements.define('crow-media-player-card-2-editor', CrowMediaPlayerCard2Editor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'crow-media-player-card-2',
  name: 'Crow Media Player Card 2',
  description: 'A stylish media player card with compact and full modes.',
});
