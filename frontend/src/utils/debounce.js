/**
 * Debounce function to limit the rate at which a function can fire
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @param {boolean} immediate - Whether to trigger the function on the leading edge
 * @returns {Function} - The debounced function
 */
export const debounce = (func, wait, immediate = false) => {
  let timeout;

  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };

    const callNow = immediate && !timeout;

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func(...args);
  };
};

/**
 * Throttle function to limit the rate at which a function can fire
 * @param {Function} func - The function to throttle
 * @param {number} limit - The number of milliseconds to wait between calls
 * @returns {Function} - The throttled function
 */
export const throttle = (func, limit) => {
  let inThrottle;

  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Create a request cache with TTL (Time To Live)
 * @param {number} ttl - Time to live in milliseconds
 * @returns {Object} - Cache object with get, set, and clear methods
 */
export const createRequestCache = (ttl = 5 * 60 * 1000) => {
  // 5 minutes default
  const cache = new Map();

  return {
    get: key => {
      const item = cache.get(key);
      if (!item) return null;

      if (Date.now() > item.expiry) {
        cache.delete(key);
        return null;
      }

      return item.data;
    },

    set: (key, data) => {
      cache.set(key, {
        data,
        expiry: Date.now() + ttl,
      });
    },

    clear: () => {
      cache.clear();
    },

    delete: key => {
      cache.delete(key);
    },
  };
};
