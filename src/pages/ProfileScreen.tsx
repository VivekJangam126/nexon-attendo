import { useNavigate } from "react-router-dom";
import { 
  User, 
  Briefcase, 
  Building2, 
  Mail, 
  Phone, 
  LogOut, 
  ChevronRight,
  Lock,
  HelpCircle,
  FileText
} from "lucide-react";
import MobileContainer from "@/components/MobileContainer";
import BottomNavigation from "@/components/BottomNavigation";

const ProfileScreen = () => {
  const navigate = useNavigate();

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
              <div className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-caption">Full Name</p>
                  <p className="font-medium">{employeeInfo.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-caption">Department</p>
                  <p className="font-medium">{employeeInfo.department}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-caption">Office Location</p>
                  <p className="font-medium">{employeeInfo.office}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-caption">Email</p>
                  <p className="font-medium">{employeeInfo.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-caption">Phone</p>
                  <p className="font-medium">{employeeInfo.phone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Account Options */}
          <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <h2 className="text-overline mb-3">Account</h2>
            <div className="card-elevated divide-y divide-border">
              <button className="flex items-center gap-4 p-4 w-full hover:bg-muted/50 transition-colors">
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">Change Password</p>
                  <p className="text-xs text-muted-foreground">Update your account password</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>

              <button className="flex items-center gap-4 p-4 w-full hover:bg-muted/50 transition-colors">
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">Help & Support</p>
                  <p className="text-xs text-muted-foreground">Get assistance or report issues</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>

              <button className="flex items-center gap-4 p-4 w-full hover:bg-muted/50 transition-colors">
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
              onClick={handleLogout}
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
      </div>
    </MobileContainer>
  );
};

export default ProfileScreen;
