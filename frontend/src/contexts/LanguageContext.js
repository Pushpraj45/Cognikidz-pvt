import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import TranslationService from '../services/TranslationService';
import i18n from '../i18n';

// Import static translations
import enTranslations from '../locales/en.json';
import hiTranslations from '../locales/hi.json';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');
  const [staticTranslations, setStaticTranslations] = useState(enTranslations);
  const [supportedLanguages, setSupportedLanguages] = useState([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [translationCache, setTranslationCache] = useState(new Map());
  const [direction, setDirection] = useState('ltr'); // Language direction
  const [translationVersion, setTranslationVersion] = useState(0); // Force re-render trigger

  // Change language function - moved before initialization
  const changeLanguage = useCallback(
    async newLanguage => {
      if (newLanguage === language) {
        return;
      }

      // 🔍 DEBUG: Log language change in LanguageContext
      console.log('🔍 [LANGUAGE DEBUG] LanguageContext Language Change:', {
        component: 'LanguageContext',
        oldLanguage: language,
        newLanguage,
        newLanguageType: typeof newLanguage,
        newLanguageUndefined: newLanguage === undefined,
        newLanguageNull: newLanguage === null,
        hasNewLanguage: newLanguage !== undefined && newLanguage !== null,
        timestamp: new Date().toISOString()
      });

      try {
        setIsTranslating(true);

        setLanguage(newLanguage);

        localStorage.setItem('cognikidz_language', newLanguage);

        // Switch i18next runtime language immediately for static JSON-based translations
        try {
          await i18n.changeLanguage(newLanguage);
        } catch (i18nErr) {
          console.warn('⚠️ i18next.changeLanguage failed:', i18nErr);
        }

        setTranslationCache(new Map());
        setTranslationVersion(prev => prev + 1);

        // 🔍 DEBUG: Log successful language change
        console.log('🔍 [LANGUAGE DEBUG] LanguageContext Language Change Success:', {
          component: 'LanguageContext',
          languageChangedTo: newLanguage,
          localStorageUpdated: true,
          i18nUpdated: true,
          translationCacheCleared: true,
          translationVersion: translationVersion + 1
        });

        window.dispatchEvent(
          new CustomEvent('languageChanged', {
            detail: {
              language: newLanguage,
              direction: ['ar', 'he', 'ur', 'fa'].includes(newLanguage) ? 'rtl' : 'ltr',
              version: translationVersion + 1,
            },
          })
        );
      } catch (error) {
        console.error('❌ LanguageContext: Error changing language:', error);
      } finally {
        setIsTranslating(false);
      }
    },
    [language, translationVersion]
  );

  // Load initial data
  useEffect(() => {
    const initializeLanguageContext = async () => {
      try {
        // Load saved language preference
        const savedLanguage = localStorage.getItem('cognikidz_language') || 'en';

        // Force use of updated default languages immediately
        const updatedDefaultLanguages = [
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

        setSupportedLanguages(updatedDefaultLanguages);

        // Try to load supported languages from backend
        try {
          const languages = await TranslationService.getSupportedLanguages();
          if (languages && languages.length > 0) {
            setSupportedLanguages(languages);
          }
        } catch (backendError) {
          console.warn(
            '⚠️ LanguageContext: Backend language loading failed, using defaults:',
            backendError
          );
          // Keep using the updated default languages set above
        }

        // Set initial language directly without calling changeLanguage to avoid circular dependency
        if (savedLanguage !== 'en') {
          setLanguage(savedLanguage);
          localStorage.setItem('cognikidz_language', savedLanguage);
        }
      } catch (error) {
        console.error('❌ LanguageContext: Failed to initialize:', error);
        // Fallback to default with updated languages
        setLanguage('en');
        setStaticTranslations(enTranslations);

        // Ensure we have the updated default languages
        setSupportedLanguages([
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
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    initializeLanguageContext();
  }, []); // Remove changeLanguage from dependencies

  // Update static translations when language changes
  useEffect(() => {
    const updateStaticTranslations = () => {
      switch (language) {
        case 'hi':
          setStaticTranslations(hiTranslations);
          break;
        case 'en':
        default:
          setStaticTranslations(enTranslations);
          break;
      }
    };

    updateStaticTranslations();
  }, [language]);

  // Update text direction based on language
  useEffect(() => {
    const rtlLanguages = ['ar', 'he', 'ur', 'fa'];
    setDirection(rtlLanguages.includes(language) ? 'rtl' : 'ltr');

    // Update document direction
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
  }, [language, direction]);

  // Static translation function (for predefined translations)
  const getStaticTranslation = useCallback(
    (key, variables = {}) => {
      const keys = key.split('.');
      let value = staticTranslations;

      for (const k of keys) {
        if (value && typeof value === 'object') {
          value = value[k];
        } else {
          return key; // Return the key if translation not found
        }
      }

      // Handle variable substitution
      if (typeof value === 'string' && Object.keys(variables).length > 0) {
        return value.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
          return variables[variable] || match;
        });
      }

      return value || key;
    },
    [staticTranslations]
  );

  // Dynamic translation function (using Google Translate)
  const translateText = useCallback(
    async (text, options = {}) => {
      if (!text || !text.trim()) return text;
      if (language === 'en') return text;

      const { sourceLanguage = 'en', useCache = true, fallbackToOriginal = true } = options;

      // Check cache first
      const cacheKey = `${text}_${sourceLanguage}_${language}`;
      if (useCache && translationCache.has(cacheKey)) {
        return translationCache.get(cacheKey);
      }

      try {
        setIsTranslating(true);
        const result = await TranslationService.translateText(text, language, sourceLanguage);

        // Cache the result
        if (useCache) {
          setTranslationCache(prev => new Map(prev.set(cacheKey, result.translatedText)));
        }

        return result.translatedText;
      } catch (error) {
        console.error('Translation error:', error);
        return fallbackToOriginal ? text : '';
      } finally {
        setIsTranslating(false);
      }
    },
    [language, translationCache]
  );

  // Bulk translation function with caching
  const translateBulk = useCallback(
    async (texts, options = {}) => {
      if (!texts || texts.length === 0) return [];
      if (language === 'en') return texts;

      const { sourceLanguage = 'en', useCache = true, fallbackToOriginal = true } = options;

      // Check cache first if enabled
      if (useCache) {
        const cachedResults = [];
        const uncachedTexts = [];
        const uncachedIndices = [];

        texts.forEach((text, index) => {
          if (!text || !text.trim()) {
            cachedResults[index] = text;
            return;
          }

          const cacheKey = `${text}_${sourceLanguage}_${language}`;
          if (translationCache.has(cacheKey)) {
            cachedResults[index] = translationCache.get(cacheKey);
          } else {
            uncachedTexts.push(text);
            uncachedIndices.push(index);
          }
        });

        // If all texts are cached, return cached results
        if (uncachedTexts.length === 0) {
          return cachedResults;
        }

        // Only translate uncached texts
        if (uncachedTexts.length < texts.length) {
        }

        try {
          setIsTranslating(true);
          const result = await TranslationService.translateBulk(
            uncachedTexts,
            language,
            sourceLanguage
          );

          // Cache the new results and build final array
          result.forEach((translatedText, resultIndex) => {
            const originalIndex = uncachedIndices[resultIndex];
            const originalText = uncachedTexts[resultIndex];
            const cacheKey = `${originalText}_${sourceLanguage}_${language}`;

            // Cache the result
            setTranslationCache(prev => new Map(prev.set(cacheKey, translatedText)));
            cachedResults[originalIndex] = translatedText;
          });

          return cachedResults;
        } catch (error) {
          console.error('Bulk translation error:', error);
          // Fill remaining slots with original texts
          uncachedIndices.forEach((originalIndex, resultIndex) => {
            cachedResults[originalIndex] = uncachedTexts[resultIndex];
          });
          return cachedResults;
        } finally {
          setIsTranslating(false);
        }
      } else {
        // No caching - direct API call
        try {
          setIsTranslating(true);
          const result = await TranslationService.translateBulk(texts, language, sourceLanguage);
          return result;
        } catch (error) {
          console.error('Bulk translation error:', error);
          return texts; // Return original texts on error
        } finally {
          setIsTranslating(false);
        }
      }
    },
    [language, translationCache]
  );

  // Synchronous translation function for static content (from JSON files)
  const t = useCallback(
    (key, options = {}) => {
      const { variables = {} } = options;
      return getStaticTranslation(key, variables);
    },
    [getStaticTranslation]
  );

  // Async translation function - tries static first, then dynamic
  const tAsync = useCallback(
    async (key, options = {}) => {
      const { variables = {}, fallbackToDynamic = true, ...translateOptions } = options;

      // First try static translation
      const staticResult = getStaticTranslation(key, variables);

      // If static translation found and not the key itself, return it
      if (staticResult !== key) {
        return staticResult;
      }

      // If fallbackToDynamic is true and we're not in English, try dynamic translation
      if (fallbackToDynamic && language !== 'en') {
        return await translateText(key, translateOptions);
      }

      return key;
    },
    [getStaticTranslation, translateText, language]
  );

  // Format numbers according to locale
  const formatNumber = useCallback(
    (number, options = {}) => {
      try {
        const locale = getLocaleFromLanguage(language);
        return new Intl.NumberFormat(locale, options).format(number);
      } catch (error) {
        return number.toString();
      }
    },
    [language]
  );

  // Format dates according to locale
  const formatDate = useCallback(
    (date, options = {}) => {
      try {
        const locale = getLocaleFromLanguage(language);
        return new Intl.DateTimeFormat(locale, options).format(new Date(date));
      } catch (error) {
        return new Date(date).toLocaleDateString();
      }
    },
    [language]
  );

  // Current language info - compute from current language and supported languages
  const currentLanguageInfo = useMemo(() => {
    return (
      supportedLanguages.find(lang => lang.code === language) || {
        code: language,
        name: language.charAt(0).toUpperCase() + language.slice(1),
        flag: '🌐',
      }
    );
  }, [language, supportedLanguages]);

  // Context value
  const contextValue = useMemo(
    () => ({
      // State
      language,
      direction,
      supportedLanguages,
      isTranslating,
      isLoading,
      currentLanguageInfo,
      translationVersion,

      // Functions
      setLanguage: changeLanguage,
      t,
      tAsync,
      translateText,
      translateBulk,
      formatNumber,
      formatDate,

      // Utilities
      isRTL: direction === 'rtl',
      getStaticTranslation,
      clearCache: () => {
        setTranslationCache(new Map());
        TranslationService.clearCache();
      },
    }),
    [
      language,
      direction,
      supportedLanguages,
      isTranslating,
      isLoading,
      currentLanguageInfo,
      translationVersion,
      changeLanguage,
      t,
      tAsync,
      translateText,
      translateBulk,
      formatNumber,
      formatDate,
      getStaticTranslation,
    ]
  );

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Helper function to get locale from language code
function getLocaleFromLanguage(languageCode) {
  const localeMap = {
    en: 'en-US',
    hi: 'hi-IN',
    bn: 'bn-BD',
    te: 'te-IN',
    mr: 'mr-IN',
    ta: 'ta-IN',
    ur: 'ur-PK',
    gu: 'gu-IN',
    kn: 'kn-IN',
    ml: 'ml-IN',
    pa: 'pa-IN',
    es: 'es-ES',
    fr: 'fr-FR',
    ar: 'ar-SA',
    zh: 'zh-CN',
    de: 'de-DE',
    pt: 'pt-BR',
    ru: 'ru-RU',
    ja: 'ja-JP',
    ko: 'ko-KR',
    it: 'it-IT',
    tr: 'tr-TR',
    th: 'th-TH',
    vi: 'vi-VN',
  };
  return localeMap[languageCode] || 'en-US';
}

// Export the context for advanced use cases
export { LanguageContext };
