/**
 * Question Generator Module
 * Enhanced with question bank system to eliminate repetition
 * Maintains backward compatibility while using new hybrid approach
 */

const { ChatOpenAI } = require("@langchain/openai");
const { PromptTemplate } = require("@langchain/core/prompts");
const { LLMChain } = require("langchain/chains");

// Import configuration
const { getLLMInstance } = require('../config/ai-config');
const { SessionManager } = require('../memory/session-manager');

// Import enhanced question generator
const { enhancedQuestionGenerator } = require('./enhanced-question-generator');

// Import prompt templates (kept for backward compatibility)
const {
  autismQuestionPrompt,
  adhdQuestionPrompt,
  dyslexiaQuestionPrompt,
  comprehensiveGeneralPrompt,
  fallbackQuestionPrompt,
  getComprehensiveScreeningDomains,
  getComprehensiveAgeFocus,
  getLanguageSpecificPrompt,
} = require('../prompts');

// Import resources
const { getScreeningTool, getAgeFocusAreas, getAvailableQuestionDomains } = require('../resources');

// Import utilities
const { validateSessionId, validateAssessmentType, validateChildAge } = require('../utils/validators');
const { extractJsonFromMarkdown } = require('../utils/parsers');
const { cleanMarkdownFormatting } = require('../utils/formatters');
const LanguageValidator = require('../utils/language-validator');

/**
 * Create question generation chain for specific assessment type
 * @param {string} sessionId - Session identifier
 * @param {string} assessmentType - Type of assessment (autism, adhd, dyslexia, general)
 * @param {Object} formData - Form data with child information
 * @param {string} language - Language preference for question generation
 * @returns {LLMChain} - Configured question generation chain
 */
function createQuestionGenerationChain(sessionId, assessmentType = "general", formData = {}, language = 'en') {
  // Validate inputs
  if (!validateSessionId(sessionId)) {
    throw new Error('Invalid session ID');
  }
  
  if (!validateAssessmentType(assessmentType)) {
    throw new Error(`Invalid assessment type: ${assessmentType}`);
  }

  const memory = SessionManager.getSessionMemory(sessionId);
  const llm = getLLMInstance();
  
  let promptTemplate;
  
  // First check for language-specific prompts (currently available for general assessment)
  if (language !== 'en' && assessmentType.toLowerCase() === 'general') {
    const languageSpecificPrompt = getLanguageSpecificPrompt(language);
    if (languageSpecificPrompt) {
      console.log(`🌐 Using language-specific prompt for ${language}`);
      promptTemplate = languageSpecificPrompt;
    } else {
      console.log(`⚠️ No language-specific prompt for ${language}, using default with language instruction`);
      promptTemplate = comprehensiveGeneralPrompt;
    }
  } else {
    // Select appropriate prompt template based on assessment type
    switch (assessmentType.toLowerCase()) {
      case 'autism':
      case 'asd':
        promptTemplate = autismQuestionPrompt;
        break;
      case 'adhd':
        promptTemplate = adhdQuestionPrompt;
        break;
      case 'dyslexia':
        promptTemplate = dyslexiaQuestionPrompt;
        break;
      case 'general':
        promptTemplate = comprehensiveGeneralPrompt;
        break;
      default:
        console.warn(`Unknown assessment type: ${assessmentType}, using fallback`);
        promptTemplate = fallbackQuestionPrompt;
    }
  }

  return new LLMChain({
    llm,
    prompt: promptTemplate,
    memory,
    verbose: process.env.NODE_ENV === 'development',
  });
}

/**
 * Generate contextual question based on assessment progress
 * @param {string} sessionId - Session identifier
 * @param {string} assessmentType - Type of assessment
 * @param {Object} state - Current assessment state
 * @param {Object} formData - Child and family information
 * @param {string} language - Language preference for question generation
 * @returns {Promise<Object>} - Generated question with metadata
 */
