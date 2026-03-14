import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Clock,
  Calendar,
  BarChart3,
  BookOpen,
  DollarSign,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Building2,
  TrendingUp,
} from 'lucide-react';

interface SidebarProps {
  isAdmin?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isAdmin = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const adminMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Users, label: 'Employees', path: '/admin/employees' },
    { icon: Clock, label: 'Attendance', path: '/admin/history' },
    { icon: Calendar, label: 'Leave Management', path: '/admin/leave' },
    { icon: Calendar, label: 'Holiday Calendar', path: '/admin/calendar' },
    { icon: TrendingUp, label: 'Performance', path: '/admin/performance' },
    { icon: BarChart3, label: 'Reports', path: '/admin/reports' },
    { icon: DollarSign, label: 'Payroll', path: '/admin/payroll' },
  ];

  const employeeMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Clock, label: 'Attendance', path: '/history' },
    { icon: Calendar, label: 'Leave', path: '/leave' },
    { icon: Calendar, label: 'My Holidays', path: '/calendar' },
    { icon: HelpCircle, label: 'Help', path: '/help-support' },
  ];

  const menuItems = isAdmin ? adminMenuItems : employeeMenuItems;
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-40 ${
        isCollapsed ? 'w-20' : 'w-64'
      } hidden md:flex flex-col`}
    >
      {/* Logo Section */}
      <div className="flex items-center justify-between px-6 py-6 border-b border-gray-200">
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center w-full' : ''}`}>
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <p className="font-semibold text-gray-900 text-sm">Nexus</p>
              <p className="text-xs text-gray-500">Corporate</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={`${item.path}-${index}`}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                active
                  ? 'bg-amber-50 text-amber-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              title={isCollapsed ? item.label : ''}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-amber-600' : 'text-gray-400'}`} />
              {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Collapse Button */}
      <div className="px-3 py-4 border-t border-gray-200">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
