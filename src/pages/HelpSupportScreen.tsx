import { useNavigate } from "react-router-dom";
import { Mail, Phone, MessageCircle, AlertCircle, CheckCircle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { 
    q: "How do I mark my attendance?", 
    a: "Go to the Dashboard and tap 'Mark Attendance'. The app will automatically verify your location and Wi-Fi connection." 
  },
  { 
    q: "Why is my attendance marked as Late?", 
    a: "If you mark attendance after 9:15 AM (the grace period), it will be recorded as Late." 
  },
  { 
    q: "What if I can't connect to office Wi-Fi?", 
    a: "Make sure you're inside the office and connected to the 'Nexon-Office' Wi-Fi network. If issues persist, contact IT support." 
  },
  { 
    q: "Can I mark attendance from home?", 
    a: "No, attendance can only be marked when you're physically at the office, verified by location and Wi-Fi." 
  },
  { 
    q: "Who do I contact for attendance corrections?", 
    a: "Please reach out to your HR manager or email hr@nexon.com for any corrections." 
  },
  { 
    q: "How do I apply for leave?", 
    a: "Go to the Leave section and click 'Apply for Leave'. Select your leave type, dates, and reason. Your manager will review and approve/reject." 
  },
  { 
    q: "Can I cancel a leave request?", 
    a: "Yes, you can cancel pending leave requests. Go to Leave Management and click the cancel button on your request." 
  },
  { 
    q: "What are the different types of leave?", 
    a: "We offer Annual Leave, Paid Leave, Unpaid Leave, and Sick Leave. Each has different limits and policies." 
  },
];

const HelpSupportScreen = () => {
  const navigate = useNavigate();

  return (
    <DashboardLayout title="Help & Support">
      <div className="space-y-3 sm:space-y-4 lg:space-y-4">
        {/* Quick Support Cards */}
        <div>
          <h2 className="text-base font-bold text-gray-900 mb-3">Get Help</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {/* Email Support */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mb-3">
                <Mail className="w-4 h-4 text-amber-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Email Support</h3>
              <p className="text-xs text-gray-600 mb-3">Response within 24 hours</p>
              <a 
                href="mailto:hr@nexon.com"
                className="inline-flex items-center gap-2 px-3 py-2 bg-amber-600 text-white rounded-lg font-medium text-xs hover:bg-amber-700 transition-colors"
              >
                <Mail className="w-3 h-3" />
                hr@nexon.com
              </a>
            </div>

            {/* Phone Support */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mb-3">
                <Phone className="w-4 h-4 text-amber-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Phone Support</h3>
              <p className="text-xs text-gray-600 mb-3">9 AM - 6 PM weekdays</p>
              <a 
                href="tel:+911800123456"
                className="inline-flex items-center gap-2 px-3 py-2 bg-amber-600 text-white rounded-lg font-medium text-xs hover:bg-amber-700 transition-colors"
              >
                <Phone className="w-3 h-3" />
                +91 1800-123-4567
              </a>
            </div>

            {/* Live Chat */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mb-3">
                <MessageCircle className="w-4 h-4 text-amber-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Live Chat</h3>
              <p className="text-xs text-gray-600 mb-3">Real-time support available</p>
              <button 
                className="inline-flex items-center gap-2 px-3 py-2 bg-amber-600 text-white rounded-lg font-medium text-xs hover:bg-amber-700 transition-colors"
              >
                <MessageCircle className="w-3 h-3" />
                Start Chat
              </button>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div>
          <h2 className="text-base font-bold text-gray-900 mb-3">Frequently Asked Questions</h2>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem 
                  key={i} 
                  value={`faq-${i}`} 
                  className="border-b border-gray-200 last:border-0"
                >
                  <AccordionTrigger className="px-4 sm:px-5 py-3 text-left hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-2 text-left">
                      <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-semibold text-amber-600">{i + 1}</span>
                      </div>
                      <span className="font-medium text-xs sm:text-sm text-gray-900">{faq.q}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 sm:px-5 pb-3 text-gray-600">
                    <div className="ml-6 sm:ml-7 space-y-2">
                      <p className="text-xs">{faq.a}</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>

        {/* Important Information */}
        <div className="bg-amber-50 rounded-lg border border-amber-200 p-4 sm:p-5">
          <div className="flex gap-3">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-amber-900 mb-2">Important</h3>
              <ul className="space-y-1.5 text-xs text-amber-800">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>Mark attendance within designated window</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>Submit leave 5+ days in advance</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>Contact HR for urgent issues</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HelpSupportScreen;
