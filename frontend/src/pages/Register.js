import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { UserPlus, Mail, Lock, User, AlertCircle } from 'lucide-react';

function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { register, user, ready } = useAuth();
  const navigate = useNavigate();

  // MOBILE FIX: Only redirect AFTER ready === true
  useEffect(() => {
    if (!ready) return;
    
    if (user) {
      if (user.profile_completed) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/complete-profile', { replace: true });
      }
    }
  }, [user, ready, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const result = await register(
      formData.email,
      formData.password,
      formData.full_name
    );

    if (result.success) {
      // Redirect to check-email page
      navigate('/check-email');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  /**
   * GOOGLE SIGN-UP
   * Uses Supabase OAuth - redirects to Google, then back to /auth/callback
   */
  const handleGoogleSignUp = async () => {
    setError('');
    setGoogleLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // MOBILE FIX: Use current origin to match domain exactly
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        console.error('Google sign-up error:', error);
        setError(error.message || 'Failed to initiate Google sign-up');
        setGoogleLoading(false);
      }
      // If successful, user will be redirected to Google
    } catch (err) {
      console.error('Google sign-up exception:', err);
      setError('Failed to connect to Google. Please try again.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-modex-primary via-modex-secondary to-modex-accent flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo - Platform Level */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-modex-primary mb-2">
              Mod<span className="text-modex-secondary">EX</span>
            </h1>
            <p className="text-gray-600">Create your account</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-4 bg-red-50 border-2 border-red-200 rounded-lg p-3 flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Google Sign-Up Button */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={googleLoading || loading}
            className="w-full mb-6 bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700"></div>
            ) : (
              <>
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">or sign up with email</span>
            </div>
          </div>

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="full_name" className="block text-sm font-bold text-modex-primary mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-modex-secondary focus:outline-none transition-colors"
                  placeholder="John Doe"
                  data-testid="fullname-input"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-bold text-modex-primary mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-modex-secondary focus:outline-none transition-colors"
                  placeholder="your@email.com"
                  data-testid="email-input"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-modex-primary mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-modex-secondary focus:outline-none transition-colors"
                  placeholder="••••••••"
                  data-testid="password-input"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-bold text-modex-primary mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-modex-secondary focus:outline-none transition-colors"
                  placeholder="••••••••"
                  data-testid="confirm-password-input"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full bg-modex-accent text-white py-3 rounded-lg font-bold hover:bg-modex-primary transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center mt-6"
              data-testid="signup-btn"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <UserPlus className="w-5 h-5 mr-2" />
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/signin" className="text-modex-secondary font-bold hover:text-modex-primary transition-colors">
                Sign in here
              </Link>
            </p>
          </div>

          {/* Back to Home */}
          <div className="mt-4 text-center">
            <Link to="/" className="text-gray-500 text-sm hover:text-modex-primary transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
