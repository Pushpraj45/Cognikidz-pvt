import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import InteractiveScaleOptions from '../ui/InteractiveScaleOptions';
import { LanguageContext } from '../../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';

/**
 * QuestionCard Component
 *
 * Displays a question and collects the user's response based on the question type
 * (MCQ, MSQ, SCALE, VISUAL, TEXT)
 *
 * @param {Object} props
 * @param {Object} props.question - The question object
 * @param {*} props.response - The current response value
 * @param {Function} props.onResponseChange - Callback when response changes
 * @param {Function} props.onHelp - Callback to show help/guidance
 * @param {string} props.childName - Child's name
 * @param {number} props.childAge - Child's age
 */
const QuestionCard = ({ question, response, onResponseChange, onHelp, childName, childAge }) => {
  const [hoveredOption, setHoveredOption] = useState(null);
  const [clickedOption, setClickedOption] = useState(null);

  // Get current language from context and translation hook
  const { language } = useContext(LanguageContext);
  const { t } = useTranslation('assessment');

  // No formatting or cleaning - use question exactly as received from backend
  const displayPrompt = question?.prompt || '';

  // Get simple emoji for scale value
  const getScaleEmoji = value => {
    const emojiMap = {
      1: '😊', // Never - happy
      2: '🙂', // Rarely - slight smile
      3: '😐', // Sometimes - neutral
      4: '😕', // Often - slight frown
      5: '😟', // Always - concerned
    };
    return emojiMap[value] || value;
  };

  // Get scale label with more descriptive text
  const getScaleLabel = value => {
    const labelMap = {
      1: t('question_card.scale_labels.1', { defaultValue: 'Never' }),
      2: t('question_card.scale_labels.2', { defaultValue: 'Rarely' }),
      3: t('question_card.scale_labels.3', { defaultValue: 'Sometimes' }),
      4: t('question_card.scale_labels.4', { defaultValue: 'Often' }),
      5: t('question_card.scale_labels.5', { defaultValue: 'Always' }),
    };
    return labelMap[value] || value;
  };

  // Get scale description for better context
  const getScaleDescription = value => {
    const descMap = {
      1: t('question_card.scale_descriptions.1', { defaultValue: 'Not at all' }),
      2: t('question_card.scale_descriptions.2', { defaultValue: 'Once in a while' }),
      3: t('question_card.scale_descriptions.3', { defaultValue: 'Moderately' }),
      4: t('question_card.scale_descriptions.4', { defaultValue: 'Quite often' }),
      5: t('question_card.scale_descriptions.5', { defaultValue: 'Very frequently' }),
    };
    return descMap[value] || '';
  };

  // Use child name as provided without any cleaning
  const getDisplayChildName = () => {
    return childName || 'Child';
  };

  // Enhanced hover and tap animations for better feedback
  const buttonVariants = {
    idle: {
      scale: 1,
      y: 0,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    hover: {
      scale: 1.02,
      y: -4,
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      transition: { duration: 0.2, ease: 'easeOut' },
    },
    tap: {
      scale: 0.98,
      y: -2,
      transition: { duration: 0.1 },
    },
    selected: {
      scale: 1.02,
      y: -2,
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      transition: { duration: 0.2, ease: 'easeOut' },
    },
  };

  const scaleButtonVariants = {
    idle: {
      scale: 1,
      rotateZ: 0,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    hover: {
      scale: 1.15,
      rotateZ: 3,
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      transition: { duration: 0.2, ease: 'easeOut' },
    },
    tap: {
      scale: 0.95,
      rotateZ: -3,
      transition: { duration: 0.1 },
    },
    selected: {
      scale: 1.2,
      rotateZ: 0,
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      transition: { duration: 0.3, ease: 'easeOut' },
    },
  };

  // Handle option click with visual feedback
  const handleOptionClick = option => {
    setClickedOption(option);
    setTimeout(() => setClickedOption(null), 200);
    onResponseChange(option);
  };

  // Render different input types based on question type
  const renderQuestionInput = () => {
    switch (question.type) {
      case 'MCQ':
        return (
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <motion.button
                key={index}
                variants={buttonVariants}
                initial="idle"
                whileHover="hover"
                whileTap="tap"
                animate={response === option ? 'selected' : 'idle'}
                onHoverStart={() => setHoveredOption(option)}
                onHoverEnd={() => setHoveredOption(null)}
                onClick={() => handleOptionClick(option)}
                className={`w-full p-4 sm:p-5 rounded-2xl text-left transition-all duration-300 backdrop-blur-sm relative overflow-hidden group border-2 ${
                  response === option
                    ? 'bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 border-blue-500 dark:border-blue-400 text-blue-700 dark:text-blue-300 shadow-xl shadow-blue-500/25 dark:shadow-blue-500/40'
                    : 'bg-white/80 dark:bg-gray-800/80 border-gray-200/60 dark:border-gray-600/60 hover:border-blue-300 dark:hover:border-blue-500 text-gray-700 dark:text-gray-300 hover:bg-blue-50/80 dark:hover:bg-blue-900/30 hover:shadow-lg'
                }`}
              >
                {/* Enhanced ripple effect */}
                <AnimatePresence>
                  {clickedOption === option && (
                    <motion.div
                      className="absolute inset-0 bg-blue-400/30 dark:bg-blue-400/40 rounded-2xl"
                      initial={{ scale: 0, opacity: 0.6 }}
                      animate={{ scale: 2, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                  )}
                </AnimatePresence>

                {/* Enhanced gradient background animation */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-purple-400/10 to-pink-400/10 dark:from-blue-400/20 dark:via-purple-400/20 dark:to-pink-400/20 rounded-2xl opacity-0"
                  animate={hoveredOption === option ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />

                {/* Enhanced selection indicator with better animation */}
                <motion.div
                  className="absolute top-3 right-3 sm:top-4 sm:right-4"
                  initial={{ scale: 0, opacity: 0, rotate: -180 }}
                  animate={
                    response === option
                      ? { scale: 1, opacity: 1, rotate: 0 }
                      : { scale: 0, opacity: 0, rotate: -180 }
                  }
                  transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
                >
                  <div className="w-7 h-7 bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/25 dark:shadow-blue-500/40">
                    <motion.svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </motion.svg>
                  </div>
                </motion.div>

                <span className="relative z-10 font-medium text-sm sm:text-base pr-12">
                  {option}
                </span>
              </motion.button>
            ))}
          </div>
        );

      case 'MSQ':
        return (
          <div className="space-y-3">
            {question.options.map((option, index) => {
              const isSelected = Array.isArray(response) && response.includes(option);

              return (
                <motion.button
                  key={index}
                  variants={buttonVariants}
                  initial="idle"
                  whileHover="hover"
                  whileTap="tap"
                  animate={isSelected ? 'selected' : 'idle'}
                  onHoverStart={() => setHoveredOption(option)}
                  onHoverEnd={() => setHoveredOption(null)}
                  onClick={() => {
                    setClickedOption(option);
                    setTimeout(() => setClickedOption(null), 200);
                    if (Array.isArray(response)) {
                      if (isSelected) {
                        onResponseChange(response.filter(item => item !== option));
                      } else {
                        onResponseChange([...response, option]);
                      }
                    } else {
                      onResponseChange([option]);
                    }
                  }}
                  className={`w-full p-4 sm:p-5 rounded-2xl text-left transition-all duration-300 flex items-center backdrop-blur-sm relative overflow-hidden border-2 ${
                    isSelected
                      ? 'bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-teal-500/20 border-green-500 dark:border-green-400 text-green-700 dark:text-green-300 shadow-xl shadow-green-500/25 dark:shadow-green-500/40'
                      : 'bg-white/80 dark:bg-gray-800/80 border-gray-200/60 dark:border-gray-600/60 hover:border-green-300 dark:hover:border-green-500 text-gray-700 dark:text-gray-300 hover:bg-green-50/80 dark:hover:bg-green-900/30 hover:shadow-lg'
                  }`}
                >
                  {/* Enhanced ripple effect */}
                  <AnimatePresence>
                    {clickedOption === option && (
                      <motion.div
                        className="absolute inset-0 bg-green-400/30 dark:bg-green-400/40 rounded-2xl"
                        initial={{ scale: 0, opacity: 0.6 }}
                        animate={{ scale: 2, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                      />
                    )}
                  </AnimatePresence>

                  {/* Enhanced checkbox with better animations and light/dark mode support */}
                  <motion.div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center mr-4 relative border-2 ${
                      isSelected
                        ? 'bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600 border-green-500 dark:border-green-400 shadow-lg shadow-green-500/25 dark:shadow-green-500/40'
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                    }`}
                    animate={
                      isSelected
                        ? {
                            scale: [1, 1.2, 1],
                            rotate: [0, 5, -5, 0],
                          }
                        : { scale: 1, rotate: 0 }
                    }
                    transition={{ duration: 0.4, type: 'spring' }}
                  >
                    <motion.svg
                      className="h-4 w-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      initial={{ scale: 0, rotate: -90, pathLength: 0 }}
                      animate={
                        isSelected
                          ? { scale: 1, rotate: 0, pathLength: 1 }
                          : { scale: 0, rotate: -90, pathLength: 0 }
                      }
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </motion.svg>
                  </motion.div>
                  <span className="relative z-10 font-medium text-sm sm:text-base">{option}</span>
                </motion.button>
              );
            })}
          </div>
        );

      case 'SCALE':
        // Get option labels from the question if available, otherwise use defaults
        const optionLabels = question.optionLabels || [
          t('question_card.scale_labels.1', { defaultValue: 'Never' }),
          t('question_card.scale_labels.2', { defaultValue: 'Rarely' }),
          t('question_card.scale_labels.3', { defaultValue: 'Sometimes' }),
          t('question_card.scale_labels.4', { defaultValue: 'Often' }),
          t('question_card.scale_labels.5', { defaultValue: 'Always' }),
        ];
                 const scaleOptions = question.options || [
           t('question_card.scale_options.1'),
           t('question_card.scale_options.2'),
           t('question_card.scale_options.3'),
           t('question_card.scale_options.4'),
           t('question_card.scale_options.5')
         ];

        return (
          <div className="py-6">
            <InteractiveScaleOptions
              options={scaleOptions}
              optionLabels={optionLabels}
              selectedValue={response}
              onSelect={handleOptionClick}
              className="max-w-2xl mx-auto"
              language={language}
            />

            {/* Enhanced selected option display with better light/dark mode support */}
            <AnimatePresence>
              {response && (
                <motion.div
                  initial={{ opacity: 0, y: 30, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -30, scale: 0.8 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="text-center p-6 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/30 dark:via-purple-900/30 dark:to-pink-900/30 rounded-2xl border-2 border-blue-200 dark:border-blue-600 shadow-xl backdrop-blur-sm max-w-2xl mx-auto relative overflow-hidden"
                >
                  {/* Animated background pattern */}
                  <div className="absolute inset-0 opacity-5 dark:opacity-10">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-2xl" />
                  </div>

                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10"
                  >
                    <motion.div
                      className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-blue-500/25 dark:shadow-blue-500/40"
                      animate={{
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatType: 'reverse',
                      }}
                    >
                      {response}
                    </motion.div>
                    <div className="text-center sm:text-left">
                      <motion.span
                        className="text-blue-700 dark:text-blue-300 font-bold text-xl sm:text-2xl block"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                                                 {optionLabels[parseInt(response) - 1] || t('question_card.selected')}
                      </motion.span>
                      <motion.p
                        className="text-sm text-gray-600 dark:text-gray-400 mt-1"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        {t('question_card.response_recorded', { value: response })}
                      </motion.p>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );

      case 'TEXT':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <div className="relative">
              <motion.textarea
                value={response || ''}
                onChange={e => onResponseChange(e.target.value)}
                placeholder={t('question_card.text_placeholder')}
                className="w-full p-4 sm:p-5 rounded-2xl bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300 h-32 sm:h-40 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 backdrop-blur-sm shadow-lg hover:shadow-xl"
                whileFocus={{ scale: 1.01, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
              />

              {/* Enhanced character counter and status with better light/dark mode support */}
              <motion.div
                className="flex justify-between items-center mt-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: response ? 1 : 0.5 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-2">
                  {response && response.length > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-1 text-green-600 dark:text-green-400"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                                             <span className="text-sm font-medium">{t('question_card.answer_provided')}</span>
                    </motion.div>
                  )}
                </div>
                                 <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                   {t('question_card.characters', { count: response?.length || 0 })}
                 </span>
              </motion.div>
            </div>
          </motion.div>
        );

      case 'VISUAL':
        return (
          <div className="grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 gap-3 xs:gap-4 sm:gap-6">
            {question.options.map((option, index) => (
              <motion.button
                key={index}
                variants={buttonVariants}
                initial="idle"
                whileHover="hover"
                whileTap="tap"
                animate={response === option ? 'selected' : 'idle'}
                onClick={() => handleOptionClick(option)}
                className={`aspect-square rounded-2xl overflow-hidden transition-all duration-300 backdrop-blur-sm relative border-2 ${
                  response === option
                    ? 'ring-4 ring-blue-500/50 dark:ring-blue-400/50 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 border-blue-500 dark:border-blue-400 shadow-xl shadow-blue-500/25 dark:shadow-blue-500/40'
                    : 'bg-white/90 dark:bg-gray-800/90 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-lg'
                }`}
              >
                {/* Enhanced placeholder for visual content with better light/dark mode support */}
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                  <motion.span
                    className="text-3xl sm:text-4xl font-bold text-gray-400 dark:text-gray-500"
                    whileHover={{ scale: 1.2, rotate: 5 }}
                  >
                    {index + 1}
                  </motion.span>
                </div>

                {/* Enhanced selection indicator with better styling */}
                <AnimatePresence>
                  {response === option && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                      className="absolute top-3 right-3 w-8 h-8 bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/25 dark:shadow-blue-500/40"
                    >
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
          </div>
        );

      default:
        return (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/40 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg
                className="w-8 h-8 text-yellow-600 dark:text-yellow-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <p className="text-gray-600 dark:text-gray-300 font-medium text-lg">
                             {t('question_card.question_type_not_supported', { type: question.type })}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {t('question_card.contact_support_message')}
            </p>
          </motion.div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/30 dark:border-gray-700/60 relative overflow-hidden"
    >
      {/* Enhanced decorative background gradient with better light/dark mode support */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-transparent to-purple-50/60 dark:from-blue-900/20 dark:via-transparent dark:to-purple-900/20 pointer-events-none" />

      {/* Subtle animated background pattern */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-3xl" />
      </div>

      {/* Question header with enhanced styling */}
      <div className="relative z-10 mb-8">
        <motion.h2
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4 leading-relaxed"
        >
          {displayPrompt}
        </motion.h2>

        {/* Enhanced question metadata with better visual hierarchy */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400"
        >
          {question.skill && (
            <motion.span
              className="px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 text-blue-700 dark:text-blue-300 rounded-full font-medium border border-blue-200 dark:border-blue-600 shadow-sm"
              whileHover={{ scale: 1.05, y: -2 }}
              transition={{ duration: 0.2 }}
            >
              {question.skill}
            </motion.span>
          )}
          <motion.span
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <svg
              className="w-4 h-4 text-gray-600 dark:text-gray-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
              />
            </svg>
                         <span>{t('question_card.assessment_for', { childName: getDisplayChildName() })}</span>
          </motion.span>
        </motion.div>
      </div>

      {/* Question input with enhanced container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="relative z-10"
      >
        {renderQuestionInput()}
      </motion.div>

      {/* Enhanced help button with better styling */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="mt-8 flex justify-center"
      >
        <motion.button
          onClick={onHelp}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-600 rounded-xl transition-all duration-200 backdrop-blur-sm shadow-md hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-500"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {t('question_card.need_help')}
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default QuestionCard;
