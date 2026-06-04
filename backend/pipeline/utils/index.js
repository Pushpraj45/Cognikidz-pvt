/**
 * Utilities Index
 * Central export point for all utility functions
 */

// Import all utility modules
const parsers = require('./parsers');
const formatters = require('./formatters');
const validators = require('./validators');
const domainCalculator = require('./domain-calculator');
const chartGenerator = require('./chart-generator');
const LanguageValidator = require('./language-validator');

// Export all utilities with organized namespaces
module.exports = {
  // Parsing utilities
  parsers,
  
  // Formatting utilities
  formatters,
  
  // Validation utilities
  validators,
  
  // Domain calculation utilities
  domainCalculator,
  
  // Chart generation utilities
  chartGenerator,
  
  // Language validation utilities
  LanguageValidator,
  
  // Direct exports for backward compatibility
  ...parsers,
  ...formatters,
  ...validators,
  ...domainCalculator,
  ...chartGenerator
}; 