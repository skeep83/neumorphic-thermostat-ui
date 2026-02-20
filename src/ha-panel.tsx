import { StrictMode } from "react";
import { createRoot, Root } from "react-dom/client";
import { HomeAssistant, LovelaceCardConfig } from "./types/home-assistant";
import ThermostatCard from "./components/ThermostatCard";
import styles from "./index.css?inline";

class NeumorphicThermostatCard extends HTMLElement {
    private _root: Root | null = null;
    private _hass: HomeAssistant | null = null;
    private _config: LovelaceCardConfig | null = null;

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
    }

    public setConfig(config: LovelaceCardConfig) {
        if (!config) {
            throw new Error("Invalid configuration");
        }
        // if (!config.entity) {
        //     // Allow rendering without entity for preview/demo purposes
        //     // throw new Error("Please define an entity");
        // }
        this._config = config;
        this._render();
    }

    public set hass(hass: HomeAssistant) {
        this._hass = hass;
        this._render();
    }

    private _render() {
        if (!this._config || !this._hass || !this.shadowRoot) {
            return;
        }

        const entityId = this._config.entity;

        if (!this._root) {
            // Create a container for React
            const container = document.createElement("div");
            container.style.width = "100%";
            container.style.height = "100%";
            this.shadowRoot.appendChild(container);

            const style = document.createElement('style');
            style.textContent = `
        :host {
          display: block;
          position: relative;
          z-index: 0;
          isolation: isolate;
          overflow: hidden;
        }
        ${styles}
      `;
            this.shadowRoot.appendChild(style);

            // HACK: Inspect document.styleSheets and copy rules - potentially heavy.
            // ALTERNATIVE: Don't use Shadow DOM (use Light DOM).
            // Light DOM is easier for styling but leaks global styles.
            // Home Assistant recommends Shadow DOM.
            // Let's stick to Shadow DOM but we might need a way to get the CSS.
            // A common pattern with Vite & Custom Cards is to bundle CSS inside the JS
            // or to have a helper that injects styles.

            this._root = createRoot(container);
        }

        // Pass styling strategy: We might need to manually inject the CSS content
        // if we want full encapsulation. 
        // For this step, I will create a simple mounting point.
        // I will revisit CSS injection after seeing the build output.

        // Check if we need to apply theme
        const isDark = this._hass.themes.darkMode;
        // We can pass this to a context or prop

        this._root.render(
            <StrictMode>
                {/* We need a way to ensure Tailwind works in Shadow DOM. 
            Often requiring a wrapper that has the tailwind classes. */}
                <div className={isDark ? "dark" : ""}>
                    <ThermostatCard
                        hass={this._hass}
                        config={this._config}
                        entityId={entityId}
                    />
                </div>
            </StrictMode>
        );
    }
}

customElements.define("neumorphic-thermostat-ui", NeumorphicThermostatCard);

// Add card to global window for HA to pick up (optional but good for discovery)
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
    type: "neumorphic-thermostat-ui",
    name: "Neumorphic Thermostat",
    description: "A beautiful Neumorphic Thermostat card",
});
