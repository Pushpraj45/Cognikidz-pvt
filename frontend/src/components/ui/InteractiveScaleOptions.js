import React, { useState } from 'react';
import { motion } from 'framer-motion';

const InteractiveScaleOptions = ({
  options = ['1', '2', '3', '4', '5'],
  optionLabels = ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
  selectedValue = null,
  onSelect,
  disabled = false,
  className = '',
  language = 'en',
}) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Get labels based on language - but only if we're sure questions are in that language
  // For now, keep English as default to avoid mixed-language confusion
  const getLocalizedLabels = () => {
    // Only show Hindi labels if we're confident the questions are also in Hindi
    // Since questions are currently in English, keep scale options in English for consistency
    if (language === 'hi' && false) {
      // Temporarily disabled to fix mixed-language issue
      return ['कभी नहीं', 'बहुत कम', 'कभी-कभी', 'अक्सर', 'हमेशा'];
    }
    // Default to English labels for consistency with English questions
    return ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'];
  };

  const localizedLabels = getLocalizedLabels();

  const handleOptionClick = value => {
    if (!disabled && onSelect) {
      onSelect(value);
    }
  };

  const getOptionColor = (index, isSelected, isHovered) => {
    if (isSelected) {
      return 'bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 text-white shadow-xl shadow-blue-500/25 dark:shadow-blue-500/40';
    }
    if (isHovered) {
      return 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-800 dark:text-gray-200 shadow-lg border-2 border-blue-300 dark:border-blue-500';
    }
    return 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 shadow-md hover:shadow-lg';
  };

  const getLabelColor = (index, isSelected) => {
    if (isSelected) {
      return 'text-blue-600 dark:text-blue-400 font-semibold';
    }
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Enhanced Header with better typography */}
      <div className="text-center mb-8">
        <motion.h3
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3"
        >
          Select a Number:
        </motion.h3>
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed"
        >
          Choose one of the numbers below (1-5)
        </motion.p>
      </div>

      {/* Enhanced Options Grid with better spacing and animations */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {options.map((option, index) => {
          const isSelected = selectedValue === option;
          const isHovered = hoveredIndex === index;

          return (
            <motion.div
              key={option}
              className={`relative group cursor-pointer transition-all duration-300 ${
                disabled ? 'cursor-not-allowed opacity-60' : ''
              }`}
              onClick={() => handleOptionClick(option)}
              onMouseEnter={() => !disabled && setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={!disabled ? { scale: 1.08, y: -5 } : {}}
              whileTap={!disabled ? { scale: 0.95 } : {}}
            >
              {/* Enhanced Option Circle with better gradients and shadows */}
              <motion.div
                className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-3xl font-bold transition-all duration-300 ${getOptionColor(index, isSelected, isHovered)}`}
                whileHover={!disabled ? { rotate: [0, -5, 5, 0] } : {}}
                animate={
                  isSelected
                    ? {
                        scale: [1, 1.05, 1],
                        rotate: [0, 2, -2, 0],
                      }
                    : {}
                }
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                {option}
              </motion.div>

              {/* Enhanced Label with better typography */}
              <div className="mt-3 text-center">
                <motion.span
                  className={`text-xs font-medium transition-colors duration-300 ${getLabelColor(index, isSelected)}`}
                  animate={isSelected ? { scale: 1.1 } : { scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {localizedLabels[index] || option}
                </motion.span>
              </div>

              {/* Enhanced Selection Indicator with better animation */}
              {isSelected && (
                <motion.div
                  className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg"
                  initial={{ scale: 0, rotate: -180, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  <motion.svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </motion.svg>
                </motion.div>
              )}

              {/* Enhanced Hover Effect with better visual feedback */}
              {isHovered && !disabled && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 opacity-30"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.3 }}
                  transition={{ duration: 0.3 }}
                />
              )}

              {/* Pulse effect for selected option */}
              {isSelected && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-blue-400/20"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Removed the scale description text as requested */}
    </div>
  );
};

export default InteractiveScaleOptions;
