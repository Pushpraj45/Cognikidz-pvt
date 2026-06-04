/**
 * Language Validation Utility
 * Validates that generated content matches the expected language
 */

const TranslationService = require('../../services/translation.service');

class LanguageValidator {
  /**
   * Validate if generated content is in the expected language
   * @param {string} text - Text to validate
   * @param {string} expectedLanguage - Expected language code
   * @returns {Promise<Object>} - Validation result
   */
  static async validateLanguage(text, expectedLanguage) {
    try {
      // For English, do simple validation
      if (expectedLanguage === 'en') {
        return {
          isValid: true,
          detectedLanguage: 'en',
          expectedLanguage,
          confidence: 1.0
        };
      }

      // Use translation service to detect language
      const detectedLanguage = await TranslationService.detectLanguage(text);
      
      const isValid = detectedLanguage === expectedLanguage || 
                     this.isLanguageMatch(detectedLanguage, expectedLanguage);
      
      return {
        isValid,
        detectedLanguage,
        expectedLanguage,
        confidence: isValid ? 1.0 : 0.0
      };
    } catch (error) {
      console.warn('Language validation failed:', error);
      return { 
        isValid: false, 
        error: error.message,
        detectedLanguage: 'unknown',
        expectedLanguage,
        confidence: 0.0
      };
    }
  }

  /**
   * Check if detected language matches expected language
   * @param {string} detected - Detected language code
   * @param {string} expected - Expected language code
   * @returns {boolean} - True if they match
   */
  static isLanguageMatch(detected, expected) {
    // Handle language variants
    const languageMap = {
      'hi': ['hi', 'hi-in'],
      'bn': ['bn', 'bn-bd', 'bn-in'],
      'te': ['te', 'te-in'],
      'ta': ['ta', 'ta-in'],
      'mr': ['mr', 'mr-in'],
      'en': ['en', 'en-us', 'en-gb', 'en-in']
    };

    const expectedVariants = languageMap[expected] || [expected];
    return expectedVariants.includes(detected);
  }

  /**
   * Check if text contains significant amount of wrong language
   * @param {string} text - Text to check
   * @param {string} targetLanguage - Target language code
   * @returns {boolean} - True if contains wrong language
   */
  static containsWrongLanguage(text, targetLanguage) {
    if (targetLanguage === 'en') return false; // English can contain English

    const patterns = {
      'hi': /[a-zA-Z]{15,}/, // Too much English in Hindi
      'bn': /[a-zA-Z]{15,}/, // Too much English in Bengali
      'te': /[a-zA-Z]{15,}/, // Too much English in Telugu
      'ta': /[a-zA-Z]{15,}/, // Too much English in Tamil
      'mr': /[a-zA-Z]{15,}/, // Too much English in Marathi
    };

    const pattern = patterns[targetLanguage];
    return pattern ? pattern.test(text) : false;
  }

  /**
   * Get language-specific instructions for LLM
   * @param {string} language - Language code
   * @returns {Object} - Language instructions
   */
  static getLanguageInstructions(language) {
    const instructions = {
      'hi': {
        instruction: 'आपको हिंदी में प्रश्न तैयार करना है। प्रश्न पूरी तरह से हिंदी भाषा में होना चाहिए।',
        systemPrompt: 'आप एक बाल विकास विशेषज्ञ हैं। आपको बच्चों के लिए मूल्यांकन प्रश्न तैयार करने हैं।',
        questionPrefix: 'बच्चे के बारे में एक उपयुक्त प्रश्न तैयार करें।'
      },
      'bn': {
        instruction: 'আপনাকে বাংলায় প্রশ্ন তৈরি করতে হবে। প্রশ্নটি সম্পূর্ণভাবে বাংলা ভাষায় হতে হবে।',
        systemPrompt: 'আপনি একজন শিশু উন্নয়ন বিশেষজ্ঞ। আপনাকে শিশুদের জন্য মূল্যায়ন প্রশ্ন তৈরি করতে হবে।',
        questionPrefix: 'শিশু সম্পর্কে একটি উপযুক্ত প্রশ্ন তৈরি করুন।'
      },
      'te': {
        instruction: 'మీరు తెలుగులో ప్రశ్నలను తయారు చేయాలি। ప్రశ్నలు పూర్తిగా తెలుగు భాషలో ఉండాలి।',
        systemPrompt: 'మీరు పిల్లల అభివృద్ధి నిపుణులు. మీరు పిల్లల కోసం మూల్యాంకన ప్రశ్నలను తయారు చేయాలి।',
        questionPrefix: 'పిల్లల గురించి తగిన ప్రశ్న తయారు చేయండి।'
      },
      'ta': {
        instruction: 'நீங்கள் தமிழில் கேள்விகளை தயாரிக்க வேண்டும். கேள்விகள் முழுவதும் தமிழ் மொழியில் இருக்க வேண்டும்.',
        systemPrompt: 'நீங்கள் குழந்தைகளின் வளர்ச்சி நிபுணர். குழந்தைகளுக்கான மதிப்பீட்டு கேள்விகளை தயாரிக்க வேண்டும்.',
        questionPrefix: 'குழந்தையைப் பற்றி பொருத்தமான கேள்வியைத் தயாரிக்கவும்.'
      },
      'mr': {
        instruction: 'तुम्हाला मराठीत प्रश्न तयार करावेत. प्रश्न पूर्णपणे मराठी भाषेत असावेत.',
        systemPrompt: 'तुम्ही मुलांच्या विकासाचे तज्ञ आहात. तुम्हाला मुलांसाठी मूल्यमापन प्रश्न तयार करावेत.',
        questionPrefix: 'मुलाबद्दल योग्य प्रश्न तयार करा.'
      },
      'en': {
        instruction: 'You must generate questions in English language only.',
        systemPrompt: 'You are a child development expert. You need to create assessment questions for children.',
        questionPrefix: 'Generate an appropriate question about the child.'
      }
    };

    return instructions[language] || instructions['en'];
  }

  /**
   * Create strong language enforcement prompt
   * @param {string} language - Language code
   * @param {string} assessmentType - Assessment type
   * @param {Array} previousQuestions - Previous questions to avoid
   * @returns {string} - Enhanced prompt with language enforcement
   */
  static createLanguageEnforcedPrompt(language, assessmentType, previousQuestions = []) {
    const langInstructions = this.getLanguageInstructions(language);
    const prevQuestions = previousQuestions.slice(-10).join(' | ');
    
    return `
CRITICAL LANGUAGE REQUIREMENT: ${langInstructions.instruction}

LANGUAGE: ${language.toUpperCase()}
MANDATORY: Generate the question ONLY in ${language} language. 
${language !== 'en' ? 'NO English words should appear in the question unless they are commonly used terms in ' + language + '.' : ''}
If you cannot generate in the specified language, respond with "LANGUAGE_ERROR".

${langInstructions.systemPrompt}

Generate the next appropriate question for ${assessmentType} assessment.
${prevQuestions ? `Previous questions to avoid: ${prevQuestions}` : ''}

${langInstructions.questionPrefix}
`;
  }
}

module.exports = LanguageValidator;
