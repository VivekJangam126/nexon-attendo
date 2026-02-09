import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Phone, MessageCircle } from "lucide-react";
import MobileContainer from "@/components/MobileContainer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "How do I mark my attendance?", a: "Go to the Dashboard and tap 'Mark Attendance'. The app will automatically verify your location and Wi-Fi connection." },
  { q: "Why is my attendance marked as Late?", a: "If you mark attendance after 9:15 AM (the grace period), it will be recorded as Late." },
  { q: "What if I can't connect to office Wi-Fi?", a: "Make sure you're inside the office and connected to the 'Nexon-Office' Wi-Fi network. If issues persist, contact IT support." },
  { q: "Can I mark attendance from home?", a: "No, attendance can only be marked when you're physically at the office, verified by location and Wi-Fi." },
  { q: "Who do I contact for attendance corrections?", a: "Please reach out to your HR manager or email hr@nexon.com for any corrections." },
];

const HelpSupportScreen = () => {
  const navigate = useNavigate();

  return (
    <MobileContainer>
      <div className="flex flex-col h-full min-h-[800px]">
        <div className="px-6 pt-8 pb-4 border-b border-border flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-title">Help & Support</h1>
            <p className="text-caption">FAQs and contact information</p>
          </div>
        </div>

        <div className="flex-1 px-6 py-6 overflow-y-auto space-y-6">
          <div>
            <h2 className="text-overline mb-3">Frequently Asked Questions</h2>
            <div className="card-elevated">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, i) => (
                  <AccordionItem key={i} value={`faq-${i}`} className="border-b border-border last:border-0">
                    <AccordionTrigger className="px-4 text-left text-sm font-medium">{faq.q}</AccordionTrigger>
                    <AccordionContent className="px-4 text-sm text-muted-foreground">{faq.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>

          <div>
            <h2 className="text-overline mb-3">Contact Us</h2>
            <div className="card-elevated divide-y divide-border">
              <div className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Email Support</p>
                  <p className="text-xs text-muted-foreground">hr@nexon.com</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-xs text-muted-foreground">+91 1800-123-4567</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MobileContainer>
  );
};

export default HelpSupportScreen;
