import React from 'react';
import { motion } from 'framer-motion';

const LogoLoader = ({
  size = 'medium',
  message = 'Loading...',
  showMessage = true,
  className = '',
}) => {
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32',
  };

  const logoSize = sizeClasses[size] || sizeClasses.medium;

  // Animation variants
  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.2,
        repeat: Infinity,
        repeatType: 'loop',
        duration: 2,
      },
    },
  };

  const boxVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: {
      scale: [0, 1.2, 1],
      opacity: [0, 1, 1],
      transition: {
        duration: 0.8,
        ease: 'easeInOut',
      },
    },
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.1, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Logo Animation Container */}
      <motion.div
        className={`relative ${logoSize} mb-4`}
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        {/* Background pulse */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl"
          variants={pulseVariants}
          animate="animate"
        />

        {/* Animated boxes representing logo elements */}
        <div className="relative w-full h-full grid grid-cols-3 gap-1 p-2">
          {/* Top row */}
          <motion.div
            className="bg-gradient-to-br from-primary to-primary-600 rounded-sm"
            variants={boxVariants}
          />
          <motion.div
            className="bg-gradient-to-br from-secondary to-secondary-600 rounded-sm"
            variants={boxVariants}
          />
          <motion.div
            className="bg-gradient-to-br from-accent to-accent-600 rounded-sm"
            variants={boxVariants}
          />

          {/* Middle row */}
          <motion.div
            className="bg-gradient-to-br from-accent to-accent-600 rounded-sm"
            variants={boxVariants}
          />
          <motion.div
            className="bg-gradient-to-br from-primary to-primary-600 rounded-sm transform scale-110"
            variants={boxVariants}
          />
          <motion.div
            className="bg-gradient-to-br from-secondary to-secondary-600 rounded-sm"
            variants={boxVariants}
          />

          {/* Bottom row */}
          <motion.div
            className="bg-gradient-to-br from-secondary to-secondary-600 rounded-sm"
            variants={boxVariants}
          />
          <motion.div
            className="bg-gradient-to-br from-accent to-accent-600 rounded-sm"
            variants={boxVariants}
          />
          <motion.div
            className="bg-gradient-to-br from-primary to-primary-600 rounded-sm"
            variants={boxVariants}
          />
        </div>

        {/* Orbiting dots */}
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        >
          <div className="relative w-full h-full">
            <motion.div
              className="absolute top-0 left-1/2 w-2 h-2 bg-primary rounded-full -translate-x-1/2"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute bottom-0 left-1/2 w-2 h-2 bg-secondary rounded-full -translate-x-1/2"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            />
            <motion.div
              className="absolute left-0 top-1/2 w-2 h-2 bg-accent rounded-full -translate-y-1/2"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut', delay: 0.25 }}
            />
            <motion.div
              className="absolute right-0 top-1/2 w-2 h-2 bg-primary rounded-full -translate-y-1/2"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut', delay: 0.75 }}
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Loading message */}
      {showMessage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">{message}</h3>
          <motion.div
            className="flex space-x-1 justify-center"
            initial="initial"
            animate="animate"
            variants={{
              animate: {
                transition: {
                  staggerChildren: 0.2,
                  repeat: Infinity,
                  repeatType: 'loop',
                },
              },
            }}
          >
            {[0, 1, 2].map(index => (
              <motion.div
                key={index}
                className="w-2 h-2 bg-primary rounded-full"
                variants={{
                  initial: { y: 0 },
                  animate: {
                    y: [-4, 0, -4],
                    transition: {
                      duration: 0.8,
                      ease: 'easeInOut',
                    },
                  },
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

// Progress loader variant
export const ProgressLoader = ({ progress = 0, message = 'Loading...', className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <LogoLoader size="medium" showMessage={false} />

      {/* Progress bar */}
      <div className="w-64 mt-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{message}</span>
          <span className="text-sm text-primary font-semibold">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  );
};

// Simple spinner for inline loading
export const SimpleSpinner = ({ size = 'small', className = '' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8',
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} border-2 border-primary/20 border-t-primary rounded-full ${className}`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
  );
};

// Report-specific loader with document icon
export const ReportLoader = ({
  message = 'Loading report...',
  showProgress = false,
  progress = 0,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <motion.div
        className="relative mb-6"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Animated document icon */}
        <motion.div
          className="w-24 h-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 relative overflow-hidden"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Document header */}
          <div className="w-full h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-lg"></div>

          {/* Animated content lines */}
          <div className="p-3 space-y-2">
            {[1, 2, 3, 4].map(index => (
              <motion.div
                key={index}
                className="h-1.5 bg-gray-300 dark:bg-gray-600 rounded"
                initial={{ width: '0%' }}
                animate={{ width: `${Math.random() * 40 + 60}%` }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  delay: index * 0.2,
                }}
              />
            ))}
          </div>

          {/* Floating sparkles */}
          <motion.div
            className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full"
            animate={{
              scale: [0, 1, 0],
              rotate: [0, 180, 360],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>

        {/* Chart/graph icon overlay */}
        <motion.div
          className="absolute -bottom-2 -right-2 w-12 h-8 bg-green-500 rounded shadow-md flex items-center justify-center"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg className="w-6 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4h14a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1zm1 2v8h12V6H4zm2 6V8h2v4H6zm3-2V9h2v3H9zm3-1v-1h2v2h-2z" />
          </svg>
        </motion.div>
      </motion.div>

      <motion.h3
        className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {message}
      </motion.h3>

      {showProgress && (
        <div className="w-64 mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Processing data...</span>
            <span className="text-sm text-blue-600 font-semibold">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* Animated dots */}
      <motion.div
        className="flex space-x-1 justify-center mt-4"
        initial="initial"
        animate="animate"
        variants={{
          animate: {
            transition: {
              staggerChildren: 0.2,
              repeat: Infinity,
              repeatType: 'loop',
            },
          },
        }}
      >
        {[0, 1, 2].map(index => (
          <motion.div
            key={index}
            className="w-2 h-2 bg-blue-500 rounded-full"
            variants={{
              initial: { y: 0 },
              animate: {
                y: [-4, 0, -4],
                transition: {
                  duration: 0.8,
                  ease: 'easeInOut',
                },
              },
            }}
          />
        ))}
      </motion.div>
    </div>
  );
};

// Assessment-specific loader with brain/puzzle icon
export const AssessmentLoader = ({
  message = 'Processing assessment...',
  stage = 'Analyzing responses',
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <motion.div
        className="relative mb-6"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Animated brain/puzzle icon */}
        <motion.div
          className="w-28 h-28 relative"
          animate={{ rotate: [0, 2, -2, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Brain shape with puzzle pieces */}
          <div className="w-full h-full relative">
            {/* Main brain shape */}
            <motion.div
              className="absolute inset-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Animated puzzle pieces */}
            {[0, 1, 2, 3].map(index => (
              <motion.div
                key={index}
                className={`absolute w-6 h-6 rounded ${
                  index % 2 === 0 ? 'bg-blue-400' : 'bg-green-400'
                }`}
                style={{
                  top: `${20 + index * 15}%`,
                  left: `${15 + index * 20}%`,
                }}
                animate={{
                  y: [0, -2, 0],
                  x: [0, 1, 0],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: index * 0.3,
                }}
              />
            ))}

            {/* Neural network lines */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
              {[0, 1, 2].map(index => (
                <motion.line
                  key={index}
                  x1={20 + index * 20}
                  y1={30}
                  x2={30 + index * 15}
                  y2={70}
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-purple-300"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.6 }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: 'reverse',
                    delay: index * 0.5,
                  }}
                />
              ))}
            </svg>
          </div>

          {/* Orbiting data points */}
          <motion.div
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          >
            {[0, 1, 2, 3].map(index => (
              <motion.div
                key={index}
                className="absolute w-3 h-3 bg-yellow-400 rounded-full"
                style={{
                  top: '50%',
                  left: '50%',
                  transformOrigin: `${(index + 1) * 15}px 0`,
                }}
                animate={{ scale: [1, 1.3, 1] }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: index * 0.25,
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.h3
        className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {message}
      </motion.h3>

      <motion.p
        className="text-sm text-gray-600 dark:text-gray-400 mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {stage}
      </motion.p>

      {/* Stage indicators */}
      <div className="flex space-x-2 mb-4">
        {['Collecting', 'Analyzing', 'Generating'].map((step, index) => (
          <motion.div
            key={step}
            className="flex items-center space-x-1"
            initial={{ opacity: 0.3 }}
            animate={{ opacity: step === stage ? 1 : 0.3 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className={`w-2 h-2 rounded-full ${
                step === stage ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
              animate={step === stage ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">{step}</span>
          </motion.div>
        ))}
      </div>

      {/* Animated dots */}
      <motion.div
        className="flex space-x-1 justify-center"
        initial="initial"
        animate="animate"
        variants={{
          animate: {
            transition: {
              staggerChildren: 0.2,
              repeat: Infinity,
              repeatType: 'loop',
            },
          },
        }}
      >
        {[0, 1, 2].map(index => (
          <motion.div
            key={index}
            className="w-2 h-2 bg-purple-500 rounded-full"
            variants={{
              initial: { y: 0 },
              animate: {
                y: [-4, 0, -4],
                transition: {
                  duration: 0.8,
                  ease: 'easeInOut',
                },
              },
            }}
          />
        ))}
      </motion.div>
    </div>
  );
};

// Summary generator loader
export const SummaryLoader = ({
  message = 'Generating summary...',
  childName = 'Child',
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <motion.div
        className="relative mb-6"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Animated document with writing effect */}
        <motion.div
          className="w-32 h-40 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 relative overflow-hidden"
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Header with child info */}
          <div className="w-full h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-t-lg flex items-center justify-center">
            <span className="text-white text-xs font-semibold">{childName}</span>
          </div>

          {/* Writing animation */}
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map(index => (
              <motion.div
                key={index}
                className="h-1 bg-gray-300 dark:bg-gray-600 rounded"
                initial={{ width: '0%' }}
                animate={{ width: `${60 + Math.random() * 30}%` }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  delay: index * 0.3,
                }}
              />
            ))}
          </div>

          {/* Animated pen/cursor */}
          <motion.div
            className="absolute bottom-4 right-4 w-2 h-6 bg-blue-500 rounded-full"
            animate={{
              x: [0, 4, 0],
              y: [0, -2, 0],
              rotate: [0, 10, 0],
            }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Sparkle effects */}
          {[0, 1, 2].map(index => (
            <motion.div
              key={index}
              className="absolute w-1 h-1 bg-yellow-400 rounded-full"
              style={{
                top: `${20 + index * 15}%`,
                left: `${10 + index * 20}%`,
              }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: index * 0.7,
                ease: 'easeInOut',
              }}
            />
          ))}
        </motion.div>
      </motion.div>

      <motion.h3
        className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {message}
      </motion.h3>

      <motion.p
        className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Creating personalized insights for {childName}
      </motion.p>

      {/* Progress steps */}
      <div className="flex space-x-3 mb-4">
        {['Analyze', 'Process', 'Generate'].map((step, index) => (
          <motion.div
            key={step}
            className="flex flex-col items-center space-y-1"
            initial={{ opacity: 0.3 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.5 }}
          >
            <motion.div
              className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-green-400 flex items-center justify-center"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: index * 0.7 }}
            >
              <span className="text-white text-xs font-bold">{index + 1}</span>
            </motion.div>
            <span className="text-xs text-gray-500 dark:text-gray-400">{step}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default LogoLoader;
