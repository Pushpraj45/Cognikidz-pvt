import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FADE_UP } from '../utils/animations';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import AuthService from '../services/AuthService';
import MetaHead from '../components/ui/MetaHead';
import TranslatedText from '../components/ui/TranslatedText';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');
  const { requestPasswordReset } = useAuth();
  const { success, error: showError } = useToast();

  const handleSubmit = async e => {
    e.preventDefault();

    if (!email) {
      setError('Please enter your email address');
      showError('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await requestPasswordReset(email);

      setEmailSent(true);
      success('Password reset email sent! Check your inbox.');
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || 'Failed to send password reset email. Please try again.';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-dark-background relative overflow-hidden">
      <MetaHead title="Forgot Password - CogniKidz" />

      {/* Background decorations similar to other pages */}
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
                    d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <span className="text-primary dark:text-primary-300 text-sm font-medium">
                Password Recovery
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Forgot Password
            </h1>
            {!emailSent && (
              <p className="text-gray-600 dark:text-gray-400">
                Enter your email address and we'll send you a link to reset your password
              </p>
            )}
          </div>

          {!emailSent ? (
            <>
              {error && (
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
                    {error}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-700/70 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary dark:focus:ring-primary-400 backdrop-blur-sm"
                      placeholder="Enter your email"
                      required
                    />
                    <div className="absolute inset-0 rounded-lg pointer-events-none border border-white/40 dark:border-gray-700/40"></div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-primary hover:bg-primary-600 focus:ring-2 focus:ring-offset-2 focus:ring-primary text-white rounded-lg transition-colors flex items-center justify-center disabled:bg-primary/70 disabled:cursor-not-allowed shadow-colored-lg relative overflow-hidden mt-6"
                >
                  <span className="relative z-10">
                    {loading ? (
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
                      'Send Reset Link'
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary z-0"></div>
                </button>

                <div className="mt-6 text-center">
                  <Link
                    to="/login"
                    className="font-medium text-primary hover:text-primary-600 dark:text-primary-400 transition-colors duration-300"
                  >
                    Return to Login
                  </Link>
                </div>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-800/30 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
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
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Check Your Email
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                We've sent a password reset link to <strong>{email}</strong>. Please check your
                inbox and follow the instructions.
              </p>
              <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
                If you don't see the email, check your spam folder or try again.
              </p>
              <button
                onClick={() => setEmailSent(false)}
                className="block w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg text-center transition-colors duration-200 mb-3"
              >
                Try Again
              </button>
              <Link
                to="/login"
                className="block w-full py-3 px-4 bg-primary hover:bg-primary-600 text-white rounded-lg transition-colors flex items-center justify-center shadow-colored-lg relative overflow-hidden"
              >
                <span className="relative z-10">Return to Login</span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary z-0"></div>
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;
