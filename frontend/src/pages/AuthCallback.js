import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import axios from 'axios';
import { Loader, CheckCircle, AlertCircle } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

/**
 * AuthCallback - Handles OAuth and email confirmation redirects from Supabase
 * 
 * FLOW FOR GOOGLE SIGN-IN:
 * 1. User clicks "Continue with Google" on login page
 * 2. Supabase redirects to Google, user authenticates
 * 3. Google redirects back to /auth/callback with tokens
 * 4. This component:
 *    a. Exchanges code/tokens for Supabase session
 *    b. Calls backend /auth/google-callback to create cookie session
 *    c. Redirects to dashboard or profile completion
 * 
 * FLOW FOR EMAIL CONFIRMATION:
 * 1. User clicks confirmation link in email
 * 2. Supabase redirects to /auth/callback
 * 3. This component validates and redirects to login
 */
function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [error, setError] = useState('');
  const [message, setMessage] = useState('Verifying your session...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check URL for auth data
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const urlParams = new URLSearchParams(window.location.search);
        
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const code = urlParams.get('code');
        const errorParam = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        
        // Handle OAuth errors
        if (errorParam) {
          throw new Error(errorDescription || errorParam);
        }
        
        let session = null;
        
        // Method 1: Token-based flow (implicit grant)
        if (accessToken && refreshToken) {
          setMessage('Processing Google authentication...');
          
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (sessionError) throw sessionError;
          session = data?.session;
        }
        // Method 2: Code-based flow (PKCE)
        else if (code) {
          setMessage('Exchanging authorization code...');
          
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) throw exchangeError;
          session = data?.session;
        }
        // Method 3: Check existing session
        else {
          const { data: sessionData } = await supabase.auth.getSession();
          session = sessionData?.session;
        }
        
        if (!session) {
          // No session - might be email confirmation only
          // Check if this was an email confirmation flow
          const type = hashParams.get('type') || urlParams.get('type');
          
          if (type === 'signup' || type === 'email_change' || type === 'recovery') {
            setStatus('success');
            setMessage('Email verified successfully!');
            setTimeout(() => {
              navigate('/signin?confirmed=true', { replace: true });
            }, 1500);
            return;
          }
          
          throw new Error('Could not establish session. Please try signing in again.');
        }
        
        // We have a session - check if this is OAuth (Google) login
        const provider = session.user?.app_metadata?.provider;
        const isOAuth = provider && provider !== 'email';
        
        if (isOAuth) {
          setMessage('Completing Google sign-in...');
          
          // Call backend to create cookie session for OAuth user
          try {
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
              {
                withCredentials: true,
                timeout: 10000
              }
            );
            
            const { profile_completed } = response.data;
            
            setStatus('success');
            setMessage('Sign in successful!');
            
            // Redirect based on profile completion
            setTimeout(() => {
              if (profile_completed) {
                navigate('/dashboard', { replace: true });
              } else {
                navigate('/complete-profile', { replace: true });
              }
            }, 1000);
            
          } catch (backendError) {
            console.error('Backend OAuth sync error:', backendError);
            
            // If backend sync fails, still try to proceed
            // The backend might auto-create the profile
            const errorMsg = backendError.response?.data?.detail || backendError.message;
            
            if (backendError.response?.status === 409) {
              // User already exists - try to redirect anyway
              setStatus('success');
              setMessage('Sign in successful!');
              setTimeout(() => {
                navigate('/dashboard', { replace: true });
              }, 1000);
              return;
            }
            
            throw new Error(`Failed to complete sign-in: ${errorMsg}`);
          }
        } else {
          // Email-based auth (email confirmation)
          setStatus('success');
          setMessage('Email verified successfully!');
          
          setTimeout(() => {
            navigate('/signin?confirmed=true', { replace: true });
          }, 1500);
        }
        
      } catch (err) {
        console.error('Auth callback error:', err);
        setStatus('error');
        setError(err.message || 'Authentication failed. Please try again.');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-modex-primary via-modex-secondary to-modex-accent flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          {/* Logo */}
          <h1 className="text-4xl font-black text-modex-primary mb-2">
            Mod<span className="text-modex-secondary">EX</span>
          </h1>

          {status === 'processing' && (
            <div className="py-8">
              <Loader className="w-16 h-16 text-modex-secondary mx-auto mb-4 animate-spin" />
              <p className="text-gray-600 text-lg">{message}</p>
              <p className="text-gray-500 text-sm mt-2">Please wait...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-green-600 text-lg font-bold mb-2">{message}</p>
              <p className="text-gray-600">Redirecting...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="py-8">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 text-lg font-bold mb-2">Authentication Failed</p>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/signin')}
                  className="w-full bg-modex-secondary text-white px-6 py-3 rounded-lg font-bold hover:bg-modex-primary transition-colors"
                >
                  Go to Sign In
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="w-full border-2 border-modex-secondary text-modex-secondary px-6 py-3 rounded-lg font-bold hover:bg-modex-light transition-colors"
                >
                  Create New Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthCallback;
