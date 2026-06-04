import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';
import { ChevronDownIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

const LanguageSelector = ({ className = '', variant = 'default' }) => {
  const {
    language,
    setLanguage,
    supportedLanguages,
    isTranslating,
    currentLanguageInfo,
    isLoading,
  } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Debug logging
  useEffect(() => {
    console.log('🔍 LanguageSelector: Component state:', {
      language,
      supportedLanguagesCount: supportedLanguages.length,
      supportedLanguagesList: supportedLanguages.map(l => ({ code: l.code, name: l.name })),
      isTranslating,
      isLoading,
      currentLanguageInfo,
      isOpen,
    });
  }, [language, supportedLanguages, isTranslating, isLoading, currentLanguageInfo, isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = event => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscapeKey = event => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, []);

  const handleLanguageChange = async langCode => {
    console.log('🔄 LanguageSelector: Attempting to change language to:', langCode);
    console.log('🔍 LanguageSelector: Current language:', language);

    if (langCode === language) {
      console.log('ℹ️ LanguageSelector: Same language selected, closing dropdown');
      setIsOpen(false);
      return;
    }

    try {
      console.log('🔄 LanguageSelector: Calling setLanguage...');
      await setLanguage(langCode);
      console.log('✅ LanguageSelector: Language changed successfully');
      setIsOpen(false);

      // Show success notification (optional)
      if (window.showToast) {
        const selectedLang = supportedLanguages.find(lang => lang.code === langCode);
        window.showToast(`Language changed to ${selectedLang?.name || langCode}`, 'success');
      }
    } catch (error) {
      console.error('❌ LanguageSelector: Failed to change language:', error);
      if (window.showToast) {
        window.showToast('Failed to change language', 'error');
      }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`flex items-center ${className}`}>
        <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Get variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'navbar':
        return {
          button:
            'flex items-center space-x-1 px-2 py-1.5 rounded-lg text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-400 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-all duration-200 text-sm',
          dropdown:
            'absolute top-full mt-2 w-64 max-h-80 overflow-y-auto backdrop-blur-lg bg-white/95 dark:bg-gray-800/95 rounded-lg shadow-xl border border-white/20 dark:border-gray-700/20 z-50 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600',
          item: 'w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-colors text-sm',
        };
      case 'compact':
        return {
          button:
            'flex items-center space-x-1 px-2 py-1 rounded-md text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
          dropdown:
            'absolute top-full mt-1 w-40 max-h-60 overflow-y-auto bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600',
          item: 'w-full flex items-center space-x-2 px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
        };
      default:
        return {
          button:
            'flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
          dropdown:
            'absolute top-full mt-1 w-48 max-h-72 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600',
          item: 'w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={styles.button}
        disabled={isTranslating}
        aria-label="Select language"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <GlobeAltIcon className="w-3.5 h-3.5" />

        {variant !== 'compact' && (
          <>
            <span className="text-base" role="img" aria-label={`${currentLanguageInfo.name} flag`}>
              {currentLanguageInfo.flag}
            </span>
            <span className="font-medium text-xs hidden md:block">{currentLanguageInfo.name}</span>
          </>
        )}

        <ChevronDownIcon
          className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />

        {isTranslating && (
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={styles.dropdown}
            role="listbox"
            aria-label="Language options"
          >
            {supportedLanguages.map((lang, index) => (
              <motion.button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`${styles.item} ${
                  language === lang.code
                    ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-400 font-medium'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
                role="option"
                aria-selected={language === lang.code}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.01 }}
              >
                <span
                  className="text-base flex-shrink-0"
                  role="img"
                  aria-label={`${lang.name} flag`}
                >
                  {lang.flag}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="font-medium truncate block">{lang.name}</span>
                  {variant !== 'compact' && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                      {lang.code}
                    </span>
                  )}
                </div>
                {language === lang.code && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0"
                  />
                )}
              </motion.button>
            ))}

            {supportedLanguages.length === 0 && (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                Loading languages...
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Optional: Mobile-friendly language selector
export const MobileLanguageSelector = ({ className = '' }) => {
  const { language, setLanguage, supportedLanguages, isTranslating, currentLanguageInfo } =
    useLanguage();

  const handleLanguageChange = async event => {
    const langCode = event.target.value;
    if (langCode !== language) {
      await setLanguage(langCode);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <select
        value={language}
        onChange={handleLanguageChange}
        disabled={isTranslating}
        className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        aria-label="Select language"
      >
        {supportedLanguages.map(lang => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>

      <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />

      {isTranslating && (
        <div className="absolute right-8 top-1/2 transform -translate-y-1/2 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      )}
    </div>
  );
};

export default LanguageSelector;
