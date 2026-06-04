import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFullScreen } from '../../contexts/FullScreenContext';

const FullScreenButton = ({
  position = 'top-right',
  showLabel = true,
  className = '',
  size = 'medium',
  variant = 'primary',
}) => {
  const { isFullScreen, isSupported, isLoading, exitFullScreen, enterFullScreen } = useFullScreen();
  const [isVisible, setIsVisible] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);

  // Hide button after inactivity (only when in full-screen mode)
  useEffect(() => {
    if (!isFullScreen) {
      setIsVisible(true);
      return;
    }

    let timeout;
    const handleMouseMove = () => {
      setIsVisible(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setIsVisible(false), 3000);
    };

    const handleKeyPress = () => {
      setIsVisible(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setIsVisible(false), 3000);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keydown', handleKeyPress);

    // Show button initially
    setIsVisible(true);
    timeout = setTimeout(() => setIsVisible(false), 3000);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyPress);
      clearTimeout(timeout);
    };
  }, [isFullScreen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = e => {
      if (e.key === 'Escape' && isFullScreen) {
        exitFullScreen();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isFullScreen, exitFullScreen]);

  const handleToggleFullScreen = async () => {
    console.log('FullScreenButton: handleToggleFullScreen called', { isFullScreen, isLoading });
    if (isLoading) return;
    if (isFullScreen) {
      console.log('FullScreenButton: Attempting to exit full-screen');
      await exitFullScreen();
    } else {
      console.log('FullScreenButton: Attempting to enter full-screen');
      await enterFullScreen();
    }
  };

  // Don't render if not supported
  if (!isSupported) {
    return null;
  }

  // Position classes
  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      default:
        return 'top-4 right-4';
    }
  };

  // Size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-8 h-8 text-sm';
      case 'large':
        return 'w-12 h-12 text-lg';
      default:
        return 'w-10 h-10 text-base';
    }
  };

  // Variant classes
  const getVariantClasses = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-gray-600 hover:bg-gray-700 text-white';
      case 'outline':
        return 'bg-transparent border-2 border-white text-white hover:bg-white hover:text-gray-900';
      case 'minimal':
        return 'bg-black bg-opacity-50 hover:bg-opacity-70 text-white';
      default:
        return 'bg-red-500 hover:bg-red-600 text-white';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={`fixed z-50 ${getPositionClasses()} ${className}`}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <motion.button
            onClick={handleToggleFullScreen}
            disabled={isLoading}
            className={`
              ${getSizeClasses()} 
              ${getVariantClasses()}
              rounded-full shadow-lg
              flex items-center justify-center
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50
              disabled:opacity-50 disabled:cursor-not-allowed
              backdrop-blur-sm
            `}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
              />
            ) : isFullScreen ? (
              <svg
                className="w-5 h-5"
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
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
            )}
          </motion.button>

          {/* Tooltip */}
          <AnimatePresence>
            {showTooltip && showLabel && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2"
              >
                <div className="bg-black bg-opacity-90 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  {isFullScreen ? 'Exit Full Screen (Esc)' : 'Enter Full Screen'}
                </div>
                <div className="w-2 h-2 bg-black bg-opacity-90 transform rotate-45 absolute -top-1 left-1/2 -translate-x-1/2"></div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FullScreenButton;
