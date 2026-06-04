import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FADE_UP } from '../utils/animations';
import AuthService from '../services/AuthService';
import MetaHead from '../components/ui/MetaHead';
import TranslatedText from '../components/ui/TranslatedText';
import { useAuth } from '../contexts/AuthContext';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const [resendingEmail, setResendingEmail] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState([]);
  const verificationAttempted = useRef(false);

  // Debug logging function
  const addDebugLog = (message, data = null) => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}${data ? `: ${JSON.stringify(data)}` : ''}`;
    setDebugInfo(prev => [...prev, logEntry]);
  };

  useEffect(() => {
    if (logEntry) {
      // Process the log entry
    }
  }, [logEntry]);

  useEffect(() => {
    addDebugLog('VerifyEmail useEffect triggered');
    addDebugLog('Token', token ? token.substring(0, 10) + '...' : 'No token');
    addDebugLog('Verification attempted', verificationAttempted.current);

    // If verification was already attempted, don't run again
    if (verificationAttempted.current) {
      addDebugLog('Verification already attempted, skipping');
      return;
    }

    // Set the guard immediately
    verificationAttempted.current = true;

    if (!token) {
      addDebugLog('No token provided');
      setError('No verification token provided');
      setLoading(false);
      return;
    }

    // Check sessionStorage for already processed tokens
    const processedTokens = JSON.parse(
      sessionStorage.getItem('processedVerificationTokens') || '[]'
    );
    if (processedTokens.includes(token)) {
      addDebugLog('Token already processed in this session');
      setError('This verification link has already been processed. Please try logging in.');
      setLoading(false);
      return;
    }

    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      addDebugLog('Verification timeout reached');
      setError('Verification is taking too long. Please try again.');
      setLoading(false);
    }, 30000); // 30 second timeout

    // Perform verification
    const performVerification = async () => {
      try {
        addDebugLog('Starting email verification for token', token.substring(0, 10) + '...');

        const response = await AuthService.verifyEmail(token);

        if (response) {
          addDebugLog('Verification successful', response);
          setVerified(true);
          setError(''); // Clear any previous errors

          // Show success notification
          const successToast = document.createElement('div');
          successToast.textContent =
            'Email verification successful! You can now login to your account.';
          successToast.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 9999;
            background: #10B981; color: white; padding: 12px 24px;
            border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-family: system-ui; font-size: 14px; max-width: 400px;
          `;
          document.body.appendChild(successToast);
          setTimeout(() => {
            if (document.body.contains(successToast)) {
              document.body.removeChild(successToast);
            }
          }, 5000);

          // Mark token as processed
          const updatedTokens = [...processedTokens, token];
          sessionStorage.setItem('processedVerificationTokens', JSON.stringify(updatedTokens));
        }
      } catch (error) {
        addDebugLog('Email verification error', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });

        const errorMessage =
          error.message || 'Email verification failed. The link may be invalid or expired.';
        setError(errorMessage);
        setVerified(false); // Ensure verified is false on error

        // Show error notification
        const errorToast = document.createElement('div');
        errorToast.textContent = errorMessage;
        errorToast.style.cssText = `
          position: fixed; top: 20px; right: 20px; z-index: 9999;
          background: #EF4444; color: white; padding: 12px 24px;
          border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          font-family: system-ui; font-size: 14px; max-width: 400px;
        `;
        document.body.appendChild(errorToast);
        setTimeout(() => {
          if (document.body.contains(errorToast)) {
            document.body.removeChild(errorToast);
          }
        }, 5000);

        // Mark token as processed even on error to prevent retries
        const updatedTokens = [...processedTokens, token];
        sessionStorage.setItem('processedVerificationTokens', JSON.stringify(updatedTokens));
      } finally {
        addDebugLog('Setting loading to false');
        clearTimeout(timeoutId); // Clear the timeout
        setLoading(false);
      }
    };

    performVerification();

    // Cleanup function to clear timeout if component unmounts
    return () => {
      clearTimeout(timeoutId);
    };
  }, [token]);

  const handleResendEmail = async () => {
    try {
      setResendingEmail(true);
      const urlParams = new URLSearchParams(window.location.search);
      const email = urlParams.get('email');

      if (email) {
        await AuthService.resendVerificationEmail(email);

        const successToast = document.createElement('div');
        successToast.textContent = 'Verification email sent! Please check your inbox.';
        successToast.style.cssText = `
          position: fixed; top: 20px; right: 20px; z-index: 9999;
          background: #10B981; color: white; padding: 12px 24px;
          border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          font-family: system-ui; font-size: 14px; max-width: 400px;
        `;
        document.body.appendChild(successToast);
        setTimeout(() => {
          if (document.body.contains(successToast)) {
            document.body.removeChild(successToast);
          }
        }, 5000);
      } else {
        const errorToast = document.createElement('div');
        errorToast.textContent = 'Unable to resend email. Please try registering again.';
        errorToast.style.cssText = `
          position: fixed; top: 20px; right: 20px; z-index: 9999;
          background: #EF4444; color: white; padding: 12px 24px;
          border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          font-family: system-ui; font-size: 14px; max-width: 400px;
        `;
        document.body.appendChild(errorToast);
        setTimeout(() => {
          if (document.body.contains(errorToast)) {
            document.body.removeChild(errorToast);
          }
        }, 5000);
      }
    } catch (error) {
      console.error('Resend email error:', error);

      const errorToast = document.createElement('div');
      errorToast.textContent = error.message || 'Failed to resend verification email';
      errorToast.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 9999;
        background: #EF4444; color: white; padding: 12px 24px;
        border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-family: system-ui; font-size: 14px; max-width: 400px;
      `;
      document.body.appendChild(errorToast);
      setTimeout(() => {
        if (document.body.contains(errorToast)) {
          document.body.removeChild(errorToast);
        }
      }, 5000);
    } finally {
      setResendingEmail(false);
    }
  };

  // Force stop loading (for testing)
  const handleForceStopLoading = () => {
    addDebugLog('Force stopping loading state');
    setLoading(false);
    setError('Loading manually stopped for debugging');
  };

  // Debug: Log current state
  addDebugLog('Current state', { loading, verified, error });

  return (
    <>
      <MetaHead
        title="Email Verification - CogniKidz"
        description="Verify your email address to complete your CogniKidz account setup"
      />

      <div className="min-h-screen bg-background dark:bg-dark-background relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial from-primary/5 to-transparent opacity-60 dark:opacity-30"></div>
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-radial from-secondary/10 to-transparent rounded-full dark:from-secondary/5"></div>
          <div className="absolute bottom-40 left-20 w-[600px] h-[600px] bg-gradient-radial from-accent/10 to-transparent rounded-full dark:from-accent/5"></div>
        </div>

        <div className="container mx-auto px-4 pt-32 pb-20 relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={FADE_UP}
            className="max-w-md mx-auto backdrop-blur-lg bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-xl p-8 border border-white/20 dark:border-gray-700/20"
          >
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Email Verification
              </h1>
              <p className="text-gray-600 dark:text-gray-400">Confirming your email address</p>
            </div>

            {/* Debug Controls */}
            <div className="mb-4 flex gap-2">
              <button
                onClick={() => setDebugMode(!debugMode)}
                className="text-xs px-2 py-1 bg-gray-500 text-white rounded"
              >
                {debugMode ? 'Hide Debug' : 'Show Debug'}
              </button>
              {loading && (
                <button
                  onClick={handleForceStopLoading}
                  className="text-xs px-2 py-1 bg-red-500 text-white rounded"
                >
                  Force Stop Loading
                </button>
              )}
            </div>

            {debugMode && (
              <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs">
                <h3 className="font-bold mb-2">Debug Info:</h3>
                <div className="max-h-40 overflow-y-auto">
                  {debugInfo.map((log, index) => (
                    <div key={index} className="mb-1 font-mono text-xs">
                      {log}
                    </div>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
                  <p>
                    <strong>Current State:</strong>
                  </p>
                  <p>Loading: {loading.toString()}</p>
                  <p>Verified: {verified.toString()}</p>
                  <p>Error: {error || 'None'}</p>
                  <p>Token: {token ? token.substring(0, 20) + '...' : 'None'}</p>
                </div>
              </div>
            )}

            {loading && (
              <div className="text-center">
                <div className="mb-4">
                  <svg
                    className="animate-spin h-12 w-12 mx-auto text-primary"
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
                <p className="text-gray-600 dark:text-gray-400">Verifying your email...</p>
                <p className="text-sm text-gray-500 mt-2">This may take up to 30 seconds</p>
              </div>
            )}

            {!loading && verified && (
              <div className="text-center">
                <div className="text-green-500 text-6xl mb-6">
                  <svg
                    className="mx-auto h-16 w-16"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                  Email Verified Successfully!
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Your email has been verified. You can now log in to your account and start using
                  CogniKidz.
                </p>
                <Link
                  to="/login"
                  className="block w-full bg-primary hover:bg-primary-600 text-white font-semibold py-3 px-4 rounded-lg text-center transition duration-200 shadow-lg"
                >
                  Go to Login
                </Link>
              </div>
            )}

            {!loading && error && (
              <div className="text-center">
                <div className="text-red-500 text-6xl mb-6">
                  <svg
                    className="mx-auto h-16 w-16"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                  Verification Failed
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>

                <div className="space-y-3">
                  <button
                    onClick={handleResendEmail}
                    disabled={resendingEmail}
                    className="block w-full bg-primary hover:bg-primary-600 disabled:bg-primary/70 text-white font-semibold py-3 px-4 rounded-lg text-center transition duration-200 shadow-lg"
                  >
                    {resendingEmail ? (
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
                        Sending...
                      </>
                    ) : (
                      'Resend Verification Email'
                    )}
                  </button>

                  <Link
                    to="/login"
                    className="block w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg text-center transition duration-200"
                  >
                    Go to Login
                  </Link>

                  <Link
                    to="/register"
                    className="block w-full border border-primary text-primary hover:bg-primary hover:text-white font-semibold py-3 px-4 rounded-lg text-center transition duration-200"
                  >
                    Register Again
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default VerifyEmail;
