import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle2, Calendar, Clock, MapPin } from "lucide-react";
import MobileContainer from "@/components/MobileContainer";
import type { Attendance } from "@server";

const AttendanceSuccessScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const attendance = location.state?.attendance as Attendance | undefined;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusLabel = () => {
    if (!attendance) return "Present";
    return attendance.status === "present" ? "Present" : attendance.status === "late" ? "Late" : "Absent";
  };

  const getStatusColor = () => {
    if (!attendance) return "text-success bg-success-muted";
    return attendance.status === "late" ? "text-warning bg-warning-muted" : "text-success bg-success-muted";
  };

  return (
    <MobileContainer>
      <div className="flex flex-col items-center justify-center min-h-full px-8">
        {/* Success Animation */}
        <div className="relative mb-8 animate-scale-in">
          <div className="w-28 h-28 bg-success-muted rounded-full flex items-center justify-center">
            <div className="w-20 h-20 bg-success rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-success-foreground" />
            </div>
          </div>
          {/* Decorative rings */}
          <div className="absolute -inset-3 border-2 border-success/20 rounded-full animate-ping" style={{ animationDuration: "1.5s", animationIterationCount: "1" }} />
        </div>

        {/* Success Message */}
        <div className="text-center mb-8 animate-fade-in-up">
          <h1 className="text-display mb-2">Attendance Marked</h1>
          <p className="text-body-secondary">Successfully recorded for today</p>
        </div>

        {/* Status Badge */}
        <div className={`status-badge text-base mb-8 animate-fade-in-up ${getStatusColor()}`} style={{ animationDelay: "0.1s" }}>
          {getStatusLabel()}
        </div>

        {/* Details Card */}
        <div className="card-elevated w-full max-w-sm p-5 space-y-4 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-caption">Date</p>
              <p className="font-medium">
                {attendance ? formatDate(attendance.date) : new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-caption">Time</p>
              <p className="font-medium">
                {attendance ? formatTime(attendance.check_in_time) : new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-caption">Location</p>
              <p className="font-medium">Office Location</p>
            </div>
          </div>
        </div>

        {/* Confirmation Note */}
        <div className="bg-accent rounded-xl p-4 mt-6 w-full max-w-sm animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          <p className="text-sm text-center text-accent-foreground">
            Your attendance for today has been recorded successfully. You can view your attendance history anytime.
          </p>
        </div>

        {/* Back to Dashboard Button */}
        <div className="w-full max-w-sm mt-8 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
          <button
            onClick={() => navigate("/dashboard")}
            className="btn-primary-large"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </MobileContainer>
  );
};

export default AttendanceSuccessScreen;
