import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Wifi, ShieldCheck, Loader2 } from "lucide-react";
import MobileContainer from "@/components/MobileContainer";

type ProcessingStep = "location" | "wifi" | "verifying" | "complete";

const steps: { key: ProcessingStep; icon: typeof MapPin; label: string; description: string }[] = [
  { key: "location", icon: MapPin, label: "Checking your location", description: "Verifying you're at the office" },
  { key: "wifi", icon: Wifi, label: "Verifying office Wi-Fi", description: "Confirming network connection" },
  { key: "verifying", icon: ShieldCheck, label: "Recording attendance", description: "Saving your attendance record" },
];

const AttendanceProcessingScreen = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    const processSteps = async () => {
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(i);
        await new Promise((resolve) => setTimeout(resolve, 1200));
        setCompletedSteps((prev) => [...prev, i]);
      }
      // Navigate to success after all steps complete
      setTimeout(() => {
        navigate("/attendance-success");
      }, 500);
    };

    processSteps();
  }, [navigate]);

  return (
    <MobileContainer>
      <div className="flex flex-col items-center justify-center h-full min-h-[800px] px-8">
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
