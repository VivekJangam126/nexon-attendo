import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MapPin, ShieldCheck, Loader2, Camera } from "lucide-react";
import MobileContainer from "@/components/MobileContainer";
import FaceVerificationModal from "@/components/face/FaceVerificationModal";
import { useAuth } from "@/hooks/useAuth";
import { attendanceService, attendanceSettingsService } from "@server";
import { getDeviceFingerprint, getUserAgent } from "@/utils/device-fingerprint";
import { toast } from "@/hooks/use-toast";

type ProcessingStep = "location" | "face" | "verifying" | "complete";

const AttendanceProcessingScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [steps, setSteps] = useState<{ key: ProcessingStep; icon: typeof MapPin; label: string; description: string }[]>([]);
  const [showFaceVerification, setShowFaceVerification] = useState(false);
  const [locationData, setLocationData] = useState<{ latitude?: number; longitude?: number }>({});
  const [faceVerificationComplete, setFaceVerificationComplete] = useState(false);
  const [faceVerificationData, setFaceVerificationData] = useState<{ verified: boolean; confidence?: number }>({ verified: false });

  // Get face verification requirement from navigation state
  const requiresFaceVerification = location.state?.requiresFaceVerification || false;
  const employeeId = location.state?.employeeId;

  useEffect(() => {
    // Set up steps based on whether face verification is required
    const baseSteps = [
      { key: "location" as ProcessingStep, icon: MapPin, label: "Checking your location", description: "Verifying GPS coordinates" },
    ];

    if (requiresFaceVerification) {
      baseSteps.push({ key: "face" as ProcessingStep, icon: Camera, label: "Face verification", description: "Verifying your identity" });
    }

    baseSteps.push({ key: "verifying" as ProcessingStep, icon: ShieldCheck, label: "Recording attendance", description: "Saving your attendance record" });

    setSteps(baseSteps);
  }, [requiresFaceVerification]);

  useEffect(() => {
    const processAttendance = async () => {
      if (!profile) {
        navigate("/login");
        return;
      }

      try {
        // Step 1: Get GPS location first
        setCurrentStep(0);
        console.log('📍 Requesting GPS location...');
        
        let latitude: number | undefined;
        let longitude: number | undefined;

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
          }
        }

        setLocationData({ latitude, longitude });
        await new Promise((resolve) => setTimeout(resolve, 800));
        setCompletedSteps((prev) => [...prev, 0]);

        // Step 2: Face verification if required
        if (requiresFaceVerification && !faceVerificationComplete) {
          setCurrentStep(1);
          console.log('👤 Starting face verification...');
          setShowFaceVerification(true);
          return; // Wait for face verification to complete
        }

        // Step 3: Mark attendance (either after face verification or directly)
        await markAttendance(latitude, longitude);
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

    if (steps.length > 0) {
      processAttendance();
    }
  }, [navigate, profile, steps, requiresFaceVerification, faceVerificationComplete]);

  const handleFaceVerificationComplete = async (success: boolean, confidence?: number) => {
    setShowFaceVerification(false);
    setFaceVerificationData({ verified: success, confidence });
    
    if (success) {
      console.log('✅ Face verification successful:', confidence);
      toast({
        title: "Face Verified",
        description: `Identity confirmed (${confidence?.toFixed(1)}% confidence)`,
      });
      
      // Complete face verification step
      setCompletedSteps((prev) => [...prev, 1]);
      setFaceVerificationComplete(true);
      
      // Proceed to mark attendance
      await markAttendance(locationData.latitude, locationData.longitude);
    } else {
      console.log('❌ Face verification failed');
      toast({
        title: "Face Verification Failed",
        description: "Your face doesn't match the registered photo. Please try again or contact admin.",
        variant: "destructive",
      });
      
      // Go back to dashboard
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    }
  };

  const markAttendance = async (gpsLatitude?: number, gpsLongitude?: number) => {
    try {
      // Set current step to verifying
      const verifyingStepIndex = requiresFaceVerification ? 2 : 1;
      setCurrentStep(verifyingStepIndex);
      
      console.log('💾 Marking attendance...');
      console.log('📍 Using GPS coordinates:', gpsLatitude, gpsLongitude);

      // Get device fingerprint and user agent for tracking
      const deviceId = getDeviceFingerprint();
      const userAgent = getUserAgent();

      // Use passed coordinates or fallback to locationData
      const finalLatitude = gpsLatitude ?? locationData.latitude;
      const finalLongitude = gpsLongitude ?? locationData.longitude;

      console.log('📍 Final coordinates being sent:', finalLatitude, finalLongitude);

      const result = await attendanceService.markAttendance(
        profile!,
        finalLatitude,
        finalLongitude,
        undefined, // IP address will be extracted on backend
        deviceId,
        userAgent
      );
      
      await new Promise((resolve) => setTimeout(resolve, 500));
      setCompletedSteps((prev) => [...prev, verifyingStepIndex]);

      // Navigate based on result
      setTimeout(() => {
        if (result.success) {
          navigate("/attendance-success", { 
            state: { 
              attendance: result.attendance,
              faceVerified: faceVerificationData.verified,
              faceConfidence: faceVerificationData.confidence
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
      console.error('❌ Attendance marking error:', error);
      navigate("/attendance-error", { 
        state: { 
          error: 'Failed to mark attendance',
          errorCode: 'VALIDATION_FAILED'
        } 
      });
    }
  };

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
        <p className="text-body-secondary text-center mb-12">
          {faceVerificationData.verified ? "Face verified! Processing your attendance..." : "Please wait while we verify your attendance"}
        </p>

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

      {/* Face Verification Modal */}
      {showFaceVerification && employeeId && (
        <FaceVerificationModal
          isOpen={showFaceVerification}
          onClose={() => setShowFaceVerification(false)}
          onVerificationComplete={handleFaceVerificationComplete}
          employeeId={employeeId}
          employeeName={profile?.full_name || profile?.email || 'Employee'}
        />
      )}
    </MobileContainer>
  );
};

export default AttendanceProcessingScreen;
