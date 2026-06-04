/**
 * Prompt Templates Index
 * Central export point for all prompt templates and utilities
 */

// Import all prompt modules
const { autismQuestionPrompt } = require("./autism-prompts");
const { adhdQuestionPrompt } = require("./adhd-prompts");
const { dyslexiaQuestionPrompt } = require("./dyslexia-prompts");
const { 
  comprehensiveGeneralPrompt, 
  comprehensiveGeneralSummaryPrompt 
} = require("./general-prompts");
const { 
  fallbackQuestionPrompt, 
  responseEvaluationPrompt 
} = require("./inline-prompts");
const { 
  getComprehensiveScreeningDomains, 
  getComprehensiveAgeFocus 
} = require("./prompt-utilities");
const {
  hindiGeneralPrompt,
  bengaliGeneralPrompt,
  teluguGeneralPrompt,
  getLanguageSpecificPrompt
} = require("./multilingual-prompts");

// Export all prompts and utilities
module.exports = {
  // Disorder-specific question prompts
  autismQuestionPrompt,
  adhdQuestionPrompt,
  dyslexiaQuestionPrompt,
  
  // General assessment prompts
  comprehensiveGeneralPrompt,
  comprehensiveGeneralSummaryPrompt,
  
  // Multilingual prompts
  hindiGeneralPrompt,
  bengaliGeneralPrompt,
  teluguGeneralPrompt,
  getLanguageSpecificPrompt,
  
  // Inline prompts from graph.js
  fallbackQuestionPrompt,
  responseEvaluationPrompt,
  
  // Utility functions
  getComprehensiveScreeningDomains,
  getComprehensiveAgeFocus,
  
  // Legacy exports for backward compatibility
  questionPrompt: fallbackQuestionPrompt, // Alias for backward compatibility
  evaluationPrompt: responseEvaluationPrompt // Alias for backward compatibility
}; 