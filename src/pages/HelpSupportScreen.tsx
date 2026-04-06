import { useNavigate } from "react-router-dom";
import { Mail, Phone, AlertCircle, CheckCircle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { 
    q: "How do I mark my attendance?", 
    a: "Go to the Dashboard and tap 'Mark Attendance'. The app will automatically verify your location and Wi-Fi connection." 
  },
  { 
    q: "Why is my attendance marked as Late?", 
    a: "If you mark attendance after 10:15 AM (the grace period), it will be recorded as Late." 
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
    a: "Please reach out to your HR manager or email hr@smartmatrixds.com for any corrections." 
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
      <div className="space-y-5">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200 p-6 shadow-sm animate-fade-in-up">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center shadow-md">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">We're Here to Help</h2>
              <p className="text-sm text-amber-700">Get support for attendance and leave management</p>
            </div>
          </div>
        </div>

        {/* Quick Support Cards */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Contact Support</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email Support */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in-up">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-md">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">Email Support</h3>
              <p className="text-sm text-gray-600 mb-4">Response within 24 hours</p>
              <a 
                href="mailto:hr@smartmatrixds.com"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-semibold text-sm hover:from-blue-700 hover:to-blue-600 transition-all duration-300 shadow-md hover:shadow-lg w-full justify-center"
              >
                <Mail className="w-4 h-4" />
                hr@smartmatrixds.com
              </a>
            </div>

            {/* Phone Support */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in-up delay-100">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4 shadow-md">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">Phone Support</h3>
              <p className="text-sm text-gray-600 mb-4">10 AM - 6 PM weekdays</p>
              <a 
                href="tel:+91976540079"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg font-semibold text-sm hover:from-green-700 hover:to-green-600 transition-all duration-300 shadow-md hover:shadow-lg w-full justify-center"
              >
                <Phone className="w-4 h-4" />
                +91 976540079
              </a>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="animate-fade-in-up delay-300">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem 
                  key={i} 
                  value={`faq-${i}`} 
                  className="border-b border-gray-200 last:border-0"
                >
                  <AccordionTrigger className="px-5 py-4 text-left hover:bg-amber-50 transition-colors">
                    <div className="flex items-start gap-3 text-left">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                        <span className="text-sm font-bold text-white">{i + 1}</span>
                      </div>
                      <span className="font-semibold text-sm text-gray-900">{faq.q}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-4 text-gray-600">
                    <div className="ml-10 space-y-2">
                      <p className="text-sm leading-relaxed">{faq.a}</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>

        {/* Important Information */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-5 shadow-sm animate-fade-in-up delay-400">
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-blue-900 mb-3">Important Guidelines</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Mark attendance within designated window (10:00 AM - 10:15 AM)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Submit leave requests at least 5 days in advance</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Contact HR immediately for urgent issues or corrections</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Ensure you're connected to office Wi-Fi for attendance marking</span>
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
