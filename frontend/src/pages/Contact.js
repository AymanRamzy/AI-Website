import { Mail, Phone, MapPin, Send, MessageCircle, Clock } from 'lucide-react';

function Contact() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[50vh] flex items-center justify-center pt-20 overflow-hidden" data-testid="contact-hero">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-modex-accent via-modex-secondary to-modex-primary"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block mb-6">
            <MessageCircle className="w-20 h-20 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
            Get in Touch
          </h1>
          <p className="text-xl sm:text-2xl text-white/90 mb-4 max-w-3xl mx-auto">
            Have questions? We're here to help!
          </p>
        </div>
      </section>

      {/* Contact Information & Form */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div>
              <h2 className="text-3xl font-black text-modex-primary mb-8">Contact Information</h2>
              
              <div className="space-y-6 mb-12">
                <div className="flex items-start">
                  <div className="bg-modex-secondary/10 w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 mr-4">
                    <Mail className="w-6 h-6 text-modex-secondary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-modex-primary mb-1">Email</h3>
                    <p className="text-gray-700">Noreply@FinancialModEX.com</p>
                    
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-modex-accent/10 w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 mr-4">
                    <Phone className="w-6 h-6 text-modex-accent" />
                  </div>
                  <div>
                    <h3 className="font-bold text-modex-primary mb-1">WhatsApp</h3>
                    <p className="text-gray-700">+966 50 548 9259</p>
                    <p className="text-sm text-gray-500">Available 9 AM - 6 PM (GMT+3)</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-modex-primary/10 w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 mr-4">
                    <MapPin className="w-6 h-6 text-modex-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-modex-primary mb-1">Location</h3>
                    <p className="text-gray-700">Riyadh, Saudi Arabia</p>
                    <p className="text-sm text-gray-500">Serving clients globally</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-modex-accent/10 w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 mr-4">
                    <Clock className="w-6 h-6 text-modex-accent" />
                  </div>
                  <div>
                    <h3 className="font-bold text-modex-primary mb-1">Business Hours</h3>
                    <p className="text-gray-700">Sunday - Thursday: 9 AM - 6 PM</p>
                    <p className="text-gray-700">Friday - Saturday: Closed</p>
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div className="bg-gradient-to-br from-modex-light to-white p-6 rounded-xl border-2 border-modex-secondary/20">
                <h3 className="font-bold text-modex-primary mb-4">Follow Us</h3>
                <div className="flex space-x-4">
                  <a href="https://www.linkedin.com/company/modexera/" className="bg-modex-secondary/10 hover:bg-modex-secondary w-12 h-12 rounded-lg flex items-center justify-center transition-all group">
                    <svg className="w-6 h-6 text-modex-secondary group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                    </svg>
                  </a>
                  <a href="https://www.linkedin.com/company/modexera/" className="bg-modex-accent/10 hover:bg-modex-accent w-12 h-12 rounded-lg flex items-center justify-center transition-all group">
                    <svg className="w-6 h-6 text-modex-accent group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </a>
                  <a href="https://www.linkedin.com/company/modexera/" className="bg-modex-primary/10 hover:bg-modex-primary w-12 h-12 rounded-lg flex items-center justify-center transition-all group">
                    <svg className="w-6 h-6 text-modex-primary group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-gradient-to-br from-modex-light to-white p-8 rounded-2xl border-2 border-modex-secondary/20">
              <h2 className="text-3xl font-black text-modex-primary mb-6">Send Us a Message</h2>
              
              <form className="space-y-6" data-testid="contact-form">
                <div>
                  <label htmlFor="name" className="block text-sm font-bold text-modex-primary mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="w-full px-4 py-3 border-2 border-modex-secondary/20 rounded-lg focus:border-modex-secondary focus:outline-none transition-colors"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-modex-primary mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-4 py-3 border-2 border-modex-secondary/20 rounded-lg focus:border-modex-secondary focus:outline-none transition-colors"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-bold text-modex-primary mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className="w-full px-4 py-3 border-2 border-modex-secondary/20 rounded-lg focus:border-modex-secondary focus:outline-none transition-colors"
                    placeholder="+966 50 548 9259"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-bold text-modex-primary mb-2">
                    Subject *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    className="w-full px-4 py-3 border-2 border-modex-secondary/20 rounded-lg focus:border-modex-secondary focus:outline-none transition-colors"
                  >
                    <option value="">Select a subject</option>
                    <option value="fmva">FMVA Program Inquiry</option>
                    <option value="100fm">100FM Initiative</option>
                    <option value="training">Corporate Training</option>
                    <option value="consulting">Consulting Services</option>
                    <option value="competitions">Competitions</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-bold text-modex-primary mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    className="w-full px-4 py-3 border-2 border-modex-secondary/20 rounded-lg focus:border-modex-secondary focus:outline-none transition-colors resize-none"
                    placeholder="Tell us how we can help..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-modex-accent text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-modex-secondary transition-all transform hover:scale-105 shadow-lg"
                  data-testid="submit-btn"
                >
                  <Send className="inline-block mr-2 w-5 h-5" />
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Map Placeholder */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-black text-modex-primary mb-4">
              Our Location
            </h2>
            <div className="w-24 h-2 bg-modex-accent mx-auto rounded-full"></div>
          </div>

          <div className="bg-gradient-to-br from-modex-light to-white rounded-2xl p-8 border-2 border-modex-secondary/20">
            <div className="aspect-video bg-gray-200 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-16 h-16 text-modex-secondary mx-auto mb-4" />
                <p className="text-xl font-bold text-modex-primary mb-2">Riyadh, Saudi Arabia</p>
                <p className="text-gray-600">Map integration coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-black text-modex-primary mb-8">Looking for Something Specific?</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { label: 'Program FAQs', link: '/faq' },
              { label: 'Training Services', link: '/services' },
              { label: 'Competitions', link: '/competitions' },
              { label: 'Community', link: '/community' },
            ].map((item, idx) => (
              <a
                key={idx}
                href={item.link}
                className="bg-gradient-to-br from-modex-light to-white px-6 py-4 rounded-xl border-2 border-modex-secondary/20 hover:border-modex-secondary transition-all font-bold text-modex-primary hover:text-modex-secondary"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default Contact;