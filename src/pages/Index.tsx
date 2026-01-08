import ThermostatCard from "@/components/ThermostatCard";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-8">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Home Assistant
          </h1>
          <p className="text-muted-foreground text-sm">
            Neumorphic Thermostat Control
          </p>
        </div>
        
        <ThermostatCard 
          roomName="Living Room"
          initialTemp={22}
          currentTemp={20}
        />
      </div>
    </div>
  );
};

export default Index;
