import { Link } from 'react-router-dom';
import { Users, BookOpen, Download, Video, FileText, Link as LinkIcon, Award, Calendar, MessageCircle } from 'lucide-react';

function Community() {
  const resources = [
    {
      title: 'Financial Modeling Templates',
      desc: '50+ professional Excel templates for various industries and use cases',
      type: 'Templates',
      icon: FileText,
      color: 'from-modex-secondary to-modex-primary'
    },
    {
      title: 'Best Practices Guide',
      desc: 'Comprehensive guide to financial modeling standards and conventions',
      type: 'PDF Guide',
      icon: BookOpen,
      color: 'from-modex-accent to-modex-secondary'
    },
    {
      title: 'Excel Shortcuts Cheat Sheet',
      desc: 'Master keyboard shortcuts to boost your modeling speed',
      type: 'Cheat Sheet',
      icon: Download,
      color: 'from-modex-primary to-modex-accent'
    },
  ];

  const articles = [
    {
      title: '10 Common Financial Modeling Mistakes and How to Avoid Them',
      category: 'Best Practices',
      date: 'March 15, 2025',
      readTime: '8 min read'
    },
    {
      title: 'The Ultimate Guide to DCF Valuation',
      category: 'Valuation',
      date: 'March 10, 2025',
      readTime: '12 min read'
    },
    {
      title: 'Building Dynamic Dashboards in Excel',
      category: 'Excel Tips',
      date: 'March 5, 2025',
      readTime: '10 min read'
    },
    {
      title: 'Career Path: From Analyst to CFO',
      category: 'Career',
      date: 'February 28, 2025',
      readTime: '6 min read'
    },
    {
      title: 'M&A Modeling: A Complete Guide',
      category: 'M&A',
      date: 'February 20, 2025',
      readTime: '15 min read'
    },
    {
      title: 'Scenario Analysis: Planning for Uncertainty',
      category: 'FP&A',
      date: 'February 15, 2025',
      readTime: '9 min read'
    },
  ];

  return (
    <>
      {/* Hero Section */}
 <section className="relative min-h-[60vh] flex items-center justify-center pt-20 overflow-hidden" data-testid="community-hero">
  <div className="absolute inset-0 z-0 bg-gradient-to-br from-modex-accent via-modex-primary to-modex-secondary"></div>

  <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <div className="inline-block mb-6">
      <Users className="w-20 h-20 text-white" />
    </div>

    <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
      ModEX Community
    </h1>

    <p className="text-xl sm:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
      Free Resources, Learning Materials, and a Global Network of Financial Professionals
    </p>

    <a
      href="https://t.me/ModEX_Co"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block bg-white text-modex-primary px-8 py-4 rounded-xl font-bold text-lg hover:bg-modex-accent hover:text-white transition-all transform hover:scale-105 shadow-2xl"
      data-testid="join-community-btn"
    >
      Join Free Community
    </a>
  </div>
</section>


      {/* Free Resources */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-modex-primary mb-4">
              Free Resources
            </h2>
            <div className="w-24 h-2 bg-modex-accent mx-auto rounded-full"></div>
            <p className="text-xl text-gray-600 mt-6">Download templates, guides, and tools to accelerate your learning</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {resources.map((resource, idx) => (
              <div key={idx} className="bg-white rounded-2xl shadow-lg border-2 border-modex-secondary/10 hover:border-modex-secondary transition-all overflow-hidden group">
                <div className={`bg-gradient-to-br ${resource.color} p-8 text-center`}>
                  <resource.icon className="w-16 h-16 text-white mx-auto" />
                </div>
                <div className="p-6">
                  <span className="inline-block bg-modex-accent/10 text-modex-accent px-3 py-1 rounded-full text-xs font-bold mb-3">
                    {resource.type}
                  </span>
                  <h3 className="text-xl font-bold text-modex-primary mb-2">{resource.title}</h3>
                  <p className="text-gray-600 mb-4">{resource.desc}</p>
                  <button className="w-full bg-modex-secondary text-white py-3 rounded-lg font-bold hover:bg-modex-primary transition-colors flex items-center justify-center">
                    <Download className="w-5 h-5 mr-2" />
                    Download Free
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link to="/contact" className="inline-block bg-modex-accent text-white px-8 py-3 rounded-xl font-bold hover:bg-modex-primary transition-all">
              Request More Resources
            </Link>
          </div>
        </div>
      </section>

      {/* Latest Articles */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-modex-primary mb-4">
              Latest Articles & Insights
            </h2>
            <div className="w-24 h-2 bg-modex-accent mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 border-2 border-modex-secondary/10 hover:border-modex-secondary transition-all cursor-pointer group">
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-modex-secondary/10 text-modex-secondary px-3 py-1 rounded-full text-xs font-bold">
                    {article.category}
                  </span>
                  <span className="text-sm text-gray-500">{article.readTime}</span>
                </div>
                <h3 className="text-lg font-bold text-modex-primary mb-2 group-hover:text-modex-secondary transition-colors">
                  {article.title}
                </h3>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  {article.date}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button className="bg-modex-secondary text-white px-8 py-3 rounded-xl font-bold hover:bg-modex-primary transition-all">
              View All Articles
            </button>
          </div>
        </div>
      </section>

      {/* Free Learning Initiatives */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-modex-primary mb-4">
              Free Learning Initiatives
            </h2>
            <div className="w-24 h-2 bg-modex-accent mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: BookOpen,
                title: 'Free FMVA Rounds',
                desc: 'Monthly free sessions from our flagship FMVA program',
                link: '/fmva'
              },
              {
                icon: Video,
                title: 'Weekly Webinars',
                desc: 'Live sessions on trending financial modeling topics',
                link: '/contact'
              },
              {
                icon: Award,
                title: 'Free Competitions',
                desc: 'Test your skills in monthly modeling challenges',
                link: '/competitions'
              },
              {
                icon: Users,
                title: 'Study Groups',
                desc: 'Join peer learning groups and discussion forums',
                link: '/contact'
              },
            ].map((initiative, idx) => (
              <Link key={idx} to={initiative.link} className="block">
                <div className="bg-gradient-to-br from-modex-light to-white p-6 rounded-xl border-2 border-modex-secondary/20 hover:border-modex-secondary transition-all text-center h-full">
                  <div className="bg-modex-accent/10 w-14 h-14 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <initiative.icon className="w-7 h-7 text-modex-accent" />
                  </div>
                  <h3 className="text-lg font-bold text-modex-primary mb-2">{initiative.title}</h3>
                  <p className="text-gray-600 text-sm">{initiative.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Community Links */}
      <section className="py-20 bg-gradient-to-br from-modex-primary to-modex-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
              Connect With Us
            </h2>
            <div className="w-24 h-2 bg-modex-accent mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                platform: 'YouTube',
                desc: 'Free tutorials and lessons',
                subscribers: '50K+',
                icon: Video
              },
              {
                platform: 'LinkedIn',
                desc: 'Industry insights and tips',
                subscribers: '100K+',
                icon: LinkIcon
              },
              {
                platform: 'Discord',
                desc: 'Community discussions',
                subscribers: '15K+',
                icon: MessageCircle
              },
              {
                platform: 'Newsletter',
                desc: 'Weekly modeling insights',
                subscribers: '25K+',
                icon: FileText
              },
            ].map((link, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border-2 border-white/20 hover:bg-white/20 transition-all text-center cursor-pointer">
                <link.icon className="w-12 h-12 text-modex-accent mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-1">{link.platform}</h3>
                <p className="text-white/80 text-sm mb-2">{link.desc}</p>
                <p className="text-modex-accent font-bold">{link.subscribers} members</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-modex-light to-white p-8 md:p-12 rounded-2xl border-2 border-modex-secondary/20 text-center">
            <FileText className="w-16 h-16 text-modex-accent mx-auto mb-6" />
            <h2 className="text-3xl font-black text-modex-primary mb-4">
              Subscribe to Our Newsletter
            </h2>
            <p className="text-lg text-gray-700 mb-8">
              Get weekly insights, free resources, and exclusive content delivered to your inbox
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 border-2 border-modex-secondary/20 rounded-xl focus:border-modex-secondary focus:outline-none"
                required
              />
              <button
                type="submit"
                className="bg-modex-accent text-white px-8 py-4 rounded-xl font-bold hover:bg-modex-secondary transition-all transform hover:scale-105 shadow-lg"
              >
                Subscribe
              </button>
            </form>
            <p className="text-sm text-gray-500 mt-4">Join 25,000+ professionals. Unsubscribe anytime.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-black text-modex-primary mb-6">
            Ready to Take the Next Step?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Explore our comprehensive programs and transform your career
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/fmva" className="bg-modex-accent text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-modex-primary transition-all transform hover:scale-105 shadow-2xl">
              View Programs
            </Link>
            <Link to="/contact" className="bg-modex-secondary text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-modex-primary transition-all transform hover:scale-105 shadow-2xl">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
export default Community;