import { useState, useRef, useEffect } from "react";
import { Camera, X, CheckCircle2, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface LiveCameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (success: boolean, photos: string[]) => void;
  title?: string;
  description?: string;
  captureCount?: number;
}

type CaptureStep = 'camera' | 'burst' | 'processing' | 'complete';

const LiveCameraCapture = ({ 
  isOpen, 
  onClose, 
  onComplete, 
  title = "Face Registration",
  description = "Register your face for secure attendance verification",
  captureCount = 50
}: LiveCameraCaptureProps) => {
  const [step, setStep] = useState<CaptureStep>('camera');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
      setCapturedPhotos([]);
      setProgress(0);
      setVideoLoading(true);
      
      console.log('📹 Starting camera...');
      
      // Check if camera permission is available
      const permissions = await navigator.permissions.query({ name: 'camera' as PermissionName });
      console.log('📹 Camera permission:', permissions.state);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: 'user',
          frameRate: { ideal: 30, min: 15 }
        }
      });
      
      console.log('📹 Media stream obtained:', {
        active: mediaStream.active,
        tracks: mediaStream.getVideoTracks().length
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          console.log('✅ Camera ready:', {
            width: videoRef.current?.videoWidth,
            height: videoRef.current?.videoHeight,
            readyState: videoRef.current?.readyState
          });
          setVideoLoading(false);
        };
        
        // Handle video playing
        videoRef.current.onplaying = () => {
          console.log('✅ Video playing');
          setVideoLoading(false);
        };
        
        // Handle video errors
        videoRef.current.onerror = (error) => {
          console.error('❌ Video error:', error);
          setError('Camera error occurred. Please try again.');
          setVideoLoading(false);
        };
        
        // Ensure video plays
        try {
          await videoRef.current.play();
          console.log('✅ Video playing');
        } catch (playError) {
          console.warn('⚠️ Video play warning:', playError);
          // This is often not critical, video might autoplay
        }
      }
    } catch (err) {
      console.error('❌ Camera access error:', err);
      setError(`Camera access denied: ${err instanceof Error ? err.message : 'Unknown error'}. Please allow camera permission and try again.`);
      setVideoLoading(false);
    }
  };

  const cleanup = () => {
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    setStep('camera');
    setCapturedPhotos([]);
    setProgress(0);
    setError(null);
    setIsCapturing(false);
    setVideoLoading(true);
  };

  const startBurstCapture = async () => {
    console.log('🚀 User clicked Start Registration');
    
    if (!videoRef.current || !canvasRef.current) {
      console.log('❌ Missing refs:', { video: !!videoRef.current, canvas: !!canvasRef.current });
      setError('Camera not ready. Please try again.');
      return;
    }

    if (isCapturing) {
      console.log('❌ Already capturing');
      return;
    }

    const video = videoRef.current;
    console.log('📹 Video status:', {
      readyState: video.readyState,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      paused: video.paused,
      srcObject: !!video.srcObject
    });

    if (video.readyState < 2 || video.videoWidth === 0) {
      console.log('⚠️ Video not ready');
      setError('Camera not ready. Please wait and try again.');
      return;
    }

    console.log(`✅ Starting burst capture: ${captureCount} photos`);
    setIsCapturing(true);
    setStep('burst');
    setProgress(0);
    setCapturedPhotos([]);
    setError(null);

    // CRITICAL: Keep the video stream active and visible during burst capture
    // Do NOT change the video srcObject or any video properties
    console.log('🎥 Keeping video stream active during capture');

    let successfulCaptures = 0;
    const capturedImages: string[] = [];
    
    // Capture photos one by one with delay but keep video running
    for (let i = 0; i < captureCount; i++) {
      try {
        // Small delay between captures but keep it fast
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
        }
        
        // Manual photo capture without touching video stream
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');
        
        if (canvas && context && video.videoWidth > 0 && video.videoHeight > 0) {
          // Set canvas size to match video
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          // Draw current video frame to canvas
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Get image data
          const imageData = canvas.toDataURL('image/jpeg', 0.9);
          if (imageData && imageData.length > 1000) {
            capturedImages.push(imageData);
            successfulCaptures++;
            
            // Update state with new photo
            setCapturedPhotos(prev => [...prev, imageData]);
            
            const progress = (successfulCaptures / captureCount) * 100;
            setProgress(progress);
            console.log(`📸 Captured ${successfulCaptures}/${captureCount} (${progress.toFixed(1)}%)`);
          } else {
            console.warn(`⚠️ Invalid image data for photo ${i + 1}`);
          }
        } else {
          console.warn(`⚠️ Canvas or video not ready for photo ${i + 1}`);
        }
        
      } catch (error) {
        console.error(`❌ Error capturing photo ${i + 1}:`, error);
      }
    }
    
    console.log(`🎉 Burst complete! ${successfulCaptures}/${captureCount} photos captured`);
    console.log(`📊 Captured images array length: ${capturedImages.length}`);
    
    if (successfulCaptures >= 10) {
      setProgress(100);
      setStep('processing');
      setIsCapturing(false);
      
      // Debug: Log what we're about to send
      console.log(`🎯 Sending ${capturedImages.length} photos to parent component`);
      console.log(`📊 Photo sizes:`, capturedImages.map((img, i) => `${i+1}: ${img.length} bytes`));
      
      setTimeout(() => {
        setStep('complete');
        // Use the local array instead of state (which might be stale)
        onComplete(true, capturedImages);
      }, 1000);
    } else {
      setIsCapturing(false);
      setStep('camera');
      setError(`Only captured ${successfulCaptures} photos. Please try again with better lighting.`);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.warn('⚠️ Video or canvas ref not available');
      return false;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      console.warn('⚠️ Canvas context not available');
      return false;
    }

    // Check if video is ready and has dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.warn('⚠️ Video dimensions not available:', {
        width: video.videoWidth,
        height: video.videoHeight,
        readyState: video.readyState
      });
      return false;
    }

    try {
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data as base64 with high quality
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      
      // Validate that we got actual image data
      if (imageData && imageData.length > 1000) { // Basic validation
        setCapturedPhotos(prev => {
          const newPhotos = [...prev, imageData];
          console.log(`✅ Photo captured successfully! Total: ${newPhotos.length}`);
          return newPhotos;
        });
        return true;
      } else {
        console.warn('⚠️ Invalid image data captured, length:', imageData?.length || 0);
        return false;
      }
    } catch (error) {
      console.error('❌ Error capturing photo:', error);
      return false;
    }
  };

  const handleClose = () => {
    cleanup();
    onClose();
  };

  const renderCameraView = () => (
    <div className="space-y-4">
      <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-600">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ 
            backgroundColor: '#1f2937',
            minHeight: '300px',
            display: 'block',
            visibility: 'visible',
            opacity: 1
          }}
        />
        
        {/* Camera loading indicator */}
        {videoLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800/90 z-10">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white text-lg font-semibold">Initializing Camera...</p>
              <p className="text-white/60 text-sm">Please allow camera access</p>
            </div>
          </div>
        )}
        
        {/* Face detection circle overlay */}
        {!videoLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="w-48 h-48 border-4 border-primary rounded-full opacity-60 animate-pulse" />
          </div>
        )}
        
        {/* Instructions overlay */}
        {!videoLoading && (
          <div className="absolute bottom-4 left-4 right-4 text-center z-30">
            <div className="bg-black/80 rounded-lg p-4">
              <p className="text-white text-lg font-semibold mb-2">
                Position your face in the circle
              </p>
              <p className="text-white/80 text-sm">
                Make sure your face is clearly visible and well-lit
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center gap-3">
        <Button
          onClick={async () => {
            console.log('🚀 User clicked Start Registration');
            
            // Ensure video is ready before starting
            if (!videoRef.current || !stream) {
              console.log('❌ Video or stream not ready');
              setError('Camera not ready. Please wait a moment and try again.');
              return;
            }
            
            const video = videoRef.current;
            if (video.readyState < 2 || video.videoWidth === 0) {
              console.log('❌ Video not fully loaded');
              setError('Camera still loading. Please wait a moment and try again.');
              return;
            }
            
            console.log('✅ Video ready, starting burst capture');
            await startBurstCapture();
          }}
          disabled={!stream || isCapturing || videoLoading}
          className="px-8 py-3 text-lg flex items-center gap-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold"
        >
          <Camera className="w-6 h-6" />
          {isCapturing ? 'Capturing...' : videoLoading ? 'Camera Loading...' : 'Start Registration'}
        </Button>
        
        {/* Debug: Test ML Service directly */}
        <Button
          onClick={async () => {
            if (capturedPhotos.length === 0) {
              console.log('❌ No photos to test. Capture some photos first.');
              return;
            }
            
            console.log('🧪 Testing ML service with captured photo...');
            const testEmployeeId = 'test-direct-' + Date.now();
            
            try {
              const response = await fetch('http://localhost:5000/register-face', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  employee_id: testEmployeeId,
                  face_photos: capturedPhotos.slice(0, 5) // Test with first 5 photos
                })
              });
              
              const result = await response.json();
              console.log('🔬 ML Service Test Result:', {
                success: result.success,
                message: result.message,
                faces_detected: result.faces_detected,
                encoding_saved: result.encoding_saved
              });
              
              if (result.success) {
                console.log('✅ ML service can process your photos!');
              } else {
                console.log('❌ ML service rejected your photos:', result.message);
              }
            } catch (error) {
              console.error('❌ ML service test failed:', error);
            }
          }}
          disabled={capturedPhotos.length === 0}
          variant="secondary"
          className="px-4 py-3 text-sm"
        >
          Test ML Service
        </Button>
        <Button
          onClick={async () => {
            // Show current storage status
            try {
              const response = await fetch('http://localhost:5000/debug');
              const data = await response.json();
              console.log('📁 Current ML service storage:', data);
              
              if (data.storage_info && data.storage_info.employee_folders) {
                console.log('👥 Registered employees:');
                data.storage_info.employee_folders.forEach((emp: any) => {
                  console.log(`  - ${emp.employee_id}: ${emp.photo_count} photos`);
                });
              }
              
              alert(`Storage Status:\n- Total employees: ${data.storage_info?.total_employees || 0}\n- Total photos: ${data.storage_info?.total_photos || 0}\n\nCheck console for details.`);
            } catch (error) {
              console.error('❌ Failed to get storage status:', error);
              alert('Failed to get storage status. Check console.');
            }
          }}
          variant="outline"
          className="px-4 py-3 text-sm"
        >
          Check Photo Storage
        </Button>
      </div>
    </div>
  );

  const renderBurstView = () => (
    <div className="space-y-6">
      <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden border-2 border-green-500">
        {/* Use the SAME video element - do NOT create a new one */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ 
            backgroundColor: '#1f2937',
            minHeight: '300px',
            display: 'block',
            visibility: 'visible',
            opacity: 1
          }}
        />
        
        {/* Face detection circle overlay */}
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="w-48 h-48 border-4 border-green-400 rounded-full opacity-80 animate-pulse" />
          {/* Capture indicator */}
          <div className="absolute top-4 right-4 bg-red-500 w-4 h-4 rounded-full animate-pulse z-30" />
        </div>
        
        {/* Capture progress overlay */}
        <div className="absolute top-4 left-4 bg-black/80 rounded-lg px-3 py-2 z-30">
          <p className="text-white text-sm font-semibold">
            📸 Capturing... {Math.round(progress)}%
          </p>
        </div>
        
        {/* Instructions overlay */}
        <div className="absolute bottom-4 left-4 right-4 text-center z-30">
          <div className="bg-black/80 rounded-lg p-4">
            <p className="text-white text-lg font-semibold mb-2">
              Move your head naturally in a small circle
            </p>
            <p className="text-white/80 text-sm">
              Keep your face in the circle while moving slowly
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Capturing face data...</span>
          <span>{Math.round(progress)}% ({capturedPhotos.length}/{captureCount})</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-green-500 h-3 rounded-full transition-all duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Success indicator */}
        <div className="text-xs text-green-600 text-center font-medium">
          {capturedPhotos.length > 0 && (
            <span>✅ {capturedPhotos.length} photos captured successfully - Keep moving your head!</span>
          )}
        </div>
      </div>
    </div>
  );

  const renderProcessingView = () => (
    <div className="text-center py-8">
      <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">Processing Face Data</h3>
      <p className="text-muted-foreground">
        Analyzing and storing your facial features...
      </p>
    </div>
  );

  const renderCompleteView = () => (
    <div className="text-center py-8">
      <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">Registration Complete!</h3>
      <p className="text-muted-foreground mb-6">
        Your face has been registered successfully for secure attendance verification.
      </p>
      <Button onClick={handleClose} className="px-6">
        Done
      </Button>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Single video element used for all steps */}
          <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-600 mb-4">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ 
                backgroundColor: '#1f2937',
                minHeight: '300px',
                display: 'block',
                visibility: 'visible',
                opacity: 1
              }}
            />
            
            {/* Camera loading indicator */}
            {videoLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800/90 z-10">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-white text-lg font-semibold">Initializing Camera...</p>
                  <p className="text-white/60 text-sm">Please allow camera access</p>
                </div>
              </div>
            )}
            
            {/* Face detection circle overlay - show for camera and burst */}
            {!videoLoading && (step === 'camera' || step === 'burst') && (
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <div className={`w-48 h-48 border-4 rounded-full opacity-80 animate-pulse ${
                  step === 'burst' ? 'border-green-400' : 'border-primary'
                }`} />
                {/* Capture indicator for burst mode */}
                {step === 'burst' && (
                  <div className="absolute top-4 right-4 bg-red-500 w-4 h-4 rounded-full animate-pulse z-30" />
                )}
              </div>
            )}
            
            {/* Capture progress overlay for burst mode */}
            {step === 'burst' && (
              <div className="absolute top-4 left-4 bg-black/80 rounded-lg px-3 py-2 z-30">
                <p className="text-white text-sm font-semibold">
                  📸 Capturing... {Math.round(progress)}%
                </p>
              </div>
            )}
            
            {/* Instructions overlay */}
            {!videoLoading && (step === 'camera' || step === 'burst') && (
              <div className="absolute bottom-4 left-4 right-4 text-center z-30">
                <div className="bg-black/80 rounded-lg p-4">
                  {step === 'camera' ? (
                    <>
                      <p className="text-white text-lg font-semibold mb-2">
                        Position your face in the circle
                      </p>
                      <p className="text-white/80 text-sm">
                        Make sure your face is clearly visible and well-lit
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-white text-lg font-semibold mb-2">
                        Move your head naturally in a small circle
                      </p>
                      <p className="text-white/80 text-sm">
                        Keep your face in the circle while moving slowly
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Step-specific content */}
          {step === 'camera' && (
            <div className="flex justify-center gap-3">
              <Button
                onClick={async () => {
                  console.log('🚀 User clicked Start Registration');
                  
                  // Ensure video is ready before starting
                  if (!videoRef.current || !stream) {
                    console.log('❌ Video or stream not ready');
                    setError('Camera not ready. Please wait a moment and try again.');
                    return;
                  }
                  
                  const video = videoRef.current;
                  if (video.readyState < 2 || video.videoWidth === 0) {
                    console.log('❌ Video not fully loaded');
                    setError('Camera still loading. Please wait a moment and try again.');
                    return;
                  }
                  
                  console.log('✅ Video ready, starting burst capture');
                  await startBurstCapture();
                }}
                disabled={!stream || isCapturing || videoLoading}
                className="px-8 py-3 text-lg flex items-center gap-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold"
              >
                <Camera className="w-6 h-6" />
                {isCapturing ? 'Capturing...' : videoLoading ? 'Camera Loading...' : 'Start Registration'}
              </Button>
              
              {/* Debug buttons */}
              <Button
                onClick={async () => {
                  console.log('🧪 Testing ML service with captured photo...');
                  const testEmployeeId = 'test-direct-' + Date.now();
                  
                  try {
                    const response = await fetch('http://localhost:5000/register-face', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        employee_id: testEmployeeId,
                        face_photos: capturedPhotos.slice(0, 5) // Test with first 5 photos
                      })
                    });
                    
                    const result = await response.json();
                    console.log('🔬 ML Service Test Result:', {
                      success: result.success,
                      message: result.message,
                      faces_detected: result.faces_detected,
                      encoding_saved: result.encoding_saved
                    });
                    
                    if (result.success) {
                      console.log('✅ ML service can process your photos!');
                    } else {
                      console.log('❌ ML service rejected your photos:', result.message);
                    }
                  } catch (error) {
                    console.error('❌ ML service test failed:', error);
                  }
                }}
                disabled={capturedPhotos.length === 0}
                variant="secondary"
                className="px-4 py-3 text-sm"
              >
                Test ML Service
              </Button>
              
              <Button
                onClick={async () => {
                  // Show current storage status
                  try {
                    const response = await fetch('http://localhost:5000/debug');
                    const data = await response.json();
                    console.log('📁 Current ML service storage:', data);
                    
                    if (data.storage_info && data.storage_info.employee_folders) {
                      console.log('👥 Registered employees:');
                      data.storage_info.employee_folders.forEach((emp: any) => {
                        console.log(`  - ${emp.employee_id}: ${emp.photo_count} photos`);
                      });
                    }
                    
                    alert(`Storage Status:\n- Total employees: ${data.storage_info?.total_employees || 0}\n- Total photos: ${data.storage_info?.total_photos || 0}\n\nCheck console for details.`);
                  } catch (error) {
                    console.error('❌ Failed to get storage status:', error);
                    alert('Failed to get storage status. Check console.');
                  }
                }}
                variant="outline"
                className="px-4 py-3 text-sm"
              >
                Check Photo Storage
              </Button>
            </div>
          )}

          {step === 'burst' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Capturing face data...</span>
                <span>{Math.round(progress)}% ({capturedPhotos.length}/{captureCount})</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all duration-200 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {/* Success indicator */}
              <div className="text-xs text-green-600 text-center font-medium">
                {capturedPhotos.length > 0 && (
                  <span>✅ {capturedPhotos.length} photos captured successfully - Keep moving your head!</span>
                )}
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Processing Face Data</h3>
              <p className="text-muted-foreground">
                Analyzing and storing your facial features...
              </p>
            </div>
          )}

          {step === 'complete' && (
            <div className="text-center py-8">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Registration Complete!</h3>
              <p className="text-muted-foreground mb-6">
                Your face has been registered successfully for secure attendance verification.
              </p>
              <Button onClick={handleClose} className="px-6">
                Done
              </Button>
            </div>
          )}
        </div>

        {/* Hidden canvas for image capture */}
        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
};

export default LiveCameraCapture;