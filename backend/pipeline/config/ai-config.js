/**
 * AI Service Configuration
 * Extracted from graph.js to centralize AI service setup
 */

const { ChatOpenAI } = require("@langchain/openai");
const dotenv = require("dotenv");
const { DEFAULTS, ENV_VARS, ERROR_MESSAGES } = require("./constants");

dotenv.config();

/**
 * Get environment variable with optional default value
 */
const getEnvVar = (name, defaultValue = "") =>
  process.env[name] || defaultValue;

/**
 * AI Configuration Class
 */
class AIConfig {
  constructor() {
    this.endpoint = null;
    this.apiKey = null;
    this.deploymentName = null;
    this.llm = null;
    this.isInitialized = false;
  }

  /**
   * Load configuration from environment variables
   */
  loadConfiguration() {
    // Load environment variables
    this.endpoint = getEnvVar(ENV_VARS.AZURE_OPENAI_ENDPOINT);
    this.apiKey = getEnvVar(ENV_VARS.AZURE_OPENAI_API_KEY);
    this.deploymentName = getEnvVar(
      ENV_VARS.AZURE_DEPLOYMENT_NAME,
      DEFAULTS.DEPLOYMENT_NAME
    );
    this.modelName = getEnvVar(ENV_VARS.MODEL_NAME);
    this.langchainApiKey = getEnvVar(ENV_VARS.LANGCHAIN_API_KEY);
    this.langchainProject = getEnvVar(
      ENV_VARS.LANGCHAIN_PROJECT,
      DEFAULTS.LANGCHAIN_PROJECT
    );
    this.langchainTracing = getEnvVar(
      ENV_VARS.LANGCHAIN_TRACING,
      DEFAULTS.LANGCHAIN_TRACING
    );

    return this;
  }

  /**
   * Validate required environment variables
   */
  validateEnvironment() {
    if (!this.apiKey) {
      throw new Error(ERROR_MESSAGES.MISSING_API_KEY);
    }
    if (!this.endpoint) {
      throw new Error(ERROR_MESSAGES.MISSING_ENDPOINT);
    }
    return this;
  }

  /**
   * Setup LangSmith tracing if enabled
   */
  setupLangSmithTracing() {
    if (this.langchainApiKey && this.langchainTracing === "true") {
      process.env.LANGCHAIN_TRACING_V2 = "true";
      process.env.LANGCHAIN_ENDPOINT = "https://api.smith.langchain.com";
      process.env.LANGCHAIN_API_KEY = this.langchainApiKey;
      process.env.LANGCHAIN_PROJECT = this.langchainProject;
      console.log(
        "LangSmith tracing enabled for project:",
        this.langchainProject
      );
    }
    return this;
  }

  /**
   * Setup OpenAI environment variables for compatibility
   */
  setupOpenAICompatibility() {
    // Set standard OpenAI environment variables to ensure compatibility with libraries
    process.env.AZURE_OPENAI_API_KEY = this.apiKey;
    process.env.AZURE_OPENAI_API_INSTANCE_NAME = "";
    process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME = this.deploymentName;
    process.env.AZURE_OPENAI_API_VERSION = "2024-02-01";
    process.env.AZURE_OPENAI_API_BASE = this.endpoint;

    // Also set standard OpenAI environment variables
    process.env.OPENAI_API_KEY = this.apiKey;
    process.env.OPENAI_API_TYPE = "azure";
    process.env.OPENAI_API_VERSION = "2024-02-01";
    process.env.OPENAI_API_BASE = this.endpoint;

    return this;
  }

  /**
   * Initialize LLM with Azure OpenAI configuration
   * ENHANCED FOR COMPREHENSIVE ASSESSMENTS
   */
  initializeLLM() {
    const maxTokens = parseInt(process.env.AI_QA_MAX_TOKENS || '16000', 10);
    const maxRetries = parseInt(process.env.AI_QA_RETRY_COUNT || '2', 10);

    this.llm = new ChatOpenAI({
      modelName: this.deploymentName,
      temperature: 0.7,
      openAIApiKey: this.apiKey,
      maxTokens, // Allow longer generations for comprehensive assessments
      maxRetries, // Internal retry for transient failures
      configuration: {
        apiKey: this.apiKey,
        baseURL: `${this.endpoint}/openai/deployments/${this.deploymentName}`,
        defaultQuery: { "api-version": "2024-02-01" },
        defaultHeaders: { "api-key": this.apiKey },
      },
    });

    this.isInitialized = true;
    return this.llm;
  }

  /**
   * Get configured LLM instance
   */
  getLLM() {
    if (!this.isInitialized) {
      throw new Error(
        "AI Configuration not initialized. Call initialize() first."
      );
    }
    return this.llm;
  }

  /**
   * Full initialization process
   */
  initialize() {
    return this.loadConfiguration()
      .validateEnvironment()
      .setupLangSmithTracing()
      .setupOpenAICompatibility()
      .initializeLLM();
  }
}

// Create singleton instance
const aiConfig = new AIConfig();

/**
 * Get LLM instance (convenience function)
 * @returns {ChatOpenAI} - Configured LLM instance
 */
function getLLMInstance() {
  if (!aiConfig.isInitialized) {
    aiConfig.initialize();
  }
  return aiConfig.getLLM();
}

module.exports = {
  AIConfig,
  aiConfig,
  getEnvVar,
  getLLMInstance,
};
