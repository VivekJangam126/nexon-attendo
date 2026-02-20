import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, LogOut } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { attendanceSettingsService } from "@server";

const CheckoutSettingsScreen = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [defaultCheckoutTime, setDefaultCheckoutTime] = useState("18:30");
  const [autoCheckoutEnabled, setAutoCheckoutEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch current checkout settings from database
  useEffect(() => {
    const fetchSettings = async () => {
      const { defaultCheckoutTime: time, autoCheckoutEnabled: enabled, error } = 
        await attendanceSettingsService.getCheckoutSettings();
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to load checkout settings",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Parse HH:MM:SS to HH:MM
      const timeParts = time.split(':');
      setDefaultCheckoutTime(`${timeParts[0]}:${timeParts[1]}`);
      setAutoCheckoutEnabled(enabled);

      setLoading(false);
    };

    fetchSettings();
  }, []);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleSave = async () => {
    if (!profile) {
      toast({
        title: "Error",
        description: "You must be logged in to update settings",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      // Convert HH:MM to HH:MM:SS format for database
      const timeWithSeconds = `${defaultCheckoutTime}:00`;

      // Update checkout settings
      // Note: minWorkHours is set to 8.0 (for reporting only, not enforced)
      const { success, error } = await attendanceSettingsService.updateCheckoutSettings(
        timeWithSeconds,
        autoCheckoutEnabled,
        8.0, // minWorkHours - for reporting only
        profile.id
      );

      if (!success || error) {
        toast({
          title: "Error",
          description: error?.message || "Failed to save settings",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Settings Saved",
        description: `Default checkout time: ${formatTime(defaultCheckoutTime)}${autoCheckoutEnabled ? ' (Auto-checkout enabled)' : ''}`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
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
              <h1 className="text-display">Checkout Settings</h1>
              <p className="text-caption">Configure default checkout time</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 space-y-6 overflow-y-auto max-w-3xl">
          {loading ? (
            <div className="space-y-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-32 mb-3"></div>
                <div className="card-elevated p-4 space-y-4">
                  <div className="h-10 bg-muted rounded"></div>
                  <div className="h-10 bg-muted rounded"></div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Default Checkout Time */}
              <div className="animate-fade-in-up">
                <h2 className="text-overline mb-3">Default Checkout Time</h2>
                <div className="card-elevated p-4 space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">
                      Checkout Time
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <input
                        type="time"
                        value={defaultCheckoutTime}
                        onChange={(e) => setDefaultCheckoutTime(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTime(defaultCheckoutTime)}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      This time will be used for automatic checkout if employees don't manually check out.
                    </p>
                  </div>
                </div>
              </div>

              {/* Auto-Checkout Toggle */}
              <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                <h2 className="text-overline mb-3">Auto-Checkout</h2>
                <div className="card-elevated p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">Enable Auto-Checkout</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Automatically check out employees at the default time if they haven't checked out manually
                      </p>
                    </div>
                    <button
                      onClick={() => setAutoCheckoutEnabled(!autoCheckoutEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        autoCheckoutEnabled ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          autoCheckoutEnabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
                <h2 className="text-overline mb-3">Preview</h2>
                <div className="card-elevated p-4 bg-accent/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                      <LogOut className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Default Checkout: {formatTime(defaultCheckoutTime)}</p>
                      <p className="text-sm text-muted-foreground">
                        {autoCheckoutEnabled 
                          ? "Auto-checkout is enabled" 
                          : "Auto-checkout is disabled (manual checkout only)"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                <div className="card-elevated p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                  <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    How it works
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Employees can manually check out anytime after check-in</li>
                    <li>If auto-checkout is enabled, employees who haven't checked out will be automatically checked out at the default time</li>
                    <li>The cron job runs daily to process auto-checkouts</li>
                    <li>Manual checkout always takes priority over auto-checkout</li>
                  </ul>
                </div>
              </div>

              {/* Save Button */}
              <div className="animate-fade-in-up" style={{ animationDelay: "0.25s" }}>
                <button
                  onClick={handleSave}
                  disabled={saving || loading}
                  className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default CheckoutSettingsScreen;
