import { Home, Clock, User, Calendar, CalendarDays } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: Calendar, label: "Leave", path: "/leave" },
    { icon: CalendarDays, label: "Holidays", path: "/calendar" },
    { icon: Clock, label: "History", path: "/history" },
    { icon: User, label: "Profile", path: "/profile" },
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

export default BottomNavigation;
