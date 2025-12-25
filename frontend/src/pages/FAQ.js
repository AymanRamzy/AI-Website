import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ChevronDown, ChevronUp, Book, DollarSign, Clock, Award, Users, Phone } from 'lucide-react';

function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqCategories = [
    {
      category: 'General Questions',
      icon: HelpCircle,
      faqs: [
        {
          q: 'What is ModEX?',
          a: 'ModEX (Modeling Excellence) is a global platform for financial modeling education, training, consulting, and competitions. We help professionals build world-class financial modeling skills through comprehensive programs and hands-on experience.'
        },
        {
          q: 'Who are the instructors?',
          a: 'Our instructors are led by a Top 10 Global Financial Modeler with extensive experience at leading firms. The team includes professionals from investment banking, corporate finance, and consulting backgrounds.'
        },
        {
          q: 'Are the programs suitable for beginners?',
          a: 'Yes! While we have programs for all levels, our entry-level courses start with fundamentals and gradually build to advanced topics. Basic Excel knowledge and understanding of financial statements are recommended.'
        },
        {
          q: 'What makes ModEX different from other training providers?',
          a: 'ModEX combines practical, real-world experience (NEOM, PIF, PwC projects) with structured curriculum, small class sizes, lifetime mentorship, and a global community. Our focus is on practical skills employers value.'
        },
      ]
    },
    {
      category: 'Programs & Enrollment',
      icon: Book,
      faqs: [
        {
          q: 'What programs do you offer?',
          a: 'We offer FMVA Arabic Program (12 weeks), 100FM Initiative (100 days), Corporate FP&A Bootcamp, Custom Corporate Training, and various workshops on specialized topics.'
        },
        {
          q: 'How do I enroll in a program?',
          a: 'Visit the program page, click "Enroll Now," complete the registration form, and submit payment. You\'ll receive access credentials within 24 hours.'
        },
        {
          q: 'When do programs start?',
          a: 'FMVA has monthly cohorts, 100FM runs quarterly, and corporate training is scheduled on-demand. Check individual program pages for specific dates.'
        },
        {
          q: 'Can I switch between programs?',
          a: 'Yes, with approval from our admissions team. Contact support@modex.com to discuss your options and any fee differences.'
        },
        {
          q: 'What\'s the time commitment?',
          a: 'FMVA requires 8-10 hours/week, 100FM requires 3-4 hours/day, and workshops vary. All programs offer flexible scheduling for working professionals.'
        },
      ]
    },
    {
      category: 'Pricing & Payment',
      icon: DollarSign,
      faqs: [
        {
          q: 'How much do programs cost?',
          a: 'Pricing varies by program. FMVA starts at $2,500, 100FM at $3,000, and corporate training is customized. Early bird discounts and payment plans available.'
        },
        {
          q: 'Are there payment plans available?',
          a: 'Yes, we offer installment plans for most programs. Typically 3-4 monthly payments with no interest. Contact admissions for details.'
        },
        {
          q: 'Do you offer scholarships?',
          a: 'Yes, we offer merit-based and need-based scholarships covering 25-50% of tuition. Applications are reviewed quarterly. Email scholarship@modex.com.'
        },
        {
          q: 'What is your refund policy?',
          a: 'Full refund within 14 days of program start. After 14 days, prorated refunds available until 30% of program is completed. No refunds after 30% completion.'
        },
        {
          q: 'Do you accept corporate payments?',
          a: 'Yes, we can invoice companies directly and work with corporate training budgets. We also provide documentation for employer reimbursement programs.'
        },
      ]
    },
    {
      category: 'Certification & Career',
      icon: Award,
      faqs: [
        {
          q: 'What certification do I receive?',
          a: 'Upon completion, you receive an internationally recognized certificate from ModEX, digital badges for LinkedIn, and access to our verified graduate network.'
        },
        {
          q: 'Is the certification recognized globally?',
          a: 'Yes, ModEX certifications are recognized by employers worldwide, particularly in the MENA region. Our alumni work at PIF, NEOM, Aramco, PwC, Deloitte, and other leading firms.'
        },
        {
          q: 'Do you provide job placement assistance?',
          a: 'Yes, we offer resume reviews, interview preparation, portfolio building, and introductions to our corporate partners. 92% of graduates find employment within 3 months.'
        },
        {
          q: 'What jobs can I get after completing a program?',
          a: 'Common roles include Financial Analyst, Financial Modeler, FP&A Analyst, Valuation Analyst, Investment Analyst, Corporate Finance Associate, and Consultant.'
        },
        {
          q: 'Can I add the certification to my resume and LinkedIn?',
          a: 'Absolutely! We provide digital certificates, badges, and verification links. Many employers specifically look for ModEX-certified professionals.'
        },
      ]
    },
    {
      category: 'Technical Requirements',
      icon: Clock,
      faqs: [
        {
          q: 'What software do I need?',
          a: 'Microsoft Excel (2016 or later recommended), stable internet connection, and a computer with Windows or Mac OS. Some courses may use additional tools like Power BI or Python.'
        },
        {
          q: 'Are classes live or recorded?',
          a: 'Hybrid format: live sessions for instruction and Q&A, plus recorded sessions for review. All content is available for lifetime access after completion.'
        },
        {
          q: 'What if I miss a live session?',
          a: 'All sessions are recorded and available within 24 hours. We also offer office hours and 1:1 catch-up sessions with instructors.'
        },
        {
          q: 'Do I need prior financial modeling experience?',
          a: 'Not for entry-level programs. Basic Excel and financial statement knowledge is helpful but not required. We start with fundamentals and build progressively.'
        },
      ]
    },
    {
      category: 'Competitions',
      icon: Users,
      faqs: [
        {
          q: 'Who can participate in competitions?',
          a: 'Anyone! Competitions are open to students, professionals, and enthusiasts worldwide. Different competitions have different skill level requirements.'
        },
        {
          q: 'Are competitions free to enter?',
          a: 'Yes, all ModEX competitions are free to enter. Winners receive cash prizes, certificates, and recognition.'
        },
        {
          q: 'How are competitions judged?',
          a: 'Models are evaluated on accuracy, structure, formula efficiency, documentation, and presentation. We\'re developing AI-powered judging for instant feedback.'
        },
        {
          q: 'What prizes do winners receive?',
          a: 'Cash prizes ranging from $250-$1,000, trophies, certificates, featured profiles, and potential job opportunities from our corporate partners.'
        },
      ]
    },
  ];

  const toggleFAQ = (categoryIndex, faqIndex) => {
    const key = `${categoryIndex}-${faqIndex}`;
    setOpenIndex(openIndex === key ? null : key);
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[50vh] flex items-center justify-center pt-20 overflow-hidden" data-testid="faq-hero">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-modex-primary via-modex-accent to-modex-secondary"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block mb-6">
            <HelpCircle className="w-20 h-20 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-xl sm:text-2xl text-white/90 mb-4 max-w-3xl mx-auto">
            Find answers to common questions about our programs and services
          </p>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-12 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-4">
            {faqCategories.map((cat, idx) => (
              <a
                key={idx}
                href={`#category-${idx}`}
                className="bg-gradient-to-br from-modex-light to-white px-4 py-2 rounded-lg border-2 border-modex-secondary/20 hover:border-modex-secondary transition-all text-sm font-semibold text-modex-primary"
              >
                <cat.icon className="w-4 h-4 inline-block mr-2" />
                {cat.category}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {faqCategories.map((category, catIdx) => (
              <div key={catIdx} id={`category-${catIdx}`} className="scroll-mt-20">
                <div className="flex items-center mb-6">
                  <div className="bg-gradient-to-br from-modex-secondary to-modex-accent w-12 h-12 rounded-xl flex items-center justify-center mr-4">
                    <category.icon className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-3xl font-black text-modex-primary">{category.category}</h2>
                </div>

                <div className="space-y-4">
                  {category.faqs.map((faq, faqIdx) => {
                    const key = `${catIdx}-${faqIdx}`;
                    const isOpen = openIndex === key;

                    return (
                      <div
                        key={faqIdx}
                        className="bg-white rounded-xl border-2 border-modex-secondary/10 hover:border-modex-secondary transition-all overflow-hidden"
                        data-testid={`faq-${catIdx}-${faqIdx}`}
                      >
                        <button
                          onClick={() => toggleFAQ(catIdx, faqIdx)}
                          className="w-full px-6 py-4 flex items-center justify-between text-left"
                        >
                          <span className="font-bold text-modex-primary pr-4">{faq.q}</span>
                          {isOpen ? (
                            <ChevronUp className="w-5 h-5 text-modex-accent flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-modex-accent flex-shrink-0" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="px-6 pb-4">
                            <p className="text-gray-700 leading-relaxed">{faq.a}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="py-20 bg-gradient-to-r from-modex-secondary to-modex-accent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Phone className="w-16 h-16 text-white mx-auto mb-6" />
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-6">
            Still Have Questions?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Our team is here to help! Reach out and we'll get back to you within 24 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact" className="bg-white text-modex-primary px-10 py-4 rounded-xl font-bold text-lg hover:bg-modex-primary hover:text-white hover:border-white border-2 border-white transition-all transform hover:scale-105 shadow-2xl">
              Contact Us
            </Link>
            <a href="mailto:support@modex.com" className="bg-transparent border-2 border-white text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-modex-primary transition-all transform hover:scale-105 shadow-2xl">
              Email Support
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

export default FAQ;