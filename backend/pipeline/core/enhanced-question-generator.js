/**
 * Enhanced Question Generator
 * Integrates question bank system with minimal LLM usage
 * Eliminates repetitive questions while maintaining quality and personalization
 */

const { questionBankManager } = require('../resources/question-banks');
const { multilingualQuestionBankManager } = require('../resources/multilingual-question-banks');
const { getLLMInstance } = require('../config/ai-config');
const { SessionManager } = require('../memory/session-manager');

// Import utilities
const { validateSessionId, validateAssessmentType, validateChildAge } = require('../utils/validators');
const { extractJsonFromMarkdown } = require('../utils/parsers');

/**
 * Enhanced Question Generator Class
 * Uses question bank as primary source, LLM only for enhancement when needed
 */
class EnhancedQuestionGenerator {
  constructor() {
    this.questionBankManager = questionBankManager;
    this.multilingualManager = multilingualQuestionBankManager;
    this.llm = getLLMInstance();
    this.sessionTracking = new Map(); // Track question usage per session
  }

  /**
   * Generate next question using question bank with optional LLM enhancement
   */
  async generateQuestion(sessionId, assessmentType, state, formData, language = 'en') {
    try {
      // Validate inputs
      if (!validateSessionId(sessionId)) {
        throw new Error('Invalid session ID');
      }

      if (!validateAssessmentType(assessmentType)) {
        throw new Error(`Invalid assessment type: ${assessmentType}`);
      }

      const childAge = this.normalizeChildAge(formData?.childAge ?? formData?.age);
      if (!validateChildAge(childAge)) {
        throw new Error('Invalid child age');
      }

      const childName = formData?.childName || 'the child';

      // Get used domains from current session
      const usedDomains = this.getUsedDomains(sessionId, state);

      // Try to get question from question bank first
      let question = this.getQuestionFromBank(
        sessionId, 
        assessmentType, 
        childAge, 
        usedDomains, 
        childName, 
        language
      );

      if (question) {
        console.log(`✅ Question generated from question bank: ${question.domain}`);
        return {
          success: true,
          question: question,
          source: 'question_bank'
        };
      }

      // If question bank exhausted, use LLM as fallback
      console.log(`⚠️ Question bank exhausted, using LLM fallback for ${assessmentType}`);
      return await this.generateQuestionWithLLM(
        sessionId, 
        assessmentType, 
        state, 
        formData, 
        language
      );

    } catch (error) {
      console.error('❌ Error in enhanced question generation:', error);
      return {
        success: false,
        error: error.message,
        source: 'error'
      };
    }
  }

  /**
   * Get question from question bank
   */
  getQuestionFromBank(sessionId, assessmentType, childAge, usedDomains, childName, language) {
    try {
      // Use multilingual manager if language is supported
      if (language !== 'en' && this.multilingualManager.supportedLanguages.includes(language)) {
        return this.multilingualManager.selectNextQuestionInLanguage(
          sessionId, 
          assessmentType, 
          childAge, 
          usedDomains, 
          childName, 
          language
        );
      }

      // Use base question bank manager for English
      return this.questionBankManager.selectNextQuestion(
        sessionId, 
        assessmentType, 
        childAge, 
        usedDomains, 
        childName, 
        language
      );

    } catch (error) {
      console.error('❌ Error getting question from bank:', error);
      return null;
    }
  }

