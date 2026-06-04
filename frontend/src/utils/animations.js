/**
 * Animation constants and utilities
 *
 * This file contains reusable animation variants, helper functions,
 * and constants for animations throughout the application.
 */

// Common animation variants
export const FADE_IN = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const FADE_UP = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const FADE_DOWN = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
};

export const FADE_LEFT = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

export const FADE_RIGHT = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
};

export const SCALE_IN = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};

export const PULSE = {
  initial: { scale: 1 },
  animate: { scale: [1, 1.03, 1], opacity: [1, 0.9, 1] },
};

// Common delay constants (in seconds)
export const DELAY = {
  NONE: 0,
  SHORT: 0.1,
  MEDIUM: 0.2,
  LONG: 0.3,
};

/**
 * Helper function to calculate staggered delay based on index
 * @param {number} index - The element index in a list
 * @param {number} baseDelay - Base delay before staggering starts
 * @param {number} staggerAmount - Amount of delay between each element
 * @returns {number} - Total delay in seconds
 */
export const getStaggeredDelay = (index, baseDelay = 0, staggerAmount = 0.1) => {
  return baseDelay + index * staggerAmount;
};

/**
 * Check if user prefers reduced motion
 * @returns {boolean} - True if reduced motion is preferred
 */
export const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * AI typing indicator animation
 */
export const aiTypingIndicator = {
  container: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  },
  dots: {
    initial: { y: 0 },
    animate: i => ({
      y: [0, -10, 0],
      transition: {
        duration: 0.8,
        repeat: Infinity,
        repeatType: 'loop',
        delay: i * 0.15,
      },
    }),
  },
};

/**
 * Get hover animation based on accessibility preferences
 * @param {object} options - Animation options
 * @returns {object} - Animation properties
 */
export const getHoverAnimation = (options = {}) => {
  const defaults = {
    scale: 1.02,
    y: -3,
    transition: { duration: 0.2 },
  };

  const settings = { ...defaults, ...options };

  // If user prefers reduced motion, use more subtle animation
  if (prefersReducedMotion()) {
    return {
      whileHover: {
        scale: 1,
        y: 0,
        opacity: 0.9,
        transition: { duration: 0.1 },
      },
    };
  }

  return {
    whileHover: {
      scale: settings.scale,
      y: settings.y,
      transition: settings.transition,
    },
  };
};

// Standard transition classes
export const TRANSITIONS = {
  BUTTON: 'transition-all duration-200 ease-in-out-gentle',
  CARD: 'transition-transform duration-300 ease-decelerate',
  LINK: 'transition-colors duration-200 ease-in-out-gentle',
  HOVER: 'hover:transition-transform duration-200',
};

// Scroll triggered animations
export const SCROLL_ANIMATIONS = {
  FADE_IN: 'animate-on-scroll animate-fade-in',
  FADE_UP: 'animate-on-scroll animate-fade-in-up',
  FADE_DOWN: 'animate-on-scroll animate-fade-in-down',
  FADE_LEFT: 'animate-on-scroll animate-fade-in-left',
  FADE_RIGHT: 'animate-on-scroll animate-fade-in-right',
  SCALE_IN: 'animate-on-scroll animate-scale-in',
};

// AI specific animations
export const AI_ANIMATIONS = {
  TYPING: 'animate-pulse-gentle',
  THINKING: 'animate-shimmer',
  APPEARING: 'animate-fade-in-up delay-300',
};

// Create a named object for the default export
const animations = {
  FADE_IN,
  FADE_UP,
  FADE_DOWN,
  FADE_LEFT,
  FADE_RIGHT,
  SCALE_IN,
  PULSE,
  DELAY,
  getStaggeredDelay,
  prefersReducedMotion,
  aiTypingIndicator,
  getHoverAnimation,
  TRANSITIONS,
  SCROLL_ANIMATIONS,
  AI_ANIMATIONS,
};

export default animations;
