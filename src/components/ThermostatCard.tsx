import { useState, useEffect, useRef } from "react";
import { Flame, Snowflake, Power, Minus, Plus, Droplets, Fan, Leaf } from "lucide-react";
import { HomeAssistant, LovelaceCardConfig } from "../types/home-assistant";
import { cn } from "@/lib/utils";

type ThermostatMode = "heat" | "cool" | "off" | "heat_cool" | "auto" | "dry" | "fan_only";

interface ThermostatCardProps {
  hass?: HomeAssistant;
  config?: LovelaceCardConfig;
  entityId?: string;
  // Fallback props for dev/demo
  initialTemp?: number;
  currentTemp?: number;
  roomName?: string;
}

const ThermostatCard = ({
  hass,
  config,
  entityId,
  initialTemp = 22,
  currentTemp: propCurrentTemp,
  roomName = "Living Room",
}: ThermostatCardProps) => {
  // --- Data Binding ---
  const entity = hass && entityId ? hass.states[entityId] : undefined;

  // Use entity data or fallbacks with config overrides
  const currentTemp = entity?.attributes.current_temperature ?? propCurrentTemp ?? 21;

  // Config overrides
  const step = config?.step ?? entity?.attributes.target_temp_step ?? 0.5;
  const minTemp = config?.min_temp ?? entity?.attributes.min_temp ?? 16;
  const maxTemp = config?.max_temp ?? entity?.attributes.max_temp ?? 30;
  const showModes = config?.show_modes ?? true;
  const quickPresets = config?.quick_presets as number[] | undefined;
  const extraSensors = config?.sensors as string[] | undefined;
  const unit = config?.unit_override ?? entity?.attributes.unit_of_measurement ?? "°C";

  const targetTemp = entity?.attributes.temperature ?? initialTemp;
  const hvacAction = entity?.attributes.hvac_action; // heating, cooling, idle
  const mode = (entity?.state as ThermostatMode) ?? "off"; // heat, cool, off, etc

  const humidity = entity?.attributes.humidity;
  const friendlyName = config?.name ?? entity?.attributes.friendly_name ?? roomName;

  // Optimistic UI updates
  const [localTargetTemp, setLocalTargetTemp] = useState(targetTemp);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isDragging) {
      setLocalTargetTemp(targetTemp);
    }
  }, [targetTemp, isDragging]);

  // --- Handlers ---

  const handleSetTemp = (newTemp: number) => {
    // Clamp
    const clamped = Math.min(Math.max(newTemp, minTemp), maxTemp);
    const rounded = Math.round(clamped / step) * step;

    setLocalTargetTemp(rounded);

    if (hass && entityId) {
      hass.callService("climate", "set_temperature", {
        entity_id: entityId,
        temperature: rounded,
      });
    }
  };

  const handleModeChange = (newMode: string) => {
    if (hass && entityId) {
      hass.callService("climate", "set_hvac_mode", {
        entity_id: entityId,
        hvac_mode: newMode,
      });
    }
  };

  const togglePower = () => {
    if (mode === "off") {
      handleModeChange("heat"); // Default to heat or last known?
    } else {
      handleModeChange("off");
    }
  };

  // --- Styling Helpers ---
  const getModeColor = () => {
    switch (mode) {
      case "heat": return "text-heating";
      case "cool": return "text-cooling";
      case "fan_only": return "text-primary";
      default: return "text-off-state";
    }
  };

  const getRingClass = () => {
    switch (mode) {
      case "heat": return "temp-ring heating-glow";
      case "cool": return "temp-ring-cooling cooling-glow";
      default: return "temp-ring-off";
    }
  };

  const traverseIcon = () => {
    switch (mode) {
      case "heat": return <Flame className="w-6 h-6" />;
      case "cool": return <Snowflake className="w-6 h-6" />;
      case "fan_only": return <Fan className="w-6 h-6" />;
      case "auto": return <Leaf className="w-6 h-6" />;
      default: return <Power className="w-6 h-6" />;
    }
  };

  // Calculation for arc
  const percentage = Math.min(Math.max((localTargetTemp - minTemp) / (maxTemp - minTemp), 0), 1);
  const degrees = percentage * 270;

  const isActive = mode !== "off";

  return (
    <div className="flex flex-col items-center justify-center p-4 min-h-[380px]">
      <div className={cn(
        "neu-flat rounded-[2rem] p-6 w-full max-w-sm relative overflow-visible transition-all duration-500 ease-in-out",
        isActive ? "opacity-100" : "opacity-95"
      )}>

        {/* Top Bar: Name & Humidity */}
        <div className="flex items-start justify-between mb-2 relative z-10 px-2">
          <div className="flex flex-col">
            <h3 className="text-xl font-extrabold text-foreground tracking-tight leading-none">{friendlyName}</h3>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1 opacity-70">
              {mode === 'off' ? 'OFFLINE' : mode}
              {humidity && ` • ${humidity}% HUM`}
            </span>
          </div>

          {/* Status Indicator Icon (top right) */}
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500",
            "neu-concave"
          )}>
            <div className={cn("transition-colors duration-500", getModeColor())}>
              {hvacAction === 'heating' || hvacAction === 'cooling' ? (
                <div className="animate-pulse">{traverseIcon()}</div>
              ) : (
                traverseIcon()
              )}
            </div>
          </div>
        </div>

        {/* Main Interface */}
        <div className="relative flex flex-col items-center justify-center my-6">

          {/* The Dial */}
          <div className="relative w-64 h-64 flex items-center justify-center">

            {/* Dial Track & Progress */}
            <div className="absolute inset-0 rounded-full transition-all duration-1000 rotate-180"
              style={{
                transform: 'rotate(135deg)',
              }}>
              <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100">
                {/* Track */}
                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" className="text-muted/30 opacity-50" strokeDasharray="200" strokeDashoffset="50" />
                {/* Progress */}
                {isActive && (
                  <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round"
                    className={cn("transition-all duration-500",
                      mode === 'heat' ? 'text-heating' : mode === 'cool' ? 'text-cooling' : 'text-primary'
                    )}
                    strokeDasharray="264"
                    strokeDashoffset={264 - (percentage * 200)} // 200 is approx arc length for 270deg
                    style={{
                      filter: `drop-shadow(0 0 6px currentColor)`
                    }}
                  />
                )}
              </svg>
            </div>

            {/* Center Control (Knob equivalent) */}
            <div className={cn(
              "neu-convex w-44 h-44 rounded-full flex flex-col items-center justify-center relative z-20 shadow-2xl transition-shadow duration-500",
              mode === "heat" ? "shadow-[0_0_40px_-5px_hsl(var(--heating)/0.3)]" :
                mode === "cool" ? "shadow-[0_0_40px_-5px_hsl(var(--cooling)/0.3)]" : ""
            )}>

              {/* Inner concave for depth */}
              <div className="neu-concave w-36 h-36 rounded-full flex flex-col items-center justify-center relative overflow-hidden">

                {/* Current Temperature Display */}
                <div className="flex flex-col items-center relative z-10">
                  <span className="text-[3.5rem] leading-none font-bold text-foreground tracking-tighter">
                    {localTargetTemp}
                  </span>
                  <span className="text-lg font-medium text-muted-foreground mt-1">
                    {currentTemp}{unit} <span className="text-xs opacity-60">INSIDE</span>
                  </span>
                </div>

                {/* Power Button Overlay (if off) */}
                {mode === 'off' && (
                  <button onClick={togglePower} className="absolute inset-0 z-30 flex items-center justify-center bg-background/80 backdrop-blur-sm cursor-pointer transition-all hover:bg-background/60">
                    <Power className="w-12 h-12 text-primary" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Main Controls +/- */}
          {isActive && (
            <div className="absolute bottom-0 w-full flex justify-between px-8 transform translate-y-2">
              <button onClick={() => handleSetTemp(localTargetTemp - step)} className="neu-button w-12 h-12 rounded-full flex items-center justify-center text-foreground active:scale-95 transition-all">
                <Minus className="w-5 h-5" />
              </button>
              <button onClick={() => handleSetTemp(localTargetTemp + step)} className="neu-button w-12 h-12 rounded-full flex items-center justify-center text-foreground active:scale-95 transition-all">
                <Plus className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Quick Actions / Modes */}
        {isActive && (
          <div className="flex flex-col gap-4 mt-4">
            {/* Presets Row */}
            {quickPresets && (
              <div className="flex justify-center gap-3">
                {quickPresets.slice(0, 4).map(preset => (
                  <button
                    key={preset}
                    onClick={() => handleSetTemp(preset)}
                    className={cn(
                      "w-12 h-10 rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center justify-center",
                      localTargetTemp === preset ? "neu-pressed text-primary" : "neu-flat hover:opacity-80"
                    )}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            )}

            {/* Mode Switcher */}
            {showModes && (
              <div className="flex justify-between items-center bg-muted/20 p-1.5 rounded-2xl neu-concave">
                {['heat', 'cool', 'off'].map((m) => {
                  const isSelected = mode === m;
                  return (
                    <button
                      key={m}
                      onClick={() => m === 'off' ? togglePower() : handleModeChange(m)}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-xs font-bold uppercase transition-all duration-300",
                        isSelected
                          ? "neu-flat text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {m}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default ThermostatCard;
