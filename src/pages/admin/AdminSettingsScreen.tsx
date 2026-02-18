import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Building2, Clock, MapPin, Bell, Users,
  ChevronRight, HelpCircle, FileText, Lock, Shield
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { attendanceSettingsService } from "@server";
import { toast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";

const AdminSettingsScreen = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [attendanceWindow, setAttendanceWindow] = useState("Loading...");
  const [strictMode, setStrictMode] = useState(false);
  const [updatingStrictMode, setUpdatingStrictMode] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const { window } = await attendanceSettingsService.getAttendanceWindow();
      if (window) {
        setAttendanceWindow(`${window.start_time} - ${window.end_time}`);
      }
      
      const { strictMode: currentStrictMode } = await attendanceSettingsService.getStrictMode();
      setStrictMode(currentStrictMode);
    };

    fetchSettings();
  }, []);

  const handleStrictModeToggle = async (enabled: boolean) => {
    if (!profile) return;
    
    setUpdatingStrictMode(true);
    const { error } = await attendanceSettingsService.updateStrictMode(enabled, profile.id);
    
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setStrictMode(enabled);
      toast({
        title: "Settings Updated",
        description: `GPS validation ${enabled ? 'enabled' : 'disabled'}.`,
      });
    }
    
    setUpdatingStrictMode(false);
  };

  const handleComingSoon = () => {
    toast({
      title: "Coming Soon",
      description: "This feature is under development and will be available soon.",
    });
  };

  const sections = [
    {
      title: "Office Configuration",
      items: [
        { icon: Building2, label: "Office Locations", desc: "Manage office locations", path: "/admin/settings/offices", disabled: false },
        { icon: MapPin, label: "Geofencing", desc: "GPS radius settings", path: "/admin/settings/geofencing", disabled: false },
      ],
    },
    {
      title: "Attendance Rules",
      items: [
        { icon: Clock, label: "Attendance Window", desc: attendanceWindow, path: "/admin/settings/window", disabled: false },
        { icon: Clock, label: "Grace Period", desc: "Late arrival tolerance", path: "/admin/settings/grace", disabled: false },
        { icon: Shield, label: "GPS Validation", desc: strictMode ? "Required" : "Optional", path: null, disabled: false, isToggle: true },
        { icon: Bell, label: "Notifications", desc: "SMS & Email alerts", path: "/admin/settings/notifications", disabled: false },
      ],
    },
    {
      title: "User Management",
      items: [
        { icon: Users, label: "Employee Management", desc: "Activate, deactivate, or delete", path: "/admin/settings/employee-management", disabled: false },
        { icon: Clock, label: "Pending Approvals", desc: "Review registration requests", path: "/admin/pending-approvals", disabled: false },
      ],
    },
    {
      title: "Support",
      items: [
        { icon: HelpCircle, label: "Help Center", desc: "Coming Soon", path: null, disabled: true },
        { icon: FileText, label: "Terms & Policies", desc: "Coming Soon", path: null, disabled: true },
      ],
    },
  ];

  return (
    <AdminLayout>
      <div className="flex flex-col min-h-full pb-20 md:pb-0">
        <div className="px-4 sm:px-6 lg:px-8 pt-6 lg:pt-8 pb-4 border-b border-border">
          <h1 className="text-display mb-1">Settings</h1>
          <p className="text-caption">Configure attendance system</p>
        </div>

        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
            {sections.map((section, si) => (
              <div key={si} className="animate-fade-in-up" style={{ animationDelay: `${si * 0.05}s` }}>
                <h2 className="text-overline mb-3">{section.title}</h2>
                <div className="card-elevated divide-y divide-border">
                  {section.items.map((item: any, ii) => (
                    item.isToggle ? (
                      <div 
                        key={ii} 
                        className="flex items-center gap-4 p-4 w-full"
                      >
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-accent">
                          <item.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                        <Switch
                          checked={strictMode}
                          onCheckedChange={handleStrictModeToggle}
                          disabled={updatingStrictMode}
                        />
                      </div>
                    ) : (
                      <button 
                        key={ii} 
                        onClick={() => item.disabled ? handleComingSoon() : navigate(item.path!)} 
                        className={`flex items-center gap-4 p-4 w-full transition-colors ${
                          item.disabled 
                            ? 'opacity-60 cursor-not-allowed' 
                            : 'hover:bg-muted/50'
                        }`}
                        disabled={item.disabled}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          item.disabled ? 'bg-muted' : 'bg-accent'
                        }`}>
                          <item.icon className={`w-5 h-5 ${item.disabled ? 'text-muted-foreground' : 'text-primary'}`} />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{item.label}</p>
                            {item.disabled && <Lock className="w-3 h-3 text-muted-foreground" />}
                          </div>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                        {!item.disabled && <ChevronRight className="w-5 h-5 text-muted-foreground" />}
                      </button>
                    )
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Version */}
          <div className="text-center pt-8 pb-4">
            <p className="text-xs text-muted-foreground">Nexus Attendo Admin v1.0.0</p>
            <p className="text-xs text-muted-foreground">© 2024 Nexus Pvt Ltd</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettingsScreen;
