import { useNavigate } from "react-router-dom";
import { ArrowLeft, HelpCircle, Mail, MessageCircle } from "lucide-react";
import MobileContainer from "@/components/MobileContainer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "@/hooks/use-toast";

const HelpCenterScreen = () => {
  const navigate = useNavigate();

  const faqs = [
    {
      question: "How do employees mark attendance?",
      answer: "Employees can mark their attendance by opening the Nexon Attendance app and tapping the 'Mark Attendance' button. The app will verify their location and Wi-Fi connection before recording attendance."
    },
    {
      question: "What is geofencing?",
      answer: "Geofencing creates a virtual boundary around your office location. Employees must be within this boundary to mark their attendance, ensuring they are physically present at the workplace."
    },
    {
      question: "How does Wi-Fi verification work?",
      answer: "The app checks if the employee is connected to one of the authorized office Wi-Fi networks. This adds an extra layer of verification to ensure employees are at the office."
    },
    {
      question: "What is the grace period?",
      answer: "The grace period is a buffer time after the official start time during which employees can still be marked as 'Present' instead of 'Late'. For example, with a 15-minute grace period, an employee arriving at 9:10 AM (when start time is 9:00 AM) would still be marked as Present."
    },
    {
      question: "Can I manually override attendance?",
      answer: "Yes, administrators can manually mark attendance for employees through the employee detail screen. This is useful for handling exceptional cases like network issues or app problems."
    },
    {
      question: "How do I add a new office location?",
      answer: "Go to Settings > Office Locations > Add New Location. Enter the office name, address, and configure the geofencing radius for that location."
    },
    {
      question: "Can employees mark attendance from home?",
      answer: "By default, employees must be within the geofenced area and connected to office Wi-Fi. However, you can configure remote work settings if your organization allows work from home."
    },
    {
      question: "How do I export attendance reports?",
      answer: "Go to the Reports section and tap the 'Export' button. You can choose to export as CSV for different time periods."
    },
  ];

  const handleContactSupport = () => {
    toast({
      title: "Support Request",
      description: "Opening email client...",
    });
    window.location.href = "mailto:support@nexon.com?subject=Attendance App Support";
  };

  return (
    <MobileContainer>
      <div className="flex flex-col h-full min-h-[800px]">
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
              <h1 className="text-display">Help Center</h1>
              <p className="text-caption">FAQs and support</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 py-6 space-y-6 overflow-y-auto">
          {/* Contact Support */}
          <div className="animate-fade-in-up">
            <button 
              onClick={handleContactSupport}
              className="w-full card-elevated p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors"
            >
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <Mail className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">Contact Support</p>
                <p className="text-sm text-muted-foreground">support@nexon.com</p>
              </div>
              <MessageCircle className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* FAQs */}
          <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <h2 className="text-overline mb-3">Frequently Asked Questions</h2>
            <div className="card-elevated overflow-hidden">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="border-b border-border last:border-0">
                    <AccordionTrigger className="px-4 py-4 text-left text-sm font-medium hover:no-underline">
                      <div className="flex items-center gap-3">
                        <HelpCircle className="w-4 h-4 text-primary flex-shrink-0" />
                        <span>{faq.question}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 text-sm text-muted-foreground pl-11">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </div>
      </div>
    </MobileContainer>
  );
};

export default HelpCenterScreen;