async function generateQuestion(sessionId, assessmentType, state, formData, language = 'en') {
  try {
    // Validate inputs
    if (!validateSessionId(sessionId)) {
      throw new Error('Invalid session ID');
    }

    if (!validateAssessmentType(assessmentType)) {
      throw new Error(`Invalid assessment type: ${assessmentType}`);
    }

    // Use enhanced question generator as primary method
    console.log(`🚀 Using enhanced question generator for ${assessmentType} assessment`);
    
    const enhancedResult = await enhancedQuestionGenerator.generateQuestion(
      sessionId, 
      assessmentType, 
      state, 
      formData, 
      language
    );

    if (enhancedResult.success) {
      // Track question usage for domain management
      enhancedQuestionGenerator.trackQuestionUsage(sessionId, enhancedResult.question);
      
      console.log(`✅ Enhanced question generated successfully from ${enhancedResult.source}`);
      return enhancedResult;
    }

    // Fall back to legacy LLM method if enhanced generator fails
    console.log(`⚠️ Enhanced generator failed, falling back to legacy LLM method`);
    return await generateQuestionLegacy(sessionId, assessmentType, state, formData, language);

  } catch (error) {
    console.error('❌ Error in enhanced question generation:', error);
    
    // Fall back to legacy method
    try {
      console.log(`🔄 Attempting legacy question generation as fallback`);
      return await generateQuestionLegacy(sessionId, assessmentType, state, formData, language);
    } catch (legacyError) {
      console.error('❌ Legacy method also failed:', legacyError);
      return {
        success: false,
        error: `Both enhanced and legacy methods failed: ${error.message}`,
        details: { enhanced: error.message, legacy: legacyError.message }
      };
    }
  }
}

/**
 * Legacy question generation method (kept for backward compatibility)
 * @param {string} sessionId - Session identifier
 * @param {string} assessmentType - Type of assessment
 * @param {Object} state - Current assessment state
 * @param {Object} formData - Child and family information
 * @param {string} language - Language preference for question generation
 * @returns {Promise<Object>} - Generated question with metadata
 */
