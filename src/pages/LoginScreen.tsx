import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, AlertCircle, Building2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const LoginScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, logout, profile, user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log('🔍 LoginScreen useEffect - User:', !!user, 'Profile:', !!profile, 'Loading:', loading);
    if (profile) {
      console.log('👤 Profile status:', profile.status, 'Role:', profile.role);
    }
    
    // If we're still loading auth state, wait
    if (loading) {
      return;
    }
    
    // Normal redirect logic for authenticated users - ONLY if they have a valid account
    if (user && profile && !isLoading) {
      if (profile.role === 'employee') {
        if (profile.status === 'pending') {
          console.log('🔄 Redirecting to registration-pending due to pending status');
          navigate("/registration-pending");
        } else if (profile.status === 'rejected' || profile.status === 'blocked') {
          console.log('🔄 Redirecting to account-blocked due to status:', profile.status);
          navigate("/account-blocked");
        } else if (profile.status === 'active') {
          console.log('🔄 Redirecting to dashboard due to active status');
          navigate("/dashboard");
        }
      } else if (profile.role === 'admin') {
        console.log('🔄 Logging out admin user');
        logout();
        setError("Please use the admin login portal.");
      }
    }
  }, [user, profile, navigate, logout, isLoading, loading]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    console.log('🔐 [LOGIN] Starting login process...');

    if (!email || !password) {
      setError("Please enter your email and password");
      setIsLoading(false);
      console.log('❌ [LOGIN] Missing email or password');
      return;
    }

    try {
      console.log('🔐 [LOGIN] Calling login service with email:', email);
      const { error: loginError } = await login(email, password);
      console.log('🔐 [LOGIN] Login service response - Error:', loginError);

      if (loginError) {
        const errorMsg = loginError.message.toLowerCase();
        console.log('🔐 [LOGIN] Error message:', errorMsg);
        
        if (errorMsg.includes('too many') || errorMsg.includes('rate limit')) {
          console.log('🔐 [LOGIN] Rate limit error');
          setError(loginError.message);
          setIsLoading(false);
          return;
        }
        
        if (errorMsg.includes('jwt') || errorMsg.includes('token') || errorMsg.includes('expired') || errorMsg.includes('invalid')) {
          console.log('🔐 [LOGIN] JWT/Token error');
          setError("Login failed. Please ensure your device date and time are correct and synced with network time, then try again.");
          setIsLoading(false);
          return;
        }
        
        if (errorMsg.includes('pending')) {
          console.log('🔐 [LOGIN] Account pending - redirecting');
          navigate("/registration-pending");
        } else if (errorMsg.includes('rejected')) {
          console.log('🔐 [LOGIN] Account rejected - redirecting');
          navigate("/account-blocked?reason=rejected");
        } else if (errorMsg.includes('blocked') || errorMsg.includes('deactivated')) {
          console.log('🔐 [LOGIN] Account blocked - redirecting');
          navigate("/account-blocked?reason=deactivated");
        } else {
          console.log('🔐 [LOGIN] Generic error:', loginError.message);
          setError(loginError.message);
        }
        setIsLoading(false);
      } else {
        console.log('🔐 [LOGIN] Login successful!');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('🔐 [LOGIN] Catch block error:', err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError("An unexpected error occurred. Please try again: " + errorMsg);
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
                <h3 className="font-semibold mb-1">Streamlined Attendance</h3>
                <p className="text-sm text-gray-400">Track employee attendance with precision and ease</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-sm font-bold text-orange-500">✓</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Leave Management</h3>
                <p className="text-sm text-gray-400">Manage leave requests and approvals efficiently</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-sm font-bold text-orange-500">✓</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Real-time Analytics</h3>
                <p className="text-sm text-gray-400">Get insights with comprehensive reporting</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-4 py-8 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-orange-500" />
            </div>
          </div>

          {/* Form Header */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Employee Login</h2>
            <p className="text-sm text-gray-600">Sign in to your account to continue</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-gray-900 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-gray-900 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-xs text-orange-600 hover:text-orange-700 font-medium transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-orange-600 text-white text-sm rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Registration and Admin Links */}
          <div className="mt-4 text-center space-y-2">
            <div>
              <span className="text-xs text-gray-500">New employee? </span>
              <button
                onClick={() => navigate("/register")}
                className="text-xs text-orange-600 hover:text-orange-700 font-medium transition-colors"
              >
                Register here
              </button>
            </div>
            <div>
              <button
                onClick={() => navigate("/admin/login")}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                Admin Login →
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

export default LoginScreen;
