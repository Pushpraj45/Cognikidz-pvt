import React, { useState, useEffect, useRef, memo } from 'react';

// Type options for the toast
const TOAST_TYPES = {
  SUCCESS: {
    bg: 'bg-green-100 dark:bg-green-800/30',
    text: 'text-green-800 dark:text-green-400',
    border: 'border-green-300 dark:border-green-600',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  ERROR: {
    bg: 'bg-red-100 dark:bg-red-800/30',
    text: 'text-red-800 dark:text-red-400',
    border: 'border-red-300 dark:border-red-600',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  INFO: {
    bg: 'bg-blue-100 dark:bg-blue-800/30',
    text: 'text-blue-800 dark:text-blue-400',
    border: 'border-blue-300 dark:border-blue-600',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  WARNING: {
    bg: 'bg-yellow-100 dark:bg-yellow-800/30',
    text: 'text-yellow-800 dark:text-yellow-500',
    border: 'border-yellow-300 dark:border-yellow-600',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
};

const Toast = ({ message, type = 'INFO', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const toastStyle = TOAST_TYPES[type] || TOAST_TYPES.INFO;
  const timerRef = useRef(null);

  useEffect(() => {
    // Start entrance animation
    setIsAnimating(true);

    // Only set up timer if duration is valid
    if (duration && duration > 0) {
      // Clear any existing timers first
      if (timerRef.current) clearTimeout(timerRef.current);

      // Set up the timeout to hide the toast
      timerRef.current = setTimeout(() => {
        handleClose();
      }, duration);
    }

    // Cleanup function to clear timers if component unmounts
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [duration]);

  const handleClose = e => {
    // Prevent event bubbling if called from click
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Clear any existing timers
    if (timerRef.current) clearTimeout(timerRef.current);

    setIsAnimating(false);
    setIsVisible(false);

    // Call onClose after animation completes
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  };

  // Handle click on the entire toast to dismiss (optional)
  const handleToastClick = e => {
    // Only dismiss if clicking on the toast itself, not the close button
    if (e.target === e.currentTarget || e.target.closest('.toast-content')) {
      handleClose(e);
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={`
        fixed top-4 right-4 left-4 md:top-6 md:right-6 md:left-auto md:max-w-sm z-50 
        flex items-center p-4 rounded-lg shadow-lg border backdrop-blur-sm cursor-pointer
        transition-all duration-300 ease-in-out
        ${toastStyle.bg} ${toastStyle.border}
        ${isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
      `}
      role="alert"
      onClick={handleToastClick}
      style={{
        transform: isAnimating ? 'translateY(0)' : 'translateY(-16px)',
        opacity: isAnimating ? 1 : 0,
      }}
    >
      <div className={`flex-shrink-0 mr-3 ${toastStyle.text}`}>{toastStyle.icon}</div>
      <div className={`flex-1 ${toastStyle.text} font-medium text-sm toast-content`}>{message}</div>
      <button
        type="button"
        className="ml-4 inline-flex flex-shrink-0 justify-center items-center h-6 w-6 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-gray-600"
        onClick={handleClose}
        aria-label="Close"
      >
        <span className="sr-only">Close</span>
        <svg
          className="w-4 h-4"
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
      </button>
    </div>
  );
};

// Use React.memo to prevent unnecessary re-renders
export default memo(Toast);