async function generateQuestionLegacy(sessionId, assessmentType, state, formData, language = 'en') {
  try {
    // Normalize child's age to months
    const rawAge = formData?.childAge ?? formData?.age;
    const childAge = rawAge;
    if (!validateChildAge(rawAge)) {
      throw new Error('Invalid child age');
    }

    // Convert to months if value appears to be in years
    let ageInMonths;
    if (typeof rawAge === 'string') {
      const parsed = parseFloat(rawAge);
      ageInMonths = isNaN(parsed) ? 60 : (parsed <= 24 ? parsed * 12 : parsed);
    } else if (typeof rawAge === 'number') {
      ageInMonths = rawAge <= 24 ? rawAge * 12 : rawAge;
    } else {
      ageInMonths = 60; // default 5 years
    }

    // Get assessment-specific tools and focus areas
    const screeningTool = getScreeningTool(assessmentType, ageInMonths);
    const ageFocusAreas = getAgeFocusAreas(assessmentType, ageInMonths);
    const availableDomains = getAvailableQuestionDomains(
      assessmentType, 
      screeningTool, 
      state.questions || []
    );

    // Prepare context for question generation
    const prevPromptsArr = (state.questions || []).map(q => q.prompt);

    const questionContext = {
      formData: JSON.stringify(formData, null, 2),
      screeningTool: JSON.stringify(screeningTool || {}, null, 2),
      ageFocus: JSON.stringify(ageFocusAreas || {}, null, 2),
      availableDomains: availableDomains.join(', '),
      previousResponses: JSON.stringify(state.responses || [], null, 2),
      previousPrompts: JSON.stringify(prevPromptsArr.slice(-10), null, 2),
      bannedPhrases: JSON.stringify([], null, 2),
      recentDomains: JSON.stringify((state.questions || []).slice(-5).map(q => q.domain), null, 2),
      childAge: childAge,
      screeningToolName: screeningTool?.name || 'General Assessment',
      childName: formData.childName || 'the child',
      currentQuestionNumber: (state.questions?.length || 0) + 1,
      language: language,
      timestamp: Date.now(),
      input: `Generate the next appropriate question for ${assessmentType} assessment in ${language} language. Do NOT repeat or paraphrase earlier questions. Previous questions: ${prevPromptsArr.slice(-10).join(' | ')}`,
    };

    // Create enhanced language instruction for better LLM compliance
    let enhancedLanguagePrompt = questionContext.input;
    
    if (language !== 'en') {
      console.log('🔍 [DEBUG] LanguageValidator type:', typeof LanguageValidator);
      console.log('🔍 [DEBUG] LanguageValidator methods:', Object.getOwnPropertyNames(LanguageValidator));
      
      try {
        const langInstructions = LanguageValidator.getLanguageInstructions(language);
        enhancedLanguagePrompt = LanguageValidator.createLanguageEnforcedPrompt(
          language, 
          assessmentType, 
          prevPromptsArr.slice(-10)
        );
        questionContext.input = enhancedLanguagePrompt;
      } catch (error) {
        console.error('🔍 [DEBUG] Error with LanguageValidator:', error.message);
        console.log('🔍 [DEBUG] Falling back to basic language instruction');
        questionContext.input = `Generate the next appropriate question for ${assessmentType} assessment in ${language} language. ${questionContext.input}`;
      }
    }

    // 🔍 COMPREHENSIVE DEBUGGING: Log all context data for language generation
    console.log('🔍 [LANGUAGE DEBUG] Question Generation Context:', {
      sessionId,
      assessmentType,
      language: questionContext.language,
      childName: questionContext.childName,
      childAge: questionContext.childAge,
      currentQuestionNumber: questionContext.currentQuestionNumber,
      availableDomains: questionContext.availableDomains,
      templateVariables: Object.keys(questionContext),
      languageInstruction: questionContext.input.includes('language') ? '✅ Language instruction found' : '❌ Language instruction missing',
      formDataLanguage: formData?.language || 'undefined',
      stateLanguage: state?.language || 'undefined',
      passedLanguage: language || 'undefined',
      enhancedPrompt: language !== 'en' ? '✅ Enhanced language prompt used' : '❌ Standard prompt used'
    });

    // Create and execute question generation chain
    const chain = createQuestionGenerationChain(sessionId, assessmentType, formData, language);

    // 🔍 DEBUG: Log the prompt template being used
    console.log('🔍 [LANGUAGE DEBUG] Prompt Template Info:', {
      assessmentType,
      promptTemplateType: chain.prompt.constructor.name,
      inputVariables: chain.prompt.inputVariables,
      hasLanguageVariable: chain.prompt.inputVariables.includes('language'),
      languageVariableIndex: chain.prompt.inputVariables.indexOf('language'),
      templateVariablesCount: chain.prompt.inputVariables.length,
      contextVariablesCount: Object.keys(questionContext).length
    });

    // Generate question directly without duplication checking
    console.log(`🔍 [LANGUAGE DEBUG] Generating question for language: ${language}`);
    
    const callParams = { ...questionContext, timestamp: Date.now() };
    console.log(`🔍 [LANGUAGE DEBUG] Chain Call:`, {
      language: callParams.language,
      languageType: typeof callParams.language,
      languageValue: callParams.language,
      allParams: Object.keys(callParams),
      paramCount: Object.keys(callParams).length,
      hasLanguage: 'language' in callParams,
      languageUndefined: callParams.language === undefined,
      languageNull: callParams.language === null
    });

    const result = await chain.call(callParams);
    
    // 🔍 DEBUG: Log the LLM response
    console.log(`🔍 [LANGUAGE DEBUG] LLM Response:`, {
      responseLength: result.text?.length || 0,
      responsePreview: result.text?.substring(0, 200) || 'No response',
      hasLanguageInstruction: result.text?.includes('language') || false,
      languageInResponse: result.text?.toLowerCase().includes(callParams.language?.toLowerCase()) || false,
      responseType: typeof result.text,
      responseKeys: Object.keys(result || {})
    });

    const candidate = parseGeneratedQuestion(result.text, questionContext);
    
    // Add language validation for non-English languages
    let question = candidate;
    if (language !== 'en') {
      try {
        const languageValidation = await LanguageValidator.validateLanguage(
          candidate.prompt, 
          language
        );
        
        if (!languageValidation.isValid) {
          console.log(`🔍 [LANGUAGE DEBUG] Language validation failed:`, {
            expected: language,
            detected: languageValidation.detectedLanguage,
            confidence: languageValidation.confidence,
            text: candidate.prompt.substring(0, 100) + '...'
          });
          
          // Use fallback instead of retrying
          question = null;
        } else {
          console.log(`✅ [LANGUAGE DEBUG] Language validation passed:`, {
            expected: language,
            detected: languageValidation.detectedLanguage,
            confidence: languageValidation.confidence
          });
          
          question = {
            ...candidate,
            language: language,
            languageValidated: true,
            generationAttempts: 1
          };
        }
      } catch (error) {
        console.error('🔍 [DEBUG] Error with language validation:', error.message);
        console.log('🔍 [DEBUG] Proceeding without language validation');
        question = {
          ...candidate,
          language: language,
          languageValidated: false,
          generationAttempts: 1
        };
      }
    } else {
      question = {
        ...candidate,
        language: language,
        languageValidated: false,
        generationAttempts: 1
      };
    }

    if (!question) {
      // Simple fallback: generate a basic question without complex logic
      console.warn(`🔄 [LANGUAGE DEBUG] Using simple fallback for language: ${language}`);
      const childName = formData?.childName || 'your child';
      const domains = ['cognitive', 'socialEmotional', 'communication', 'development'];
      const randomDomain = domains[Math.floor(Math.random() * domains.length)];
      
      const fallbackQuestions = {
        hi: {
          cognitive: `${childName} कितनी जल्दी नई चीजें सीखता/सीखती है?`,
          socialEmotional: `${childName} अन्य बच्चों के साथ कैसे खेलता/खेलती है?`,
          communication: `${childName} अपनी बात कितनी स्पष्टता से कहता/कहती है?`,
          development: `${childName} अपनी उम्र के अनुसार कार्य कितनी अच्छी तरह करता/करती है?`
        },
        en: {
          cognitive: `How quickly does ${childName} learn new things?`,
          socialEmotional: `How well does ${childName} play with other children?`,
          communication: `How clearly does ${childName} express themselves?`,
          development: `How well does ${childName} perform age-appropriate tasks?`
        }
      };
      
      const langQuestions = fallbackQuestions[language] || fallbackQuestions.en;
      const questionText = langQuestions[randomDomain] || langQuestions.cognitive;
      
      question = {
        id: `fallback_${Date.now()}`,
        prompt: questionText,
        type: "SCALE",
        options: [1, 2, 3, 4, 5],
        optionLabels: language === 'hi' 
          ? ["कभी नहीं", "कभी-कभार", "कभी-कभी", "अक्सर", "बहुत अक्सर"]
          : ["Never", "Rarely", "Sometimes", "Often", "Very Often"],
        domain: randomDomain,
        disorder: assessmentType,
        language: language,
        languageValidated: true,
        generationAttempts: attempts + 1,
        isFallback: true,
        rationale: 'Simple fallback question',
        expectedResponseType: 'scale',
        timestamp: new Date().toISOString(),
      };
    }
    
    return {
      success: true,
      question,
      metadata: {
        assessmentType,
        domain: question.domain,
        questionNumber: (state.questions?.length || 0) + 1,
        screeningTool: screeningTool?.name,
        ageFocus: ageFocusAreas?.primary,
      }
    };

  } catch (error) {
    console.error('Error generating question:', error);
    
    // Return fallback question on error
    return {
      success: false,
      error: error.message,
      question: generateFallbackQuestion(assessmentType, formData),
      metadata: {
        assessmentType,
        isFallback: true,
      }
    };
  }
}

