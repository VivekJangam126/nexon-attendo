import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, MapPin, Users, Plus, Edit, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { toast } from "@/hooks/use-toast";

interface OfficeLocation {
  id: string;
  name: string;
  address: string;
  employeeCount: number;
  isActive: boolean;
}

const OfficeLocationsScreen = () => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<OfficeLocation[]>([
    { id: "1", name: "Head Office", address: "123 Tech Park, Sector 5, Mumbai", employeeCount: 120, isActive: true },
    { id: "2", name: "Branch Office", address: "456 Business Center, Pune", employeeCount: 36, isActive: true },
  ]);

  const toggleLocation = (id: string) => {
    setLocations(prev => 
      prev.map(loc => 
        loc.id === id ? { ...loc, isActive: !loc.isActive } : loc
      )
    );
    toast({
      title: "Location Updated",
      description: "Office location status has been updated.",
    });
  };

  const deleteLocation = (id: string) => {
    setLocations(prev => prev.filter(loc => loc.id !== id));
    toast({
      title: "Location Deleted",
      description: "Office location has been removed.",
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
              <h1 className="text-display">Office Locations</h1>
              <p className="text-caption">Manage office premises</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 space-y-4 overflow-y-auto max-w-3xl">
          {/* Add New Button */}
          <button className="w-full card-elevated p-4 flex items-center justify-center gap-2 text-primary font-medium hover:bg-muted/50 transition-colors">
            <Plus className="w-5 h-5" />
            Add New Location
          </button>

          {/* Location List */}
          {locations.map((location, index) => (
            <div 
              key={location.id}
              className="card-elevated p-4 animate-fade-in-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium">{location.name}</h3>
                    <button 
                      onClick={() => toggleLocation(location.id)}
                      className="text-primary"
                    >
                      {location.isActive ? (
                        <ToggleRight className="w-7 h-7" />
                      ) : (
                        <ToggleLeft className="w-7 h-7 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="truncate">{location.address}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="w-3.5 h-3.5" />
                      <span>{location.employeeCount} employees</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <Edit className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button 
                        onClick={() => deleteLocation(location.id)}
                        className="p-2 hover:bg-destructive-muted rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {locations.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No office locations configured</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default OfficeLocationsScreen;
