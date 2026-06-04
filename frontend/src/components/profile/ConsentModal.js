import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../ui/Button';

const ConsentModal = ({ isOpen, onClose, onAgree, assessmentType = 'general' }) => {
  const [isAgreeing, setIsAgreeing] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  if (!isOpen) return null;

  const handleAgree = async () => {
    setIsAgreeing(true);
    try {
      await onAgree();
    } finally {
      setIsAgreeing(false);
    }
  };

  const handleScroll = e => {
    const element = e.target;
    const isScrolledToBottom =
      element.scrollHeight - element.scrollTop <= element.clientHeight + 10;
    if (isScrolledToBottom && !hasScrolled) {
      setHasScrolled(true);
    }
  };

  const getAssessmentTypeTitle = () => {
    switch (assessmentType) {
      case 'adhd':
        return 'ADHD';
      case 'asd':
        return 'Autism Spectrum';
      case 'dyslexia':
        return 'Dyslexia';
      default:
        return 'Developmental';
    }
  };

  const getAssessmentDescription = () => {
    switch (assessmentType) {
      case 'adhd':
        return 'This assessment evaluates attention, hyperactivity, and impulsivity patterns to help identify potential ADHD indicators.';
      case 'asd':
        return 'This assessment examines communication, social interaction, and behavioral patterns to help identify potential autism spectrum indicators.';
      case 'dyslexia':
        return 'This assessment evaluates reading, language processing, and learning patterns to help identify potential dyslexia indicators.';
      default:
        return "This comprehensive assessment evaluates various developmental areas to provide insights into your child's growth and learning patterns.";
    }
  };

  const getThemeColors = () => {
    switch (assessmentType) {
      case 'adhd':
        return {
          primary: 'from-blue-600 to-indigo-600',
          hover: 'from-blue-700 to-indigo-700',
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800',
          text: 'text-blue-900 dark:text-blue-200',
          textSecondary: 'text-blue-800 dark:text-blue-300',
        };
      case 'asd':
        return {
          primary: 'from-purple-600 to-indigo-600',
          hover: 'from-purple-700 to-indigo-700',
          bg: 'bg-purple-50 dark:bg-purple-900/20',
          border: 'border-purple-200 dark:border-purple-800',
          text: 'text-purple-900 dark:text-purple-200',
          textSecondary: 'text-purple-800 dark:text-purple-300',
        };
      case 'dyslexia':
        return {
          primary: 'from-green-600 to-emerald-600',
          hover: 'from-green-700 to-emerald-700',
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-200 dark:border-green-800',
          text: 'text-green-900 dark:text-green-200',
          textSecondary: 'text-green-800 dark:text-green-300',
        };
      default:
        return {
          primary: 'from-emerald-600 to-teal-600',
          hover: 'from-emerald-700 to-teal-700',
          bg: 'bg-emerald-50 dark:bg-emerald-900/20',
          border: 'border-emerald-200 dark:border-emerald-800',
          text: 'text-emerald-900 dark:text-emerald-200',
          textSecondary: 'text-emerald-800 dark:text-emerald-300',
        };
    }
  };

  const colors = getThemeColors();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="consent-title"
          aria-describedby="consent-description"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] flex flex-col"
            role="document"
          >
            {/* Header */}
            <div className={`bg-gradient-to-r ${colors.primary} text-white p-6 rounded-t-2xl`}>
              <div className="flex items-center gap-3 mb-3">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </motion.div>
                <div>
                  <motion.h2
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    id="consent-title"
                    className="text-2xl font-bold"
                  >
                    Assessment Consent & Disclaimer
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-white/90 text-sm"
                  >
                    {getAssessmentTypeTitle()} Assessment
                  </motion.p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="p-6 overflow-auto flex-1"
                id="consent-description"
                onScroll={handleScroll}
              >
                {/* Assessment Description */}
                <div className={`mb-6 p-4 ${colors.bg} rounded-xl border ${colors.border}`}>
                  <h3 className={`font-semibold ${colors.text} mb-2 flex items-center gap-2`}>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    About This Assessment
                  </h3>
                  <p className={`${colors.textSecondary} text-sm leading-relaxed`}>
                    {getAssessmentDescription()}
                  </p>
                </div>

                {/* Important Notice */}
                <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                  <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Important Notice
                  </h3>
                  <p className="text-amber-800 dark:text-amber-300 text-sm leading-relaxed">
                    <strong>This is a screening tool, not a diagnostic assessment.</strong> Results
                    should not replace professional medical or psychological evaluation. Always
                    consult with qualified healthcare providers for diagnosis and treatment
                    decisions.
                  </p>
                </div>

                {/* Consent Points */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-green-600 dark:text-green-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Please confirm the following:
                  </h3>

                  {[
                    {
                      title: 'Parental/Guardian Authority',
                      text: 'I confirm that I am the parent or legal guardian of the child being assessed and have the authority to consent to this evaluation.',
                      icon: '👨‍👩‍👧‍👦',
                    },
                    {
                      title: 'Assessment Purpose',
                      text: 'I understand this assessment is for screening and informational purposes only, designed to identify potential areas of concern that may warrant further professional evaluation.',
                      icon: '🎯',
                    },
                    {
                      title: 'Data Collection & Privacy',
                      text: 'I consent to the collection, processing, and secure storage of assessment data for the purpose of generating personalized insights and recommendations.',
                      icon: '🔒',
                    },
                    {
                      title: 'Professional Consultation',
                      text: 'I understand that this tool does not replace professional medical, psychological, or educational evaluation, and I will consult qualified professionals for any concerns identified.',
                      icon: '🩺',
                    },
                    {
                      title: 'Accuracy of Information',
                      text: 'I commit to providing accurate and honest responses to ensure the most reliable assessment results for my child.',
                      icon: '✅',
                    },
                    {
                      title: 'Results Interpretation',
                      text: 'I understand that assessment results are preliminary indicators and should be interpreted in conjunction with other developmental observations and professional guidance.',
                      icon: '📊',
                    },
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span className="text-2xl mt-1">{item.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                          {item.title}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                          {item.text}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Contact Information */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800"
                >
                  <h3 className="font-semibold text-green-900 dark:text-green-200 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    Questions or Concerns?
                  </h3>
                  <p className="text-green-800 dark:text-green-300 text-sm">
                    If you have any questions about this assessment or need support, contact us at{' '}
                    <a
                      href="mailto:support@cognikidz.com"
                      className="font-medium underline hover:text-green-700 dark:hover:text-green-200"
                    >
                      support@cognikidz.com
                    </a>
                  </p>
                </motion.div>

                {/* Scroll indicator */}
                {!hasScrolled && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center mt-4 text-gray-500 dark:text-gray-400 text-sm"
                  >
                    <svg
                      className="w-4 h-4 mx-auto mb-1 animate-bounce"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Please scroll to read all terms
                  </motion.div>
                )}
              </motion.div>
            </div>

            {/* Footer Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl"
            >
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="sm:order-1"
                  aria-label="Cancel consent"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAgree}
                  isLoading={isAgreeing}
                  disabled={!hasScrolled}
                  className={`sm:order-2 bg-gradient-to-r ${colors.primary} hover:${colors.hover} text-white rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-xl hover:shadow-2xl hover:scale-105 hover:-translate-y-1`}
                  aria-label="Agree to consent and start assessment"
                >
                  {hasScrolled ? (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      I Agree & Start Assessment
                    </>
                  ) : (
                    'Please read all terms above'
                  )}
                </Button>
              </div>
              {hasScrolled && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3"
                >
                  By proceeding, you acknowledge that you have read and agree to all terms above
                </motion.p>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConsentModal;
