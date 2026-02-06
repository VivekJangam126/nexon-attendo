import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  MapPinOff, 
  WifiOff, 
  MapPin, 
  Clock, 
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  RotateCcw
} from "lucide-react";
import MobileContainer from "@/components/MobileContainer";

type ErrorType = "location_denied" | "no_wifi" | "outside_office" | "window_closed" | "already_marked";

interface ErrorConfig {
  icon: typeof MapPinOff;
  title: string;
  description: string;
  action: string;
  actionButton: "retry" | "back" | "none";
}

const errorConfigs: Record<ErrorType, ErrorConfig> = {
  location_denied: {
    icon: MapPinOff,
    title: "Location Access Required",
    description: "We need access to your location to verify you're at the office. Please enable location permission in your device settings and try again.",
    action: "Go to Settings → Apps → Nexon Attendance → Permissions → Location → Allow",
    actionButton: "retry",
  },
  no_wifi: {
    icon: WifiOff,
    title: "Office Wi-Fi Not Detected",
    description: "You need to be connected to the office Wi-Fi network to mark attendance. Please connect to the office network and try again.",
    action: "Connect to 'Nexon-Office' Wi-Fi network",
    actionButton: "retry",
  },
  outside_office: {
    icon: MapPin,
    title: "Outside Office Premises",
    description: "You appear to be outside the office location. Attendance can only be marked when you're within the office premises.",
    action: "Please go to the office and try again",
    actionButton: "back",
  },
  window_closed: {
    icon: Clock,
    title: "Attendance Window Closed",
    description: "The attendance window for today is now closed. You can mark attendance between 9:00 AM and 6:00 PM.",
    action: "Try again during the attendance window",
    actionButton: "back",
  },
  already_marked: {
    icon: CheckCircle2,
    title: "Already Marked",
    description: "Your attendance for today has already been recorded. You can view your attendance history for more details.",
    action: "Check your attendance history",
    actionButton: "back",
  },
};

const AttendanceErrorScreen = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const errorType = (searchParams.get("type") as ErrorType) || "location_denied";

  const config = errorConfigs[errorType];
  const Icon = config.icon;

  const handleRetry = () => {
    navigate("/attendance-processing");
  };

  const handleBack = () => {
    navigate("/dashboard");
  };

  return (
    <MobileContainer>
      <div className="flex flex-col items-center justify-center h-full min-h-[800px] px-8">
        {/* Error Icon */}
        <div className="relative mb-8 animate-scale-in">
          <div className={`w-28 h-28 rounded-full flex items-center justify-center ${
            errorType === "already_marked" 
              ? "bg-success-muted" 
              : "bg-warning-muted"
          }`}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
              errorType === "already_marked" 
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
