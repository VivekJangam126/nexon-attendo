import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MapPin, ShieldCheck, Loader2 } from "lucide-react";
import MobileContainer from "@/components/MobileContainer";
import { useAuth } from "@/hooks/useAuth";
import { attendanceService, attendanceSettingsService } from "@server";

type ProcessingStep = "location" | "verifying" | "complete";

const steps: { key: ProcessingStep; icon: typeof MapPin; label: string; description: string }[] = [
  { key: "location", icon: MapPin, label: "Checking your location", description: "Verifying GPS coordinates" },
  { key: "verifying", icon: ShieldCheck, label: "Recording attendance", description: "Saving your attendance record" },
];

const AttendanceProcessingScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    const processAttendance = async () => {
      if (!profile) {
        navigate("/login");
        return;
      }

      try {
        // Always try to get GPS location (for record-keeping)
        // But only validate if strict mode is enabled
        let latitude: number | undefined;
        let longitude: number | undefined;

        // Step 1: Request GPS location
        setCurrentStep(0);
        console.log('📍 Requesting GPS location...');
        
        if ('geolocation' in navigator) {
          try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
              });
            });
            
            latitude = position.coords.latitude;
            longitude = position.coords.longitude;
            console.log('✅ GPS location obtained:', latitude, longitude);
          } catch (gpsError) {
            console.log('⚠️  GPS error:', gpsError);
            // GPS denied or failed
            // If strict mode is enabled, this will be caught by backend validation
            // If strict mode is disabled, we'll proceed without GPS
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 800));
        setCompletedSteps((prev) => [...prev, 0]);

        // Check strict mode
        const { strictMode } = await attendanceSettingsService.getStrictMode();
        console.log('🔒 Strict mode:', strictMode);

        // Step 2: Mark attendance
        setCurrentStep(1);
        console.log('💾 Marking attendance...');

        const result = await attendanceService.markAttendance(
          profile,
          latitude,
          longitude
        );
        
        await new Promise((resolve) => setTimeout(resolve, 500));
        setCompletedSteps((prev) => [...prev, 1]);

        // Navigate based on result
        setTimeout(() => {
          if (result.success) {
            navigate("/attendance-success", { 
              state: { 
                attendance: result.attendance 
              } 
            });
          } else {
            navigate("/attendance-error", { 
              state: { 
                error: 'error' in result ? result.error : 'Failed to mark attendance',
                errorCode: 'errorCode' in result ? result.errorCode : 'VALIDATION_FAILED'
              } 
            });
          }
        }, 500);
      } catch (error) {
        console.error('❌ Processing error:', error);
        navigate("/attendance-error", { 
          state: { 
            error: 'Failed to process attendance',
            errorCode: 'VALIDATION_FAILED'
          } 
        });
      }
    };

    processAttendance();
  }, [navigate, profile]);

  return (
    <MobileContainer>
      <div className="flex flex-col items-center justify-center min-h-full px-8">
        {/* Processing Animation */}
        <div className="relative mb-12">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center animate-pulse-gentle">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          </div>
          {/* Pulse rings */}
          <div className="absolute inset-0 w-24 h-24 bg-primary/10 rounded-full animate-ping" style={{ animationDuration: "2s" }} />
        </div>

        {/* Title */}
        <h1 className="text-title text-center mb-2">Marking Attendance</h1>
        <p className="text-body-secondary text-center mb-12">Please wait while we verify your attendance</p>

        {/* Steps */}
        <div className="w-full max-w-sm space-y-4">
          {steps.map((step, index) => {
            const isComplete = completedSteps.includes(index);
            const isCurrent = currentStep === index && !isComplete;
            const Icon = step.icon;

            return (
              <div
                key={step.key}
                className={`card-elevated p-4 transition-all duration-300 ${
                  isCurrent ? "ring-2 ring-primary/30" : ""
                } ${isComplete ? "bg-success-muted border-success/20" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isComplete
                        ? "bg-success"
                        : isCurrent
                        ? "bg-primary"
                        : "bg-muted"
                    }`}
                  >
                    {isCurrent ? (
                      <Loader2 className="w-5 h-5 text-primary-foreground animate-spin" />
                    ) : (
                      <Icon
                        className={`w-5 h-5 ${
                          isComplete ? "text-success-foreground" : "text-muted-foreground"
                        }`}
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <p
                      className={`font-medium ${
                        isComplete ? "text-success" : isCurrent ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                  {isComplete && (
                    <div className="w-6 h-6 bg-success rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-success-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Note */}
        <p className="text-caption text-center mt-8 max-w-xs">
          Please don't close the app while we process your attendance
        </p>
      </div>
    </MobileContainer>
  );
};

export default AttendanceProcessingScreen;
