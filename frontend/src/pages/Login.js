import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';

function Login() {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(location.state?.message || '');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect appropriately
  useEffect(() => {
    if (user) {
      if (user.profile_completed) {
        navigate('/dashboard');
      } else {
        navigate('/complete-profile');
      }
    }
  }, [user, navigate]);

  // Clear location state after reading
  useEffect(() => {
    if (location.state) {
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      // Redirect based on profile completion status
      if (result.profile_completed) {
        // Check if there was a redirect target
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from);
      } else {
        navigate('/complete-profile');
      }
    } else {
      setError(result.error);
    }
    setLoading(false);
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
            <p className="text-gray-600">Sign in to your account</p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 bg-green-50 border-2 border-green-200 rounded-lg p-3 flex items-start">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-green-800 text-sm">{successMessage}</p>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="mb-4 bg-red-50 border-2 border-red-200 rounded-lg p-3 flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-modex-primary mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-modex-secondary focus:outline-none transition-colors"
                  placeholder="••••••••"
                  data-testid="password-input"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-modex-secondary text-white py-3 rounded-lg font-bold hover:bg-modex-primary transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
              data-testid="signin-btn"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don&apos;t have an account?{' '}
              <Link to="/signup" className="text-modex-secondary font-bold hover:text-modex-primary transition-colors">
                Sign up here
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

export default Login;
