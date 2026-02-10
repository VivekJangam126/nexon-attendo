import React from "react";
import BottomNavigation from "@/components/BottomNavigation";

interface EmployeeLayoutProps {
  children: React.ReactNode;
  showNav?: boolean;
}

const EmployeeLayout: React.FC<EmployeeLayoutProps> = ({ children, showNav = true }) => {
  return (
    <div className="min-h-screen bg-muted flex items-start md:items-center justify-center md:p-4">
      <div
        className="w-full bg-background md:shadow-2xl md:rounded-3xl relative flex flex-col mobile-container"
        style={{ height: "100vh", maxHeight: "100vh" }}
      >
        <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col min-h-0">
          {children}
        </div>
        {showNav && <BottomNavigation />}
      </div>
    </div>
  );
};

export default EmployeeLayout;
