import { useNavigate } from "react-router-dom";
import { Building2, ArrowRight } from "lucide-react";
import MobileContainer from "@/components/MobileContainer";

const Index = () => {
  const navigate = useNavigate();

  return (
    <MobileContainer>
      <div className="flex flex-col items-center justify-center h-full min-h-[800px] px-8">
        {/* Logo */}
        <div className="animate-scale-in mb-8">
          <div className="w-24 h-24 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
            <Building2 className="w-12 h-12 text-primary-foreground" />
          </div>
        </div>

        {/* Welcome Text */}
        <div className="text-center mb-8 animate-fade-in-up">
          <h1 className="text-display text-foreground mb-2">Nexon Attendance</h1>
          <p className="text-body-secondary">Employee Attendance System</p>
        </div>

        {/* Company Name */}
        <div className="mb-12 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <p className="text-overline">Nexon Pvt Ltd</p>
        </div>

        {/* CTA Button */}
        <button
          onClick={() => navigate("/login")}
          className="btn-primary-large max-w-xs flex items-center justify-center gap-2 animate-fade-in-up"
          style={{ animationDelay: "0.2s" }}
        >
          Get Started
          <ArrowRight className="w-5 h-5" />
        </button>

        {/* Footer */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <p className="text-caption text-center">© 2024 Nexon Pvt Ltd</p>
        </div>
      </div>
    </MobileContainer>
  );
};

export default Index;
