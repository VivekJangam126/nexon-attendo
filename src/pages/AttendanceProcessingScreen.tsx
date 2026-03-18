import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, ShieldCheck, Loader2 } from "lucide-react";
import MobileContainer from "@/components/MobileContainer";
import { useAuth } from "@/hooks/useAuth";
import { attendanceService } from "@server";
import { getDeviceFingerprint, getUserAgent } from "@/utils/device-fingerprint";
import { toast } from "@/hooks/use-toast";

type ProcessingStep = "location" | "verifying" | "complete";

const AttendanceProcessingScreen = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [locationData, setLocationData] = useState<{ latitude?: number; longitude?: number }>({});

  const steps = [
    { key: "location" as ProcessingStep, icon: MapPin, label: "Checking your location", description: "Verifying GPS coordinates" },
    { key: "verifying" as ProcessingStep, icon: ShieldCheck, label: "Recording attendance", description: "Saving your attendance record" },
  ];

  useEffect(() => {
    const processAttendance = async () => {
      if (!profile) {
        navigate("/login");
        return;
      }

      try {
        // Step 1: Get location
        setCurrentStep(0);
        await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay for UX

        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error("Geolocation is not supported"));
            return;
          }

          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
          );
        });

        const { latitude, longitude } = position.coords;
        setLocationData({ latitude, longitude });
        setCompletedSteps([0]);

        // Step 2: Mark attendance
        setCurrentStep(1);
        await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay for UX

        const deviceId = await getDeviceFingerprint();
        const userAgent = getUserAgent();

        const result = await attendanceService.markAttendance(
          profile,
          latitude,
          longitude,
          undefined, // ipAddress
          deviceId,
          userAgent
        );

        if (result.success) {
          setCompletedSteps([0, 1]);
          
          // Navigate to success screen
          setTimeout(() => {
            navigate("/attendance-success", {
              state: {
                attendance: result.attendance,
                location: { latitude, longitude }
              }
            });
          }, 1000);
        } else {
          // Navigate to error screen
          navigate("/attendance-error", {
            state: {
              error: result.error,
              errorCode: result.errorCode
            }
          });
        }
      } catch (error: any) {
        console.error("Attendance processing error:", error);
        
        let errorMessage = "Failed to mark attendance";
        let errorCode = "UNKNOWN_ERROR";

        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = "Location permission denied. Please enable location access and try again.";
          errorCode = "LOCATION_PERMISSION_DENIED";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = "Location information is unavailable. Please check your GPS settings.";
          errorCode = "LOCATION_UNAVAILABLE";
        } else if (error.code === error.TIMEOUT) {
          errorMessage = "Location request timed out. Please try again.";
          errorCode = "LOCATION_TIMEOUT";
        }

        navigate("/attendance-error", {
          state: {
            error: errorMessage,
            errorCode: errorCode
          }
        });
      }
    };

    processAttendance();
  }, [profile, navigate]);

  const getStepStatus = (stepIndex: number) => {
    if (completedSteps.includes(stepIndex)) return "completed";
    if (currentStep === stepIndex) return "current";
    return "pending";
  };

  return (
    <MobileContainer>
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <h1 className="text-xl font-semibold mb-2">Processing Attendance</h1>
            <p className="text-sm text-muted-foreground">
              Please wait while we verify your attendance
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => {
              const status = getStepStatus(index);
              const Icon = step.icon;

              return (
                <div key={step.key} className="flex items-center gap-4">
                  {/* Step Icon */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    status === "completed" 
                      ? "bg-success text-success-foreground" 
                      : status === "current"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {status === "completed" ? (
                      <ShieldCheck className="w-6 h-6" />
                    ) : status === "current" ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1">
                    <h3 className={`font-medium ${
                      status === "completed" 
                        ? "text-success" 
                        : status === "current"
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}>
                      {step.label}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>

                  {/* Status Indicator */}
                  <div className={`w-3 h-3 rounded-full ${
                    status === "completed" 
                      ? "bg-success" 
                      : status === "current"
                      ? "bg-primary animate-pulse"
                      : "bg-muted"
                  }`} />
                </div>
              );
            })}
          </div>

          {/* Location Info */}
          {locationData.latitude && locationData.longitude && (
            <div className="mt-8 p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Location Verified</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Coordinates: {locationData.latitude.toFixed(6)}, {locationData.longitude.toFixed(6)}
              </p>
            </div>
          )}

          {/* Progress Bar */}
          <div className="mt-8">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>Progress</span>
              <span>{Math.round(((completedSteps.length) / steps.length) * 100)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((completedSteps.length) / steps.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </MobileContainer>
  );
};

export default AttendanceProcessingScreen;