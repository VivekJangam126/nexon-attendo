import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Eye, EyeOff, AlertCircle } from "lucide-react";
import MobileContainer from "@/components/MobileContainer";
import { useAuth } from "@/hooks/useAuth";
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
  const { login, logout, profile, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check if logged-in user is employee
  useEffect(() => {
    if (user && profile && !isLoading) {
      if (profile.role === 'employee') {
        // Check status and navigate accordingly
        if (profile.status === 'pending') {
          navigate("/registration-pending");
        } else if (profile.status === 'rejected' || profile.status === 'blocked') {
          navigate("/account-blocked");
        } else if (profile.status === 'active') {
          // Check if password reset is required
          if (profile.password_reset_required) {
            navigate("/change-password");
          } else {
            navigate("/dashboard");
          }
        }
      } else if (profile.role === 'admin') {
        // Admin trying to use employee login - redirect to admin login
        logout();
        setError("Please use the admin login portal.");
      }
    }
  }, [user, profile, navigate, logout, isLoading]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!email || !password) {
      setError("Please enter your email and password");
      setIsLoading(false);
      return;
    }

    try {
      const { error: loginError } = await login(email, password);

      console.log('🔐 Login attempt result:', { loginError });

      if (loginError) {
        const errorMsg = loginError.message.toLowerCase();
        
        console.log('❌ Login error:', errorMsg);
        
        // Handle rate limit errors
        if (errorMsg.includes('too many') || errorMsg.includes('rate limit')) {
          setError(loginError.message);
          setIsLoading(false);
          return;
        }
        
        // Handle JWT/token errors that might indicate time issues
        if (errorMsg.includes('jwt') || errorMsg.includes('token') || errorMsg.includes('expired') || errorMsg.includes('invalid')) {
          setError("Login failed. Please ensure your device date and time are correct and synced with network time, then try again.");
          setIsLoading(false);
          return;
        }
        
        // Handle status-based errors
        if (errorMsg.includes('pending')) {
          navigate("/registration-pending");
        } else if (errorMsg.includes('rejected')) {
          navigate("/account-blocked?reason=rejected");
        } else if (errorMsg.includes('blocked') || errorMsg.includes('deactivated')) {
          navigate("/account-blocked?reason=deactivated");
        } else {
          setError(loginError.message);
        }
        setIsLoading(false);
      } else {
        // Login successful - useEffect will handle navigation
        console.log('✅ Login successful');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('💥 Login exception:', err);
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
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
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-field"
                autoComplete="email"
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
          <p className="text-caption">Nexus Pvt Ltd</p>
        </div>
      </div>
    </MobileContainer>
  );
};

export default LoginScreen;
