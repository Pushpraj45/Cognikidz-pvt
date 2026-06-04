import React, { createContext, useState, useContext, useCallback, useRef } from 'react';
import Toast from '../components/ui/Toast';

// Create context
export const ToastContext = createContext(null);

// Hook to use toast context
export const useToast = () => {
  return useContext(ToastContext);
};

// Toast provider component
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const toastsQueue = useRef([]);
  const processingQueue = useRef(false);
  const toastCounter = useRef(0);

  // Generate a unique ID for each toast
  const generateUniqueId = () => {
    const timestamp = Date.now();
    toastCounter.current += 1;
    return `toast-${timestamp}-${toastCounter.current}`;
  };

  // Process the queue of toasts to prevent overwhelming the UI
  const processQueue = useCallback(() => {
    if (processingQueue.current || toastsQueue.current.length === 0) {
      return;
    }

    processingQueue.current = true;
    const nextToast = toastsQueue.current.shift();

    setToasts(prevToasts => [...prevToasts, nextToast]);

    setTimeout(() => {
      processingQueue.current = false;
      processQueue();
    }, 300);
  }, []);

  // Add a toast notification
  const showToast = useCallback(
    (message, type = 'INFO', duration = 3000) => {
      const id = generateUniqueId();
      const toast = { id, message, type, duration };

      setToasts(prevToasts => {
        // If more than 3 toasts are visible, add to queue instead
        if (prevToasts.length >= 3) {
          toastsQueue.current.push(toast);
          processQueue();
          return prevToasts;
        } else {
          return [...prevToasts, toast];
        }
      });

      return id; // Return ID so it can be used to dismiss toast if needed
    },
    [processQueue] // Remove toasts.length dependency to prevent infinite re-creation
  );

  // Helper functions for common toast types
  const success = useCallback(
    (message, duration) => showToast(message, 'SUCCESS', duration),
    [showToast]
  );
  const error = useCallback(
    (message, duration) => showToast(message, 'ERROR', duration),
    [showToast]
  );
  const info = useCallback(
    (message, duration) => showToast(message, 'INFO', duration),
    [showToast]
  );
  const warning = useCallback(
    (message, duration) => showToast(message, 'WARNING', duration),
    [showToast]
  );

  // Dismiss a toast by ID
  const dismissToast = useCallback(
    id => {
      setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
      // Process the next toast from the queue if any
      setTimeout(processQueue, 300);
    },
    [processQueue]
  );

  // Dismiss all toasts
  const clearToasts = useCallback(() => {
    setToasts([]);
    toastsQueue.current = [];
    processingQueue.current = false;
  }, []);

  // Create the context value with all the functions and state
  const value = {
    showToast,
    success,
    error,
    info,
    warning,
    dismissToast,
    clearToasts,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => dismissToast(toast.id)}
        />
      ))}
    </ToastContext.Provider>
  );
};

export default ToastProvider;
