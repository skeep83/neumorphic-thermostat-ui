import { StrictMode } from "react";
import { createRoot, Root } from "react-dom/client";
import { HomeAssistant, LovelaceCardConfig } from "./types/home-assistant";
import ThermostatCard from "./components/ThermostatCard";
import "./index.css";

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
        if (!config.entity) {
            throw new Error("Please define an entity");
        }
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

            // Inject styles manually because Shadow DOM blocks global styles
            // We need to fetch the styles from the built CSS file or inject them differently.
            // For a single-file build, we can try to inject the index.css content if we inline it,
            // but Vite usually extracts it.
            // A common trick is to construct a style tag.
            // For now, let's rely on the build process to potentially inline css or we add a link.
            // BETTER APPROACH: Use `insert-css` or similar if needed, OR relies on the fact that
            // we are using Tailwind and it might need to be scoped.
            // For this implementation, we will try to copy the styles from the document head if available,
            // or rely on a <style> tag if we can get the CSS content.
            // Since we import "./index.css", Vite might inject it into the document head.
            // We need to move it to shadow root.

            const style = document.createElement('style');
            style.textContent = `
        :host {
          display: block;
        }
        /* Import tailwind base/components/utilities - it requires a build step that extracts CSS to string */
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

customElements.define("neumorphic-thermostat-card", NeumorphicThermostatCard);

// Add card to global window for HA to pick up (optional but good for discovery)
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
    type: "neumorphic-thermostat-card",
    name: "Neumorphic Thermostat",
    description: "A beautiful Neumorphic Thermostat card",
});
