import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * Custom hook for component-level translations
 * @param {Object} options - Configuration options
 * @returns {Object} - Translation utilities
 */
export const useTranslation = (options = {}) => {
  const {
    language,
    t: contextT,
    tAsync: contextTAsync,
    translateText,
    translateBulk,
    formatNumber,
    formatDate,
    isTranslating: globalIsTranslating,
    currentLanguageInfo,
    direction,
    isRTL,
  } = useLanguage();

  const {
    namespace = '',
    fallbackToKey = true,
    cacheResults = true,
    autoTranslate = false,
  } = options;

  const [localTranslations, setLocalTranslations] = useState(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Enhanced synchronous translation function with namespace support
  const t = useCallback(
    (key, options = {}) => {
      if (!key) return '';

      const { variables = {}, useNamespace = true } = options;

      // Add namespace if provided and requested
      const fullKey = useNamespace && namespace ? `${namespace}.${key}` : key;

      try {
        const result = contextT(fullKey, { variables });
        return result;
      } catch (err) {
        console.error('Translation error:', err);
        setError(err);
        return fallbackToKey ? key : '';
      }
    },
    [contextT, namespace, fallbackToKey]
  );

  // Enhanced async translation function with namespace support
  const tAsync = useCallback(
    async (key, options = {}) => {
      if (!key) return '';

      const { variables = {}, useNamespace = true, ...translateOptions } = options;

      // Add namespace if provided and requested
      const fullKey = useNamespace && namespace ? `${namespace}.${key}` : key;

      try {
        const result = await contextTAsync(fullKey, { variables, ...translateOptions });
        return result;
      } catch (err) {
        console.error('Translation error:', err);
        setError(err);
        return fallbackToKey ? key : '';
      }
    },
    [contextTAsync, namespace, fallbackToKey]
  );

  // Synchronous translation for static content (from JSON files)
  const tSync = useCallback(
    (key, variables = {}) => {
      const fullKey = namespace ? `${namespace}.${key}` : key;

      // This uses the static translation directly without async
      // Suitable for pre-defined translations in JSON files
      try {
        const result = contextT(fullKey, { variables, fallbackToDynamic: false });
        return result;
      } catch (err) {
        console.error('Sync translation error:', err);
        return fallbackToKey ? key : '';
      }
    },
    [contextT, namespace, fallbackToKey]
  );

  // Translate multiple keys at once
  const translateMultiple = useCallback(
    async (keys, options = {}) => {
      if (!Array.isArray(keys) || keys.length === 0) return {};

      setIsLoading(true);
      setError(null);

      try {
        const translations = {};

        // Check cache first if enabled
        if (cacheResults) {
          const uncachedKeys = [];
          keys.forEach(key => {
            const fullKey = namespace ? `${namespace}.${key}` : key;
            if (localTranslations.has(fullKey)) {
              translations[key] = localTranslations.get(fullKey);
            } else {
              uncachedKeys.push(key);
            }
          });

          if (uncachedKeys.length === 0) {
            return translations;
          }

          // Translate uncached keys
          const promises = uncachedKeys.map(async key => {
            const result = await tAsync(key, options);
            return { key, result };
          });

          const results = await Promise.allSettled(promises);

          results.forEach(({ status, value }) => {
            if (status === 'fulfilled' && value) {
              translations[value.key] = value.result;
              // Cache the result
              const fullKey = namespace ? `${namespace}.${value.key}` : value.key;
              setLocalTranslations(prev => new Map(prev.set(fullKey, value.result)));
            }
          });
        } else {
          // Translate all keys without caching
          const promises = keys.map(async key => {
            const result = await tAsync(key, options);
            return { key, result };
          });

          const results = await Promise.allSettled(promises);

          results.forEach(({ status, value }) => {
            if (status === 'fulfilled' && value) {
              translations[value.key] = value.result;
            }
          });
        }

        return translations;
      } catch (err) {
        setError(err);
        console.error('Multiple translation error:', err);

        // Return fallback object
        const fallbackTranslations = {};
        keys.forEach(key => {
          fallbackTranslations[key] = fallbackToKey ? key : '';
        });
        return fallbackTranslations;
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [tAsync, namespace, cacheResults, localTranslations, fallbackToKey]
  );

  // Translate dynamic content (not in JSON files)
  const translateDynamic = useCallback(async (text, options = {}) => {
    // Dynamic translation disabled; return original text
    return text;
  }, []);

  // Translate array of dynamic texts
  const translateDynamicBulk = useCallback(async (texts, options = {}) => {
    // Dynamic bulk translation disabled; return original texts
    return texts;
  }, []);

  // Format number with current locale
  const n = useCallback(
    (number, options = {}) => {
      return formatNumber(number, options);
    },
    [formatNumber]
  );

  // Format date with current locale
  const d = useCallback(
    (date, options = {}) => {
      return formatDate(date, options);
    },
    [formatDate]
  );

  // Get localized string with pluralization support
  const plural = useCallback(
    async (key, count, options = {}) => {
      const { variables = {}, ...otherOptions } = options;

      // Determine plural form based on count and language
      const pluralKey = getPluralKey(key, count, language);

      return await tAsync(pluralKey, {
        variables: { count, ...variables },
        ...otherOptions,
      });
    },
    [tAsync, language]
  );

  // Clear local translation cache
  const clearCache = useCallback(() => {
    setLocalTranslations(new Map());
  }, []);

  // Get translation with fallback chain
  const tWithFallback = useCallback(
    async (keys, options = {}) => {
      if (!Array.isArray(keys)) keys = [keys];

      for (const key of keys) {
        try {
          const result = await tAsync(key, options);
          if (result && result !== key) {
            return result;
          }
        } catch (err) {
          console.warn(`Translation failed for key: ${key}`, err);
          continue;
        }
      }

      // Return last key if all translations fail
      return fallbackToKey ? keys[keys.length - 1] : '';
    },
    [tAsync, fallbackToKey]
  );

  // Auto-translate effect for dynamic content
  useEffect(() => {
    if (autoTranslate && language !== 'en') {
      // Auto-translate content when language changes
      // This could be used for dynamic content that needs translation
    }
  }, [language, autoTranslate]);

  return {
    // Core translation functions
    t,
    tAsync,
    tSync,
    translateMultiple,
    translateDynamic,
    translateDynamicBulk,
    tWithFallback,

    // Formatting functions
    n,
    d,
    plural,

    // Language info
    language,
    currentLanguageInfo,
    direction,
    isRTL,

    // State
    isLoading: isLoading || globalIsTranslating,
    error,

    // Utilities
    clearCache,
    namespace,

    // Checks
    isTranslating: isLoading || globalIsTranslating,
    hasError: !!error,
  };
};

/**
 * Hook for translating content that changes frequently
 */
export const useDynamicTranslation = (initialText = '', options = {}) => {
  const { translateDynamic, language, isTranslating } = useTranslation();
  const [translatedText, setTranslatedText] = useState(initialText);
  const [isLoading, setIsLoading] = useState(false);
  const previousLanguage = useRef(language);
  const previousText = useRef(initialText);

  useEffect(() => {
    const shouldTranslate =
      (initialText && initialText !== previousText.current) ||
      language !== previousLanguage.current;

    if (shouldTranslate) {
      setIsLoading(true);

      translateDynamic(initialText, options)
        .then(result => {
          setTranslatedText(result);
          previousText.current = initialText;
          previousLanguage.current = language;
        })
        .catch(err => {
          console.error('Dynamic translation error:', err);
          setTranslatedText(initialText); // Fallback to original
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [initialText, language, translateDynamic, options]);

  return {
    text: translatedText,
    isLoading: isLoading || isTranslating,
    originalText: initialText,
  };
};

/**
 * Hook for page-level translations
 */
export const usePageTranslation = pageName => {
  return useTranslation({ namespace: pageName });
};

// Helper function to determine plural form
function getPluralKey(baseKey, count, language) {
  // Simplified pluralization rules
  // In a real implementation, you might want to use a library like 'plural-forms'

  const absCount = Math.abs(count);

  switch (language) {
    case 'en':
      return absCount === 1 ? `${baseKey}_one` : `${baseKey}_other`;
    case 'hi':
      return absCount === 1 ? `${baseKey}_one` : `${baseKey}_other`;
    case 'fr':
      return absCount <= 1 ? `${baseKey}_one` : `${baseKey}_other`;
    case 'ru':
      // Russian has complex plural rules
      if (absCount % 10 === 1 && absCount % 100 !== 11) {
        return `${baseKey}_one`;
      } else if ([2, 3, 4].includes(absCount % 10) && ![12, 13, 14].includes(absCount % 100)) {
        return `${baseKey}_few`;
      } else {
        return `${baseKey}_many`;
      }
    default:
      return absCount === 1 ? `${baseKey}_one` : `${baseKey}_other`;
  }
}

/**
 * Hook for automatic re-translation of dynamic content when language changes
 * @param {string} text - Text to translate
 * @param {Object} options - Translation options
 * @returns {string} - Translated text that updates when language changes
 */
export const useAutoTranslate = (text, options = {}) => {
  const { language, translateText } = useLanguage();
  const [translatedText, setTranslatedText] = useState(text);
  const [isLoading, setIsLoading] = useState(false);
  const lastLanguageRef = useRef(language);
  const lastTextRef = useRef(text);

  useEffect(() => {
    const performTranslation = async () => {
      if (!text || language === 'en') {
        setTranslatedText(text);
        return;
      }

      // Only translate if language or text actually changed
      const languageChanged = language !== lastLanguageRef.current;
      const textChanged = text !== lastTextRef.current;

      if (!languageChanged && !textChanged) {
        return;
      }

      setIsLoading(true);
      try {
        const result = await translateText(text, {
          useCache: true, // Enable caching
          ...options,
        });
        setTranslatedText(result);

        // Update refs
        lastLanguageRef.current = language;
        lastTextRef.current = text;
      } catch (error) {
        console.error('❌ useAutoTranslate: Translation failed:', error);
        setTranslatedText(text); // Fallback to original
      } finally {
        setIsLoading(false);
      }
    };

    performTranslation();
  }, [text, language, translateText]); // Removed translationVersion to avoid unnecessary re-runs

  return {
    text: translatedText,
    isLoading,
  };
};

/**
 * Hook for bulk translation of multiple texts that updates when language changes
 * @param {Array} texts - Array of texts to translate
 * @param {Object} options - Translation options
 * @returns {Object} - Object with translated texts array and loading state
 */
export const useAutoTranslateBulk = (texts, options = {}) => {
  const { language, translateBulk } = useLanguage();
  const [translatedTexts, setTranslatedTexts] = useState(texts);
  const [isLoading, setIsLoading] = useState(false);
  const lastLanguageRef = useRef(language);
  const lastTextsRef = useRef(texts);
  const lastTextsHashRef = useRef('');

  useEffect(() => {
    const performBulkTranslation = async () => {
      if (!texts || texts.length === 0 || language === 'en') {
        setTranslatedTexts(texts);
        return;
      }

      // Create a hash of the texts for efficient comparison
      const textsHash = JSON.stringify(texts);

      // Check if we actually need to translate (avoid unnecessary calls)
      const languageChanged = language !== lastLanguageRef.current;
      const textsChanged = textsHash !== lastTextsHashRef.current;

      if (!languageChanged && !textsChanged) {
        return;
      }

      // Only translate if language changed OR texts changed

      setIsLoading(true);

      try {
        const results = await translateBulk(texts, {
          sourceLanguage: 'en',
          useCache: true, // Enable caching
          ...options,
        });

        setTranslatedTexts(results);

        // Update refs to track last successful translation
        lastLanguageRef.current = language;
        lastTextsRef.current = [...texts]; // Create a copy
        lastTextsHashRef.current = textsHash;
      } catch (error) {
        console.error('❌ useAutoTranslateBulk: Translation failed:', error);
        setTranslatedTexts(texts); // Fallback to original
      } finally {
        setIsLoading(false);
      }
    };

    performBulkTranslation();
  }, [texts, language, translateBulk]); // Removed translationVersion to avoid unnecessary re-runs

  return {
    texts: translatedTexts,
    isLoading,
  };
};

export default useTranslation;
