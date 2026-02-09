import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Eye, EyeOff, AlertCircle } from "lucide-react";
import MobileContainer from "@/components/MobileContainer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const LoginScreen = () => {
  const navigate = useNavigate();
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (!employeeId || !password) {
      setError("Please enter your Employee ID and password");
      setIsLoading(false);
      return;
    }

    // Demo account state handling
    if (employeeId === "pending") {
      setIsLoading(false);
      navigate("/account-blocked?reason=pending");
      return;
    }
    if (employeeId === "rejected") {
      setIsLoading(false);
      navigate("/account-blocked?reason=rejected");
      return;
    }
    if (employeeId === "deactivated") {
      setIsLoading(false);
      navigate("/account-blocked?reason=deactivated");
      return;
    }

    if (employeeId && password) {
      navigate("/dashboard");
    } else {
      setError("Invalid credentials. Please try again.");
    }
    setIsLoading(false);
  };

  return (
    <MobileContainer>
      <div className="flex flex-col min-h-full px-6 py-8">
        {/* Header */}
        <div className="flex-1 flex flex-col justify-center">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8 animate-fade-in-up">
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center shadow-md shadow-primary/20">
              <Building2 className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <h1 className="text-title mb-1">Employee Login</h1>
            <p className="text-caption">Sign in to mark your attendance</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-destructive-muted border border-destructive/20 rounded-xl p-4 mb-6 flex items-start gap-3 animate-scale-in">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            {/* Employee ID */}
            <div>
              <label htmlFor="employeeId" className="block text-sm font-medium text-foreground mb-2">
                Employee ID
              </label>
              <input
                id="employeeId"
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="Enter your Employee ID"
                className="input-field"
                autoComplete="username"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-field pr-12"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary-large mt-6"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="text-center mt-6">
            <button
              onClick={() => navigate("/register")}
              className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
            >
              New Employee? Register →
            </button>
          </div>

          {/* Switch to Admin */}
          <div className="text-center mt-3">
            <button
              onClick={() => navigate("/admin/login")}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Admin Login →
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-caption">Nexon Pvt Ltd</p>
        </div>
      </div>
    </MobileContainer>
  );
};

export default LoginScreen;
