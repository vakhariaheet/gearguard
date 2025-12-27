import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'How quickly can we get started with GearGuard?',
    answer:
      'You can be up and running in minutes! Simply sign up for a free trial, import your equipment data (or start fresh), and begin tracking maintenance requests immediately. Our onboarding team will help you get the most out of the platform.',
  },
  {
    question: 'Can GearGuard integrate with our existing systems?',
    answer:
      'Yes! GearGuard offers robust API integration capabilities and can connect with popular ERP systems, CMMS platforms, and IoT devices. Our team can help you set up custom integrations to fit your workflow.',
  },
  {
    question: 'What kind of support do you provide?',
    answer:
      'We offer 24/7 customer support via chat, email, and phone. Enterprise customers get dedicated account managers and priority support. We also provide comprehensive documentation, video tutorials, and regular training webinars.',
  },
  {
    question: 'Is my data secure with GearGuard?',
    answer:
      'Absolutely. We use enterprise-grade security with end-to-end encryption, regular security audits, and compliance with SOC 2 Type II standards. Your data is backed up daily and stored in secure, geographically distributed data centers.',
  },
  {
    question: 'Can I customize GearGuard for my industry?',
    answer:
      'Yes! GearGuard is highly customizable with industry-specific templates for manufacturing, healthcare, facilities management, and more. You can create custom fields, workflows, and reports to match your specific requirements.',
  },
  {
    question: 'What happens if I need to cancel my subscription?',
    answer:
      "You can cancel anytime with no penalties. We'll help you export all your data in standard formats. We also offer a 30-day money-back guarantee if you're not completely satisfied with GearGuard.",
  },
];

export const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get answers to common questions about GearGuard's maintenance management platform.
          </p>
        </div>
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index}>
              <CardContent className="p-0">
                <button
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
                  onClick={() => toggleFAQ(index)}
                >
                  <span className="font-semibold pr-4">{faq.question}</span>
                  {openIndex === index ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  )}
                </button>
                {openIndex === index && (
                  <div className="px-6 pb-6">
                    <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
