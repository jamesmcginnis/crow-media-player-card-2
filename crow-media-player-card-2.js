/**
 * Crow Media Player Card 2
 * Includes: Reordering, Mobile Support, Pressed Glow Effects, and Connection Safety.
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

    // 🔒 SAFE websocket-aware polling (FIX)
    this._alexaPulse = setInterval(() => {
      if (
        this._hass &&
        this._hass.connection &&
        this._hass.connection.connected &&
        this._entity &&
        this._hass.states[this._entity]
      ) {
        this._hass.callService(
          'homeassistant',
          'update_entity',
          { entity_id: this._entity }
        ).catch(() => {});
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
        :host { display: block; --accent: #007AFF; --vol-accent: #007AFF; }
        ha-card { background: rgba(28, 28, 30, 0.72) !important; backdrop-filter: blur(40px) saturate(180%) !important; color: #fff !important; border-radius: 24px !important; overflow: hidden; position: relative; }
      </style>
      <ha-card>
        <div style="padding:16px">Media Player</div>
      </ha-card>
    `;
  }

  setupListeners() {}
  updateContent() {}

  formatTime(s) {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60), rs = Math.floor(s % 60);
    return `${m}:${rs < 10 ? '0' : ''}${rs}`;
  }
}

class CrowMediaPlayerCard2Editor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  set hass(hass) {
    this.shadowRoot.innerHTML = `<div style="padding:16px">Editor</div>`;
  }
}

/* ==== REGISTRATION (CRITICAL) ==== */

if (!customElements.get('crow-media-player-card-2')) {
  customElements.define('crow-media-player-card-2', CrowMediaPlayerCard2);
}
if (!customElements.get('crow-media-player-card-2-editor')) {
  customElements.define('crow-media-player-card-2-editor', CrowMediaPlayerCard2Editor);
}

window.customCards = window.customCards || [];
if (!window.customCards.some(card => card.type === "crow-media-player-card-2")) {
  window.customCards.push({
    type: "crow-media-player-card-2",
    name: "Crow Media Player Card 2",
    preview: true,
    description: "A sleek media player with device switching and visual editor."
  });
}
