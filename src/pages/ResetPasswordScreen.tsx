import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock, AlertCircle, CheckCircle } from "lucide-react";
import MobileContainer from "@/components/MobileContainer";
import { supabase } from "@/lib/supabase";

const ResetPasswordScreen = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionValid, setSessionValid] = useState(false);

  useEffect(() => {
    // Check if we have a recovery token in URL params
    const checkSession = async () => {
      try {
        // Get token from URL query params
        const token = searchParams.get('token');
        const type = searchParams.get('type');

        if (token && type === 'recovery') {
          // Use the token to create a session
          const { data: { session }, error: sessionError } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'recovery',
          });

          if (sessionError) {
            console.error("Token verification error:", sessionError);
            setError("This link has expired or is invalid. Please request a new password reset.");
            setSessionValid(false);
            return;
          }

          if (session?.user) {
            setSessionValid(true);
            return;
          }
        }

        // Fallback: Check for regular session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setSessionValid(true);
        } else {
          setError("This link has expired or is invalid. Please request a new password reset.");
          setSessionValid(false);
        }
      } catch (err) {
        console.error("Error checking session:", err);
        setError("An error occurred. Please try again.");
        setSessionValid(false);
      }
    };

    checkSession();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!password) {
      setError("Please enter a new password.");
      return;
    }

    if (!confirmPassword) {
      setError("Please confirm your password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      // Update password using Supabase
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        console.error("Update password error:", updateError);
        setError(updateError.message || "Failed to update password. Please try again.");
        setIsLoading(false);
        return;
      }

      // Success
      setSuccess(true);
      setPassword("");
      setConfirmPassword("");

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  if (!sessionValid) {
    return (
      <MobileContainer>
        <div className="flex flex-col min-h-full px-6 py-8">
          <div className="flex-1 flex flex-col justify-center items-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-title text-center mb-2">Invalid Link</h2>
            <p className="text-caption text-center mb-8">This password reset link has expired or is invalid.</p>
            <button
              onClick={() => navigate("/forgot-password")}
              className="btn-primary-large"
            >
              Request New Link
            </button>
          </div>
        </div>
      </MobileContainer>
    );
  }

  if (success) {
    return (
      <MobileContainer>
        <div className="flex flex-col min-h-full px-6 py-8">
          <div className="flex-1 flex flex-col justify-center items-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 animate-fade-in-up">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-title text-center mb-2 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              Password Reset Successful!
            </h2>
            <p className="text-caption text-center mb-8 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              Your password has been updated. Redirecting to login...
            </p>
            <button
              onClick={() => navigate("/login")}
              className="btn-primary-large"
            >
              Go to Login
            </button>
          </div>
        </div>
      </MobileContainer>
    );
  }

  return (
    <MobileContainer>
      <div className="flex flex-col min-h-full px-6 py-8">
        <div className="flex-1 flex flex-col justify-center">
          {/* Icon */}
          <div className="flex items-center justify-center mb-8 animate-fade-in-up">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-primary" />
            </div>
          </div>

          <div className="text-center mb-8 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <h1 className="text-title mb-2">Reset Password</h1>
            <p className="text-caption">Enter your new password below.</p>
          </div>

          {error && (
            <div className="bg-destructive-muted border border-destructive/20 rounded-xl p-4 mb-6 flex items-start gap-3 animate-scale-in">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="input-field"
                autoComplete="new-password"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground mt-1">At least 8 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="input-field"
                autoComplete="new-password"
                disabled={isLoading}
              />
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary-large mt-6">
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Updating Password...
                </span>
              ) : (
                "Update Password"
              )}
            </button>
          </form>
        </div>
      </div>
    </MobileContainer>
  );
};

export default ResetPasswordScreen;