  /**
   * Generate question using LLM as fallback
   */
  async generateQuestionWithLLM(sessionId, assessmentType, state, formData, language) {
    try {
      // This is the fallback method when question bank is exhausted
      // Use minimal LLM call with enhanced context to avoid repetition
      
      const childAge = this.normalizeChildAge(formData?.childAge ?? formData?.age);
      const childName = formData?.childName || 'the child';
      
      // Get comprehensive context about what's been asked
      const usedDomains = this.getUsedDomains(sessionId, state);
      const previousQuestions = (state.questions || []).map(q => ({
        domain: q.domain,
        skill: q.skill,
        prompt: q.prompt
      }));

      // Create enhanced prompt to avoid repetition
      const enhancedPrompt = this.createEnhancedLLMPrompt(
        assessmentType,
        childAge,
        childName,
        usedDomains,
        previousQuestions,
        language
      );

      // Make minimal LLM call
      const response = await this.llm.invoke(enhancedPrompt);
      
      // Parse and validate response
      const question = this.parseLLMResponse(response, assessmentType, childName, childAge, language);
      
      if (question) {
        console.log(`✅ LLM fallback question generated: ${question.domain}`);
        return {
          success: true,
          question: question,
          source: 'llm_fallback'
        };
      }

      throw new Error('Failed to parse LLM response');

    } catch (error) {
      console.error('❌ Error in LLM fallback generation:', error);
      return {
        success: false,
        error: `LLM fallback failed: ${error.message}`,
        source: 'llm_fallback_error'
      };
    }
  }

  /**
   * Create enhanced LLM prompt to avoid repetition
   */
  createEnhancedLLMPrompt(assessmentType, childAge, childName, usedDomains, previousQuestions, language) {
    const domainAnalysis = this.analyzeDomainCoverage(usedDomains, previousQuestions);
    
    return `You are an expert pediatric neuropsychologist. Generate ONE assessment question for ${assessmentType} assessment.

CRITICAL REQUIREMENTS:
- Child: ${childName} (${childAge} years old)
- Language: ${language}
- Assessment Type: ${assessmentType}

DOMAIN ANALYSIS:
- Used domains: ${usedDomains.join(', ')}
- Domain coverage: ${domainAnalysis.coverage}%
- Missing domains: ${domainAnalysis.missing.join(', ')}

PREVIOUS QUESTIONS (AVOID THESE):
${previousQuestions.map((q, i) => `${i + 1}. Domain: ${q.domain}, Skill: ${q.skill}`).join('\n')}

INSTRUCTIONS:
1. Choose a domain that has NOT been used yet
2. If all domains used, create a question that explores a NEW ASPECT of an existing domain
3. Make the question completely different from previous questions
4. Focus on observable behaviors, not internal states
5. Use age-appropriate language and concepts
6. Address the parent about their child

RESPONSE FORMAT (JSON only):
{
  "prompt": "Question text here",
  "domain": "new_domain_name",
  "skill": "specific_skill_measured",
  "type": "SCALE",
  "options": ["1", "2", "3", "4", "5"],
  "optionLabels": ["Never", "Rarely", "Sometimes", "Often", "Very Often"],
  "difficulty": 3,
  "disorder": "${assessmentType}",
  "rationale": "Why this question is different from previous ones"
}`;
  }

  /**
   * Analyze domain coverage and identify missing areas
   */
  analyzeDomainCoverage(usedDomains, previousQuestions) {
    const allDomains = this.getAllAvailableDomains();
    const coverage = Math.round((usedDomains.length / allDomains.length) * 100);
    
    const missing = allDomains.filter(domain => !usedDomains.includes(domain));
    
    return {
      coverage,
      missing,
      total: allDomains.length,
      used: usedDomains.length
    };
  }

  /**
   * Get all available domains for assessment type
   */
  getAllAvailableDomains() {
    // This would be populated based on your domain definitions
    const domainMap = {
      adhd: ['attention_span', 'hyperactivity', 'impulsivity', 'executive_functioning', 'emotional_regulation', 'academic_performance', 'peer_relationships'],
      autism: ['social_communication', 'joint_attention', 'pretend_play', 'social_interest', 'routine_flexibility', 'sensory_responses', 'communication_patterns'],
      dyslexia: ['phonological_awareness', 'letter_knowledge', 'decoding_skills', 'reading_fluency', 'spelling_patterns', 'reading_comprehension', 'rapid_naming'],
      general: ['motor_skills', 'emotional_regulation', 'peer_relationships', 'academic_performance', 'language_development', 'social_skills']
    };
    
    return domainMap.general; // Default to general domains
  }

