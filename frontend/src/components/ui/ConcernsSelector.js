import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const ConcernsSelector = ({
  selectedConcerns = [],
  onConcernsChange,
  otherConcern = '',
  onOtherConcernChange,
  className = '',
  showOtherField = true,
  required = false,
}) => {
  const [showTooltip, setShowTooltip] = useState(null);

  // Define the available concerns with user-friendly labels and descriptions
  const concernsOptions = [
    {
      id: 'adhd',
      label: 'ADHD/Attention Issues',
      description: 'Attention Deficit Hyperactivity Disorder, difficulty focusing or hyperactivity',
      color: 'blue',
    },
    {
      id: 'autism',
      label: 'Autism Spectrum',
      description: 'Autism Spectrum Disorder, social communication and interaction differences',
      color: 'purple',
    },
    {
      id: 'dyslexia',
      label: 'Dyslexia/Reading',
      description: 'Dyslexia or other reading and language processing difficulties',
      color: 'green',
    },
    {
      id: 'communication',
      label: 'Communication',
      description: 'Speech, language, or communication delays or difficulties',
      color: 'orange',
    },
    {
      id: 'motor_skills',
      label: 'Motor Skills',
      description: 'Fine or gross motor skill development concerns',
      color: 'red',
    },
    {
      id: 'social',
      label: 'Social Skills',
      description: 'Difficulty with social interactions, making friends, or social situations',
      color: 'pink',
    },
    {
      id: 'behavior',
      label: 'Behavioral Issues',
      description: 'Challenging behaviors, emotional regulation, or conduct concerns',
      color: 'yellow',
    },
    {
      id: 'other',
      label: 'Other Concerns',
      description: 'Other developmental, learning, or behavioral concerns not listed above',
      color: 'gray',
    },
  ];

  const handleConcernToggle = concernId => {
    const updatedConcerns = selectedConcerns.includes(concernId)
      ? selectedConcerns.filter(id => id !== concernId)
      : [...selectedConcerns, concernId];

    onConcernsChange(updatedConcerns);
  };

  const getColorClasses = (color, isSelected) => {
    const colorMap = {
      blue: isSelected
        ? 'bg-blue-100 border-blue-500 text-blue-800 dark:bg-blue-900/30 dark:border-blue-400 dark:text-blue-200'
        : 'border-blue-200 hover:border-blue-300 dark:border-blue-700 dark:hover:border-blue-600',
      purple: isSelected
        ? 'bg-purple-100 border-purple-500 text-purple-800 dark:bg-purple-900/30 dark:border-purple-400 dark:text-purple-200'
        : 'border-purple-200 hover:border-purple-300 dark:border-purple-700 dark:hover:border-purple-600',
      green: isSelected
        ? 'bg-green-100 border-green-500 text-green-800 dark:bg-green-900/30 dark:border-green-400 dark:text-green-200'
        : 'border-green-200 hover:border-green-300 dark:border-green-700 dark:hover:border-green-600',
      orange: isSelected
        ? 'bg-orange-100 border-orange-500 text-orange-800 dark:bg-orange-900/30 dark:border-orange-400 dark:text-orange-200'
        : 'border-orange-200 hover:border-orange-300 dark:border-orange-700 dark:hover:border-orange-600',
      red: isSelected
        ? 'bg-red-100 border-red-500 text-red-800 dark:bg-red-900/30 dark:border-red-400 dark:text-red-200'
        : 'border-red-200 hover:border-red-300 dark:border-red-700 dark:hover:border-red-600',
      pink: isSelected
        ? 'bg-pink-100 border-pink-500 text-pink-800 dark:bg-pink-900/30 dark:border-pink-400 dark:text-pink-200'
        : 'border-pink-200 hover:border-pink-300 dark:border-pink-700 dark:hover:border-pink-600',
      yellow: isSelected
        ? 'bg-yellow-100 border-yellow-500 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-400 dark:text-yellow-200'
        : 'border-yellow-200 hover:border-yellow-300 dark:border-yellow-700 dark:hover:border-yellow-600',
      gray: isSelected
        ? 'bg-gray-100 border-gray-500 text-gray-800 dark:bg-gray-700 dark:border-gray-400 dark:text-gray-200'
        : 'border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500',
    };
    return colorMap[color] || colorMap.gray;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center space-x-2">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Areas of Concern {required && <span className="text-red-500">*</span>}
        </h3>
        <div className="relative">
          <InformationCircleIcon
            className="w-4 h-4 text-gray-400 cursor-help"
            onMouseEnter={() => setShowTooltip('header')}
            onMouseLeave={() => setShowTooltip(null)}
          />
          <AnimatePresence>
            {showTooltip === 'header' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10"
              >
                Select any areas where you have concerns about your child's development. This helps
                us customize the assessment.
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Helpful text */}
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Select all areas that apply. It's okay to select multiple concerns - this helps us provide
        the most accurate assessment.
      </p>

      {/* Concerns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {concernsOptions.map(concern => {
          const isSelected = selectedConcerns.includes(concern.id);

          return (
            <motion.div
              key={concern.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative"
            >
              <label
                className={`
                  relative flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                  ${getColorClasses(concern.color, isSelected)}
                  ${!isSelected ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700' : ''}
                `}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={isSelected}
                  onChange={() => handleConcernToggle(concern.id)}
                />

                {/* Checkbox Visual */}
                <div
                  className={`
                  flex-shrink-0 w-5 h-5 rounded border-2 mr-3 mt-0.5 flex items-center justify-center transition-all
                  ${
                    isSelected
                      ? `border-${concern.color}-500 bg-${concern.color}-500`
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                  }
                `}
                >
                  {isSelected && <CheckIcon className="w-3 h-3 text-white" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {concern.label}
                    </h4>
                    <InformationCircleIcon
                      className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-2 flex-shrink-0"
                      onMouseEnter={() => setShowTooltip(concern.id)}
                      onMouseLeave={() => setShowTooltip(null)}
                    />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {concern.description}
                  </p>
                </div>

                {/* Tooltip */}
                <AnimatePresence>
                  {showTooltip === concern.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10"
                    >
                      {concern.description}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </label>
            </motion.div>
          );
        })}
      </div>

      {/* Other Concern Field */}
      {showOtherField && selectedConcerns.includes('other') && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4"
        >
          <label
            htmlFor="otherConcern"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Please describe your other concerns:
          </label>
          <textarea
            id="otherConcern"
            value={otherConcern}
            onChange={e => onOtherConcernChange(e.target.value)}
            placeholder="Please provide details about any other concerns you have about your child's development..."
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors resize-vertical min-h-[100px]"
            rows={4}
          />
        </motion.div>
      )}

      {/* Selected Summary */}
      {selectedConcerns.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700/50">
          <div className="flex items-center space-x-2 mb-2">
            <CheckIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Selected Concerns ({selectedConcerns.length})
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedConcerns.map(concernId => {
              const concern = concernsOptions.find(c => c.id === concernId);
              return concern ? (
                <span
                  key={concernId}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-200"
                >
                  {concern.label}
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* No Selection Warning */}
      {selectedConcerns.length === 0 && required && (
        <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700/50">
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Please select at least one area of concern to continue, or contact us if you're
              unsure.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConcernsSelector;
