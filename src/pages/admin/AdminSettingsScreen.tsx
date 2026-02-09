import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Building2, 
  Clock, 
  MapPin, 
  Wifi, 
  Bell, 
  Shield,
  Users,
  ChevronRight,
  LogOut,
  HelpCircle,
  FileText,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import MobileContainer from "@/components/MobileContainer";
import AdminBottomNavigation from "@/components/AdminBottomNavigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const AdminSettingsScreen = () => {
  const navigate = useNavigate();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [strictMode, setStrictMode] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = () => {
    setShowLogoutDialog(false);
    navigate("/admin/login");
  };

  return (
    <MobileContainer>
      <div className="flex flex-col h-full min-h-[800px] pb-20">
        {/* Header */}
        <div className="px-6 pt-8 pb-4 border-b border-border">
          <h1 className="text-display mb-1">Settings</h1>
          <p className="text-caption">Configure attendance system</p>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 py-6 space-y-6 overflow-y-auto">
          {/* Office Configuration */}
          <div className="animate-fade-in-up">
            <h2 className="text-overline mb-3">Office Configuration</h2>
            <div className="card-elevated divide-y divide-border">
              <button 
                onClick={() => navigate("/admin/settings/locations")}
                className="flex items-center gap-4 p-4 w-full hover:bg-muted/50 transition-colors"
              >
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">Office Locations</p>
                  <p className="text-xs text-muted-foreground">Manage office premises</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>

              <button 
                onClick={() => navigate("/admin/settings/wifi")}
                className="flex items-center gap-4 p-4 w-full hover:bg-muted/50 transition-colors"
              >
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                  <Wifi className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">Wi-Fi Networks</p>
                  <p className="text-xs text-muted-foreground">Configure allowed networks</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>

              <button 
                onClick={() => navigate("/admin/settings/geofencing")}
                className="flex items-center gap-4 p-4 w-full hover:bg-muted/50 transition-colors"
              >
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">Geofencing</p>
                  <p className="text-xs text-muted-foreground">Set location boundaries</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Attendance Rules */}
          <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <h2 className="text-overline mb-3">Attendance Rules</h2>
            <div className="card-elevated divide-y divide-border">
              <button 
                onClick={() => navigate("/admin/settings/window")}
                className="flex items-center gap-4 p-4 w-full hover:bg-muted/50 transition-colors"
              >
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">Attendance Window</p>
                  <p className="text-xs text-muted-foreground">9:00 AM - 6:00 PM</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>

              <button 
                onClick={() => navigate("/admin/settings/grace")}
                className="flex items-center gap-4 p-4 w-full hover:bg-muted/50 transition-colors"
              >
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">Grace Period</p>
                  <p className="text-xs text-muted-foreground">15 minutes after start time</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>

              <div className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Strict Mode</p>
                  <p className="text-xs text-muted-foreground">Require both location & Wi-Fi</p>
                </div>
                <button 
                  onClick={() => setStrictMode(!strictMode)}
                  className="text-primary"
                >
                  {strictMode ? (
                    <ToggleRight className="w-8 h-8" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* User Management */}
          <div className="animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
            <h2 className="text-overline mb-3">User Management</h2>
            <div className="card-elevated divide-y divide-border">
              <button 
                onClick={() => navigate("/admin/employees")}
                className="flex items-center gap-4 p-4 w-full hover:bg-muted/50 transition-colors"
              >
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">Employee Management</p>
                  <p className="text-xs text-muted-foreground">Add, edit, or remove employees</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>

              <button 
                onClick={() => navigate("/admin/pending-approvals")}
                className="flex items-center gap-4 p-4 w-full hover:bg-muted/50 transition-colors"
              >
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">Pending Approvals</p>
                  <p className="text-xs text-muted-foreground">Review registration requests</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <h2 className="text-overline mb-3">Notifications</h2>
            <div className="card-elevated">
              <div className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-xs text-muted-foreground">Daily attendance alerts</p>
                </div>
                <button 
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className="text-primary"
                >
                  {notificationsEnabled ? (
                    <ToggleRight className="w-8 h-8" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Support */}
          <div className="animate-fade-in-up" style={{ animationDelay: "0.25s" }}>
            <h2 className="text-overline mb-3">Support</h2>
            <div className="card-elevated divide-y divide-border">
              <button 
                onClick={() => navigate("/admin/settings/help")}
                className="flex items-center gap-4 p-4 w-full hover:bg-muted/50 transition-colors"
              >
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">Help Center</p>
                  <p className="text-xs text-muted-foreground">FAQs and documentation</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>

              <button 
                onClick={() => navigate("/admin/settings/terms")}
                className="flex items-center gap-4 p-4 w-full hover:bg-muted/50 transition-colors"
              >
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">Terms & Policies</p>
                  <p className="text-xs text-muted-foreground">Legal information</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Logout */}
          <div className="animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <button
              onClick={() => setShowLogoutDialog(true)}
              className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-destructive-muted text-destructive rounded-xl font-medium transition-colors hover:bg-destructive/20"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>

          {/* Version */}
          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground">Nexon Attendance Admin v1.0.0</p>
            <p className="text-xs text-muted-foreground">© 2024 Nexon Pvt Ltd</p>
          </div>
        </div>

        <AdminBottomNavigation />

        {/* Logout Confirmation Dialog */}
        <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <AlertDialogContent className="max-w-[340px] rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Sign Out</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to sign out? You'll need to log in again to access the admin portal.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row gap-3">
              <AlertDialogCancel className="flex-1 mt-0">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleLogout}
                className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Sign Out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MobileContainer>
  );
};

export default AdminSettingsScreen;
