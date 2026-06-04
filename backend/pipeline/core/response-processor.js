/**
 * Response Processor Module
 * Handles response evaluation, scoring, and state updates
 */

const { LLMChain } = require("langchain/chains");

// Import configuration
const { getLLMInstance } = require('../config/ai-config');
const { SessionManager } = require('../memory/session-manager');

// Import prompt templates
const { responseEvaluationPrompt } = require('../prompts');

// Import utilities
const { 
  validateSessionId, 
  validateResponse, 
  sanitizeInput 
} = require('../utils/validators');
const { extractJsonFromMarkdown, extractKeyValuePairs } = require('../utils/parsers');
const { formatRiskLevel, truncateText } = require('../utils/formatters');

/**
 * Create response evaluation chain
 * @param {string} sessionId - Session identifier
 * @returns {LLMChain} - Configured response evaluation chain
 */
function createResponseEvaluationChain(sessionId) {
  if (!validateSessionId(sessionId)) {
    throw new Error('Invalid session ID');
  }

  const memory = SessionManager.getSessionMemory(sessionId);
  const llm = getLLMInstance();

  return new LLMChain({
    llm,
    prompt: responseEvaluationPrompt,
    memory,
    verbose: process.env.NODE_ENV === 'development',
  });
}

/**
 * Process and evaluate a response to an assessment question
 * @param {string} sessionId - Session identifier
 * @param {Object} responseData - Response data containing question and answer
 * @returns {Promise<Object>} - Processed response with evaluation
 */
async function processResponse(sessionId, responseData) {
  try {
    // Validate inputs
    if (!validateSessionId(sessionId)) {
      throw new Error('Invalid session ID');
    }

    if (!validateResponse(responseData)) {
      throw new Error('Invalid response data');
    }

    // Sanitize input data
    const sanitizedResponse = sanitizeResponseData(responseData);
    
    // Create evaluation context
    const evaluationContext = {
      question: sanitizedResponse.question,
      response: sanitizedResponse.response,
      questionDomain: sanitizedResponse.questionDomain || 'general',
      assessmentType: sanitizedResponse.assessmentType || 'general',
      childAge: sanitizedResponse.childAge,
      previousResponses: sanitizedResponse.previousResponses || [],
    };

    // Evaluate response using LLM
    const evaluation = await evaluateResponse(sessionId, evaluationContext);
    
    // Calculate risk indicators
    const riskIndicators = calculateRiskIndicators(evaluation, evaluationContext);
    
    // Generate follow-up recommendations
    const followUp = generateFollowUpRecommendations(evaluation, riskIndicators);
    
    return {
      success: true,
      evaluation,
      riskIndicators,
      followUp,
      processedAt: new Date().toISOString(),
      metadata: {
        sessionId,
        questionDomain: evaluationContext.questionDomain,
        assessmentType: evaluationContext.assessmentType,
      }
    };

  } catch (error) {
    console.error('Error processing response:', error);
    
    return {
      success: false,
      error: error.message,
      fallbackEvaluation: generateFallbackEvaluation(responseData),
      processedAt: new Date().toISOString(),
    };
  }
}

/**
 * Evaluate response using LLM chain
 * @param {string} sessionId - Session identifier
 * @param {Object} context - Evaluation context
 * @returns {Promise<Object>} - Response evaluation
 */
async function evaluateResponse(sessionId, context) {
  try {
    const chain = createResponseEvaluationChain(sessionId);
    
    const result = await chain.call({
      question: context.question,
      response: context.response,
      domain: context.questionDomain,
      assessmentType: context.assessmentType,
      childAge: context.childAge,
      previousResponses: JSON.stringify(context.previousResponses || [], null, 2),
      disorder: context.assessmentType,
      history: '', // Add empty history for now
      input: `Evaluate this response for ${context.assessmentType} assessment`,
    });

    // Parse evaluation from LLM response
    return parseEvaluationResponse(result.text, context);

  } catch (error) {
    console.error('Error in LLM evaluation:', error);
    throw new Error(`Evaluation failed: ${error.message}`);
  }
}

/**
 * Parse evaluation response from LLM
 * @param {string} response - Raw LLM response
 * @param {Object} context - Evaluation context
 * @returns {Object} - Parsed evaluation
 */
