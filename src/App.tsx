import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import SplashScreen from "./pages/SplashScreen";
import LoginScreen from "./pages/LoginScreen";
import RegisterScreen from "./pages/RegisterScreen";
import RegistrationPendingScreen from "./pages/RegistrationPendingScreen";
import AccountBlockedScreen from "./pages/AccountBlockedScreen";
import ForgotPasswordScreen from "./pages/ForgotPasswordScreen";
import PasswordResetSentScreen from "./pages/PasswordResetSentScreen";
import HelpSupportScreen from "./pages/HelpSupportScreen";
import AttendanceRulesScreen from "./pages/AttendanceRulesScreen";
import DashboardScreen from "./pages/DashboardScreen";
import AttendanceProcessingScreen from "./pages/AttendanceProcessingScreen";
import AttendanceSuccessScreen from "./pages/AttendanceSuccessScreen";
import AttendanceErrorScreen from "./pages/AttendanceErrorScreen";
import HistoryScreen from "./pages/HistoryScreen";
import ProfileScreen from "./pages/ProfileScreen";
import AdminLoginScreen from "./pages/admin/AdminLoginScreen";
import AdminDashboardScreen from "./pages/admin/AdminDashboardScreen";
import AdminEmployeesScreen from "./pages/admin/AdminEmployeesScreen";
import AdminEmployeeDetailScreen from "./pages/admin/AdminEmployeeDetailScreen";
import AdminPendingApprovalsScreen from "./pages/admin/AdminPendingApprovalsScreen";
import AdminReportsNewScreen from "./pages/admin/AdminReportsNewScreen";
import AdminHistoryReportsScreen from "./pages/admin/AdminHistoryReportsScreen";
import AdminSettingsScreen from "./pages/admin/AdminSettingsScreen";
import OfficeLocationsScreen from "./pages/admin/settings/OfficeLocationsScreen";
import GeofencingScreen from "./pages/admin/settings/GeofencingScreen";
import AttendanceWindowScreen from "./pages/admin/settings/AttendanceWindowScreen";
import GracePeriodScreen from "./pages/admin/settings/GracePeriodScreen";
import CheckoutSettingsScreen from "./pages/admin/settings/CheckoutSettingsScreen";
import HelpCenterScreen from "./pages/admin/settings/HelpCenterScreen";
import TermsPoliciesScreen from "./pages/admin/settings/TermsPoliciesScreen";
import NotificationSettingsScreen from "./pages/admin/settings/NotificationSettingsScreen";
import EmployeeManagementScreen from "./pages/admin/settings/EmployeeManagementScreen";
import LeaveManagementPage from "./pages/LeaveManagement";
import AdminLeaveManagementPage from "./pages/admin/LeaveManagement";
import AdminAnalyticsScreen from "./pages/admin/AdminAnalyticsScreen";
import AdminPerformanceDashboard from "./pages/admin/AdminPerformanceDashboard";
import AdminHolidayCalendarScreen from "./pages/admin/AdminHolidayCalendarScreen";
import HolidayCalendarScreen from "./pages/HolidayCalendarScreen";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
          {/* Employee Routes */}
          <Route path="/" element={<SplashScreen />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/register" element={<RegisterScreen />} />
          <Route path="/registration-pending" element={<RegistrationPendingScreen />} />
          <Route path="/account-blocked" element={<AccountBlockedScreen />} />
          <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
          <Route path="/password-reset-sent" element={<PasswordResetSentScreen />} />
          <Route path="/help-support" element={<HelpSupportScreen />} />
          <Route path="/attendance-rules" element={<AttendanceRulesScreen />} />
          <Route path="/dashboard" element={<DashboardScreen />} />
          <Route path="/attendance-processing" element={<AttendanceProcessingScreen />} />
          <Route path="/attendance-success" element={<AttendanceSuccessScreen />} />
          <Route path="/attendance-error" element={<AttendanceErrorScreen />} />
          <Route path="/history" element={<HistoryScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/leave" element={<LeaveManagementPage />} />
          <Route path="/calendar" element={<HolidayCalendarScreen />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLoginScreen />} />
          <Route path="/admin/dashboard" element={<AdminDashboardScreen />} />
          <Route path="/admin/employees" element={<AdminEmployeesScreen />} />
          <Route path="/admin/employee/:id" element={<AdminEmployeeDetailScreen />} />
          <Route path="/admin/pending-approvals" element={<AdminPendingApprovalsScreen />} />
          <Route path="/admin/reports" element={<AdminReportsNewScreen />} />
          <Route path="/admin/history" element={<AdminHistoryReportsScreen />} />
          <Route path="/admin/settings" element={<AdminSettingsScreen />} />
          
          {/* Admin Settings Sub-routes */}
          <Route path="/admin/settings/offices" element={<OfficeLocationsScreen />} />
          <Route path="/admin/settings/geofencing" element={<GeofencingScreen />} />
          <Route path="/admin/settings/window" element={<AttendanceWindowScreen />} />
          <Route path="/admin/settings/grace" element={<GracePeriodScreen />} />
          <Route path="/admin/settings/checkout" element={<CheckoutSettingsScreen />} />
          <Route path="/admin/settings/help" element={<HelpCenterScreen />} />
          <Route path="/admin/settings/terms" element={<TermsPoliciesScreen />} />
          <Route path="/admin/settings/notifications" element={<NotificationSettingsScreen />} />
          <Route path="/admin/settings/employee-management" element={<EmployeeManagementScreen />} />
          <Route path="/admin/leave" element={<AdminLeaveManagementPage />} />
          <Route path="/admin/analytics" element={<AdminAnalyticsScreen />} />
          <Route path="/admin/performance" element={<AdminPerformanceDashboard />} />
          <Route path="/admin/calendar" element={<AdminHolidayCalendarScreen />} />
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
