import { useState } from "react";
import { Camera, User, CheckCircle2 } from "lucide-react";
import LiveCameraCapture from "@/components/face/LiveCameraCapture";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface AdminFaceRegistrationProps {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  onRegistrationComplete: () => void;
}

const AdminFaceRegistration = ({
  employeeId,
  employeeName,
  employeeEmail,
  onRegistrationComplete
}: AdminFaceRegistrationProps) => {
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleCameraCapture = async (success: boolean, photos: string[]) => {
    if (!success || photos.length === 0) {
      toast({
        title: "Face Registration Failed",
        description: "No photos were captured. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsRegistering(true);
    
    try {
      console.log(`🚀 Admin registering face with ${photos.length} photos for ${employeeName}`);
      
      // Call API to register face with ML service using burst mode
      const response = await fetch('/api/face-recognition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'register',
          employee_id: employeeId,
          face_photos: photos,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Face Registered Successfully",
          description: `${employeeName} can now use face verification for attendance with ${result.faces_detected || photos.length} photos registered.`,
        });
        onRegistrationComplete();
      } else {
        toast({
          title: "Face Registration Failed",
          description: result.message || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Face registration error:', error);
      toast({
        title: "Registration Error",
        description: "Failed to register face. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-medium">{employeeName}</p>
          <p className="text-sm text-muted-foreground">{employeeEmail}</p>
        </div>
      </div>

      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Camera className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Face Registration Required</h3>
          <p className="text-sm text-muted-foreground mt-1">
            This employee needs face registration for attendance verification
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Instructions:</h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Ask the employee to sit in front of the camera</li>
            <li>• Ensure good lighting and clear face visibility</li>
            <li>• The system will capture 50 photos in 10 seconds</li>
            <li>• Employee should move head naturally in small circle</li>
            <li>• High accuracy registration for secure verification</li>
          </ul>
        </div>

        <Button
          onClick={() => setShowCameraCapture(true)}
          disabled={isRegistering}
          className="w-full"
          size="lg"
        >
          {isRegistering ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Registering Face...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Start Face Registration
            </span>
          )}
        </Button>
      </div>

      {/* Live Camera Capture Modal */}
      <LiveCameraCapture
        isOpen={showCameraCapture}
        onClose={() => setShowCameraCapture(false)}
        onComplete={handleCameraCapture}
        title={`Face Registration - ${employeeName}`}
        description="Capture 50 photos for secure attendance verification"
        captureCount={50}
      />
    </div>
  );
};

export default AdminFaceRegistration;