/**
 * Parse generated question from LLM response
 * @param {string} response - Raw LLM response
 * @param {Object} context - Question generation context
 * @returns {Object} - Parsed question object
 */
function parseGeneratedQuestion(response, context) {
  try {
    // Try to extract JSON from response
    const parsed = extractJsonFromMarkdown(response);
    
    if (parsed && (parsed.prompt || parsed.question)) {
      const questionText = parsed.prompt || parsed.question;
      return {
        id: generateQuestionId(),
        prompt: questionText, // Use 'prompt' field as required by schema
        question: questionText, // Keep for backward compatibility
        domain: parsed.domain || 'general',
        disorder: parsed.disorder || context.assessmentType || 'general', // Add required disorder field
        type: mapQuestionType(parsed.type || 'open_ended'), // Map to valid enum values
        options: parsed.options || [],
        optionLabels: parsed.optionLabels || [], // Add optionLabels support
        followUp: parsed.followUp || null,
        rationale: parsed.rationale || '',
        expectedResponseType: parsed.expectedResponseType || 'text',
        timestamp: new Date().toISOString(),
      };
    }
  } catch (error) {
    console.warn('Failed to parse JSON from question response:', error.message);
    console.warn('Raw response:', response.substring(0, 300) + '...');
  }

  // Fallback: extract question from text
  console.warn('Using fallback text extraction for question generation');
  const questionText = extractQuestionFromText(response);
  
  return {
    id: generateQuestionId(),
    prompt: questionText, // Use 'prompt' field as required by schema
    question: questionText, // Keep for backward compatibility
    domain: context.availableDomains[0] || 'general',
    disorder: context.assessmentType || 'general', // Add required disorder field
    type: mapQuestionType('open_ended'), // Map to valid enum values
    options: [],
    followUp: null,
    rationale: 'Generated from text extraction',
    expectedResponseType: 'text',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Extract question text from unstructured response
 * @param {string} text - Raw text response
 * @returns {string} - Extracted question
 */
function extractQuestionFromText(text) {
  // Remove markdown formatting and extract question
  let cleaned = cleanMarkdownFormatting(text);
  
  // First, try to extract from malformed JSON structure
  if (cleaned.includes('"prompt"')) {
    // Try multiple patterns for extracting prompt from JSON
    const promptPatterns = [
      /"prompt":\s*"([^"]+)"/,  // Complete prompt in quotes
      /"prompt":\s*"([^"]*)/,   // Incomplete prompt (missing closing quote)
    ];
    
    for (const pattern of promptPatterns) {
      const match = cleaned.match(pattern);
      if (match && match[1] && match[1].length > 10) { // Ensure we have substantial text
        console.log('✅ Extracted question from malformed JSON:', match[1].trim());
        return match[1].trim();
      }
    }
  }
  
  // Look for other question patterns
  const questionPatterns = [
    /Question:\s*(.+?)(?:\n|$)/i,
    /How often does .+?\?/i,  // Common ADHD question pattern
    /Can you describe .+?\?/i, // Common general question pattern
    /\d+\.\s*(.+?\?)/,
    /(.+?\?)/,
  ];
  
  for (const pattern of questionPatterns) {
    const match = cleaned.match(pattern);
    if (match) {
      const questionText = match[1] || match[0];
      if (questionText && questionText.length > 10 && !questionText.includes('"id"')) {
        return questionText.trim();
      }
    }
  }
  
  // If we still have JSON artifacts, try to clean them out
  if (cleaned.includes('```') || cleaned.includes('"id"')) {
    // Remove JSON artifacts and try again
    cleaned = cleaned
      .replace(/```json\s*/g, '')
      .replace(/```/g, '')
      .replace(/\{[^}]*"id"[^}]*\}/g, '')
      .replace(/[{}]/g, '')
      .replace(/"/g, '')
      .trim();
    
    // Look for question-like sentences
    const sentences = cleaned.split(/[.!?]+/);
    for (const sentence of sentences) {
      if (sentence.trim().length > 20 && 
          (sentence.includes('How often') || 
           sentence.includes('Can you') || 
           sentence.includes('Does your child'))) {
        return sentence.trim() + '?';
      }
    }
  }
  
  // Final fallback: return first substantial sentence
  const sentences = cleaned.split(/[.!?]+/);
  const firstSubstantial = sentences.find(s => s.trim().length > 20);
  return firstSubstantial?.trim() || 'Unable to extract question from response';
}

