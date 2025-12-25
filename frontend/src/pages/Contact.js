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
                <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                  {/* WhatsApp */}
                  <a 
                    href="https://api.whatsapp.com/send/?phone=966505489259"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp"
                    className="bg-modex-secondary/10 hover:bg-modex-secondary w-12 h-12 rounded-lg flex items-center justify-center transition-all group"
                  >
                    <svg className="w-6 h-6 text-modex-secondary group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </a>

                  {/* Facebook */}
                  <a 
                    href="https://www.facebook.com/FinModex"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="bg-modex-accent/10 hover:bg-modex-accent w-12 h-12 rounded-lg flex items-center justify-center transition-all group"
                  >
                    <svg className="w-6 h-6 text-modex-accent group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>

                  {/* Instagram */}
                  <a 
                    href="https://www.instagram.com/fin_modex"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="bg-modex-primary/10 hover:bg-modex-primary w-12 h-12 rounded-lg flex items-center justify-center transition-all group"
                  >
                    <svg className="w-6 h-6 text-modex-primary group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
                    </svg>
                  </a>

                  {/* TikTok */}
                  <a 
                    href="https://www.tiktok.com/@modex122"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="TikTok"
                    className="bg-modex-secondary/10 hover:bg-modex-secondary w-12 h-12 rounded-lg flex items-center justify-center transition-all group"
                  >
                    <svg className="w-6 h-6 text-modex-secondary group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                    </svg>
                  </a>

                  {/* Snapchat */}
                  <a 
                    href="https://www.snapchat.com/@modex20256320"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Snapchat"
                    className="bg-modex-accent/10 hover:bg-modex-accent w-12 h-12 rounded-lg flex items-center justify-center transition-all group"
                  >
                    <svg className="w-6 h-6 text-modex-accent group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-1.5.675-2.25 1.35-2.25.15 0 .33.045.52.134l.004.003c.316.137.572.24.788.24.278 0 .467-.18.467-.646 0-.675-.255-1.185-.766-1.516-.51-.33-1.186-.495-2.025-.495-.84 0-1.546.165-2.116.495-.571.33-.852.885-.852 1.665V13.5c.12 0 .24.015.36.045.556.143 1.02.422 1.39.838.37.415.554.93.554 1.545 0 .615-.185 1.13-.554 1.545-.37.416-.834.695-1.39.838-.12.03-.24.045-.36.045v1.35c0 .36-.195.69-.586.99-.391.3-.933.45-1.626.45s-1.235-.15-1.626-.45c-.391-.3-.586-.63-.586-.99v-1.35c-.12 0-.24-.015-.36-.045-.555-.143-1.02-.422-1.39-.838-.37-.415-.554-.93-.554-1.545 0-.615.184-1.13.554-1.545.37-.416.835-.695 1.39-.838.12-.03.24-.045.36-.045V7.252c0-.78-.281-1.335-.852-1.665-.57-.33-1.276-.495-2.116-.495-.84 0-1.516.165-2.025.495-.51.33-.766.84-.766 1.516 0 .465.189.645.467.645.216 0 .472-.103.788-.24l.004-.003c.19-.09.37-.134.52-.134.675 0 1.05.75 1.35 2.25.198 0 .326-.045.401-.09-.008-.165-.018-.33-.03-.51l-.003-.06c-.104-1.628-.23-3.654.299-4.847C7.859 1.07 11.216.793 12.206.793z"/>
                    </svg>
                  </a>

                  {/* LinkedIn */}
                  <a 
                    href="https://www.linkedin.com/company/modexera/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                    className="bg-modex-primary/10 hover:bg-modex-primary w-12 h-12 rounded-lg flex items-center justify-center transition-all group"
                  >
                    <svg className="w-6 h-6 text-modex-primary group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>

                  {/* Telegram */}
                  <a 
                    href="https://t.me/ModEX_Co"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Telegram"
                    className="bg-modex-secondary/10 hover:bg-modex-secondary w-12 h-12 rounded-lg flex items-center justify-center transition-all group"
                  >
                    <svg className="w-6 h-6 text-modex-secondary group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
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