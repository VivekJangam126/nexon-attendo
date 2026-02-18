import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, MapPin, Calendar, AlertTriangle, CheckCircle2 } from "lucide-react";
import MobileContainer from "@/components/MobileContainer";

const AttendanceRulesScreen = () => {
  const navigate = useNavigate();

  const rules = [
    {
      icon: Clock,
      title: "Attendance Window",
      description: "You can mark your attendance between 9:00 AM and 6:00 PM on working days (Monday to Friday).",
    },
    {
      icon: Calendar,
      title: "Grace Period",
      description: "A 15-minute grace period is allowed after 9:00 AM. Marking after 9:15 AM will be recorded as 'Late'.",
    },
    {
      icon: MapPin,
      title: "Office Location Required",
      description: "You must be physically present at your assigned office location. The system checks that you are within the office area.",
    },
    {
      icon: CheckCircle2,
      title: "How It Works",
      description: "When you tap 'Mark Attendance', the app checks your location automatically. If verified, your attendance is recorded.",
    },
    {
      icon: AlertTriangle,
      title: "Common Issues",
      description: "If attendance fails, ensure location permission is enabled and you're within the office premises.",
    },
  ];

  return (
    <MobileContainer>
      <div className="flex flex-col min-h-full">
        {/* Header */}
        <div className="px-6 pt-8 pb-4 border-b border-border flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-title">Attendance Rules</h1>
            <p className="text-caption">How attendance marking works</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 py-6 overflow-y-auto space-y-4">
          {rules.map((rule, index) => {
            const Icon = rule.icon;
            return (
              <div key={index} className="card-elevated p-4 animate-fade-in-up" style={{ animationDelay: `${index * 0.05}s` }}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium mb-1">{rule.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{rule.description}</p>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="bg-accent rounded-xl p-4 mt-4">
            <p className="text-sm text-center text-accent-foreground">
              For any questions about attendance policy, please contact HR at hr@nexon.com
            </p>
          </div>
        </div>
      </div>
    </MobileContainer>
  );
};

export default AttendanceRulesScreen;
