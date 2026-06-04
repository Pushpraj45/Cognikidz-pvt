/**
 * Formatting Utilities
 * Functions for formatting text, data, and cleaning content
 */

/**
 * Clean markdown formatting from text
 * @param {string} text - Text with markdown formatting
 * @returns {string} - Clean text without markdown
 */
function cleanMarkdownFormatting(text) {
  if (!text || typeof text !== "string") return "";

  return text
    .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold markdown **text**
    .replace(/\*(.*?)\*/g, "$1") // Remove italic markdown *text*
    .replace(/#{1,6}\s*/g, "") // Remove header symbols ###
    .replace(/^\s*[-*+]\s+/gm, "• ") // Convert bullet points to clean bullets
    .replace(/^\d+\.\s+/gm, "") // Remove numbered list formatting
    .replace(/\n{3,}/g, "\n\n") // Clean up multiple line breaks
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
}

/**
 * Format a risk score into a human-readable risk level
 * @param {number} riskScore - Risk score (1-10)
 * @returns {string} - Risk level description
 */
function formatRiskLevel(riskScore) {
  if (riskScore <= 3) return "Low Risk";
  if (riskScore <= 7) return "Moderate Risk";
  return "High Risk";
}

/**
 * Format a date for display
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date string
 */
function formatDate(date) {
  if (!date) return "";
  
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toISOString().split("T")[0];
}

/**
 * Format assessment type for display
 * @param {string} assessmentType - Raw assessment type
 * @returns {string} - Formatted assessment type
 */
function formatAssessmentType(assessmentType) {
  if (!assessmentType) return "General";
  
  const normalized = assessmentType.toLowerCase();
  switch (normalized) {
    case "asd":
    case "autism":
      return "Autism";
    case "adhd":
      return "ADHD";
    case "dyslexia":
      return "Dyslexia";
    default:
      return "General";
  }
}

/**
 * Format a percentage for display
 * @param {number} value - Value to format as percentage
 * @param {number} total - Total value for percentage calculation
 * @returns {string} - Formatted percentage
 */
function formatPercentage(value, total) {
  if (!total || total === 0) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

/**
 * Format ability estimate to a user-friendly score
 * @param {number} abilityEstimate - Raw ability estimate (-3 to 3)
 * @returns {number} - Formatted score (1-10)
 */
function formatAbilityScore(abilityEstimate) {
  return Math.min(
    10,
    Math.max(1, Math.round(Math.abs(abilityEstimate) * 2.5) + 1)
  );
}

/**
 * Truncate text to a specified length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
function truncateText(text, maxLength = 100) {
  if (!text || typeof text !== "string") return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

/**
 * Capitalize first letter of each word
 * @param {string} text - Text to capitalize
 * @returns {string} - Capitalized text
 */
function capitalizeWords(text) {
  if (!text || typeof text !== "string") return "";
  return text.replace(/\b\w/g, (char) => char.toUpperCase());
}

module.exports = {
  cleanMarkdownFormatting,
  formatRiskLevel,
  formatDate,
  formatAssessmentType,
  formatPercentage,
  formatAbilityScore,
  truncateText,
  capitalizeWords
}; 