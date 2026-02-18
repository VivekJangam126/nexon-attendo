import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Clock, CheckCircle2, Building2, Calendar, AlertCircle } from "lucide-react";
import MobileContainer from "@/components/MobileContainer";
import BottomNavigation from "@/components/BottomNavigation";
import { useAuth } from "@/hooks/useAuth";
import { attendanceService } from "@server";
import type { Attendance } from "@server";

const DashboardScreen = () => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [windowOpen, setWindowOpen] = useState(false);
  const [windowDisplay, setWindowDisplay] = useState<string>('Loading...');

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

      setLoading(false);
    };

    fetchData();
  }, [profile]);

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

  const handleMarkAttendance = async () => {
    if (!profile || marking) return;

    setMarking(true);

    // Navigate to processing screen
    // The processing screen will handle the actual attendance marking
    navigate("/attendance-processing");
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
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
                {todayAttendance.check_out_time && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">
                      Check-out: {formatTime(todayAttendance.check_out_time)}
                    </span>
                  </div>
                )}
                {!todayAttendance.check_out_time && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">
                      Auto check-out at 6:00 PM
                    </span>
                  </div>
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

          {/* Mark Attendance Button */}
          <div className="pt-2 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
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
              ) : todayAttendance ? (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Attendance Marked
                </span>
              ) : (
                "Mark Attendance"
              )}
            </button>

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
