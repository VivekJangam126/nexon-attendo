import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { attendanceSettingsService } from "@server";

const GracePeriodScreen = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [graceEndTime, setGraceEndTime] = useState("10:15"); // HH:MM format (24-hour)
  const [windowStartTime, setWindowStartTime] = useState("10:00");
  const [windowStartDisplay, setWindowStartDisplay] = useState("10:00 AM");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch current grace period and window start time from database
  useEffect(() => {
    const fetchSettings = async () => {
      // Fetch window settings to get start time
      const { window, error: windowError } = await attendanceSettingsService.getActiveWindow();
      
      if (windowError || !window) {
        toast({
          title: "Error",
          description: "Failed to load attendance window settings",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Parse start time (HH:MM:SS format)
      const [startHour, startMinute] = window.start_time.split(':').map(Number);
      const startTimeIn24 = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
      setWindowStartTime(startTimeIn24);

      // Format for display
      const period = startHour >= 12 ? 'PM' : 'AM';
      const displayHour = startHour > 12 ? startHour - 12 : startHour === 0 ? 12 : startHour;
      setWindowStartDisplay(`${displayHour}:${startMinute.toString().padStart(2, '0')} ${period}`);

      // Calculate grace end time from grace period minutes
      const gracePeriodMinutes = window.grace_period_minutes || 15;
      const graceEndMinutes = (startHour * 60 + startMinute) + gracePeriodMinutes;
      const graceEndHour = Math.floor(graceEndMinutes / 60) % 24;
      const graceEndMin = graceEndMinutes % 60;
      setGraceEndTime(`${graceEndHour.toString().padStart(2, '0')}:${graceEndMin.toString().padStart(2, '0')}`);
      
      setLoading(false);
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!profile) {
      toast({
        title: "Error",
        description: "You must be logged in to update settings",
        variant: "destructive",
      });
      return;
    }

    // Parse times
    const [startHour, startMinute] = windowStartTime.split(':').map(Number);
    const [endHour, endMinute] = graceEndTime.split(':').map(Number);

    // Calculate grace period in minutes
    const startTimeInMinutes = startHour * 60 + startMinute;
    const endTimeInMinutes = endHour * 60 + endMinute;
    const gracePeriodMinutes = endTimeInMinutes - startTimeInMinutes;

    // Validate grace period
    if (gracePeriodMinutes <= 0) {
      toast({
        title: "Invalid Grace Period",
        description: "Grace period end time must be after the attendance window start time",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const { error } = await attendanceSettingsService.updateGracePeriod(
        gracePeriodMinutes,
        profile.id
      );

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Format grace end time for display
        const period = endHour >= 12 ? 'PM' : 'AM';
        const displayHour = endHour > 12 ? endHour - 12 : endHour === 0 ? 12 : endHour;
        const displayTime = `${displayHour}:${endMinute.toString().padStart(2, '0')} ${period}`;
        
        toast({
          title: "Settings Saved",
          description: `Grace period ends at ${displayTime} (${gracePeriodMinutes} minutes).`,
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

  // Format time for display
  const formatTimeDisplay = (timeString: string) => {
    const [hour, minute] = timeString.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
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

          {/* Time Picker */}
          <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <h2 className="text-overline mb-3">Set Grace Period End Time</h2>
            <div className="card-elevated p-6 space-y-6">
              {/* Window Start Time (Read-only) */}
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-3">
                  Attendance Window Starts At
                </label>
                <div className="w-full p-4 bg-muted/50 rounded-xl text-center border-2 border-muted">
                  <span className="text-2xl font-semibold text-foreground">{windowStartDisplay}</span>
                </div>
              </div>

              {/* Grace Period End Time Input */}
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-3">
                  Grace Period Ends At
                </label>
                <div className="relative">
                  <input
                    type="time"
                    value={graceEndTime}
                    onChange={(e) => setGraceEndTime(e.target.value)}
                    disabled={saving}
                    className="w-full p-5 text-center text-3xl font-bold bg-background rounded-xl border-2 border-primary/20 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    style={{
                      colorScheme: 'light'
                    }}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Clock className="w-6 h-6 text-primary/40" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Current selection: <span className="font-semibold text-foreground">{formatTimeDisplay(graceEndTime)}</span>
                </p>
              </div>

              <div className="pt-2 border-t border-border">
                <p className="text-sm text-muted-foreground text-center">
                  Click the time field to open the time picker. Select hours and minutes to set when the grace period ends.
                </p>
              </div>
            </div>
          </div>

          {/* Example */}
          <div className="animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
            <h2 className="text-overline mb-3">How It Works</h2>
            <div className="card-elevated p-4">
              <p className="text-sm text-muted-foreground mb-3">
                With the current settings:
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm p-2 bg-success-muted/20 rounded-lg">
                  <span className="text-muted-foreground">
                    Check-in between <span className="font-medium text-foreground">{windowStartDisplay}</span> and{' '}
                    <span className="font-medium text-foreground">
                      {formatTimeDisplay(graceEndTime)}
                    </span>
                  </span>
                  <span className="px-2 py-0.5 bg-success-muted text-success rounded-full text-xs font-medium">Present</span>
                </div>
                <div className="flex items-center justify-between text-sm p-2 bg-warning-muted/20 rounded-lg">
                  <span className="text-muted-foreground">
                    Check-in after{' '}
                    <span className="font-medium text-foreground">
                      {formatTimeDisplay(graceEndTime)}
                    </span>
                  </span>
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
