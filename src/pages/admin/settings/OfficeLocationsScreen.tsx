import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Building2, Plus, Edit, Trash2, MapPin, Users, 
  ToggleLeft, ToggleRight, Search
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { toast } from "@/hooks/use-toast";
import { officeService } from "@server";
import type { Office } from "@server/types/office";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const OfficeLocationsScreen = () => {
  const navigate = useNavigate();
  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingOffice, setEditingOffice] = useState<Office | null>(null);
  const [deleteOffice, setDeleteOffice] = useState<Office | null>(null);
  const [saving, setSaving] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    latitude: "",
    longitude: "",
    radius_in_meters: "100",
  });

  useEffect(() => {
    fetchOffices();
  }, []);

  const fetchOffices = async () => {
    setLoading(true);
    const { offices: data, error } = await officeService.getAllOffices();
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load offices",
        variant: "destructive",
      });
    } else {
      setOffices(data);
    }
    
    setLoading(false);
  };

  const handleAdd = () => {
    setEditingOffice(null);
    setFormData({
      name: "",
      address: "",
      city: "",
      state: "",
      country: "India",
      latitude: "",
      longitude: "",
      radius_in_meters: "100",
    });
    setShowDialog(true);
  };

  const handleEdit = (office: Office) => {
    setEditingOffice(office);
    setFormData({
      name: office.name,
      address: office.address,
      city: office.city,
      state: office.state,
      country: office.country,
      latitude: office.latitude?.toString() || "",
      longitude: office.longitude?.toString() || "",
      radius_in_meters: office.radius_in_meters?.toString() || "100",
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name || !formData.address || !formData.city || !formData.state) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    const officeData = {
      name: formData.name,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      country: formData.country,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      radius_in_meters: parseInt(formData.radius_in_meters) || 100,
      is_active: true,
    };

    let result;
    if (editingOffice) {
      result = await officeService.updateOffice(editingOffice.id, officeData);
    } else {
      result = await officeService.createOffice(officeData as any);
    }

    if (result.error) {
      toast({
        title: "Error",
        description: result.error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: editingOffice ? "Office updated successfully" : "Office created successfully",
      });
      setShowDialog(false);
      fetchOffices();
    }

    setSaving(false);
  };

  const handleUseCurrentLocation = async () => {
    if (!('geolocation' in navigator)) {
      toast({
        title: "Not Supported",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      });
      return;
    }

    setFetchingLocation(true);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      setFormData({
        ...formData,
        latitude: position.coords.latitude.toFixed(8),
        longitude: position.coords.longitude.toFixed(8),
      });

      toast({
        title: "Location Captured",
        description: "GPS coordinates have been set to your current location",
      });
    } catch (error: any) {
      let errorMessage = "Failed to get location";
      
      if (error.code === 1) {
        errorMessage = "Location permission denied. Please enable location access.";
      } else if (error.code === 2) {
        errorMessage = "Location unavailable. Please try again.";
      } else if (error.code === 3) {
        errorMessage = "Location request timed out. Please try again.";
      }

      toast({
        title: "Location Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setFetchingLocation(false);
    }
  };

  const handleToggleStatus = async (office: Office) => {
    const result = await officeService.toggleOfficeStatus(office.id, !office.is_active);
    
    if (result.error) {
      toast({
        title: "Error",
        description: result.error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Office ${office.is_active ? 'deactivated' : 'activated'} successfully`,
      });
      fetchOffices();
    }
  };

  const confirmDelete = async () => {
    if (!deleteOffice) return;

    const result = await officeService.deleteOffice(deleteOffice.id);
    
    if (result.error) {
      toast({
        title: "Error",
        description: result.error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Office deleted successfully",
      });
      fetchOffices();
    }
    
    setDeleteOffice(null);
  };

  const filteredOffices = offices.filter(office =>
    office.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    office.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    office.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <div className="flex-1">
              <h1 className="text-display">Office Locations</h1>
              <p className="text-caption">Manage office locations and settings</p>
            </div>
            <button
              onClick={handleAdd}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Office
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search offices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredOffices.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? "No offices found" : "No offices yet. Add your first office!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-6xl">
              {filteredOffices.map((office, index) => (
                <div
                  key={office.id}
                  className="card-elevated p-5 animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        office.is_active ? 'bg-primary/10' : 'bg-muted'
                      }`}>
                        <Building2 className={`w-6 h-6 ${
                          office.is_active ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{office.name}</h3>
                          <span className={`status-badge ${
                            office.is_active 
                              ? 'bg-success-muted text-success' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {office.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{office.address}</p>
                        <p className="text-xs text-muted-foreground">{office.city}, {office.state}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4 pt-3 border-t border-border">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Geofence</p>
                        <p className="text-sm font-medium">{office.radius_in_meters}m</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">GPS</p>
                        <p className="text-sm font-medium">
                          {office.latitude && office.longitude ? 'Set' : 'Not set'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleStatus(office)}
                      className="flex-1 btn-secondary flex items-center justify-center gap-2"
                    >
                      {office.is_active ? (
                        <>
                          <ToggleRight className="w-4 h-4" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4" />
                          Activate
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(office)}
                      className="btn-secondary p-3"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteOffice(office)}
                      className="btn-secondary p-3 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOffice ? 'Edit Office' : 'Add New Office'}</DialogTitle>
            <DialogDescription>
              {editingOffice ? 'Update office details' : 'Create a new office location'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Office Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., SmartMatrix Pvt Ltd"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g., Office Address, Pune"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g., Pune"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="e.g., Maharashtra"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="e.g., India"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="latitude">Latitude (Optional)</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  placeholder="e.g., 18.59763370"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="longitude">Longitude (Optional)</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  placeholder="e.g., 73.80566110"
                />
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleUseCurrentLocation}
              disabled={fetchingLocation}
              className="w-full"
            >
              <MapPin className="w-4 h-4 mr-2" />
              {fetchingLocation ? 'Getting Location...' : 'Use Current Location'}
            </Button>

            <div className="grid gap-2">
              <Label htmlFor="radius">Geofence Radius (meters)</Label>
              <Input
                id="radius"
                type="number"
                value={formData.radius_in_meters}
                onChange={(e) => setFormData({ ...formData, radius_in_meters: e.target.value })}
                placeholder="100"
              />
              <p className="text-xs text-muted-foreground">
                Employees must be within this radius to mark attendance
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editingOffice ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteOffice} onOpenChange={() => setDeleteOffice(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Office</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteOffice?.name}"? This action cannot be undone.
              {deleteOffice && (
                <span className="block mt-2 text-warning">
                  Note: You cannot delete an office if employees are assigned to it.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default OfficeLocationsScreen;
