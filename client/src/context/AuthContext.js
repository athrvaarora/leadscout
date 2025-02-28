import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

// Create Auth Context
export const AuthContext = createContext();

// API URL configuration
const API_URL = process.env.REACT_APP_API_URL || '';

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  // Set axios default base URL - ensures all requests go to the right server
  axios.defaults.baseURL = API_URL;

  // Set auth token in axios headers
  const setAuthToken = useCallback((token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, []);

  // Load user data if token exists
  const loadUser = useCallback(async () => {
    if (!token) {
      setInitializing(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Set auth token header
      setAuthToken(token);
      
      // Make request to get user data
      const res = await axios.get('/api/auth/me');
      
      if (res.data.success) {
        setUser(res.data.data);
        setIsAuthenticated(true);
      } else {
        // Handle invalid token
        localStorage.removeItem('token');
        setToken(null);
        setAuthToken(null);
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (err) {
      // On error, clear everything
      console.error('Error loading user:', err.response?.data?.message || err.message);
      localStorage.removeItem('token');
      setToken(null);
      setAuthToken(null);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
      setInitializing(false);
    }
  }, [token, setAuthToken]);

  // Run once when component mounts
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Register user
  const register = async (formData) => {
    setLoading(true);
    try {
      // Make API request
      console.log('Sending registration request with data:', formData);
      
      const res = await axios.post('/api/auth/register', formData);
      console.log('Registration response:', res.data);
      
      if (res.data.success) {
        // Set token in localStorage and state
        const { token, user } = res.data;
        localStorage.setItem('token', token);
        setToken(token);
        setAuthToken(token);
        setUser(user);
        setIsAuthenticated(true);
        
        toast.success('Registration successful! Welcome aboard.');
        return { success: true };
      } else {
        // Handle error response
        toast.error(res.data.message || 'Registration failed. Please try again.');
        return { 
          success: false, 
          error: res.data.message || 'Registration failed' 
        };
      }
    } catch (err) {
      // Handle network or server errors
      console.error('Registration error:', err);
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (formData) => {
    setLoading(true);
    try {
      // Log the request for debugging
      console.log('Sending login request with data:', {
        email: formData.email,
        password: '********' // don't log actual password
      });
      
      // Enhanced error handling for network issues
      try {
        const res = await axios.post('/api/auth/login', formData);
        console.log('Login response:', res.data);
        
        if (res.data.success) {
          // Set token in localStorage and state
          const { token, user } = res.data;
          localStorage.setItem('token', token);
          setToken(token);
          setAuthToken(token);
          setUser(user);
          setIsAuthenticated(true);
          
          toast.success('Login successful! Welcome back.');
          return { success: true };
        } else {
          // Handle error response
          toast.error(res.data.message || 'Login failed. Please check your credentials.');
          return { 
            success: false, 
            error: res.data.message || 'Login failed' 
          };
        }
      } catch (networkErr) {
        // More specific network error handling
        console.error('Network error during login:', networkErr);
        if (networkErr.code === 'ERR_NETWORK') {
          toast.error('Cannot connect to server. Please check your internet connection.');
          return { success: false, error: 'Network connection error' };
        } else {
          const errorMessage = networkErr.response?.data?.message || 'Login failed. Please check your credentials.';
          toast.error(errorMessage);
          return { success: false, error: errorMessage };
        }
      }
    } catch (err) {
      // Handle other errors
      console.error('Login error:', err);
      const errorMessage = 'An unexpected error occurred. Please try again.';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = () => {
    // Remove token from localStorage
    localStorage.removeItem('token');
    setToken(null);
    setAuthToken(null);
    setUser(null);
    setIsAuthenticated(false);
    
    toast.info('You have been logged out.');
  };

  // Update user profile
  const updateProfile = async (formData) => {
    setLoading(true);
    try {
      const res = await axios.put('/api/auth/updatedetails', formData);
      
      if (res.data.success) {
        setUser(res.data.data);
        toast.success('Profile updated successfully!');
        return { success: true };
      } else {
        toast.error(res.data.message || 'Profile update failed.');
        return { 
          success: false, 
          error: res.data.message || 'Update failed' 
        };
      }
    } catch (err) {
      console.error('Profile update error:', err);
      const errorMessage = err.response?.data?.message || 'Profile update failed.';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Create demo/guest login with fake credentials
  const loginAsGuest = () => {
    const guestUser = {
      id: 'guest-user-id',
      name: 'Guest User',
      email: 'guest@example.com',
      role: 'guest'
    };
    
    setUser(guestUser);
    setIsAuthenticated(false); // Still not authenticated, but has user data
    toast.info('You are now browsing as a guest. Some features will be limited.');
    
    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        initializing,
        register,
        login,
        logout,
        updateProfile,
        loginAsGuest
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};