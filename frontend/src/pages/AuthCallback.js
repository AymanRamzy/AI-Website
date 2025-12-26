import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Loader, CheckCircle, AlertCircle } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

/**
 * AuthCallback - Handles OAuth and email confirmation redirects
 * 
 * FIX: Uses setUserDirectly to immediately update auth state after
 * backend cookie is set, preventing double-login issue.
 */
function AuthCallback() {
  const navigate = useNavigate();
  const { setUserDirectly } = useAuth();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('Verifying your session...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const urlParams = new URLSearchParams(window.location.search);
        
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const code = urlParams.get('code');
        const errorParam = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        
        if (errorParam) {
          throw new Error(errorDescription || errorParam);
        }
        
        let session = null;
        
        // Token-based flow (implicit grant - hash fragment)
        if (accessToken && refreshToken) {
          setMessage('Processing Google authentication...');
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          if (sessionError) throw sessionError;
          session = data?.session;
        }
        // Code-based flow - try exchange, fallback to getSession if PKCE fails
        else if (code) {
          setMessage('Exchanging authorization code...');
          try {
            const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeError) {
              // PKCE verifier missing - fallback to getSession
              console.warn('Code exchange failed, trying getSession:', exchangeError.message);
              const { data: sessionData } = await supabase.auth.getSession();
              session = sessionData?.session;
            } else {
              session = data?.session;
            }
          } catch (e) {
            // Fallback to getSession on any error
            console.warn('Code exchange exception, trying getSession:', e.message);
            const { data: sessionData } = await supabase.auth.getSession();
            session = sessionData?.session;
          }
        }
        // No code or tokens - check existing session
        else {
          // Wait a moment for session to be detected on mobile
          await new Promise(resolve => setTimeout(resolve, 500));
          const { data: sessionData } = await supabase.auth.getSession();
          session = sessionData?.session;
          
          // If no session, retry once after delay
          if (!session) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const { data: retryData } = await supabase.auth.getSession();
            session = retryData?.session;
          }
        }
        
        if (!session) {
          const type = hashParams.get('type') || urlParams.get('type');
          if (type === 'signup' || type === 'email_change' || type === 'recovery') {
            setStatus('success');
            setMessage('Email verified successfully!');
            setTimeout(() => navigate('/signin?confirmed=true', { replace: true }), 1500);
            return;
          }
          throw new Error('Could not establish session. Please try signing in again.');
        }
        
        const provider = session.user?.app_metadata?.provider;
        const isOAuth = provider && provider !== 'email';
        
        if (isOAuth) {
          setMessage('Completing Google sign-in...');
          
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
          
          const { profile_completed, user: userData } = response.data;
          
          // CRITICAL: Set user directly in AuthContext to prevent re-fetch
          if (userData) {
            setUserDirectly({
              ...userData,
              profile_completed: profile_completed || false
            });
          }
          
          setStatus('success');
          setMessage('Sign in successful!');
          
          // MOBILE FIX: Small delay to ensure cookie is persisted before navigation
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Navigate immediately (user state already set)
          if (profile_completed) {
            navigate('/dashboard', { replace: true });
          } else {
            navigate('/complete-profile', { replace: true });
          }
          
        } else {
          setStatus('success');
          setMessage('Email verified successfully!');
          setTimeout(() => navigate('/signin?confirmed=true', { replace: true }), 1500);
        }
        
      } catch (err) {
        console.error('Auth callback error:', err);
        
        // Handle 409 (user exists) - user already exists, redirect to appropriate page
        if (err.response?.status === 409) {
          setStatus('success');
          setMessage('Sign in successful!');
          
          // Check profile_completed from error response if available
          const userData = err.response?.data?.user;
          if (userData && !userData.profile_completed) {
            navigate('/complete-profile', { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
          return;
        }
        
        setStatus('error');
        setError(err.message || 'Authentication failed. Please try again.');
      }
    };

    handleAuthCallback();
  }, [navigate, setUserDirectly]);

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
                onClick={() => navigate('/signin')}
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