/**
 * Generate fallback question when main generation fails
 * @param {string} assessmentType - Type of assessment
 * @param {Object} formData - Child information
 * @returns {Object} - Fallback question object
 */
function generateFallbackQuestion(assessmentType, formData) {
  const childName = formData?.childName || 'your child';
  
  const fallbackQuestions = {
    autism: `Can you describe how ${childName} typically interacts with other children their age?`,
    adhd: `How well does ${childName} focus on tasks or activities that interest them?`,
    dyslexia: `How is ${childName} progressing with reading and writing skills?`,
    general: `What are your main concerns about ${childName}'s development?`,
  };
  
  const question = fallbackQuestions[assessmentType.toLowerCase()] || 
                  fallbackQuestions.general;
  
  return {
    id: generateQuestionId(),
    prompt: question, // Use 'prompt' field as required by schema
    question, // Keep for backward compatibility
    domain: 'general',
    disorder: assessmentType || 'general', // Add required disorder field
    type: mapQuestionType('open_ended'), // Map to valid enum values
    options: [],
    followUp: null,
    rationale: 'Fallback question due to generation error',
    expectedResponseType: 'text',
    timestamp: new Date().toISOString(),
    isFallback: true,
  };
}

/**
 * Map question types to valid database enum values
 * @param {string} type - Original question type
 * @returns {string} - Valid enum value
 */
