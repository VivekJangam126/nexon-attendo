import { useState, useRef, useEffect } from "react";
import { Camera, X, CheckCircle2, AlertCircle, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FaceVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerificationComplete: (success: boolean, confidence?: number) => void;
  employeeName: string;
  employeeId: string;
}

type VerificationStep = 'camera' | 'capture' | 'processing' | 'result';

const FaceVerificationModal = ({ 
  isOpen, 
  onClose, 
  onVerificationComplete, 
  employeeName,
  employeeId
}: FaceVerificationModalProps) => {
  const [step, setStep] = useState<VerificationStep>('camera');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    confidence?: number;
    message: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Start camera when modal opens
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      cleanup();
    }
    
    return cleanup;
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setError(null);
      setStep('camera');
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Camera access denied. Please allow camera permission and try again.');
    }
  };

  const cleanup = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setStep('camera');
    setCapturedImage(null);
    setVerificationResult(null);
    setError(null);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data as base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageData);
    setStep('capture');
  };

  const processVerification = async () => {
    if (!capturedImage) return;

    setStep('processing');
    setError(null);

    try {
      // Call actual ML service for face verification
      const response = await fetch('/api/face-recognition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'verify',
          employee_id: employeeId,
          selfie: capturedImage,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Verification failed');
      }

      const verificationResult = {
        success: result.verified,
        confidence: Math.round(result.confidence * 100) / 100,
        message: result.verified 
          ? `Face verified successfully (${result.confidence.toFixed(1)}% confidence)`
          : `Face verification failed (${result.confidence.toFixed(1)}% confidence). Please try again.`
      };

      setVerificationResult(verificationResult);
      setStep('result');

      // Auto-close on success after 2 seconds
      if (verificationResult.success) {
        setTimeout(() => {
          onVerificationComplete(true, verificationResult.confidence);
          handleClose();
        }, 2000);
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('Verification failed. Please try again.');
      setStep('capture');
    }
  };

  const retryCapture = () => {
    setCapturedImage(null);
    setVerificationResult(null);
    setError(null);
    setStep('camera');
  };

  const retryVerification = () => {
    if (retryCount >= 2) {
      // Max 3 attempts
      setError('Maximum verification attempts reached. Please contact admin.');
      return;
    }
    
    setRetryCount(prev => prev + 1);
    retryCapture();
  };

  const handleClose = () => {
    cleanup();
    setRetryCount(0);
    onClose();
  };

  const renderCameraView = () => (
    <div className="space-y-4">
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        
        {/* Face detection overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-48 h-48 border-2 border-primary rounded-full animate-pulse opacity-50" />
        </div>
        
        {/* Instructions overlay */}
        <div className="absolute bottom-4 left-4 right-4 text-center">
          <p className="text-white text-sm bg-black/50 rounded px-3 py-1">
            Position your face in the circle
          </p>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={capturePhoto}
          disabled={!stream}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Camera className="w-5 h-5" />
          Capture Photo
        </button>
      </div>
    </div>
  );

  const renderCaptureView = () => (
    <div className="space-y-4">
      <div className="aspect-video bg-muted rounded-lg overflow-hidden">
        {capturedImage && (
          <img 
            src={capturedImage} 
            alt="Captured" 
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={retryCapture}
          className="flex-1 px-4 py-2 border border-border rounded-lg font-medium hover:bg-muted transition-colors flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Retake
        </button>
        <button
          onClick={processVerification}
          className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          Verify Face
        </button>
      </div>
    </div>
  );

  const renderProcessingView = () => (
    <div className="text-center py-8">
      <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">Verifying Identity</h3>
      <p className="text-muted-foreground">
        Analyzing facial features...
      </p>
    </div>
  );

  const renderResultView = () => {
    if (!verificationResult) return null;

    return (
      <div className="text-center py-8">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
          verificationResult.success 
            ? 'bg-green-100 text-green-600' 
            : 'bg-red-100 text-red-600'
        }`}>
          {verificationResult.success ? (
            <CheckCircle2 className="w-8 h-8" />
          ) : (
            <AlertCircle className="w-8 h-8" />
          )}
        </div>
        
        <h3 className={`text-lg font-semibold mb-2 ${
          verificationResult.success ? 'text-green-600' : 'text-red-600'
        }`}>
          {verificationResult.success ? 'Verification Successful' : 'Verification Failed'}
        </h3>
        
        <p className="text-muted-foreground mb-4">
          {verificationResult.message}
        </p>

        {verificationResult.confidence && (
          <div className="mb-4">
            <div className="text-sm text-muted-foreground mb-1">Confidence Score</div>
            <div className={`text-2xl font-bold ${
              verificationResult.success ? 'text-green-600' : 'text-red-600'
            }`}>
              {verificationResult.confidence}%
            </div>
          </div>
        )}

        {!verificationResult.success && retryCount < 2 && (
          <button
            onClick={retryVerification}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Try Again ({2 - retryCount} attempts left)
          </button>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Face Verification
          </DialogTitle>
          <DialogDescription>
            Verify your identity to mark attendance, {employeeName}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {step === 'camera' && renderCameraView()}
          {step === 'capture' && renderCaptureView()}
          {step === 'processing' && renderProcessingView()}
          {step === 'result' && renderResultView()}
        </div>

        {/* Hidden canvas for image capture */}
        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
};

export default FaceVerificationModal;