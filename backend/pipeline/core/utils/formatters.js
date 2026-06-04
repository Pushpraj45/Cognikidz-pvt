/**
 * Data formatting utilities
 * Handles formatting of dates, durations, and other data types
 */

/**
 * Calculate duration between two timestamps
 * @param {string} startTime - Start timestamp
 * @param {string} endTime - End timestamp
 * @returns {string} - Duration in human-readable format
 */
function calculateDuration(startTime, endTime) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const durationMs = end - start;
  
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  
  return `${minutes}m ${seconds}s`;
}

module.exports = {
  calculateDuration,
}; 