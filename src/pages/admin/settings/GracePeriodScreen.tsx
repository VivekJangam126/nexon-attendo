import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Check } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { attendanceSettingsService } from "@server";

const GracePeriodScreen = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState(15);
  const [windowStartTime, setWindowStartTime] = useState("10:00 AM");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch current grace period and window start time from database
  useEffect(() => {
    const fetchSettings = async () => {
      // Fetch grace period
      const { gracePeriodMinutes, error: gracePeriodError } = await attendanceSettingsService.getGracePeriod();
      
      if (gracePeriodError) {
        toast({
          title: "Error",
          description: "Failed to load grace period settings",
          variant: "destructive",
        });
      } else {
        setSelectedPeriod(gracePeriodMinutes);
      }
      
      // Fetch window settings to get start time
      const { window, error: windowError } = await attendanceSettingsService.getActiveWindow();
      
      if (!windowError && window) {
        // Format start time for display
        const [hour, minute] = window.start_time.split(':').map(Number);
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        setWindowStartTime(`${displayHour}:${minute.toString().padStart(2, '0')} ${period}`);
      }
      
      setLoading(false);
    };

    fetchSettings();
  }, []);

  const periods = [
    { value: 5, label: "5 minutes", description: "Very strict" },
    { value: 10, label: "10 minutes", description: "Strict" },
    { value: 15, label: "15 minutes", description: "Standard" },
    { value: 20, label: "20 minutes", description: "Flexible" },
    { value: 30, label: "30 minutes", description: "Very flexible" },
  ];

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
      const { error } = await attendanceSettingsService.updateGracePeriod(
        selectedPeriod,
        profile.id
      );

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Settings Saved",
          description: `Grace period set to ${selectedPeriod} minutes.`,
        });
      }
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
              <h1 className="text-display">Grace Period</h1>
              <p className="text-caption">Late arrival tolerance</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 space-y-6 overflow-y-auto max-w-3xl">
          {loading ? (
            <div className="space-y-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-32 mb-3"></div>
                <div className="card-elevated p-4 space-y-3">
                  <div className="h-16 bg-muted rounded"></div>
                  <div className="h-16 bg-muted rounded"></div>
                  <div className="h-16 bg-muted rounded"></div>
                </div>
              </div>
            </div>
          ) : (
            <>
          {/* Explanation */}
          <div className="animate-fade-in-up">
            <div className="card-elevated p-4 bg-accent/50">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-medium mb-1">What is Grace Period?</p>
                  <p className="text-sm text-muted-foreground">
                    The grace period is the time after the official start time during which 
                    employees can still mark attendance without being marked as "Late".
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Duration Options */}
          <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <h2 className="text-overline mb-3">Select Duration</h2>
            <div className="space-y-3">
              {periods.map((period) => (
                <button
                  key={period.value}
                  onClick={() => setSelectedPeriod(period.value)}
                  disabled={saving}
                  className={`w-full card-elevated p-4 flex items-center gap-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    selectedPeriod === period.value ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    selectedPeriod === period.value 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted"
                  }`}>
                    <span className="text-lg font-semibold">{period.value}</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{period.label}</p>
                    <p className="text-sm text-muted-foreground">{period.description}</p>
                  </div>
                  {selectedPeriod === period.value && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Example */}
          <div className="animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
            <h2 className="text-overline mb-3">Example</h2>
            <div className="card-elevated p-4">
              <p className="text-sm text-muted-foreground">
                If the attendance window starts at <span className="font-medium text-foreground">{windowStartTime}</span> and 
                the grace period is <span className="font-medium text-foreground">{selectedPeriod} minutes</span>:
              </p>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Check-in within {selectedPeriod} min of start</span>
                  <span className="px-2 py-0.5 bg-success-muted text-success rounded-full text-xs font-medium">Present</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Check-in after {selectedPeriod} min grace period</span>
                  <span className="px-2 py-0.5 bg-warning-muted text-warning rounded-full text-xs font-medium">Late</span>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
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

export default GracePeriodScreen;
