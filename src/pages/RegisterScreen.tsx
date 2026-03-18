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
    roleType: "Employee" as 'Employee' | 'Intern' | 'Unpaid Intern' | 'Paid Intern',
    designation: "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!form.fullName.trim()) {
      setError("Full name is required.");
      return;
    }

    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!form.officeId) {
      setError("Please select an office.");
      return;
    }

    if (!form.password) {
      setError("Password is required.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      // Register employee with basic information
      const { success, error: registrationError } = await registrationService.registerEmployee({
        email: form.email,
        password: form.password,
        full_name: form.fullName,
        office_id: form.officeId,
        role_type: form.roleType,
        designation: form.designation,
      });

      if (success) {
        navigate("/registration-pending");
      } else {
        setError(registrationError || "Registration failed. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MobileContainer>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <button
            onClick={() => navigate("/")}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Create Account</h1>
          <div className="w-9" /> {/* Spacer */}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="max-w-md mx-auto">
            {/* Welcome */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-2">Join Nexus Attendo</h2>
              <p className="text-sm text-muted-foreground">
                Create your account to start tracking attendance
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-4 p-3 bg-destructive-muted border border-destructive/20 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => updateField("fullName", e.target.value)}
                  className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Enter your full name"
                  disabled={isLoading}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-2">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Enter your email"
                  disabled={isLoading}
                />
              </div>

              {/* Office Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Office Location</label>
                {loadingOffices ? (
                  <div className="w-full px-3 py-2.5 border border-border rounded-lg bg-muted flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={form.officeId}
                      onChange={(e) => updateField("officeId", e.target.value)}
                      className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none bg-background"
                      disabled={isLoading}
                    >
                      <option value="">Select your office</option>
                      {offices.map((office) => (
                        <option key={office.id} value={office.id}>
                          {office.name}
                        </option>
                      ))}
                    </select>
                    <Building2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                )}
              </div>

              {/* Role Type */}
              <div>
                <label className="block text-sm font-medium mb-2">Role Type</label>
                <select
                  value={form.roleType}
                  onChange={(e) => updateField("roleType", e.target.value as any)}
                  className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none bg-background"
                  disabled={isLoading}
                >
                  <option value="Employee">Employee</option>
                  <option value="Intern">Intern</option>
                  <option value="Unpaid Intern">Unpaid Intern</option>
                  <option value="Paid Intern">Paid Intern</option>
                </select>
              </div>

              {/* Designation */}
              <div>
                <label className="block text-sm font-medium mb-2">Designation</label>
                <input
                  type="text"
                  value={form.designation}
                  onChange={(e) => updateField("designation", e.target.value)}
                  className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="e.g., Software Developer"
                  disabled={isLoading}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    className="w-full px-3 py-2.5 pr-10 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Create a password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium mb-2">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={(e) => updateField("confirmPassword", e.target.value)}
                    className="w-full px-3 py-2.5 pr-10 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Confirm your password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || loadingOffices}
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                  onClick={() => navigate("/login")}
                  className="text-primary hover:underline font-medium"
                  disabled={isLoading}
                >
                  Sign In
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </MobileContainer>
  );
};

export default RegisterScreen;