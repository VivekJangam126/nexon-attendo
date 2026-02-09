import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, AlertCircle } from "lucide-react";
import MobileContainer from "@/components/MobileContainer";

const ForgotPasswordScreen = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    navigate("/password-reset-sent", { state: { email } });
  };

  return (
    <MobileContainer>
      <div className="flex flex-col h-full min-h-[800px] px-6 py-8">
        <div className="flex-1 flex flex-col">
          {/* Back */}
          <button onClick={() => navigate("/login")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 self-start">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back to Login</span>
          </button>

          <div className="flex-1 flex flex-col justify-center">
            {/* Icon */}
            <div className="flex items-center justify-center mb-8 animate-fade-in-up">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-primary" />
              </div>
            </div>

            <div className="text-center mb-8 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              <h1 className="text-title mb-2">Forgot Password?</h1>
              <p className="text-caption">Enter your email address and we'll send you a link to reset your password.</p>
            </div>

            {error && (
              <div className="bg-destructive-muted border border-destructive/20 rounded-xl p-4 mb-6 flex items-start gap-3 animate-scale-in">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@nexon.com" className="input-field" autoComplete="email" />
              </div>

              <button type="submit" disabled={isLoading} className="btn-primary-large mt-6">
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </MobileContainer>
  );
};

export default ForgotPasswordScreen;
