import {
  Linkedin,
  Instagram,
  Facebook,
  Send,
  MessageCircle,
  Ghost
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Award, Users, Trophy, BookOpen, Video, Briefcase, TrendingUp, Globe, Target, Zap, CheckCircle, ArrowRight, BarChart3, Building2, GraduationCap, Rocket, Star } from 'lucide-react';


const socialLinks = [
  { href: "https://api.whatsapp.com/send/?phone=966505489259", icon: MessageCircle, label: "WhatsApp" },
  { href: "https://www.facebook.com/FinModex", icon: Facebook, label: "Facebook" },
  { href: "https://www.instagram.com/fin_modex", icon: Instagram, label: "Instagram" },
  { href: "https://www.tiktok.com/@modex122", icon: Video, label: "TikTok" },
  { href: "https://www.snapchat.com/@modex20256320", icon: Ghost, label: "Snapchat" },
  { href: "https://www.linkedin.com/company/modexera/", icon: Linkedin, label: "LinkedIn" },
  { href: "https://t.me/ModEX_Co", icon: Send, label: "Telegram" }
];

function SocialIcons() {
  return (
    <div className="flex justify-center gap-6 mt-10">
      {socialLinks.map((item, i) => {
        const Icon = item.icon;
        return (
          <a
            key={i}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={item.label}
            className="text-white hover:text-modex-accent transition-all duration-300 transform hover:scale-125"
          >
            <Icon className="w-7 h-7" />
          </a>
        );
      })}
    </div>
  );
}

