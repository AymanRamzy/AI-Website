import { Link } from 'react-router-dom';
import { Star, Quote, Award, TrendingUp, Briefcase, Users } from 'lucide-react';

function Testimonials() {
  const testimonials = [
    {
      name: 'Ahmed Al-Salem',
      role: 'Senior Financial Analyst',
      company: 'Public Investment Fund (PIF)',
      image: null,
      rating: 5,
      quote: 'The FMVA program transformed my career trajectory. The practical approach and real-world case studies made all the difference. Within 6 months of completing the program, I secured a position at PIF.',
      program: 'FMVA Arabic Program',
      outcome: 'Promoted to Senior Analyst role'
    },
    {
      name: 'Sara Mohammed',
      role: 'FP&A Manager',
      company: 'Saudi Aramco',
      image: null,
      rating: 5,
      quote: 'Best investment I made in my professional development. The instructors are world-class, and the curriculum is incredibly comprehensive. The certification opened doors I never thought possible.',
      program: 'Corporate FP&A Bootcamp',
      outcome: '40% salary increase'
    },
    {
      name: 'Omar Hassan',
      role: 'Investment Analyst',
      company: 'NEOM',
      image: null,
      rating: 5,
      quote: 'The quality of instruction and curriculum depth exceeded my expectations. The hands-on projects prepared me perfectly for my current role at NEOM. Highly recommend to anyone serious about financial modeling.',
      program: 'FMVA Arabic Program',
      outcome: 'Landed dream job at NEOM'
    },
    {
      name: 'Fatima Abdullah',
      role: 'Financial Modeling Consultant',
      company: 'PwC Middle East',
      image: null,
      rating: 5,
      quote: 'ModEX doesn\'t just teach you financial modeling – they teach you how to think like a top-tier analyst. The mentorship and community support are unparalleled.',
      program: '100FM Initiative',
      outcome: 'Started consulting practice'
    },
    {
      name: 'Khalid Rahman',
      role: 'Corporate Finance Manager',
      company: 'SABIC',
      image: null,
      rating: 5,
      quote: 'The corporate training program revolutionized how our finance team approaches modeling and analysis. The ROI was immediate and substantial.',
      program: 'Corporate Training',
      outcome: 'Team productivity increased 60%'
    },
    {
      name: 'Laila Al-Harbi',
      role: 'Senior Valuation Specialist',
      company: 'Deloitte',
      image: null,
      rating: 5,
      quote: 'From struggling with Excel to building complex DCF models confidently – ModEX made the impossible possible. The structured curriculum and expert guidance were key.',
      program: 'FMVA Arabic Program',
      outcome: 'Career switch to valuation'
    },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center pt-20 overflow-hidden" data-testid="testimonials-hero">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-modex-primary via-modex-secondary to-modex-accent"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block mb-6">
            <Star className="w-20 h-20 text-modex-accent fill-current" />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
            Student Success Stories
          </h1>
          <p className="text-xl sm:text-2xl text-white/90 mb-4 max-w-3xl mx-auto">
            Real transformations from real professionals
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: Users, stat: '500+', label: 'Success Stories' },
              { icon: TrendingUp, stat: '85%', label: 'Career Advancement' },
              { icon: Award, stat: '4.9/5', label: 'Average Rating' },
              { icon: Briefcase, stat: '92%', label: 'Job Placement Rate' },
            ].map((item, idx) => (
              <div key={idx} className="bg-gradient-to-br from-modex-light to-white p-6 rounded-xl border-2 border-modex-secondary/20 text-center">
                <item.icon className="w-12 h-12 text-modex-accent mx-auto mb-4" />
                <p className="text-4xl font-black text-modex-primary mb-2">{item.stat}</p>
                <p className="text-gray-600">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-modex-primary mb-4">
              What Our Students Say
            </h2>
            <div className="w-24 h-2 bg-modex-accent mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-8 shadow-lg border-2 border-modex-secondary/10 hover:border-modex-secondary transition-all" data-testid={`testimonial-${idx}`}>
                <div className="flex items-center mb-4">
                  <div className="bg-gradient-to-br from-modex-secondary to-modex-accent w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-xl">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="font-bold text-modex-primary">{testimonial.name}</h3>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>

                <div className="flex text-modex-accent mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>

                <Quote className="w-8 h-8 text-modex-accent/20 mb-2" />
                <p className="text-gray-700 mb-4 italic leading-relaxed">"{testimonial.quote}"</p>

                <div className="border-t border-gray-200 pt-4 mt-4">
                  <p className="text-xs text-gray-500 mb-2">{testimonial.company}</p>
                  <div className="flex items-center justify-between">
                    <span className="bg-modex-secondary/10 text-modex-secondary px-3 py-1 rounded-full text-xs font-bold">
                      {testimonial.program}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center">
                    <TrendingUp className="w-4 h-4 text-modex-accent mr-2" />
                    <span className="text-sm font-semibold text-modex-primary">{testimonial.outcome}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Testimonials Placeholder */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-modex-primary mb-4">
              Video Testimonials
            </h2>
            <div className="w-24 h-2 bg-modex-accent mx-auto rounded-full"></div>
            <p className="text-xl text-gray-600 mt-6">Hear directly from our successful students (Coming Soon)</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-gradient-to-br from-modex-light to-white rounded-xl overflow-hidden border-2 border-modex-secondary/20">
                <div className="aspect-video bg-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <div className="bg-modex-secondary w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600">Video Coming Soon</p>
                  </div>
                </div>
                <div className="p-4">
                  <p className="font-bold text-modex-primary">Student Success Story</p>
                  <p className="text-sm text-gray-600">Career transformation testimonial</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Results & Impact */}
      <section className="py-20 bg-gradient-to-br from-modex-primary to-modex-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
              Real Results
            </h2>
            <div className="w-24 h-2 bg-modex-accent mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { metric: 'Average Salary Increase', value: '35%', desc: 'Within 6 months of completion' },
              { metric: 'Career Advancement', value: '85%', desc: 'Promoted or switched roles' },
              { metric: 'Employer Satisfaction', value: '98%', desc: 'Would hire ModEX graduates again' },
              { metric: 'Student Satisfaction', value: '4.9/5', desc: 'Average program rating' },
              { metric: 'Job Placement', value: '92%', desc: 'Within 3 months post-completion' },
              { metric: 'Skill Confidence', value: '+150%', desc: 'Improvement in self-assessment' },
            ].map((result, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border-2 border-white/20 text-center">
                <p className="text-5xl font-black text-modex-accent mb-2">{result.value}</p>
                <h3 className="text-xl font-bold text-white mb-2">{result.metric}</h3>
                <p className="text-white/80 text-sm">{result.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-black text-modex-primary mb-6">
            Start Your Success Story
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join hundreds of professionals who have transformed their careers with ModEX
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/fmva" className="bg-modex-accent text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-modex-primary transition-all transform hover:scale-105 shadow-2xl">
              Explore Programs
            </Link>
            <Link to="/contact" className="bg-modex-secondary text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-modex-primary transition-all transform hover:scale-105 shadow-2xl">
              Get Started
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default Testimonials;