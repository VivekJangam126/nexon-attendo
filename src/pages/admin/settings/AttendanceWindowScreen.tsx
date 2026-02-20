import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { attendanceSettingsService } from "@server";

const AttendanceWindowScreen = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeDays, setActiveDays] = useState({
    mon: true,
    tue: true,
    wed: true,
    thu: true,
    fri: true,
    sat: false,
    sun: false,
  });

  // Fetch current attendance window from database
  useEffect(() => {
    const fetchWindow = async () => {
      const { window, error } = await attendanceSettingsService.getActiveWindow();
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to load attendance settings",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (window) {
        // Parse HH:MM:SS to HH:MM
        const startParts = window.start_time.split(':');
        const endParts = window.end_time.split(':');
        setStartTime(`${startParts[0]}:${startParts[1]}`);
        setEndTime(`${endParts[0]}:${endParts[1]}`);
      }

      setLoading(false);
    };

    fetchWindow();
  }, []);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Calculate window duration in hours
  const calculateWindowDuration = (start: string, end: string): number => {
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    // Handle overnight windows (e.g., 22:00 to 04:00)
    let durationMinutes = endMinutes - startMinutes;
    if (durationMinutes < 0) {
      durationMinutes += 24 * 60; // Add 24 hours
    }
    
    return durationMinutes / 60; // Convert to hours
  };

  // Validate window duration
  const validateWindow = (start: string, end: string): { valid: boolean; message?: string } => {
    const duration = calculateWindowDuration(start, end);
    
    if (duration > 22) {
      return {
        valid: false,
        message: `Window duration is ${duration.toFixed(1)} hours. Maximum allowed is 22 hours.`
      };
    }
    
    if (duration < 1) {
      return {
        valid: false,
        message: "Window duration must be at least 1 hour."
      };
    }
    
    return { valid: true };
  };

  const toggleDay = (day: keyof typeof activeDays) => {
    setActiveDays(prev => ({ ...prev, [day]: !prev[day] }));
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

    // Validate window duration
    const validation = validateWindow(startTime, endTime);
    if (!validation.valid) {
      toast({
        title: "Invalid Window",
        description: validation.message,
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      // Convert HH:MM to HH:MM:SS format for database
      const startTimeWithSeconds = `${startTime}:00`;
      const endTimeWithSeconds = `${endTime}:00`;

      // Update window times
      const { error: windowError } = await attendanceSettingsService.updateWindow(
        startTimeWithSeconds,
        endTimeWithSeconds,
        profile.id
      );

      if (windowError) {
        toast({
          title: "Error",
          description: windowError.message,
          variant: "destructive",
        });
        return;
      }

      const activeDayNames = Object.entries(activeDays)
        .filter(([_, active]) => active)
        .map(([day]) => day.charAt(0).toUpperCase() + day.slice(1, 3))
        .join(", ");

      const duration = calculateWindowDuration(startTime, endTime);

      toast({
        title: "Settings Saved",
        description: `Attendance window: ${formatTime(startTime)} - ${formatTime(endTime)} (${duration.toFixed(1)}h) on ${activeDayNames}`,
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

  const days = [
    { key: "mon", label: "Mon" },
    { key: "tue", label: "Tue" },
    { key: "wed", label: "Wed" },
    { key: "thu", label: "Thu" },
    { key: "fri", label: "Fri" },
    { key: "sat", label: "Sat" },
    { key: "sun", label: "Sun" },
  ];

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
              <h1 className="text-display">Attendance Window</h1>
              <p className="text-caption">Configure timing rules</p>
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
          {/* Time Selection */}
          <div className="animate-fade-in-up">
            <h2 className="text-overline mb-3">Working Hours</h2>
            <div className="card-elevated p-4 space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Start Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatTime(startTime)}
                </p>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">End Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatTime(endTime)}
                </p>
              </div>

              {/* Duration Display */}
              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Window Duration:</span>
                  <span className={`font-medium ${
                    calculateWindowDuration(startTime, endTime) > 22 
                      ? "text-destructive" 
                      : "text-foreground"
                  }`}>
                    {calculateWindowDuration(startTime, endTime).toFixed(1)} hours
                  </span>
                </div>
                {calculateWindowDuration(startTime, endTime) > 22 && (
                  <p className="text-xs text-destructive mt-1">
                    Maximum allowed duration is 22 hours
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Working Days */}
          <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <h2 className="text-overline mb-3">Working Days</h2>
            <div className="card-elevated p-4">
              <div className="grid grid-cols-7 gap-2">
                {days.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => toggleDay(key as keyof typeof activeDays)}
                    className={`py-3 rounded-lg text-sm font-medium transition-colors ${
                      activeDays[key as keyof typeof activeDays]
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Tap to toggle working days
              </p>
            </div>
          </div>

          {/* Preview */}
          <div className="animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
            <h2 className="text-overline mb-3">Preview</h2>
            <div className="card-elevated p-4 bg-accent/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{formatTime(startTime)} - {formatTime(endTime)}</p>
                  <p className="text-sm text-muted-foreground">
                    {Object.entries(activeDays)
                      .filter(([_, active]) => active)
                      .map(([day]) => day.charAt(0).toUpperCase() + day.slice(1, 3))
                      .join(", ")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Duration: {calculateWindowDuration(startTime, endTime).toFixed(1)} hours
                  </p>
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

export default AttendanceWindowScreen;
