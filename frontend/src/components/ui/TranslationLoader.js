import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';
import LogoLoader from './LogoLoader';

const TranslationLoader = () => {
  const { isTranslating, translationMessage } = useLanguage();

  return (
    <AnimatePresence>
      {isTranslating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="backdrop-blur-lg bg-white/90 dark:bg-gray-800/90 rounded-2xl p-8 shadow-xl max-w-md w-full mx-4 border border-white/20 dark:border-gray-700/20"
          >
            <LogoLoader
              size="large"
              message={translationMessage || 'Translating content, please wait...'}
              showMessage={true}
            />

            {/* Additional translation-specific elements */}
            <motion.div
              className="mt-4 flex items-center justify-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex gap-1">
                {[0, 1, 2].map(index => (
                  <motion.div
                    key={index}
                    className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: index * 0.2,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>
            </motion.div>

            <motion.p
              className="text-sm text-gray-600 dark:text-gray-400 text-center mt-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              This will only take a moment...
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TranslationLoader;
