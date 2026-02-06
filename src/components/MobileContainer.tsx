import React from "react";

interface MobileContainerProps {
  children: React.ReactNode;
  className?: string;
}

const MobileContainer: React.FC<MobileContainerProps> = ({ children, className = "" }) => {
  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <div 
        className={`mobile-container bg-background shadow-2xl rounded-3xl overflow-hidden relative ${className}`}
        style={{ minHeight: "calc(100vh - 2rem)", maxHeight: "900px" }}
      >
        {children}
      </div>
    </div>
  );
};

export default MobileContainer;
