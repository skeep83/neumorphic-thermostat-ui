/**
 * Neumorphic Thermostat UI - Home Assistant Lovelace Custom Card
 * A beautiful neumorphic thermostat card for Home Assistant
 */

// Include the editor
import './neumorphic-thermostat-ui-editor';

interface CardConfig {
  entity: string;
  name?: string;
  icon?: string;
  quick_presets?: number[];
  sensors?: string[];
  show_modes?: boolean;
  show_presets?: boolean;
  show_fan?: boolean;
  locked?: boolean;
  step?: number;
  min_temp?: number;
  max_temp?: number;
  unit_override?: string;
}

interface HassEntity {
  state: string;
  attributes: {
    current_temperature?: number;
    temperature?: number;
    target_temp_low?: number;
    target_temp_high?: number;
    hvac_modes?: string[];
    hvac_action?: string;
    preset_mode?: string;
    preset_modes?: string[];
    fan_mode?: string;
    fan_modes?: string[];
    min_temp?: number;
    max_temp?: number;
    target_temp_step?: number;
    unit_of_measurement?: string;
    friendly_name?: string;
  };
  entity_id: string;
}

interface Hass {
  states: Record<string, HassEntity>;
  callService: (domain: string, service: string, data: Record<string, unknown>) => Promise<void>;
  config: {
    unit_system: {
      temperature: string;
    };
  };
}

// Temperature history buffer for trend calculation
interface TempRecord {
  temp: number;
  timestamp: number;
}

class NeumorphicThermostatCard extends HTMLElement {
  private _config!: CardConfig;
  private _hass!: Hass;
  private _tempHistory: TempRecord[] = [];
  private _lastServiceCall: number = 0;
  private _debounceTimeout: ReturnType<typeof setTimeout> | null = null;
  private _root!: ShadowRoot;

  constructor() {
    super();
    this._root = this.attachShadow({ mode: 'open' });
  }

  static getConfigElement() {
    return document.createElement('neumorphic-thermostat-ui-editor');
  }

  static getStubConfig() {
    return {
      entity: 'climate.thermostat',
      quick_presets: [19, 20, 22, 24],
    };
  }

  setConfig(config: CardConfig) {
    if (!config.entity) {
      throw new Error('Please define an entity');
    }
    this._config = {
      show_modes: true,
      show_presets: true,
      show_fan: true,
      locked: false,
      step: 0.5,
      ...config,
    };
    this._render();
  }

  set hass(hass: Hass) {
    const oldHass = this._hass;
    this._hass = hass;

    // Update temperature history for trend
    const entity = hass.states[this._config.entity];
    if (entity?.attributes?.current_temperature !== undefined) {
      const currentTemp = entity.attributes.current_temperature;
      const now = Date.now();
      
      // Add new record
      this._tempHistory.push({ temp: currentTemp, timestamp: now });
      
      // Keep only last 30 minutes of data
      const thirtyMinutesAgo = now - 30 * 60 * 1000;
      this._tempHistory = this._tempHistory.filter(r => r.timestamp > thirtyMinutesAgo);
    }

    // Only re-render if entity state changed
    if (!oldHass || 
        oldHass.states[this._config.entity] !== hass.states[this._config.entity] ||
        this._config.sensors?.some(s => oldHass.states[s] !== hass.states[s])) {
      this._render();
    }
  }

  getCardSize() {
    return 4;
  }

  private _getStyles(): string {
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
        width: 100%;
        box-sizing: border-box;
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
        font-size: 20px;
        font-weight: 600;
        color: var(--text-primary);
        line-height: 1.3;
      }

      .header-left p {
        margin: 4px 0 0;
        font-size: 14px;
        color: var(--text-secondary);
        line-height: 1.3;
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
        transition: all 0.15s ease;
        color: var(--off-color);
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
        user-select: none;
      }

      .mode-button:active {
        box-shadow: 
          inset 2px 2px 4px var(--shadow-dark),
          inset -2px -2px 4px var(--shadow-light);
        transform: scale(0.95);
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
        margin: 24px auto;
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
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: var(--text-secondary);
        margin-bottom: 4px;
        position: relative;
        z-index: 10;
        font-weight: 500;
      }

      .current-temp {
        font-size: 16px;
        color: var(--text-primary);
        position: relative;
        z-index: 10;
        font-weight: 500;
      }

      .target-temp {
        display: flex;
        align-items: baseline;
        margin-top: 8px;
        position: relative;
        z-index: 10;
      }

