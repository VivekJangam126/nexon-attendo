import { useNavigate, useLocation } from "react-router-dom";
import { Clock, Mail, User, Building2 } from "lucide-react";
import MobileContainer from "@/components/MobileContainer";

const RegistrationPendingScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { name, email } = (location.state as { name?: string; email?: string }) || {};

  return (
    <MobileContainer>
      <div className="flex flex-col items-center justify-center min-h-full px-8">
        {/* Icon */}
        <div className="relative mb-8 animate-scale-in">
          <div className="w-28 h-28 bg-warning-muted rounded-full flex items-center justify-center">
            <div className="w-20 h-20 bg-warning rounded-full flex items-center justify-center">
              <Clock className="w-10 h-10 text-warning-foreground" />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="text-center mb-8 animate-fade-in-up">
          <h1 className="text-display mb-2">Registration Submitted</h1>
          <p className="text-body-secondary max-w-sm">
            Your registration is pending admin approval. You will not be able to log in until your account is approved.
          </p>
        </div>

        {/* Submitted Details */}
        {(name || email) && (
          <div className="card-elevated w-full max-w-sm p-5 space-y-4 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <p className="text-overline">Submitted Details</p>
            {name && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Full Name</p>
                  <p className="text-sm font-medium">{name}</p>
                </div>
              </div>
            )}
            {email && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{email}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info */}
        <div className="bg-accent rounded-xl p-4 mt-6 w-full max-w-sm animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <p className="text-sm text-center text-accent-foreground">
            An admin will review your request and you'll receive a notification once your account is activated.
          </p>
        </div>

        {/* Back to Login */}
        <div className="w-full max-w-sm mt-8 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🔄 Button clicked, clearing session and navigating to login...');
              
              // Clear any potential session data
              localStorage.clear();
              sessionStorage.clear();
              
              // Force navigation with replace and add parameter to indicate source
              console.log('🔄 Using direct window navigation with replace...');
              window.location.replace("/login?from=registration-pending");
            }} 
            className="btn-primary-large"
            type="button"
          >
            Back to Login
          </button>
        </div>
      </div>
    </MobileContainer>
  );
};

export default RegistrationPendingScreen;
