import api from './api';

// Use the shared API instance instead of creating a separate one
// The shared api instance already has the correct base URL configuration

const AuthService = {
  // Validate token format and expiration
  validateToken(token) {
    try {
      if (!token) return false;

      // Basic JWT format check (3 parts separated by dots)
      const parts = token.split('.');
      if (parts.length !== 3) return false;

      // Try to decode the payload
      const payload = JSON.parse(atob(parts[1]));

      // Check if token has expired
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  },

  // Register new user
  async register(userData) {
    try {
      console.log('AuthService.register called with:', userData.email);

      // Validate required fields
      if (!userData.email || !userData.password || !userData.firstName || !userData.lastName) {
        throw new Error('All fields are required');
      }

      const response = await api.post('/api/auth/register', userData);

      // Check for either format of token (token or access_token)
      const token = response.data.token || response.data.access_token;

      if (!token) {
        console.error('Registration response missing token:', response.data);
        throw new Error('Invalid registration response: No token received');
      }

      // Validate token before storing
      if (!this.validateToken(token)) {
        console.error('Received invalid token from registration');
        throw new Error('Invalid token received from server');
      }

      // Store token securely
      localStorage.setItem('access_token', token);
      localStorage.setItem('token', token); // For backward compatibility

      // Store basic user information
      const basicUserData = {
        id: response.data.id || response.data.userId || response.data._id || null,
        email: userData.email,
        token: token,
        firstName: userData.firstName,
        lastName: userData.lastName,
        isAdmin: response.data.isAdmin || false,
        isVerified: response.data.isVerified || false,
        authProvider: 'local',
      };

      localStorage.setItem('user', JSON.stringify(basicUserData));

      console.log('Registration successful for user:', userData.email);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);

      // Handle specific error cases
      if (error.response?.status === 400) {
        const errorMessage = error.response.data?.message || 'Invalid registration data';
        throw new Error(errorMessage);
      }

      if (error.response?.status === 409) {
        throw new Error('User already exists with this email address');
      }

      if (error.response?.status === 429) {
        throw new Error('Too many registration attempts. Please try again later.');
      }

      if (error.response?.status === 500) {
        throw new Error('Server error. Please try again later.');
      }

      // Network or other errors
      if (!error.response) {
        throw new Error('Network error. Please check your connection and try again.');
      }

      // Generic error
      throw new Error(error.response?.data?.message || 'Registration failed. Please try again.');
    }
  },

  // Login with email & password
  async login(email, password) {
    try {
      console.log('AuthService.login called with:', { email });

      // Validate input
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Sanitize email
      const sanitizedEmail = email.toLowerCase().trim();

      const response = await api.post('/api/auth/login', {
        email: sanitizedEmail,
        password,
      });

      // Check for either format of token (token or access_token)
      const token = response.data.token || response.data.access_token;

      if (!token) {
        console.error('Login response missing token:', response.data);
        throw new Error('Invalid login response: No token received');
      }

      // Validate token before storing
      if (!this.validateToken(token)) {
        console.error('Received invalid token from server');
        throw new Error('Invalid token received from server');
      }

      // Store token securely
      localStorage.setItem('access_token', token);
      localStorage.setItem('token', token); // For backward compatibility

      // Store basic user information
      const basicUserData = {
        id: response.data.id || response.data.userId || response.data._id || null,
        email: sanitizedEmail,
        token: token,
        firstName: response.data.firstName || response.data.user?.firstName || '',
        lastName: response.data.lastName || response.data.user?.lastName || '',
        isAdmin: response.data.isAdmin || false,
        isVerified: response.data.isVerified || false,
        authProvider: response.data.authProvider || 'local',
      };

      localStorage.setItem('user', JSON.stringify(basicUserData));

      // Fetch additional user data immediately after login
      try {
        console.log('Fetching complete user profile data after login');
        const userProfileResponse = await api.get('/api/auth/profile');
        const userProfileData = userProfileResponse.data;

        // Store the complete user profile data
        localStorage.setItem('user_data', JSON.stringify(userProfileData));
        console.log('Stored complete user profile data');

        // Update the basic user object with more information if available
        const updatedBasicUserData = {
          ...basicUserData,
          firstName: userProfileData.firstName || response.data.firstName,
          lastName: userProfileData.lastName || response.data.lastName,
          id: userProfileData.id || userProfileData._id || basicUserData.id,
          isAdmin: userProfileData.isAdmin || basicUserData.isAdmin,
          isVerified: userProfileData.isVerified || basicUserData.isVerified,
          authProvider: userProfileData.authProvider || basicUserData.authProvider,
        };

        localStorage.setItem('user', JSON.stringify(updatedBasicUserData));
      } catch (profileError) {
        console.warn('Failed to fetch complete user profile:', profileError);
        // Continue anyway - we at least have the token and basic info
      }

      console.log('Login successful for user:', sanitizedEmail);
      return response.data;
    } catch (error) {
      console.error('Login error:', error);

      // Handle specific error cases
      if (error.response?.status === 401) {
        const errorMessage = error.response.data?.message || 'Invalid credentials';
        throw new Error(errorMessage);
      }

      if (error.response?.status === 429) {
        throw new Error('Too many login attempts. Please try again later.');
      }

      if (error.response?.status === 500) {
        throw new Error('Server error. Please try again later.');
      }

      // Network or other errors
      if (!error.response) {
        throw new Error('Network error. Please check your connection and try again.');
      }

      // Generic error
      throw new Error(error.response?.data?.message || 'Login failed. Please try again.');
    }
  },

  // Google OAuth login
  async googleLogin(credential) {
    try {
      console.log('AuthService.googleLogin called');

      if (!credential) {
        throw new Error('Google credential is required');
      }

      const response = await api.post('/api/auth/google/verify', {
        credential: credential,
      });

      // Check for either format of token (token or access_token)
      const token = response.data.token || response.data.access_token;

      if (!token) {
        console.error('Google login response missing token:', response.data);
        throw new Error('Invalid Google login response: No token received');
      }

      // Validate token before storing
      if (!this.validateToken(token)) {
        console.error('Received invalid token from Google login');
        throw new Error('Invalid token received from server');
      }

      // Store token securely
      localStorage.setItem('access_token', token);
      localStorage.setItem('token', token); // For backward compatibility

      // Store basic user information
      const basicUserData = {
        id: response.data.id || response.data.userId || response.data._id || null,
        email: response.data.email,
        token: token,
        firstName: response.data.firstName || response.data.user?.firstName || '',
        lastName: response.data.lastName || response.data.user?.lastName || '',
        isAdmin: response.data.isAdmin || false,
        isVerified: response.data.isVerified || true, // Google users are auto-verified
        authProvider: 'google',
      };

      localStorage.setItem('user', JSON.stringify(basicUserData));

      // Fetch additional user data immediately after login
      try {
        console.log('Fetching complete user profile data after Google login');
        const userProfileResponse = await api.get('/api/auth/profile');
        const userProfileData = userProfileResponse.data;

        // Store the complete user profile data
        localStorage.setItem('user_data', JSON.stringify(userProfileData));
        console.log('Stored complete user profile data');

        // Update the basic user object with more information if available
        const updatedBasicUserData = {
          ...basicUserData,
          firstName: userProfileData.firstName || response.data.firstName,
          lastName: userProfileData.lastName || response.data.lastName,
          id: userProfileData.id || userProfileData._id || basicUserData.id,
          isAdmin: userProfileData.isAdmin || basicUserData.isAdmin,
          isVerified: userProfileData.isVerified || basicUserData.isVerified,
          authProvider: userProfileData.authProvider || basicUserData.authProvider,
        };

        localStorage.setItem('user', JSON.stringify(updatedBasicUserData));
      } catch (profileError) {
        console.warn('Failed to fetch complete user profile after Google login:', profileError);
        // Continue anyway - we at least have the token and basic info
      }

      console.log('Google login successful for user:', response.data.email);
      return response.data;
    } catch (error) {
      console.error('Google login error:', error);

      // Clear any partial auth data on login failure
      this.logout();

      // Handle specific error cases with more detailed error messages
      if (error.response?.status === 400) {
        const errorMessage = error.response.data?.message || 'Invalid Google credentials';

        // Handle specific validation errors
        if (errorMessage.includes('Google credential is required')) {
          throw new Error('Google sign-in failed - no credential received. Please try again.');
        }

        if (errorMessage.includes('timing error') || errorMessage.includes('Token used too')) {
          throw new Error('Google sign-in session expired. Please try signing in again.');
        }

        if (
          errorMessage.includes('Invalid Google credential') ||
          errorMessage.includes('Wrong recipient')
        ) {
          throw new Error('Google sign-in failed - invalid credentials. Please try again.');
        }

        if (errorMessage.includes('configuration error') || errorMessage.includes('audience')) {
          throw new Error(
            'Google sign-in is temporarily unavailable. Please try again later or contact support.'
          );
        }

        if (errorMessage.includes('Incomplete Google profile')) {
          throw new Error(
            'Unable to retrieve your Google profile information. Please ensure your Google account has public email access.'
          );
        }

        throw new Error(errorMessage);
      }

      if (error.response?.status === 401) {
        const errorMessage = error.response.data?.message || 'Google authentication failed';
        throw new Error(errorMessage);
      }

      if (error.response?.status === 409) {
        throw new Error(
          'An account with this email already exists. Please sign in with your email and password instead.'
        );
      }

      if (error.response?.status === 429) {
        throw new Error('Too many login attempts. Please wait a few minutes before trying again.');
      }

      if (error.response?.status === 500) {
        const errorMessage =
          error.response.data?.message || 'Server error. Please try again later.';

        // Handle specific server configuration errors
        if (errorMessage.includes('Google OAuth is not properly configured')) {
          throw new Error(
            'Google sign-in is temporarily unavailable due to server configuration. Please try again later or contact support.'
          );
        }

        if (errorMessage.includes('Google authentication library')) {
          throw new Error(
            'Google sign-in service is temporarily unavailable. Please try again later.'
          );
        }

        if (errorMessage.includes('Database')) {
          throw new Error('Service temporarily unavailable. Please try again in a few moments.');
        }

        throw new Error('Server error occurred during Google sign-in. Please try again later.');
      }

      // Network or other errors
      if (!error.response) {
        if (error.code === 'ECONNABORTED') {
          throw new Error(
            'Google sign-in request timed out. Please check your connection and try again.'
          );
        }

        if (error.code === 'ERR_NETWORK') {
          throw new Error(
            'Network error during Google sign-in. Please check your internet connection and try again.'
          );
        }

        throw new Error(
          'Unable to connect to authentication service. Please check your connection and try again.'
        );
      }

      // Generic error with more helpful message
      const genericMessage = error.response?.data?.message || 'Google sign-in failed';
      throw new Error(
        `${genericMessage}. If this problem persists, please try signing in with email and password instead.`
      );
    }
  },

  // Logout user
  async logout() {
    try {
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local storage data regardless of API call result
      localStorage.removeItem('access_token');
      localStorage.removeItem('token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('user');
    }
  },

  // Check if user is authenticated
  isAuthenticated() {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return false;

      return this.validateToken(token);
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  },

  // Get current user information
  async getCurrentUser() {
    try {
      console.log('Fetching current user data');
      const response = await api.get('/api/auth/profile');

      if (response.data) {
        localStorage.setItem('user_data', JSON.stringify(response.data));

        // Create and store basic user info for compatibility
        const basicData = {
          id: response.data._id || response.data.id,
          email: response.data.email,
          firstName: response.data.firstName,
          lastName: response.data.lastName,
        };
        localStorage.setItem('user', JSON.stringify(basicData));

        return response.data;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);

      // If the error is due to unverified email, provide helpful info
      if (error.response?.status === 401 && error.response?.data?.message?.includes('verify')) {
        console.log('User needs to verify email first');
        // Don't throw here - let the calling component handle it
        return { requiresVerification: true, error: error.response.data.message };
      }

      // For other errors, return null to trigger logout
      return null;
    }
  },

  // Get user profile
  async getUserProfile() {
    try {
      const response = await api.get('/api/auth/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  // Update user profile
  async updateUserProfile(profileData) {
    try {
      const response = await api.put('/api/auth/profile', profileData);

      // Update local storage with new profile data
      const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
      const updatedUserData = { ...userData, ...response.data };
      localStorage.setItem('user_data', JSON.stringify(updatedUserData));

      return response.data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  // Update user password
  async updatePassword(passwordData) {
    try {
      const response = await api.put('/api/auth/password', passwordData);
      return response.data;
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  },

  // Upload profile picture
  async uploadProfilePicture(file) {
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await api.post('/api/auth/profile/picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update local storage with new profile picture URL
      const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
      userData.profilePicture = response.data.profilePicture;
      localStorage.setItem('user_data', JSON.stringify(userData));

      return response.data;
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      throw error;
    }
  },

  // Check if email already exists
  async checkEmailExists(email) {
    try {
      const response = await api.get(`/api/auth/check-email?email=${encodeURIComponent(email)}`);
      return response.data.exists;
    } catch (error) {
      console.error('Error checking email existence:', error);
      // Safely handle errors - return false by default to not block registration
      return false;
    }
  },

  // Request password reset
  async requestPasswordReset(email) {
    try {
      console.log('Requesting password reset for email:', email);
      const response = await api.post('/api/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      console.error('Error requesting password reset:', error);
      throw error;
    }
  },

  // Reset password with token
  async resetPassword(token, newPassword) {
    try {
      console.log('Resetting password with token');
      const response = await api.post(`/api/auth/reset-password/${token}`, {
        password: newPassword,
      });
      return response.data;
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  },

  // Verify email with token
  async verifyEmail(token) {
    try {
      console.log('Verifying email with token');
      const response = await api.get(`/api/auth/verify-email/${token}`);

      // If verification is successful, update the user's verification status
      if (
        response.data &&
        (response.data.message.includes('verified') || response.data.alreadyVerified)
      ) {
        // Update local storage to reflect verified status
        const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
        userData.isVerified = true;
        localStorage.setItem('user_data', JSON.stringify(userData));

        // Also update basic user data
        const basicUser = JSON.parse(localStorage.getItem('user') || '{}');
        basicUser.isVerified = true;
        localStorage.setItem('user', JSON.stringify(basicUser));
      }

      return response.data;
    } catch (error) {
      console.error('Error verifying email:', error);
      // Provide a more specific error message
      if (error.response?.status === 400) {
        if (error.response.data?.expired) {
          throw new Error(
            'Verification link has expired. Please request a new verification email.'
          );
        }
        throw new Error('Invalid or expired verification token');
      } else if (error.response?.status === 404) {
        throw new Error('Verification token not found');
      } else {
        throw new Error(
          error.response?.data?.message || 'Email verification failed. Please try again.'
        );
      }
    }
  },

  // Resend verification email
  async resendVerificationEmail(email) {
    try {
      console.log('Resending verification email for:', email);
      const response = await api.post('/api/auth/resend-verification', { email });
      return response.data;
    } catch (error) {
      console.error('Error resending verification email:', error);
      throw error;
    }
  },
};

export default AuthService;
