import { useState } from 'react';
import { HelpCircle, MessageSquare, Phone, Mail, Search } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';

const AdminHelpScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    {
      category: 'Attendance',
      items: [
        {
          question: 'How do I mark attendance?',
          answer: 'Employees can mark attendance through the mobile app or web portal during the designated attendance window.',
        },
        {
          question: 'What is the grace period?',
          answer: 'The grace period allows employees to mark attendance within a specified time after the official check-in time.',
        },
      ],
    },
    {
      category: 'Leave Management',
      items: [
        {
          question: 'How do I apply for leave?',
          answer: 'Navigate to the Leave section, select the dates, choose leave type, and submit your request for approval.',
        },
        {
          question: 'How long does leave approval take?',
          answer: 'Leave requests are typically approved within 1-2 business days by your manager.',
        },
      ],
    },
    {
      category: 'Payroll',
      items: [
        {
          question: 'When is payroll processed?',
          answer: 'Payroll is typically processed on the last working day of each month.',
        },
        {
          question: 'How do I view my payslip?',
          answer: 'You can view your payslips in the Payroll section after the payroll has been finalized.',
        },
      ],
    },
  ];

  const supportChannels = [
    {
      icon: Mail,
      title: 'Email Support',
      description: 'support@nexusattendo.com',
      color: 'text-blue-500',
      bg: 'bg-blue-50',
    },
    {
      icon: Phone,
      title: 'Phone Support',
      description: '+1 (555) 123-4567',
      color: 'text-green-500',
      bg: 'bg-green-50',
    },
    {
      icon: MessageSquare,
      title: 'Live Chat',
      description: 'Available 9 AM - 6 PM',
      color: 'text-purple-500',
      bg: 'bg-purple-50',
    },
  ];

  const filteredFaqs = faqs
    .map((category) => ({
      ...category,
      items: category.items.filter(
        (item) =>
          item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.answer.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((category) => category.items.length > 0);

  return (
    <AdminLayout>
      <div className="flex flex-col min-h-full pb-20 md:pb-0">
        {/* Header */}
        <div className="px-4 sm:px-6 lg:px-8 pt-6 lg:pt-8 pb-4 border-b border-border">
          <div>
            <h1 className="text-display mb-1">Help Desk</h1>
            <p className="text-caption">Support and documentation</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Support Channels */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Contact Support</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {supportChannels.map((channel, index) => {
                  const Icon = channel.icon;
                  return (
                    <div key={index} className="card-elevated p-6 text-center">
                      <div className={`w-12 h-12 ${channel.bg} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                        <Icon className={`w-6 h-6 ${channel.color}`} />
                      </div>
                      <h3 className="font-semibold mb-1">{channel.title}</h3>
                      <p className="text-sm text-muted-foreground">{channel.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Search FAQs */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Frequently Asked Questions</h2>
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search FAQs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* FAQs */}
              {filteredFaqs.length > 0 ? (
                <div className="space-y-6">
                  {filteredFaqs.map((category, categoryIndex) => (
                    <div key={categoryIndex}>
                      <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                        <HelpCircle className="w-5 h-5 text-primary" />
                        {category.category}
                      </h3>
                      <div className="space-y-3">
                        {category.items.map((item, itemIndex) => (
                          <details key={itemIndex} className="card-elevated p-4 cursor-pointer group">
                            <summary className="font-medium text-sm flex items-center justify-between">
                              <span>{item.question}</span>
                              <span className="text-muted-foreground group-open:rotate-180 transition-transform">
                                ▼
                              </span>
                            </summary>
                            <p className="text-sm text-muted-foreground mt-3">{item.answer}</p>
                          </details>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card-elevated p-8 text-center">
                  <HelpCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No FAQs found matching your search</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminHelpScreen;
