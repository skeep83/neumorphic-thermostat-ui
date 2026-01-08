import { useState } from "react";
import { Flame, Snowflake, Power, Minus, Plus } from "lucide-react";

type ThermostatMode = "heating" | "cooling" | "off";

interface ThermostatCardProps {
  initialTemp?: number;
  currentTemp?: number;
  roomName?: string;
}

const ThermostatCard = ({
  initialTemp = 22,
  currentTemp = 20,
  roomName = "Living Room",
}: ThermostatCardProps) => {
  const [targetTemp, setTargetTemp] = useState(initialTemp);
  const [mode, setMode] = useState<ThermostatMode>("heating");

  const minTemp = 16;
  const maxTemp = 30;

  const increaseTemp = () => {
    if (targetTemp < maxTemp) {
      setTargetTemp((prev) => prev + 0.5);
    }
  };

  const decreaseTemp = () => {
    if (targetTemp > minTemp) {
      setTargetTemp((prev) => prev - 0.5);
    }
  };

  const cycleMode = () => {
    const modes: ThermostatMode[] = ["heating", "cooling", "off"];
    const currentIndex = modes.indexOf(mode);
    setMode(modes[(currentIndex + 1) % modes.length]);
  };

  const getModeColor = () => {
    switch (mode) {
      case "heating":
        return "text-heating";
      case "cooling":
        return "text-cooling";
      default:
        return "text-off-state";
    }
  };

  const getRingClass = () => {
    switch (mode) {
      case "heating":
        return "temp-ring heating-glow";
      case "cooling":
        return "temp-ring-cooling cooling-glow";
      default:
        return "temp-ring-off";
    }
  };

  const getModeIcon = () => {
    switch (mode) {
      case "heating":
        return <Flame className="w-5 h-5" />;
      case "cooling":
        return <Snowflake className="w-5 h-5" />;
      default:
        return <Power className="w-5 h-5" />;
    }
  };

  const getProgress = () => {
    return ((targetTemp - minTemp) / (maxTemp - minTemp)) * 180;
  };

  return (
    <div className="neu-flat rounded-3xl p-8 w-80">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{roomName}</h3>
          <p className="text-sm text-muted-foreground">Thermostat</p>
        </div>
        <button
          onClick={cycleMode}
          className={`neu-button w-12 h-12 rounded-xl flex items-center justify-center ${getModeColor()} transition-colors`}
        >
          {getModeIcon()}
        </button>
      </div>

      {/* Temperature Dial */}
      <div className="relative flex items-center justify-center my-8">
        {/* Outer Ring */}
        <div
          className={`absolute w-56 h-56 rounded-full ${getRingClass()} transition-all duration-500 ${mode !== "off" ? "animate-ring-pulse" : ""}`}
          style={{
            maskImage: `conic-gradient(from 135deg, black 0deg, black ${getProgress()}deg, transparent ${getProgress()}deg)`,
            WebkitMaskImage: `conic-gradient(from 135deg, black 0deg, black ${getProgress()}deg, transparent ${getProgress()}deg)`,
          }}
        />

        {/* Inner Circle */}
        <div className="neu-concave w-48 h-48 rounded-full flex flex-col items-center justify-center relative z-10 overflow-hidden">
          {/* Heating Animation - Neumorphic Style */}
          {mode === "heating" && (
            <>
              {/* Pulsing glow */}
              <div className="absolute inset-0 heat-glow-inner rounded-full" />
              {/* Expanding rings */}
              <div className="absolute inset-4 rounded-full heat-ring-expand" />
              <div className="absolute inset-4 rounded-full heat-ring-expand" style={{ animationDelay: '0.7s' }} />
              <div className="absolute inset-4 rounded-full heat-ring-expand" style={{ animationDelay: '1.4s' }} />
            </>
          )}

          {/* Cooling Animation - Neumorphic Style */}
          {mode === "cooling" && (
            <>
              {/* Pulsing glow */}
              <div className="absolute inset-0 cool-glow-inner rounded-full" />
              {/* Expanding rings */}
              <div className="absolute inset-4 rounded-full cool-ring-expand" />
              <div className="absolute inset-4 rounded-full cool-ring-expand" style={{ animationDelay: '0.8s' }} />
              <div className="absolute inset-4 rounded-full cool-ring-expand" style={{ animationDelay: '1.6s' }} />
            </>
          )}

          {/* Current Temperature */}
          <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1 relative z-10">
            Current
          </span>
          <span className="text-sm text-muted-foreground relative z-10">{currentTemp}°</span>

          {/* Target Temperature */}
          <div className="flex items-baseline mt-2 relative z-10">
            <span className={`text-5xl font-light ${getModeColor()} transition-colors`}>
              {targetTemp}
            </span>
            <span className={`text-2xl ${getModeColor()} transition-colors`}>°C</span>
          </div>

          {/* Mode Label */}
          <span className={`text-xs uppercase tracking-wider mt-2 ${getModeColor()} transition-colors`}>
            {mode === "off" ? "Off" : mode}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-8">
        <button
          onClick={decreaseTemp}
          disabled={targetTemp <= minTemp}
          className="neu-button w-14 h-14 rounded-full flex items-center justify-center text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Minus className="w-6 h-6" />
        </button>

        <div className="neu-pressed w-20 h-10 rounded-xl flex items-center justify-center">
          <span className="text-sm font-medium text-muted-foreground">
            {minTemp}° - {maxTemp}°
          </span>
        </div>

        <button
          onClick={increaseTemp}
          disabled={targetTemp >= maxTemp}
          className="neu-button w-14 h-14 rounded-full flex items-center justify-center text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Status Bar */}
      <div className="mt-8 neu-pressed rounded-xl p-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                mode === "off" ? "bg-muted-foreground" : mode === "heating" ? "bg-heating" : "bg-cooling"
              } ${mode !== "off" ? "animate-pulse-slow" : ""}`}
            />
            <span className="text-muted-foreground">
              {mode === "off"
                ? "System Off"
                : mode === "heating"
                ? "Heating to target"
                : "Cooling to target"}
            </span>
          </div>
          <span className={`font-medium ${getModeColor()}`}>
            {mode !== "off" && targetTemp > currentTemp ? `+${(targetTemp - currentTemp).toFixed(1)}°` : 
             mode !== "off" && targetTemp < currentTemp ? `${(targetTemp - currentTemp).toFixed(1)}°` : "—"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ThermostatCard;
