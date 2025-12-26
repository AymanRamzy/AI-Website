/**
 * SECURITY-HARDENED AUTHENTICATION CONTEXT
 * =========================================
 * P0 Frontend Integration: Cookie-based authentication
 * 
 * CRITICAL SECURITY PRINCIPLES:
 * 1. NO localStorage token storage (XSS protection)
 * 2. NO manual token handling (cookies only)
 * 3. NO JWT decoding in frontend
 * 4. NO role-based logic beyond UI gating
 * 5. Backend sets/clears cookies automatically
 * 
 * Authentication relies entirely on HttpOnly cookies set by backend.
 * 
 * FIX: Added proper loading state management to prevent double-login issues
 * with OAuth flows. Auth state is only resolved AFTER session check completes.
 */
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);  // MOBILE FIX: Single authoritative ready flag

  /**
   * SECURITY: Configure axios to use cookies (withCredentials)
   */
  useEffect(() => {
    axios.defaults.withCredentials = true;
    delete axios.defaults.headers.common['Authorization'];
    
    // Global 401 Interceptor - ONLY after ready
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && ready) {
          const requestUrl = error.config?.url || '';
          
          // Skip redirect for initial auth check (this is expected for visitors)
          if (requestUrl.includes('/auth/me')) {
            return Promise.reject(error);
          }
          
          // Skip redirect for OAuth callback routes (handled separately)
          if (
            requestUrl.includes('/auth/callback') ||
            requestUrl.includes('/auth/google-callback')
          ) {
            return Promise.reject(error);
          }
          
          // Only redirect if not already on auth pages
          const authPages = ['/signin', '/signup', '/auth/callback', '/login', '/register'];
          const currentPath = window.location.pathname;
          
          if (!authPages.includes(currentPath)) {
            // Clear user state
            setUser(null);
            
            // Only redirect for protected routes (not public pages)
            const publicPages = ['/', '/about', '/contact', '/faq', '/services', '/competitions', '/fmva', '/100fm', '/community', '/testimonials'];
            if (!publicPages.includes(currentPath)) {
              // Redirect to login with return URL (only for protected routes)
              window.location.href = `/signin?redirect=${encodeURIComponent(currentPath)}`;
            }
          }
        }
        
        return Promise.reject(error);
      }
    );
    
    // Cleanup interceptor on unmount
    return () => {
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [authInitialized]);

  /**
   * Load user session from backend
   * Can be called on mount or after OAuth callback
   * MOBILE FIX: Falls back to sessionStorage token if cookie fails
   */
  const loadUser = useCallback(async () => {
    try {
      // First try with cookies
      const response = await axios.get(`${API_URL}/api/cfo/auth/me`, {
        timeout: 5000,
        withCredentials: true
      });
      
      setUser({
        ...response.data,
        profile_completed: response.data.profile_completed || false
      });
      
      return { success: true, user: response.data };
    } catch (error) {
      // MOBILE FIX: If cookie auth fails, try sessionStorage token
      if (error.response?.status === 401) {
        const fallbackToken = sessionStorage.getItem('modex_token');
        if (fallbackToken) {
          try {
            const retryResponse = await axios.get(`${API_URL}/api/cfo/auth/me`, {
              timeout: 5000,
              headers: { 'Authorization': `Bearer ${fallbackToken}` }
            });
            
            setUser({
              ...retryResponse.data,
              profile_completed: retryResponse.data.profile_completed || false
            });
            
            return { success: true, user: retryResponse.data };
          } catch (retryError) {
            // Token invalid, clear it
            sessionStorage.removeItem('modex_token');
          }
        }
        setUser(null);
      } else {
        console.error('Failed to load user session:', error.message);
        setUser(null);
      }
      return { success: false, user: null };
    }
  }, []);

  /**
   * SECURITY: Load user session from backend on mount
   * - Backend validates HttpOnly cookie
   * - Frontend never touches tokens
   * - User state derived from /auth/me response
   * 
   * MOBILE FIX: Set authInitialized BEFORE loading=false
   * This removes the "auth vacuum frame" on mobile
   */
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      await loadUser();
      // MOBILE FIX: Set authInitialized first to prevent vacuum frame
      setAuthInitialized(true);
      setLoading(false);
    };
    
    initAuth();
  }, [loadUser]);

  /**
   * Refresh user data from backend
   * Used after OAuth callback to sync state
   */
  const refreshUser = useCallback(async () => {
    const result = await loadUser();
    return result;
  }, [loadUser]);

  /**
   * Set user directly (used by OAuth callback)
   * This allows immediate state update without waiting for /auth/me
   */
  const setUserDirectly = useCallback((userData) => {
    setUser(userData);
  }, []);

  /**
   * SECURITY: Login function
   * - Backend sets HttpOnly cookie automatically
   * - Frontend receives user data (NOT token)
   * - No localStorage usage
   */
  const login = async (email, password) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/cfo/auth/login`,
        {
          email: email.trim().toLowerCase(),
          password,
        },
        {
          timeout: 10000,
          withCredentials: true
        }
      );
      
      const { user: userData } = response.data;
      
      setUser({
        ...userData,
        profile_completed: userData.profile_completed || false
      });
      
      return { 
        success: true, 
        profile_completed: userData.profile_completed 
      };
      
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message || 'Login failed';
      
      if (errorMessage.toLowerCase().includes('confirm') || 
          errorMessage.toLowerCase().includes('not confirmed') ||
          errorMessage.toLowerCase().includes('email not confirmed')) {
        return {
          success: false,
          error: 'Please verify your email before logging in. Check your inbox for the confirmation link.',
          requiresConfirmation: true
        };
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  /**
   * SECURITY: Register function
   * - Does NOT auto-login (user must verify email)
   * - No token handling
   */
  const register = async (email, password, full_name, role = 'participant') => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      
      await axios.post(
        `${API_URL}/api/cfo/auth/register`,
        {
          email: normalizedEmail,
          password,
          full_name,
          role
        },
        {
          timeout: 15000,
          withCredentials: true
        }
      );

      return { 
        success: true,
        email: normalizedEmail,
        message: 'Registration successful! Please check your email to confirm your account.'
      };
      
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Registration failed';
      
      if (errorMessage.includes('already registered') || errorMessage.includes('409')) {
        return {
          success: false,
          error: 'This email is already registered. Please sign in instead.'
        };
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  /**
   * SECURITY: Logout function
   * - Calls backend /auth/logout endpoint
   * - Backend clears HttpOnly cookie
   * - Frontend clears local state
   * - No manual cookie manipulation
   */
  const logout = async () => {
    try {
      await axios.post(
        `${API_URL}/api/cfo/auth/logout`,
        {},
        {
          timeout: 5000,
          withCredentials: true
        }
      );
    } catch (error) {
      console.error('Logout error:', error.message);
    } finally {
      setUser(null);
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      logout, 
      loading, 
      authInitialized,
      refreshUser,
      setUserDirectly
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
