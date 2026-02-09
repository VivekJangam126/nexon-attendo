import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Wifi, Clock, CheckCircle2, Building2, Calendar } from "lucide-react";
import MobileContainer from "@/components/MobileContainer";
import BottomNavigation from "@/components/BottomNavigation";

type AttendanceStatus = "not_marked" | "present" | "present_early" | "present_grace" | "late";

interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
}

const statusConfigs: Record<AttendanceStatus, StatusConfig> = {
  not_marked: { label: "Not Marked", color: "text-muted-foreground", bgColor: "bg-muted" },
  present: { label: "Present", color: "text-success", bgColor: "bg-success-muted" },
  present_early: { label: "Present (Early)", color: "text-success", bgColor: "bg-success-muted" },
  present_grace: { label: "Present (Grace)", color: "text-warning", bgColor: "bg-warning-muted" },
  late: { label: "Late", color: "text-warning", bgColor: "bg-warning-muted" },
};

const DashboardScreen = () => {
  const navigate = useNavigate();
  const [attendanceStatus] = useState<AttendanceStatus>("not_marked");
  const [attendanceTime] = useState<string | null>(null);

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

  const isAttendanceWindowOpen = () => {
    const hour = currentDate.getHours();
    return hour >= 9 && hour < 18;
  };

  const canMarkAttendance = attendanceStatus === "not_marked" && isAttendanceWindowOpen();

  const handleMarkAttendance = () => {
    navigate("/attendance-processing");
  };

  const statusConfig = statusConfigs[attendanceStatus];

  return (
    <MobileContainer>
      <div className="flex flex-col min-h-full pb-20">
        {/* Header */}
        <div className="px-6 pt-8 pb-4 bg-primary text-primary-foreground rounded-b-3xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary-foreground/20 rounded-full flex items-center justify-center">
              <span className="text-xl font-semibold">R</span>
            </div>
            <div>
              <p className="text-primary-foreground/80 text-sm">{getGreeting()},</p>
              <h1 className="text-xl font-semibold">Rahul Kumar</h1>
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
          <div className="card-elevated p-4 animate-fade-in-up">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-caption">Current Office</p>
                <p className="font-medium text-foreground">Nexon Pvt Ltd – Head Office</p>
              </div>
            </div>
          </div>

          {/* Attendance Status Card */}
          <div className="card-elevated p-5 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-heading">Today's Attendance</h2>
              <span className={`status-badge ${statusConfig.bgColor} ${statusConfig.color}`}>
                {attendanceStatus !== "not_marked" && <CheckCircle2 className="w-4 h-4" />}
                {statusConfig.label}
              </span>
            </div>

            {attendanceTime && (
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Marked at {attendanceTime}</span>
              </div>
            )}

            {/* Verification Status */}
            <div className="space-y-3 pt-3 border-t border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-success-muted rounded-full flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-success" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-xs text-muted-foreground">Office premises</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-success-muted rounded-full flex items-center justify-center">
                  <Wifi className="w-4 h-4 text-success" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Office Wi-Fi</p>
                  <p className="text-xs text-muted-foreground">Connected</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
            </div>
          </div>

          {/* Info Message */}
          <div className="bg-accent rounded-xl p-4 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <p className="text-sm text-accent-foreground">
              {attendanceStatus === "not_marked" ? (
                isAttendanceWindowOpen() ? (
                  <>
                    <span className="font-medium">Ready to mark attendance.</span>
                    <br />
                    <span className="text-muted-foreground">Attendance window closes at 6:00 PM</span>
                  </>
                ) : (
                  <>
                    <span className="font-medium">Attendance window is closed.</span>
                    <br />
                    <span className="text-muted-foreground">Opens at 9:00 AM</span>
                  </>
                )
              ) : (
                <>
                  <span className="font-medium">Attendance recorded successfully.</span>
                  <br />
                  <span className="text-muted-foreground">Your attendance for today has been marked.</span>
                </>
              )}
            </p>
          </div>

          {/* Mark Attendance Button */}
          <div className="pt-2 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <button
              onClick={handleMarkAttendance}
              disabled={!canMarkAttendance}
              className="btn-primary-large"
            >
              {attendanceStatus !== "not_marked" ? (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Attendance Marked
                </span>
              ) : (
                "Mark Attendance"
              )}
            </button>

            {!canMarkAttendance && attendanceStatus === "not_marked" && (
              <p className="text-center text-xs text-muted-foreground mt-3">
                Attendance window is currently closed
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
