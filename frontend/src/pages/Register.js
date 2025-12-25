import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  const { register, user } = useAuth();
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
              disabled={loading}
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
