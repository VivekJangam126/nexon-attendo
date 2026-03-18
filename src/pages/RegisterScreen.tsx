import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Eye, EyeOff, AlertCircle, ArrowLeft, Camera, CheckCircle2 } from "lucide-react";
import MobileContainer from "@/components/MobileContainer";
import LiveCameraCapture from "@/components/face/LiveCameraCapture";
import { registrationService, officeService } from "@server";
import type { Office } from "@server";

const RegisterScreen = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    officeId: "",
    password: "",
    confirmPassword: "",
    roleType: "Employee" as 'Employee' | 'Intern' | 'Unpaid Intern' | 'Paid Intern',
    designation: "",
  });
  const [offices, setOffices] = useState<Office[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingOffices, setLoadingOffices] = useState(true);
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [faceRegistered, setFaceRegistered] = useState(false);

  // Fetch offices on mount
  useEffect(() => {
    const fetchOffices = async () => {
      const { offices: officeList, error: officeError } = await officeService.getActiveOffices();
      if (officeError) {
        setError("Failed to load offices. Please refresh the page.");
      } else {
        setOffices(officeList);
      }
      setLoadingOffices(false);
    };
    fetchOffices();
  }, []);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCameraCapture = (success: boolean, photos: string[]) => {
    if (success && photos.length > 0) {
      setCapturedPhotos(photos);
      setFaceRegistered(true);
      setError(null);
      console.log(`✅ Face registration complete: ${photos.length} photos captured`);
    } else {
      setError("Face registration failed. Please try again.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.fullName || !form.email || !form.officeId || !form.password || !form.confirmPassword) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!form.designation) {
      setError("Please select a designation.");
      return;
    }

    if (!faceRegistered || capturedPhotos.length === 0) {
      setError("Please complete face registration using the camera.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Register employee with face photos
      const { success, error: regError } = await registrationService.registerEmployeeWithFace({
        email: form.email,
        password: form.password,
        full_name: form.fullName,
        office_id: form.officeId,
        role_type: form.roleType,
        designation: form.designation,
        face_photos: capturedPhotos, // Send captured photos
      });

      if (regError || !success) {
        setError(regError?.message || "Registration failed. Please try again.");
        setIsLoading(false);
        return;
      }

      // Registration successful - navigate to pending screen
      console.log('✅ Registration completed, user automatically signed out by backend');
      navigate("/registration-pending", { state: { name: form.fullName, email: form.email } });
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <MobileContainer>
      <div className="flex flex-col min-h-full">
        {/* Header */}
        <div className="px-6 pt-8 pb-4 border-b border-border flex items-center gap-3">
          <button onClick={() => navigate("/login")} className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-title">Employee Registration</h1>
            <p className="text-caption">Submit your details for approval</p>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 px-6 py-6 overflow-y-auto">
          {error && (
            <div className="bg-destructive-muted border border-destructive/20 rounded-xl p-4 mb-6 flex items-start gap-3 animate-scale-in">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Full Name *</label>
              <input type="text" value={form.fullName} onChange={(e) => updateField("fullName", e.target.value)} placeholder="Enter your full name" className="input-field" />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email Address *</label>
              <input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="you@example.com" className="input-field" autoComplete="off" />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Office Location *</label>
              <select 
                value={form.officeId} 
                onChange={(e) => updateField("officeId", e.target.value)} 
                className="input-field"
                disabled={loadingOffices}
              >
                <option value="">
                  {loadingOffices ? "Loading offices..." : "Select office"}
                </option>
                {offices.map((office) => (
                  <option key={office.id} value={office.id}>
                    {office.name} - {office.city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Role *</label>
              <select 
                value={form.roleType} 
                onChange={(e) => updateField("roleType", e.target.value)} 
                className="input-field"
              >
                <option value="Employee">Employee</option>
                <option value="Intern">Intern</option>
                <option value="Unpaid Intern">Unpaid Intern</option>
                <option value="Paid Intern">Paid Intern</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Designation *</label>
              <select 
                value={form.designation} 
                onChange={(e) => updateField("designation", e.target.value)} 
                className="input-field"
              >
                <option value="">Select designation</option>
                <option value="Software Developer">Software Developer</option>
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="Backend Developer">Backend Developer</option>
                <option value="Full Stack Developer">Full Stack Developer</option>
                <option value="HR Executive">HR Executive</option>
                <option value="Project Manager">Project Manager</option>
                <option value="UI/UX Designer">UI/UX Designer</option>
                <option value="Business Analyst">Business Analyst</option>
                <option value="Quality Assurance">Quality Assurance</option>
                <option value="DevOps Engineer">DevOps Engineer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Face Registration *</label>
              <p className="text-xs text-muted-foreground mb-3">
                Use live camera to register your face for attendance verification
              </p>
              
              {faceRegistered ? (
                <div className="w-full p-4 bg-success-muted border border-success/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-success rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-success-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-success">Face Registered Successfully</p>
                      <p className="text-xs text-success/80 mt-1">
                        {capturedPhotos.length} photos captured for verification
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCameraCapture(true)}
                    className="mt-3 text-xs text-success hover:text-success/80 transition-colors"
                  >
                    Retake photos
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCameraCapture(true)}
                  className="w-full aspect-video bg-muted rounded-xl border-2 border-dashed border-border hover:border-primary transition-colors flex flex-col items-center justify-center gap-3"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Camera className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">Start Face Registration</p>
                    <p className="text-xs text-muted-foreground mt-1">Click to open camera</p>
                  </div>
                </button>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Password *</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => updateField("password", e.target.value)} placeholder="Min. 8 characters" className="input-field pr-12" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Confirm Password *</label>
              <div className="relative">
                <input type={showConfirmPassword ? "text" : "password"} value={form.confirmPassword} onChange={(e) => updateField("confirmPassword", e.target.value)} placeholder="Re-enter password" className="input-field pr-12" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button type="submit" disabled={isLoading} className="btn-primary-large">
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  "Submit Registration"
                )}
              </button>
            </div>
          </form>

          <div className="text-center mt-6 pb-4">
            <button onClick={() => navigate("/login")} className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Already have an account? Sign In
            </button>
          </div>
        </div>

        {/* Live Camera Capture Modal */}
        <LiveCameraCapture
          isOpen={showCameraCapture}
          onClose={() => setShowCameraCapture(false)}
          onComplete={handleCameraCapture}
          title="Face Registration"
          description="Capture 50 photos for secure attendance verification"
          captureCount={50}
        />
      </div>
    </MobileContainer>
  );
};

export default RegisterScreen;