function mapQuestionType(type) {
  const typeMapping = {
    'open_ended': 'TEXT',
    'text': 'TEXT',
    'multiple_choice': 'MCQ',
    'mcq': 'MCQ',
    'multiple_select': 'MSQ',
    'msq': 'MSQ',
    'scale': 'SCALE',
    'rating': 'SCALE',
    'visual': 'VISUAL',
    'image': 'VISUAL',
  };
  
  return typeMapping[type.toLowerCase()] || 'TEXT';
}

/**
 * Generate unique question ID
 * @returns {string} - Unique question identifier
 */
function generateQuestionId() {
  return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get next question domain based on assessment progress
 * @param {string} assessmentType - Type of assessment
 * @param {number} ageInMonths - Child's age in months
 * @param {Array} previousQuestions - Previously asked questions
 * @returns {string} - Next domain to focus on
 */
function getNextQuestionDomain(assessmentType, ageInMonths, previousQuestions = []) {
  try {
    const screeningTool = getScreeningTool(assessmentType, ageInMonths);
    const availableDomains = getAvailableQuestionDomains(
      assessmentType, 
      screeningTool, 
      previousQuestions
    );
    // Prefer least-used domain among available to avoid cycling same topic
    if (availableDomains && availableDomains.length > 0) {
      const usage = previousQuestions.reduce((acc, q) => {
        const d = (q.domain || 'general').toLowerCase();
        acc[d] = (acc[d] || 0) + 1;
        return acc;
      }, {});
      const ranked = [...availableDomains].sort((a, b) => (usage[a] || 0) - (usage[b] || 0));
      return ranked[0] || 'general';
    }
    return 'general';
  } catch (error) {
    console.warn('Error getting next question domain:', error.message);
    return 'general';
  }
}

/**
 * Validate question generation parameters
 * @param {Object} params - Parameters to validate
 * @returns {Object} - Validation result
 */
function validateQuestionParams(params) {
  const { sessionId, assessmentType, formData } = params;
  
  const errors = [];
  
  if (!validateSessionId(sessionId)) {
    errors.push('Invalid session ID');
  }
  
  if (!validateAssessmentType(assessmentType)) {
    errors.push('Invalid assessment type');
  }
  
  if (!formData || typeof formData !== 'object') {
    errors.push('Form data is required');
  }
  
  const childAge = formData?.childAge || formData?.age;
  if (!validateChildAge(childAge)) {
    errors.push('Valid child age is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  createQuestionGenerationChain,
  generateQuestion,
  generateQuestionLegacy, // Legacy method for fallback
  parseGeneratedQuestion,
  generateFallbackQuestion,
  getNextQuestionDomain,
  validateQuestionParams,
  
  // Enhanced question generator
  enhancedQuestionGenerator,
  
  // Internal utilities (for testing)
  extractQuestionFromText,
  generateQuestionId,
}; 