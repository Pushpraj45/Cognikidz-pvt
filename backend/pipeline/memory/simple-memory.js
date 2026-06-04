/**
 * Simple Memory Implementation for Sessions
 * Extracted from graph.js to separate memory management concerns
 */

const { memoryConfig } = require("../config/memory-config");

/**
 * Simple memory implementation for sessions
 * Stores conversation history for LangChain chains
 */
class SimpleMemory {
  constructor() {
    this.messages = [];
    this.maxMessages = memoryConfig.getMaxMessagesPerSession();
  }

  /**
   * Load memory variables for LangChain
   * @returns {Object} Memory variables with history
   */
  async loadMemoryVariables() {
    return {
      history: this.messages.map((m) => `${m.role}: ${m.content}`).join("\n"),
    };
  }

  /**
   * Save context from LangChain interaction
   * @param {Object} input - Input data with input field
   * @param {Object} output - Output data with text field
   */
  async saveContext(input, output) {
    this.messages.push({ role: "user", content: input.input });
    this.messages.push({ role: "assistant", content: output.text });

    // Keep only last N messages to avoid memory bloat
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages);
    }
  }

  /**
   * Clear all messages from memory
   */
  clear() {
    this.messages = [];
  }

  /**
   * Get current message count
   * @returns {number} Number of messages in memory
   */
  getMessageCount() {
    return this.messages.length;
  }

  /**
   * Get all messages
   * @returns {Array} Array of message objects
   */
  getMessages() {
    return [...this.messages]; // Return copy to prevent external modification
  }

  /**
   * Get memory usage info
   * @returns {Object} Memory usage statistics
   */
  getMemoryInfo() {
    return {
      messageCount: this.messages.length,
      maxMessages: this.maxMessages,
      usagePercent: Math.round((this.messages.length / this.maxMessages) * 100),
      memoryFull: this.messages.length >= this.maxMessages
    };
  }
}

module.exports = SimpleMemory; 