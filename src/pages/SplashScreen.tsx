import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2 } from "lucide-react";
import MobileContainer from "@/components/MobileContainer";

const SplashScreen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login");
    }, 2500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <MobileContainer>
      <div className="flex flex-col items-center justify-center min-h-full px-8">
        {/* Logo Area */}
        <div className="animate-scale-in">
          <div className="w-24 h-24 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 mb-8">
            <Building2 className="w-12 h-12 text-primary-foreground" />
          </div>
        </div>

        {/* Brand Text */}
        <div className="text-center animate-fade-in-up delay-200">
          <h1 className="text-display text-foreground mb-2">Nexus Corporate Pvt Ltd</h1>
          <p className="text-body-secondary">Enterprise HR Management Platform</p>
        </div>

        {/* Company Name */}
        <div className="mt-8 animate-fade-in-up delay-300">
          <p className="text-overline">© 2026 Nexus Corporate Pvt Ltd</p>
        </div>

        {/* Loading Indicator */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse-gentle" />
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse-gentle" style={{ animationDelay: "0.2s" }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse-gentle" style={{ animationDelay: "0.4s" }} />
          </div>
        </div>
      </div>
    </MobileContainer>
  );
};

export default SplashScreen;
