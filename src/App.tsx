import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SplashScreen from "./pages/SplashScreen";
import LoginScreen from "./pages/LoginScreen";
import DashboardScreen from "./pages/DashboardScreen";
import AttendanceProcessingScreen from "./pages/AttendanceProcessingScreen";
import AttendanceSuccessScreen from "./pages/AttendanceSuccessScreen";
import AttendanceErrorScreen from "./pages/AttendanceErrorScreen";
import HistoryScreen from "./pages/HistoryScreen";
import ProfileScreen from "./pages/ProfileScreen";
import AdminLoginScreen from "./pages/admin/AdminLoginScreen";
import AdminDashboardScreen from "./pages/admin/AdminDashboardScreen";
import AdminEmployeesScreen from "./pages/admin/AdminEmployeesScreen";
import AdminReportsScreen from "./pages/admin/AdminReportsScreen";
import AdminSettingsScreen from "./pages/admin/AdminSettingsScreen";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Employee Routes */}
          <Route path="/" element={<SplashScreen />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/dashboard" element={<DashboardScreen />} />
          <Route path="/attendance-processing" element={<AttendanceProcessingScreen />} />
          <Route path="/attendance-success" element={<AttendanceSuccessScreen />} />
          <Route path="/attendance-error" element={<AttendanceErrorScreen />} />
          <Route path="/history" element={<HistoryScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLoginScreen />} />
          <Route path="/admin/dashboard" element={<AdminDashboardScreen />} />
          <Route path="/admin/employees" element={<AdminEmployeesScreen />} />
          <Route path="/admin/reports" element={<AdminReportsScreen />} />
          <Route path="/admin/settings" element={<AdminSettingsScreen />} />
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