      .target-temp .value {
        font-size: 52px;
        font-weight: 400;
        transition: color 0.3s ease;
        line-height: 1;
      }

      .target-temp .unit {
        font-size: 26px;
        margin-left: 4px;
        transition: color 0.3s ease;
        font-weight: 400;
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
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-top: 6px;
        position: relative;
        z-index: 10;
        transition: color 0.3s ease;
        font-weight: 600;
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
        transition: all 0.15s ease;
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
        user-select: none;
      }

      .control-button:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .control-button:active:not(:disabled) {
        box-shadow: 
          inset 2px 2px 4px var(--shadow-dark),
          inset -2px -2px 4px var(--shadow-light);
        transform: scale(0.95);
      }

      .control-button svg {
        width: 24px;
        height: 24px;
        pointer-events: none;
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
        font-size: 14px;
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

  private _getTemperatureUnit(): string {
    if (this._config.unit_override) return this._config.unit_override;
    const entity = this._hass?.states[this._config.entity];
    return entity?.attributes?.unit_of_measurement ||
           this._hass?.config?.unit_system?.temperature || '°C';
  }

  private _getStep(): number {
    if (this._config.step) return this._config.step;
    const entity = this._hass?.states[this._config.entity];
    return entity?.attributes?.target_temp_step || 0.5;
  }

  private _getMinTemp(): number {
    if (this._config.min_temp !== undefined) return this._config.min_temp;
    const entity = this._hass?.states[this._config.entity];
    return entity?.attributes?.min_temp ?? 16;
  }

  private _getMaxTemp(): number {
    if (this._config.max_temp !== undefined) return this._config.max_temp;
    const entity = this._hass?.states[this._config.entity];
    return entity?.attributes?.max_temp ?? 30;
  }

  private _getTrend(): 'rising' | 'falling' | 'stable' {
    if (this._tempHistory.length < 2) return 'stable';
    
    const recent = this._tempHistory.slice(-5);
    if (recent.length < 2) return 'stable';
    
    const first = recent[0].temp;
    const last = recent[recent.length - 1].temp;
    const diff = last - first;
    
    if (diff > 0.3) return 'rising';
    if (diff < -0.3) return 'falling';
    return 'stable';
  }

  private _getStatusText(hvacMode: string, hvacAction: string | undefined, currentTemp: number, targetTemp: number): string {
    if (hvacMode === 'off') return 'Система выключена';
    
    if (hvacAction) {
      switch (hvacAction) {
        case 'heating': return 'Нагреваем';
        case 'cooling': return 'Охлаждаем';
        case 'idle': return 'Поддерживаем';
        case 'drying': return 'Осушаем';
        case 'fan': return 'Вентиляция';
        default: return hvacAction;
      }
    }

    const diff = targetTemp - currentTemp;
    if (Math.abs(diff) < 0.5) return 'Температура достигнута';
    if (diff > 0) return 'Нагреваем до цели';
    return 'Охлаждаем до цели';
  }

  private _callService(domain: string, service: string, data: Record<string, unknown>) {
    const now = Date.now();
    
    // Anti-flicker: debounce rapid calls (reduced to 300ms for better responsiveness)
    if (now - this._lastServiceCall < 300) {
      if (this._debounceTimeout) {
        clearTimeout(this._debounceTimeout);
      }
      this._debounceTimeout = setTimeout(() => {
        this._hass.callService(domain, service, data);
        this._lastServiceCall = Date.now();
      }, 200);
      return;
    }

    this._hass.callService(domain, service, data);
    this._lastServiceCall = now;
  }

  private _handleTempChange(delta: number) {
    if (this._config.locked) return;
    
    const entity = this._hass.states[this._config.entity];
    if (!entity) return;

    const currentTarget = entity.attributes.temperature ?? 20;
    const newTemp = Math.max(
      this._getMinTemp(),
      Math.min(this._getMaxTemp(), currentTarget + delta)
    );

    this._callService('climate', 'set_temperature', {
      entity_id: this._config.entity,
      temperature: newTemp,
    });
  }

  private _handleModeChange(mode: string) {
    if (this._config.locked) return;
    
    this._callService('climate', 'set_hvac_mode', {
      entity_id: this._config.entity,
      hvac_mode: mode,
    });
  }

  private _handlePresetChange(preset: string) {
    if (this._config.locked) return;
    
    this._callService('climate', 'set_preset_mode', {
      entity_id: this._config.entity,
      preset_mode: preset,
    });
  }

  private _handleFanModeChange(fanMode: string) {
    if (this._config.locked) return;
    
    this._callService('climate', 'set_fan_mode', {
      entity_id: this._config.entity,
      fan_mode: fanMode,
    });
  }

  private _handleQuickPreset(temp: number) {
    if (this._config.locked) return;
    
    this._callService('climate', 'set_temperature', {
      entity_id: this._config.entity,
      temperature: temp,
    });
  }

  private _handleMoreInfo() {
    const event = new CustomEvent('hass-more-info', {
      bubbles: true,
      composed: true,
      detail: { entityId: this._config.entity },
    });
    this.dispatchEvent(event);
  }

  private _getModeIcon(mode: string): string {
    const icons: Record<string, string> = {
      heat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 12c0-3 2.5-6 2.5-6S17 9 17 12a5 5 0 1 1-10 0c0-3 2.5-6 2.5-6S12 9 12 12Z"/></svg>',
      cool: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h20M12 2v20m5.66-14.66-3.54 3.54m3.54 7.78-3.54-3.54M6.34 6.34l3.54 3.54m-3.54 7.78 3.54-3.54"/></svg>',
      heat_cool: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2v20M2 12h20"/></svg>',
      auto: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/><path d="m12 12 4 2"/></svg>',
      dry: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v6m0 12v2M4.93 4.93l4.24 4.24m5.66 5.66 4.24 4.24M2 12h6m12 0h2M4.93 19.07l4.24-4.24m5.66-5.66 4.24-4.24"/></svg>',
      fan_only: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 12c-3.5 0-6-2-6-5s3.5-5 6-5 6 2 6 5-2.5 5-6 5Z"/><path d="M12 12c0 3.5 2 6 5 6s5-3.5 5-6-2-6-5-6-5 2.5-5 6Z"/><path d="M12 12c3.5 0 6 2 6 5s-3.5 5-6 5-6-2-6-5 2.5-5 6-5Z"/><path d="M12 12c0-3.5-2-6-5-6S2 9.5 2 12s2 6 5 6 5-2.5 5-6Z"/><circle cx="12" cy="12" r="2"/></svg>',
      off: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10"/></svg>',
    };
    return icons[mode] || icons.off;
  }

  private _render() {
    if (!this._hass || !this._config) return;

    const entity = this._hass.states[this._config.entity];
    
    // Handle unavailable entity
    if (!entity) {
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

    const currentTemp = entity.attributes.current_temperature;
    const targetTemp = entity.attributes.temperature;
    const hvacMode = entity.state;
    const hvacAction = entity.attributes.hvac_action;
    const hvacModes = entity.attributes.hvac_modes || [];
    const presetMode = entity.attributes.preset_mode;
    const presetModes = entity.attributes.preset_modes || [];
    const fanMode = entity.attributes.fan_mode;
    const fanModes = entity.attributes.fan_modes || [];
    const unit = this._getTemperatureUnit();
    const step = this._getStep();
    const minTemp = this._getMinTemp();
    const maxTemp = this._getMaxTemp();
    const name = this._config.name || entity.attributes.friendly_name || 'Термостат';
    const trend = this._getTrend();

    // Determine effective mode for styling
    const effectiveMode = hvacMode === 'off' ? 'off' : 
                         (hvacMode === 'cool' ? 'cooling' : 'heating');

    // Calculate progress for dial
    const progress = targetTemp !== undefined 
      ? ((targetTemp - minTemp) / (maxTemp - minTemp)) * 180 
      : 0;

    // Temperature difference
    const tempDiff = targetTemp !== undefined && currentTemp !== undefined
      ? targetTemp - currentTemp
      : null;

    // Status text
    const statusText = currentTemp !== undefined && targetTemp !== undefined
      ? this._getStatusText(hvacMode, hvacAction, currentTemp, targetTemp)
      : 'Нет данных температуры';

    // Action badge
    const actionBadge = hvacAction && hvacAction !== 'off' && hvacAction !== 'idle'
      ? `<div class="action-badge ${hvacAction}">${hvacAction === 'heating' ? '🔥' : '❄️'} ${hvacAction}</div>`
      : '';

    // Quick presets
    const quickPresetsHtml = this._config.quick_presets?.length
      ? `<div class="quick-presets">
          ${this._config.quick_presets.map(t => `
            <button class="preset-chip ${targetTemp === t ? 'active' : ''}" 
                    data-temp="${t}">${t}°</button>
          `).join('')}
        </div>`
      : '';

    // HVAC modes
    const hvacModesHtml = this._config.show_modes && hvacModes.length > 0
      ? `<div class="hvac-modes">
          ${hvacModes.map(mode => `
            <button class="hvac-mode-button ${hvacMode === mode ? 'active' : ''} ${mode}" 
                    data-mode="${mode}">
              ${this._getModeIcon(mode)}
              ${mode === 'heat_cool' ? 'авто' : mode}
            </button>
          `).join('')}
        </div>`
      : '';

    // Preset modes
    const presetModesHtml = this._config.show_presets && presetModes.length > 0
      ? `<div class="preset-modes">
          ${presetModes.map(preset => `
            <button class="preset-mode-button ${presetMode === preset ? 'active' : ''}" 
                    data-preset="${preset}">${preset}</button>
          `).join('')}
        </div>`
      : '';

    // Fan modes
    const fanModesHtml = this._config.show_fan && fanModes.length > 0
      ? `<div class="fan-modes">
          ${fanModes.map(fm => `
            <button class="fan-mode-button ${fanMode === fm ? 'active' : ''}" 
                    data-fan="${fm}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 12c-3.5 0-6-2-6-5s3.5-5 6-5 6 2 6 5-2.5 5-6 5Z"/>
                <circle cx="12" cy="12" r="2"/>
              </svg>
              ${fm}
            </button>
          `).join('')}
        </div>`
      : '';

    // Sensors
    const sensorsHtml = this._config.sensors?.length
      ? `<div class="sensors-grid">
          ${this._config.sensors.slice(0, 4).map(sensorId => {
            const sensor = this._hass.states[sensorId];
            if (!sensor) return '';
            return `
              <div class="sensor-item">
                <div class="sensor-value">${sensor.state}${sensor.attributes.unit_of_measurement || ''}</div>
                <div class="sensor-label">${sensor.attributes.friendly_name || sensorId.split('.').pop()}</div>
              </div>
            `;
          }).join('')}
        </div>`
      : '';

    // Trend indicator
    const trendHtml = trend !== 'stable'
      ? `<span class="trend-indicator ${trend}">
          ${trend === 'rising' 
            ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m18 15-6-6-6 6"/></svg>'
            : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>'}
        </span>`
      : '';

    // Locked overlay
    const lockedHtml = this._config.locked
      ? `<div class="locked-overlay">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>`
      : '';

    // Dial animations
    const dialAnimationsHtml = effectiveMode !== 'off' ? `
      <div class="glow-inner ${effectiveMode}"></div>
      <div class="ring-expand ${effectiveMode}"></div>
      <div class="ring-expand ${effectiveMode}" style="animation-delay: 0.7s"></div>
      <div class="ring-expand ${effectiveMode}" style="animation-delay: 1.4s"></div>
    ` : '';

    // Handle no temperature support
    if (targetTemp === undefined) {
      this._root.innerHTML = `
        <style>${this._getStyles()}</style>
        <div class="card">
          <div class="header">
            <div class="header-left">
              <h3>${name}</h3>
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
          ${hvacModesHtml}
        </div>
      `;
      this._attachEventListeners();
      return;
    }

    this._root.innerHTML = `
      <style>${this._getStyles()}</style>
      <div class="card-wrapper">
        ${lockedHtml}
        ${actionBadge}
        <div class="card ${this._config.locked ? 'locked' : ''}">
          <!-- Header -->
          <div class="header">
            <div class="header-left">
              <h3>${name}</h3>
              <p>Термостат</p>
            </div>
            <button class="mode-button ${effectiveMode}" data-action="cycle-mode">
              ${effectiveMode === 'heating' 
                ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 12c0-3 2.5-6 2.5-6S17 9 17 12a5 5 0 1 1-10 0c0-3 2.5-6 2.5-6S12 9 12 12Z"/></svg>'
                : effectiveMode === 'cooling'
                ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h20M12 2v20m5.66-14.66-3.54 3.54m3.54 7.78-3.54-3.54M6.34 6.34l3.54 3.54m-3.54 7.78 3.54-3.54"/></svg>'
                : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10"/></svg>'}
            </button>
          </div>

          <!-- Temperature Dial -->
          <div class="dial-container">
            <div class="dial-ring ${effectiveMode}" style="--progress: ${progress}deg"></div>
            <div class="dial-inner">
              ${dialAnimationsHtml}
              <span class="current-label">Текущая</span>
              <span class="current-temp">${currentTemp !== undefined ? `${currentTemp}°` : '—'}</span>
              <div class="target-temp ${effectiveMode}">
                <span class="value">${targetTemp}</span>
                <span class="unit">${unit}</span>
              </div>
              <span class="mode-label ${effectiveMode}">
                ${hvacMode === 'off' ? 'Выкл' : hvacMode}
              </span>
            </div>
          </div>

          <!-- Controls -->
          <div class="controls">
            <button class="control-button" data-action="decrease" ${targetTemp <= minTemp ? 'disabled' : ''}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14"/>
              </svg>
            </button>
            <div class="range-display">
              <span>${minTemp}° - ${maxTemp}°</span>
            </div>
            <button class="control-button" data-action="increase" ${targetTemp >= maxTemp ? 'disabled' : ''}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14m-7-7h14"/>
              </svg>
            </button>
          </div>

          ${quickPresetsHtml}
          ${hvacModesHtml}
          ${presetModesHtml}
          ${fanModesHtml}

          <!-- Status Bar -->
          <div class="status-bar">
            <div class="status-row">
              <div class="status-left">
                <div class="status-dot ${hvacAction || (hvacMode === 'off' ? '' : 'idle')}"></div>
                <span class="status-text">${statusText}</span>
                ${trendHtml}
              </div>
              <span class="status-diff ${effectiveMode}">
                ${tempDiff !== null && hvacMode !== 'off'
                  ? (tempDiff > 0 ? `+${tempDiff.toFixed(1)}°` : tempDiff < 0 ? `${tempDiff.toFixed(1)}°` : '✓')
                  : '—'}
              </span>
            </div>
          </div>

          ${sensorsHtml}
        </div>
      </div>
    `;

    this._attachEventListeners();
  }

  private _attachEventListeners() {
    // Temperature controls
    this._root.querySelector('[data-action="increase"]')?.addEventListener('click', () => {
      this._handleTempChange(this._getStep());
    });

    this._root.querySelector('[data-action="decrease"]')?.addEventListener('click', () => {
      this._handleTempChange(-this._getStep());
    });

    // Mode cycle button
    this._root.querySelector('[data-action="cycle-mode"]')?.addEventListener('click', () => {
      const entity = this._hass.states[this._config.entity];
      if (!entity) return;
      
      const modes = entity.attributes.hvac_modes || [];
      const currentIndex = modes.indexOf(entity.state);
      const nextMode = modes[(currentIndex + 1) % modes.length];
      this._handleModeChange(nextMode);
    });

    // Long press for more-info
    let pressTimer: ReturnType<typeof setTimeout>;
    const dial = this._root.querySelector('.dial-container');
    dial?.addEventListener('mousedown', () => {
      pressTimer = setTimeout(() => this._handleMoreInfo(), 500);
    });
    dial?.addEventListener('mouseup', () => clearTimeout(pressTimer));
    dial?.addEventListener('mouseleave', () => clearTimeout(pressTimer));
    dial?.addEventListener('touchstart', () => {
      pressTimer = setTimeout(() => this._handleMoreInfo(), 500);
    });
    dial?.addEventListener('touchend', () => clearTimeout(pressTimer));

    // Quick presets
    this._root.querySelectorAll('.preset-chip').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const temp = parseFloat((e.currentTarget as HTMLElement).dataset.temp || '20');
        this._handleQuickPreset(temp);
      });
    });

    // HVAC modes
    this._root.querySelectorAll('.hvac-mode-button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = (e.currentTarget as HTMLElement).dataset.mode || 'off';
        this._handleModeChange(mode);
      });
    });

    // Preset modes
    this._root.querySelectorAll('.preset-mode-button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const preset = (e.currentTarget as HTMLElement).dataset.preset || '';
        this._handlePresetChange(preset);
      });
    });

    // Fan modes
    this._root.querySelectorAll('.fan-mode-button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const fm = (e.currentTarget as HTMLElement).dataset.fan || '';
        this._handleFanModeChange(fm);
      });
    });
  }
}

// Register the custom element
customElements.define('neumorphic-thermostat-ui', NeumorphicThermostatCard);

// Register with HACS/HA custom cards
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'neumorphic-thermostat-ui',
  name: 'Neumorphic Thermostat UI',
  description: 'A beautiful neumorphic thermostat card for Home Assistant with advanced climate control features.',
  preview: true,
  documentationURL: 'https://github.com/YOUR_USERNAME/neumorphic-thermostat-ui',
});

console.info(
  '%c NEUMORPHIC-THERMOSTAT-UI %c v1.0.0 ',
  'color: white; background: #ff6b35; font-weight: bold;',
  'color: #ff6b35; background: white; font-weight: bold;'
);
