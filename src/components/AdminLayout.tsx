import React from "react";
import DashboardLayout from "./DashboardLayout";

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title = "Dashboard" }) => {
  return (
    <DashboardLayout title={title} isAdmin>
      {children}
    </DashboardLayout>
  );
};

export default AdminLayout;
