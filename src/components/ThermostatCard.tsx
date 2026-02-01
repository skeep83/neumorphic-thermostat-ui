import { useState, useEffect, useRef, MouseEvent, TouchEvent } from "react";
import { Flame, Snowflake, Power, Minus, Plus, Droplets, Fan } from "lucide-react";
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

  // Use entity data or fallbacks
  const currentTemp = entity?.attributes.current_temperature ?? propCurrentTemp ?? 20;
  const targetTemp = entity?.attributes.temperature ?? initialTemp;
  const hvacAction = entity?.attributes.hvac_action; // heating, cooling, idle
  const mode = (entity?.state as ThermostatMode) ?? "heat"; // heat, cool, off, etc

  const minTemp = entity?.attributes.min_temp ?? 16;
  const maxTemp = entity?.attributes.max_temp ?? 30;
  const step = entity?.attributes.target_temp_step ?? 0.5;

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
      // Debounced call could be better, but direct call is okay for now if not dragging too fast
      hass.callService("climate", "set_temperature", {
        entity_id: entityId,
        temperature: rounded,
      });
    }
  };

  const handleModeChange = () => {
    // Simple cycle logic: off -> heat -> cool -> off
    // Or based on available modes
    const availableModes = entity?.attributes.hvac_modes ?? ["off", "heat", "cool"];
    const currentIndex = availableModes.indexOf(mode);
    const nextMode = availableModes[(currentIndex + 1) % availableModes.length];

    if (hass && entityId) {
      hass.callService("climate", "set_hvac_mode", {
        entity_id: entityId,
        hvac_mode: nextMode,
      });
    }
  };

  // --- Interaction (Dial Drag) ---
  const dialRef = useRef<HTMLDivElement>(null);

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
      case "heat": return <Flame className="w-5 h-5" />;
      case "cool": return <Snowflake className="w-5 h-5" />;
      case "fan_only": return <Fan className="w-5 h-5" />;
      default: return <Power className="w-5 h-5" />;
    }
  };

  const percentage = Math.min(Math.max((localTargetTemp - minTemp) / (maxTemp - minTemp), 0), 1);
  const degrees = percentage * 270; // 270 degree arc

  return (
    <div className="flex items-center justify-center p-4">
      <div className="neu-flat rounded-[3rem] p-8 w-[22rem] relative overflow-hidden transition-all duration-300">

        {/* Background Status Glow (Subtle) */}
        <div className={cn(
          "absolute inset-0 opacity-10 pointer-events-none transition-colors duration-1000",
          mode === "heat" ? "bg-heating" : mode === "cool" ? "bg-cooling" : "bg-transparent"
        )} />

        {/* Header */}
        <div className="flex items-center justify-between mb-8 relative z-10">
          <div>
            <h3 className="text-xl font-bold text-foreground/80 tracking-tight">{friendlyName}</h3>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <span>{mode === "off" ? "System Off" : mode.toUpperCase()}</span>
              {humidity && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Droplets className="w-3 h-3" />
                    <span>{humidity}%</span>
                  </div>
                </>
              )}
            </div>
          </div>
          <button
            onClick={handleModeChange}
            className={cn(
              "neu-button w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 active:scale-95",
              getModeColor()
            )}
          >
            {traverseIcon()}
          </button>
        </div>

        {/* Main Dial Area */}
        <div
          ref={dialRef}
          className="relative flex items-center justify-center my-10"
        >
          {/* Outer Ring Main Container */}
          <div className="relative w-64 h-64 flex items-center justify-center">

            {/* The Ring Gradient/Mask */}
            <div
              className={cn(
                "absolute inset-0 rounded-full transition-all duration-1000",
                getRingClass(),
                mode !== "off" && "opacity-100",
                mode === "off" && "opacity-50 grayscale"
              )}
              style={{
                // Mask to create the arc (270deg starting from -225deg or similar)
                // We use a conic gradient mask.
                // Solid part is the "track".
                maskImage: `conic-gradient(from 135deg, black 0deg, black ${degrees}deg, transparent ${degrees}deg, transparent 270deg, black 270deg)`,
                WebkitMaskImage: `conic-gradient(from 135deg, black 1deg, black ${degrees}deg, transparent ${degrees}deg)`,
                // Fix: simple conic mask for progress
              }}
            />

            {/* Background Track (Gray Ring) */}
            <div className="absolute inset-0 rounded-full border-[20px] border-muted/20"
              style={{
                maskImage: 'conic-gradient(from 135deg, transparent 0deg, transparent 270deg, transparent 270deg)',
                // Actually we want a full ring but cut at bottom.
                clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 50%, 0 100%)', // Rough cut
                // Better: SVG based ring later? Using CSS only for now.
              }}
            />

            {/* Inner Content - Floating in middle */}
            <div className="neu-concave w-48 h-48 rounded-full flex flex-col items-center justify-center relative z-10 overflow-hidden shadow-inner">
              {/* Glass Overlay */}
              <div className="absolute inset-0 glass-panel opacity-30 rounded-full pointer-events-none" />

              {/* Current Temp Indicator (Small) */}
              <div className="flex flex-col items-center mb-1 z-20">
                <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Current</span>
                <span className="text-lg font-medium text-foreground/70">{currentTemp}°</span>
              </div>

              {/* Target Temp (Big) */}
              <div className="relative z-20 flex items-start">
                <span className={cn(
                  "text-6xl font-light tracking-tighter transition-colors duration-300",
                  getModeColor()
                )}>
                  {localTargetTemp}
                </span>
                <span className={cn("text-3xl mt-1 font-light", getModeColor())}>°</span>
              </div>

              {/* Status Text (Heating/Cooling) */}
              <div className="mt-2 h-6 flex items-center justify-center relative z-20">
                {hvacAction === "heating" && <span className="text-xs font-bold text-heating animate-pulse">HEATING</span>}
                {hvacAction === "cooling" && <span className="text-xs font-bold text-cooling animate-pulse">COOLING</span>}
                {hvacAction === "idle" && <span className="text-xs font-bold text-muted-foreground">IDLE</span>}
              </div>

              {/* Animation Particles */}
              {(mode === "heat" || mode === "cool") && mode !== "off" && (
                <div className="absolute inset-0 pointer-events-none opacity-20">
                  <div className={cn("absolute inset-0 rounded-full", mode === "heat" ? "animate-ping bg-heating" : "animate-ping bg-cooling")} style={{ animationDuration: '3s' }} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-6 px-4">
          <button
            onClick={() => handleSetTemp(localTargetTemp - step)}
            className="neu-button w-14 h-14 rounded-full flex items-center justify-center text-foreground hover:scale-105 active:scale-95 transition-all"
            disabled={mode === "off"}
          >
            <Minus className="w-6 h-6" />
          </button>

          <div className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Target</span>
            <div className="neu-pressed px-4 py-1 rounded-lg">
              <span className="text-sm font-semibold text-foreground">{minTemp}° — {maxTemp}°</span>
            </div>
          </div>

          <button
            onClick={() => handleSetTemp(localTargetTemp + step)}
            className="neu-button w-14 h-14 rounded-full flex items-center justify-center text-foreground hover:scale-105 active:scale-95 transition-all"
            disabled={mode === "off"}
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default ThermostatCard;
