import { useNavigate } from "react-router-dom";
import { 
  User, Briefcase, Building2, Mail, Calendar, 
  LogOut, ChevronRight, Lock, HelpCircle, FileText, Info, Shield
} from "lucide-react";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
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

  useEffect(() => {
    if (!profile) {
      navigate("/login");
    }
  }, [profile, navigate]);

  const handleLogout = async () => {
    setShowLogoutDialog(false);
    try {
      await authLogout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/login';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusDisplay = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600';
      case 'pending':
        return 'text-amber-600';
      case 'rejected':
      case 'blocked':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!profile) {
    return null;
  }

  return (
    <DashboardLayout title="My Profile">
      <div className="space-y-3">
        {/* Profile Header Card */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {getInitials(profile.full_name)}
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900">{profile.full_name}</h1>
              <p className="text-xs text-amber-700 capitalize mt-0.5">{profile.role_type || profile.role}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  profile.status === 'active' ? 'bg-green-100 text-green-700' :
                  profile.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {getStatusDisplay(profile.status)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div>
          <h2 className="text-sm font-bold text-gray-900 mb-2">Profile Information</h2>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm divide-y divide-gray-200">
            <div className="flex items-center gap-3 p-3">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">Full Name</p>
                <p className="text-xs font-semibold text-gray-900 mt-0.5">{profile.full_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">Email</p>
                <p className="text-xs font-semibold text-gray-900 mt-0.5 break-all">{profile.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">Role</p>
                <p className="text-xs font-semibold text-gray-900 mt-0.5 capitalize">{profile.role_type || profile.role}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">Account Status</p>
                <p className={`text-xs font-semibold mt-0.5 capitalize ${getStatusColor(profile.status)}`}>
                  {getStatusDisplay(profile.status)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Building2 className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">Office Location</p>
                <p className="text-xs font-semibold text-gray-900 mt-0.5">{profile.office_name || 'Not Assigned'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">Member Since</p>
                <p className="text-xs font-semibold text-gray-900 mt-0.5">{formatDate(profile.created_at)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Account Options */}
        <div>
          <h2 className="text-sm font-bold text-gray-900 mb-2">Account Settings</h2>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm divide-y divide-gray-200">
            <button onClick={() => navigate("/change-password")} className="flex items-center gap-3 p-3 w-full hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Lock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-semibold text-gray-900">Change Password</p>
                <p className="text-[10px] text-gray-600 mt-0.5">Update your account password</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </button>

            <button onClick={() => navigate("/help-support")} className="flex items-center gap-3 p-3 w-full hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <HelpCircle className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-semibold text-gray-900">Help & Support</p>
                <p className="text-[10px] text-gray-600 mt-0.5">Get assistance or report issues</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </button>

            <button onClick={() => navigate("/attendance-rules")} className="flex items-center gap-3 p-3 w-full hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Info className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-semibold text-gray-900">Attendance Rules</p>
                <p className="text-[10px] text-gray-600 mt-0.5">How attendance marking works</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </button>

            <button onClick={() => navigate("/attendance-rules")} className="flex items-center gap-3 p-3 w-full hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-semibold text-gray-900">Attendance Policy</p>
                <p className="text-[10px] text-gray-600 mt-0.5">View company attendance rules</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </button>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={() => setShowLogoutDialog(true)}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-50 text-red-600 rounded-lg font-semibold text-sm hover:bg-red-100 transition-colors border border-red-200"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>

        {/* Footer */}
        <div className="text-center pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-600">Nexus Corporate Pvt Ltd v1.0.0</p>
          <p className="text-xs text-gray-600 mt-1">© 2026 Nexus Corporate Pvt Ltd</p>
        </div>
      </div>

      {/* Logout Confirmation */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="max-w-[400px] rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out? You'll need to log in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-red-600 text-white hover:bg-red-700">
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default ProfileScreen;
