import { useNavigate } from "react-router-dom";
import { 
  User, Briefcase, Building2, Mail, Calendar, 
  LogOut, ChevronRight, Lock, HelpCircle, FileText, Info, Shield
} from "lucide-react";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ChangePasswordModal from "@/components/ChangePasswordModal";
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
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

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
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-full">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col min-h-full pb-20 md:pb-0">
        {/* Header */}
        <div className="px-4 sm:px-6 lg:px-8 pt-2 pb-2 border-b border-border">
          <h1 className="text-lg font-semibold">Profile</h1>
        </div>

        {/* Content */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-3 overflow-y-auto">
          <div className="max-w-2xl mx-auto space-y-3">
            {/* Profile Header */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">
                    {getInitials(profile.full_name)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900 truncate">
                    {profile.full_name}
                  </h2>
                  <p className="text-sm text-gray-600 truncate">{profile.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      profile.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {profile.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      {profile.role_type || 'Employee'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div>
              <h2 className="text-sm font-bold text-gray-900 mb-2">Account Information</h2>
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm divide-y divide-gray-100">
                <div className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Full Name</p>
                    <p className="text-sm text-gray-600 truncate">{profile.full_name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Email Address</p>
                    <p className="text-sm text-gray-600 truncate">{profile.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Designation</p>
                    <p className="text-sm text-gray-600">{profile.designation || 'Not specified'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Office Location</p>
                    <p className="text-sm text-gray-600">{profile.office_name || 'Not assigned'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Role</p>
                    <p className="text-sm text-gray-600">{profile.role_type || 'Employee'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Member Since</p>
                    <p className="text-sm text-gray-600">{formatDate(profile.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="text-sm font-bold text-gray-900 mb-2">Quick Actions</h2>
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm divide-y divide-gray-100">
                <button
                  onClick={() => setShowChangePasswordModal(true)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Lock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900">Change Password</p>
                    <p className="text-xs text-gray-600">Update your account password</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>

                <button
                  onClick={() => navigate("/help-support")}
                  className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                    <HelpCircle className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900">Help & Support</p>
                    <p className="text-xs text-gray-600">Get help and contact support</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>

                <button
                  onClick={() => navigate("/attendance-rules")}
                  className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900">Attendance Rules</p>
                    <p className="text-xs text-gray-600">View attendance policies</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* System Information */}
            <div>
              <h2 className="text-sm font-bold text-gray-900 mb-2">System Information</h2>
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Info className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Nexus Attendo</p>
                    <p className="text-xs text-gray-600">Employee Attendance Management System</p>
                    <p className="text-xs text-gray-500 mt-1">Version 2.0.0</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <div className="pt-2">
              <button
                onClick={() => setShowLogoutDialog(true)}
                className="w-full flex items-center justify-center gap-2 p-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors border border-red-200"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Logout Confirmation Dialog */}
        <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sign Out</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to sign out of your account?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout} className="bg-red-600 hover:bg-red-700">
                Sign Out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Change Password Modal */}
        <ChangePasswordModal 
          isOpen={showChangePasswordModal}
          onClose={() => setShowChangePasswordModal(false)}
        />
      </div>
    </DashboardLayout>
  );
};

export default ProfileScreen;