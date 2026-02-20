import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Clock, CheckCircle2, Building2, Calendar, AlertCircle, LogOut } from "lucide-react";
import MobileContainer from "@/components/MobileContainer";
import BottomNavigation from "@/components/BottomNavigation";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { attendanceService, attendanceSettingsService } from "@server";
import type { Attendance } from "@server";

const DashboardScreen = () => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [windowOpen, setWindowOpen] = useState(false);
  const [windowDisplay, setWindowDisplay] = useState<string>('Loading...');
  const [workDuration, setWorkDuration] = useState<string>('0h 0m');
  const [defaultCheckoutTime, setDefaultCheckoutTime] = useState<string>('6:30 PM');

  // Fetch today's attendance and window status on mount
  useEffect(() => {
    const fetchData = async () => {
      if (!profile) {
        setLoading(false);
        return;
      }

      // Fetch today's attendance
      const { attendance } = await attendanceService.getTodayAttendance(profile);
      setTodayAttendance(attendance);

      // Fetch window status from database
      const { isOpen, windowDisplay: display } = await attendanceService.isWindowOpen();
      setWindowOpen(isOpen);
      setWindowDisplay(display);

      // Fetch default checkout time
      const { defaultCheckoutTime: time } = await attendanceSettingsService.getCheckoutSettings();
      if (time) {
        // Format HH:MM:SS to 12-hour format
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        setDefaultCheckoutTime(`${displayHour}:${minutes} ${ampm}`);
      }

      setLoading(false);
    };

    fetchData();
  }, [profile]);

  // Update work duration every minute if checked in but not checked out
  useEffect(() => {
    if (!todayAttendance || todayAttendance.check_out_time) {
      return;
    }

    const updateDuration = () => {
      const checkInTime = new Date(todayAttendance.check_in_time);
      const now = new Date();
      const diffMs = now.getTime() - checkInTime.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setWorkDuration(`${hours}h ${minutes}m`);
    };

    updateDuration();
    const interval = setInterval(updateDuration, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [todayAttendance]);

  // Redirect if not authenticated or not active
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    } else if (!loading && profile) {
      if (profile.status === "pending") {
        navigate("/registration-pending");
      } else if (profile.status === "rejected" || profile.status === "blocked") {
        navigate("/account-blocked");
      }
    }
  }, [loading, user, profile, navigate]);

  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const getGreeting = () => {
    const hour = currentDate.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const canMarkAttendance = !todayAttendance && windowOpen;
  const canCheckOut = todayAttendance && !todayAttendance.check_out_time;

  const handleMarkAttendance = async () => {
    if (!profile || marking) return;

    setMarking(true);

    // Navigate to processing screen
    // The processing screen will handle the actual attendance marking
    navigate("/attendance-processing");
  };

  const handleCheckOut = async () => {
    if (!profile || !todayAttendance || checkingOut) return;

    setCheckingOut(true);

    try {
      // Get current location
      if (!navigator.geolocation) {
        toast({
          title: "Location Not Supported",
          description: "Your browser doesn't support location services",
          variant: "destructive",
        });
        setCheckingOut(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // Call checkout service
          const result = await attendanceService.checkOut(profile, latitude, longitude);

          if (result.success) {
            toast({
              title: "Checked Out Successfully",
              description: `Work duration: ${result.workHours?.toFixed(1)} hours`,
            });

            // Refresh attendance data
            const { attendance } = await attendanceService.getTodayAttendance(profile);
            setTodayAttendance(attendance);
          } else {
            toast({
              title: "Checkout Failed",
              description: result.message || "Please try again",
              variant: "destructive",
            });
          }

          setCheckingOut(false);
        },
        (error) => {
          console.error("Location error:", error);
          toast({
            title: "Location Error",
            description: "Could not get your location. Please enable location services.",
            variant: "destructive",
          });
          setCheckingOut(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      setCheckingOut(false);
    }
  };

  const formatTime = (isoString: string) => {
    // Parse the UTC time and convert to IST
    const utcDate = new Date(isoString);
    
    // Convert to IST by adding 5 hours 30 minutes
    const istDate = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000));
    
    // Format the time
    const hours = istDate.getUTCHours();
    const minutes = istDate.getUTCMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  if (loading) {
    return (
      <MobileContainer>
        <div className="flex items-center justify-center min-h-full">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </MobileContainer>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <MobileContainer>
      <div className="flex flex-col min-h-full pb-20">
        {/* Header */}
        <div className="px-6 pt-8 pb-4 bg-primary text-primary-foreground rounded-b-3xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary-foreground/20 rounded-full flex items-center justify-center">
              <span className="text-xl font-semibold">
                {profile.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-primary-foreground/80 text-sm">{getGreeting()},</p>
              <h1 className="text-xl font-semibold">{profile.full_name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 text-primary-foreground/80 text-sm">
            <Calendar className="w-4 h-4" />
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 py-6 space-y-5">
          {/* Office Info */}
          {profile.office_location && (
            <div className="card-elevated p-4 animate-fade-in-up">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-caption">Current Office</p>
                  <p className="font-medium text-foreground">{profile.office_name || 'Assigned Office'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Attendance Status Card */}
          <div className="card-elevated p-5 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-heading">Today's Attendance</h2>
              <span className={`status-badge ${
                todayAttendance 
                  ? "bg-success-muted text-success" 
                  : "bg-muted text-muted-foreground"
              }`}>
                {todayAttendance && <CheckCircle2 className="w-4 h-4" />}
                {todayAttendance ? "Present" : "Not Marked"}
              </span>
            </div>

            {todayAttendance && (
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">
                    Check-in: {formatTime(todayAttendance.check_in_time)}
                  </span>
                </div>
                {todayAttendance.check_out_time ? (
                  <>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">
                        Check-out: {formatTime(todayAttendance.check_out_time)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-success">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Work duration: {(() => {
                          const checkIn = new Date(todayAttendance.check_in_time);
                          const checkOut = new Date(todayAttendance.check_out_time);
                          const diffMs = checkOut.getTime() - checkIn.getTime();
                          const hours = Math.floor(diffMs / (1000 * 60 * 60));
                          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                          return `${hours}h ${minutes}m`;
                        })()}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-primary">
                      <Clock className="w-4 h-4 animate-pulse" />
                      <span className="text-sm font-medium">
                        Working: {workDuration}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">
                        Auto check-out at {defaultCheckoutTime}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Verification Status */}
            <div className="space-y-3 pt-3 border-t border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-xs text-muted-foreground">GPS validation</p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Message */}
          <div className={`rounded-xl p-4 animate-fade-in-up ${
            todayAttendance 
              ? "bg-success-muted" 
              : windowOpen 
                ? "bg-accent" 
                : "bg-warning-muted"
          }`} style={{ animationDelay: "0.2s" }}>
            <p className="text-sm">
              {todayAttendance ? (
                <>
                  <span className="font-medium">Attendance recorded successfully.</span>
                  <br />
                  <span className="text-muted-foreground">Your attendance for today has been marked.</span>
                </>
              ) : windowOpen ? (
                <>
                  <span className="font-medium">Ready to mark attendance.</span>
                  <br />
                  <span className="text-muted-foreground">
                    Attendance window: {windowDisplay}
                  </span>
                </>
              ) : (
                <>
                  <span className="font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Attendance window is closed.
                  </span>
                  <br />
                  <span className="text-muted-foreground">
                    Window: {windowDisplay}
                  </span>
                </>
              )}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-3 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            {/* Mark Attendance Button */}
            {!todayAttendance && (
              <button
                onClick={handleMarkAttendance}
                disabled={!canMarkAttendance || marking}
                className="btn-primary-large"
              >
                {marking ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  "Mark Attendance"
                )}
              </button>
            )}

            {/* Checkout Button */}
            {canCheckOut && (
              <button
                onClick={handleCheckOut}
                disabled={checkingOut}
                className="w-full py-4 bg-success text-white rounded-xl font-medium hover:bg-success/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {checkingOut ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Checking Out...
                  </>
                ) : (
                  <>
                    <LogOut className="w-5 h-5" />
                    Check Out
                  </>
                )}
              </button>
            )}

            {/* Already Checked Out */}
            {todayAttendance && todayAttendance.check_out_time && (
              <button
                disabled
                className="btn-primary-large opacity-50 cursor-not-allowed"
              >
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Checked Out
                </span>
              </button>
            )}

            {!canMarkAttendance && !todayAttendance && (
              <p className="text-center text-xs text-muted-foreground mt-3">
                {windowOpen 
                  ? "Attendance already marked for today" 
                  : `Attendance window: ${windowDisplay}`
                }
              </p>
            )}
          </div>
        </div>

        <BottomNavigation />
      </div>
    </MobileContainer>
  );
};

export default DashboardScreen;