function parseEvaluationResponse(response, context) {
  try {
    // Try to extract structured JSON
    const parsed = extractJsonFromMarkdown(response);
    
    if (parsed && (parsed.score !== undefined || parsed.riskLevel !== undefined)) {
      return {
        score: parsed.score || 0,
        riskLevel: parsed.riskLevel || 'low',
        concerns: parsed.concerns || [],
        strengths: parsed.strengths || [],
        recommendations: parsed.recommendations || [],
        confidence: parsed.confidence || 0.5,
        reasoning: parsed.reasoning || '',
        redFlags: parsed.redFlags || [],
        developmentalMarkers: parsed.developmentalMarkers || [],
        rawResponse: response,
        processedAt: new Date().toISOString(),
        domain: context.questionDomain || 'general',
        fallbackUsed: false,
      };
    }
  } catch (error) {
    console.warn('Failed to parse JSON evaluation:', error.message);
  }

  // Fallback: extract key-value pairs
  try {
    const keyValuePairs = extractKeyValuePairs(response);
    
    return {
      score: parseFloat(keyValuePairs.score) || 0,
      riskLevel: keyValuePairs.riskLevel || 'unknown',
      concerns: parseArrayField(keyValuePairs.concerns),
      strengths: parseArrayField(keyValuePairs.strengths),
      recommendations: parseArrayField(keyValuePairs.recommendations),
      confidence: parseFloat(keyValuePairs.confidence) || 0.5,
      reasoning: keyValuePairs.reasoning || '',
      redFlags: parseArrayField(keyValuePairs.redFlags),
      developmentalMarkers: parseArrayField(keyValuePairs.developmentalMarkers),
      rawResponse: response,
    };
  } catch (error) {
    console.warn('Failed to parse key-value evaluation:', error.message);
  }

  // Final fallback: basic text analysis
  return generateBasicEvaluation(response, context);
}

/**
 * Generate basic evaluation from text analysis
 * @param {string} response - Raw response text
 * @param {Object} context - Evaluation context
 * @returns {Object} - Basic evaluation
 */
function generateBasicEvaluation(response, context) {
  const concernKeywords = [
    'concern', 'worry', 'problem', 'difficulty', 'struggle', 'delay',
    'behind', 'unusual', 'different', 'challenging', 'issue'
  ];
  
  const strengthKeywords = [
    'good', 'excellent', 'strong', 'advanced', 'typical', 'normal',
    'appropriate', 'developing', 'progress', 'improvement'
  ];
  
  const lowerResponse = response.toLowerCase();
  const concernCount = concernKeywords.filter(word => 
    lowerResponse.includes(word)
  ).length;
  const strengthCount = strengthKeywords.filter(word => 
    lowerResponse.includes(word)
  ).length;
  
  // Simple scoring based on keyword analysis
  let score = 0.5; // neutral baseline
  if (strengthCount > concernCount) {
    score = 0.3; // lower risk
  } else if (concernCount > strengthCount) {
    score = 0.7; // higher risk
  }
  
      return {
      score,
      riskLevel: score > 0.6 ? 'high' : score > 0.4 ? 'medium' : 'low',
      concerns: concernCount > 0 ? ['Potential concerns identified in response'] : [],
      strengths: strengthCount > 0 ? ['Positive indicators noted'] : [],
      recommendations: ['Further assessment may be beneficial'],
      confidence: 0.3, // low confidence for basic analysis
      reasoning: 'Basic text analysis due to parsing limitations',
      redFlags: [],
      developmentalMarkers: [],
      rawResponse: response,
      processedAt: new Date().toISOString(),
      domain: context.questionDomain || 'general',
      fallbackUsed: true,
    };
}

/**
 * Calculate risk indicators from evaluation
 * @param {Object} evaluation - Response evaluation
 * @param {Object} context - Evaluation context
 * @returns {Object} - Risk indicators
 */
function calculateRiskIndicators(evaluation, context) {
  const riskFactors = [];
  const protectiveFactors = [];
  
  // Analyze evaluation score
  if (evaluation.score > 0.7) {
    riskFactors.push('High concern score');
  } else if (evaluation.score < 0.3) {
    protectiveFactors.push('Low concern score');
  }
  
  // Analyze concerns
  if (evaluation.concerns && evaluation.concerns.length > 0) {
    riskFactors.push(`${evaluation.concerns.length} concern(s) identified`);
  }
  
  // Analyze red flags
  if (evaluation.redFlags && evaluation.redFlags.length > 0) {
    riskFactors.push(`${evaluation.redFlags.length} red flag(s) noted`);
  }
  
  // Analyze strengths
  if (evaluation.strengths && evaluation.strengths.length > 0) {
    protectiveFactors.push(`${evaluation.strengths.length} strength(s) identified`);
  }
  
  // Calculate overall risk level
  const riskScore = calculateOverallRiskScore(riskFactors, protectiveFactors, evaluation);
  
  return {
    riskScore,
    riskLevel: formatRiskLevel(riskScore),
    riskFactors,
    protectiveFactors,
    confidence: evaluation.confidence || 0.5,
    needsFollowUp: riskScore > 0.6 || evaluation.redFlags?.length > 0,
  };
}

/**
 * Calculate overall risk score
 * @param {Array} riskFactors - Identified risk factors
 * @param {Array} protectiveFactors - Identified protective factors
 * @param {Object} evaluation - Response evaluation
 * @returns {number} - Overall risk score (0-1)
 */
