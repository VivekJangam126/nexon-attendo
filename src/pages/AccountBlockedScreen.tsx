import { useNavigate, useSearchParams } from "react-router-dom";
import { ShieldX, Clock, XCircle, ArrowLeft } from "lucide-react";
import MobileContainer from "@/components/MobileContainer";

type BlockReason = "pending" | "rejected" | "deactivated";

const configs: Record<BlockReason, { icon: typeof ShieldX; title: string; description: string; color: string; bgColor: string }> = {
  pending: {
    icon: Clock,
    title: "Account Pending Approval",
    description: "Your registration is still being reviewed by an administrator. You will be notified once your account is approved.",
    color: "bg-warning",
    bgColor: "bg-warning-muted",
  },
  rejected: {
    icon: XCircle,
    title: "Your Access Has Been Denied",
    description: "Your registration request has been rejected by an administrator. You do not have access to this system.",
    color: "bg-destructive",
    bgColor: "bg-destructive-muted",
  },
  deactivated: {
    icon: ShieldX,
    title: "Account Deactivated",
    description: "Your account has been deactivated by an administrator. If you believe this is a mistake, please contact HR support.",
    color: "bg-destructive",
    bgColor: "bg-destructive-muted",
  },
};

const AccountBlockedScreen = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reason = (searchParams.get("reason") as BlockReason) || "pending";
  const config = configs[reason];
  const Icon = config.icon;

  return (
    <MobileContainer>
      <div className="flex flex-col items-center justify-center min-h-full px-8">
        <div className="relative mb-8 animate-scale-in">
          <div className={`w-28 h-28 ${config.bgColor} rounded-full flex items-center justify-center`}>
            <div className={`w-20 h-20 ${config.color} rounded-full flex items-center justify-center`}>
              <Icon className="w-10 h-10 text-white" />
            </div>
          </div>
        </div>

        <div className="text-center mb-6 animate-fade-in-up">
          <h1 className="text-display mb-2">{config.title}</h1>
          <p className="text-body-secondary max-w-sm">{config.description}</p>
        </div>

        {reason === "rejected" && (
          <div className="card-elevated w-full max-w-sm p-5 mb-6 animate-fade-in-up bg-red-50 border border-red-200" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-900 mb-1">Access Denied</p>
                <p className="text-sm text-red-700">Your registration does not meet the requirements. Please contact HR for more information or re-register with valid details.</p>
              </div>
            </div>
          </div>
        )}

        <div className="w-full max-w-sm space-y-3 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <button onClick={() => navigate("/login")} className="btn-primary-large flex items-center justify-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            Back to Login
          </button>
        </div>

        <p className="text-caption text-center mt-8 max-w-xs">
          Need help? Contact HR at hr@nexon.com
        </p>
      </div>
    </MobileContainer>
  );
};

export default AccountBlockedScreen;
