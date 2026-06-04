class TranslationService {
  constructor() {
    // Remove trailing /api if present since our endpoints already include it
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8004';
    this.baseURL = apiUrl.endsWith('/api') ? apiUrl.replace('/api', '') : apiUrl;
    this.googleTranslateApiKey = process.env.REACT_APP_GOOGLE_TRANSLATE_API_KEY;
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.maxCacheSize = 1000;
    this.isOnline = navigator.onLine;

    // Completely removed all rate limiting - unlimited concurrent requests
    this.retryDelays = [100, 200, 400]; // Minimal retry delays for network errors only

    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  // Completely removed all rate limiting - instant execution
  async _waitForRateLimit() {
    // No rate limiting - instant execution
    return Promise.resolve();
  }

  // Simplified retry logic - only for network errors, no rate limiting
  async _performRequestWithRetry(requestFn, maxRetries = 2) {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // No delays, no concurrent limits - instant execution
        const result = await requestFn();
        return result;
      } catch (error) {
        lastError = error;

        // Only retry for network errors, not rate limits
        const isNetworkError =
          error.message.includes('NetworkError') ||
          error.message.includes('fetch') ||
          error.message.includes('ERR_NETWORK');

        if (isNetworkError && attempt < maxRetries) {
          const delay = this.retryDelays[attempt] || this.retryDelays[this.retryDelays.length - 1];
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // Don't retry for other errors - fail fast
        if (attempt === maxRetries) {
          throw lastError;
        }
      }
    }

    throw lastError;
  }

  // Main translation method
  async translateText(text, targetLanguage, sourceLanguage = 'en') {
    // Return original text if same language or empty
    if (!text || !text.trim() || targetLanguage === sourceLanguage) {
      return { translatedText: text };
    }

    // Check cache first
    const cacheKey = this._generateCacheKey(text, sourceLanguage, targetLanguage);
    if (this.cache.has(cacheKey)) {
      return { translatedText: this.cache.get(cacheKey) };
    }

    // Check if request is already pending
    if (this.pendingRequests.has(cacheKey)) {
      return await this.pendingRequests.get(cacheKey);
    }

    // Create new translation request
    const translationPromise = this._performTranslation(text, targetLanguage, sourceLanguage);
    this.pendingRequests.set(cacheKey, translationPromise);

    try {
      const result = await translationPromise;
      this._cacheResult(cacheKey, result.translatedText);
      return result;
    } catch (error) {
      console.error('Translation error:', error);
      return { translatedText: text }; // Fallback to original text
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  // Internal translation method - simplified to use backend only
  async _performTranslation(text, targetLanguage, sourceLanguage) {
    if (!this.isOnline) {
      throw new Error('Translation service is offline');
    }

    const requestFn = async () => {
      // Fix double slash issue by ensuring proper URL construction
      const baseUrl = this.baseURL.endsWith('/') ? this.baseURL.slice(0, -1) : this.baseURL;
      const response = await fetch(`${baseUrl}/api/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for session-based auth if needed
        body: JSON.stringify({
          text,
          targetLanguage,
          sourceLanguage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Translation failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Translation failed');
      }

      return data.data;
    };

    return await this._performRequestWithRetry(requestFn);
  }

  // Bulk translation with no rate limiting or delays
  async translateBulk(texts, targetLanguage, sourceLanguage = 'en') {
    if (!this.isOnline) {
      return texts; // Return original texts when offline
    }

    // Filter out empty texts and deduplicate
    const validTexts = [...new Set(texts.filter(text => text && text.trim()))];

    if (validTexts.length === 0) {
      return texts;
    }

    // Maximum batch size for fastest processing - no rate limiting constraints
    const maxBatchSize = 2000; // Increased from 1000 for maximum performance
    if (validTexts.length > maxBatchSize) {
      console.log(`📦 Splitting ${validTexts.length} texts into batches of ${maxBatchSize}`);
      const batches = [];
      for (let i = 0; i < validTexts.length; i += maxBatchSize) {
        batches.push(validTexts.slice(i, i + maxBatchSize));
      }

      // Process ALL batches in parallel for maximum speed - no limits
      console.log(`🚀 Processing ${batches.length} batches in parallel for maximum speed`);
      const batchPromises = batches.map(async (batch, index) => {
        console.log(`📦 Processing batch ${index + 1}/${batches.length}`);
        try {
          return await this._performBulkTranslationRequest(batch, targetLanguage, sourceLanguage);
        } catch (error) {
          console.error(`❌ Batch ${index + 1} failed:`, error);
          // Return original texts for failed batch
          return batch;
        }
      });

      // Wait for all batches to complete in parallel - no rate limiting
      const allResults = await Promise.all(batchPromises);
      const flatResults = [];

      allResults.forEach((result, index) => {
        if (result && Array.isArray(result)) {
          flatResults.push(...result);
        } else {
          // Add original texts for failed batch
          flatResults.push(...batches[index]);
        }
      });

      // Map results back to original order
      return texts.map(originalText => {
        const index = validTexts.indexOf(originalText);
        return index >= 0 ? flatResults[index] : originalText;
      });
    }

    // Single batch processing
    try {
      const results = await this._performBulkTranslationRequest(
        validTexts,
        targetLanguage,
        sourceLanguage
      );

      // Map results back to original order
      return texts.map(originalText => {
        const index = validTexts.indexOf(originalText);
        return index >= 0 ? results[index] : originalText;
      });
    } catch (error) {
      console.error('Bulk translation error:', error);
      return texts;
    }
  }

  // Actual bulk translation request with retry logic
  async _performBulkTranslationRequest(texts, targetLanguage, sourceLanguage) {
    const requestFn = async () => {
      // Fix double slash issue by ensuring proper URL construction
      const baseUrl = this.baseURL.endsWith('/') ? this.baseURL.slice(0, -1) : this.baseURL;
      const response = await fetch(`${baseUrl}/api/translate/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          texts,
          targetLanguage,
          sourceLanguage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Bulk translation failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Bulk translation failed');
      }

      return data.data.map(result => result.translatedText);
    };

    return await this._performRequestWithRetry(requestFn);
  }

  // Detect language of text
  async detectLanguage(text) {
    if (!text || !text.trim()) return 'en';

    if (!this.isOnline) {
      return this._simpleLanguageDetection(text);
    }

    try {
      // Fix double slash issue by ensuring proper URL construction
      const baseUrl = this.baseURL.endsWith('/') ? this.baseURL.slice(0, -1) : this.baseURL;
      const response = await fetch(`${baseUrl}/api/translate/detect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ text }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return data.data.detectedLanguage;
        }
      }
    } catch (error) {
      console.error('Language detection error:', error);
    }

    // Fallback to simple detection
    return this._simpleLanguageDetection(text);
  }

  // Simple language detection fallback
  _simpleLanguageDetection(text) {
    // Basic pattern matching for common languages
    if (/[\u0900-\u097F]/.test(text)) return 'hi'; // Hindi
    if (/[\u4e00-\u9fff]/.test(text)) return 'zh'; // Chinese
    if (/[\u0600-\u06FF]/.test(text)) return 'ar'; // Arabic
    if (/[àáâãäåçèéêëìíîïñòóôõöùúûüýÿ]/i.test(text)) return 'fr'; // French
    if (/[ñ¿¡]/i.test(text)) return 'es'; // Spanish

    return 'en'; // Default to English
  }

  // Get supported languages
  async getSupportedLanguages() {
    console.log('🔍 TranslationService: Getting supported languages...');
    console.log('🔍 TranslationService: Online status:', this.isOnline);
    console.log('🔍 TranslationService: Base URL:', this.baseURL);

    try {
      if (this.isOnline) {
        console.log('🔍 TranslationService: Making API request to backend...');
        // Fix double slash issue by ensuring proper URL construction
        const baseUrl = this.baseURL.endsWith('/') ? this.baseURL.slice(0, -1) : this.baseURL;
        const response = await fetch(`${baseUrl}/api/translate/languages`, {
          credentials: 'include',
        });

        console.log('🔍 TranslationService: Response status:', response.status);
        console.log('🔍 TranslationService: Response ok:', response.ok);

        if (response.ok) {
          const data = await response.json();
          console.log('🔍 TranslationService: Response data:', data);

          if (data.success && data.data) {
            console.log(
              '✅ TranslationService: Successfully fetched languages from backend:',
              data.data.length
            );
            return data.data;
          }
        }
      }
    } catch (error) {
      console.error('❌ TranslationService: Error fetching supported languages:', error);
    }

    // Return default supported languages with Indian languages
    const defaultLanguages = [
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
      { code: 'bn', name: 'বাংলা', flag: '🇧🇩' },
      { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
      { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
      { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
      { code: 'ur', name: 'اردو', flag: '🇵🇰' },
      { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳' },
      { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
      { code: 'ml', name: 'മലയാളം', flag: '🇮🇳' },
      { code: 'pa', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
      { code: 'es', name: 'Español', flag: '🇪🇸' },
      { code: 'fr', name: 'Français', flag: '🇫🇷' },
      { code: 'ar', name: 'العربية', flag: '🇸🇦' },
      { code: 'zh', name: '中文', flag: '🇨🇳' },
      { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
      { code: 'pt', name: 'Português', flag: '🇵🇹' },
      { code: 'ru', name: 'Русский', flag: '🇷🇺' },
      { code: 'ja', name: '日本語', flag: '🇯🇵' },
      { code: 'ko', name: '한국어', flag: '🇰🇷' },
      { code: 'it', name: 'Italiano', flag: '🇮🇹' },
      { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
      { code: 'th', name: 'ไทย', flag: '🇹🇭' },
      { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    ];

    console.log('🔄 TranslationService: Using default languages:', defaultLanguages.length);
    return defaultLanguages;
  }

  // Cache management
  _generateCacheKey(text, sourceLanguage, targetLanguage) {
    return `${sourceLanguage}:${targetLanguage}:${text.substring(0, 100)}`;
  }

  _cacheResult(key, value) {
    // Implement LRU cache
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  // Get cache stats
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      pendingRequests: this.pendingRequests.size,
    };
  }
}

const translationService = new TranslationService();
export default translationService;