function Home() {
  return (
    <>
      {/* Hero Section */}
      <section
        id="home"
        className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden"
        data-testid="hero-section"
      >
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1608222351212-18fe0ec7b13b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMGFuYWx5dGljc3xlbnwwfHx8fDE3NjQ5ODE1ODN8MA&ixlib=rb-4.1.0&q=85"
            alt="Financial Analytics"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-modex-primary/95 via-modex-primary/90 to-modex-secondary/85"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Large Prominent Logo - Brand Statement */}
          <div className="mb-10">
            <img 
              src="/logo-main.png" 
              alt="ModEX" 
              className="mx-auto w-auto h-40 sm:h-48 md:h-56 lg:h-64"
              style={{ 
                objectFit: 'contain',
                filter: 'brightness(0) invert(1) drop-shadow(0 8px 24px rgba(0,0,0,0.4))'
              }}
            />
          </div>

          <div className="inline-block mb-4 px-4 py-2 bg-modex-accent/20 border-2 border-modex-accent rounded-full">
            <p className="text-white/90 font-bold text-sm sm:text-base uppercase tracking-wider">
              Built for EXecution. Driven by EXcellence.
            </p>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
            <BarChart3 className="inline-block w-12 h-12 sm:w-16 sm:h-16 mb-2 text-modex-accent" />
            <br />
            The Global Hub for
            <br />
            <span className="text-modex-accent">Financial Modeling</span>
            <br />
            Excellence
          </h1>

          <p className="text-xl sm:text-2xl text-white/90 mb-6 font-semibold max-w-3xl mx-auto">
            Training • Consulting • Competitions • Community
          </p>

          {/* Value Proposition */}
          <div className="max-w-4xl mx-auto mb-10">
            <p className="text-lg sm:text-xl text-white/95 leading-relaxed">
              We help professionals and companies master financial modeling through structured training, real-world case studies, and hands-on project-based learning. Built by one of the <strong className="text-modex-accent">Top 10 global financial modelers</strong>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/fmva"
              className="bg-modex-accent text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-modex-accent transition-all transform hover:scale-105 hover:shadow-2xl shadow-xl w-full sm:w-auto group"
              data-testid="explore-programs-btn"
            >
              <BookOpen className="inline-block mr-2 w-5 h-5 group-hover:rotate-12 transition-transform" />
              Explore Programs
            </Link>
            <Link
              to="/community"
              className="bg-white text-modex-primary px-8 py-4 rounded-xl font-bold text-lg hover:bg-modex-accent hover:text-white transition-all transform hover:scale-105 hover:shadow-2xl shadow-xl w-full sm:w-auto group"
              data-testid="join-community-btn"
            >
              <Users className="inline-block mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
              Join ModEX Community
            </Link>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-10">
          <div className="animate-bounce">
            <svg className="w-6 h-6 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
            </svg>
          </div>
        </div>
      </section>

      {/* Who We Serve Section */}
      <section className="py-20 bg-gradient-to-br from-modex-primary to-modex-secondary" data-testid="who-we-serve-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
              Who We Serve
            </h2>
            <div className="w-24 h-2 bg-modex-accent mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6 mb-12">
            {[
              { icon: Users, title: 'Financial Analysts', desc: 'Build models that impress' },
              { icon: Award, title: 'CFOs & Directors', desc: 'Strategic decision tools' },
              { icon: Building2, title: 'Corporate Teams', desc: 'Enterprise FP&A excellence' },
              { icon: GraduationCap, title: 'Students', desc: 'Career-ready skills' },
              { icon: Rocket, title: 'Startups', desc: 'Investor-grade models' },
            ].map((audience, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border-2 border-white/20 text-center hover:bg-white/20 transition-all transform hover:-translate-y-2">
                <audience.icon className="w-12 h-12 text-modex-accent mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">{audience.title}</h3>
                <p className="text-white/80 text-sm">{audience.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl border-2 border-white/20 text-center">
            <p className="text-xl text-white font-semibold mb-2">
              <Star className="inline-block w-6 h-6 text-modex-accent mr-2" />
              Trusted by finance teams at <span className="text-modex-accent">NEOM, PIF, PwC</span>, and analysts across <span className="text-modex-accent">10+ countries</span>
            </p>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section id="services" className="py-20 bg-white" data-testid="services-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-modex-primary mb-4">
              What We Do
            </h2>
            <div className="w-24 h-2 bg-modex-accent mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Training Programs */}
            <Link to="/services" className="block group">
              <div className="bg-gradient-to-br from-modex-light to-white p-8 rounded-2xl border-2 border-modex-secondary/20 hover:border-modex-secondary transition-all transform hover:-translate-y-2 hover:shadow-2xl h-full" data-testid="training-card">
                <div className="bg-modex-secondary w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-modex-primary mb-4">Training Programs</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <Zap className="w-5 h-5 text-modex-accent mr-2 flex-shrink-0 mt-0.5" />
                    <span><strong>FMVA Arabic Program</strong> - Comprehensive financial modeling certification</span>
                  </li>
                  <li className="flex items-start">
                    <Zap className="w-5 h-5 text-modex-accent mr-2 flex-shrink-0 mt-0.5" />
                    <span><strong>100FM Initiative</strong> - 100 Modelers in 100 Days</span>
                  </li>
                  <li className="flex items-start">
                    <Zap className="w-5 h-5 text-modex-accent mr-2 flex-shrink-0 mt-0.5" />
                    <span><strong>Corporate FP&A Bootcamp</strong> - Advanced financial planning & analysis</span>
                  </li>
                </ul>
              </div>
            </Link>

            {/* Consulting */}
            <Link to="/services" className="block group">
              <div className="bg-gradient-to-br from-modex-light to-white p-8 rounded-2xl border-2 border-modex-secondary/20 hover:border-modex-secondary transition-all transform hover:-translate-y-2 hover:shadow-2xl h-full" data-testid="consulting-card">
                <div className="bg-modex-accent w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Briefcase className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-modex-primary mb-4">Consulting Services</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <Zap className="w-5 h-5 text-modex-accent mr-2 flex-shrink-0 mt-0.5" />
                    <span><strong>Financial Modeling</strong> - Complex financial models for businesses</span>
                  </li>
                  <li className="flex items-start">
                    <Zap className="w-5 h-5 text-modex-accent mr-2 flex-shrink-0 mt-0.5" />
                    <span><strong>Valuation Services</strong> - Professional business valuations</span>
                  </li>
                  <li className="flex items-start">
                    <Zap className="w-5 h-5 text-modex-accent mr-2 flex-shrink-0 mt-0.5" />
                    <span><strong>Dashboards & Feasibility</strong> - Data visualization & project analysis</span>
                  </li>
                </ul>
              </div>
            </Link>

            {/* Competitions */}
            <Link to="/competitions" className="block group">
              <div className="bg-gradient-to-br from-modex-light to-white p-8 rounded-2xl border-2 border-modex-secondary/20 hover:border-modex-secondary transition-all transform hover:-translate-y-2 hover:shadow-2xl h-full" data-testid="competitions-card">
                <div className="bg-modex-primary w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-modex-primary mb-4">Competitions</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <Zap className="w-5 h-5 text-modex-accent mr-2 flex-shrink-0 mt-0.5" />
                    <span><strong>CFO Challenge</strong> - Strategic financial leadership competition</span>
                  </li>
                  <li className="flex items-start">
                    <Zap className="w-5 h-5 text-modex-accent mr-2 flex-shrink-0 mt-0.5" />
                    <span><strong>Modeling Challenge</strong> - Test your financial modeling skills</span>
                  </li>
                  <li className="flex items-start">
                    <Zap className="w-5 h-5 text-modex-accent mr-2 flex-shrink-0 mt-0.5" />
                    <span><strong>Excel Challenge</strong> - Master advanced Excel techniques</span>
                  </li>
                </ul>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Why ModEX Section */}
      <section className="py-20 bg-gradient-to-br from-modex-primary via-modex-primary to-modex-secondary" data-testid="why-modex-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
              Why ModEX?
            </h2>
            <div className="w-24 h-2 bg-modex-accent mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl border-2 border-white/20 text-center hover:bg-white/20 transition-all transform hover:scale-105" data-testid="stat-card-1">
              <Award className="w-12 h-12 text-modex-accent mx-auto mb-4" />
              <h3 className="text-4xl font-black text-white mb-2">Top 10</h3>
              <p className="text-white/90 font-semibold">Global Financial Modeler</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl border-2 border-white/20 text-center hover:bg-white/20 transition-all transform hover:scale-105" data-testid="stat-card-2">
              <Users className="w-12 h-12 text-modex-accent mx-auto mb-4" />
              <h3 className="text-4xl font-black text-white mb-2">500+</h3>
              <p className="text-white/90 font-semibold">Analysts Trained</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl border-2 border-white/20 text-center hover:bg-white/20 transition-all transform hover:scale-105" data-testid="stat-card-3">
              <Briefcase className="w-12 h-12 text-modex-accent mx-auto mb-4" />
              <h3 className="text-4xl font-black text-white mb-2">Elite</h3>
              <p className="text-white/90 font-semibold">NEOM, PIF, PwC Projects</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl border-2 border-white/20 text-center hover:bg-white/20 transition-all transform hover:scale-105" data-testid="stat-card-4">
              <Globe className="w-12 h-12 text-modex-accent mx-auto mb-4" />
              <h3 className="text-4xl font-black text-white mb-2">Global</h3>
              <p className="text-white/90 font-semibold">Free Learning Across MENA</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Arabic FMVA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-modex-primary mb-4">
              Why Arabic FMVA?
            </h2>
            <div className="w-24 h-2 bg-modex-accent mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="bg-gradient-to-br from-modex-light to-white p-8 rounded-2xl border-2 border-modex-secondary/20">
                <h3 className="text-2xl font-bold text-modex-primary mb-6">Unique Value for MENA Professionals</h3>
                <ul className="space-y-4">
                  {[
                    'First comprehensive financial modeling certification in Arabic',
                    'Culturally relevant case studies from MENA markets',
                    'Taught by Top 10 global modeler with regional expertise',
                    'Direct application to GCC corporate finance roles',
                    'Community of Arabic-speaking financial professionals',
                    'Globally recognized certificate with local relevance'
                  ].map((benefit, idx) => (
                    <li key={idx} className="flex items-start">
                      <CheckCircle className="w-6 h-6 text-modex-accent mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-lg">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-video bg-gradient-to-br from-modex-secondary to-modex-primary rounded-2xl p-8 flex items-center justify-center">
                <div className="text-center text-white">
                  <BarChart3 className="w-24 h-24 mx-auto mb-4" />
                  <p className="text-xl font-bold">Professional Financial Model Example</p>
                  <p className="text-sm text-white/80 mt-2">Real-world dashboard & analysis</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Programs Section with Learning Outcomes */}
      <section id="programs" className="py-20 bg-gray-50" data-testid="programs-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-modex-primary mb-4">
              Featured Programs
            </h2>
            <div className="w-24 h-2 bg-modex-accent mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* FMVA Program */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 group" data-testid="program-fmva">
              <div className="h-48 bg-gradient-to-br from-modex-secondary to-modex-primary flex items-center justify-center">
                <Award className="w-20 h-20 text-white group-hover:scale-110 transition-transform" />
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-modex-primary mb-3">FMVA Arabic Program</h3>
                <p className="text-gray-600 mb-4">
                  Comprehensive financial modeling certification program in Arabic.
                </p>
                <div className="mb-4">
                  <h4 className="font-bold text-modex-primary mb-2 text-sm">LEARNING OUTCOMES:</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-modex-accent mr-2" />
                      Build complex financial models from scratch
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-modex-accent mr-2" />
                      Real-world case studies & projects
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-modex-accent mr-2" />
                      DCF valuation & analysis techniques
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-modex-accent mr-2" />
                      Professional dashboards & reporting
                    </li>
                  </ul>
                </div>
                <Link to="/fmva" className="block w-full bg-modex-secondary text-white py-3 rounded-lg font-bold hover:bg-modex-primary transition-colors text-center group-hover:shadow-lg">
                  Learn More <ArrowRight className="inline-block ml-2 w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* 100FM Program */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 group" data-testid="program-100fm">
              <div className="h-48 bg-gradient-to-br from-modex-accent to-modex-secondary flex items-center justify-center">
                <TrendingUp className="w-20 h-20 text-white group-hover:scale-110 transition-transform" />
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-modex-primary mb-3">100FM Initiative</h3>
                <p className="text-gray-600 mb-4">
                  Train 100 financial modelers in 100 days.
                </p>
                <div className="mb-4">
                  <h4 className="font-bold text-modex-primary mb-2 text-sm">LEARNING OUTCOMES:</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-modex-accent mr-2" />
                      Clear mission: 100 modelers in 100 days
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-modex-accent mr-2" />
                      Structured pathway from beginner to expert
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-modex-accent mr-2" />
                      Progress tracker & milestone achievements
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-modex-accent mr-2" />
                      Community support & peer learning
                    </li>
                  </ul>
                </div>
                <Link to="/100fm" className="block w-full bg-modex-accent text-white py-3 rounded-lg font-bold hover:bg-modex-primary transition-colors text-center group-hover:shadow-lg">
                  Learn More <ArrowRight className="inline-block ml-2 w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* FP&A Bootcamp */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 group" data-testid="program-fpa">
              <div className="h-48 bg-gradient-to-br from-modex-primary to-modex-accent flex items-center justify-center">
                <Briefcase className="w-20 h-20 text-white group-hover:scale-110 transition-transform" />
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-modex-primary mb-3">Corporate FP&A Bootcamp</h3>
                <p className="text-gray-600 mb-4">
                  Advanced financial planning & analysis training.
                </p>
                <div className="mb-4">
                  <h4 className="font-bold text-modex-primary mb-2 text-sm">LEARNING OUTCOMES:</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-modex-accent mr-2" />
                      Budgeting & annual planning processes
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-modex-accent mr-2" />
                      OPEX & CAPEX modeling frameworks
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-modex-accent mr-2" />
                      Revenue & cost driver forecasting
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-modex-accent mr-2" />
                      Variance analysis & KPI dashboards
                    </li>
                  </ul>
                </div>
                <Link to="/services" className="block w-full bg-modex-primary text-white py-3 rounded-lg font-bold hover:bg-modex-secondary transition-colors text-center group-hover:shadow-lg">
                  Learn More <ArrowRight className="inline-block ml-2 w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pathway to Mastery Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-modex-primary mb-4">
              Pathway to Mastery
            </h2>
            <div className="w-24 h-2 bg-modex-accent mx-auto rounded-full"></div>
            <p className="text-xl text-gray-600 mt-6">Your journey from beginner to certified financial modeling expert</p>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-modex-secondary via-modex-accent to-modex-primary transform -translate-y-1/2"></div>
            
            <div className="grid md:grid-cols-6 gap-4 relative">
              {[
                { step: 1, title: 'Beginner', icon: GraduationCap, desc: 'Start with fundamentals' },
                { step: 2, title: 'FMVA Program', icon: BookOpen, desc: 'Comprehensive training' },
                { step: 3, title: 'Advanced Modeling', icon: BarChart3, desc: 'Complex models' },
                { step: 4, title: 'FP&A Bootcamp', icon: TrendingUp, desc: 'Corporate excellence' },
                { step: 5, title: 'Competitions', icon: Trophy, desc: 'Test your skills' },
                { step: 6, title: 'Certification', icon: Award, desc: 'Global recognition' },
              ].map((phase) => (
                <div key={phase.step} className="relative">
                  <div className="bg-white border-2 border-modex-secondary/20 hover:border-modex-secondary rounded-xl p-4 text-center hover:shadow-lg transition-all transform hover:-translate-y-2">
                    <div className="bg-gradient-to-br from-modex-secondary to-modex-accent w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-black text-lg">
                      {phase.step}
                    </div>
                    <phase.icon className="w-8 h-8 text-modex-primary mx-auto mb-2" />
                    <h3 className="text-sm font-bold text-modex-primary mb-1">{phase.title}</h3>
                    <p className="text-xs text-gray-600">{phase.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-modex-primary mb-4">
              Success Stories
            </h2>
            <div className="w-24 h-2 bg-modex-accent mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Ahmed Al-Salem',
                role: 'Senior Financial Analyst at PIF',
                quote: 'The FMVA program transformed my career. Within 6 months, I secured a position at PIF. The practical approach made all the difference.',
                rating: 5
              },
              {
                name: 'Sara Mohammed',
                role: 'FP&A Manager at Aramco',
                quote: 'Best investment in my professional development. The certification opened doors and led to a 40% salary increase.',
                rating: 5
              },
              {
                name: 'Omar Hassan',
                role: 'Investment Analyst at NEOM',
                quote: 'The hands-on projects prepared me perfectly for my role at NEOM. Quality of instruction exceeded expectations.',
                rating: 5
              },
            ].map((testimonial, idx) => (
              <div key={idx} className="bg-white p-6 rounded-xl border-2 border-modex-secondary/10 hover:border-modex-secondary transition-all hover:shadow-lg">
                <div className="flex text-modex-accent mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.quote}"</p>
                <div className="flex items-center">
                  <div className="bg-gradient-to-br from-modex-secondary to-modex-accent w-12 h-12 rounded-full flex items-center justify-center text-white font-black mr-3">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-modex-primary">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link to="/testimonials" className="inline-block bg-modex-secondary text-white px-8 py-3 rounded-xl font-bold hover:bg-modex-primary transition-all transform hover:scale-105 shadow-lg">
              View All Success Stories <ArrowRight className="inline-block ml-2 w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Free Learning & Community Section */}
      <section id="community" className="py-20 bg-white" data-testid="community-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-modex-primary mb-4">
              Free Learning & Community
            </h2>
            <div className="w-24 h-2 bg-modex-accent mx-auto rounded-full"></div>
            <p className="text-xl text-gray-600 mt-6 max-w-2xl mx-auto">
              Access world-class financial modeling education at no cost. Join our global community.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Award, title: 'Free FMVA Rounds', desc: 'Complimentary sessions from our FMVA program' },
              { icon: Video, title: 'Free Webinars', desc: 'Regular live sessions on trending topics' },
              { icon: Trophy, title: 'Free Competitions', desc: 'Test your skills in monthly challenges' },
              { icon: Globe, title: 'YouTube & LinkedIn', desc: 'Daily tips, tutorials, and insights' },
            ].map((item, idx) => (
              <div key={idx} className="bg-gradient-to-br from-modex-light to-white p-6 rounded-xl border-2 border-modex-secondary/20 hover:border-modex-secondary transition-all hover:shadow-lg group" data-testid={`free-${idx}`}>
                <div className="bg-modex-secondary/10 w-14 h-14 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <item.icon className="w-7 h-7 text-modex-secondary" />
                </div>
                <h3 className="text-xl font-bold text-modex-primary mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link to="/community" className="inline-block bg-modex-accent text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-modex-primary transition-all transform hover:scale-105 shadow-lg group" data-testid="join-free-btn">
              Join Free Community Now
              <ArrowRight className="inline-block ml-2 w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default Home;