  /**
   * Parse LLM response into question object
   */
  parseLLMResponse(response, assessmentType, childName, childAge, language) {
    try {
      const content = response.content || response.text || response;
      const parsed = extractJsonFromMarkdown(content);
      
      if (!parsed || !parsed.prompt) {
        throw new Error('Invalid response format');
      }

      return {
        id: `llm_${Date.now()}`,
        prompt: parsed.prompt,
        question: parsed.prompt,
        domain: parsed.domain || 'general',
        disorder: parsed.disorder || assessmentType,
        type: parsed.type || 'SCALE',
        options: parsed.options || ["1", "2", "3", "4", "5"],
        optionLabels: parsed.optionLabels || ["Never", "Rarely", "Sometimes", "Often", "Very Often"],
        difficulty: parsed.difficulty || 3,
        skill: parsed.skill || 'General assessment',
        ageAppropriate: true,
        language: language,
        timestamp: new Date().toISOString(),
        metadata: {
          source: 'llm_fallback',
          rationale: parsed.rationale || 'Generated as fallback when question bank exhausted'
        }
      };

    } catch (error) {
      console.error('❌ Error parsing LLM response:', error);
      return null;
    }
  }

  /**
   * Get used domains for current session
   */
  getUsedDomains(sessionId, state) {
    // Get domains from state questions
    const stateDomains = (state.questions || []).map(q => q.domain).filter(Boolean);
    
    // Get domains from session tracking
    const sessionDomains = this.sessionTracking.get(sessionId) || new Set();
    
    // Combine and deduplicate
    const allUsedDomains = [...new Set([...stateDomains, ...sessionDomains])];
    
    return allUsedDomains;
  }

  /**
   * Track question usage for session
   */
  trackQuestionUsage(sessionId, question) {
    if (!this.sessionTracking.has(sessionId)) {
      this.sessionTracking.set(sessionId, new Set());
    }
    
    if (question.domain) {
      this.sessionTracking.get(sessionId).add(question.domain);
    }
  }

  /**
   * Clear session tracking
   */
  clearSessionTracking(sessionId) {
    this.sessionTracking.delete(sessionId);
  }

  /**
   * Normalize child age to consistent format
   */
  normalizeChildAge(rawAge) {
    if (typeof rawAge === 'string') {
      const parsed = parseFloat(rawAge);
      return isNaN(parsed) ? 60 : parsed;
    } else if (typeof rawAge === 'number') {
      return rawAge;
    } else {
      return 60; // default 5 years
    }
  }

  /**
   * Get question bank statistics
   */
  getQuestionBankStats() {
    return {
      baseBank: this.questionBankManager.getQuestionStats(),
      multilingual: this.multilingualManager.getLanguageSupport(),
      sessionTracking: {
        activeSessions: this.sessionTracking.size,
        totalTrackedDomains: Array.from(this.sessionTracking.values()).reduce((sum, domains) => sum + domains.size, 0)
      }
    };
  }

  /**
   * Check if question bank has sufficient coverage
   */
  hasSufficientCoverage(assessmentType, childAge) {
    const availableQuestions = this.questionBankManager.getAvailableQuestions(
      assessmentType, 
      childAge, 
      []
    );
    
    // Consider sufficient if we have at least 15 questions (typical assessment length)
    return availableQuestions.length >= 15;
  }

  /**
   * Get assessment completion estimate
   */
  getAssessmentCompletionEstimate(sessionId, assessmentType, childAge) {
    const usedDomains = this.sessionTracking.get(sessionId) || new Set();
    const totalDomains = this.getAllAvailableDomains().length;
    const remainingDomains = totalDomains - usedDomains.size;
    
    return {
      progress: Math.round((usedDomains.size / totalDomains) * 100),
      remainingDomains,
      estimatedQuestionsLeft: Math.max(remainingDomains, 5), // At least 5 questions
      willUseLLM: remainingDomains === 0
    };
  }
}

// Create singleton instance
const enhancedQuestionGenerator = new EnhancedQuestionGenerator();

module.exports = {
  EnhancedQuestionGenerator,
  enhancedQuestionGenerator
};
