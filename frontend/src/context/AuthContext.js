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
 */
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * SECURITY: Configure axios to use cookies (withCredentials)
   * This allows HttpOnly cookies to be sent automatically with requests
   */
  useEffect(() => {
    // Enable credentials (cookies) for all requests to the backend
    axios.defaults.withCredentials = true;
    
    // Remove any Authorization header (we use cookies now)
    delete axios.defaults.headers.common['Authorization'];
  }, []);

  /**
   * SECURITY: Load user session from backend on mount
   * - Backend validates HttpOnly cookie
   * - Frontend never touches tokens
   * - User state derived from /auth/me response
   */
  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/cfo/auth/me`, {
          timeout: 5000,
          withCredentials: true  // Send HttpOnly cookie
        });
        
        // Set user from backend response (source of truth)
        setUser({
          ...response.data,
          profile_completed: response.data.profile_completed || false
        });
      } catch (error) {
        // No valid session - user is not authenticated
        // This is normal on first visit or after logout
        if (error.response?.status === 401) {
          setUser(null);
        } else {
          console.error('Failed to load user session:', error.message);
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
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
          withCredentials: true  // Allow backend to set cookie
        }
      );
      
      const { user: userData } = response.data;
      
      // Set user state from backend response
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
      
      // Check if error is about email confirmation
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
      
      const response = await axios.post(
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
      
      // Handle specific errors
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
      // Call backend to clear cookie
      await axios.post(
        `${API_URL}/api/cfo/auth/logout`,
        {},
        {
          timeout: 5000,
          withCredentials: true  // Send cookie to be cleared
        }
      );
    } catch (error) {
      // Log error but continue with local cleanup
      console.error('Logout error:', error.message);
    } finally {
      // Always clear local state
      setUser(null);
      
      // Remove any lingering Authorization headers
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
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
