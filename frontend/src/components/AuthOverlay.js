import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import TranslatedText from './ui/TranslatedText';

const AuthOverlay = ({ children, title, description }) => {
  const navigate = useNavigate();

  return (
    <div className="relative">
      {/* Blurred Content */}
      <div className="filter blur-sm pointer-events-none select-none">{children}</div>

      {/* Glassmorphism Overlay */}
      <div className="absolute inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-md flex items-start justify-center pt-32 pb-8 px-4 z-40">
        {/* Enhanced background decorations similar to login page */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial from-primary/5 to-transparent opacity-60 dark:opacity-30"></div>
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-radial from-secondary/10 to-transparent rounded-full dark:from-secondary/5"></div>
          <div className="absolute bottom-40 left-20 w-[600px] h-[600px] bg-gradient-radial from-accent/10 to-transparent rounded-full dark:from-accent/5"></div>

          {/* Static dots for visual interest */}
          <div className="absolute top-[20%] left-[15%] w-3 h-3 bg-primary rounded-full"></div>
          <div className="absolute top-[25%] right-[10%] w-2 h-2 bg-accent rounded-full"></div>
          <div className="absolute bottom-[30%] right-[20%] w-2 h-2 bg-secondary rounded-full"></div>
        </div>

        {/* Glassmorphism Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3, type: 'spring', damping: 25, stiffness: 300 }}
          className="backdrop-blur-lg bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-xl max-w-lg w-full relative overflow-hidden border border-white/20 dark:border-gray-700/20"
        >
          {/* Decorative elements similar to login page */}
          <div className="absolute -top-24 -right-24 w-40 h-40 bg-gradient-radial from-primary/20 to-transparent rounded-full blur-xl"></div>
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-radial from-secondary/20 to-transparent rounded-full blur-xl"></div>

          {/* Content */}
          <div className="relative z-10 p-8 text-center">
            {/* Enhanced header with badge */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center mb-4 bg-gradient-to-r from-primary/10 to-primary/20 rounded-full pl-1 pr-4 py-1">
                <span className="bg-primary text-white dark:bg-primary/90 dark:text-white rounded-full w-6 h-6 flex items-center justify-center mr-2">
                  <LockClosedIcon className="w-4 h-4" />
                </span>
                <span className="text-primary dark:text-primary-300 text-sm font-medium">
                  <TranslatedText>Premium Access</TranslatedText>
                </span>
              </div>
            </div>

            {/* Lock Icon with enhanced glassmorphism */}
            <div className="mx-auto w-16 h-16 glassmorphism-primary rounded-full flex items-center justify-center mb-6 relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-md"></div>
              <LockClosedIcon className="w-8 h-8 text-primary relative z-10" />
            </div>

            {/* Title */}
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
              {title || <TranslatedText>Login Required</TranslatedText>}
            </h2>

            {/* Description */}
            <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed text-base">
              {description || (
                <TranslatedText>
                  Please log in to access this content and unlock all features of CogniKidz.care
                </TranslatedText>
              )}
            </p>

            {/* Action Buttons with enhanced styling */}
            <div className="space-y-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/login')}
                className="w-full bg-gradient-to-r from-primary to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl backdrop-blur-sm"
              >
                <TranslatedText>Log In</TranslatedText>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/signup')}
                className="w-full bg-white/70 dark:bg-gray-700/70 hover:bg-white/80 dark:hover:bg-gray-700/80 text-primary border border-primary/20 dark:border-primary/30 font-semibold py-3 px-6 rounded-lg transition-all duration-200 backdrop-blur-sm"
              >
                <TranslatedText>Create Account</TranslatedText>
              </motion.button>
            </div>

            {/* Additional Info with enhanced styling */}
            <div className="mt-6 p-3 bg-gradient-to-r from-primary/5 to-secondary/5 dark:from-primary/10 dark:to-secondary/10 rounded-lg border border-primary/10 dark:border-primary/20">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <TranslatedText>
                  Join thousands of parents already using CogniKidz.care
                </TranslatedText>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthOverlay;
