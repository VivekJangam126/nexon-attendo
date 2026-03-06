import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, AlertCircle, Info } from "lucide-react";
import MobileContainer from "@/components/MobileContainer";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const ChangePasswordScreen = () => {
  const navigate = useNavigate();
  const { changePassword, profile } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check if password reset is required
  const isPasswordResetRequired = profile?.password_reset_required === true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await changePassword(currentPassword, newPassword);
      
      if (result.success) {
        toast({ 
          title: "Password Changed", 
          description: "Your password has been updated successfully." 
        });
        
        // If password reset was required, redirect to dashboard
        if (isPasswordResetRequired) {
          navigate("/dashboard");
        } else {
          navigate(-1);
        }
      } else {
        setError(result.error?.message || "Failed to change password");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MobileContainer>
      <div className="flex flex-col min-h-full">
        <div className="px-6 pt-8 pb-4 border-b border-border flex items-center gap-3">
          {!isPasswordResetRequired && (
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
          )}
          <h1 className="text-title">Change Password</h1>
        </div>

        <div className="flex-1 px-6 py-6">
          {/* Password Reset Required Notice */}
          {isPasswordResetRequired && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800 mb-1">Password Reset Required</p>
                <p className="text-sm text-blue-700">
                  Your administrator has reset your password. Please create a new password to continue.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-destructive-muted border border-destructive/20 rounded-xl p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {isPasswordResetRequired ? "Temporary Password" : "Current Password"}
              </label>
              <div className="relative">
                <input 
                  type={showCurrent ? "text" : "password"} 
                  value={currentPassword} 
                  onChange={(e) => setCurrentPassword(e.target.value)} 
                  placeholder={isPasswordResetRequired ? "Enter temporary password" : "Enter current password"}
                  className="input-field pr-12" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowCurrent(!showCurrent)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">New Password</label>
              <div className="relative">
                <input 
                  type={showNew ? "text" : "password"} 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  placeholder="Min. 8 characters" 
                  className="input-field pr-12" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowNew(!showNew)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Confirm New Password</label>
              <input 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                placeholder="Re-enter new password" 
                className="input-field" 
              />
            </div>

            <div className="pt-2">
              <button type="submit" disabled={isLoading} className="btn-primary-large">
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Updating...
                  </span>
                ) : (
                  "Update Password"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </MobileContainer>
  );
};

export default ChangePasswordScreen;