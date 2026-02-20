import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Loader2, Navigation } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { toast } from "@/hooks/use-toast";
import { officeService } from "@server";
import type { Office } from "@server/types/office";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

const OfficeFormScreen = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    latitude: null as number | null,
    longitude: null as number | null,
    radius_in_meters: 100,
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEditMode && id) {
      fetchOffice(id);
    }
  }, [id, isEditMode]);

  const fetchOffice = async (officeId: string) => {
    setLoading(true);
    const { office, error } = await officeService.getOfficeById(officeId);

    if (error || !office) {
      toast({
        title: "Error",
        description: "Failed to load office details",
        variant: "destructive",
      });
      navigate("/admin/settings/offices");
    } else {
      setFormData({
        name: office.name,
        address: office.address,
        city: office.city,
        state: office.state,
        country: office.country,
        latitude: office.latitude,
        longitude: office.longitude,
        radius_in_meters: office.radius_in_meters,
        is_active: office.is_active,
      });
    }

    setLoading(false);
  };

  const handleGetCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      });
      return;
    }

    setGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: parseFloat(position.coords.latitude.toFixed(6)),
          longitude: parseFloat(position.coords.longitude.toFixed(6)),
        }));
        setErrors(prev => ({ ...prev, latitude: "", longitude: "" }));
        setGettingLocation(false);
        toast({
          title: "Success",
          description: "Location captured successfully",
        });
      },
      (error) => {
        setGettingLocation(false);
        toast({
          title: "Error",
          description: "Failed to get location. Please enter manually.",
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Office name is required";
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.state.trim()) newErrors.state = "State is required";
    if (!formData.country.trim()) newErrors.country = "Country is required";

    if (formData.latitude === null) {
      newErrors.latitude = "Latitude is required";
    } else if (formData.latitude < -90 || formData.latitude > 90) {
      newErrors.latitude = "Latitude must be between -90 and 90";
    }

    if (formData.longitude === null) {
      newErrors.longitude = "Longitude is required";
    } else if (formData.longitude < -180 || formData.longitude > 180) {
      newErrors.longitude = "Longitude must be between -180 and 180";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    let result;
    if (isEditMode && id) {
      result = await officeService.updateOffice(id, formData as Partial<Office>);
    } else {
      result = await officeService.createOffice(formData as any);
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
        description: `Office ${isEditMode ? 'updated' : 'created'} successfully`,
      });
      navigate("/admin/settings/offices");
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-full">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex flex-col min-h-full pb-20 md:pb-0">
        {/* Header */}
        <div className="px-4 sm:px-6 lg:px-8 pt-6 lg:pt-8 pb-4 border-b border-border">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate("/admin/settings/offices")}
              className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-display">{isEditMode ? 'Edit Office' : 'Add New Office'}</h1>
              <p className="text-caption">Configure office location and settings</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto">
          <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
            {/* Basic Information */}
            <div className="card-elevated p-6 space-y-4">
              <h2 className="text-lg font-semibold mb-4">Basic Information</h2>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Office Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-4 py-2.5 bg-muted/50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.name ? 'border-destructive' : 'border-border'
                  }`}
                  placeholder="e.g., Mumbai Branch"
                />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Address <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className={`w-full px-4 py-2.5 bg-muted/50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.address ? 'border-destructive' : 'border-border'
                  }`}
                  placeholder="e.g., 123 Main Street, Area Name"
                />
                {errors.address && <p className="text-xs text-destructive mt-1">{errors.address}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    City <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    className={`w-full px-4 py-2.5 bg-muted/50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                      errors.city ? 'border-destructive' : 'border-border'
                    }`}
                    placeholder="e.g., Mumbai"
                  />
                  {errors.city && <p className="text-xs text-destructive mt-1">{errors.city}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    State <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    className={`w-full px-4 py-2.5 bg-muted/50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                      errors.state ? 'border-destructive' : 'border-border'
                    }`}
                    placeholder="e.g., Maharashtra"
                  />
                  {errors.state && <p className="text-xs text-destructive mt-1">{errors.state}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Country <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  className={`w-full px-4 py-2.5 bg-muted/50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.country ? 'border-destructive' : 'border-border'
                  }`}
                  placeholder="e.g., India"
                />
                {errors.country && <p className="text-xs text-destructive mt-1">{errors.country}</p>}
              </div>
            </div>

            {/* GPS Coordinates */}
            <div className="card-elevated p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">GPS Coordinates</h2>
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  disabled={gettingLocation}
                  className="flex items-center gap-2 px-3 py-2 bg-accent hover:bg-accent/80 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {gettingLocation ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Navigation className="w-4 h-4" />
                  )}
                  {gettingLocation ? 'Getting Location...' : 'Use Current Location'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Latitude <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.latitude || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      latitude: e.target.value ? parseFloat(e.target.value) : null 
                    }))}
                    className={`w-full px-4 py-2.5 bg-muted/50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                      errors.latitude ? 'border-destructive' : 'border-border'
                    }`}
                    placeholder="e.g., 18.597633"
                  />
                  {errors.latitude && <p className="text-xs text-destructive mt-1">{errors.latitude}</p>}
                  <p className="text-xs text-muted-foreground mt-1">Range: -90 to 90</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Longitude <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.longitude || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      longitude: e.target.value ? parseFloat(e.target.value) : null 
                    }))}
                    className={`w-full px-4 py-2.5 bg-muted/50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                      errors.longitude ? 'border-destructive' : 'border-border'
                    }`}
                    placeholder="e.g., 73.805661"
                  />
                  {errors.longitude && <p className="text-xs text-destructive mt-1">{errors.longitude}</p>}
                  <p className="text-xs text-muted-foreground mt-1">Range: -180 to 180</p>
                </div>
              </div>

              {formData.latitude && formData.longitude && (
                <div className="bg-accent/50 rounded-lg p-3 flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Coordinates Set</p>
                    <p className="text-muted-foreground">
                      {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Geofencing */}
            <div className="card-elevated p-6 space-y-4">
              <h2 className="text-lg font-semibold mb-4">Geofencing</h2>

              <div>
                <label className="block text-sm font-medium mb-3">
                  Geofence Radius: {formData.radius_in_meters}m
                </label>
                <Slider
                  value={[formData.radius_in_meters]}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, radius_in_meters: value[0] }))}
                  min={50}
                  max={500}
                  step={10}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>50m</span>
                  <span>500m</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Employees must be within this radius to mark attendance
                </p>
              </div>
            </div>

            {/* Status */}
            <div className="card-elevated p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold mb-1">Office Status</h2>
                  <p className="text-sm text-muted-foreground">
                    {formData.is_active ? 'Office is active and visible to employees' : 'Office is inactive and hidden'}
                  </p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate("/admin/settings/offices")}
                className="flex-1 px-4 py-3 bg-muted hover:bg-muted/80 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  isEditMode ? 'Update Office' : 'Create Office'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default OfficeFormScreen;
