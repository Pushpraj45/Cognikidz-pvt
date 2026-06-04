/**
 * System Constants and Configuration Values
 * Extracted from graph.js to centralize configuration
 */

// Memory Management Constants
const MEMORY_CONFIG = {
  CLEANUP_INTERVAL: 5 * 60 * 1000, // 5 minutes
  SESSION_TIMEOUT: 45 * 60 * 1000, // Increased to 45 minutes for longer assessments
  MAX_SESSIONS: 100, // Maximum concurrent sessions
  MAX_MESSAGES_PER_SESSION: 30, // Increased message history for longer assessments
};

// Assessment Configuration
const ASSESSMENT_CONFIG = {
  GENERAL_QUESTION_COUNT: 15, // Increased for comprehensive screening
  SPECIFIC_QUESTION_COUNT: 15, // Increased for disorder-specific depth
  TEMPERATURE: 0.7,
  API_VERSION: "2024-02-01",
};

// Assessment Types
const ASSESSMENT_TYPES = {
  AUTISM: "Autism",
  ASD: "Autism", // Alias for autism
  ADHD: "ADHD",
  DYSLEXIA: "Dyslexia",
  GENERAL: "General",
};

// Question Types
const QUESTION_TYPES = {
  SCALE: "SCALE",
  MCQ: "MCQ",
  TEXT: "TEXT",
  BINARY: "BINARY",
};

// Response Options
const RESPONSE_OPTIONS = {
  FREQUENCY_SCALE: ["Never", "Rarely", "Sometimes", "Often", "Always"],
  BINARY: ["Yes", "No"],
  SEVERITY_SCALE: ["Not at all", "A little", "Quite a bit", "Very much"],
};

// Error Messages
const ERROR_MESSAGES = {
  MISSING_API_KEY: "AZURE_OPENAI_API_KEY environment variable is required",
  MISSING_ENDPOINT: "AZURE_OPENAI_ENDPOINT environment variable is required",
  SESSION_NOT_FOUND: "Assessment session not found",
  QUESTION_NOT_FOUND: (questionId, sessionId) =>
    `Question ${questionId} not found in session ${sessionId}`,
  INVALID_RESPONSE: "Invalid response provided",
  STATE_LOAD_ERROR:
    "Could not load assessment state and no cached state available",
};

// Log Levels
const LOG_LEVELS = {
  ERROR: "error",
  WARN: "warn",
  INFO: "info",
  DEBUG: "debug",
};

// Default Values
const DEFAULTS = {
  CHILD_NAME: "your child",
  AGE: 5,
  ABILITY_ESTIMATE: 5,
  DIFFICULTY: 3,
  ASSESSMENT_TYPE: ASSESSMENT_TYPES.GENERAL,
  DEPLOYMENT_NAME: "prgya-gpt-4o-mini",
  LANGCHAIN_PROJECT: "cognikidz-assessments",
  LANGCHAIN_TRACING: "true",
};

// Environment Variable Names
const ENV_VARS = {
  AZURE_OPENAI_ENDPOINT: "AZURE_OPENAI_ENDPOINT",
  AZURE_OPENAI_API_KEY: "AZURE_OPENAI_API_KEY",
  AZURE_DEPLOYMENT_NAME: "AZURE_DEPLOYMENT_NAME",
  MODEL_NAME: "LLM_MODEL_NAME",
  LANGCHAIN_API_KEY: "LANGCHAIN_API_KEY",
  LANGCHAIN_PROJECT: "LANGCHAIN_PROJECT",
  LANGCHAIN_TRACING: "LANGCHAIN_TRACING",
};

module.exports = {
  MEMORY_CONFIG,
  ASSESSMENT_CONFIG,
  ASSESSMENT_TYPES,
  QUESTION_TYPES,
  RESPONSE_OPTIONS,
  ERROR_MESSAGES,
  LOG_LEVELS,
  DEFAULTS,
  ENV_VARS,
  // AI assessment timeout knobs (read by routes and services)
  AI_QA_TIMEOUT_MS: parseInt(process.env.AI_QA_TIMEOUT_MS || '900000', 10),
  AI_QA_RETRY_COUNT: parseInt(process.env.AI_QA_RETRY_COUNT || '1', 10),
};
