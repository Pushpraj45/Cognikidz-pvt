import React, { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FADE_UP } from '../utils/animations';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import GoogleOAuthButton from '../components/auth/GoogleOAuthButton';
import LegalModal from '../components/ui/LegalModal';
import LogoLoader from '../components/ui/LogoLoader';
import axios from 'axios';
import debounce from 'lodash/debounce';
import AuthService from '../services/AuthService';
import TranslatedText from '../components/ui/TranslatedText';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { FcGoogle } from 'react-icons/fc';

const Signup = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { success, error: showError, info } = useToast();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    termsAgreed: false,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [emailExists, setEmailExists] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Modal state for legal documents
  const [modalState, setModalState] = useState({ isOpen: false, type: null });

  const openModal = type => {
    setModalState({ isOpen: true, type });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, type: null });
  };

  // Debounced function to check if email already exists
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const checkEmailExists = useCallback(
    debounce(async email => {
      if (!email || !/\S+@\S+\.\S+/.test(email)) return;

      try {
        setIsCheckingEmail(true);
        const exists = await AuthService.checkEmailExists(email);

        setEmailExists(exists);

        if (exists) {
          setErrors(prev => ({
            ...prev,
            email: 'An account with this email already exists',
          }));
        } else {
          // Clear email error if it was previously set for email exists
          if (errors.email === 'An account with this email already exists') {
            setErrors(prev => ({
              ...prev,
              email: '',
            }));
          }
        }
      } catch (error) {
        // Handle errors gracefully
        setEmailExists(false);
      } finally {
        setIsCheckingEmail(false);
      }
    }, 500),
    [errors.email]
  );

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    // Handle checkbox inputs differently
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }

    // Clear general signup error when user changes any field
    if (signupError) {
      setSignupError('');
    }

    // Check email existence when email changes
    if (name === 'email' && value) {
      checkEmailExists(value);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate first name
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    // Validate last name
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    // Validate email
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Validate password
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    } else if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.password)
    ) {
      newErrors.password =
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one symbol (@$!%*?&)';
    }

    // Validate confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Validate terms agreement
    if (!formData.termsAgreed) {
      newErrors.termsAgreed = 'You must agree to the Terms of Service and Privacy Policy';
    }

    // Check if email already exists
    if (emailExists) {
      newErrors.email = 'An account with this email already exists';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();

    // Validate the form first
    if (!validateForm()) {
      return;
    }

    // Show loading state
    setIsLoading(true);
    setSignupError('');

    // Show initial feedback to user
    info('Creating your account...');

    // Prepare user data
    const userData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email.toLowerCase().trim(),
      password: formData.password,
    };

    try {
      // Check if email exists one more time before submitting
      const emailCheckResult = await AuthService.checkEmailExists(userData.email);
      if (emailCheckResult) {
        setErrors(prev => ({
          ...prev,
          email: 'An account with this email already exists',
        }));
        setEmailExists(true);
        showError(
          'An account with this email already exists. Please use a different email or log in.'
        );
        setIsLoading(false);
        return;
      }

      // Perform the registration
      const response = await AuthService.register(userData);

      // Handle successful registration
      handleSuccessfulRegistration(userData.email);
    } catch (error) {
      // Handle registration errors
      console.error('Registration failed:', error);

      // Display error message
      const errorMessage = error.message || 'Registration failed. Please try again.';
      setSignupError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to handle successful registration
  const handleSuccessfulRegistration = email => {
    // Show success message asking user to verify email
    success('Account created! Please check your email and verify your account before logging in.');

    // Save email to local storage to remember it exists (temporary solution)
    const existingUsers = localStorage.getItem('existingUsers')
      ? JSON.parse(localStorage.getItem('existingUsers'))
      : [];
    if (!existingUsers.includes(email)) {
      existingUsers.push(email);
      localStorage.setItem('existingUsers', JSON.stringify(existingUsers));
    }

    // Redirect to login page with success message
    navigate('/login', {
      state: {
        message:
          'Account created successfully! Please check your email and verify your account before logging in.',
        email: email,
        needsVerification: true,
      },
    });
  };

  // Check password confirmation status for real-time feedback
  const getPasswordConfirmationStatus = () => {
    if (!formData.confirmPassword) return null; // No feedback when confirm password is empty
    if (!formData.password) return null; // No feedback when original password is empty
    return formData.password === formData.confirmPassword;
  };

  const passwordMatch = getPasswordConfirmationStatus();

  return (
    <div className="min-h-screen bg-background dark:bg-dark-background relative overflow-hidden">
      {/* Fullscreen Loading Overlay */}
      {isLoading && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="backdrop-blur-lg bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 sm:p-8 shadow-xl max-w-md w-full mx-4 border border-white/20 dark:border-gray-700/20">
            <LogoLoader size="large" message="Creating your account..." showMessage={true} />
          </div>
        </motion.div>
      )}
      {/* Background decorations similar to landing page */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial from-primary/5 to-transparent opacity-60 dark:opacity-30"></div>
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-radial from-secondary/10 to-transparent rounded-full dark:from-secondary/5"></div>
        <div className="absolute bottom-40 left-20 w-[600px] h-[600px] bg-gradient-radial from-accent/10 to-transparent rounded-full dark:from-accent/5"></div>

        {/* Static dots */}
        <div className="absolute top-[20%] left-[15%] w-3 h-3 bg-primary rounded-full"></div>
        <div className="absolute top-[25%] right-[10%] w-2 h-2 bg-accent rounded-full"></div>
        <div className="absolute bottom-[30%] right-[20%] w-2 h-2 bg-secondary rounded-full"></div>
      </div>

      <div className="container mx-auto px-4 pt-32 pb-20 relative z-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={FADE_UP}
          className="max-w-md mx-auto backdrop-blur-lg bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-xl p-8 border border-white/20 dark:border-gray-700/20 relative overflow-hidden mb-12"
        >
          {/* Decorative elements */}
          <div className="absolute -top-24 -right-24 w-40 h-40 bg-gradient-radial from-primary/20 to-transparent rounded-full blur-xl"></div>
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-radial from-secondary/20 to-transparent rounded-full blur-xl"></div>

          <div className="text-center mb-8 relative">
            <div className="inline-flex items-center mb-4 bg-gradient-to-r from-primary/10 to-primary/20 rounded-full pl-1 pr-4 py-1">
              <span className="bg-primary text-white dark:bg-primary/90 dark:text-white rounded-full w-6 h-6 flex items-center justify-center mr-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                </svg>
              </span>
              <span className="text-primary dark:text-primary-300 text-sm font-medium">
                <TranslatedText>Join CogniKidz</TranslatedText>
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              <TranslatedText>Create Your Account</TranslatedText>
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              <TranslatedText>
                Join CogniKidz and start your child's learning journey
              </TranslatedText>
            </p>
          </div>

          {signupError && (
            <div className="mb-6 p-4 bg-red-50/50 dark:bg-red-900/20 backdrop-blur-sm text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-800/20">
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5 mr-2 flex-shrink-0"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
                {signupError}
              </div>
            </div>
          )}

          {/* Google Sign-Up Button */}
          <div className="mb-6">
            <GoogleOAuthButton disabled={isLoading} className="mb-4" />

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white/80 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400">
                  <TranslatedText>Or sign up with email</TranslatedText>
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  <TranslatedText>First Name</TranslatedText>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Enter your first name"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-700/70 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary dark:focus:ring-primary-400 backdrop-blur-sm"
                  />
                  <div className="absolute inset-0 rounded-lg pointer-events-none border border-white/40 dark:border-gray-700/40"></div>
                </div>
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.firstName}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  <TranslatedText>Last Name</TranslatedText>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Enter your last name"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-700/70 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary dark:focus:ring-primary-400 backdrop-blur-sm"
                  />
                  <div className="absolute inset-0 rounded-lg pointer-events-none border border-white/40 dark:border-gray-700/40"></div>
                </div>
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div className="mb-5">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                <TranslatedText>Email Address</TranslatedText>
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email address"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-700/70 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary dark:focus:ring-primary-400 backdrop-blur-sm"
                />
                <div className="absolute inset-0 rounded-lg pointer-events-none border border-white/40 dark:border-gray-700/40"></div>
                {isCheckingEmail && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg
                      className="animate-spin h-4 w-4 text-primary"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </div>
                )}
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
              )}
            </div>

            <div className="mb-5">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                <TranslatedText>Password</TranslatedText>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-700/70 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary dark:focus:ring-primary-400 backdrop-blur-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
                <div className="absolute inset-0 rounded-lg pointer-events-none border border-white/40 dark:border-gray-700/40"></div>
              </div>
              {errors.password ? (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
              ) : (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  <TranslatedText>
                    Password must be at least 8 characters with uppercase, lowercase, number, and
                    symbol (@$!%*?&)
                  </TranslatedText>
                </p>
              )}
            </div>

            <div className="mb-5">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                <TranslatedText>Confirm Password</TranslatedText>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-700/70 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary dark:focus:ring-primary-400 backdrop-blur-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
                <div className="absolute inset-0 rounded-lg pointer-events-none border border-white/40 dark:border-gray-700/40"></div>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.confirmPassword}
                </p>
              )}

              {/* Real-time password confirmation feedback */}
              {passwordMatch !== null && (
                <div className="mt-2">
                  {passwordMatch ? (
                    <p className="text-sm text-green-600 dark:text-green-400 flex items-center">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <TranslatedText>Password matches</TranslatedText>
                    </p>
                  ) : (
                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      <TranslatedText>Password doesn't match</TranslatedText>
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="mb-6">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="termsAgreed"
                    name="termsAgreed"
                    type="checkbox"
                    checked={formData.termsAgreed}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="termsAgreed" className="text-gray-700 dark:text-gray-300">
                    <TranslatedText>I agree to the </TranslatedText>
                    <button
                      type="button"
                      onClick={() => openModal('terms')}
                      className="text-primary hover:underline font-medium"
                    >
                      <TranslatedText>Terms of Service</TranslatedText>
                    </button>{' '}
                    and{' '}
                    <button
                      type="button"
                      onClick={() => openModal('privacy')}
                      className="text-primary hover:underline font-medium"
                    >
                      <TranslatedText>Privacy Policy</TranslatedText>
                    </button>
                  </label>
                  {errors.termsAgreed && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.termsAgreed}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-primary hover:bg-primary-600 focus:ring-2 focus:ring-offset-2 focus:ring-primary text-white rounded-lg transition-colors flex items-center justify-center disabled:bg-primary/70 disabled:cursor-not-allowed shadow-colored-lg relative overflow-hidden"
            >
              <span className="relative z-10">
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <TranslatedText>Creating Account...</TranslatedText>
                  </>
                ) : (
                  <TranslatedText>Create Account</TranslatedText>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary z-0"></div>
            </button>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <TranslatedText>Already have an account?</TranslatedText>{' '}
                <Link
                  to="/login"
                  className="font-medium text-primary hover:text-primary-600 dark:text-primary-400 transition-colors duration-300"
                >
                  <TranslatedText>Sign in</TranslatedText>
                </Link>
              </p>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Legal Modal */}
      <LegalModal isOpen={modalState.isOpen} onClose={closeModal} type={modalState.type} />
    </div>
  );
};

export default Signup;
