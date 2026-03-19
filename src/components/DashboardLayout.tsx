import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { X, LayoutDashboard, Clock, Calendar, CalendarDays, HelpCircle, Users, BarChart3, TrendingUp } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const MobileMenuItems: React.FC<{ isAdmin?: boolean }> = ({ isAdmin = false }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const adminMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Users, label: 'Employees', path: '/admin/employees' },
    { icon: Clock, label: 'Attendance', path: '/admin/history' },
    { icon: Calendar, label: 'Leave Management', path: '/admin/leave' },
    { icon: TrendingUp, label: 'Performance', path: '/admin/performance' },
    { icon: BarChart3, label: 'Reports', path: '/admin/reports' },
    { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
    { icon: HelpCircle, label: 'Help Desk', path: '/admin/help' },
  ];

  const employeeMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Clock, label: 'Attendance', path: '/history' },
    { icon: Calendar, label: 'Leave', path: '/leave' },
    { icon: CalendarDays, label: 'Holidays', path: '/calendar' },
    { icon: HelpCircle, label: 'Help', path: '/help-support' },
  ];

  const menuItems = isAdmin ? adminMenuItems : employeeMenuItems;
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <>
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
          >
            <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-amber-600' : 'text-gray-400'}`} />
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        );
      })}
    </>
  );
};

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  isAdmin?: boolean;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  title = 'Dashboard',
  isAdmin = false 
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 z-40 md:hidden transform transition-transform duration-300 flex flex-col ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Menu</h2>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          <MobileMenuItems isAdmin={isAdmin} />
        </nav>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar isAdmin={isAdmin} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:ml-64">
        {/* Navbar */}
        <Navbar title={title} onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto pt-20 pb-8 px-3 sm:px-4 lg:px-8">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
