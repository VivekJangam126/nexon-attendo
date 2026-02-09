import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Eye, EyeOff, AlertCircle, ArrowLeft } from "lucide-react";
import MobileContainer from "@/components/MobileContainer";

const departments = ["Engineering", "Design", "Marketing", "HR", "Finance", "Operations"];
const offices = ["Nexon Pvt Ltd – Head Office", "Nexon Pvt Ltd – Branch Office"];

const RegisterScreen = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    employeeId: "",
    department: "",
    role: "",
    officeLocation: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.fullName || !form.email || !form.department || !form.role || !form.officeLocation || !form.password || !form.confirmPassword) {
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
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    navigate("/registration-pending", { state: { name: form.fullName, email: form.email } });
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
              <label className="block text-sm font-medium text-foreground mb-2">Employee ID (optional)</label>
              <input type="text" value={form.employeeId} onChange={(e) => updateField("employeeId", e.target.value)} placeholder="If already assigned" className="input-field" />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Department *</label>
              <select value={form.department} onChange={(e) => updateField("department", e.target.value)} className="input-field">
                <option value="">Select department</option>
                {departments.map((d) => (<option key={d} value={d}>{d}</option>))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Role / Designation *</label>
              <input type="text" value={form.role} onChange={(e) => updateField("role", e.target.value)} placeholder="e.g. Software Developer" className="input-field" />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Office Location *</label>
              <select value={form.officeLocation} onChange={(e) => updateField("officeLocation", e.target.value)} className="input-field">
                <option value="">Select office</option>
                {offices.map((o) => (<option key={o} value={o}>{o}</option>))}
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
