import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Building2, Check } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";

const GeofencingScreen = () => {
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState("head-office");
  const [radius, setRadius] = useState([150]);

  const locations = [
    { id: "head-office", name: "Head Office", address: "123 Tech Park, Sector 5, Mumbai" },
    { id: "branch-office", name: "Branch Office", address: "456 Business Center, Pune" },
  ];

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: `Geofencing radius set to ${radius[0]}m for ${locations.find(l => l.id === selectedLocation)?.name}.`,
    });
  };

  return (
    <AdminLayout>
      <div className="flex flex-col min-h-full pb-20 md:pb-0">
        {/* Header */}
        <div className="px-4 sm:px-6 lg:px-8 pt-6 lg:pt-8 pb-4 border-b border-border">
          <div className="flex items-center gap-4 mb-4">
            <button 
              onClick={() => navigate("/admin/settings")}
              className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors lg:hidden"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-display">Geofencing</h1>
              <p className="text-caption">Set location boundaries</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 space-y-6 overflow-y-auto max-w-3xl">
          {/* Location Selector */}
          <div className="animate-fade-in-up">
            <h2 className="text-overline mb-3">Select Office</h2>
            <div className="space-y-3">
              {locations.map((location) => (
                <button
                  key={location.id}
                  onClick={() => setSelectedLocation(location.id)}
                  className={`w-full card-elevated p-4 flex items-center gap-4 transition-colors ${
                    selectedLocation === location.id ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    selectedLocation === location.id ? "bg-primary text-primary-foreground" : "bg-accent"
                  }`}>
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{location.name}</p>
                    <p className="text-xs text-muted-foreground">{location.address}</p>
                  </div>
                  {selectedLocation === location.id && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Radius Configuration */}
          <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <h2 className="text-overline mb-3">Geofence Radius</h2>
            <div className="card-elevated p-6">
              <div className="text-center mb-6">
                <div className="w-24 h-24 mx-auto bg-accent rounded-full flex items-center justify-center mb-4 relative">
                  <MapPin className="w-8 h-8 text-primary" />
                  <div className="absolute inset-0 border-2 border-primary border-dashed rounded-full animate-pulse" />
                </div>
                <p className="text-4xl font-bold text-primary">{radius[0]}m</p>
                <p className="text-sm text-muted-foreground mt-1">Current radius</p>
              </div>

              <div className="space-y-4">
                <Slider
                  value={radius}
                  onValueChange={setRadius}
                  min={50}
                  max={500}
                  step={10}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>50m</span>
                  <span>500m</span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mt-4 text-center">
                Employees must be within this radius to mark attendance.
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
            <button
              onClick={handleSave}
              className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-medium"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default GeofencingScreen;
