import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Eye, EyeOff, AlertCircle, ArrowLeft, Upload, X, Camera } from "lucide-react";
import MobileContainer from "@/components/MobileContainer";
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
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

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

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setProfilePhoto(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setError(null);
  };

  const removePhoto = () => {
    setProfilePhoto(null);
    setPhotoPreview(null);
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

    if (!profilePhoto) {
      setError("Please upload a profile photo for face recognition.");
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
      // Step 1: Upload photo to Supabase Storage first (client-side)
      let profilePhotoUrl: string | null = null;
      
      if (profilePhoto) {
        // Import supabase client
        const { supabase } = await import('@/lib/supabase');
        
        // Generate unique filename
        const fileExt = profilePhoto.name.split('.').pop();
        const tempUserId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const fileName = `${tempUserId}.${fileExt}`;
        const filePath = `profile-photos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(filePath, profilePhoto, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Photo upload failed:', uploadError);
          setError(`Photo upload failed: ${uploadError.message}`);
          setIsLoading(false);
          return;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(filePath);
        
        profilePhotoUrl = publicUrl;
      }

      // Step 2: Register employee with photo URL
      const { success, error: regError } = await registrationService.registerEmployee({
        email: form.email,
        password: form.password,
        full_name: form.fullName,
        office_id: form.officeId,
        role_type: form.roleType,
        designation: form.designation,
        profile_photo_url: profilePhotoUrl, // Send URL instead of File
      });

      if (regError || !success) {
        setError(regError?.message || "Registration failed. Please try again.");
        setIsLoading(false);
        return;
      }

      // Registration successful - navigate to pending screen
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
              <label className="block text-sm font-medium text-foreground mb-2">Profile Photo *</label>
              <p className="text-xs text-muted-foreground mb-3">
                Upload a clear, front-facing photo for face recognition verification
              </p>
              
              {photoPreview ? (
                <div className="relative">
                  <div className="w-full aspect-video bg-muted rounded-xl overflow-hidden border-2 border-border">
                    <img 
                      src={photoPreview} 
                      alt="Profile preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute top-2 right-2 p-2 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="mt-2 flex items-center gap-2 text-xs text-success">
                    <Camera className="w-4 h-4" />
                    <span>Photo uploaded successfully</span>
                  </div>
                </div>
              ) : (
                <label className="block">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                  <div className="w-full aspect-video bg-muted rounded-xl border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Upload className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">Click to upload photo</p>
                      <p className="text-xs text-muted-foreground mt-1">JPG or PNG, max 5MB</p>
                    </div>
                  </div>
                </label>
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
      </div>
    </MobileContainer>
  );
};

export default RegisterScreen;
