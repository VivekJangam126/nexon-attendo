import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Shield, Database, ScrollText } from "lucide-react";
import MobileContainer from "@/components/MobileContainer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const TermsPoliciesScreen = () => {
  const navigate = useNavigate();

  return (
    <MobileContainer>
      <div className="flex flex-col min-h-full">
        {/* Header */}
        <div className="px-6 pt-8 pb-4 border-b border-border">
          <div className="flex items-center gap-4 mb-4">
            <button 
              onClick={() => navigate("/admin/settings")}
              className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-display">Terms & Policies</h1>
              <p className="text-caption">Legal information</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 py-6 space-y-4 overflow-y-auto">
          <div className="card-elevated overflow-hidden animate-fade-in-up">
            <Accordion type="single" collapsible className="w-full">
              {/* Terms of Service */}
              <AccordionItem value="terms" className="border-b border-border">
                <AccordionTrigger className="px-4 py-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                      <ScrollText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Terms of Service</p>
                      <p className="text-xs text-muted-foreground">Usage terms and conditions</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 text-sm text-muted-foreground">
                  <div className="space-y-3 pl-13">
                    <p>
                      <strong>1. Acceptance of Terms</strong><br />
                      By using the Nexon Attendance application, you agree to comply with these terms of service.
                    </p>
                    <p>
                      <strong>2. Use of Service</strong><br />
                      This application is provided exclusively for Nexon Pvt Ltd employees to record work attendance. Any unauthorized use is strictly prohibited.
                    </p>
                    <p>
                      <strong>3. User Responsibilities</strong><br />
                      Users are responsible for maintaining the confidentiality of their login credentials and for all activities under their account.
                    </p>
                    <p>
                      <strong>4. Accuracy of Information</strong><br />
                      Users must ensure that attendance marked through the application is accurate and truthful. Falsification of attendance records may result in disciplinary action.
                    </p>
                    <p>
                      <strong>5. Modifications</strong><br />
                      Nexon Pvt Ltd reserves the right to modify these terms at any time. Users will be notified of significant changes.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Privacy Policy */}
              <AccordionItem value="privacy" className="border-b border-border">
                <AccordionTrigger className="px-4 py-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Privacy Policy</p>
                      <p className="text-xs text-muted-foreground">How we handle your data</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 text-sm text-muted-foreground">
                  <div className="space-y-3 pl-13">
                    <p>
                      <strong>Information We Collect</strong><br />
                      We collect location data, device information, and Wi-Fi network details solely for the purpose of verifying attendance.
                    </p>
                    <p>
                      <strong>How We Use Your Information</strong><br />
                      Your information is used exclusively for attendance tracking and workplace management. We do not share your data with third parties.
                    </p>
                    <p>
                      <strong>Data Security</strong><br />
                      We implement industry-standard security measures to protect your personal information from unauthorized access.
                    </p>
                    <p>
                      <strong>Your Rights</strong><br />
                      You have the right to access, correct, or request deletion of your personal data by contacting HR.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Data Retention */}
              <AccordionItem value="retention" className="border-0">
                <AccordionTrigger className="px-4 py-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                      <Database className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Data Retention Policy</p>
                      <p className="text-xs text-muted-foreground">How long we keep your data</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 text-sm text-muted-foreground">
                  <div className="space-y-3 pl-13">
                    <p>
                      <strong>Retention Period</strong><br />
                      Attendance records are retained for a period of 7 years in accordance with labor law requirements.
                    </p>
                    <p>
                      <strong>Location Data</strong><br />
                      GPS and Wi-Fi verification data is retained for 30 days for audit purposes, after which it is automatically deleted.
                    </p>
                    <p>
                      <strong>Account Data</strong><br />
                      Employee account information is retained for the duration of employment plus 2 years after termination.
                    </p>
                    <p>
                      <strong>Data Deletion</strong><br />
                      Upon request and subject to legal requirements, personal data can be deleted. Contact HR for data deletion requests.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Last Updated */}
          <div className="text-center pt-4 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <p className="text-xs text-muted-foreground">Last updated: January 2024</p>
            <p className="text-xs text-muted-foreground">© 2024 Nexon Pvt Ltd. All rights reserved.</p>
          </div>
        </div>
      </div>
    </MobileContainer>
  );
};

export default TermsPoliciesScreen;
