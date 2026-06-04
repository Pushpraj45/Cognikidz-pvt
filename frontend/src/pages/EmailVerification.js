import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FADE_UP } from '../utils/animations';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import MetaHead from '../components/ui/MetaHead';
import AuthService from '../services/AuthService';
import TranslatedText from '../components/ui/TranslatedText';

const EmailVerification = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [status, setStatus] = useState('pending'); // 'pending', 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');
  const [isResending, setIsResending] = useState(false);
  const verificationAttempted = useRef(false);
  const currentToken = useRef(null);

  const location = useLocation();
  const { token: paramToken } = useParams();
  const { verifyEmail } = useAuth();
  const { success, error: showError } = useToast();

  // Extract token from URL parameters
  const getTokenFromUrl = useCallback(() => {
    const queryParams = new URLSearchParams(location.search);
    return paramToken || queryParams.get('token');
  }, [location.search, paramToken]);

  // Verify email with token
  const verifyEmailWithToken = useCallback(
    async token => {
      // Prevent duplicate requests for the same token
      if (verificationAttempted.current && currentToken.current === token) {
        console.log('Skipping duplicate verification for token');
        return;
      }

      // Mark verification as attempted for this token
      verificationAttempted.current = true;
      currentToken.current = token;
      setIsVerifying(true);
      setStatus('verifying');

      try {
        console.log('Starting email verification process');
        const response = await verifyEmail(token);

        setStatus('success');
        setMessage(
          response.message ||
            'Your email has been successfully verified! You can now log in to your account.'
        );
        success('Email verified successfully!');
      } catch (error) {
        setStatus('error');
        const errorMsg =
          error.message ||
          error.response?.data?.message ||
          'Email verification failed. The link may be expired or invalid.';
        setMessage(errorMsg);
        console.error('Email verification error:', error);
        showError(errorMsg);
      } finally {
        setIsVerifying(false);
      }
    },
    [verifyEmail, success, showError]
  );

  // Handle retry verification
  const handleRetry = useCallback(() => {
    const token = getTokenFromUrl();
    if (token) {
      // Reset state for retry
      verificationAttempted.current = false;
      currentToken.current = null;
      setStatus('pending');
      setMessage('');

      // Retry verification
      verifyEmailWithToken(token);
    } else {
      setStatus('error');
      setMessage('Verification token is missing. Please use the link from your email.');
    }
  }, [getTokenFromUrl, verifyEmailWithToken]);

  // Handle resend verification email
  const handleResendVerification = async () => {
    try {
      setIsResending(true);
      const email =
        localStorage.getItem('resend_email') || prompt('Please enter your email address:');

      if (!email) {
        showError('Email address is required to resend verification');
        return;
      }

      localStorage.setItem('resend_email', email);
      await AuthService.resendVerificationEmail(email);
      success('Verification email sent! Please check your inbox.');
      setMessage('A new verification email has been sent to your email address.');
    } catch (error) {
      console.error('Error resending verification email:', error);
      showError('Failed to resend verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  // Initialize verification on component mount
  useEffect(() => {
    const token = getTokenFromUrl();

    if (token && !verificationAttempted.current) {
      console.log('Token found, starting verification');
      verifyEmailWithToken(token);
    } else if (!token) {
      setStatus('error');
      setMessage('Verification token is missing. Please use the link from your email.');
    }
  }, [getTokenFromUrl, verifyEmailWithToken]);

  return (
    <div className="min-h-screen bg-background dark:bg-dark-background relative overflow-hidden">
      <MetaHead title="Verify Email - CogniKidz" />

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

      <div className="container mx-auto px-4 py-8 pt-24 relative z-10">
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
                  <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
                  <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
                </svg>
              </span>
              <span className="text-primary dark:text-primary-300 text-sm font-medium">
                Email Verification
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Verify Your Email
            </h1>
            {status === 'pending' && (
              <p className="text-gray-600 dark:text-gray-400">
                Please wait while we verify your email
              </p>
            )}
            {status === 'verifying' && (
              <p className="text-gray-600 dark:text-gray-400">We're verifying your email address</p>
            )}
          </div>

          {status === 'verifying' || isVerifying ? (
            <div className="flex flex-col items-center justify-center my-8">
              <div className="relative w-20 h-20 mb-6">
                {/* Primary circle */}
                <div className="absolute inset-0 rounded-full bg-primary/10 dark:bg-primary/20"></div>

                {/* Spinning border */}
                <motion.div
                  className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />

                {/* Inner blur effect */}
                <div className="absolute inset-2 rounded-full bg-primary/5 dark:bg-primary/10 backdrop-blur-sm"></div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Verifying your email address...
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                This may take a few moments
              </p>
            </div>
          ) : (
            (status === 'success' || status === 'error') && (
              <div className="text-center">
                <div
                  className={`mb-8 p-5 ${
                    status === 'success'
                      ? 'bg-green-50/50 dark:bg-green-900/20 backdrop-blur-sm border border-green-100 dark:border-green-800/20'
                      : 'bg-red-50/50 dark:bg-red-900/20 backdrop-blur-sm border border-red-100 dark:border-red-800/20'
                  } rounded-lg`}
                >
                  <div className="flex flex-col items-center">
                    {status === 'success' ? (
                      <>
                        <div className="inline-flex items-center mb-4 bg-gradient-to-r from-green-500/10 to-green-600/20 rounded-full pl-1 pr-4 py-1">
                          <span className="bg-green-500 text-white dark:bg-green-600/90 dark:text-white rounded-full w-6 h-6 flex items-center justify-center mr-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="w-4 h-4"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </span>
                          <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                            Email Verified
                          </span>
                        </div>
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-800/30 rounded-full flex items-center justify-center mb-4">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-8 h-8 text-green-600 dark:text-green-400"
                          >
                            <path
                              fillRule="evenodd"
                              d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </>
                    ) : (
                      <div className="w-16 h-16 bg-red-100 dark:bg-red-800/30 rounded-full flex items-center justify-center mb-4">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-8 h-8 text-red-600 dark:text-red-400"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                    <p
                      className={`text-${status === 'success' ? 'green' : 'red'}-600 dark:text-${
                        status === 'success' ? 'green' : 'red'
                      }-400 text-lg font-medium mb-2`}
                    >
                      {status === 'success'
                        ? 'Email Verified Successfully!'
                        : 'Verification Failed'}
                    </p>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">{message}</p>

                    {/* Add retry button for error state */}
                    {status === 'error' && (
                      <button
                        onClick={handleRetry}
                        disabled={isVerifying}
                        className="py-2 px-4 bg-primary/90 hover:bg-primary text-white rounded-lg transition-colors mb-4 disabled:opacity-50"
                      >
                        {isVerifying ? 'Retrying...' : 'Retry Verification'}
                      </button>
                    )}

                    {/* Add resend email button for error state */}
                    {status === 'error' && (
                      <button
                        onClick={handleResendVerification}
                        disabled={isResending}
                        className="py-2 px-4 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors mb-4 disabled:opacity-50"
                      >
                        {isResending ? 'Sending...' : 'Request New Verification Email'}
                      </button>
                    )}
                  </div>
                </div>

                {status === 'success' && (
                  <Link
                    to="/login"
                    className="py-3 px-8 bg-primary hover:bg-primary-600 text-white rounded-lg transition-colors inline-block shadow-colored-lg relative overflow-hidden"
                  >
                    <span className="relative z-10">Go to Login</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary z-0"></div>
                  </Link>
                )}
              </div>
            )
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default EmailVerification;
