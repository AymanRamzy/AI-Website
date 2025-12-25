import { Link, useNavigate } from 'react-router-dom';
import { Trophy, Target, Calendar, Award, Users, Clock, Zap, Star, Brain, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function Competitions() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleRegisterClick = () => {
    if (user) {
      // If logged in, go to dashboard to see competitions
      navigate('/dashboard');
    } else {
      // If not logged in, go to signin page
      navigate('/signin');
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center pt-20 overflow-hidden" data-testid="competitions-hero">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-modex-primary via-modex-accent to-modex-secondary"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block mb-6">
            <Trophy className="w-20 h-20 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
            Financial Modeling Competitions
          </h1>
          <p className="text-xl sm:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
            Compete, Excel, and Get Recognized on the Global Stage
          </p>
          <button 
            onClick={handleRegisterClick}
            className="bg-white text-modex-primary px-8 py-4 rounded-xl font-bold text-lg hover:bg-modex-accent hover:text-white transition-all transform hover:scale-105 shadow-2xl" 
            data-testid="register-competition-btn"
          >
            {user ? 'View Available Competitions' : 'Sign In to Register'}
          </button>
        </div>
      </section>

      {/* Competitions Overview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-modex-primary mb-4">
              Our Competitions
            </h2>
            <div className="w-24 h-2 bg-modex-accent mx-auto rounded-full"></div>
          </div>

          <div className="space-y-8">
            {/* CFO Challenge */}
            <div className="bg-gradient-to-br from-modex-light to-white rounded-2xl p-8 border-2 border-modex-secondary/20 hover:border-modex-secondary transition-all">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="bg-gradient-to-br from-modex-secondary to-modex-primary w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Award className="w-10 h-10 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <h3 className="text-3xl font-black text-modex-primary">CFO Challenge</h3>
                    <span className="bg-modex-accent text-white px-3 py-1 rounded-full text-sm font-bold">FLAGSHIP EVENT</span>
                  </div>
                  <p className="text-lg text-gray-700 mb-6">
                    Strategic financial leadership competition testing your ability to make critical business decisions under pressure. Simulate a CFO's role in navigating complex financial scenarios.
                  </p>
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 text-modex-accent mr-2" />
                      <span className="text-gray-700"><strong>Frequency:</strong> Quarterly</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-5 h-5 text-modex-accent mr-2" />
                      <span className="text-gray-700"><strong>Duration:</strong> 48 Hours</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="w-5 h-5 text-modex-accent mr-2" />
                      <span className="text-gray-700"><strong>Format:</strong> Team (3-5)</span>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-modex-secondary/10">
                    <h4 className="font-bold text-modex-primary mb-2">Challenge Components:</h4>
                    <ul className="grid md:grid-cols-2 gap-2">
                      {[
                        'Strategic decision-making',
                        'Financial forecasting',
                        'Risk assessment',
                        'Investor presentations',
                        'M&A evaluation',
                        'Capital allocation'
                      ].map((item, idx) => (
                        <li key={idx} className="flex items-start">
                          <CheckCircle className="w-4 h-4 text-modex-accent mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Modeling Challenge */}
            <div className="bg-gradient-to-br from-modex-light to-white rounded-2xl p-8 border-2 border-modex-secondary/20 hover:border-modex-secondary transition-all">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="bg-gradient-to-br from-modex-accent to-modex-secondary w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Target className="w-10 h-10 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <h3 className="text-3xl font-black text-modex-primary">Financial Modeling Challenge</h3>
                    <span className="bg-modex-secondary text-white px-3 py-1 rounded-full text-sm font-bold">MOST POPULAR</span>
                  </div>
                  <p className="text-lg text-gray-700 mb-6">
                    Test your financial modeling skills against the best. Build comprehensive models from scratch within a tight deadline. Focus on accuracy, structure, and best practices.
                  </p>
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 text-modex-accent mr-2" />
                      <span className="text-gray-700"><strong>Frequency:</strong> Monthly</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-5 h-5 text-modex-accent mr-2" />
                      <span className="text-gray-700"><strong>Duration:</strong> 6 Hours</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="w-5 h-5 text-modex-accent mr-2" />
                      <span className="text-gray-700"><strong>Format:</strong> Individual</span>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-modex-secondary/10">
                    <h4 className="font-bold text-modex-primary mb-2">Evaluation Criteria:</h4>
                    <ul className="grid md:grid-cols-2 gap-2">
                      {[
                        'Model accuracy',
                        'Structure & organization',
                        'Formula efficiency',
                        'Scenario analysis',
                        'Documentation',
                        'Presentation quality'
                      ].map((item, idx) => (
                        <li key={idx} className="flex items-start">
                          <CheckCircle className="w-4 h-4 text-modex-accent mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Excel Challenge */}
            <div className="bg-gradient-to-br from-modex-light to-white rounded-2xl p-8 border-2 border-modex-secondary/20 hover:border-modex-secondary transition-all">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="bg-gradient-to-br from-modex-primary to-modex-accent w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Zap className="w-10 h-10 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <h3 className="text-3xl font-black text-modex-primary">Excel Mastery Challenge</h3>
                    <span className="bg-modex-primary text-white px-3 py-1 rounded-full text-sm font-bold">SPEED ROUND</span>
                  </div>
                  <p className="text-lg text-gray-700 mb-6">
                    Master advanced Excel techniques in this fast-paced challenge. From complex formulas to automation, showcase your Excel prowess and efficiency.
                  </p>
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 text-modex-accent mr-2" />
                      <span className="text-gray-700"><strong>Frequency:</strong> Bi-weekly</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-5 h-5 text-modex-accent mr-2" />
                      <span className="text-gray-700"><strong>Duration:</strong> 3 Hours</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="w-5 h-5 text-modex-accent mr-2" />
                      <span className="text-gray-700"><strong>Format:</strong> Individual</span>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-modex-secondary/10">
                    <h4 className="font-bold text-modex-primary mb-2">Challenge Areas:</h4>
                    <ul className="grid md:grid-cols-2 gap-2">
                      {[
                        'Advanced formulas',
                        'Power Query',
                        'Pivot tables',
                        'VBA macros',
                        'Data visualization',
                        'Dashboard creation'
                      ].map((item, idx) => (
                        <li key={idx} className="flex items-start">
                          <CheckCircle className="w-4 h-4 text-modex-accent mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Scoring Placeholder */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-modex-primary mb-4">
              AI-Powered Scoring System
            </h2>
            <div className="w-24 h-2 bg-modex-accent mx-auto rounded-full"></div>
            <p className="text-xl text-gray-600 mt-6">Next-generation evaluation technology (Coming Soon)</p>
          </div>

          <div className="bg-gradient-to-br from-white to-modex-light p-8 md:p-12 rounded-2xl border-2 border-modex-secondary/20">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="bg-gradient-to-br from-modex-secondary to-modex-accent w-32 h-32 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Brain className="w-16 h-16 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-modex-primary mb-4">Introducing AI Judging</h3>
                <p className="text-lg text-gray-700 mb-6">
                  We're developing an advanced AI system to provide instant, objective, and comprehensive evaluation of financial models. This revolutionary technology will analyze multiple dimensions of your work in real-time.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    'Real-time formula validation',
                    'Structure & best practices analysis',
                    'Accuracy scoring',
                    'Instant feedback & suggestions',
                    'Benchmark comparison',
                    'Learning recommendations'
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-start">
                      <Star className="w-5 h-5 text-modex-accent mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rules & Timeline */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-modex-primary mb-4">
              Competition Rules & Timeline
            </h2>
            <div className="w-24 h-2 bg-modex-accent mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-modex-light to-white p-8 rounded-2xl border-2 border-modex-secondary/20">
              <h3 className="text-2xl font-bold text-modex-primary mb-6">General Rules</h3>
              <ul className="space-y-3">
                {[
                  'Open to all professionals and students',
                  'Original work only - no plagiarism',
                  'Use of external data sources allowed',
                  'No collaboration (for individual events)',
                  'Submit before deadline (no extensions)',
                  'Winners announced within 48 hours'
                ].map((rule, idx) => (
                  <li key={idx} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-modex-accent mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gradient-to-br from-modex-light to-white p-8 rounded-2xl border-2 border-modex-secondary/20">
              <h3 className="text-2xl font-bold text-modex-primary mb-6">Typical Timeline</h3>
              <div className="space-y-4">
                {[
                  { time: 'Week 1', event: 'Registration Opens' },
                  { time: 'Week 2', event: 'Pre-Competition Briefing' },
                  { time: 'Week 3', event: 'Competition Day' },
                  { time: 'Week 3 + 2 days', event: 'Results Announced' },
                  { time: 'Week 4', event: 'Awards & Recognition' },
                ].map((phase, idx) => (
                  <div key={idx} className="flex items-center">
                    <div className="bg-modex-secondary text-white w-20 px-3 py-2 rounded-lg text-center font-bold text-sm flex-shrink-0">
                      {phase.time}
                    </div>
                    <div className="flex-1 ml-4">
                      <p className="text-gray-700 font-semibold">{phase.event}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Prizes & Recognition */}
      <section className="py-20 bg-gradient-to-br from-modex-primary to-modex-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
              Prizes & Recognition
            </h2>
            <div className="w-24 h-2 bg-modex-accent mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { place: '1st Place', prize: '$1,000', extras: 'Trophy, Certificate, Featured Profile' },
              { place: '2nd Place', prize: '$500', extras: 'Certificate, Featured Profile' },
              { place: '3rd Place', prize: '$250', extras: 'Certificate, Recognition' },
            ].map((winner, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl border-2 border-white/20 text-center hover:bg-white/20 transition-all">
                <Trophy className="w-16 h-16 text-modex-accent mx-auto mb-4" />
                <h3 className="text-2xl font-black text-white mb-2">{winner.place}</h3>
                <p className="text-4xl font-black text-modex-accent mb-4">{winner.prize}</p>
                <p className="text-white/80">{winner.extras}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-white/90 text-lg mb-4">All participants receive:</p>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                'Participation certificate',
                'Feedback report',
                'Model review',
                'Community recognition'
              ].map((benefit, idx) => (
                <span key={idx} className="bg-white/10 border border-white/20 text-white px-4 py-2 rounded-full text-sm font-semibold">
                  {benefit}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-black text-modex-primary mb-6">
            Ready to Compete?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join hundreds of professionals showcasing their skills on the global stage
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-modex-accent text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-modex-primary transition-all transform hover:scale-105 shadow-2xl" data-testid="register-cta-btn">
              Register for Next Competition
            </button>
            <Link to="/community" className="bg-modex-secondary text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-modex-primary transition-all transform hover:scale-105 shadow-2xl">
              View Past Winners
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default Competitions;