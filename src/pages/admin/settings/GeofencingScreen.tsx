import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Building2, Check } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";
import { officeService } from "@server";
import type { Office } from "@server/types/office";

const GeofencingScreen = () => {
  const navigate = useNavigate();
  const [offices, setOffices] = useState<Office[]>([]);
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>("");
  const [radius, setRadius] = useState([100]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchOffices();
  }, []);

  const fetchOffices = async () => {
    setLoading(true);
    const { offices: fetchedOffices, error } = await officeService.getAllOffices();
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load offices",
        variant: "destructive",
      });
    } else {
      const activeOffices = fetchedOffices.filter(o => o.is_active);
      setOffices(activeOffices);
      
      // Select first office by default
      if (activeOffices.length > 0) {
        setSelectedOfficeId(activeOffices[0].id);
        setRadius([activeOffices[0].radius_in_meters || 100]);
      }
    }
    
    setLoading(false);
  };

  const handleOfficeChange = (officeId: string) => {
    setSelectedOfficeId(officeId);
    const office = offices.find(o => o.id === officeId);
    if (office) {
      setRadius([office.radius_in_meters || 100]);
    }
  };

  const handleSave = async () => {
    if (!selectedOfficeId) {
      toast({
        title: "Error",
        description: "Please select an office",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    const { error } = await officeService.updateOffice(selectedOfficeId, {
      radius_in_meters: radius[0],
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      const office = offices.find(o => o.id === selectedOfficeId);
      toast({
        title: "Settings Saved",
        description: `Geofencing radius set to ${radius[0]}m for ${office?.name}.`,
      });
      
      // Refresh offices to get updated data
      fetchOffices();
    }

    setSaving(false);
  };

  const selectedOffice = offices.find(o => o.id === selectedOfficeId);

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
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : offices.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No active offices found</p>
            </div>
          ) : (
            <>
              {/* Office Selector */}
              <div className="animate-fade-in-up">
                <h2 className="text-overline mb-3">Select Office</h2>
                <div className="space-y-3">
                  {offices.map((office) => (
                    <button
                      key={office.id}
                      onClick={() => handleOfficeChange(office.id)}
                      className={`w-full card-elevated p-4 flex items-center gap-4 transition-colors ${
                        selectedOfficeId === office.id ? "ring-2 ring-primary" : ""
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        selectedOfficeId === office.id ? "bg-primary text-primary-foreground" : "bg-accent"
                      }`}>
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium">{office.name}</p>
                        <p className="text-xs text-muted-foreground">{office.address}</p>
                      </div>
                      {selectedOfficeId === office.id && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Radius Configuration */}
              {selectedOffice && (
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
              )}

              {/* Save Button */}
              {selectedOffice && (
                <div className="animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default GeofencingScreen;
