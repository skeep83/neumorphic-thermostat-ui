# Neumorphic Thermostat UI

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/integration)
[![GitHub Release](https://img.shields.io/github/release/YOUR_USERNAME/neumorphic-thermostat-ui.svg)](https://github.com/YOUR_USERNAME/neumorphic-thermostat-ui/releases)

A beautiful neumorphic thermostat card for Home Assistant with advanced climate control features.

![Preview](https://via.placeholder.com/400x500/e8e8e8/333333?text=Neumorphic+Thermostat)

## ✨ Features

- 🎨 **Neumorphic Design** — Soft UI with realistic shadows
- 🌡️ **Full Climate Control** — Temperature, HVAC modes, presets, fan
- ⚡ **Quick Presets** — One-tap temperature buttons
- 📊 **Trend Tracking** — Temperature direction indicator
- 📱 **External Sensors** — Display power, humidity, etc.
- 🔒 **Child Lock** — Lock controls to prevent changes
- 🛡️ **Anti-flicker** — Debounced service calls

## 📦 Installation

### HACS (Recommended)

1. Open HACS → **Frontend**
2. Click ⋮ → **Custom repositories**
3. Add: `https://github.com/YOUR_USERNAME/neumorphic-thermostat-ui`
4. Category: **Dashboard**
5. Find "Neumorphic Thermostat UI" → **Download**
6. Restart Home Assistant

### Manual

1. Download `neumorphic-thermostat-ui.js` from [Releases](https://github.com/YOUR_USERNAME/neumorphic-thermostat-ui/releases)
2. Copy to `config/www/neumorphic-thermostat-ui.js`
3. Add resource: `/local/neumorphic-thermostat-ui.js` (JavaScript Module)

## ⚙️ Configuration

### Basic

```yaml
type: custom:neumorphic-thermostat-ui
entity: climate.living_room
```

### Full Options

```yaml
type: custom:neumorphic-thermostat-ui
entity: climate.living_room
name: Living Room                    # Custom name
quick_presets: [19, 20, 22, 24]      # Quick temperature buttons
sensors:                             # Additional sensors (max 4)
  - sensor.humidity
  - sensor.heating_power
show_modes: true                     # Show HVAC mode buttons
show_presets: true                   # Show preset modes (eco, comfort)
show_fan: true                       # Show fan mode buttons
locked: false                        # Lock all controls
step: 0.5                            # Temperature step
min_temp: 16                         # Minimum temperature
max_temp: 30                         # Maximum temperature
unit_override: "°C"                  # Override unit display
```

### Options Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `entity` | string | **required** | Climate entity ID |
| `name` | string | entity name | Display name |
| `quick_presets` | number[] | — | Quick preset temperatures |
| `sensors` | string[] | — | Sensor entity IDs (max 4) |
| `show_modes` | boolean | true | Show HVAC modes |
| `show_presets` | boolean | true | Show preset modes |
| `show_fan` | boolean | true | Show fan modes |
| `locked` | boolean | false | Child lock |
| `step` | number | 0.5 | Temp adjustment step |
| `min_temp` | number | entity | Min temperature |
| `max_temp` | number | entity | Max temperature |

## 🔧 Build from Source

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/neumorphic-thermostat-ui.git
cd neumorphic-thermostat-ui

# Install dependencies
npm install

# Build for Home Assistant
npm run build:ha

# Output: dist/neumorphic-thermostat-ui.js
```

### Required package.json script

Add to your `package.json` scripts:

```json
{
  "scripts": {
    "build:ha": "vite build --config vite.config.ha.ts"
  }
}
```

## 📁 Project Structure

```
├── hacs.json                    # HACS configuration
├── vite.config.ha.ts            # HA card build config
├── src/
│   └── ha-card/
│       └── neumorphic-thermostat-ui.ts  # Card source
├── dist/
│   └── neumorphic-thermostat-ui.js      # Built card (after build)
└── .github/
    └── workflows/
        ├── build.yml            # CI build check
        └── release.yml          # Auto-release on tag
```

## 🚀 Release Process

1. Update version in card source
2. Commit changes
3. Create tag: `git tag v1.0.0`
4. Push: `git push origin v1.0.0`
5. GitHub Actions will build and create release

## 📄 License

MIT License
