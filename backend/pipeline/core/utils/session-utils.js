/**
 * Session management utilities
 * Handles session ID generation and cleanup scheduling
 */

const { SessionManager } = require('../../memory/session-manager');

/**
 * Generate unique session ID
 * @returns {string} - Unique session identifier
 */
function generateSessionId() {
  // Use a combination of timestamp, random number, and process info for uniqueness
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  const processId = process.pid || Math.floor(Math.random() * 10000);
  const counter = generateSessionId.counter || 0;
  generateSessionId.counter = (counter + 1) % 10000;
  
  return `session_${timestamp}_${processId}_${counter}_${random}`;
}

/**
 * Schedule session cleanup after delay
 * @param {string} sessionId - Session to cleanup
 */
function scheduleSessionCleanup(sessionId) {
  // Cleanup after 1 hour, but use unref() to prevent hanging
  const timeoutId = setTimeout(() => {
    SessionManager.cleanupSessionMemory(sessionId);
  }, 60 * 60 * 1000);
  
  // Prevent this timeout from keeping the process alive
  timeoutId.unref();
}

module.exports = {
  generateSessionId,
  scheduleSessionCleanup,
}; 