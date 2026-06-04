/**
 * Memory Index
 * Central export point for all memory management modules
 */

// Import memory modules
const SimpleMemory = require('./simple-memory');
const sessionManager = require('./session-manager');
const memoryCleaner = require('./memory-cleaner');

/**
 * Initialize memory management system
 */
function initializeMemoryManagement() {
  // Start memory cleanup interval
  memoryCleaner.MemoryCleaner.startCleanupInterval();
  console.log('🧠 Memory management initialized');
}

/**
 * Get memory system status
 * @returns {Object} - Memory status
 */
function getMemoryStatus() {
  return {
    activeSessions: sessionManager.getActiveSessionCount ? sessionManager.getActiveSessionCount() : 0,
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime(),
  };
}

/**
 * Clean up all sessions
 * @returns {Promise<void>}
 */
async function cleanupAllSessions() {
  if (sessionManager.cleanupAllSessions) {
    return sessionManager.cleanupAllSessions();
  }
  // Fallback cleanup
  return memoryCleaner.MemoryCleaner.cleanupAllSessions();
}

module.exports = {
  // Memory modules
  SimpleMemory,
  sessionManager,
  memoryCleaner,
  
  // Re-export key functions for convenience
  getSessionMemory: sessionManager.SessionManager.getSessionMemory,
  cleanupSessionMemory: sessionManager.SessionManager.cleanupSessionMemory,
  getStateCache: sessionManager.SessionManager.getCachedState,
  updateStateCache: sessionManager.SessionManager.setCachedState,
  cleanupMemory: memoryCleaner.MemoryCleaner.cleanupMemory,
  
  // System functions
  initializeMemoryManagement,
  getMemoryStatus,
  cleanupAllSessions,
}; 