import React, { createContext, useState, useEffect, useContext } from 'react';
import AuthService from '../services/AuthService';

// Create context
export const AuthContext = createContext(null);

// Hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');

        if (token) {
          const loggedIn = await AuthService.isAuthenticated();

          if (loggedIn) {
            const userData = await AuthService.getCurrentUser();

            if (userData && userData.id) {
              setCurrentUser(userData);
              setIsLoggedIn(true);
            } else {
              localStorage.removeItem('token');
              setCurrentUser(null);
              setIsLoggedIn(false);
            }
          } else {
            localStorage.removeItem('token');
            setCurrentUser(null);
            setIsLoggedIn(false);
          }
        } else {
          setCurrentUser(null);
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        localStorage.removeItem('token');
        setCurrentUser(null);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      setError(null);
      setIsLoading(true);

      const data = await AuthService.login(email, password);

      // Fetch user data after successful login
      const userData = await AuthService.getCurrentUser();

      setCurrentUser(userData);
      setIsLoggedIn(true);

      return data;
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Login failed. Please try again.';
      setError(errorMessage);
      setIsLoggedIn(false);
      setCurrentUser(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Google login function
  const googleLogin = async credential => {
    try {
      setError(null);
      setIsLoading(true);

      const data = await AuthService.googleLogin(credential);

      // Fetch user data after successful login
      const userData = await AuthService.getCurrentUser();

      setCurrentUser(userData);
      setIsLoggedIn(true);

      return data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Google login failed. Please try again.';
      setError(errorMessage);
      setIsLoggedIn(false);
      setCurrentUser(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Register new user
  const register = async userData => {
    try {
      setError(null);
      setIsLoading(true);

      return await AuthService.register(userData);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    AuthService.logout();
    setCurrentUser(null);
    setIsLoggedIn(false);
    setError(null);
  };

  // Request password reset via email
  const requestPasswordReset = async email => {
    try {
      setError(null);
      setIsLoading(true);

      return await AuthService.requestPasswordReset(email);
    } catch (err) {
      setError(err.response?.data?.detail || 'Password reset request failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password with token and new password
  const resetPassword = async (token, newPassword) => {
    try {
      setError(null);
      setIsLoading(true);

      return await AuthService.resetPassword(token, newPassword);
    } catch (err) {
      setError(err.response?.data?.detail || 'Password reset failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Verify email with token
  const verifyEmail = async token => {
    try {
      setError(null);
      setIsLoading(true);

      return await AuthService.verifyEmail(token);
    } catch (err) {
      setError(err.response?.data?.detail || 'Email verification failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Create value object with all auth functions and state
  const value = {
    currentUser,
    isLoggedIn,
    isLoading,
    error,
    login,
    googleLogin,
    register,
    logout,
    requestPasswordReset,
    resetPassword,
    verifyEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
