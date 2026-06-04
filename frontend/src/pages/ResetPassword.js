import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FADE_UP } from '../utils/animations';
import { useToast } from '../contexts/ToastContext';
import AuthService from '../services/AuthService';
import MetaHead from '../components/ui/MetaHead';
import TranslatedText from '../components/ui/TranslatedText';
import { useAuth } from '../contexts/AuthContext';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Check password confirmation status for real-time feedback
  const getPasswordConfirmationStatus = () => {
    if (!formData.confirmPassword) return null; // No feedback when confirm password is empty
    if (!formData.password) return null; // No feedback when original password is empty
    return formData.password === formData.confirmPassword;
  };

  const passwordMatch = getPasswordConfirmationStatus();

  const validatePassword = () => {
    const newErrors = {};

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

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!validatePassword()) {
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      await AuthService.resetPassword(token, formData.password);

      setResetSuccess(true);
      success('Password reset successful! You can now log in with your new password.');

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login', {
          state: {
            message: 'Password reset successful! You can now log in with your new password.',
          },
        });
      }, 3000);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to reset password. The link may be invalid or expired.';
      setErrors({ general: errorMessage });
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (resetSuccess) {
    return (
      <div className="min-h-screen bg-background dark:bg-dark-background relative overflow-hidden">
        <MetaHead title="Password Changed - CogniKidz" />

        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial from-primary/5 to-transparent opacity-60 dark:opacity-30"></div>
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-radial from-secondary/10 to-transparent rounded-full dark:from-secondary/5"></div>
        </div>

        <div className="container mx-auto px-4 pt-32 pb-20 relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={FADE_UP}
            className="max-w-md mx-auto backdrop-blur-lg bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-xl p-8 border border-white/20 dark:border-gray-700/20 text-center"
          >
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
                Password Changed
              </span>
            </div>

            <div className="w-16 h-16 bg-green-100 dark:bg-green-800/30 rounded-full flex items-center justify-center mb-4 mx-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-8 h-8 text-green-600 dark:text-green-400"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Your CogniKidz password has been changed
            </h2>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This is a confirmation that the password for your CogniKidz account has just been
              changed.
            </p>

            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
              If you did not request this change, please contact support immediately.
            </p>

            <button
              onClick={() => navigate('/login')}
              className="w-full bg-primary hover:bg-primary-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 shadow-colored-lg relative overflow-hidden"
            >
              <span className="relative z-10">Go to Login</span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary z-0"></div>
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <>
      <MetaHead
        title="Reset Password - CogniKidz"
        description="Reset your CogniKidz account password securely"
      />

      <div className="min-h-screen bg-background dark:bg-dark-background relative overflow-hidden">
        {/* Background decorations */}
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
                  Secure Reset
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Reset Password
              </h1>
              <p className="text-gray-600 dark:text-gray-400">Please enter your new password</p>
            </div>

            {errors.general && (
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
                  {errors.general}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter new password"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-700/70 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary dark:focus:ring-primary-400 backdrop-blur-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.091 1.092a4 4 0 00-5.557-5.557z"
                          clipRule="evenodd"
                        />
                        <path d="m10.748 13.93 2.523 2.523a9.987 9.987 0 01-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 010-1.186A10.007 10.007 0 012.839 6.02L6.07 9.252a4 4 0 004.678 4.678z" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-5 h-5"
                      >
                        <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                        <path
                          fillRule="evenodd"
                          d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                          clipRule="evenodd"
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

              <div className="mb-6">
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm new password"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-700/70 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary dark:focus:ring-primary-400 backdrop-blur-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    {showConfirmPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.091 1.092a4 4 0 00-5.557-5.557z"
                          clipRule="evenodd"
                        />
                        <path d="m10.748 13.93 2.523 2.523a9.987 9.987 0 01-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 010-1.186A10.007 10.007 0 012.839 6.02L6.07 9.252a4 4 0 004.678 4.678z" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-5 h-5"
                      >
                        <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                        <path
                          fillRule="evenodd"
                          d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                          clipRule="evenodd"
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
                        Password matches
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
                        Password doesn't match
                      </p>
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-600 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                    Resetting Password...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => navigate('/login')}
                className="font-medium text-primary hover:text-primary-600 dark:text-primary-400 transition-colors duration-300"
              >
                ← Back to Login
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;
