import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Building2, Clock, MapPin, Wifi, Bell, Shield, Users,
  ChevronRight, HelpCircle, FileText, ToggleLeft, ToggleRight
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";

const AdminSettingsScreen = () => {
  const navigate = useNavigate();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [strictMode, setStrictMode] = useState(false);

  const sections = [
    {
      title: "Office Configuration",
      items: [
        { icon: Building2, label: "Office Locations", desc: "Manage office premises", path: "/admin/settings/locations" },
        { icon: Wifi, label: "Wi-Fi Networks", desc: "Configure allowed networks", path: "/admin/settings/wifi" },
        { icon: MapPin, label: "Geofencing", desc: "Set location boundaries", path: "/admin/settings/geofencing" },
      ],
    },
    {
      title: "Attendance Rules",
      items: [
        { icon: Clock, label: "Attendance Window", desc: "9:00 AM - 6:00 PM", path: "/admin/settings/window" },
        { icon: Clock, label: "Grace Period", desc: "15 minutes after start time", path: "/admin/settings/grace" },
      ],
    },
    {
      title: "User Management",
      items: [
        { icon: Users, label: "Employee Management", desc: "Add, edit, or remove employees", path: "/admin/employees" },
        { icon: Clock, label: "Pending Approvals", desc: "Review registration requests", path: "/admin/pending-approvals" },
      ],
    },
    {
      title: "Support",
      items: [
        { icon: HelpCircle, label: "Help Center", desc: "FAQs and documentation", path: "/admin/settings/help" },
        { icon: FileText, label: "Terms & Policies", desc: "Legal information", path: "/admin/settings/terms" },
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
                  {section.items.map((item, ii) => (
                    <button key={ii} onClick={() => navigate(item.path)} className="flex items-center gap-4 p-4 w-full hover:bg-muted/50 transition-colors">
                      <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Toggles */}
            <div className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <h2 className="text-overline mb-3">System</h2>
              <div className="card-elevated divide-y divide-border">
                <div className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Strict Mode</p>
                    <p className="text-xs text-muted-foreground">Require both location & Wi-Fi</p>
                  </div>
                  <button onClick={() => setStrictMode(!strictMode)} className="text-primary">
                    {strictMode ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
                  </button>
                </div>
                <div className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-xs text-muted-foreground">Daily attendance alerts</p>
                  </div>
                  <button onClick={() => setNotificationsEnabled(!notificationsEnabled)} className="text-primary">
                    {notificationsEnabled ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Version */}
          <div className="text-center pt-8 pb-4">
            <p className="text-xs text-muted-foreground">Nexon Attendance Admin v1.0.0</p>
            <p className="text-xs text-muted-foreground">© 2024 Nexon Pvt Ltd</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettingsScreen;
