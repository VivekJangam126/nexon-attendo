import React from "react";

interface MobileContainerProps {
  children: React.ReactNode;
  className?: string;
}

const MobileContainer: React.FC<MobileContainerProps> = ({ children, className = "" }) => {
  return (
    <div className="min-h-screen bg-muted flex items-start md:items-center justify-center">
      <div 
        className={`mobile-container bg-background md:shadow-2xl md:rounded-3xl relative flex flex-col ${className}`}
        style={{ minHeight: "100vh" }}
      >
        <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
};

export default MobileContainer;
