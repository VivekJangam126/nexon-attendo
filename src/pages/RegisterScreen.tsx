import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Eye, EyeOff, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { registrationService, officeService } from "@server";
import { validatePassword, getPasswordStrengthColor, getPasswordStrengthLabel } from "@/utils/passwordValidator";
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
    gender: "" as 'male' | 'female' | '',
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

    if (!form.gender) {
      setError("Please select your gender.");
      return;
    }

    if (!form.password) {
      setError("Password is required.");
      return;
    }

    // Validate password strength
    const passwordValidation = validatePassword(form.password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors[0]);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
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
        gender: form.gender,
      });

      if (success) {
        navigate("/registration-pending");
      } else {
        // Extract error message from Error object if needed
        const errorMessage = registrationError instanceof Error 
          ? registrationError.message 
          : typeof registrationError === 'string' 
            ? registrationError 
            : "Registration failed. Please try again.";
        setError(errorMessage);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 to-gray-800 flex-col items-center justify-center px-8 py-12">
        <div className="text-center text-white max-w-md">
          <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-8 backdrop-blur-sm border border-white/20">
            <Building2 className="w-10 h-10 text-orange-500" />
          </div>
          
          <h1 className="text-4xl font-bold mb-4">Nexus Attendo</h1>
          <p className="text-lg text-gray-300 mb-12">Employee Management System</p>
          
          <div className="space-y-6 text-left">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-sm font-bold text-orange-500">✓</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Quick Registration</h3>
                <p className="text-sm text-gray-400">Join our team with a simple registration process</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-sm font-bold text-orange-500">✓</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Secure Access</h3>
                <p className="text-sm text-gray-400">Your account will be reviewed and activated by admin</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-sm font-bold text-orange-500">✓</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Get Started</h3>
                <p className="text-sm text-gray-400">Start tracking attendance and managing leaves</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Registration Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-4 py-8 bg-white overflow-y-auto">
        <div className="w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-orange-500" />
            </div>
          </div>

          {/* Form Header */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Create Account</h2>
            <p className="text-sm text-gray-600">Join Nexus Attendo to start tracking attendance</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-xs font-medium text-gray-900 mb-1">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={form.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                disabled={isLoading}
                autoComplete="name"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-gray-900 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            {/* Office Selection */}
            <div>
              <label htmlFor="office" className="block text-xs font-medium text-gray-900 mb-1">
                Office Location
              </label>
              {loadingOffices ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                </div>
              ) : (
                <div className="relative">
                  <select
                    id="office"
                    value={form.officeId}
                    onChange={(e) => updateField("officeId", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all appearance-none bg-white"
                    disabled={isLoading}
                  >
                    <option value="">Select your office</option>
                    {offices.map((office) => (
                      <option key={office.id} value={office.id}>
                        {office.name}
                      </option>
                    ))}
                  </select>
                  <Building2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              )}
            </div>

            {/* Role Type */}
            <div>
              <label htmlFor="roleType" className="block text-xs font-medium text-gray-900 mb-1">
                Role Type
              </label>
              <select
                id="roleType"
                value={form.roleType}
                onChange={(e) => updateField("roleType", e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all appearance-none bg-white"
                disabled={isLoading}
              >
                <option value="Employee">Employee</option>
                <option value="Intern">Intern</option>
                <option value="Unpaid Intern">Unpaid Intern</option>
                <option value="Paid Intern">Paid Intern</option>
              </select>
            </div>

            {/* Gender */}
            <div>
              <label htmlFor="gender" className="block text-xs font-medium text-gray-900 mb-1">
                Gender <span className="text-red-600">*</span>
              </label>
              <select
                id="gender"
                value={form.gender}
                onChange={(e) => updateField("gender", e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all appearance-none bg-white"
                disabled={isLoading}
              >
                <option value="">Select your gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            {/* Designation */}
            <div>
              <label htmlFor="designation" className="block text-xs font-medium text-gray-900 mb-1">
                Designation
              </label>
              <input
                id="designation"
                type="text"
                value={form.designation}
                onChange={(e) => updateField("designation", e.target.value)}
                placeholder="e.g., Software Developer"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                disabled={isLoading}
                autoComplete="organization-title"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-gray-900 mb-1">
                Password <span className="text-red-600">*</span>
              </label>
              <div className="relative mb-2">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all pr-10"
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {form.password && (
                <div className="space-y-2">
                  <div className="space-y-1">
                    {(() => {
                      const validation = validatePassword(form.password);
                      return (
                        <>
                          {/* Strength Bar */}
                          <div className="flex gap-1">
                            {[0, 1, 2, 3].map((i) => (
                              <div
                                key={i}
                                className={`flex-1 h-1 rounded-full transition-all ${
                                  validation.strength === 'strong' ? 'bg-green-500' :
                                  validation.strength === 'good' ? 'bg-blue-500' :
                                  validation.strength === 'fair' ? 'bg-yellow-500' :
                                  'bg-red-500'
                                } ${i < (validation.isValid ? 4 : Object.values(validation.requirements).filter(Boolean).length) ? 'opacity-100' : 'opacity-30'}`}
                              />
                            ))}
                          </div>
                          
                          {/* Strength Label */}
                          <p className="text-xs font-medium">
                            Strength: <span className={`${
                              validation.strength === 'strong' ? 'text-green-600' :
                              validation.strength === 'good' ? 'text-blue-600' :
                              validation.strength === 'fair' ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {getPasswordStrengthLabel(validation.strength)}
                            </span>
                          </p>

                          {/* Requirements Checklist */}
                          <div className="bg-gray-50 rounded-lg p-2 space-y-1">
                            <div className="flex items-center gap-1.5">
                              {validation.requirements.minLength || validation.requirements.maxLength ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                              )}
                              <span className="text-xs text-gray-700">8-16 characters</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {validation.requirements.uppercase ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                              )}
                              <span className="text-xs text-gray-700">1 uppercase letter (A-Z)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {validation.requirements.lowercase ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                              )}
                              <span className="text-xs text-gray-700">1 lowercase letter (a-z)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {validation.requirements.number ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                              )}
                              <span className="text-xs text-gray-700">1 number (0-9)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {validation.requirements.specialChar ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                              )}
                              <span className="text-xs text-gray-700">1 special character (!@#$%^&*)</span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-900 mb-1">
                Confirm Password <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(e) => updateField("confirmPassword", e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all pr-10"
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.password && form.confirmPassword && form.password === form.confirmPassword && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Passwords match
                </p>
              )}
              {form.password && form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" />
                  Passwords do not match
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || loadingOffices}
              className="w-full py-2.5 bg-orange-600 text-white text-sm rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-4 text-center">
            <div>
              <span className="text-xs text-gray-500">Already have an account? </span>
              <button
                onClick={() => navigate("/login")}
                className="text-xs text-orange-600 hover:text-orange-700 font-medium transition-colors"
                disabled={isLoading}
              >
                Sign In
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">© 2026 Nexus Corporate Pvt Ltd. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterScreen;