import { useNavigate } from "react-router-dom";
import { 
  User, Briefcase, Building2, Mail, Calendar, 
  LogOut, ChevronRight, Lock, HelpCircle, FileText, Info, Shield
} from "lucide-react";
import MobileContainer from "@/components/MobileContainer";
import BottomNavigation from "@/components/BottomNavigation";
import { useState, useEffect } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";

const ProfileScreen = () => {
  const navigate = useNavigate();
  const { profile, logout: authLogout } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!profile) {
      navigate("/login");
    }
  }, [profile, navigate]);

  const handleLogout = async () => {
    setShowLogoutDialog(false);
    try {
      await authLogout();
      // Force navigation after logout
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Still navigate even if there's an error
      window.location.href = '/login';
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Format status for display
  const getStatusDisplay = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-success';
      case 'pending':
        return 'text-warning';
      case 'rejected':
      case 'blocked':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  if (!profile) {
    return null;
  }

  return (
    <MobileContainer>
      <div className="flex flex-col min-h-full pb-20">
        {/* Header */}
        <div className="px-6 pt-8 pb-6 bg-primary text-primary-foreground rounded-b-3xl">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-primary-foreground/20 rounded-full flex items-center justify-center">
              <span className="text-3xl font-semibold">{getInitials(profile.full_name)}</span>
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-semibold">{profile.full_name}</h1>
              <p className="text-primary-foreground/80 text-sm capitalize">{profile.role}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-medium ${getStatusColor(profile.status)}`}>
                  {getStatusDisplay(profile.status)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 py-6 space-y-6 overflow-y-auto">
          {/* Employee Details */}
          <div className="animate-fade-in-up">
            <h2 className="text-overline mb-3">Profile Information</h2>
            <div className="card-elevated divide-y divide-border">
              <div className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-caption">Full Name</p>
                    <p className="font-medium">{profile.full_name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-caption">Email</p>
                    <p className="font-medium break-all">{profile.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-caption">Role</p>
                    <p className="font-medium capitalize">{profile.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-caption">Account Status</p>
                    <p className={`font-medium capitalize ${getStatusColor(profile.status)}`}>
                      {getStatusDisplay(profile.status)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-caption">Office Location</p>
                    <p className="font-medium">{profile.office_name || 'Not Assigned'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-caption">Member Since</p>
                    <p className="font-medium">{formatDate(profile.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>

          {/* Account Options */}
          <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <h2 className="text-overline mb-3">Account</h2>
            <div className="card-elevated divide-y divide-border">
              <button onClick={() => navigate("/change-password")} className="flex items-center gap-4 p-4 w-full hover:bg-muted/50 transition-colors">
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">Change Password</p>
                  <p className="text-xs text-muted-foreground">Update your account password</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>

              <button onClick={() => navigate("/help-support")} className="flex items-center gap-4 p-4 w-full hover:bg-muted/50 transition-colors">
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">Help & Support</p>
                  <p className="text-xs text-muted-foreground">Get assistance or report issues</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>

              <button onClick={() => navigate("/attendance-rules")} className="flex items-center gap-4 p-4 w-full hover:bg-muted/50 transition-colors">
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                  <Info className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">Attendance Rules</p>
                  <p className="text-xs text-muted-foreground">How attendance marking works</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>

              <button onClick={() => navigate("/attendance-rules")} className="flex items-center gap-4 p-4 w-full hover:bg-muted/50 transition-colors">
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">Attendance Policy</p>
                  <p className="text-xs text-muted-foreground">View company attendance rules</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Logout Button */}
          <div className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <button
              onClick={() => setShowLogoutDialog(true)}
              className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-destructive-muted text-destructive rounded-xl font-medium transition-colors hover:bg-destructive/20"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>

          {/* App Version */}
          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground">Nexon Attendance v1.0.0</p>
            <p className="text-xs text-muted-foreground">© 2026 SmartMatrix Pvt Ltd</p>
          </div>
        </div>

        <BottomNavigation />

        {/* Logout Confirmation */}
        <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <AlertDialogContent className="max-w-[340px] rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Sign Out</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to sign out? You'll need to log in again to access your account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row gap-3">
              <AlertDialogCancel className="flex-1 mt-0">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout} className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Sign Out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MobileContainer>
  );
};

export default ProfileScreen;
