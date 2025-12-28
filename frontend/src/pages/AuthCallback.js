import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Loader, CheckCircle, AlertCircle } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

/**
 * AuthCallback - MOBILE-SAFE OAuth Handler
 */
function AuthCallback() {
  const { setUserDirectly } = useAuth();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('Verifying your session...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const errorParam = urlParams.get('error');
        
        if (errorParam) {
          throw new Error(errorParam);
        }

        let session = null;

        // PKCE flow: exchange code for session (REQUIRED on mobile)
        if (code) {
          setMessage('Completing authentication...');
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error('Code exchange error:', exchangeError);
            // Don't throw - try getSession as fallback
          } else {
            session = data?.session;
          }
        }

        // If no session from code exchange, try getSession
        if (!session) {
          await new Promise(r => setTimeout(r, 500));
          const { data } = await supabase.auth.getSession();
          session = data?.session;
        }

        if (!session) {
          // Last resort: wait longer and try again
          await new Promise(r => setTimeout(r, 1000));
          const { data } = await supabase.auth.getSession();
          session = data?.session;
        }

        if (!session) {
          throw new Error('No session found. Please try again.');
        }

        // Sync with backend
        setMessage('Completing sign-in...');
        
        const response = await axios.post(
          `${API_URL}/api/cfo/auth/google-callback`,
          {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            user: {
              id: session.user.id,
              email: session.user.email,
              full_name: session.user.user_metadata?.full_name || 
                         session.user.user_metadata?.name ||
                         session.user.email?.split('@')[0],
              avatar_url: session.user.user_metadata?.avatar_url
            }
          },
          { withCredentials: true }
        );

        const { profile_completed, user: userData, access_token: token } = response.data;

        if (token) sessionStorage.setItem('modex_token', token);

        if (userData) {
          setUserDirectly({ ...userData, profile_completed: profile_completed || false });
        }

        setStatus('success');
        setMessage('Success!');

        await new Promise(r => setTimeout(r, 300));
        window.location.href = profile_completed ? '/dashboard' : '/complete-profile';

      } catch (err) {
        console.error('Auth error:', err);
        
        if (err.response?.status === 409) {
          const userData = err.response?.data?.user;
          window.location.href = userData?.profile_completed ? '/dashboard' : '/complete-profile';
          return;
        }
        
        setStatus('error');
        setError(err.message || 'Authentication failed');
      }
    };

    handleAuthCallback();
  }, [setUserDirectly]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-modex-primary via-modex-secondary to-modex-accent flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md w-full">
        <h1 className="text-4xl font-black text-modex-primary mb-2">
          Mod<span className="text-modex-secondary">EX</span>
        </h1>

        {status === 'processing' && (
          <div className="py-8">
            <Loader className="w-16 h-16 text-modex-secondary mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-green-600 font-bold">{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="py-8">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-bold mb-2">Failed</p>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.href = '/signin'}
              className="w-full bg-modex-secondary text-white py-3 rounded-lg font-bold"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthCallback;
