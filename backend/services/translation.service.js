const { Translate } = require("@google-cloud/translate").v2;
const logger = require("../utils/logger");

class TranslationService {
  constructor() {
    this.translate = null;
    this.cache = new Map();
    this.maxCacheSize = 10000;
    this.cacheExpiry = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

    this.initializeTranslate();
  }

  /**
   * Initialize Google Cloud Translate
   */
  initializeTranslate() {
    try {
      // Check if we have Google Cloud credentials
      if (
        process.env.GOOGLE_TRANSLATE_API_KEY ||
        process.env.GOOGLE_APPLICATION_CREDENTIALS
      ) {
        const config = {};

        // Use API key if available
        if (process.env.GOOGLE_TRANSLATE_API_KEY) {
          config.key = process.env.GOOGLE_TRANSLATE_API_KEY;
        }

        // Use project ID if available
        if (process.env.GOOGLE_CLOUD_PROJECT_ID) {
          config.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
        }

        // Use credentials file if available
        if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
          config.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        }

        this.translate = new Translate(config);
        logger.info("Google Translate service initialized successfully");
      } else {
        logger.warn(
          "Google Translate API key or credentials not found. Translation service will be limited."
        );
      }
    } catch (error) {
      logger.error("Failed to initialize Google Translate service:", error);
    }
  }

  /**
   * Check if translation service is available
   */
  isAvailable() {
    return this.translate !== null;
  }

  /**
   * Translate text from source language to target language
   * @param {string} text - Text to translate
   * @param {string} targetLanguage - Target language code (e.g., 'es', 'fr')
   * @param {string} sourceLanguage - Source language code (default: 'en')
   * @returns {Object} - Translation result
   */
  async translateText(text, targetLanguage, sourceLanguage = "en") {
    try {
      // Return original text if same language or empty
      if (!text || !text.trim() || targetLanguage === sourceLanguage) {
        return {
          translatedText: text,
          sourceLanguage,
          targetLanguage,
          originalText: text,
          cached: false,
        };
      }

      // Check cache first
      const cacheKey = this._generateCacheKey(
        text,
        sourceLanguage,
        targetLanguage
      );
      const cached = this._getFromCache(cacheKey);
      if (cached) {
        return {
          ...cached,
          cached: true,
        };
      }

      // Check if translation service is available
      if (!this.isAvailable()) {
        throw new Error(
          "Translation service not available. Please configure Google Translate API."
        );
      }

      // Perform translation
      const [translation] = await this.translate.translate(text, {
        from: sourceLanguage,
        to: targetLanguage,
      });

      const result = {
        translatedText: translation,
        sourceLanguage,
        targetLanguage,
        originalText: text,
        cached: false,
        timestamp: new Date().toISOString(),
      };

      // Cache the result
      this._saveToCache(cacheKey, result);

      logger.info(
        `Translated text from ${sourceLanguage} to ${targetLanguage}`
      );
      return result;
    } catch (error) {
      logger.error("Translation error:", error);

      // Return original text with error info
      return {
        translatedText: text,
        sourceLanguage,
        targetLanguage,
        originalText: text,
        error: error.message,
        cached: false,
      };
    }
  }

  /**
   * Translate multiple texts in bulk
   * @param {Array} texts - Array of texts to translate
   * @param {string} targetLanguage - Target language code
   * @param {string} sourceLanguage - Source language code
   * @returns {Array} - Array of translation results
   */
  async translateBulk(texts, targetLanguage, sourceLanguage = "en") {
    try {
      if (!Array.isArray(texts) || texts.length === 0) {
        return [];
      }

      // Process ALL translations in parallel with NO concurrency limits for maximum speed
      const promises = texts.map((text) =>
        this.translateText(text, targetLanguage, sourceLanguage)
      );

      // Wait for all translations to complete simultaneously - no batching, no delays
      const results = await Promise.allSettled(promises);

      // Return all results, with original text as fallback on errors
      return results.map((result, index) => {
        if (result.status === "fulfilled") {
          return result.value.translatedText || texts[index];
        } else {
          // Return original text on error
          return texts[index];
        }
      });
    } catch (error) {
      logger.error("Bulk translation error:", error);
      // Return original texts on error
      return texts;
    }
  }

  /**
   * Translate assessment content
   * @param {Object} assessmentData - Assessment data with questions
   * @param {string} targetLanguage - Target language code
   * @returns {Object} - Translated assessment data
   */
  async translateAssessmentContent(assessmentData, targetLanguage) {
    try {
      const translatedData = { ...assessmentData };

      // Translate questions
      if (assessmentData.questions) {
        translatedData.questions = await Promise.all(
          assessmentData.questions.map(async (question) => {
            const translatedQuestion = { ...question };

            // Translate question text
            if (question.text) {
              const result = await this.translateText(
                question.text,
                targetLanguage
              );
              translatedQuestion.text = result.translatedText;
            }

            // Translate options if they exist
            if (question.options && Array.isArray(question.options)) {
              const optionResults = await this.translateBulk(
                question.options,
                targetLanguage
              );
              translatedQuestion.options = optionResults.map(
                (result) => result.translatedText
              );
            }

            // Translate help text if it exists
            if (question.helpText) {
              const result = await this.translateText(
                question.helpText,
                targetLanguage
              );
              translatedQuestion.helpText = result.translatedText;
            }

            return translatedQuestion;
          })
        );
      }

      // Translate instructions
      if (assessmentData.instructions) {
        const result = await this.translateText(
          assessmentData.instructions,
          targetLanguage
        );
        translatedData.instructions = result.translatedText;
      }

      // Translate title
      if (assessmentData.title) {
        const result = await this.translateText(
          assessmentData.title,
          targetLanguage
        );
        translatedData.title = result.translatedText;
      }

      // Translate description
      if (assessmentData.description) {
        const result = await this.translateText(
          assessmentData.description,
          targetLanguage
        );
        translatedData.description = result.translatedText;
      }

      return translatedData;
    } catch (error) {
      logger.error("Assessment translation error:", error);
      throw error;
    }
  }

  /**
   * Get supported languages
   * @returns {Array} - Array of supported languages
   */
  async getSupportedLanguages() {
    try {
      if (!this.isAvailable()) {
        // Return default supported languages if service not available
        return this._getDefaultSupportedLanguages();
      }

      const [languages] = await this.translate.getLanguages("en");

      // Format the response to match our expected structure
      const formattedLanguages = languages.map((lang) => ({
        code: lang.code,
        name: lang.name,
        flag: this._getLanguageFlag(lang.code),
      }));

      // Filter to commonly used languages for better UX - including Indian languages
      const popularLanguages = [
        "en",
        "hi",
        "bn",
        "te",
        "mr",
        "ta",
        "ur",
        "gu",
        "kn",
        "ml",
        "pa", // English and Indian languages
        "es",
        "fr",
        "ar",
        "zh",
        "de",
        "pt",
        "ru",
        "ja",
        "ko",
        "it",
        "tr",
        "th",
        "vi", // International languages
      ];
      const filteredLanguages = formattedLanguages.filter((lang) =>
        popularLanguages.includes(lang.code)
      );

      return filteredLanguages.length > 0
        ? filteredLanguages
        : formattedLanguages.slice(0, 30); // Increased from 20 to 30
    } catch (error) {
      logger.error("Error fetching supported languages:", error);
      return this._getDefaultSupportedLanguages();
    }
  }

  /**
   * Detect language of text
   * @param {string} text - Text to detect language for
   * @returns {string} - Detected language code
   */
  async detectLanguage(text) {
    try {
      if (!text || !text.trim()) return "en";

      if (!this.isAvailable()) {
        return "en"; // Default fallback
      }

      const [detections] = await this.translate.detect(text);
      const detection = Array.isArray(detections) ? detections[0] : detections;

      return detection.language || "en";
    } catch (error) {
      logger.error("Language detection error:", error);
      return "en";
    }
  }

  /**
   * Generate cache key
   * @private
   */
  _generateCacheKey(text, sourceLanguage, targetLanguage) {
    const textHash = Buffer.from(text).toString("base64").substring(0, 50);
    return `translate:${sourceLanguage}:${targetLanguage}:${textHash}`;
  }

  /**
   * Get translation from cache
   * @private
   */
  _getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    // Remove expired cache
    if (cached) {
      this.cache.delete(key);
    }

    return null;
  }

  /**
   * Save translation to cache
   * @private
   */
  _saveToCache(key, data) {
    // Implement LRU cache
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Get default supported languages
   * @private
   */
  _getDefaultSupportedLanguages() {
    return [
      { code: "en", name: "English", flag: "🇺🇸" },
      { code: "hi", name: "हिंदी", flag: "🇮🇳" },
      { code: "bn", name: "বাংলা", flag: "🇧🇩" },
      { code: "te", name: "తెలుగు", flag: "🇮🇳" },
      { code: "mr", name: "मराठी", flag: "🇮🇳" },
      { code: "ta", name: "தமிழ்", flag: "🇮🇳" },
      { code: "ur", name: "اردو", flag: "🇵🇰" },
      { code: "gu", name: "ગુજરાતી", flag: "🇮🇳" },
      { code: "kn", name: "ಕನ್ನಡ", flag: "🇮🇳" },
      { code: "ml", name: "മലയാളം", flag: "🇮🇳" },
      { code: "pa", name: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
      { code: "es", name: "Español", flag: "🇪🇸" },
      { code: "fr", name: "Français", flag: "🇫🇷" },
      { code: "ar", name: "العربية", flag: "🇸🇦" },
      { code: "zh", name: "中文", flag: "🇨🇳" },
      { code: "de", name: "Deutsch", flag: "🇩🇪" },
      { code: "pt", name: "Português", flag: "🇵🇹" },
      { code: "ru", name: "Русский", flag: "🇷🇺" },
      { code: "ja", name: "日本語", flag: "🇯🇵" },
      { code: "ko", name: "한국어", flag: "🇰🇷" },
      { code: "it", name: "Italiano", flag: "🇮🇹" },
      { code: "tr", name: "Türkçe", flag: "🇹🇷" },
      { code: "th", name: "ไทย", flag: "🇹🇭" },
      { code: "vi", name: "Tiếng Việt", flag: "🇻🇳" },
    ];
  }

  /**
   * Get flag emoji for language code
   * @private
   */
  _getLanguageFlag(languageCode) {
    const flagMap = {
      en: "🇺🇸",
      hi: "🇮🇳",
      bn: "🇧🇩",
      te: "🇮🇳",
      mr: "🇮🇳",
      ta: "🇮🇳",
      ur: "🇵🇰",
      gu: "🇮🇳",
      kn: "🇮🇳",
      ml: "🇮🇳",
      pa: "🇮🇳",
      es: "🇪🇸",
      fr: "🇫🇷",
      ar: "🇸🇦",
      zh: "🇨🇳",
      de: "🇩🇪",
      pt: "🇵🇹",
      ru: "🇷🇺",
      ja: "🇯🇵",
      ko: "🇰🇷",
      it: "🇮🇹",
      nl: "🇳🇱",
      sv: "🇸🇪",
      da: "🇩🇰",
      no: "🇳🇴",
      fi: "🇫🇮",
      pl: "🇵🇱",
      tr: "🇹🇷",
      th: "🇹🇭",
      vi: "🇻🇳",
    };
    return flagMap[languageCode] || "🌐";
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    logger.info("Translation cache cleared");
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hitRate: this._calculateHitRate(),
    };
  }

  /**
   * Calculate cache hit rate
   * @private
   */
  _calculateHitRate() {
    // This would need to be implemented with hit/miss counters
    // For now, return a placeholder
    return 0;
  }
}

module.exports = new TranslationService();
