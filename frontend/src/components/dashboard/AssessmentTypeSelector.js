import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FADE_UP } from '../../utils/animations';

// Icons
import { Cross2Icon } from '@radix-ui/react-icons';
import { UserIcon } from '@heroicons/react/24/outline';

const assessmentTypes = [
  {
    id: 'adhd',
    title: 'ADHD Screening',
    description: 'Assessment for attention-deficit/hyperactivity disorder',
    ageRange: '4-17 years',
    duration: '20-35 minutes',
    icon: <UserIcon className="w-6 h-6" />,
    color: 'bg-gradient-to-r from-primary-400 to-primary-500',
    textColor: 'text-primary-600 dark:text-primary-400',
    borderColor: 'border-primary/20 dark:border-primary-700/30',
    gradient: 'from-primary/10 to-primary/20 dark:from-primary/20 dark:to-primary/10',
  },
  {
    id: 'asd',
    title: 'Autism Screening',
    description: 'Assessment for autism spectrum disorder traits',
    ageRange: '16 months-6 years',
    duration: '20-35 minutes',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-6 h-6"
      >
        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
      </svg>
    ),
    color: 'bg-gradient-to-r from-accent-400 to-accent-500',
    textColor: 'text-accent-600 dark:text-accent-400',
    borderColor: 'border-accent/20 dark:border-accent-700/30',
    gradient: 'from-accent/10 to-accent/20 dark:from-accent/20 dark:to-accent/10',
  },
  {
    id: 'dyslexia',
    title: 'Dyslexia Screening',
    description: 'Assessment for reading and processing difficulties',
    ageRange: '5-12 years',
    duration: '20-35 minutes',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-6 h-6"
      >
        <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
      </svg>
    ),
    color: 'bg-gradient-to-r from-secondary-400 to-secondary-500',
    textColor: 'text-secondary-600 dark:text-secondary-400',
    borderColor: 'border-secondary/20 dark:border-secondary-700/30',
    gradient: 'from-secondary/10 to-secondary/20 dark:from-secondary/20 dark:to-secondary/10',
  },
];

/**
 * Assessment Type Selector - popup modal when user clicks "New Assessment" button
 */
const AssessmentTypeSelector = ({ isOpen, onClose, onSelectType, childId }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      >
        <motion.div
          variants={FADE_UP}
          initial="hidden"
          animate="show"
          exit="hidden"
          className="bg-white/90 dark:bg-gray-800/90 max-w-3xl w-full rounded-2xl overflow-hidden shadow-colored-lg max-h-[80vh] overflow-y-auto border border-white/20 dark:border-gray-700/30 relative"
        >
          {/* Decorative elements */}
          <div className="absolute -top-24 -right-24 w-40 h-40 bg-gradient-radial from-primary/20 to-transparent rounded-full blur-xl"></div>
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-radial from-secondary/20 to-transparent rounded-full blur-xl"></div>

          {/* Header */}
          <div className="relative bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 p-6 border-b border-white/20 dark:border-gray-700/30">
            <div className="flex justify-between items-center">
              <div>
                <div className="inline-flex items-center mb-2 bg-gradient-to-r from-primary/10 to-primary/20 rounded-full pl-1 pr-4 py-1">
                  <span className="bg-primary text-white dark:bg-primary/90 dark:text-white rounded-full w-6 h-6 flex items-center justify-center mr-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9 9a2 2 0 114 0 2 2 0 01-4 0z" />
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a4 4 0 00-3.446 6.032l-2.261 2.26a1 1 0 101.414 1.415l2.261-2.261A4 4 0 1011 5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  <span className="text-primary dark:text-primary-300 text-sm font-medium">
                    Child Assessment
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Select Assessment Type
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Choose the most suitable assessment for your child's needs
                </p>
              </div>
              <button
                onClick={onClose}
                className="bg-white/70 dark:bg-gray-800/70 p-2 rounded-full hover:bg-white/90 dark:hover:bg-gray-700/90 transition-colors border border-white/20 dark:border-gray-700/30"
                aria-label="Close"
              >
                <Cross2Icon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
          </div>

          {/* Assessment Cards */}
          <div className="p-6 relative">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {assessmentTypes.map(type => (
                <motion.div
                  key={type.id}
                  whileHover={{ scale: 1.03, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelectType(childId, type.id)}
                  className={`bg-white/80 dark:bg-gray-800/80 rounded-xl overflow-hidden cursor-pointer h-full border ${type.borderColor} transition-all duration-300 hover:shadow-lg`}
                >
                  <div className={`h-2 bg-gradient-to-r ${type.gradient}`}></div>
                  <div className="p-6 relative">
                    {/* Subtle accent decoration */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-radial from-accent/5 to-transparent rounded-full"></div>

                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className={`w-12 h-12 rounded-full ${type.color} flex items-center justify-center text-white shadow-sm border border-white/20 dark:border-gray-700/30`}
                      >
                        {type.icon}
                      </div>
                      <h3 className={`text-xl font-semibold ${type.textColor}`}>{type.title}</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">{type.description}</p>
                    <div className="flex flex-wrap gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="bg-white/70 dark:bg-gray-800/70 px-3 py-1 rounded-full flex items-center border border-white/20 dark:border-gray-700/30">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        {type.ageRange}
                      </span>
                      <span className="bg-white/70 dark:bg-gray-800/70 px-3 py-1 rounded-full flex items-center border border-white/20 dark:border-gray-700/30">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {type.duration}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 text-center text-gray-600 dark:text-gray-300 text-sm p-4 bg-white/70 dark:bg-gray-800/70 rounded-lg border border-white/20 dark:border-gray-700/30">
              <p>
                All assessments are crafted by child development experts and provide valuable
                insights into your child's developmental needs.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AssessmentTypeSelector;