function calculateOverallRiskScore(riskFactors, protectiveFactors, evaluation) {
  let score = evaluation.score || 0.5;
  
  // Adjust based on risk factors
  score += riskFactors.length * 0.1;
  
  // Adjust based on protective factors
  score -= protectiveFactors.length * 0.05;
  
  // Adjust based on red flags
  if (evaluation.redFlags && evaluation.redFlags.length > 0) {
    score += evaluation.redFlags.length * 0.15;
  }
  
  // Ensure score stays within bounds
  return Math.max(0, Math.min(1, score));
}

/**
 * Generate follow-up recommendations
 * @param {Object} evaluation - Response evaluation
 * @param {Object} riskIndicators - Risk indicators
 * @returns {Object} - Follow-up recommendations
 */
function generateFollowUpRecommendations(evaluation, riskIndicators) {
  const recommendations = [];
  const urgency = riskIndicators.riskScore > 0.8 ? 'high' : 
                 riskIndicators.riskScore > 0.6 ? 'medium' : 'low';
  
  // Add evaluation-based recommendations
  if (evaluation.recommendations && evaluation.recommendations.length > 0) {
    recommendations.push(...evaluation.recommendations);
  }
  
  // Add risk-based recommendations
  if (riskIndicators.needsFollowUp) {
    recommendations.push('Consider professional evaluation');
  }
  
  if (evaluation.redFlags && evaluation.redFlags.length > 0) {
    recommendations.push('Immediate professional consultation recommended');
  }
  
  return {
    recommendations,
    urgency,
    nextSteps: generateNextSteps(riskIndicators, evaluation),
    timeframe: getRecommendedTimeframe(urgency),
  };
}

/**
 * Generate next steps based on evaluation
 * @param {Object} riskIndicators - Risk indicators
 * @param {Object} evaluation - Response evaluation
 * @returns {Array} - Next steps
 */
function generateNextSteps(riskIndicators, evaluation) {
  const steps = [];
  
  if (riskIndicators.riskScore > 0.7) {
    steps.push('Schedule professional assessment');
    steps.push('Document specific concerns');
  }
  
  if (riskIndicators.riskScore > 0.5) {
    steps.push('Continue monitoring development');
    steps.push('Discuss with pediatrician');
  }
  
  if (evaluation.strengths && evaluation.strengths.length > 0) {
    steps.push('Continue supporting identified strengths');
  }
  
  return steps;
}

/**
 * Get recommended timeframe for follow-up
 * @param {string} urgency - Urgency level
 * @returns {string} - Recommended timeframe
 */
function getRecommendedTimeframe(urgency) {
  switch (urgency) {
    case 'high':
      return 'Within 1-2 weeks';
    case 'medium':
      return 'Within 1-2 months';
    case 'low':
      return 'Within 3-6 months';
    default:
      return 'As appropriate';
  }
}

/**
 * Sanitize response data
 * @param {Object} responseData - Raw response data
 * @returns {Object} - Sanitized response data
 */
function sanitizeResponseData(responseData) {
  return {
    question: sanitizeInput(responseData.question || ''),
    response: sanitizeInput(responseData.response || ''),
    questionDomain: sanitizeInput(responseData.questionDomain || 'general'),
    assessmentType: sanitizeInput(responseData.assessmentType || 'general'),
    childAge: responseData.childAge,
    previousResponses: responseData.previousResponses || [],
  };
}

/**
 * Parse array field from string
 * @param {string} value - String value to parse
 * @returns {Array} - Parsed array
 */
function parseArrayField(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];
  
  // Try to parse as JSON array
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
  } catch (error) {
    // Ignore JSON parse errors
  }
  
  // Split by common delimiters
  return value.split(/[,;|\n]/)
    .map(item => item.trim())
    .filter(item => item.length > 0);
}

/**
 * Generate fallback evaluation when processing fails
 * @param {Object} responseData - Original response data
 * @returns {Object} - Fallback evaluation
 */
function generateFallbackEvaluation(responseData) {
  return {
    score: 0.5,
    riskLevel: 'unknown',
    concerns: ['Unable to process response'],
    strengths: [],
    recommendations: ['Manual review recommended'],
    confidence: 0.1,
    reasoning: 'Fallback evaluation due to processing error',
    redFlags: [],
    developmentalMarkers: [],
    rawResponse: responseData.response || '',
  };
}

module.exports = {
  createResponseEvaluationChain,
  processResponse,
  evaluateResponse,
  parseEvaluationResponse,
  calculateRiskIndicators,
  generateFollowUpRecommendations,
  
  // Internal utilities (for testing)
  generateBasicEvaluation,
  calculateOverallRiskScore,
  sanitizeResponseData,
  parseArrayField,
  generateFallbackEvaluation,
}; 