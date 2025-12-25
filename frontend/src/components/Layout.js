import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';

function Layout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const dropdownRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setProfileDropdownOpen(false);
    navigate('/');
  };

  // Get user initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo - Full ModEX Logo (Icon + Text) */}
            <Link to="/" className="flex-shrink-0">
              <img 
                src="/logo-main.png" 
                alt="ModEX - Financial Modeling Excellence" 
                className="h-10 w-auto"
                style={{ objectFit: 'contain' }}
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-6">
              <Link
                to="/"
                className={`font-semibold transition-colors ${
                  isActive('/') ? 'text-modex-secondary' : 'text-gray-700 hover:text-modex-secondary'
                }`}
              >
                Home
              </Link>
              <div className="relative group">
                <button className="font-semibold text-gray-700 hover:text-modex-secondary transition-colors flex items-center">
                  Programs
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <Link to="/fmva" className="block px-4 py-3 hover:bg-modex-light transition-colors">
                    <span className="font-bold text-modex-primary">FMVA Arabic</span>
                    <p className="text-xs text-gray-600">Certification program</p>
                  </Link>
                  <Link to="/100fm" className="block px-4 py-3 hover:bg-modex-light transition-colors">
                    <span className="font-bold text-modex-primary">100FM Initiative</span>
                    <p className="text-xs text-gray-600">100 modelers in 100 days</p>
                  </Link>
                  <Link to="/services" className="block px-4 py-3 hover:bg-modex-light transition-colors">
                    <span className="font-bold text-modex-primary">Training & Consulting</span>
                    <p className="text-xs text-gray-600">Corporate solutions</p>
                  </Link>
                </div>
              </div>
              <Link
                to="/competitions"
                className={`font-semibold transition-colors ${
                  isActive('/competitions') ? 'text-modex-secondary' : 'text-gray-700 hover:text-modex-secondary'
                }`}
              >
                Competitions
              </Link>
              <Link
                to="/community"
                className={`font-semibold transition-colors ${
                  isActive('/community') ? 'text-modex-secondary' : 'text-gray-700 hover:text-modex-secondary'
                }`}
              >
                Community
              </Link>
              <Link
                to="/about"
                className={`font-semibold transition-colors ${
                  isActive('/about') ? 'text-modex-secondary' : 'text-gray-700 hover:text-modex-secondary'
                }`}
              >
                About
              </Link>
              <Link
                to="/testimonials"
                className={`font-semibold transition-colors ${
                  isActive('/testimonials') ? 'text-modex-secondary' : 'text-gray-700 hover:text-modex-secondary'
                }`}
              >
                Success Stories
              </Link>
              <Link
                to="/contact"
                className={`font-semibold transition-colors ${
                  isActive('/contact') ? 'text-modex-secondary' : 'text-gray-700 hover:text-modex-secondary'
                }`}
              >
                Contact
              </Link>
              <div className="relative group">
                <button className="font-semibold text-gray-700 hover:text-modex-secondary transition-colors flex items-center">
                  More
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <Link to="/faq" className="block px-4 py-3 hover:bg-modex-light transition-colors text-gray-700 hover:text-modex-secondary">
                    FAQ
                  </Link>
                </div>
              </div>

              {/* Auth Section - Conditional Rendering */}
              {user ? (
                /* Authenticated User - Profile Dropdown */
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center space-x-2 bg-modex-light hover:bg-modex-secondary/10 px-3 py-2 rounded-lg transition-colors"
                    data-testid="profile-dropdown-btn"
                  >
                    <div className="w-8 h-8 bg-modex-secondary text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {getInitials(user.full_name)}
                    </div>
                    <span className="font-semibold text-modex-primary max-w-[100px] truncate">
                      {user.full_name?.split(' ')[0] || 'User'}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                      <Link
                        to="/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-gray-700 hover:bg-modex-light transition-colors"
                      >
                        <User className="w-4 h-4 mr-2 text-modex-secondary" />
                        My Profile
                      </Link>
                      <Link
                        to="/dashboard"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-gray-700 hover:bg-modex-light transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 mr-2 text-modex-secondary" />
                        Dashboard
                      </Link>
                      <hr className="my-1 border-gray-200" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Unauthenticated User - Sign In / Register */
                <div className="flex items-center space-x-3">
                  <Link
                    to="/signin"
                    className="font-semibold text-gray-700 hover:text-modex-secondary transition-colors"
                    data-testid="signin-nav-btn"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="bg-modex-secondary text-white px-6 py-2.5 rounded-lg font-bold hover:bg-modex-primary transition-all transform hover:scale-105"
                    data-testid="register-nav-btn"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-md text-gray-700"
              data-testid="mobile-menu-button"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden pb-4" data-testid="mobile-menu">
              <div className="flex flex-col space-y-3">
                <Link to="/" className="text-gray-700 hover:text-modex-secondary font-semibold py-2" onClick={() => setMobileMenuOpen(false)}>
                  Home
                </Link>
                <div className="border-l-2 border-modex-secondary/20 pl-4 space-y-2">
                  <p className="text-xs text-gray-500 font-bold uppercase">Programs</p>
                  <Link to="/fmva" className="block text-gray-700 hover:text-modex-secondary font-semibold py-1" onClick={() => setMobileMenuOpen(false)}>
                    FMVA Arabic
                  </Link>
                  <Link to="/100fm" className="block text-gray-700 hover:text-modex-secondary font-semibold py-1" onClick={() => setMobileMenuOpen(false)}>
                    100FM Initiative
                  </Link>
                  <Link to="/services" className="block text-gray-700 hover:text-modex-secondary font-semibold py-1" onClick={() => setMobileMenuOpen(false)}>
                    Training & Consulting
                  </Link>
                </div>
                <Link to="/competitions" className="text-gray-700 hover:text-modex-secondary font-semibold py-2" onClick={() => setMobileMenuOpen(false)}>
                  Competitions
                </Link>
                <Link to="/community" className="text-gray-700 hover:text-modex-secondary font-semibold py-2" onClick={() => setMobileMenuOpen(false)}>
                  Community
                </Link>
                <Link to="/about" className="text-gray-700 hover:text-modex-secondary font-semibold py-2" onClick={() => setMobileMenuOpen(false)}>
                  About Us
                </Link>
                <Link to="/testimonials" className="text-gray-700 hover:text-modex-secondary font-semibold py-2" onClick={() => setMobileMenuOpen(false)}>
                  Testimonials
                </Link>
                <Link to="/faq" className="text-gray-700 hover:text-modex-secondary font-semibold py-2" onClick={() => setMobileMenuOpen(false)}>
                  FAQ
                </Link>
                <Link to="/contact" className="text-gray-700 hover:text-modex-secondary font-semibold py-2" onClick={() => setMobileMenuOpen(false)}>
                  Contact
                </Link>
                
                {/* Mobile Auth Section */}
                <div className="border-t border-gray-200 pt-4 mt-2">
                  {user ? (
                    <>
                      <div className="flex items-center space-x-3 mb-3 px-2">
                        <div className="w-10 h-10 bg-modex-secondary text-white rounded-full flex items-center justify-center font-bold">
                          {getInitials(user.full_name)}
                        </div>
                        <div>
                          <p className="font-semibold text-modex-primary">{user.full_name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <Link
                        to="/profile"
                        className="block text-gray-700 hover:text-modex-secondary font-semibold py-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        My Profile
                      </Link>
                      <Link
                        to="/dashboard"
                        className="block text-gray-700 hover:text-modex-secondary font-semibold py-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <button
                        onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                        className="block text-red-600 font-semibold py-2 w-full text-left"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <Link
                        to="/signin"
                        className="block text-center text-modex-secondary border-2 border-modex-secondary px-6 py-2.5 rounded-lg font-bold hover:bg-modex-secondary hover:text-white transition-all"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign In
                      </Link>
                      <Link
                        to="/signup"
                        className="block text-center bg-modex-secondary text-white px-6 py-2.5 rounded-lg font-bold hover:bg-modex-primary transition-all"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Get Started
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-modex-primary text-white py-12" data-testid="footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <h3 className="text-3xl font-black mb-4">
                Mod<span className="text-modex-accent">EX</span>
              </h3>
              <p className="text-white/80 text-sm">
                Building financial modeling excellence across the globe.
              </p>
            </div>

            {/* Programs */}
            <div>
              <h4 className="text-lg font-bold mb-4">Programs</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/fmva" className="text-white/80 hover:text-modex-accent transition-colors">FMVA Arabic</Link></li>
                <li><Link to="/100fm" className="text-white/80 hover:text-modex-accent transition-colors">100FM Initiative</Link></li>
                <li><Link to="/services" className="text-white/80 hover:text-modex-accent transition-colors">Training & Consulting</Link></li>
                <li><Link to="/competitions" className="text-white/80 hover:text-modex-accent transition-colors">Competitions</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-lg font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/about" className="text-white/80 hover:text-modex-accent transition-colors">About Us</Link></li>
                <li><Link to="/testimonials" className="text-white/80 hover:text-modex-accent transition-colors">Testimonials</Link></li>
                <li><Link to="/community" className="text-white/80 hover:text-modex-accent transition-colors">Community</Link></li>
                <li><Link to="/faq" className="text-white/80 hover:text-modex-accent transition-colors">FAQ</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-lg font-bold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li className="text-white/80">Email: Noreply@FinancialModEX.com</li>
                <li className="text-white/80">WhatsApp: +966 50 548 9259</li>
                <li className="flex space-x-4 mt-4">
                  <a href="#" className="text-white/80 hover:text-modex-accent transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                    </svg>
                  </a>
                  <a href="#" className="text-white/80 hover:text-modex-accent transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </a>
                  <a href="#" className="text-white/80 hover:text-modex-accent transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-white/20 pt-8 text-center">
            <p className="text-white/60 text-sm">
              © 2025 ModEX - Financial Modeling Excellence. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Layout;