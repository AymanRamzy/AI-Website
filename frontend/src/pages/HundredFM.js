import { Link } from 'react-router-dom';
import { TrendingUp, Users, Target, Clock, Award, Rocket, CheckCircle, BarChart, Calendar, Zap } from 'lucide-react';

function HundredFM() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center pt-20 overflow-hidden" data-testid="100fm-hero">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-modex-accent via-modex-secondary to-modex-primary"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block mb-6">
            <TrendingUp className="w-20 h-20 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
            100FM Initiative
          </h1>
          <p className="text-xl sm:text-2xl text-white/90 mb-4 max-w-3xl mx-auto font-bold">
            Train 100 Financial Modelers in 100 Days
          </p>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            An intensive bootcamp designed to fast-track your financial modeling career with hands-on projects and expert mentorship
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-modex-primary px-8 py-4 rounded-xl font-bold text-lg hover:bg-modex-accent hover:text-white transition-all transform hover:scale-105 shadow-2xl" data-testid="register-now-btn">
              Register Now
            </button>
            <Link to="/contact" className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-modex-primary transition-all transform hover:scale-105 shadow-2xl">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-modex-primary mb-4">
              Our Mission
            </h2>
            <div className="w-24 h-2 bg-modex-accent mx-auto rounded-full"></div>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-modex-light to-white p-8 md:p-12 rounded-2xl border-2 border-modex-secondary/20">
              <div className="flex items-start gap-6">
                <Target className="w-16 h-16 text-modex-accent flex-shrink-0" />
                <div>
                  <h3 className="text-2xl font-bold text-modex-primary mb-4">Democratizing Financial Modeling Excellence</h3>
                  <p className="text-lg text-gray-700 mb-4">
                    The 100FM Initiative was born from a simple yet powerful vision: to make world-class financial modeling education accessible to aspiring professionals across the MENA region and beyond.
                  </p>
                  <p className="text-lg text-gray-700">
                    In just 100 days, we transform complete beginners into competent financial modelers ready to contribute to leading organizations. Our intensive, project-based approach ensures practical skills that employers value.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-modex-primary mb-4">
              How It Works
            </h2>
            <div className="w-24 h-2 bg-modex-accent mx-auto rounded-full"></div>
            <p className="text-xl text-gray-600 mt-6">Your Journey from Beginner to Expert in 100 Days</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: 1,
                title: 'Foundation',
                period: 'Days 1-25',
                icon: Rocket,
                desc: 'Master Excel fundamentals, financial statements, and basic modeling concepts',
                color: 'from-modex-secondary to-modex-primary'
              },
              {
                step: 2,
                title: 'Core Skills',
                period: 'Days 26-50',
                icon: BarChart,
                desc: 'Build three-statement models, learn valuation techniques, and scenario analysis',
                color: 'from-modex-accent to-modex-secondary'
              },
              {
                step: 3,
                title: 'Advanced Topics',
                period: 'Days 51-75',
                icon: TrendingUp,
                desc: 'Master M&A models, LBO analysis, project finance, and advanced Excel',
                color: 'from-modex-primary to-modex-accent'
              },
              {
                step: 4,
                title: 'Real Projects',
                period: 'Days 76-100',
                icon: Award,
                desc: 'Work on real company models, build portfolio, and prepare for job market',
                color: 'from-modex-secondary to-modex-primary'
              },
            ].map((phase) => (
              <div key={phase.step} className="relative">
                <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-modex-secondary/10 hover:border-modex-secondary transition-all h-full">
                  <div className={`bg-gradient-to-br ${phase.color} w-16 h-16 rounded-xl flex items-center justify-center mb-4 mx-auto`}>
                    <phase.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="inline-block bg-modex-accent/10 text-modex-accent px-3 py-1 rounded-full text-sm font-bold mb-2">
                      {phase.period}
                    </div>
                    <h3 className="text-xl font-bold text-modex-primary mb-2">Step {phase.step}: {phase.title}</h3>
                    <p className="text-gray-600 text-sm">{phase.desc}</p>
                  </div>
                </div>
                {phase.step < 4 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <Zap className="w-6 h-6 text-modex-accent" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Progress Tracker Placeholder */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-modex-primary mb-4">
              Track Your Progress
            </h2>
            <div className="w-24 h-2 bg-modex-accent mx-auto rounded-full"></div>
            <p className="text-xl text-gray-600 mt-6">Real-time dashboard to monitor your journey (Coming Soon)</p>
          </div>

          <div className="bg-gradient-to-br from-modex-light to-white p-8 md:p-12 rounded-2xl border-2 border-modex-secondary/20">
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <div className="bg-modex-secondary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-10 h-10 text-modex-secondary" />
                </div>
                <p className="text-4xl font-black text-modex-primary mb-2">100</p>
                <p className="text-gray-600">Days of Learning</p>
              </div>
              <div className="text-center">
                <div className="bg-modex-accent/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart className="w-10 h-10 text-modex-accent" />
                </div>
                <p className="text-4xl font-black text-modex-primary mb-2">20+</p>
                <p className="text-gray-600">Real Projects</p>
              </div>
              <div className="text-center">
                <div className="bg-modex-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-10 h-10 text-modex-primary" />
                </div>
                <p className="text-4xl font-black text-modex-primary mb-2">1:1</p>
                <p className="text-gray-600">Mentor Support</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border-2 border-modex-secondary/10">
              <h3 className="text-lg font-bold text-modex-primary mb-4 text-center">Your Progress Dashboard Will Include:</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  'Daily learning milestones',
                  'Project completion tracking',
                  'Skill assessment scores',
                  'Peer comparison metrics',
                  'Mentor feedback and notes',
                  'Certificate progress'
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-modex-accent mr-2" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-gradient-to-br from-modex-primary via-modex-secondary to-modex-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
              Why Join 100FM?
            </h2>
            <div className="w-24 h-2 bg-white mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Clock, title: 'Intensive Learning', desc: 'Fast-track your career with focused, daily sessions' },
              { icon: Users, title: 'Expert Mentors', desc: 'Learn from top 10 global financial modelers' },
              { icon: Award, title: 'Certificate', desc: 'Earn a recognized credential upon completion' },
              { icon: BarChart, title: 'Real Projects', desc: 'Build a portfolio with actual company models' },
              { icon: Target, title: 'Job Ready', desc: 'Develop skills employers actively seek' },
              { icon: Users, title: 'Community', desc: 'Join a network of ambitious professionals' },
            ].map((benefit, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border-2 border-white/20 hover:bg-white/20 transition-all">
                <benefit.icon className="w-12 h-12 text-white mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">{benefit.title}</h3>
                <p className="text-white/80">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Registration CTA */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-black text-modex-primary mb-6">
            Start Your 100-Day Journey
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Next cohort starts soon. Limited spots available!
          </p>
          <div className="bg-gradient-to-br from-modex-light to-white p-8 rounded-2xl border-2 border-modex-secondary/20 mb-8">
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Start Date</p>
                <p className="text-xl font-bold text-modex-primary">March 1, 2025</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Duration</p>
                <p className="text-xl font-bold text-modex-primary">100 Days</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Spots Left</p>
                <p className="text-xl font-bold text-modex-accent">27 / 100</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-modex-accent text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-modex-primary transition-all transform hover:scale-105 shadow-2xl" data-testid="register-cta-btn">
              Register for Next Cohort
            </button>
            <Link to="/contact" className="bg-modex-secondary text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-modex-primary transition-all transform hover:scale-105 shadow-2xl">
              Contact Admissions
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default HundredFM;