var q = Object.defineProperty;
var I = (g, h, t) => h in g ? q(g, h, { enumerable: !0, configurable: !0, writable: !0, value: t }) : g[h] = t;
var p = (g, h, t) => I(g, typeof h != "symbol" ? h + "" : h, t);
class A extends HTMLElement {
  constructor() {
    super();
    p(this, "_config");
    p(this, "_hass");
    p(this, "_root");
    this._root = this.attachShadow({ mode: "open" });
  }
  setConfig(t) {
    this._config = t, this._render();
  }
  set hass(t) {
    this._hass = t, this._render();
  }
  _getStyles() {
    return `
      :host {
        display: block;
      }
      
      .editor {
        padding: 16px;
      }
      
      .row {
        margin-bottom: 16px;
      }
      
      label {
        display: block;
        font-weight: 500;
        margin-bottom: 4px;
        color: var(--primary-text-color);
      }
      
      .description {
        font-size: 12px;
        color: var(--secondary-text-color);
        margin-bottom: 8px;
      }
      
      input, select {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
        font-size: 14px;
      }
      
      input:focus, select:focus {
        outline: none;
        border-color: var(--primary-color);
      }
      
      .checkbox-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .checkbox-row input {
        width: auto;
      }
      
      .section {
        border-top: 1px solid var(--divider-color);
        padding-top: 16px;
        margin-top: 16px;
      }
      
      .section-title {
        font-weight: 600;
        margin-bottom: 12px;
        color: var(--primary-text-color);
      }
      
      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
    `;
  }
  _getClimateEntities() {
    return this._hass ? Object.keys(this._hass.states).filter((t) => t.startsWith("climate.")).sort() : [];
  }
  _getSensorEntities() {
    return this._hass ? Object.keys(this._hass.states).filter((t) => t.startsWith("sensor.")).sort() : [];
  }
  _valueChanged(t, e) {
    const o = { ...this._config, [t]: e };
    (e === "" || e === void 0) && delete o[t];
    const i = new CustomEvent("config-changed", {
      detail: { config: o },
      bubbles: !0,
      composed: !0
    });
    this.dispatchEvent(i);
  }
  _render() {
    var e, o, i, n;
    const t = this._getClimateEntities();
    this._root.innerHTML = `
      <style>${this._getStyles()}</style>
      <div class="editor">
        <!-- Entity Selection -->
        <div class="row">
          <label>Entity *</label>
          <div class="description">Select your climate/thermostat entity</div>
          <select id="entity">
            <option value="">Select entity...</option>
            ${t.map((s) => {
      var r, a, l;
      return `
              <option value="${s}" ${this._config.entity === s ? "selected" : ""}>
                ${((l = (a = (r = this._hass) == null ? void 0 : r.states[s]) == null ? void 0 : a.attributes) == null ? void 0 : l.friendly_name) || s}
              </option>
            `;
    }).join("")}
          </select>
        </div>

        <!-- Name -->
        <div class="row">
          <label>Name</label>
          <div class="description">Custom display name (optional)</div>
          <input type="text" id="name" value="${this._config.name || ""}" placeholder="Living Room Thermostat">
        </div>

        <!-- Quick Presets -->
        <div class="row">
          <label>Quick Presets</label>
          <div class="description">Comma-separated temperatures (e.g., 19, 20, 22, 24)</div>
          <input type="text" id="quick_presets" 
                 value="${((e = this._config.quick_presets) == null ? void 0 : e.join(", ")) || ""}" 
                 placeholder="19, 20, 22, 24">
        </div>

        <!-- Display Options -->
        <div class="section">
          <div class="section-title">Display Options</div>
          
          <div class="row checkbox-row">
            <input type="checkbox" id="show_modes" ${this._config.show_modes !== !1 ? "checked" : ""}>
            <label for="show_modes">Show HVAC Mode Buttons</label>
          </div>
          
          <div class="row checkbox-row">
            <input type="checkbox" id="show_presets" ${this._config.show_presets !== !1 ? "checked" : ""}>
            <label for="show_presets">Show Preset Mode Buttons</label>
          </div>
          
          <div class="row checkbox-row">
            <input type="checkbox" id="show_fan" ${this._config.show_fan !== !1 ? "checked" : ""}>
            <label for="show_fan">Show Fan Mode Buttons</label>
          </div>
          
          <div class="row checkbox-row">
            <input type="checkbox" id="locked" ${this._config.locked ? "checked" : ""}>
            <label for="locked">Lock Controls (Child Lock)</label>
          </div>
        </div>

        <!-- Temperature Settings -->
        <div class="section">
          <div class="section-title">Temperature Settings</div>
          
          <div class="grid">
            <div class="row">
              <label>Min Temperature</label>
              <input type="number" id="min_temp" value="${this._config.min_temp || ""}" placeholder="16">
            </div>
            
            <div class="row">
              <label>Max Temperature</label>
              <input type="number" id="max_temp" value="${this._config.max_temp || ""}" placeholder="30">
            </div>
            
            <div class="row">
              <label>Step</label>
              <input type="number" id="step" step="0.1" value="${this._config.step || ""}" placeholder="0.5">
            </div>
          </div>
        </div>
      </div>
    `, (o = this._root.getElementById("entity")) == null || o.addEventListener("change", (s) => {
      this._valueChanged("entity", s.target.value);
    }), (i = this._root.getElementById("name")) == null || i.addEventListener("input", (s) => {
      this._valueChanged("name", s.target.value);
    }), (n = this._root.getElementById("quick_presets")) == null || n.addEventListener("input", (s) => {
      const a = s.target.value.split(",").map((l) => parseFloat(l.trim())).filter((l) => !isNaN(l));
      this._valueChanged("quick_presets", a.length ? a : void 0);
    }), ["show_modes", "show_presets", "show_fan", "locked"].forEach((s) => {
      var r;
      (r = this._root.getElementById(s)) == null || r.addEventListener("change", (a) => {
        this._valueChanged(s, a.target.checked);
      });
    }), ["min_temp", "max_temp", "step"].forEach((s) => {
      var r;
      (r = this._root.getElementById(s)) == null || r.addEventListener("input", (a) => {
        const l = parseFloat(a.target.value);
        this._valueChanged(s, isNaN(l) ? void 0 : l);
      });
    });
  }
}
customElements.define("neumorphic-thermostat-ui-editor", A);
class P extends HTMLElement {
  constructor() {
    super();
    p(this, "_config");
    p(this, "_hass");
    p(this, "_tempHistory", []);
    p(this, "_lastServiceCall", 0);
    p(this, "_debounceTimeout", null);
    p(this, "_root");
    this._root = this.attachShadow({ mode: "open" });
  }
  static getConfigElement() {
    return document.createElement("neumorphic-thermostat-ui-editor");
  }
  static getStubConfig() {
    return {
      entity: "climate.thermostat",
      quick_presets: [19, 20, 22, 24]
    };
  }
  setConfig(t) {
    if (!t.entity)
      throw new Error("Please define an entity");
    this._config = {
      show_modes: !0,
      show_presets: !0,
      show_fan: !0,
      locked: !1,
      step: 0.5,
      ...t
    }, this._render();
  }
  set hass(t) {
    var i, n;
    const e = this._hass;
    this._hass = t;
    const o = t.states[this._config.entity];
    if (((i = o == null ? void 0 : o.attributes) == null ? void 0 : i.current_temperature) !== void 0) {
      const s = o.attributes.current_temperature, r = Date.now();
      this._tempHistory.push({ temp: s, timestamp: r });
      const a = r - 30 * 60 * 1e3;
      this._tempHistory = this._tempHistory.filter((l) => l.timestamp > a);
    }
    (!e || e.states[this._config.entity] !== t.states[this._config.entity] || (n = this._config.sensors) != null && n.some((s) => e.states[s] !== t.states[s])) && this._render();
  }
  getCardSize() {
    return 4;
  }
  _getStyles() {
    return `
      :host {
        --neu-bg: hsl(220, 15%, 92%);
        --neu-bg-dark: hsl(220, 15%, 85%);
        --neu-bg-light: hsl(220, 15%, 98%);
        --heating-color: hsl(25, 95%, 55%);
        --heating-glow: hsl(15, 100%, 50%);
        --cooling-color: hsl(200, 95%, 55%);
        --cooling-glow: hsl(210, 100%, 60%);
        --off-color: hsl(220, 10%, 55%);
        --text-primary: hsl(220, 15%, 25%);
        --text-secondary: hsl(220, 10%, 50%);
        --shadow-dark: hsl(220, 15%, 78%);
        --shadow-light: hsl(0, 0%, 100%);
        --error-color: hsl(0, 70%, 55%);
        --success-color: hsl(140, 70%, 45%);
      }

      .card {
        background: var(--neu-bg);
        border-radius: 24px;
        padding: 24px;
        box-shadow: 
          8px 8px 16px var(--shadow-dark),
          -8px -8px 16px var(--shadow-light);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .card.locked {
        opacity: 0.7;
        pointer-events: none;
      }

      .card.unavailable {
        opacity: 0.5;
      }

      /* Header */
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
      }

      .header-left h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--text-primary);
      }

      .header-left p {
        margin: 4px 0 0;
        font-size: 13px;
        color: var(--text-secondary);
      }

      .mode-button {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        border: none;
        background: var(--neu-bg);
        box-shadow: 
          4px 4px 8px var(--shadow-dark),
          -4px -4px 8px var(--shadow-light);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        color: var(--off-color);
      }

      .mode-button:active {
        box-shadow: 
          inset 2px 2px 4px var(--shadow-dark),
          inset -2px -2px 4px var(--shadow-light);
      }

      .mode-button.heating {
        color: var(--heating-color);
      }

      .mode-button.cooling {
        color: var(--cooling-color);
      }

      .mode-button svg {
        width: 20px;
        height: 20px;
      }

      /* Temperature Dial */
      .dial-container {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 24px 0;
      }

      .dial-ring {
        position: absolute;
        width: 200px;
        height: 200px;
        border-radius: 50%;
        transition: all 0.5s ease;
      }

      .dial-ring.heating {
        background: conic-gradient(
          from 135deg,
          var(--heating-color) 0deg,
          var(--heating-glow) var(--progress),
          transparent var(--progress)
        );
        box-shadow: 0 0 30px hsla(25, 95%, 55%, 0.3);
        animation: ring-pulse 2s ease-in-out infinite;
      }

      .dial-ring.cooling {
        background: conic-gradient(
          from 135deg,
          var(--cooling-color) 0deg,
          var(--cooling-glow) var(--progress),
          transparent var(--progress)
        );
        box-shadow: 0 0 30px hsla(200, 95%, 55%, 0.3);
        animation: ring-pulse 2s ease-in-out infinite;
      }

      .dial-ring.off {
        background: conic-gradient(
          from 135deg,
          var(--off-color) 0deg,
          var(--off-color) var(--progress),
          transparent var(--progress)
        );
        opacity: 0.3;
      }

      @keyframes ring-pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.85; transform: scale(1.02); }
      }

      .dial-inner {
        width: 170px;
        height: 170px;
        border-radius: 50%;
        background: var(--neu-bg);
        box-shadow: 
          inset 6px 6px 12px var(--shadow-dark),
          inset -6px -6px 12px var(--shadow-light);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: relative;
        z-index: 10;
        overflow: hidden;
      }

      /* Heating/Cooling animations inside dial */
      .glow-inner {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        pointer-events: none;
      }

      .glow-inner.heating {
        background: radial-gradient(circle at center, hsla(25, 95%, 55%, 0.15) 0%, transparent 70%);
        animation: heat-pulse 2s ease-in-out infinite;
      }

      .glow-inner.cooling {
        background: radial-gradient(circle at center, hsla(200, 95%, 55%, 0.15) 0%, transparent 70%);
        animation: cool-pulse 2.5s ease-in-out infinite;
      }

      @keyframes heat-pulse {
        0%, 100% { opacity: 0.5; transform: scale(0.95); }
        50% { opacity: 1; transform: scale(1.05); }
      }

      @keyframes cool-pulse {
        0%, 100% { opacity: 0.5; transform: scale(0.95); }
        50% { opacity: 1; transform: scale(1.05); }
      }

      .ring-expand {
        position: absolute;
        inset: 16px;
        border-radius: 50%;
        pointer-events: none;
        animation: ring-expand 2.1s ease-out infinite;
      }

      .ring-expand.heating {
        border: 2px solid hsla(25, 95%, 55%, 0.3);
        box-shadow: 
          inset 0 0 15px hsla(25, 95%, 55%, 0.1),
          0 0 10px hsla(25, 95%, 55%, 0.05);
      }

      .ring-expand.cooling {
        border: 2px solid hsla(200, 95%, 55%, 0.3);
        box-shadow: 
          inset 0 0 15px hsla(200, 95%, 55%, 0.1),
          0 0 10px hsla(200, 95%, 55%, 0.05);
      }

      @keyframes ring-expand {
        0% { transform: scale(0.8); opacity: 0.8; }
        100% { transform: scale(1.2); opacity: 0; }
      }

      .current-label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: var(--text-secondary);
        margin-bottom: 2px;
        position: relative;
        z-index: 10;
      }

      .current-temp {
        font-size: 14px;
        color: var(--text-secondary);
        position: relative;
        z-index: 10;
      }

      .target-temp {
        display: flex;
        align-items: baseline;
        margin-top: 8px;
        position: relative;
        z-index: 10;
      }

      .target-temp .value {
        font-size: 48px;
        font-weight: 300;
        transition: color 0.3s ease;
      }

      .target-temp .unit {
        font-size: 24px;
        margin-left: 2px;
        transition: color 0.3s ease;
      }

      .target-temp.heating .value,
      .target-temp.heating .unit {
        color: var(--heating-color);
      }

      .target-temp.cooling .value,
      .target-temp.cooling .unit {
        color: var(--cooling-color);
      }

      .target-temp.off .value,
      .target-temp.off .unit {
        color: var(--off-color);
      }

      .mode-label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-top: 4px;
        position: relative;
        z-index: 10;
        transition: color 0.3s ease;
      }

      .mode-label.heating { color: var(--heating-color); }
      .mode-label.cooling { color: var(--cooling-color); }
      .mode-label.off { color: var(--off-color); }

      /* Controls */
      .controls {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 24px;
      }

      .control-button {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        border: none;
        background: var(--neu-bg);
        box-shadow: 
          4px 4px 8px var(--shadow-dark),
          -4px -4px 8px var(--shadow-light);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-primary);
        transition: all 0.2s ease;
      }

      .control-button:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .control-button:active:not(:disabled) {
        box-shadow: 
          inset 2px 2px 4px var(--shadow-dark),
          inset -2px -2px 4px var(--shadow-light);
      }

      .control-button svg {
        width: 24px;
        height: 24px;
      }

      .range-display {
        background: var(--neu-bg);
        box-shadow: 
          inset 2px 2px 4px var(--shadow-dark),
          inset -2px -2px 4px var(--shadow-light);
        border-radius: 12px;
        padding: 8px 16px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .range-display span {
        font-size: 13px;
        font-weight: 500;
        color: var(--text-secondary);
      }

      /* Quick Presets */
      .quick-presets {
        display: flex;
        gap: 8px;
        justify-content: center;
        margin-top: 16px;
        flex-wrap: wrap;
      }

      .preset-chip {
        padding: 8px 16px;
        border-radius: 20px;
        border: none;
        background: var(--neu-bg);
        box-shadow: 
          3px 3px 6px var(--shadow-dark),
          -3px -3px 6px var(--shadow-light);
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        color: var(--text-primary);
        transition: all 0.2s ease;
      }

      .preset-chip:active {
        box-shadow: 
          inset 2px 2px 4px var(--shadow-dark),
          inset -2px -2px 4px var(--shadow-light);
      }

      .preset-chip.active {
        color: var(--heating-color);
        box-shadow: 
          inset 2px 2px 4px var(--shadow-dark),
          inset -2px -2px 4px var(--shadow-light);
      }

      /* HVAC Modes */
      .hvac-modes {
        display: flex;
        gap: 8px;
        justify-content: center;
        margin-top: 16px;
        flex-wrap: wrap;
      }

      .hvac-mode-button {
        padding: 8px 14px;
        border-radius: 10px;
        border: none;
        background: var(--neu-bg);
        box-shadow: 
          3px 3px 6px var(--shadow-dark),
          -3px -3px 6px var(--shadow-light);
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        text-transform: uppercase;
        color: var(--text-secondary);
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .hvac-mode-button:active {
        box-shadow: 
          inset 2px 2px 4px var(--shadow-dark),
          inset -2px -2px 4px var(--shadow-light);
      }

      .hvac-mode-button.active {
        box-shadow: 
          inset 2px 2px 4px var(--shadow-dark),
          inset -2px -2px 4px var(--shadow-light);
      }

      .hvac-mode-button.active.heat { color: var(--heating-color); }
      .hvac-mode-button.active.cool { color: var(--cooling-color); }
      .hvac-mode-button.active.heat_cool { color: hsl(45, 90%, 50%); }
      .hvac-mode-button.active.auto { color: hsl(280, 70%, 55%); }
      .hvac-mode-button.active.dry { color: hsl(35, 80%, 50%); }
      .hvac-mode-button.active.fan_only { color: hsl(180, 60%, 50%); }
      .hvac-mode-button.active.off { color: var(--off-color); }

      .hvac-mode-button svg {
        width: 14px;
        height: 14px;
      }

      /* Status Bar */
      .status-bar {
        margin-top: 20px;
        background: var(--neu-bg);
        box-shadow: 
          inset 2px 2px 4px var(--shadow-dark),
          inset -2px -2px 4px var(--shadow-light);
        border-radius: 12px;
        padding: 12px 16px;
      }

      .status-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 13px;
      }

      .status-left {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--off-color);
      }

      .status-dot.heating {
        background: var(--heating-color);
        animation: pulse 2s ease-in-out infinite;
      }

      .status-dot.cooling {
        background: var(--cooling-color);
        animation: pulse 2s ease-in-out infinite;
      }

      .status-dot.idle {
        background: var(--success-color);
      }

      .status-dot.error {
        background: var(--error-color);
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      .status-text {
        color: var(--text-secondary);
      }

      .status-diff {
        font-weight: 500;
      }

      .status-diff.heating { color: var(--heating-color); }
      .status-diff.cooling { color: var(--cooling-color); }
      .status-diff.off { color: var(--off-color); }

      /* Trend indicator */
      .trend-indicator {
        display: inline-flex;
        align-items: center;
        margin-left: 8px;
      }

      .trend-indicator svg {
        width: 14px;
        height: 14px;
      }

      .trend-indicator.rising { color: var(--heating-color); }
      .trend-indicator.falling { color: var(--cooling-color); }
      .trend-indicator.stable { color: var(--success-color); }

      /* Sensors */
      .sensors-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
        gap: 8px;
        margin-top: 12px;
      }

      .sensor-item {
        background: var(--neu-bg);
        box-shadow: 
          2px 2px 4px var(--shadow-dark),
          -2px -2px 4px var(--shadow-light);
        border-radius: 10px;
        padding: 10px;
        text-align: center;
      }

      .sensor-value {
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary);
      }

      .sensor-label {
        font-size: 10px;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-top: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* Error states */
      .error-message {
        text-align: center;
        padding: 20px;
        color: var(--error-color);
      }

      .error-message svg {
        width: 48px;
        height: 48px;
        margin-bottom: 12px;
        opacity: 0.7;
      }

      .error-message h4 {
        margin: 0 0 8px;
        font-size: 16px;
      }

      .error-message p {
        margin: 0;
        font-size: 13px;
        color: var(--text-secondary);
      }

      /* Preset modes */
      .preset-modes {
        display: flex;
        gap: 6px;
        justify-content: center;
        margin-top: 12px;
        flex-wrap: wrap;
      }

      .preset-mode-button {
        padding: 6px 12px;
        border-radius: 8px;
        border: none;
        background: var(--neu-bg);
        box-shadow: 
          2px 2px 4px var(--shadow-dark),
          -2px -2px 4px var(--shadow-light);
        cursor: pointer;
        font-size: 11px;
        font-weight: 500;
        text-transform: capitalize;
        color: var(--text-secondary);
        transition: all 0.2s ease;
      }

      .preset-mode-button.active {
        box-shadow: 
          inset 2px 2px 4px var(--shadow-dark),
          inset -2px -2px 4px var(--shadow-light);
        color: var(--heating-color);
      }

      /* Fan modes */
      .fan-modes {
        display: flex;
        gap: 6px;
        justify-content: center;
        margin-top: 12px;
        flex-wrap: wrap;
      }

      .fan-mode-button {
        padding: 6px 10px;
        border-radius: 8px;
        border: none;
        background: var(--neu-bg);
        box-shadow: 
          2px 2px 4px var(--shadow-dark),
          -2px -2px 4px var(--shadow-light);
        cursor: pointer;
        font-size: 11px;
        font-weight: 500;
        text-transform: capitalize;
        color: var(--text-secondary);
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .fan-mode-button.active {
        box-shadow: 
          inset 2px 2px 4px var(--shadow-dark),
          inset -2px -2px 4px var(--shadow-light);
        color: hsl(180, 60%, 50%);
      }

      .fan-mode-button svg {
        width: 12px;
        height: 12px;
      }

      /* Locked overlay */
      .locked-overlay {
        position: absolute;
        inset: 0;
        background: hsla(220, 15%, 92%, 0.5);
        border-radius: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
      }

      .locked-overlay svg {
        width: 32px;
        height: 32px;
        color: var(--text-secondary);
      }

      .card-wrapper {
        position: relative;
      }

      /* Action badge */
      .action-badge {
        position: absolute;
        top: -8px;
        right: -8px;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      }

      .action-badge.heating {
        background: var(--heating-color);
        color: white;
      }

      .action-badge.cooling {
        background: var(--cooling-color);
        color: white;
      }

      .action-badge.idle {
        background: var(--success-color);
        color: white;
      }
    `;
  }
  _getTemperatureUnit() {
    var e, o, i, n, s;
    if (this._config.unit_override) return this._config.unit_override;
    const t = (e = this._hass) == null ? void 0 : e.states[this._config.entity];
    return ((o = t == null ? void 0 : t.attributes) == null ? void 0 : o.unit_of_measurement) || ((s = (n = (i = this._hass) == null ? void 0 : i.config) == null ? void 0 : n.unit_system) == null ? void 0 : s.temperature) || "°C";
  }
  _getStep() {
    var e, o;
    if (this._config.step) return this._config.step;
    const t = (e = this._hass) == null ? void 0 : e.states[this._config.entity];
    return ((o = t == null ? void 0 : t.attributes) == null ? void 0 : o.target_temp_step) || 0.5;
  }
  _getMinTemp() {
    var e, o;
    if (this._config.min_temp !== void 0) return this._config.min_temp;
    const t = (e = this._hass) == null ? void 0 : e.states[this._config.entity];
    return ((o = t == null ? void 0 : t.attributes) == null ? void 0 : o.min_temp) ?? 16;
  }
  _getMaxTemp() {
    var e, o;
    if (this._config.max_temp !== void 0) return this._config.max_temp;
    const t = (e = this._hass) == null ? void 0 : e.states[this._config.entity];
    return ((o = t == null ? void 0 : t.attributes) == null ? void 0 : o.max_temp) ?? 30;
  }
  _getTrend() {
    if (this._tempHistory.length < 2) return "stable";
    const t = this._tempHistory.slice(-5);
    if (t.length < 2) return "stable";
    const e = t[0].temp, i = t[t.length - 1].temp - e;
    return i > 0.3 ? "rising" : i < -0.3 ? "falling" : "stable";
  }
  _getStatusText(t, e, o, i) {
    if (t === "off") return "Система выключена";
    if (e)
      switch (e) {
        case "heating":
          return "Нагреваем";
        case "cooling":
          return "Охлаждаем";
        case "idle":
          return "Поддерживаем";
        case "drying":
          return "Осушаем";
        case "fan":
          return "Вентиляция";
        default:
          return e;
      }
    const n = i - o;
    return Math.abs(n) < 0.5 ? "Температура достигнута" : n > 0 ? "Нагреваем до цели" : "Охлаждаем до цели";
  }
  _callService(t, e, o) {
    const i = Date.now();
    if (i - this._lastServiceCall < 1500) {
      this._debounceTimeout && clearTimeout(this._debounceTimeout), this._debounceTimeout = setTimeout(() => {
        this._hass.callService(t, e, o), this._lastServiceCall = Date.now();
      }, 500);
      return;
    }
    this._hass.callService(t, e, o), this._lastServiceCall = i;
  }
  _handleTempChange(t) {
    if (this._config.locked) return;
    const e = this._hass.states[this._config.entity];
    if (!e) return;
    const o = e.attributes.temperature ?? 20, i = Math.max(
      this._getMinTemp(),
      Math.min(this._getMaxTemp(), o + t)
    );
    this._callService("climate", "set_temperature", {
      entity_id: this._config.entity,
      temperature: i
    });
  }
  _handleModeChange(t) {
    this._config.locked || this._callService("climate", "set_hvac_mode", {
      entity_id: this._config.entity,
      hvac_mode: t
    });
  }
  _handlePresetChange(t) {
    this._config.locked || this._callService("climate", "set_preset_mode", {
      entity_id: this._config.entity,
      preset_mode: t
    });
  }
  _handleFanModeChange(t) {
    this._config.locked || this._callService("climate", "set_fan_mode", {
      entity_id: this._config.entity,
      fan_mode: t
    });
  }
  _handleQuickPreset(t) {
    this._config.locked || this._callService("climate", "set_temperature", {
      entity_id: this._config.entity,
      temperature: t
    });
  }
  _handleMoreInfo() {
    const t = new CustomEvent("hass-more-info", {
      bubbles: !0,
      composed: !0,
      detail: { entityId: this._config.entity }
    });
    this.dispatchEvent(t);
  }
  _getModeIcon(t) {
    const e = {
      heat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 12c0-3 2.5-6 2.5-6S17 9 17 12a5 5 0 1 1-10 0c0-3 2.5-6 2.5-6S12 9 12 12Z"/></svg>',
      cool: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h20M12 2v20m5.66-14.66-3.54 3.54m3.54 7.78-3.54-3.54M6.34 6.34l3.54 3.54m-3.54 7.78 3.54-3.54"/></svg>',
      heat_cool: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2v20M2 12h20"/></svg>',
      auto: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/><path d="m12 12 4 2"/></svg>',
      dry: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v6m0 12v2M4.93 4.93l4.24 4.24m5.66 5.66 4.24 4.24M2 12h6m12 0h2M4.93 19.07l4.24-4.24m5.66-5.66 4.24-4.24"/></svg>',
      fan_only: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 12c-3.5 0-6-2-6-5s3.5-5 6-5 6 2 6 5-2.5 5-6 5Z"/><path d="M12 12c0 3.5 2 6 5 6s5-3.5 5-6-2-6-5-6-5 2.5-5 6Z"/><path d="M12 12c3.5 0 6 2 6 5s-3.5 5-6 5-6-2-6-5 2.5-5 6-5Z"/><path d="M12 12c0-3.5-2-6-5-6S2 9.5 2 12s2 6 5 6 5-2.5 5-6Z"/><circle cx="12" cy="12" r="2"/></svg>',
      off: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10"/></svg>'
    };
    return e[t] || e.off;
  }
  _render() {
    var y, k;
    if (!this._hass || !this._config) return;
    const t = this._hass.states[this._config.entity];
    if (!t) {
      this._root.innerHTML = `
        <style>${this._getStyles()}</style>
        <div class="card unavailable">
          <div class="error-message">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4m0 4h.01"/>
            </svg>
            <h4>Нет связи</h4>
            <p>Entity ${this._config.entity} недоступен</p>
          </div>
        </div>
      `;
      return;
    }
    const e = t.attributes.current_temperature, o = t.attributes.temperature, i = t.state, n = t.attributes.hvac_action, s = t.attributes.hvac_modes || [], r = t.attributes.preset_mode, a = t.attributes.preset_modes || [], l = t.attributes.fan_mode, b = t.attributes.fan_modes || [], $ = this._getTemperatureUnit();
    this._getStep();
    const v = this._getMinTemp(), m = this._getMaxTemp(), _ = this._config.name || t.attributes.friendly_name || "Термостат", f = this._getTrend(), d = i === "off" ? "off" : i === "cool" ? "cooling" : "heating", M = o !== void 0 ? (o - v) / (m - v) * 180 : 0, u = o !== void 0 && e !== void 0 ? o - e : null, C = e !== void 0 && o !== void 0 ? this._getStatusText(i, n, e, o) : "Нет данных температуры", T = n && n !== "off" && n !== "idle" ? `<div class="action-badge ${n}">${n === "heating" ? "🔥" : "❄️"} ${n}</div>` : "", S = (y = this._config.quick_presets) != null && y.length ? `<div class="quick-presets">
          ${this._config.quick_presets.map((c) => `
            <button class="preset-chip ${o === c ? "active" : ""}" 
                    data-temp="${c}">${c}°</button>
          `).join("")}
        </div>` : "", w = this._config.show_modes && s.length > 0 ? `<div class="hvac-modes">
          ${s.map((c) => `
            <button class="hvac-mode-button ${i === c ? "active" : ""} ${c}" 
                    data-mode="${c}">
              ${this._getModeIcon(c)}
              ${c === "heat_cool" ? "авто" : c}
            </button>
          `).join("")}
        </div>` : "", E = this._config.show_presets && a.length > 0 ? `<div class="preset-modes">
          ${a.map((c) => `
            <button class="preset-mode-button ${r === c ? "active" : ""}" 
                    data-preset="${c}">${c}</button>
          `).join("")}
        </div>` : "", L = this._config.show_fan && b.length > 0 ? `<div class="fan-modes">
          ${b.map((c) => `
            <button class="fan-mode-button ${l === c ? "active" : ""}" 
                    data-fan="${c}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 12c-3.5 0-6-2-6-5s3.5-5 6-5 6 2 6 5-2.5 5-6 5Z"/>
                <circle cx="12" cy="12" r="2"/>
              </svg>
              ${c}
            </button>
          `).join("")}
        </div>` : "", B = (k = this._config.sensors) != null && k.length ? `<div class="sensors-grid">
          ${this._config.sensors.slice(0, 4).map((c) => {
      const x = this._hass.states[c];
      return x ? `
              <div class="sensor-item">
                <div class="sensor-value">${x.state}${x.attributes.unit_of_measurement || ""}</div>
                <div class="sensor-label">${x.attributes.friendly_name || c.split(".").pop()}</div>
              </div>
            ` : "";
    }).join("")}
        </div>` : "", z = f !== "stable" ? `<span class="trend-indicator ${f}">
          ${f === "rising" ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m18 15-6-6-6 6"/></svg>' : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>'}
        </span>` : "", H = this._config.locked ? `<div class="locked-overlay">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>` : "", j = d !== "off" ? `
      <div class="glow-inner ${d}"></div>
      <div class="ring-expand ${d}"></div>
      <div class="ring-expand ${d}" style="animation-delay: 0.7s"></div>
      <div class="ring-expand ${d}" style="animation-delay: 1.4s"></div>
    ` : "";
    if (o === void 0) {
      this._root.innerHTML = `
        <style>${this._getStyles()}</style>
        <div class="card">
          <div class="header">
            <div class="header-left">
              <h3>${_}</h3>
              <p>Термостат</p>
            </div>
          </div>
          <div class="error-message">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 9v2m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
            </svg>
            <h4>Ограниченная функциональность</h4>
            <p>Устройство не поддерживает установку температуры</p>
          </div>
          ${w}
        </div>
      `, this._attachEventListeners();
      return;
    }
    this._root.innerHTML = `
      <style>${this._getStyles()}</style>
      <div class="card-wrapper">
        ${H}
        ${T}
        <div class="card ${this._config.locked ? "locked" : ""}">
          <!-- Header -->
          <div class="header">
            <div class="header-left">
              <h3>${_}</h3>
              <p>Термостат</p>
            </div>
            <button class="mode-button ${d}" data-action="cycle-mode">
              ${d === "heating" ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 12c0-3 2.5-6 2.5-6S17 9 17 12a5 5 0 1 1-10 0c0-3 2.5-6 2.5-6S12 9 12 12Z"/></svg>' : d === "cooling" ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h20M12 2v20m5.66-14.66-3.54 3.54m3.54 7.78-3.54-3.54M6.34 6.34l3.54 3.54m-3.54 7.78 3.54-3.54"/></svg>' : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10"/></svg>'}
            </button>
          </div>

          <!-- Temperature Dial -->
          <div class="dial-container">
            <div class="dial-ring ${d}" style="--progress: ${M}deg"></div>
            <div class="dial-inner">
              ${j}
              <span class="current-label">Текущая</span>
              <span class="current-temp">${e !== void 0 ? `${e}°` : "—"}</span>
              <div class="target-temp ${d}">
                <span class="value">${o}</span>
                <span class="unit">${$}</span>
              </div>
              <span class="mode-label ${d}">
                ${i === "off" ? "Выкл" : i}
              </span>
            </div>
          </div>

          <!-- Controls -->
          <div class="controls">
            <button class="control-button" data-action="decrease" ${o <= v ? "disabled" : ""}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14"/>
              </svg>
            </button>
            <div class="range-display">
              <span>${v}° - ${m}°</span>
            </div>
            <button class="control-button" data-action="increase" ${o >= m ? "disabled" : ""}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14m-7-7h14"/>
              </svg>
            </button>
          </div>

          ${S}
          ${w}
          ${E}
          ${L}

          <!-- Status Bar -->
          <div class="status-bar">
            <div class="status-row">
              <div class="status-left">
                <div class="status-dot ${n || (i === "off" ? "" : "idle")}"></div>
                <span class="status-text">${C}</span>
                ${z}
              </div>
              <span class="status-diff ${d}">
                ${u !== null && i !== "off" ? u > 0 ? `+${u.toFixed(1)}°` : u < 0 ? `${u.toFixed(1)}°` : "✓" : "—"}
              </span>
            </div>
          </div>

          ${B}
        </div>
      </div>
    `, this._attachEventListeners();
  }
  _attachEventListeners() {
    var o, i, n;
    (o = this._root.querySelector('[data-action="increase"]')) == null || o.addEventListener("click", () => {
      this._handleTempChange(this._getStep());
    }), (i = this._root.querySelector('[data-action="decrease"]')) == null || i.addEventListener("click", () => {
      this._handleTempChange(-this._getStep());
    }), (n = this._root.querySelector('[data-action="cycle-mode"]')) == null || n.addEventListener("click", () => {
      const s = this._hass.states[this._config.entity];
      if (!s) return;
      const r = s.attributes.hvac_modes || [], a = r.indexOf(s.state), l = r[(a + 1) % r.length];
      this._handleModeChange(l);
    });
    let t;
    const e = this._root.querySelector(".dial-container");
    e == null || e.addEventListener("mousedown", () => {
      t = setTimeout(() => this._handleMoreInfo(), 500);
    }), e == null || e.addEventListener("mouseup", () => clearTimeout(t)), e == null || e.addEventListener("mouseleave", () => clearTimeout(t)), e == null || e.addEventListener("touchstart", () => {
      t = setTimeout(() => this._handleMoreInfo(), 500);
    }), e == null || e.addEventListener("touchend", () => clearTimeout(t)), this._root.querySelectorAll(".preset-chip").forEach((s) => {
      s.addEventListener("click", (r) => {
        const a = parseFloat(r.currentTarget.dataset.temp || "20");
        this._handleQuickPreset(a);
      });
    }), this._root.querySelectorAll(".hvac-mode-button").forEach((s) => {
      s.addEventListener("click", (r) => {
        const a = r.currentTarget.dataset.mode || "off";
        this._handleModeChange(a);
      });
    }), this._root.querySelectorAll(".preset-mode-button").forEach((s) => {
      s.addEventListener("click", (r) => {
        const a = r.currentTarget.dataset.preset || "";
        this._handlePresetChange(a);
      });
    }), this._root.querySelectorAll(".fan-mode-button").forEach((s) => {
      s.addEventListener("click", (r) => {
        const a = r.currentTarget.dataset.fan || "";
        this._handleFanModeChange(a);
      });
    });
  }
}
customElements.define("neumorphic-thermostat-ui", P);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "neumorphic-thermostat-ui",
  name: "Neumorphic Thermostat UI",
  description: "A beautiful neumorphic thermostat card for Home Assistant with advanced climate control features.",
  preview: !0,
  documentationURL: "https://github.com/YOUR_USERNAME/neumorphic-thermostat-ui"
});
console.info(
  "%c NEUMORPHIC-THERMOSTAT-UI %c v1.0.0 ",
  "color: white; background: #ff6b35; font-weight: bold;",
  "color: #ff6b35; background: white; font-weight: bold;"
);
