import { Link } from 'react-router-dom';
import { Award, BookOpen, CheckCircle, Clock, Globe, Target, TrendingUp, Users, Video, Download, Star } from 'lucide-react';

function FMVA() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center pt-20 overflow-hidden" data-testid="fmva-hero">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-modex-primary via-modex-secondary to-modex-accent"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block mb-6">
            <Award className="w-20 h-20 text-modex-accent" />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
            FMVA Arabic Program
          </h1>
          <p className="text-xl sm:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
            Comprehensive Financial Modeling & Valuation Analyst Certification in Arabic
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-modex-accent text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-modex-primary transition-all transform hover:scale-105 shadow-2xl" data-testid="enroll-now-btn">
              Enroll Now
            </button>
            <Link to="/contact" className="bg-white text-modex-primary px-8 py-4 rounded-xl font-bold text-lg hover:bg-modex-accent hover:text-white transition-all transform hover:scale-105 shadow-2xl">
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-modex-primary mb-4">
              What You'll Learn
            </h2>
            <div className="w-24 h-2 bg-modex-accent mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: TrendingUp, title: 'Financial Modeling', desc: 'Build complex financial models from scratch' },
              { icon: Target, title: 'Valuation Techniques', desc: 'Master DCF, multiples, and precedent transactions' },
              { icon: BookOpen, title: 'Financial Statement Analysis', desc: 'Deep dive into balance sheets, P&L, and cash flow' },
              { icon: Globe, title: 'Real-World Case Studies', desc: 'Work on actual business scenarios and projects' },
              { icon: Award, title: 'International Certification', desc: 'Globally recognized FMVA certificate' },
              { icon: Users, title: 'Expert Mentorship', desc: 'Learn from top 10 global financial modelers' },
            ].map((item, idx) => (
              <div key={idx} className="bg-gradient-to-br from-modex-light to-white p-6 rounded-xl border-2 border-modex-secondary/20 hover:border-modex-secondary transition-all">
                <item.icon className="w-12 h-12 text-modex-secondary mb-4" />
                <h3 className="text-xl font-bold text-modex-primary mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Full Curriculum */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-modex-primary mb-4">
              Full Curriculum
            </h2>
            <div className="w-24 h-2 bg-modex-accent mx-auto rounded-full"></div>
            <p className="text-xl text-gray-600 mt-6">6 Comprehensive Modules • 12 Weeks • 100+ Hours</p>
          </div>

          <div className="space-y-6">
            {[
              {
                module: 1,
                title: 'Introduction to Financial Modeling',
                topics: ['Excel fundamentals for financial modeling', 'Best practices and formatting', 'Data validation and error checking', 'Building your first model']
              },
              {
                module: 2,
                title: 'Financial Statements & Analysis',
                topics: ['Income statement modeling', 'Balance sheet projections', 'Cash flow statements', 'Ratio analysis and KPIs']
              },
              {
                module: 3,
                title: 'Valuation Methods',
                topics: ['Discounted Cash Flow (DCF)', 'Comparable company analysis', 'Precedent transactions', 'Leveraged buyout (LBO) modeling']
              },
              {
                module: 4,
                title: 'Advanced Financial Modeling',
                topics: ['Three-statement modeling', 'Scenario and sensitivity analysis', 'Monte Carlo simulation', 'Merger & acquisition models']
              },
              {
                module: 5,
                title: 'Real-World Applications',
                topics: ['Corporate FP&A modeling', 'Project finance models', 'Startup valuation', 'Industry-specific models']
              },
              {
                module: 6,
                title: 'Capstone Project',
                topics: ['End-to-end financial model', 'Presentation skills', 'Professional deliverables', 'Final certification exam']
              },
            ].map((module) => (
              <div key={module.module} className="bg-white rounded-2xl p-8 shadow-lg border-2 border-modex-secondary/10 hover:border-modex-secondary transition-all">
                <div className="flex items-start gap-4">
                  <div className="bg-modex-secondary text-white w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl flex-shrink-0">
                    {module.module}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-modex-primary mb-4">{module.title}</h3>
                    <ul className="grid sm:grid-cols-2 gap-3">
                      {module.topics.map((topic, idx) => (
                        <li key={idx} className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-modex-accent mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certification Info */}
      <section className="py-20 bg-gradient-to-br from-modex-primary to-modex-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
              Certification Details
            </h2>
            <div className="w-24 h-2 bg-modex-accent mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl border-2 border-white/20 text-center">
              <Clock className="w-12 h-12 text-modex-accent mx-auto mb-4" />
              <h3 className="text-2xl font-black text-white mb-2">12 Weeks</h3>
              <p className="text-white/90">Flexible learning schedule</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl border-2 border-white/20 text-center">
              <Video className="w-12 h-12 text-modex-accent mx-auto mb-4" />
              <h3 className="text-2xl font-black text-white mb-2">100+ Hours</h3>
              <p className="text-white/90">Video lessons & practice</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl border-2 border-white/20 text-center">
              <Award className="w-12 h-12 text-modex-accent mx-auto mb-4" />
              <h3 className="text-2xl font-black text-white mb-2">Certificate</h3>
              <p className="text-white/90">Globally recognized credential</p>
            </div>
          </div>

          <div className="mt-12 bg-white/10 backdrop-blur-sm p-8 rounded-2xl border-2 border-white/20">
            <h3 className="text-2xl font-bold text-white mb-4 text-center">Upon Completion, You'll Receive:</h3>
            <ul className="space-y-3 max-w-2xl mx-auto">
              {[
                'FMVA Certificate recognized globally',
                'Digital badge for LinkedIn and resume',
                'Access to ModEX alumni network',
                'Lifetime access to course materials',
                'Career placement assistance',
                'Continuing education credits'
              ].map((item, idx) => (
                <li key={idx} className="flex items-start text-white">
                  <Star className="w-5 h-5 text-modex-accent mr-3 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-modex-primary mb-4">
              Student Success Stories
            </h2>
            <div className="w-24 h-2 bg-modex-accent mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Ahmed Al-Salem', role: 'Senior Financial Analyst at PIF', quote: 'The FMVA program transformed my career. The practical approach and real-world examples made all the difference.' },
              { name: 'Sara Mohammed', role: 'FP&A Manager at Aramco', quote: 'Best investment I made in my career. The certification opened doors I never thought possible.' },
              { name: 'Omar Hassan', role: 'Investment Analyst at NEOM', quote: 'The quality of instruction and curriculum depth exceeded my expectations. Highly recommend!' },
            ].map((testimonial, idx) => (
              <div key={idx} className="bg-gradient-to-br from-modex-light to-white p-8 rounded-2xl border-2 border-modex-secondary/20">
                <div className="flex text-modex-accent mb-4">
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.quote}"</p>
                <p className="font-bold text-modex-primary">{testimonial.name}</p>
                <p className="text-sm text-gray-600">{testimonial.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-modex-primary mb-4">
              Frequently Asked Questions
            </h2>
            <div className="w-24 h-2 bg-modex-accent mx-auto rounded-full"></div>
          </div>

          <div className="space-y-4">
            {[
              { q: 'What are the prerequisites?', a: 'Basic Excel knowledge and understanding of financial statements. No prior modeling experience required.' },
              { q: 'Is the program entirely in Arabic?', a: 'Yes, all lectures, materials, and support are provided in Arabic for better understanding.' },
              { q: 'What is the time commitment?', a: '8-10 hours per week for 12 weeks. Self-paced with flexible scheduling.' },
              { q: 'Do I get lifetime access?', a: 'Yes, lifetime access to all course materials, updates, and community forums.' },
              { q: 'Is there job placement assistance?', a: 'Yes, we provide resume reviews, interview prep, and connections to our corporate partners.' },
              { q: 'What is the certification exam like?', a: 'Practical exam where you build a comprehensive financial model demonstrating all learned skills.' },
            ].map((faq, idx) => (
              <div key={idx} className="bg-white p-6 rounded-xl border-2 border-modex-secondary/10 hover:border-modex-secondary transition-all">
                <h3 className="text-lg font-bold text-modex-primary mb-2">{faq.q}</h3>
                <p className="text-gray-700">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-modex-secondary to-modex-accent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-6">
            Ready to Transform Your Career?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join 500+ professionals who have advanced their careers with FMVA certification
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-modex-primary px-10 py-4 rounded-xl font-bold text-lg hover:bg-modex-primary hover:text-white hover:border-white border-2 border-white transition-all transform hover:scale-105 shadow-2xl" data-testid="enroll-cta-btn">
              Enroll Now
            </button>
            <Link to="/contact" className="bg-transparent text-white border-2 border-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-modex-primary transition-all transform hover:scale-105 shadow-2xl">
              Schedule a Call
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default FMVA;