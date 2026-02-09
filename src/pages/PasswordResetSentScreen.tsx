import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle2, Mail } from "lucide-react";
import MobileContainer from "@/components/MobileContainer";

const PasswordResetSentScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { email } = (location.state as { email?: string }) || {};

  return (
    <MobileContainer>
      <div className="flex flex-col items-center justify-center min-h-full px-8">
        <div className="relative mb-8 animate-scale-in">
          <div className="w-28 h-28 bg-success-muted rounded-full flex items-center justify-center">
            <div className="w-20 h-20 bg-success rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-success-foreground" />
            </div>
          </div>
        </div>

        <div className="text-center mb-8 animate-fade-in-up">
          <h1 className="text-display mb-2">Check Your Email</h1>
          <p className="text-body-secondary max-w-sm">
            We've sent a password reset link to{" "}
            {email ? <span className="font-medium text-foreground">{email}</span> : "your email address"}.
          </p>
        </div>

        <div className="card-elevated w-full max-w-sm p-5 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Didn't receive the email?</p>
              <p className="text-xs text-muted-foreground">Check your spam folder or try again with the correct email address.</p>
            </div>
          </div>
        </div>

        <div className="w-full max-w-sm mt-8 space-y-3 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <button onClick={() => navigate("/login")} className="btn-primary-large">
            Back to Login
          </button>
          <button onClick={() => navigate("/forgot-password")} className="btn-outline-large">
            Try Again
          </button>
        </div>
      </div>
    </MobileContainer>
  );
};

export default PasswordResetSentScreen;
