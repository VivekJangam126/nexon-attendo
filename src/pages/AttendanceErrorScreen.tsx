import { useNavigate, useLocation } from "react-router-dom";
import { 
  MapPinOff, 
  MapPin, 
  Clock, 
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  RotateCcw,
  XCircle,
  UserX,
  Building2
} from "lucide-react";
import MobileContainer from "@/components/MobileContainer";
import type { AttendanceErrorCode } from "@server";

const AttendanceErrorScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const error = location.state?.error as string | undefined;
  const errorCode = location.state?.errorCode as AttendanceErrorCode | undefined;

  console.log('📍 AttendanceErrorScreen mounted:', { error, errorCode });

  const getErrorConfig = (): {
    icon: typeof MapPinOff | typeof MapPin | typeof Clock | typeof CheckCircle2 | typeof AlertTriangle | typeof XCircle | typeof UserX | typeof Building2;
    title: string;
    description: string;
    action: string;
    actionButton: "retry" | "back";
    warning?: string;
  } => {
    // Check if error message contains "previous day" and "check-out"
    const errorLower = error?.toLowerCase() || '';
    const isPreviousDayCheckoutError = errorLower.includes('previous day') && 
                                       errorLower.includes('check-out');
    
    console.log('🔍 Error Screen Debug:', { 
      error, 
      errorLower, 
      isPreviousDayCheckoutError,
      errorCode 
    });
    
    if (isPreviousDayCheckoutError) {
      console.log('✅ Showing previous day checkout error message');
      return {
        icon: Clock,
        title: "Previous Day Checkout Pending",
        description: "Your previous day's attendance checkout is pending. This might be due to incorrect device date/time settings.",
        action: "Please ensure your device date and time are correct and synced with network time. If this is a genuine issue, contact admin to resolve the previous day's checkout.",
        actionButton: "back" as const,
        warning: "⚠️ Make sure your device time is synced with network time",
      };
    }

    switch (errorCode) {
      case "GPS_REQUIRED":
        return {
          icon: MapPinOff,
          title: "Location Required",
          description: "Location permission is required to mark attendance.",
          action: "Enable location services and grant permission to continue",
          actionButton: "retry" as const,
        };
      case "OUTSIDE_OFFICE_LOCATION":
        return {
          icon: MapPin,
          title: "Outside Office Premises",
          description: error || "You are not inside office premises. Attendance can only be marked from office location.",
          action: "Please come to office to mark attendance",
          actionButton: "back" as const,
        };
      case "UNAUTHORIZED":
        return {
          icon: UserX,
          title: "Not Authenticated",
          description: "You need to be logged in to mark attendance.",
          action: "Please log in and try again",
          actionButton: "back" as const,
        };
      case "NOT_EMPLOYEE":
        return {
          icon: UserX,
          title: "Admin Account",
          description: "Admins cannot mark attendance. Only employees can mark their attendance.",
          action: "This feature is for employees only",
          actionButton: "back" as const,
        };
      case "ACCOUNT_NOT_ACTIVE":
        return {
          icon: XCircle,
          title: "Account Not Active",
          description: error || "Your account is not active. Please contact admin for approval.",
          action: "Wait for admin approval or contact HR",
          actionButton: "back" as const,
        };
      case "NO_OFFICE_ASSIGNED":
        return {
          icon: Building2,
          title: "No Office Assigned",
          description: "You don't have an office location assigned. Please contact admin.",
          action: "Contact HR to assign your office location",
          actionButton: "back" as const,
        };
      case "NO_SHIFT_ASSIGNED":
        return {
          icon: Clock,
          title: "No Shift Assigned",
          description: "Your shift has not been assigned yet. Please contact admin to assign your shift (Morning or Evening).",
          action: "Contact HR to get your shift assignment",
          actionButton: "back" as const,
        };
      case "ATTENDANCE_CLOSED":
        return {
          icon: Clock,
          title: "Attendance Window Closed",
          description: error || "Attendance is currently closed. Please check attendance timings.",
          action: "Try again during the attendance window",
          actionButton: "back" as const,
        };
      case "ATTENDANCE_ALREADY_MARKED":
        return {
          icon: CheckCircle2,
          title: "Already Marked",
          description: "Your attendance for today has already been recorded.",
          action: "Check your attendance history for details",
          actionButton: "back" as const,
        };
      case "VALIDATION_FAILED":
      default:
        return {
          icon: AlertTriangle,
          title: "Attendance Failed",
          description: error || "Failed to mark attendance. Please try again.",
          action: "If the problem persists, contact support",
          actionButton: "retry" as const,
        };
    }
  };

  const config = getErrorConfig();
  const Icon = config.icon;

  const handleRetry = () => {
    navigate("/attendance-processing");
  };

  const handleBack = () => {
    navigate("/dashboard");
  };

  return (
    <MobileContainer>
      <div className="flex flex-col items-center justify-center min-h-full px-8">
        {/* Error Icon */}
        <div className="relative mb-8 animate-scale-in">
          <div className={`w-28 h-28 rounded-full flex items-center justify-center ${
            errorCode === "ATTENDANCE_ALREADY_MARKED" 
              ? "bg-success-muted" 
              : "bg-warning-muted"
          }`}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
              errorCode === "ATTENDANCE_ALREADY_MARKED" 
                ? "bg-success" 
                : "bg-warning"
            }`}>
              <Icon className="w-10 h-10 text-white" />
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="text-center mb-6 animate-fade-in-up">
          <h1 className="text-display mb-2">{config.title}</h1>
          <p className="text-body-secondary max-w-sm">{config.description}</p>
        </div>

        {/* Action Card */}
        <div className="card-elevated w-full max-w-sm p-5 mb-8 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium mb-1">What to do</p>
              <p className="text-sm text-muted-foreground">{config.action}</p>
            </div>
          </div>
        </div>

        {/* Warning for date/time issues */}
        {config.warning && (
          <div className="bg-warning-muted border border-warning/20 rounded-xl p-4 mb-6 w-full max-w-sm animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
            <p className="text-sm text-center text-warning-foreground font-medium">
              {config.warning}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full max-w-sm space-y-3 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          {config.actionButton === "retry" && (
            <button
              onClick={handleRetry}
              className="btn-primary-large flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Try Again
            </button>
          )}

          <button
            onClick={handleBack}
            className={config.actionButton === "retry" ? "btn-secondary-large flex items-center justify-center gap-2" : "btn-primary-large flex items-center justify-center gap-2"}
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
        </div>

        {/* Help Note */}
        <p className="text-caption text-center mt-8 max-w-xs">
          If you continue to face issues, please contact HR support for assistance.
        </p>
      </div>
    </MobileContainer>
  );
};

export default AttendanceErrorScreen;
