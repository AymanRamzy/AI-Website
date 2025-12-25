import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Configure axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const response = await axios.get(`${API_URL}/api/cfo/auth/me`, {
            timeout: 5000
          });
          // Include profile_completed in user state
          setUser({
            ...response.data,
            profile_completed: response.data.profile_completed || false
          });
        } catch (error) {
          console.error('Failed to load user:', error);
          logout();
        }
      }
      setLoading(false);
    };
    loadUser();
  }, [token]);

  // Login function - uses backend API for token + profile
  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/cfo/auth/login`, {
        email: email.trim().toLowerCase(),
        password,
      }, {
        timeout: 10000
      });
      const { access_token, user: userData } = response.data;
      setToken(access_token);
      // Include profile_completed from login response
      setUser({
        ...userData,
        profile_completed: userData.profile_completed || false
      });
      localStorage.setItem('token', access_token);
      return { success: true, profile_completed: userData.profile_completed };
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

  // Register function - uses backend API
  // Does NOT auto-login, redirects to check-email page
  const register = async (email, password, full_name, role = 'participant') => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      
      // Use backend API for registration (handles Supabase Auth)
      const response = await axios.post(`${API_URL}/api/cfo/auth/register`, {
        email: normalizedEmail,
        password,
        full_name,
        role
      }, {
        timeout: 15000
      });

      // Registration successful
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

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
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
