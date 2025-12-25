import { Link } from 'react-router-dom';
import { Award, Target, Users, Globe, TrendingUp, Briefcase, CheckCircle, Zap, Eye, Heart } from 'lucide-react';

function About() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center pt-20 overflow-hidden" data-testid="about-hero">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-modex-secondary via-modex-primary to-modex-accent"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block mb-6">
            <Globe className="w-20 h-20 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
            About ModEX
          </h1>
          <p className="text-xl sm:text-2xl text-white/90 mb-4 max-w-3xl mx-auto">
            Building Financial Modeling Excellence Across the Globe
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-modex-primary mb-4">
              Our Story
            </h2>
            <div className="w-24 h-2 bg-modex-accent mx-auto rounded-full"></div>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                ModEX (Modeling Excellence) was founded with a singular vision: to democratize world-class financial modeling education and make it accessible to professionals across the MENA region and beyond.
              </p>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                What started as a passion project by a Top 10 Global Financial Modeler has evolved into a comprehensive platform that has trained over 500 analysts and collaborated with some of the world's most prestigious organizations.
              </p>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                From delivering complex financial models for mega-projects like NEOM to training corporate teams at leading firms, ModEX has become synonymous with excellence, innovation, and practical expertise in the financial modeling domain.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Today, we're not just a training provider – we're a global community of financial modeling professionals committed to continuous learning, collaboration, and pushing the boundaries of what's possible in financial analysis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-white p-8 md:p-10 rounded-2xl border-2 border-modex-secondary/20 hover:border-modex-secondary transition-all">
              <div className="bg-gradient-to-br from-modex-secondary to-modex-primary w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-black text-modex-primary mb-4">Our Mission</h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                To empower financial professionals with world-class modeling skills through comprehensive training, practical consulting, and a supportive global community. We strive to make financial modeling excellence accessible, practical, and impactful.
              </p>
            </div>

            <div className="bg-white p-8 md:p-10 rounded-2xl border-2 border-modex-secondary/20 hover:border-modex-secondary transition-all">
              <div className="bg-gradient-to-br from-modex-accent to-modex-secondary w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                <Eye className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-black text-modex-primary mb-4">Our Vision</h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                To be the global standard for financial modeling education and excellence. We envision a world where every financial professional has access to the skills, tools, and community needed to excel in their career and drive meaningful business impact.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Credentials & Recognition */}
      <section className="py-20 bg-gradient-to-br from-modex-primary to-modex-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
              Our Credentials
            </h2>
            <div className="w-24 h-2 bg-modex-accent mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Award,
                title: 'Top 10 Global',
                subtitle: 'Financial Modeler',
                desc: 'Recognized internationally for modeling excellence'
              },
              {
                icon: Users,
                title: '500+',
                subtitle: 'Analysts Trained',
                desc: 'Professionals equipped with world-class skills'
              },
              {
                icon: Briefcase,
                title: 'Elite Projects',
                subtitle: 'NEOM, PIF, PwC',
                desc: 'Trusted by leading global organizations'
              },
              {
                icon: Globe,
                title: 'Global Reach',
                subtitle: 'MENA & Worldwide',
                desc: 'Free learning initiatives across regions'
              },
            ].map((cred, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border-2 border-white/20 text-center hover:bg-white/20 transition-all">
                <cred.icon className="w-12 h-12 text-modex-accent mx-auto mb-4" />
                <h3 className="text-2xl font-black text-white mb-1">{cred.title}</h3>
                <p className="text-lg text-modex-accent font-bold mb-2">{cred.subtitle}</p>
                <p className="text-white/80 text-sm">{cred.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Elite Projects Background */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-modex-primary mb-4">
              Our Elite Project Portfolio
            </h2>
            <div className="w-24 h-2 bg-modex-accent mx-auto rounded-full"></div>
          </div>

          <div className="space-y-8">
            {[
              {
                name: 'NEOM',
                type: 'Saudi Arabia Mega-Project',
                desc: 'Provided comprehensive financial modeling support for infrastructure and development projects within NEOM, one of the world\'s most ambitious urban development initiatives.',
                impact: 'Models supporting multi-billion dollar investment decisions',
                color: 'from-modex-secondary to-modex-primary'
              },
              {
                name: 'PIF (Public Investment Fund)',
                type: 'Saudi Sovereign Wealth Fund',
                desc: 'Delivered advanced investment analysis and portfolio modeling for one of the world\'s largest sovereign wealth funds, managing over $600 billion in assets.',
                impact: 'Strategic financial models for portfolio optimization',
                color: 'from-modex-accent to-modex-secondary'
              },
              {
                name: 'PwC (PricewaterhouseCoopers)',
                type: 'Big Four Professional Services',
                desc: 'Collaborated on complex valuation and financial advisory projects, supporting PwC\'s consulting engagements across multiple industries.',
                impact: 'M&A models and business valuation frameworks',
                color: 'from-modex-primary to-modex-accent'
              },
            ].map((project, idx) => (
              <div key={idx} className="bg-gradient-to-br from-modex-light to-white p-8 rounded-2xl border-2 border-modex-secondary/20 hover:border-modex-secondary transition-all">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className={`bg-gradient-to-br ${project.color} w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Briefcase className="w-10 h-10 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="text-2xl font-black text-modex-primary">{project.name}</h3>
                      <span className="bg-modex-accent text-white px-3 py-1 rounded-full text-xs font-bold">{project.type}</span>
                    </div>
                    <p className="text-gray-700 mb-4 leading-relaxed">{project.desc}</p>
                    <div className="flex items-start">
                      <TrendingUp className="w-5 h-5 text-modex-accent mr-2 flex-shrink-0 mt-0.5" />
                      <p className="text-modex-primary font-semibold">{project.impact}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-modex-primary mb-4">
              Our Core Values
            </h2>
            <div className="w-24 h-2 bg-modex-accent mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Award,
                value: 'Excellence',
                desc: 'We pursue the highest standards in everything we do, from training to consulting'
              },
              {
                icon: Users,
                value: 'Community',
                desc: 'We believe in the power of collaboration and building a supportive global network'
              },
              {
                icon: Target,
                value: 'Practical Impact',
                desc: 'Our focus is on real-world applications and skills that create tangible business value'
              },
              {
                icon: Zap,
                value: 'Innovation',
                desc: 'We continuously evolve our methods and embrace new technologies and approaches'
              },
              {
                icon: Heart,
                value: 'Accessibility',
                desc: 'We\'re committed to making quality education accessible to all aspiring professionals'
              },
              {
                icon: CheckCircle,
                value: 'Integrity',
                desc: 'We operate with transparency, honesty, and ethical standards in all our work'
              },
            ].map((value, idx) => (
              <div key={idx} className="bg-white p-6 rounded-xl border-2 border-modex-secondary/10 hover:border-modex-secondary transition-all">
                <value.icon className="w-12 h-12 text-modex-accent mb-4" />
                <h3 className="text-xl font-bold text-modex-primary mb-2">{value.value}</h3>
                <p className="text-gray-600">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team/Founder Info */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-modex-light to-white p-8 md:p-12 rounded-2xl border-2 border-modex-secondary/20">
            <div className="bg-gradient-to-br from-modex-secondary to-modex-primary w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <Award className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-black text-modex-primary mb-4">Leadership & Expertise</h2>
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              ModEX is led by a Top 10 Global Financial Modeler with extensive experience across investment banking, corporate finance, and financial consulting. Our team includes seasoned professionals from leading firms and organizations worldwide.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              Combined, our team brings decades of hands-on experience in financial modeling, valuation, M&A, and corporate FP&A, ensuring that our students learn from the best in the industry.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-modex-accent to-modex-secondary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-6">
            Join the ModEX Community
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Be part of a global network of financial modeling professionals
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/fmva" className="bg-white text-modex-primary px-10 py-4 rounded-xl font-bold text-lg hover:bg-modex-primary hover:text-white hover:border-white border-2 border-white transition-all transform hover:scale-105 shadow-2xl">
              Explore Programs
            </Link>
            <Link to="/contact" className="bg-transparent border-2 border-white text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-modex-primary transition-all transform hover:scale-105 shadow-2xl">
              Get in Touch
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default About;