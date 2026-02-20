import { 
  LayoutDashboard, 
  Users, 
  FileBarChart, 
  Settings,
  LogOut
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const AdminBottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
    { icon: Users, label: "Employees", path: "/admin/employees" },
    { icon: FileBarChart, label: "Reports", path: "/admin/history" },
    { icon: Settings, label: "Settings", path: "/admin/settings" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="bottom-nav z-50">
      <nav className="flex items-center justify-around">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`nav-item ${isActive(item.path) ? "nav-item-active" : ""}`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default AdminBottomNavigation;
