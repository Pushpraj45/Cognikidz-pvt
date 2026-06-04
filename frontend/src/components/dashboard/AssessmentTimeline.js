import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, isAfter } from 'date-fns';
import MarkdownRenderer from '../ui/MarkdownRenderer';

// Status badge component
const StatusBadge = ({ status }) => {
  const getStatusInfo = () => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return {
          bg: 'bg-green-100 dark:bg-green-900/30',
          text: 'text-green-800 dark:text-green-400',
          label: 'Completed',
        };
      case 'in-progress':
      case 'active':
        return {
          bg: 'bg-blue-100 dark:bg-blue-900/30',
          text: 'text-blue-800 dark:text-blue-400',
          label: 'In Progress',
        };
      case 'paused':
        return {
          bg: 'bg-yellow-100 dark:bg-yellow-900/30',
          text: 'text-yellow-800 dark:text-yellow-400',
          label: 'Paused',
        };
      case 'pending':
        return {
          bg: 'bg-gray-100 dark:bg-gray-700/30',
          text: 'text-gray-800 dark:text-gray-300',
          label: 'Pending',
        };
      default:
        return {
          bg: 'bg-gray-100 dark:bg-gray-700/30',
          text: 'text-gray-800 dark:text-gray-300',
          label: status || 'Unknown',
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.text}`}
    >
      {statusInfo.label}
    </span>
  );
};

// Type icon component
const TypeIcon = ({ type }) => {
  const getTypeIcon = () => {
    switch (type?.toLowerCase()) {
      case 'adhd':
        return (
          <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-orange-600 dark:text-orange-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'autism':
      case 'asd':
        return (
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-blue-600 dark:text-blue-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
            </svg>
          </div>
        );
      case 'dyslexia':
        return (
          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-purple-600 dark:text-purple-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700/30 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-gray-600 dark:text-gray-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  return getTypeIcon();
};

// Helper to format child names properly (same as DashboardOverview)
const formatChildName = (childName, fallback = 'Child Assessment') => {
  if (!childName || childName.trim() === '') return fallback;

  // Remove any "N/A" text and clean up the name
  const cleaned = childName.replace(/\s*N\/A\s*/gi, '').trim();

  // Remove any invalid values including "undefined", "null", "N/A"
  const cleanName = cleaned
    .replace(/\s*undefined\s*/gi, '')
    .replace(/\s*null\s*/gi, '')
    .replace(/\s*N\/A\s*/gi, '')
    .replace(/\s*NA\s*/gi, '')
    .replace(/^the child$/i, '') // Remove generic "the child" placeholder
    .trim();

  // If we have a valid name after cleaning, return it
  if (cleanName && cleanName.length > 0) {
    return cleanName;
  }

  return cleaned || fallback;
};

// Helper to group assessments by month/year
const groupAssessmentsByDate = assessments => {
  if (!assessments || !assessments.length) {
    return {};
  }

  const groups = {};

  assessments.forEach((assessment, index) => {
    if (!assessment.date) {
      return;
    }

    let date;
    try {
      // Handle different date formats
      if (typeof assessment.date === 'string') {
        date = parseISO(assessment.date);
      } else if (assessment.date instanceof Date) {
        date = assessment.date;
      } else {
        date = new Date(assessment.date);
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return;
      }
    } catch (error) {
      return;
    }

    const key = format(date, 'MMMM yyyy');

    if (!groups[key]) {
      groups[key] = [];
    }

    groups[key].push(assessment);
  });

  // Sort assessments in each group in ASCENDING chronological order (earliest first)
  Object.keys(groups).forEach(key => {
    groups[key].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      // FIXED: Proper ascending chronological order (earlier dates first)
      return dateA.getTime() - dateB.getTime();
    });
  });

  return groups;
};

const AssessmentTimeline = ({ assessments = [], onAddToCalendar = () => {} }) => {
  const [expandedItems, setExpandedItems] = useState({});
  const [mobileView, setMobileView] = useState(false);

  // Group assessments by date
  const groupedAssessments = groupAssessmentsByDate(assessments);

  // Toggle expanded state for an assessment
  const toggleExpand = id => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Handle add to calendar
  const handleAddToCalendar = (assessment, e) => {
    e.stopPropagation();
    onAddToCalendar(assessment);
  };

  // Toggle between vertical and horizontal views for mobile
  const toggleView = () => {
    setMobileView(!mobileView);
  };

  return (
    <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-lg p-6 border border-white/20 dark:border-gray-700/30">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-2 mr-3">
            <svg
              className="w-6 h-6 text-white"
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
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Assessment Timeline ({assessments.length} assessments)
          </h3>
        </div>
        <button
          onClick={toggleView}
          className="text-sm px-3 py-1.5 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-400 rounded-md hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors md:hidden"
        >
          {mobileView ? 'Vertical View' : 'Horizontal View'}
        </button>
      </div>

      {/* Empty state - only show if no assessments */}
      {assessments.length === 0 ? (
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            <svg
              className="w-16 h-16 text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h4a2 2 0 012 2v1m-6 0h8m-8 0H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V9a2 2 0 00-2-2h-1"
              />
            </svg>
          </div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Timeline Data Available
          </h4>
          <p className="text-gray-500 dark:text-gray-400">
            Complete assessments to see timeline visualization here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {assessments && assessments.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400 mb-4">
                Assessment History ({assessments.length} items)
              </h4>

              {/* FIXED: Sort assessments by date in ascending chronological order for timeline view */}
              {assessments
                .sort((a, b) => {
                  // Sort by date in ascending chronological order (earliest first) for timeline view
                  const dateA = new Date(a.date || a.completedAt || a.startedAt);
                  const dateB = new Date(b.date || b.completedAt || b.startedAt);
                  // FIXED: Proper chronological ascending order
                  return dateA.getTime() - dateB.getTime();
                })
                .map((assessment, index) => {
                  const isExpanded = expandedItems[assessment.id];

                  return (
                    <div key={assessment.id || index} className="relative">
                      {/* Simple card layout */}
                      <motion.div
                        className={`bg-white/60 dark:bg-gray-800/60 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700/30 hover:shadow-md transition-shadow cursor-pointer ${isExpanded ? 'shadow-md' : ''}`}
                        onClick={() => toggleExpand(assessment.id)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: index * 0.05,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <TypeIcon type={assessment.type} />
                            <div>
                              <h5 className="font-medium text-gray-800 dark:text-gray-200">
                                {assessment.type || 'Assessment'}
                                {assessment.childName &&
                                  ` - ${formatChildName(assessment.childName)}`}
                              </h5>
                              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {assessment.date
                                  ? new Date(assessment.date).toLocaleDateString()
                                  : 'Date not available'}
                              </div>
                            </div>
                          </div>
                          <StatusBadge status={assessment.status} />
                        </div>

                        {/* Expanded content */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/30 overflow-hidden"
                            >
                              {assessment.score !== undefined && assessment.score !== null && (
                                <div className="flex items-center mb-3">
                                  <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">
                                    Score:
                                  </span>
                                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                                    {assessment.score}
                                  </span>
                                </div>
                              )}

                              {assessment.notes && (
                                <div className="mb-3">
                                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    Assessment Report:
                                  </div>
                                  <div className="max-h-60 overflow-y-auto bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <MarkdownRenderer
                                      content={assessment.notes}
                                      className="text-sm"
                                    />
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center justify-between mt-4">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={e => handleAddToCalendar(assessment, e)}
                                    className="text-xs px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-colors"
                                  >
                                    Add to Calendar
                                  </button>
                                </div>
                                {assessment.status === 'completed' && assessment.reportUrl && (
                                  <a
                                    href={assessment.reportUrl}
                                    className="text-xs px-3 py-1.5 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-400 rounded-md hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors flex items-center"
                                    onClick={e => e.stopPropagation()}
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-3.5 w-3.5 mr-1"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                      />
                                    </svg>
                                    View Report
                                  </a>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AssessmentTimeline;
