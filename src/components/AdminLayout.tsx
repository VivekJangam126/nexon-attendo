import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileBarChart,
  Settings,
  LogOut,
  Menu,
  X,
  Building2,
} from "lucide-react";
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
import { useAuth } from "@/hooks/useAuth";

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerContent?: React.ReactNode;
  showBackButton?: boolean;
  onBack?: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
  { icon: Users, label: "Employees", path: "/admin/employees" },
  { icon: FileBarChart, label: "Reports", path: "/admin/history" },
  { icon: Settings, label: "Settings", path: "/admin/settings" },
];

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  const handleLogout = async () => {
    setShowLogoutDialog(false);
    try {
      await logout();
      // Force navigation after logout
      window.location.href = '/admin/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Still navigate even if there's an error
      window.location.href = '/admin/login';
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border fixed inset-y-0 left-0 z-30">
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">Nexus Attendo</p>
            <p className="text-xs text-muted-foreground">Admin Portal</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                isActive(item.path)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-border">
          <button
            onClick={() => setShowLogoutDialog(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive-muted transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <aside
            className="absolute left-0 top-0 bottom-0 w-64 bg-card border-r border-border flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary-foreground" />
                </div>
                <p className="font-semibold text-sm text-foreground">Nexus</p>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-muted rounded-lg">
                <X className="w-5 h-5 text-foreground" />
              </button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="px-3 py-4 border-t border-border">
              <button
                onClick={() => { setShowLogoutDialog(true); setSidebarOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive-muted transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col md:ml-64 min-h-screen lg:min-h-screen lg:h-auto h-full lg:relative fixed inset-0 lg:inset-auto">
        {/* Top bar for mobile */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border fixed top-0 left-0 right-0 z-30 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-muted rounded-lg flex-shrink-0">
            <Menu className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">Nexus Admin</span>
          </div>
          <div className="w-9 flex-shrink-0" /> {/* spacer */}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto md:overflow-visible pt-[57px] md:pt-0 pb-[73px] lg:pb-0">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-30 safe-area-bottom shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
          <div className="flex items-center justify-around px-2 py-2 max-w-full">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center gap-1 px-2 py-1.5 rounded-lg min-w-[60px] flex-1 max-w-[100px] transition-colors ${
                  isActive(item.path)
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-[10px] font-medium leading-tight truncate w-full text-center">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* Logout dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-[340px] rounded-2xl mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out? You'll need to log in again to access the admin portal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-3">
            <AlertDialogCancel className="w-full sm:flex-1 mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="w-full sm:flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminLayout;
