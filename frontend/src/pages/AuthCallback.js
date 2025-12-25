import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import axios from 'axios';
import { Loader, CheckCircle, AlertCircle } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

/**
 * AuthCallback - Handles email confirmation redirect from Supabase
 * BOARD-APPROVED: Auto-authenticate user and redirect to profile completion
 * 
 * Flow:
 * 1. User clicks confirmation link in email
 * 2. Supabase redirects to /auth/callback with tokens in URL hash
 * 3. This component extracts tokens, establishes session
 * 4. User is automatically logged in and redirected to profile completion
 */
function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [error, setError] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Method 1: Check if tokens are in URL hash (Supabase default)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        // Method 2: Check for code-based exchange (PKCE flow)
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (accessToken && refreshToken) {
          // Token-based flow: Set session directly
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (sessionError) {
            throw sessionError;
          }
          
          if (data?.session) {
            // Store token for API calls
            localStorage.setItem('token', data.session.access_token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${data.session.access_token}`;
            
            setStatus('success');
            
            // Redirect to profile completion
            setTimeout(() => {
              navigate('/complete-profile', { replace: true });
            }, 1500);
            return;
          }
        } else if (code) {
          // Code-based flow: Exchange code for session
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            throw exchangeError;
          }
          
          if (data?.session) {
            // Store token for API calls
            localStorage.setItem('token', data.session.access_token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${data.session.access_token}`;
            
            setStatus('success');
            
            // Redirect to profile completion
            setTimeout(() => {
              navigate('/complete-profile', { replace: true });
            }, 1500);
            return;
          }
        }
        
        // If we reach here, try to get existing session
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData?.session) {
          localStorage.setItem('token', sessionData.session.access_token);
          axios.defaults.headers.common['Authorization'] = `Bearer ${sessionData.session.access_token}`;
          
          setStatus('success');
          setTimeout(() => {
            navigate('/complete-profile', { replace: true });
          }, 1500);
          return;
        }
        
        // No valid session found
        setStatus('error');
        setError('Could not verify your email. The link may have expired.');
        
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
              <p className="text-gray-600 text-lg">Signing you in...</p>
              <p className="text-gray-500 text-sm mt-2">Please wait while we verify your email</p>
            </div>
          )}

          {status === 'success' && (
            <div className="py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-green-600 text-lg font-bold mb-2">Email Verified!</p>
              <p className="text-gray-600">Redirecting to complete your profile...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="py-8">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 text-lg font-bold mb-2">Verification Failed</p>
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
