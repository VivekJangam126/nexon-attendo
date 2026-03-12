import React from "react";
import DashboardLayout from "./DashboardLayout";

interface EmployeeLayoutProps {
  children: React.ReactNode;
  title?: string;
  showNav?: boolean;
}

const EmployeeLayout: React.FC<EmployeeLayoutProps> = ({ children, title = "Dashboard", showNav = true }) => {
  if (!showNav) {
    return <>{children}</>;
  }

  return (
    <DashboardLayout title={title} isAdmin={false}>
      {children}
    </DashboardLayout>
  );
};

export default EmployeeLayout;
