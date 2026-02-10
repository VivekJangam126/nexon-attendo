import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Eye, EyeOff, AlertCircle, Shield } from "lucide-react";
import MobileContainer from "@/components/MobileContainer";
import { useAuth } from "@/hooks/useAuth";

const AdminLoginScreen = () => {
  const navigate = useNavigate();
  const { login, logout, profile, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check if logged-in user is admin
  useEffect(() => {
    if (user && profile && !isLoading) {
      if (profile.role === 'admin') {
        // User is admin - navigate to dashboard
        navigate("/admin/dashboard");
      } else if (profile.role === 'employee') {
        // User is employee - logout and show error
        logout();
        setError("Access denied. This portal is for administrators only. Please use the employee login.");
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

      if (loginError) {
        setError(loginError.message);
        setIsLoading(false);
        return;
      }

      // Wait for profile to be loaded, then check role
      // Using a small delay to ensure profile is fetched
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Profile should now be available from useAuth
      // We'll check it in a useEffect instead
      setIsLoading(false);
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-background rounded-2xl shadow-xl p-6 sm:p-8">
        <div className="flex-1 flex flex-col justify-center">
          {/* Admin Badge */}
          <div className="flex items-center justify-center mb-6 animate-fade-in-up">
            <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">Admin Portal</span>
            </div>
          </div>

          {/* Logo */}
          <div className="flex items-center justify-center mb-8 animate-fade-in-up">
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center shadow-md shadow-primary/20">
              <Building2 className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <h1 className="text-title mb-1">Admin Login</h1>
            <p className="text-caption">Manage employee attendance</p>
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
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@nexon.com"
                className="input-field"
                autoComplete="email"
              />
            </div>

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

          {/* Switch to Employee */}
          <div className="text-center mt-6">
            <button
              onClick={() => navigate("/login")}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Employee Login →
            </button>
          </div>
        </div>

        <div className="text-center pt-4">
          <p className="text-caption">Nexon Pvt Ltd</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginScreen;
