import React from 'react';
import { motion } from 'framer-motion';

const AssessmentTypeFilter = ({
  activeFilter,
  onFilterChange,
  assessmentCounts = {},
  variant = 'default',
}) => {
  const filterOptions = [
    {
      id: 'all',
      label: 'All Assessments',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      color:
        'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600',
      activeColor: 'bg-blue-500 text-white shadow-lg',
    },
    {
      id: 'text',
      label: 'Text Based',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      color:
        'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-800/30',
      activeColor: 'bg-blue-500 text-white shadow-lg',
    },
    {
      id: 'image',
      label: 'Image Based',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      color:
        'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-800/30',
      activeColor: 'bg-green-500 text-white shadow-lg',
    },
    {
      id: 'game',
      label: 'Game Based',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color:
        'bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:hover:bg-purple-800/30',
      activeColor: 'bg-purple-500 text-white shadow-lg',
    },
  ];

  const getCount = filterId => {
    if (filterId === 'all') {
      return Object.values(assessmentCounts).reduce((sum, count) => sum + count, 0);
    }
    return assessmentCounts[filterId] || 0;
  };

  // Compact variant styles
  const isCompact = variant === 'compact';

  return (
    <div className={isCompact ? 'mb-0' : 'mb-6'}>
      <div
        className={`
        flex flex-wrap gap-3 p-4 bg-white/80 dark:bg-gray-800/80 rounded-xl border border-white/20 dark:border-gray-700/30 backdrop-blur-sm
        ${isCompact ? 'p-3' : 'p-4'}
      `}
      >
        {!isCompact && (
          <div className="flex items-center gap-2 mr-4">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Filter by type:
            </span>
          </div>
        )}

        <div className={`flex flex-wrap gap-2 ${isCompact ? 'w-full justify-center' : ''}`}>
          {filterOptions.map(option => {
            const isActive = activeFilter === option.id;
            const count = getCount(option.id);

            return (
              <motion.button
                key={option.id}
                onClick={() => onFilterChange(option.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  flex items-center gap-2 rounded-full text-sm font-medium transition-all duration-200
                  ${isCompact ? 'px-3 py-1.5' : 'px-4 py-2'}
                  ${isActive ? option.activeColor : option.color}
                `}
              >
                <span className={isCompact ? 'text-sm' : 'text-lg'}>{option.icon}</span>
                {!isCompact && <span>{option.label}</span>}
                {isCompact && isActive && <span className="text-xs">{option.label}</span>}
                {count > 0 && (
                  <span
                    className={`
                    ml-1 px-2 py-0.5 rounded-full text-xs font-bold
                    ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                    }
                  `}
                  >
                    {count}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AssessmentTypeFilter;
