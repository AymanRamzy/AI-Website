import { Link } from 'react-router-dom';
import { Briefcase, BookOpen, Users, TrendingUp, CheckCircle, BarChart, Phone, Calendar, Target, Zap } from 'lucide-react';

function Services() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center pt-20 overflow-hidden" data-testid="services-hero">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-modex-secondary via-modex-primary to-modex-accent"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block mb-6">
            <Briefcase className="w-20 h-20 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
            Training & Consulting
          </h1>
          <p className="text-xl sm:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
            Empower Your Team with World-Class Financial Modeling Expertise
          </p>
          <button className="bg-white text-modex-primary px-8 py-4 rounded-xl font-bold text-lg hover:bg-modex-accent hover:text-white transition-all transform hover:scale-105 shadow-2xl" data-testid="book-call-hero-btn">
            <Phone className="inline-block mr-2 w-5 h-5" />
            Book a Free Consultation
          </button>
        </div>
      </section>

      {/* Corporate Training Programs */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-modex-primary mb-4">
              Corporate Training Programs
            </h2>
            <div className="w-24 h-2 bg-modex-accent mx-auto rounded-full"></div>
            <p className="text-xl text-gray-600 mt-6">Customized training solutions for your organization</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              {
                title: 'Financial Modeling Bootcamp',
                duration: '5 Days',
                icon: BookOpen,
                color: 'from-modex-secondary to-modex-primary',
                topics: [
                  'Three-statement modeling',
                  'DCF valuation',
                  'Scenario analysis',
                  'Best practices & standards'
                ]
              },
              {
                title: 'FP&A Excellence Program',
                duration: '3 Days',
                icon: TrendingUp,
                color: 'from-modex-accent to-modex-secondary',
                topics: [
                  'Budgeting & forecasting',
                  'Variance analysis',
                  'KPI dashboards',
                  'Business partnering'
                ]
              },
              {
                title: 'Advanced Excel for Finance',
                duration: '2 Days',
                icon: BarChart,
                color: 'from-modex-primary to-modex-accent',
                topics: [
                  'Power Query & Pivot',
                  'Advanced formulas',
                  'VBA automation',
                  'Data visualization'
                ]
              },
            ].map((program, idx) => (
              <div key={idx} className="bg-white rounded-2xl shadow-lg border-2 border-modex-secondary/10 hover:border-modex-secondary transition-all overflow-hidden">
                <div className={`bg-gradient-to-br ${program.color} p-6 text-center`}>
                  <program.icon className="w-16 h-16 text-white mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">{program.title}</h3>
                  <div className="inline-block bg-white/20 text-white px-4 py-1 rounded-full text-sm font-bold">
                    {program.duration}
                  </div>
                </div>
                <div className="p-6">
                  <h4 className="font-bold text-modex-primary mb-3">Key Topics:</h4>
                  <ul className="space-y-2">
                    {program.topics.map((topic, tidx) => (
                      <li key={tidx} className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-modex-accent mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{topic}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-br from-modex-light to-white p-8 rounded-2xl border-2 border-modex-secondary/20">
            <h3 className="text-2xl font-bold text-modex-primary mb-6 text-center">Customized Corporate Solutions</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold text-modex-primary mb-3">Training Formats:</h4>
                <ul className="space-y-2">
                  {[
                    'On-site workshops at your location',
                    'Virtual live training sessions',
                    'Hybrid learning programs',
                    'Self-paced e-learning modules'
                  ].map((format, idx) => (
                    <li key={idx} className="flex items-start">
                      <Zap className="w-5 h-5 text-modex-accent mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{format}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-modex-primary mb-3">Our Clients Include:</h4>
                <ul className="space-y-2">
                  {[
                    'Fortune 500 companies',
                    'Investment banks & PE firms',
                    'Corporate finance departments',
                    'Government entities'
                  ].map((client, idx) => (
                    <li key={idx} className="flex items-start">
                      <Zap className="w-5 h-5 text-modex-accent mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{client}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Consulting Services */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-modex-primary mb-4">
              Consulting Services
            </h2>
            <div className="w-24 h-2 bg-modex-accent mx-auto rounded-full"></div>
            <p className="text-xl text-gray-600 mt-6">Expert financial modeling and analysis for your business</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: 'Financial Model Development',
                desc: 'Custom-built financial models tailored to your business needs',
                services: [
                  'Three-statement financial models',
                  'Project finance models',
                  'M&A and LBO models',
                  'Real estate financial models',
                  'Startup financial projections'
                ]
              },
              {
                title: 'Valuation Services',
                desc: 'Professional business and asset valuation',
                services: [
                  'DCF valuation analysis',
                  'Comparable company analysis',
                  'Precedent transaction analysis',
                  'Asset valuation',
                  'Fairness opinions'
                ]
              },
              {
                title: 'FP&A Support',
                desc: 'Strategic financial planning and analysis',
                services: [
                  'Annual budgeting process',
                  'Rolling forecasts',
                  'Variance analysis',
                  'KPI dashboard development',
                  'Management reporting'
                ]
              },
              {
                title: 'Model Audit & Review',
                desc: 'Quality assurance for existing financial models',
                services: [
                  'Model error checking',
                  'Best practices review',
                  'Documentation improvement',
                  'Sensitivity analysis',
                  'Model optimization'
                ]
              },
            ].map((service, idx) => (
              <div key={idx} className="bg-white p-8 rounded-2xl border-2 border-modex-secondary/10 hover:border-modex-secondary transition-all">
                <h3 className="text-2xl font-bold text-modex-primary mb-3">{service.title}</h3>
                <p className="text-gray-600 mb-6">{service.desc}</p>
                <ul className="space-y-2">
                  {service.services.map((item, sidx) => (
                    <li key={sidx} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-modex-accent mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Elite Projects Showcase */}
      <section className="py-20 bg-gradient-to-br from-modex-primary to-modex-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
              Trusted by Leading Organizations
            </h2>
            <div className="w-24 h-2 bg-modex-accent mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'NEOM', type: 'Mega Project', desc: 'Financial modeling for infrastructure and development projects' },
              { name: 'PIF', type: 'Sovereign Wealth Fund', desc: 'Investment analysis and portfolio modeling' },
              { name: 'PwC', type: 'Big Four', desc: 'Complex valuation and financial advisory services' },
            ].map((project, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl border-2 border-white/20 text-center hover:bg-white/20 transition-all">
                <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-modex-primary" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2">{project.name}</h3>
                <p className="text-modex-accent font-bold mb-3">{project.type}</p>
                <p className="text-white/80">{project.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-modex-primary mb-4">
              Our Process
            </h2>
            <div className="w-24 h-2 bg-modex-accent mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: 1, title: 'Discovery Call', desc: 'Understand your needs and objectives' },
              { step: 2, title: 'Proposal', desc: 'Detailed scope, timeline, and pricing' },
              { step: 3, title: 'Execution', desc: 'Build solutions with regular updates' },
              { step: 4, title: 'Delivery', desc: 'Training, documentation, and support' },
            ].map((phase) => (
              <div key={phase.step} className="text-center">
                <div className="bg-gradient-to-br from-modex-secondary to-modex-accent w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-black">
                  {phase.step}
                </div>
                <h3 className="text-xl font-bold text-modex-primary mb-2">{phase.title}</h3>
                <p className="text-gray-600">{phase.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-modex-accent to-modex-secondary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-6">
            Ready to Transform Your Team?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Let's discuss how we can help your organization excel in financial modeling
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-modex-primary px-10 py-4 rounded-xl font-bold text-lg hover:bg-modex-primary hover:text-white hover:border-white border-2 border-white transition-all transform hover:scale-105 shadow-2xl" data-testid="book-call-cta-btn">
              <Phone className="inline-block mr-2 w-5 h-5" />
              Book a Call
            </button>
            <Link to="/contact" className="bg-transparent border-2 border-white text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-modex-primary transition-all transform hover:scale-105 shadow-2xl">
              <Calendar className="inline-block mr-2 w-5 h-5" />
              Request Quote
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default Services;