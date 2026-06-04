/**
 * Memory Management Configuration
 * Extracted from graph.js to centralize memory settings
 */

const { MEMORY_CONFIG } = require("./constants");

/**
 * Memory Configuration Class
 */
class MemoryConfig {
  constructor() {
    this.cleanupInterval = MEMORY_CONFIG.CLEANUP_INTERVAL;
    this.sessionTimeout = MEMORY_CONFIG.SESSION_TIMEOUT;
    this.maxSessions = MEMORY_CONFIG.MAX_SESSIONS;
    this.maxMessagesPerSession = MEMORY_CONFIG.MAX_MESSAGES_PER_SESSION;
    this.cleanupIntervalId = null;
  }

  /**
   * Get cleanup interval in milliseconds
   */
  getCleanupInterval() {
    return this.cleanupInterval;
  }

  /**
   * Get session timeout in milliseconds
   */
  getSessionTimeout() {
    return this.sessionTimeout;
  }

  /**
   * Get maximum number of concurrent sessions
   */
  getMaxSessions() {
    return this.maxSessions;
  }

  /**
   * Get maximum messages per session
   */
  getMaxMessagesPerSession() {
    return this.maxMessagesPerSession;
  }

  /**
   * Set cleanup interval ID for tracking
   */
  setCleanupIntervalId(intervalId) {
    this.cleanupIntervalId = intervalId;
    return this;
  }

  /**
   * Get cleanup interval ID
   */
  getCleanupIntervalId() {
    return this.cleanupIntervalId;
  }

  /**
   * Clear cleanup interval
   */
  clearCleanupInterval() {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }
    return this;
  }

  /**
   * Update configuration
   */
  updateConfig(config) {
    if (config.cleanupInterval) this.cleanupInterval = config.cleanupInterval;
    if (config.sessionTimeout) this.sessionTimeout = config.sessionTimeout;
    if (config.maxSessions) this.maxSessions = config.maxSessions;
    if (config.maxMessagesPerSession) this.maxMessagesPerSession = config.maxMessagesPerSession;
    return this;
  }

  /**
   * Get all configuration as object
   */
  getConfig() {
    return {
      cleanupInterval: this.cleanupInterval,
      sessionTimeout: this.sessionTimeout,
      maxSessions: this.maxSessions,
      maxMessagesPerSession: this.maxMessagesPerSession
    };
  }

  /**
   * Validate configuration values
   */
  validate() {
    if (this.cleanupInterval <= 0) {
      throw new Error("Cleanup interval must be positive");
    }
    if (this.sessionTimeout <= 0) {
      throw new Error("Session timeout must be positive");
    }
    if (this.maxSessions <= 0) {
      throw new Error("Max sessions must be positive");
    }
    if (this.maxMessagesPerSession <= 0) {
      throw new Error("Max messages per session must be positive");
    }
    return true;
  }
}

// Create singleton instance
const memoryConfig = new MemoryConfig();

module.exports = {
  MemoryConfig,
  memoryConfig
}; 