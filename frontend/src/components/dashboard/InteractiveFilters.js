import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const InteractiveFilters = ({
  domains = [],
  assessmentTypes = [],
  dateRange = { start: null, end: null },
  onFilterChange,
  activeFilters = {},
  timelines = [],
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState(activeFilters);

  useEffect(() => {
    setLocalFilters(activeFilters);
  }, [activeFilters]);

  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...localFilters };

    if (value === 'all' || value === '') {
      delete newFilters[filterType];
    } else {
      newFilters[filterType] = value;
    }

    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    const emptyFilters = {};
    setLocalFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const getActiveFilterCount = () => {
    return Object.keys(localFilters).filter(
      key => localFilters[key] !== '' && localFilters[key] !== 'all'
    ).length;
  };

  const getFilteredDataStats = () => {
    if (!timelines || timelines.length === 0) return { total: 0, filtered: 0 };

    let filteredTimelines = [...timelines];

    // Filter by domain
    if (localFilters.domain && localFilters.domain !== 'all') {
      filteredTimelines = filteredTimelines.filter(
        timeline => timeline.scores && timeline.scores[localFilters.domain] !== undefined
      );
    }

    // Filter by assessment type
    if (localFilters.assessmentType && localFilters.assessmentType !== 'all') {
      filteredTimelines = filteredTimelines.filter(
        timeline =>
          timeline.assessmentType === localFilters.assessmentType ||
          timeline.assessmentCategory === localFilters.assessmentType
      );
    }

    // Filter by date range
    if (localFilters.startDate) {
      filteredTimelines = filteredTimelines.filter(
        timeline => new Date(timeline.date) >= new Date(localFilters.startDate)
      );
    }

    if (localFilters.endDate) {
      filteredTimelines = filteredTimelines.filter(
        timeline => new Date(timeline.date) <= new Date(localFilters.endDate)
      );
    }

    // Filter by date preset
    if (localFilters.datePreset) {
      const now = new Date();
      const cutoffDate = (() => {
        const date = new Date();
        switch (localFilters.datePreset) {
          case '7d':
            date.setDate(now.getDate() - 7);
            break;
          case '30d':
            date.setDate(now.getDate() - 30);
            break;
          case '3m':
            date.setMonth(now.getMonth() - 3);
            break;
          case '6m':
            date.setMonth(now.getMonth() - 6);
            break;
          case '1y':
            date.setFullYear(now.getFullYear() - 1);
            break;
          default:
            break;
        }
        return date;
      })();

      filteredTimelines = filteredTimelines.filter(
        timeline => new Date(timeline.date) >= cutoffDate
      );
    }

    return {
      total: timelines.length,
      filtered: filteredTimelines.length,
    };
  };

  const stats = getFilteredDataStats();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/90 dark:bg-gray-800/90 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 p-6 shadow-lg"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Interactive Filters
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {stats.filtered} of {stats.total} assessments shown
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {getActiveFilterCount() > 0 && (
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full">
              {getActiveFilterCount()} active
            </span>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <svg
              className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      <motion.div
        initial={false}
        animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="space-y-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          {/* Domain Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Filter by Domain
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleFilterChange('domain', 'all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  !localFilters.domain || localFilters.domain === 'all'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                All Domains
              </button>
              {domains.map(domain => (
                <button
                  key={domain}
                  onClick={() => handleFilterChange('domain', domain)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    localFilters.domain === domain
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {domain}
                </button>
              ))}
            </div>
          </div>

          {/* Assessment Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Filter by Assessment Type
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleFilterChange('assessmentType', 'all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  !localFilters.assessmentType || localFilters.assessmentType === 'all'
                    ? 'bg-green-500 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                All Types
              </button>
              {assessmentTypes.map(type => (
                <button
                  key={type}
                  onClick={() => handleFilterChange('assessmentType', type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    localFilters.assessmentType === type
                      ? 'bg-green-500 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {type === 'text'
                    ? '📝 Text-based'
                    : type === 'image'
                      ? '🖼️ Image-based'
                      : type === 'game'
                        ? '🎮 Game-based'
                        : type}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Filter by Date Range
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={localFilters.startDate || ''}
                  onChange={e => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={localFilters.endDate || ''}
                  onChange={e => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Quick Date Presets */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Quick Date Presets
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Last 7 days', value: '7d' },
                { label: 'Last 30 days', value: '30d' },
                { label: 'Last 3 months', value: '3m' },
                { label: 'Last 6 months', value: '6m' },
                { label: 'This year', value: '1y' },
              ].map(preset => (
                <button
                  key={preset.value}
                  onClick={() => handleFilterChange('datePreset', preset.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    localFilters.datePreset === preset.value
                      ? 'bg-purple-500 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={clearAllFilters}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Clear All Filters
            </button>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {getActiveFilterCount()} filter{getActiveFilterCount() !== 1 ? 's' : ''} active
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default InteractiveFilters;
