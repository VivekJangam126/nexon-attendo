import { useNavigate } from "react-router-dom";
import { 
  User, Briefcase, Building2, Mail, Phone, 
  LogOut, ChevronRight, Lock, HelpCircle, FileText, Info
} from "lucide-react";
import MobileContainer from "@/components/MobileContainer";
import BottomNavigation from "@/components/BottomNavigation";
import { useState } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ProfileScreen = () => {
  const navigate = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const employeeInfo = {
    name: "Rahul Kumar",
    employeeId: "NXN-2024-0142",
    email: "rahul.kumar@nexon.com",
    phone: "+91 98765 43210",
    role: "Software Developer",
    department: "Engineering",
    office: "Nexon Pvt Ltd – Head Office",
    joinDate: "March 15, 2024",
  };

  const handleLogout = () => {
    setShowLogoutDialog(false);
    navigate("/login");
  };

  return (
    <MobileContainer>
      <div className="flex flex-col h-full min-h-[800px] pb-20">
        {/* Header */}
        <div className="px-6 pt-8 pb-6 bg-primary text-primary-foreground rounded-b-3xl">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-primary-foreground/20 rounded-full flex items-center justify-center">
              <span className="text-3xl font-semibold">RK</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold">{employeeInfo.name}</h1>
              <p className="text-primary-foreground/80 text-sm">{employeeInfo.role}</p>
              <p className="text-primary-foreground/60 text-xs mt-1">ID: {employeeInfo.employeeId}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 py-6 space-y-6 overflow-y-auto">
          {/* Employee Details */}
          <div className="animate-fade-in-up">
            <h2 className="text-overline mb-3">Employee Details</h2>
            <div className="card-elevated divide-y divide-border">
              {[
                { icon: User, label: "Full Name", value: employeeInfo.name },
                { icon: Briefcase, label: "Department", value: employeeInfo.department },
                { icon: Building2, label: "Office Location", value: employeeInfo.office },
                { icon: Mail, label: "Email", value: employeeInfo.email },
                { icon: Phone, label: "Phone", value: employeeInfo.phone },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-caption">{item.label}</p>
                    <p className="font-medium">{item.value}</p>
                  </div>
                </div>
              ))}
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
            <p className="text-xs text-muted-foreground">© 2024 Nexon Pvt Ltd</p>
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
