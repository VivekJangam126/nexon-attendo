import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Eye, EyeOff, AlertCircle, ArrowLeft } from "lucide-react";
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
  });
  const [offices, setOffices] = useState<Office[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingOffices, setLoadingOffices] = useState(true);

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.fullName || !form.email || !form.officeId || !form.password || !form.confirmPassword) {
      setError("Please fill in all required fields.");
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
      const { success, error: regError } = await registrationService.registerEmployee({
        email: form.email,
        password: form.password,
        full_name: form.fullName,
        office_id: form.officeId,
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
              <input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="you@example.com" className="input-field" />
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
