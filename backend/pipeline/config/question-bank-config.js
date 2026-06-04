/**
 * Question Bank System Configuration
 * Controls the behavior and settings of the question bank system
 */

module.exports = {
  // Enable/disable question bank system
  ENABLE_QUESTION_BANK: process.env.ENABLE_QUESTION_BANK !== 'false', // Default: true
  
  // Enable/disable multilingual support
  ENABLE_MULTILINGUAL: process.env.ENABLE_MULTILINGUAL !== 'false', // Default: true
  
  // Enable/disable LLM fallback
  ENABLE_LLM_FALLBACK: process.env.ENABLE_LLM_FALLBACK !== 'false', // Default: true
  
  // Question bank settings
  QUESTION_BANK: {
    // Minimum questions required before using LLM fallback
    MIN_QUESTIONS_BEFORE_LLM: parseInt(process.env.MIN_QUESTIONS_BEFORE_LLM || '15'),
    
    // Maximum questions per domain before considering it "used"
    MAX_QUESTIONS_PER_DOMAIN: parseInt(process.env.MAX_QUESTIONS_PER_DOMAIN || '3'),
    
    // Enable domain rotation to ensure coverage
    ENABLE_DOMAIN_ROTATION: process.env.ENABLE_DOMAIN_ROTATION !== 'false',
    
    // Enable difficulty progression
    ENABLE_DIFFICULTY_PROGRESSION: process.env.ENABLE_DIFFICULTY_PROGRESSION !== 'false',
  },
  
  // Multilingual settings
  MULTILINGUAL: {
    // Default language if translation fails
    DEFAULT_LANGUAGE: process.env.DEFAULT_LANGUAGE || 'en',
    
    // Enable automatic language detection
    ENABLE_LANGUAGE_DETECTION: process.env.ENABLE_LANGUAGE_DETECTION !== 'false',
    
    // Enable fallback to English if translation missing
    ENABLE_ENGLISH_FALLBACK: process.env.ENABLE_ENGLISH_FALLBACK !== 'false',
    
    // Supported languages (can be overridden by environment)
    SUPPORTED_LANGUAGES: process.env.SUPPORTED_LANGUAGES ? 
      process.env.SUPPORTED_LANGUAGES.split(',') : 
      ['en', 'hi', 'es', 'fr', 'de', 'ar', 'zh', 'ja', 'ko', 'pt', 'ru', 'it'],
  },
  
  // LLM fallback settings
  LLM_FALLBACK: {
    // Maximum LLM calls per assessment session
    MAX_LLM_CALLS_PER_SESSION: parseInt(process.env.MAX_LLM_CALLS_PER_SESSION || '5'),
    
    // Enable enhanced prompts to avoid repetition
    ENABLE_ENHANCED_PROMPTS: process.env.ENABLE_ENHANCED_PROMPTS !== 'false',
    
    // Enable domain analysis for better question selection
    ENABLE_DOMAIN_ANALYSIS: process.env.ENABLE_DOMAIN_ANALYSIS !== 'false',
    
    // Temperature setting for LLM calls (0.0 = deterministic, 1.0 = creative)
    TEMPERATURE: parseFloat(process.env.LLM_TEMPERATURE || '0.3'),
    
    // Maximum tokens for LLM responses
    MAX_TOKENS: parseInt(process.env.LLM_MAX_TOKENS || '500'),
  },
  
  // Performance and monitoring
  PERFORMANCE: {
    // Enable performance monitoring
    ENABLE_MONITORING: process.env.ENABLE_QUESTION_BANK_MONITORING !== 'false',
    
    // Enable detailed logging
    ENABLE_DETAILED_LOGGING: process.env.ENABLE_QUESTION_BANK_LOGGING !== 'false',
    
    // Cache question bank data in memory
    ENABLE_CACHING: process.env.ENABLE_QUESTION_BANK_CACHING !== 'false',
    
    // Cache TTL in milliseconds
    CACHE_TTL: parseInt(process.env.QUESTION_BANK_CACHE_TTL || '300000'), // 5 minutes
  },
  
  // Assessment flow control
  ASSESSMENT_FLOW: {
    // Enable automatic assessment completion when question bank exhausted
    ENABLE_AUTO_COMPLETION: process.env.ENABLE_AUTO_COMPLETION !== 'false',
    
    // Minimum questions required before auto-completion
    MIN_QUESTIONS_FOR_COMPLETION: parseInt(process.env.MIN_QUESTIONS_FOR_COMPLETION || '10'),
    
    // Enable progress tracking
    ENABLE_PROGRESS_TRACKING: process.env.ENABLE_PROGRESS_TRACKING !== 'false',
    
    // Enable assessment analytics
    ENABLE_ANALYTICS: process.env.ENABLE_QUESTION_BANK_ANALYTICS !== 'false',
  },
  
  // Quality control
  QUALITY_CONTROL: {
    // Enable question quality validation
    ENABLE_QUALITY_VALIDATION: process.env.ENABLE_QUALITY_VALIDATION !== 'false',
    
    // Enable duplicate detection
    ENABLE_DUPLICATE_DETECTION: process.env.ENABLE_DUPLICATE_DETECTION !== 'false',
    
    // Enable age appropriateness validation
    ENABLE_AGE_VALIDATION: process.env.ENABLE_AGE_VALIDATION !== 'false',
    
    // Enable domain coverage validation
    ENABLE_DOMAIN_COVERAGE_VALIDATION: process.env.ENABLE_DOMAIN_COVERAGE_VALIDATION !== 'false',
  },
  
  // Development and testing
  DEVELOPMENT: {
    // Enable test mode
    ENABLE_TEST_MODE: process.env.NODE_ENV === 'test',
    
    // Enable debug mode
    ENABLE_DEBUG_MODE: process.env.ENABLE_QUESTION_BANK_DEBUG === 'true',
    
    // Enable mock data for testing
    ENABLE_MOCK_DATA: process.env.ENABLE_QUESTION_BANK_MOCK === 'true',
    
    // Enable performance profiling
    ENABLE_PROFILING: process.env.ENABLE_QUESTION_BANK_PROFILING === 'true',
  }
};
