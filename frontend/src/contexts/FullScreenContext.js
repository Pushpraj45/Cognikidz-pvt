import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import fullScreenService from '../services/FullScreenService';

const FullScreenContext = createContext();

export const useFullScreen = () => {
  const context = useContext(FullScreenContext);
  if (!context) {
    throw new Error('useFullScreen must be used within a FullScreenProvider');
  }
  return context;
};

export const FullScreenProvider = ({ children, autoEnter = false, targetElement = null }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasAttemptedAutoEnter, setHasAttemptedAutoEnter] = useState(false);

  // Initialize full-screen state
  useEffect(() => {
    const state = fullScreenService.getFullScreenState();
    setIsFullScreen(state.isFullScreen);
    setIsSupported(state.supported);

    // Set up listener for state changes
    const unsubscribe = fullScreenService.addListener(state => {
      setIsFullScreen(state.isFullScreen);
      setError(null);
    });

    return unsubscribe;
  }, []);

  // Reset auto-enter flag when autoEnter prop changes
  useEffect(() => {
    if (!autoEnter) {
      setHasAttemptedAutoEnter(false);
    }
  }, [autoEnter]);

  // Auto-enter full-screen if enabled
  useEffect(() => {
    if (autoEnter && isSupported && !isFullScreen && !hasAttemptedAutoEnter) {
      const enterFullScreen = async () => {
        setIsLoading(true);
        setError(null);
        setHasAttemptedAutoEnter(true);

        try {
          // Check if we have a valid target element
          if (!targetElement) {
            setError('No target element available');
            setIsLoading(false);
            return;
          }

          const success = await fullScreenService.enterFullScreen(targetElement);
          if (!success) {
            setError('Failed to enter full-screen mode. Try clicking the full-screen button.');
          }
        } catch (err) {
          setError('Error entering full-screen mode');
          console.error('Full-screen auto-enter error:', err);
        } finally {
          setIsLoading(false);
        }
      };

      // Add a small delay to ensure the element is properly mounted
      const timer = setTimeout(enterFullScreen, 500);
      return () => clearTimeout(timer);
    }
  }, [autoEnter, isSupported, isFullScreen, targetElement, hasAttemptedAutoEnter]);

  // Enter full-screen mode
  const enterFullScreen = useCallback(
    async (element = null) => {
      if (!isSupported) {
        setError('Full-screen is not supported in this browser');
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        const success = await fullScreenService.enterFullScreen(element || targetElement);
        if (!success) {
          setError('Failed to enter full-screen mode');
        }
        return success;
      } catch (err) {
        setError('Error entering full-screen mode');
        console.error('Full-screen enter error:', err);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [isSupported, targetElement]
  );

  // Exit full-screen mode
  const exitFullScreen = useCallback(async () => {
    if (!isSupported) {
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const success = await fullScreenService.exitFullScreen();
      if (!success) {
        setError('Failed to exit full-screen mode');
      } else {
        // Reset the auto-enter flag when user manually exits
        setHasAttemptedAutoEnter(true);
      }
      return success;
    } catch (err) {
      setError('Error exiting full-screen mode');
      console.error('Full-screen exit error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // Toggle full-screen mode
  const toggleFullScreen = useCallback(
    async (element = null) => {
      if (isFullScreen) {
        return await exitFullScreen();
      } else {
        return await enterFullScreen(element);
      }
    },
    [isFullScreen, enterFullScreen, exitFullScreen]
  );

  // Manual trigger for full-screen (for user-initiated actions)
  const triggerFullScreen = useCallback(async () => {
    if (!isSupported) {
      setError('Full-screen is not supported in this browser');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const success = await fullScreenService.enterFullScreen(targetElement);
      if (!success) {
        setError('Failed to enter full-screen mode');
      }
      return success;
    } catch (err) {
      setError('Error entering full-screen mode');
      console.error('Full-screen manual trigger error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, targetElement]);

  // Get current state
  const getState = useCallback(() => {
    return fullScreenService.getFullScreenState();
  }, []);

  const value = {
    // State
    isFullScreen,
    isSupported,
    isLoading,
    error,

    // Actions
    enterFullScreen,
    exitFullScreen,
    toggleFullScreen,
    triggerFullScreen,
    getState,

    // Utility
    clearError: () => setError(null),
    resetAutoEnter: () => setHasAttemptedAutoEnter(false),
  };

  return <FullScreenContext.Provider value={value}>{children}</FullScreenContext.Provider>;
};

export default FullScreenContext;
