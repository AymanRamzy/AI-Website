import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { CheckCircle, Loader, AlertCircle } from 'lucide-react';

function AuthConfirm() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('confirming'); // confirming, success, error
  const [error, setError] = useState('');

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        // Exchange the code from URL for a session
        const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        
        if (error) {
          console.error('Confirmation error:', error);
          setStatus('error');
          setError(error.message || 'Failed to confirm email');
          return;
        }

        if (data?.session) {
          setStatus('success');
          // Redirect to signin after short delay (user needs to complete profile)
          setTimeout(() => {
            navigate('/signin', { 
              state: { message: 'Email confirmed! Please sign in to complete your profile.' } 
            });
          }, 2000);
        } else {
          setStatus('error');
          setError('Could not verify confirmation link');
        }
      } catch (err) {
        console.error('Confirmation error:', err);
        setStatus('error');
        setError('An unexpected error occurred');
      }
    };

    confirmEmail();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-modex-primary via-modex-secondary to-modex-accent flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          {/* Logo */}
          <h1 className="text-4xl font-black text-modex-primary mb-2">
            Mod<span className="text-modex-secondary">EX</span>
          </h1>
          <h2 className="text-xl font-bold text-modex-primary mb-8">Email Confirmation</h2>

          {status === 'confirming' && (
            <div className="py-8">
              <Loader className="w-16 h-16 text-modex-secondary mx-auto mb-4 animate-spin" />
              <p className="text-gray-600 text-lg">Confirming your email...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-green-600 text-lg font-bold mb-2">Email Confirmed!</p>
              <p className="text-gray-600">Redirecting to sign in...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="py-8">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 text-lg font-bold mb-2">Confirmation Failed</p>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => navigate('/signin')}
                className="bg-modex-secondary text-white px-6 py-3 rounded-lg font-bold hover:bg-modex-primary transition-colors"
              >
                Go to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthConfirm;
