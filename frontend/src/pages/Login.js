import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FADE_UP } from '../utils/animations';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import MetaHead from '../components/ui/MetaHead';
import GoogleOAuthButton from '../components/auth/GoogleOAuthButton';
import EmailVerificationBanner from '../components/auth/EmailVerificationBanner';
import LogoLoader from '../components/ui/LogoLoader';
import AuthService from '../services/AuthService';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { FcGoogle } from 'react-icons/fc';
import TranslatedText from '../components/ui/TranslatedText';

// Loading animation component
const LoadingAnimation = () => (
  <motion.div
    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <div className="backdrop-blur-lg bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 sm:p-8 shadow-xl max-w-md w-full mx-4 border border-white/20 dark:border-gray-700/20">
      <LogoLoader size="large" message="Signing you in..." showMessage={true} />
    </div>
  </motion.div>
);

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, googleLogin, isLoading: authLoading } = useAuth();
  const { success, error: showError, info } = useToast();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [showFullscreenLoading, setShowFullscreenLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [hasAttemptedLogin, setHasAttemptedLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Check for redirected state from protected routes
  const from = location.state?.from?.pathname || '/dashboard';

  // Check for success message in location state and show toast
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      success(location.state.message);
      // Clear the message from history so it doesn't show up again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state, success]);

  // Handle verification email state
  const [showVerificationBanner, setShowVerificationBanner] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');

  // Initialize verification banner from location state
  useEffect(() => {
    if (location.state?.needsVerification && location.state?.email) {
      setShowVerificationBanner(true);
      setVerificationEmail(location.state.email);
    }
  }, [location.state]);

  // Show fullscreen loading animation when auth is loading
  useEffect(() => {
    if (authLoading) {
      const timer = setTimeout(() => {
        setShowFullscreenLoading(true);
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setShowFullscreenLoading(false);
    }
  }, [authLoading]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }

    // Clear general login error when user changes any field after a login attempt
    if (loginError && hasAttemptedLogin) {
      setLoginError('');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate email
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Validate password
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setHasAttemptedLogin(true);

    if (!validateForm()) {
      return;
    }

    try {
      setLoginError(''); // Clear any previous errors
      await login(formData.email, formData.password);
      success('Login successful!');
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Login error:', error);

      // Get the error response data
      const errorData = error.response?.data;
      const errorMessage = errorData?.message || error.message || 'Login failed. Please try again.';
      const errorType = errorData?.errorType;

      // Handle specific error types
      switch (errorType) {
        case 'USER_NOT_FOUND':
          setLoginError(errorMessage);
          showError(errorMessage + ' Would you like to create an account?');
          // Optionally redirect to signup after a delay
          setTimeout(() => {
            if (window.confirm('Would you like to create an account instead?')) {
              navigate('/signup', { state: { email: formData.email } });
            }
          }, 2000);
          break;

        case 'EMAIL_NOT_VERIFIED':
          setShowVerificationBanner(true);
          setVerificationEmail(formData.email);
          setLoginError(errorMessage);
          showError(errorMessage);
          break;

        case 'INVALID_PASSWORD':
          setLoginError(errorMessage);
          showError(errorMessage);
          break;

        case 'GOOGLE_AUTH_REQUIRED':
          setLoginError(errorMessage);
          showError(errorMessage);
          break;

        default:
          setLoginError(errorMessage);
          showError(errorMessage);
          break;
      }
    }
  };

  const handleResendVerification = async () => {
    try {
      await AuthService.resendVerificationEmail(verificationEmail);
      success('Verification email sent! Please check your inbox.');
      setShowVerificationBanner(false);
    } catch (error) {
      showError('Failed to resend verification email. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-dark-background relative overflow-hidden">
      <MetaHead title="Sign In - CogniKidz" />

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
          className="max-w-md mx-auto backdrop-blur-lg bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-xl p-8 border border-white/20 dark:border-gray-700/20 relative overflow-hidden"
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
                  <path
                    fillRule="evenodd"
                    d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <span className="text-primary dark:text-primary-300 text-sm font-medium">
                <TranslatedText>Account Access</TranslatedText>
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              <TranslatedText>Welcome Back</TranslatedText>
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              <TranslatedText>Welcome back! Please sign in to your account</TranslatedText>
            </p>
          </div>

          {/* Verification Banner */}
          {showVerificationBanner && (
            <div className="mb-6">
              <EmailVerificationBanner
                email={verificationEmail}
                onResend={handleResendVerification}
                onClose={() => setShowVerificationBanner(false)}
              />
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-green-50/50 dark:bg-green-900/20 backdrop-blur-sm text-green-600 dark:text-green-400 text-sm rounded-lg border border-green-100 dark:border-green-800/20">
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5 mr-2 flex-shrink-0"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                    clipRule="evenodd"
                  />
                </svg>
                {successMessage}
              </div>
            </div>
          )}

          {loginError && (
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
                {loginError}
              </div>
            </div>
          )}

          {/* Google Sign-In Button */}
          <div className="mb-6">
            <GoogleOAuthButton disabled={authLoading} className="mb-4" />

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white/80 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400">
                  <TranslatedText>Or continue with email</TranslatedText>
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                <TranslatedText>Email Address</TranslatedText>
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-700/70 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary dark:focus:ring-primary-400 backdrop-blur-sm"
                />
                <div className="absolute inset-0 rounded-lg pointer-events-none border border-white/40 dark:border-gray-700/40"></div>
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  <TranslatedText>Password</TranslatedText>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:text-primary-600 dark:text-primary-400 transition-colors duration-300"
                >
                  <TranslatedText>Forgot Password?</TranslatedText>
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
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
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                >
                  <TranslatedText>Remember me</TranslatedText>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 px-4 bg-primary hover:bg-primary-600 focus:ring-2 focus:ring-offset-2 focus:ring-primary text-white rounded-lg transition-colors flex items-center justify-center disabled:bg-primary/70 disabled:cursor-not-allowed shadow-colored-lg relative overflow-hidden mt-6"
            >
              <span className="relative z-10">
                {authLoading ? (
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
                    <TranslatedText>Signing In...</TranslatedText>
                  </>
                ) : (
                  <TranslatedText>Sign In</TranslatedText>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary z-0"></div>
            </button>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <TranslatedText>Don't have an account?</TranslatedText>{' '}
                <Link
                  to="/signup"
                  className="font-medium text-primary hover:text-primary-600 dark:text-primary-400 transition-colors duration-300"
                >
                  <TranslatedText>Sign up now</TranslatedText>
                </Link>
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
