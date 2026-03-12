import React, { useState } from 'react';
import { LogOut, Settings, User, ChevronDown, Menu } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface NavbarProps {
  title?: string;
  onMenuClick?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ title = 'Dashboard', onMenuClick }) => {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = async () => {
    setShowLogoutDialog(false);
    try {
      await logout();
      window.location.href = profile?.role === 'admin' ? '/admin/login' : '/login';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = profile?.role === 'admin' ? '/admin/login' : '/login';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-30 md:ml-64">
        <div className="px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 flex items-center justify-between">
          {/* Left Section - Menu & Title */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={onMenuClick}
              className="md:hidden p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </button>
            <h1 className="text-sm sm:text-base font-semibold text-gray-900">{title}</h1>
          </div>

          {/* Right Section - Profile */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-1.5 sm:gap-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                  {getInitials(profile?.full_name || 'User')}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-medium text-gray-900 truncate max-w-[100px]">{profile?.full_name}</p>
                  <p className="text-xs text-gray-500 capitalize">{profile?.role}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600" />
              </button>

              {/* Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-1 w-44 sm:w-48 bg-white rounded-lg border border-gray-200 shadow-lg z-50">
                  <div className="p-3 sm:p-4 border-b border-gray-200">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{profile?.full_name}</p>
                    <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
                  </div>
                  <div className="py-1.5 sm:py-2">
                    {profile?.role === 'employee' && (
                      <button
                        onClick={() => {
                          navigate('/profile');
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        My Profile
                      </button>
                    )}
                    {profile?.role === 'admin' && (
                      <button
                        onClick={() => {
                          navigate('/admin/settings');
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Settings
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowLogoutDialog(true);
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Logout Dialog */}
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
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Navbar;
