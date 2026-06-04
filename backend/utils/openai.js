const { OpenAI } = require("openai");

// Load environment variables
require("dotenv").config();

// Azure OpenAI Configuration
const azureApiKey = process.env.AZURE_OPENAI_API_KEY;
const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
const deploymentName = process.env.AZURE_DEPLOYMENT_NAME;

// Create Azure OpenAI client
const client = new OpenAI({
  apiKey: azureApiKey,
  baseURL: `${azureEndpoint}/openai/deployments/${deploymentName}`,
  defaultQuery: { "api-version": "2023-12-01-preview" },
  defaultHeaders: { "api-key": azureApiKey },
});

/**
 * Generate a chat completion using Azure OpenAI
 * @param {array} messages - Array of message objects with role and content
 * @param {object} options - Additional options for the chat completion
 * @returns {object} - The chat completion response
 */
async function generateChatCompletion(messages, options = {}) {
  try {
    const defaultOptions = {
      temperature: 0.7,
      max_tokens: 800,
    };

    const requestOptions = { ...defaultOptions, ...options };

    const response = await client.chat.completions.create({
      model: deploymentName, // Not used with Azure OpenAI but required by client
      messages: messages,
      temperature: requestOptions.temperature,
      max_tokens: requestOptions.max_tokens,
    });

    return response;
  } catch (error) {
    console.error("Error calling Azure OpenAI:", error);
    throw error;
  }
}

/**
 * Generate embeddings using Azure OpenAI
 * @param {string} text - The text to generate embeddings for
 * @returns {object} - The embeddings response
 */
async function generateEmbeddings(text) {
  try {
    const response = await client.embeddings.create({
      model: deploymentName, // Not used with Azure OpenAI but required by client
      input: text,
    });

    return response;
  } catch (error) {
    console.error("Error generating embeddings:", error);
    throw error;
  }
}

module.exports = {
  client,
  generateChatCompletion,
  generateEmbeddings,
};
