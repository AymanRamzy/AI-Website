import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Loader, CheckCircle, AlertCircle } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

/**
 * AuthCallback - MOBILE-SAFE OAuth Handler
 * 
 * IMPORTANT: This component does NOT manually parse tokens or call setSession().
 * Supabase handles OAuth automatically via PKCE on mobile.
 * We ONLY call getSession() and sync with backend.
 */
function AuthCallback() {
  const { setUserDirectly } = useAuth();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('Verifying your session...');

  useEffect(() => {
    let mounted = true;

    const handleAuthCallback = async () => {
      try {
        // Check for OAuth error in URL
        const urlParams = new URLSearchParams(window.location.search);
        const errorParam = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        
        if (errorParam) {
          throw new Error(errorDescription || errorParam);
        }

        // MOBILE FIX: Wait for Supabase to complete OAuth automatically
        // On mobile, PKCE flow completes before this component mounts
        await new Promise(resolve => setTimeout(resolve, 400));

        // ONLY ask Supabase: "Do you have a session?"
        // Do NOT parse tokens, do NOT call setSession(), do NOT call exchangeCodeForSession()
        const { data: sessionData } = await supabase.auth.getSession();
        let session = sessionData?.session;

        // If no session on first try, wait and retry once (mobile cookie delay)
        if (!session) {
          await new Promise(resolve => setTimeout(resolve, 600));
          const { data: retryData } = await supabase.auth.getSession();
          session = retryData?.session;
        }

        if (!mounted) return;

        // No session found
        if (!session) {
          // Check if this is an email verification flow
          const type = urlParams.get('type');
          if (type === 'signup' || type === 'email_change' || type === 'recovery') {
            setStatus('success');
            setMessage('Email verified successfully!');
            setTimeout(() => {
              window.location.href = '/signin?confirmed=true';
            }, 1500);
            return;
          }
          throw new Error('Could not establish session. Please try signing in again.');
        }

        // Determine if this is OAuth (Google) or email
        const provider = session.user?.app_metadata?.provider;
        const isOAuth = provider && provider !== 'email';

        if (isOAuth) {
          if (!mounted) return;
          setMessage('Completing Google sign-in...');

          // Call backend to create/sync user profile and set session cookie
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
            { withCredentials: true, timeout: 10000 }
          );

          if (!mounted) return;

          const { profile_completed, user: userData, access_token: backendToken } = response.data;

          // Store token in sessionStorage as fallback for mobile (third-party cookie blocking)
          if (backendToken) {
            sessionStorage.setItem('modex_token', backendToken);
          }

          // Set user directly in AuthContext (no re-fetch needed)
          if (userData) {
            setUserDirectly({
              ...userData,
              profile_completed: profile_completed || false
            });
          }

          setStatus('success');
          setMessage('Sign in successful!');

          // MOBILE FIX: Delay then FULL PAGE LOAD (not SPA navigation)
          await new Promise(resolve => setTimeout(resolve, 500));
          
          if (profile_completed) {
            window.location.href = '/dashboard';
          } else {
            window.location.href = '/complete-profile';
          }

        } else {
          // Email verification flow
          setStatus('success');
          setMessage('Email verified successfully!');
          setTimeout(() => {
            window.location.href = '/signin?confirmed=true';
          }, 1500);
        }

      } catch (err) {
        console.error('Auth callback error:', err);

        if (!mounted) return;

        // Handle 409 (user already exists) - still a success case
        if (err.response?.status === 409) {
          setStatus('success');
          setMessage('Sign in successful!');
          
          await new Promise(resolve => setTimeout(resolve, 400));
          const userData = err.response?.data?.user;
          
          if (userData && !userData.profile_completed) {
            window.location.href = '/complete-profile';
          } else {
            window.location.href = '/dashboard';
          }
          return;
        }

        setStatus('error');
        setError(err.message || 'Authentication failed. Please try again.');
      }
    };

    handleAuthCallback();

    return () => { mounted = false; };
  }, [setUserDirectly]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-modex-primary via-modex-secondary to-modex-accent flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <h1 className="text-4xl font-black text-modex-primary mb-2">
            Mod<span className="text-modex-secondary">EX</span>
          </h1>

          {status === 'processing' && (
            <div className="py-8">
              <Loader className="w-16 h-16 text-modex-secondary mx-auto mb-4 animate-spin" />
              <p className="text-gray-600 text-lg">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-green-600 text-lg font-bold">{message}</p>
            </div>
          )}

          {status === 'error' && (
            <div className="py-8">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 text-lg font-bold mb-2">Authentication Failed</p>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => window.location.href = '/signin'}
                className="w-full bg-modex-secondary text-white px-6 py-3 rounded-lg font-bold hover:bg-modex-primary transition-colors"
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

export default AuthCallback;
