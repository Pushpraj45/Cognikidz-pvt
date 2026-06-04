import React, { useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LanguageContext } from '../../contexts/LanguageContext';

/**
 * QuestionStepper Component
 *
 * Displays the assessment progress as a stepper with progress bar
 *
 * @param {Object} props
 * @param {number} props.currentStep - Current step/question number
 * @param {number} props.totalSteps - Total number of steps/questions
 * @param {number} props.progress - Progress percentage (0-100)
 * @param {boolean} props.isNextDisabled - Whether next button is disabled
 * @param {boolean} props.isSubmitting - Whether form is submitting
 */
const QuestionStepper = ({
  currentStep,
  totalSteps,
  progress,
  isNextDisabled = false,
  isSubmitting = false,
}) => {
  // Get current language from context
  const { language } = useContext(LanguageContext);

  // Calculate milestone messages - ENHANCED FOR 15-QUESTION ASSESSMENTS
  const getMilestoneMessage = () => {
    if (progress >= 20 && progress < 40) {
      return {
        text:
          language === 'hi'
            ? 'बहुत अच्छा शुरुआत! आप व्यापक आकलन में उत्कृष्ट प्रगति कर रहे हैं।'
            : "Great start! You're making excellent progress through the comprehensive assessment.",
        emoji: '🌟',
        color: 'from-green-500 to-emerald-500',
      };
    } else if (progress >= 40 && progress < 60) {
      return {
        text:
          language === 'hi'
            ? 'उत्कृष्ट! आप इस विस्तृत आकलन के मध्य बिंदु के करीब पहुंच रहे हैं।'
            : "Excellent! You're approaching the halfway point of this thorough assessment.",
        emoji: '🚀',
        color: 'from-blue-500 to-cyan-500',
      };
    } else if (progress >= 60 && progress < 80) {
      return {
        text:
          language === 'hi'
            ? 'आप बहुत अच्छा कर रहे हैं! व्यापक आकलन लगभग पूरा हो गया है।'
            : "You're doing great! The comprehensive assessment is nearly complete.",
        emoji: '🎯',
        color: 'from-purple-500 to-pink-500',
      };
    } else if (progress >= 80 && progress < 100) {
      return {
        text:
          language === 'hi'
            ? 'लगभग हो गया! इस विस्तृत आकलन को पूरा करने के लिए बस कुछ और प्रश्न।'
            : 'Almost there! Just a few more questions to complete this thorough assessment.',
        emoji: '🎉',
        color: 'from-yellow-500 to-orange-500',
      };
    } else if (progress >= 100) {
      return {
        text:
          language === 'hi'
            ? 'आकलन पूरा! आपकी व्यापक रिपोर्ट तैयार की जा रही है...'
            : 'Assessment complete! Generating your comprehensive report...',
        emoji: '✨',
        color: 'from-yellow-500 to-orange-500',
      };
    }
    return null;
  };

  const milestoneData = getMilestoneMessage();

  // Ensure valid progress calculation
  const validProgress = Math.min(100, Math.max(0, progress || 0));
  const validCurrentStep = Math.max(1, currentStep || 1);
  const validTotalSteps = Math.max(1, totalSteps || 1);

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Enhanced Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg">
            <motion.span
              className="text-white font-bold text-lg"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {validCurrentStep}
            </motion.span>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              Question {validCurrentStep} of {validTotalSteps}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {Math.round((validCurrentStep / validTotalSteps) * 100)}% Complete
            </div>
          </div>
        </motion.div>

        {/* Milestone Message */}
        <AnimatePresence>
          {milestoneData && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white bg-gradient-to-r ${milestoneData.color} shadow-lg backdrop-blur-sm border border-white/20`}
            >
              <motion.span
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                className="text-base"
              >
                {milestoneData.emoji}
              </motion.span>
              <span className="hidden sm:inline">{milestoneData.text}</span>
              <span className="sm:hidden">Great progress!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Enhanced Progress Bar */}
      <motion.div
        className="relative mb-6"
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full overflow-hidden shadow-inner">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full relative overflow-hidden"
            initial={{ width: 0 }}
            animate={{ width: `${validProgress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          >
            {/* Animated shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              style={{ width: '50%' }}
            />
          </motion.div>
        </div>

        {/* Progress percentage floating label */}
        <motion.div
          className="absolute -top-8 bg-white dark:bg-gray-800 px-3 py-1 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-300"
          style={{ left: `${Math.max(0, Math.min(validProgress - 5, 90))}%` }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {validProgress}%
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white dark:border-t-gray-800"></div>
        </motion.div>
      </motion.div>

      {/* Enhanced Step Indicators */}
      {validTotalSteps > 1 && (
        <motion.div
          className="flex justify-center items-center gap-2 flex-wrap"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {Array.from({ length: Math.min(validTotalSteps, 8) }, (_, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < validCurrentStep;
            const isCurrent = stepNumber === validCurrentStep;

            return (
              <motion.div
                key={stepNumber}
                className={`relative flex items-center justify-center transition-all duration-500 ${
                  isCompleted
                    ? 'w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg shadow-green-500/25'
                    : isCurrent
                      ? 'w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25'
                      : 'w-6 h-6 bg-gray-300 dark:bg-gray-600'
                } rounded-full`}
                whileHover={{ scale: 1.1 }}
                animate={
                  isCurrent
                    ? {
                        scale: [1, 1.2, 1],
                        boxShadow: [
                          '0 0 0 0 rgba(59, 130, 246, 0.7)',
                          '0 0 0 10px rgba(59, 130, 246, 0)',
                          '0 0 0 0 rgba(59, 130, 246, 0)',
                        ],
                      }
                    : {}
                }
                transition={isCurrent ? { duration: 2, repeat: Infinity } : { duration: 0.3 }}
              >
                {isCompleted && (
                  <motion.svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </motion.svg>
                )}
                {isCurrent && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-white/50"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  />
                )}
                {!isCompleted && !isCurrent && (
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    {stepNumber}
                  </span>
                )}
              </motion.div>
            );
          })}

          {validTotalSteps > 8 && (
            <motion.div
              className="flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                +{validTotalSteps - 8} more
              </span>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Encouragement Section */}
      <motion.div
        className="mt-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <motion.div
                className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              Processing your response...
            </span>
          ) : validProgress > 0 ? (
            `You're doing great! Keep up the excellent work.`
          ) : (
            `Let's get started with your assessment.`
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default QuestionStepper;
