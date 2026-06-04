/**
 * Session Management
 * Extracted from graph.js to centralize session handling
 */

const SimpleMemory = require("./simple-memory");
const { memoryConfig } = require("../config/memory-config");

// Memory management for session data (from graph.js lines ~129-131)
const sessionMemory = {};
const stateCache = {};

/**
 * Session Manager Class
 * Handles session memory and state caching
 */
class SessionManager {
  /**
   * Get or create session-specific memory for LangChain
   * Extracted from graph.js lines ~205-220
   * @param {string} sessionId - The session ID
   * @returns {SimpleMemory} - Memory instance for the session
   */
  static getSessionMemory(sessionId) {
    if (!sessionMemory[sessionId]) {
      console.log(`Creating new memory for session: ${sessionId}`);
      sessionMemory[sessionId] = {
        memory: new SimpleMemory(),
        lastAccess: Date.now(),
      };
    } else {
      // Update last access time
      sessionMemory[sessionId].lastAccess = Date.now();
    }

    return sessionMemory[sessionId].memory;
  }

  /**
   * Clean up session memory when assessment is complete
   * Extracted from graph.js lines ~224-227
   * @param {string} sessionId - The session ID to clean up
   */
  static cleanupSessionMemory(sessionId) {
    console.log(`Cleaning up memory for completed session: ${sessionId}`);
    delete sessionMemory[sessionId];
    delete stateCache[sessionId];
  }

  /**
   * Get session state from cache
   * @param {string} sessionId - The session ID
   * @returns {Object|null} - Cached state or null
   */
  static getCachedState(sessionId) {
    return stateCache[sessionId] || null;
  }

  /**
   * Set session state in cache
   * @param {string} sessionId - The session ID
   * @param {Object} state - The state to cache
   */
  static setCachedState(sessionId, state) {
    stateCache[sessionId] = state;
  }

  /**
   * Remove session state from cache
   * @param {string} sessionId - The session ID
   */
  static removeCachedState(sessionId) {
    delete stateCache[sessionId];
  }

  /**
   * Check if session exists
   * @param {string} sessionId - The session ID
   * @returns {boolean} - True if session exists
   */
  static sessionExists(sessionId) {
    return sessionMemory[sessionId] !== undefined;
  }

  /**
   * Get session info
   * @param {string} sessionId - The session ID
   * @returns {Object|null} - Session information or null
   */
  static getSessionInfo(sessionId) {
    const session = sessionMemory[sessionId];
    if (!session) return null;

    return {
      sessionId,
      lastAccess: session.lastAccess,
      memoryInfo: session.memory.getMemoryInfo(),
      hasCache: stateCache[sessionId] !== undefined
    };
  }

  /**
   * Get all active sessions
   * @returns {Array} - Array of session IDs
   */
  static getActiveSessions() {
    return Object.keys(sessionMemory);
  }

  /**
   * Get session count
   * @returns {number} - Number of active sessions
   */
  static getSessionCount() {
    return Object.keys(sessionMemory).length;
  }

  /**
   * Get memory usage statistics
   * @returns {Object} - Memory usage stats
   */
  static getMemoryStats() {
    const sessionCount = Object.keys(sessionMemory).length;
    const cacheCount = Object.keys(stateCache).length;
    const maxSessions = memoryConfig.getMaxSessions();

    return {
      activeSessions: sessionCount,
      cachedStates: cacheCount,
      maxSessions,
      usagePercent: Math.round((sessionCount / maxSessions) * 100),
      memoryFull: sessionCount >= maxSessions
    };
  }

  /**
   * Update session last access time
   * @param {string} sessionId - The session ID
   */
  static updateLastAccess(sessionId) {
    if (sessionMemory[sessionId]) {
      sessionMemory[sessionId].lastAccess = Date.now();
    }
  }

  /**
   * Clear all sessions (useful for testing)
   */
  static clearAllSessions() {
    Object.keys(sessionMemory).forEach(sessionId => {
      delete sessionMemory[sessionId];
    });
    Object.keys(stateCache).forEach(sessionId => {
      delete stateCache[sessionId];
    });
  }
}

module.exports = {
  SessionManager,
  sessionMemory,  // Export for cleanup functions
  stateCache      // Export for cleanup functions
}; 