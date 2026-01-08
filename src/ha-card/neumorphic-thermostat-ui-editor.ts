/**
 * Neumorphic Thermostat UI - Configuration Editor
 * Visual editor for card configuration in Lovelace UI
 */

interface EditorConfig {
  entity?: string;
  name?: string;
  quick_presets?: number[];
  sensors?: string[];
  show_modes?: boolean;
  show_presets?: boolean;
  show_fan?: boolean;
  locked?: boolean;
  step?: number;
  min_temp?: number;
  max_temp?: number;
}

interface Hass {
  states: Record<string, { entity_id: string; attributes: { friendly_name?: string } }>;
}

class NeumorphicThermostatEditor extends HTMLElement {
  private _config!: EditorConfig;
  private _hass!: Hass;
  private _root!: ShadowRoot;

  constructor() {
    super();
    this._root = this.attachShadow({ mode: 'open' });
  }

  setConfig(config: EditorConfig) {
    this._config = config;
    this._render();
  }

  set hass(hass: Hass) {
    this._hass = hass;
    this._render();
  }

  private _getStyles(): string {
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

  private _getClimateEntities(): string[] {
    if (!this._hass) return [];
    return Object.keys(this._hass.states)
      .filter(eid => eid.startsWith('climate.'))
      .sort();
  }

  private _getSensorEntities(): string[] {
    if (!this._hass) return [];
    return Object.keys(this._hass.states)
      .filter(eid => eid.startsWith('sensor.'))
      .sort();
  }

  private _valueChanged(key: string, value: unknown) {
    const newConfig = { ...this._config, [key]: value };
    
    // Remove undefined/empty values
    if (value === '' || value === undefined) {
      delete (newConfig as Record<string, unknown>)[key];
    }
    
    const event = new CustomEvent('config-changed', {
      detail: { config: newConfig },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  private _render() {
    const climateEntities = this._getClimateEntities();
    
    this._root.innerHTML = `
      <style>${this._getStyles()}</style>
      <div class="editor">
        <!-- Entity Selection -->
        <div class="row">
          <label>Entity *</label>
          <div class="description">Select your climate/thermostat entity</div>
          <select id="entity">
            <option value="">Select entity...</option>
            ${climateEntities.map(e => `
              <option value="${e}" ${this._config.entity === e ? 'selected' : ''}>
                ${this._hass?.states[e]?.attributes?.friendly_name || e}
              </option>
            `).join('')}
          </select>
        </div>

        <!-- Name -->
        <div class="row">
          <label>Name</label>
          <div class="description">Custom display name (optional)</div>
          <input type="text" id="name" value="${this._config.name || ''}" placeholder="Living Room Thermostat">
        </div>

        <!-- Quick Presets -->
        <div class="row">
          <label>Quick Presets</label>
          <div class="description">Comma-separated temperatures (e.g., 19, 20, 22, 24)</div>
          <input type="text" id="quick_presets" 
                 value="${this._config.quick_presets?.join(', ') || ''}" 
                 placeholder="19, 20, 22, 24">
        </div>

        <!-- Display Options -->
        <div class="section">
          <div class="section-title">Display Options</div>
          
          <div class="row checkbox-row">
            <input type="checkbox" id="show_modes" ${this._config.show_modes !== false ? 'checked' : ''}>
            <label for="show_modes">Show HVAC Mode Buttons</label>
          </div>
          
          <div class="row checkbox-row">
            <input type="checkbox" id="show_presets" ${this._config.show_presets !== false ? 'checked' : ''}>
            <label for="show_presets">Show Preset Mode Buttons</label>
          </div>
          
          <div class="row checkbox-row">
            <input type="checkbox" id="show_fan" ${this._config.show_fan !== false ? 'checked' : ''}>
            <label for="show_fan">Show Fan Mode Buttons</label>
          </div>
          
          <div class="row checkbox-row">
            <input type="checkbox" id="locked" ${this._config.locked ? 'checked' : ''}>
            <label for="locked">Lock Controls (Child Lock)</label>
          </div>
        </div>

        <!-- Temperature Settings -->
        <div class="section">
          <div class="section-title">Temperature Settings</div>
          
          <div class="grid">
            <div class="row">
              <label>Min Temperature</label>
              <input type="number" id="min_temp" value="${this._config.min_temp || ''}" placeholder="16">
            </div>
            
            <div class="row">
              <label>Max Temperature</label>
              <input type="number" id="max_temp" value="${this._config.max_temp || ''}" placeholder="30">
            </div>
            
            <div class="row">
              <label>Step</label>
              <input type="number" id="step" step="0.1" value="${this._config.step || ''}" placeholder="0.5">
            </div>
          </div>
        </div>
      </div>
    `;

    // Attach event listeners
    this._root.getElementById('entity')?.addEventListener('change', (e) => {
      this._valueChanged('entity', (e.target as HTMLSelectElement).value);
    });

    this._root.getElementById('name')?.addEventListener('input', (e) => {
      this._valueChanged('name', (e.target as HTMLInputElement).value);
    });

    this._root.getElementById('quick_presets')?.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      const presets = value.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
      this._valueChanged('quick_presets', presets.length ? presets : undefined);
    });

    ['show_modes', 'show_presets', 'show_fan', 'locked'].forEach(id => {
      this._root.getElementById(id)?.addEventListener('change', (e) => {
        this._valueChanged(id, (e.target as HTMLInputElement).checked);
      });
    });

    ['min_temp', 'max_temp', 'step'].forEach(id => {
      this._root.getElementById(id)?.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        this._valueChanged(id, isNaN(value) ? undefined : value);
      });
    });
  }
}

customElements.define('neumorphic-thermostat-ui-editor', NeumorphicThermostatEditor);
