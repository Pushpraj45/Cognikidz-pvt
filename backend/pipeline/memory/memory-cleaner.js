/**
 * Memory Cleanup Management
 * Extracted from graph.js to centralize memory cleanup operations
 */

const { memoryConfig } = require("../config/memory-config");
const { sessionMemory, stateCache } = require("./session-manager");

/**
 * Memory Cleaner Class
 * Handles automatic cleanup of expired sessions and memory management
 */
class MemoryCleaner {
  constructor() {
    this.cleanupIntervalId = null;
    this.isRunning = false;
  }

  /**
   * Session cleanup function
   * Extracted from graph.js lines ~152-201
   */
  static cleanupMemory() {
    const now = Date.now();
    const sessionKeys = Object.keys(sessionMemory);
    let cleanedCount = 0;
    const sessionTimeout = memoryConfig.getSessionTimeout();
    const maxSessions = memoryConfig.getMaxSessions();

    console.log(
      `Starting memory cleanup. Current sessions: ${sessionKeys.length}`
    );

    // Clean up expired sessions
    sessionKeys.forEach((sessionId) => {
      const session = sessionMemory[sessionId];
      if (
        session &&
        session.lastAccess &&
        now - session.lastAccess > sessionTimeout
      ) {
        delete sessionMemory[sessionId];
        delete stateCache[sessionId];
        cleanedCount++;
      }
    });

    // If we still have too many sessions, remove the oldest ones
    const remainingSessions = Object.keys(sessionMemory);
    if (remainingSessions.length > maxSessions) {
      const sortedSessions = remainingSessions
        .map((id) => ({ id, lastAccess: sessionMemory[id]?.lastAccess || 0 }))
        .sort((a, b) => a.lastAccess - b.lastAccess);

      const sessionsToRemove = sortedSessions.slice(
        0,
        remainingSessions.length - maxSessions
      );
      sessionsToRemove.forEach((session) => {
        delete sessionMemory[session.id];
        delete stateCache[session.id];
        cleanedCount++;
      });
    }

    console.log(
      `Memory cleanup completed. Removed ${cleanedCount} sessions. Remaining: ${Object.keys(sessionMemory).length}`
    );

    return {
      cleanedCount,
      remainingSessions: Object.keys(sessionMemory).length,
      timestamp: now
    };
  }

  /**
   * Start automatic memory cleanup interval
   * Extracted from graph.js line ~203
   */
  static startCleanupInterval() {
    if (this.cleanupIntervalId) {
      console.warn("Memory cleanup interval already running");
      return this.cleanupIntervalId;
    }

    const interval = memoryConfig.getCleanupInterval();
    this.cleanupIntervalId = setInterval(() => {
      MemoryCleaner.cleanupMemory();
    }, interval);

    // Update config with interval ID
    memoryConfig.setCleanupIntervalId(this.cleanupIntervalId);
    this.isRunning = true;

    console.log(`Memory cleanup interval started (every ${interval / 1000}s)`);
    return this.cleanupIntervalId;
  }

  /**
   * Stop automatic memory cleanup interval
   */
  static stopCleanupInterval() {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      memoryConfig.clearCleanupInterval();
      this.cleanupIntervalId = null;
      this.isRunning = false;
      console.log("Memory cleanup interval stopped");
      return true;
    }
    return false;
  }

  /**
   * Force cleanup of specific session
   * @param {string} sessionId - Session to cleanup
   */
  static cleanupSession(sessionId) {
    if (sessionMemory[sessionId]) {
      delete sessionMemory[sessionId];
      delete stateCache[sessionId];
      console.log(`Manually cleaned up session: ${sessionId}`);
      return true;
    }
    return false;
  }

  /**
   * Force cleanup of all sessions
   */
  static cleanupAllSessions() {
    const sessionCount = Object.keys(sessionMemory).length;
    const cacheCount = Object.keys(stateCache).length;

    // Clear all sessions and cache
    Object.keys(sessionMemory).forEach(sessionId => {
      delete sessionMemory[sessionId];
    });
    Object.keys(stateCache).forEach(sessionId => {
      delete stateCache[sessionId];
    });

    console.log(`Force cleanup: Removed ${sessionCount} sessions and ${cacheCount} cached states`);
    
    return {
      sessionsRemoved: sessionCount,
      cacheEntriesRemoved: cacheCount
    };
  }

  /**
   * Get cleanup status
   */
  static getCleanupStatus() {
    return {
      isRunning: this.isRunning,
      intervalId: this.cleanupIntervalId,
      nextCleanup: this.cleanupIntervalId ? Date.now() + memoryConfig.getCleanupInterval() : null,
      config: memoryConfig.getConfig()
    };
  }

  /**
   * Get expired sessions (for manual inspection)
   */
  static getExpiredSessions() {
    const now = Date.now();
    const sessionTimeout = memoryConfig.getSessionTimeout();
    const expiredSessions = [];

    Object.keys(sessionMemory).forEach(sessionId => {
      const session = sessionMemory[sessionId];
      if (session && session.lastAccess && (now - session.lastAccess > sessionTimeout)) {
        expiredSessions.push({
          sessionId,
          lastAccess: session.lastAccess,
          ageInMs: now - session.lastAccess
        });
      }
    });

    return expiredSessions;
  }
}

// Auto-start cleanup interval when module is loaded (matching original behavior)
MemoryCleaner.startCleanupInterval();

module.exports = {
  MemoryCleaner
}; 