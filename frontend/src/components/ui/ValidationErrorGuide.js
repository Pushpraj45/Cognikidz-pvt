import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XMarkIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';

const ValidationErrorGuide = ({ isOpen, onClose, error = null, className = '' }) => {
  const [activeTab, setActiveTab] = useState('current');

  // Common validation errors and their solutions
  const errorSolutions = {
    enum: {
      title: 'Invalid Selection',
      description: "You've selected an option that isn't available.",
      solutions: [
        "Check that you're selecting from the provided options only",
        "Don't type custom text in dropdown fields",
        'Use the checkboxes or dropdown menus provided',
        'If you need to specify something custom, use the "Other" option and the text field',
      ],
      severity: 'high',
    },
    concerns: {
      title: 'Concerns Selection Issue',
      description: "There's a problem with your concerns selection.",
      solutions: [
        'Select concerns from the provided checkboxes only',
        'If you have other concerns, select "Other Concerns" and describe them in the text field',
        'You can select multiple concerns - this helps us provide better assessments',
        "Don't leave custom text in places that expect predefined options",
      ],
      severity: 'high',
    },
    required: {
      title: 'Missing Required Information',
      description: 'Some required fields are empty.',
      solutions: [
        'Fill in all fields marked with a red asterisk (*)',
        "Make sure the child's name is not empty",
        'Select a valid date of birth',
        'Choose a gender option',
        'Check that parental consent is given',
      ],
      severity: 'high',
    },
    date: {
      title: 'Date of Birth Issue',
      description: 'The date of birth is invalid or not in the expected range.',
      solutions: [
        'Child must be between 1-16 years old',
        'Date cannot be in the future',
        'Use the date picker provided',
        'Make sure the date format is correct (YYYY-MM-DD)',
      ],
      severity: 'medium',
    },
    consent: {
      title: 'Parental Consent Required',
      description: 'Parental consent is required to create a child profile.',
      solutions: [
        'Check the parental consent checkbox',
        'Read and understand the consent terms',
        'Contact us if you have questions about the consent process',
      ],
      severity: 'high',
    },
    gender: {
      title: 'Gender Selection Required',
      description: 'Please select a gender option.',
      solutions: [
        'Choose from: Male, Female, Other, or Prefer not to say',
        'This field is required for assessment customization',
        'Select "Prefer not to say" if you don\'t want to specify',
      ],
      severity: 'medium',
    },
  };

  // Get error type from error message
  const getErrorType = errorMessage => {
    if (!errorMessage) return null;

    const message = errorMessage.toLowerCase();

    if (message.includes('enum') || message.includes('not a valid enum value')) return 'enum';
    if (message.includes('concerns')) return 'concerns';
    if (message.includes('required')) return 'required';
    if (message.includes('date') || message.includes('birth')) return 'date';
    if (message.includes('consent')) return 'consent';
    if (message.includes('gender')) return 'gender';

    return 'general';
  };

  const currentError = error ? getErrorType(error) : null;
  const errorInfo = currentError ? errorSolutions[currentError] : null;

  // Common issues parents face
  const commonIssues = [
    {
      issue: 'Typing custom concerns instead of selecting from options',
      solution:
        'Use the provided checkboxes for concerns. Select "Other Concerns" for custom descriptions.',
      example: 'Instead of typing "ADHD symptoms", select the "ADHD/Attention Issues" checkbox.',
    },
    {
      issue: 'Child appears too young or too old',
      solution: 'Check the birth year. Our system supports children aged 1-16 years only.',
      example: 'If born in 2025, wait until the child is at least 1 year old.',
    },
    {
      issue: 'Forgetting to give parental consent',
      solution: 'Scroll down to find and check the parental consent checkbox.',
      example: 'Look for "I give consent..." checkbox at the bottom of the form.',
    },
    {
      issue: 'Using special characters in names',
      solution: 'Use only letters, spaces, and common punctuation in names.',
      example: 'Use "Mary-Jane" instead of "Mary_Jane" or "Mary@Jane".',
    },
    {
      issue: 'Selecting wrong gender options',
      solution: 'Choose from the four provided options or contact support for assistance.',
      example: 'Select "Other" if none of the standard options fit your child.',
    },
  ];

  const tabs = [
    { id: 'current', label: 'Current Issue', icon: ExclamationTriangleIcon },
    { id: 'common', label: 'Common Issues', icon: QuestionMarkCircleIcon },
    { id: 'tips', label: 'Success Tips', icon: CheckCircleIcon },
  ];

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden ${className}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <InformationCircleIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Validation Help Guide
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Let's fix this issue together
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isDisabled = tab.id === 'current' && !currentError;

            return (
              <button
                key={tab.id}
                onClick={() => !isDisabled && setActiveTab(tab.id)}
                disabled={isDisabled}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : isDisabled
                      ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <AnimatePresence mode="wait">
            {activeTab === 'current' && currentError && errorInfo && (
              <motion.div
                key="current"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {/* Current Error */}
                <div
                  className={`p-4 rounded-lg border-l-4 ${
                    errorInfo.severity === 'high'
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                      : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
                  }`}
                >
                  <h3
                    className={`font-semibold ${
                      errorInfo.severity === 'high'
                        ? 'text-red-900 dark:text-red-100'
                        : 'text-yellow-900 dark:text-yellow-100'
                    }`}
                  >
                    {errorInfo.title}
                  </h3>
                  <p
                    className={`text-sm mt-1 ${
                      errorInfo.severity === 'high'
                        ? 'text-red-700 dark:text-red-300'
                        : 'text-yellow-700 dark:text-yellow-300'
                    }`}
                  >
                    {errorInfo.description}
                  </p>
                  {error && (
                    <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono text-gray-600 dark:text-gray-400">
                      Error: {error}
                    </div>
                  )}
                </div>

                {/* Solutions */}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    How to fix this:
                  </h4>
                  <div className="space-y-2">
                    {errorInfo.solutions.map((solution, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mt-0.5">
                          <span className="text-xs font-medium text-green-600 dark:text-green-400">
                            {index + 1}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{solution}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'current' && !currentError && (
              <motion.div
                key="no-current"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-8"
              >
                <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Active Issues
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Everything looks good! Check the other tabs for helpful tips.
                </p>
              </motion.div>
            )}

            {activeTab === 'common' && (
              <motion.div
                key="common"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                    Common Issues & Solutions
                  </h3>
                  <div className="space-y-4">
                    {commonIssues.map((item, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                      >
                        <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
                          ❌ {item.issue}
                        </h4>
                        <p className="text-sm text-green-800 dark:text-green-200 mb-2">
                          ✅ {item.solution}
                        </p>
                        <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                          <strong>Example:</strong> {item.example}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'tips' && (
              <motion.div
                key="tips"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                    Tips for Success
                  </h3>
                  <div className="grid gap-4">
                    {[
                      {
                        icon: '🎯',
                        title: 'Use Provided Options',
                        description:
                          'Always select from checkboxes and dropdowns rather than typing custom text',
                      },
                      {
                        icon: '📝',
                        title: 'Fill Required Fields',
                        description: 'Look for red asterisks (*) to identify required fields',
                      },
                      {
                        icon: '📅',
                        title: 'Check Dates Carefully',
                        description: 'Ensure birth date makes the child 1-16 years old',
                      },
                      {
                        icon: '✅',
                        title: 'Review Before Submitting',
                        description: 'Double-check all selections and consent checkboxes',
                      },
                      {
                        icon: '💬',
                        title: 'Use "Other" Options',
                        description:
                          'When you need custom input, look for "Other" options with text fields',
                      },
                      {
                        icon: '🔒',
                        title: 'Privacy First',
                        description: 'Use nicknames if you prefer not to use real names',
                      },
                    ].map((tip, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
                      >
                        <span className="text-2xl">{tip.icon}</span>
                        <div>
                          <h4 className="font-medium text-green-900 dark:text-green-100">
                            {tip.title}
                          </h4>
                          <p className="text-sm text-green-700 dark:text-green-300">
                            {tip.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Still having trouble? Contact our support team for help.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Got it!
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ValidationErrorGuide;
