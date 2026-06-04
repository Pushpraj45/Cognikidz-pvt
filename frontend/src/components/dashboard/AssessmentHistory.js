import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import AssessmentService from '../../services/AssessmentService';
import DashboardService from '../../services/DashboardService';
import LogoLoader from '../ui/LogoLoader';
import MarkdownRenderer from '../ui/MarkdownRenderer';
import Button from '../ui/Button';

// Helper function to format child names (same as DashboardOverview)
const formatChildName = childName => {
  if (!childName || childName.trim() === '') return 'Child Assessment';
  // Remove any "N/A" text and clean up the name
  return childName.replace(/\s*N\/A\s*/gi, '').trim() || 'Child Assessment';
};

const AssessmentHistory = ({
  selectedChildId,
  timelineData = [],
  onRefresh,
  activeFilter = 'all',
}) => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedAssessment, setExpandedAssessment] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Add refs to prevent duplicate requests
  const ongoingRequests = useRef(new Set());
  const lastFetchTime = useRef(0);

  // Helper function to check if request is already ongoing
  const isRequestOngoing = cacheKey => {
    return ongoingRequests.current.has(cacheKey);
  };

  // Helper function to mark request as ongoing
  const markRequestOngoing = cacheKey => {
    ongoingRequests.current.add(cacheKey);
  };

  // Helper function to mark request as complete
  const markRequestComplete = cacheKey => {
    ongoingRequests.current.delete(cacheKey);
  };

  // Use timeline data from parent if available, otherwise fetch from API
  useEffect(() => {
    if (timelineData && timelineData.length > 0) {
      console.log('Using timeline data from parent:', timelineData);

      // Filter to only completed assessments for history view
      let completedAssessments = timelineData.filter(
        item => item.status === 'completed' && !item.isRecommendation
      );

      // Apply assessment type filter CORRECTLY
      if (activeFilter && activeFilter !== 'all') {
        console.log(`Applying filter: ${activeFilter}`);
        completedAssessments = completedAssessments.filter(item => {
          const assessmentCategory = item.assessmentCategory || item.category || item.sourceType;
          console.log(
            `Item ${item.id}: category=${assessmentCategory}, type=${item.type}, filter=${activeFilter}`
          );

          // Match based on source type or category
          if (activeFilter === 'text') {
            return assessmentCategory === 'text' || item.sourceType === 'regular';
          } else if (activeFilter === 'image') {
            return assessmentCategory === 'image' || item.sourceType === 'image';
          } else if (activeFilter === 'game') {
            return assessmentCategory === 'game' || item.sourceType === 'game';
          }

          return assessmentCategory === activeFilter;
        });
        console.log(`After filtering: ${completedAssessments.length} assessments`);
      }

      // Convert timeline data to assessment history format
      const formattedAssessments = completedAssessments.map(item => ({
        sessionId: item.id,
        assessmentType: item.type,
        status: item.status,
        childName: item.childName || 'Child Assessment',
        completedAt: item.date,
        results: {
          disorderRisk: {
            score: item.score,
          },
          summary: item.notes,
        },
        reportUrl: item.reportUrl,
        progress: item.progress,
        sourceType: item.sourceType || item.assessmentCategory,
      }));

      setAssessments(formattedAssessments);
      setLoading(false);
    } else if (selectedChildId) {
      // Only fetch if we don't have timeline data and have a selected child
      loadAssessmentHistory();
    } else {
      // No child selected and no timeline data
      setAssessments([]);
      setLoading(false);
    }
  }, [timelineData, selectedChildId, activeFilter]);

  useEffect(() => {
    // Check if we have a completed assessment from navigation state
    const checkForCompletedAssessment = () => {
      const state = location.state || {};

      if (state.completedSessionId || state.completedAssessment) {
        console.log('Detected completed assessment in navigation state:', state);
        toast.success('Assessment completed successfully!');

        // Trigger refresh from parent if available
        if (onRefresh) {
          onRefresh();
        } else {
          // Force a refresh of assessment history
          loadAssessmentHistory();
        }
      }
    };

    checkForCompletedAssessment();
  }, [location.state, onRefresh]);

  useEffect(() => {
    // Check if we have a recently completed assessment in localStorage
    const checkLocalStorage = () => {
      const latestAssessmentId = localStorage.getItem('latestCompletedAssessment');

      if (latestAssessmentId) {
        console.log('Found completed assessment in localStorage:', latestAssessmentId);

        // Clear it to avoid repeated loading
        localStorage.removeItem('latestCompletedAssessment');

        // Trigger refresh from parent if available
        if (onRefresh) {
          onRefresh();
        } else {
          // Force a refresh of assessment history
          loadAssessmentHistory();
        }
      }
    };

    checkLocalStorage();
  }, [onRefresh]);

  // Listen for game completion events to refresh data
  useEffect(() => {
    const handleGameCompleted = event => {
      console.log('Game completed event received in AssessmentHistory:', event.detail);

      // Refresh assessment history
      if (onRefresh) {
        console.log('Triggering parent refresh...');
        onRefresh();
      } else {
        console.log('Refreshing assessment history directly...');
        setTimeout(() => {
          loadAssessmentHistory();
        }, 1000);
      }
    };

    window.addEventListener('gameCompleted', handleGameCompleted);

    return () => {
      window.removeEventListener('gameCompleted', handleGameCompleted);
    };
  }, [onRefresh]);

  const loadAssessmentHistory = async () => {
    // Prevent too frequent API calls
    const now = Date.now();
    if (now - lastFetchTime.current < 2000) {
      console.log('Skipping assessment history fetch - too recent');
      return;
    }

    const cacheKey = `assessmentHistory_${selectedChildId || 'all'}_${activeFilter}`;

    // Check if request is already ongoing
    if (isRequestOngoing(cacheKey)) {
      console.log('Assessment history request already in progress, skipping...');
      return;
    }

    try {
      setLoading(true);
      markRequestOngoing(cacheKey);
      lastFetchTime.current = now;
      console.log('Loading assessment history...');

      // Convert filter for API
      const filterParam = activeFilter !== 'all' ? activeFilter : null;

      // Use DashboardService.getRecentAssessments - same as DashboardOverview which works
      let data;
      try {
        const response = await DashboardService.getRecentAssessments(filterParam);
        console.log('Raw recent assessments response:', response);

        if (response.success) {
          // Use globalRecentAssessments which has the same format as DashboardOverview
          const allData = response.data.globalRecentAssessments || [];
          // Filter to only completed assessments for history view
          data = allData.filter(assessment => assessment.status === 'completed');
          console.log(
            `Assessment history loaded from DashboardService: ${data.length} completed out of ${allData.length} total`
          );
        } else {
          throw new Error('Failed to get recent assessments');
        }
      } catch (dashboardError) {
        console.warn(
          'Failed to get recent assessments from DashboardService, falling back to AssessmentService:',
          dashboardError
        );
        // Fallback to the original method with filter
        data = await AssessmentService.getAssessmentHistory(false, filterParam);
        console.log('Assessment history loaded from history endpoint:', data);
      }

      if (data && Array.isArray(data)) {
        // Filter by selected child if specified
        let filteredData = data;
        if (selectedChildId) {
          console.log(`Attempting to filter for child: ${selectedChildId}`);
          filteredData = data.filter(assessment => {
            const matchesChildId = assessment.childId === selectedChildId;
            const matchesChildName = assessment.childName
              ?.toLowerCase()
              .includes(selectedChildId?.toLowerCase());

            return matchesChildId || matchesChildName;
          });
          console.log(
            `Filtered to ${filteredData.length} assessments for child ${selectedChildId}`
          );

          // If no assessments match the child filter, and we have a selectedChildId that looks like an ObjectId,
          // it might be that the assessments don't have proper childId linking.
          // In this case, show all assessments for this user instead of an empty list
          if (filteredData.length === 0 && selectedChildId.length === 24) {
            console.log(
              'No assessments found for specific child, showing all user assessments instead'
            );
            filteredData = data; // Show all assessments
          }
        }

        // Sort by completion date (newest first)
        const sortedData = [...filteredData].sort(
          (a, b) =>
            new Date(b.completedAt || b.lastActiveAt || b.createdAt) -
            new Date(a.completedAt || a.lastActiveAt || a.createdAt)
        );

        console.log(`Final sorted data:`, sortedData);
        setAssessments(sortedData);
      }
    } catch (error) {
      console.error('Error loading assessment history:', error);
      toast.error('Failed to load assessment history. Please try again.');
    } finally {
      setLoading(false);
      markRequestComplete(cacheKey);
    }
  };

  const toggleExpandAssessment = sessionId => {
    if (expandedAssessment === sessionId) {
      setExpandedAssessment(null);
    } else {
      setExpandedAssessment(sessionId);
    }
  };

  const viewFullReport = sessionId => {
    navigate(`/assessment-complete/${sessionId}`);
  };

  // Continue assessment
  const continueAssessment = sessionId => {
    navigate(`/assessment/${sessionId}`);
  };

  const refreshAssessments = async () => {
    // Trigger refresh from parent if available (preferred)
    if (onRefresh) {
      console.log('Triggering refresh from parent component...');
      onRefresh();
      return;
    }

    // Fallback to local refresh
    const cacheKey = `refreshAssessments_${selectedChildId || 'all'}_${activeFilter}`;

    // Check if refresh is already ongoing
    if (isRequestOngoing(cacheKey)) {
      console.log('Assessment refresh already in progress, skipping...');
      return;
    }

    try {
      toast.loading('Refreshing assessment history...');
      setLoading(true);
      markRequestOngoing(cacheKey);

      // Convert filter for API
      const filterParam = activeFilter !== 'all' ? activeFilter : null;

      // Force refresh from API
      const data = await AssessmentService.getAssessmentHistory(true, filterParam);

      if (data && Array.isArray(data)) {
        // Filter by selected child if specified
        let filteredData = data;
        if (selectedChildId) {
          filteredData = data.filter(assessment => assessment.childId === selectedChildId);
        }

        // Sort by completion date (newest first)
        const sortedData = [...filteredData].sort(
          (a, b) => new Date(b.completedAt || b.createdAt) - new Date(a.completedAt || a.createdAt)
        );
        setAssessments(sortedData);
      }

      toast.dismiss();
      toast.success('Assessment history refreshed');
    } catch (error) {
      console.error('Error refreshing assessments:', error);
      toast.dismiss();
      toast.error('Failed to refresh assessment history. Please try again.');
    } finally {
      setLoading(false);
      markRequestComplete(cacheKey);
    }
  };

  // Helper function to format a date
  const formatDate = dateString => {
    if (!dateString) return 'Not Available';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Helper function to format child names properly
  const formatChildName = childName => {
    if (!childName || childName.trim() === '') return 'Child Assessment';

    // Convert to string in case it's not already
    const nameStr = childName.toString().trim();

    // Remove any invalid values including "undefined", "null", "N/A"
    const cleanName = nameStr
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

    return 'Child Assessment';
  };

  // Helper function to get risk level text and color
  const getRiskLevelInfo = score => {
    if (!score && score !== 0)
      return {
        text: 'Not Available',
        color:
          'bg-gray-100/70 text-gray-800 dark:bg-gray-700/40 dark:text-gray-300 border border-white/10 dark:border-gray-700/30',
      };

    if (score <= 3) {
      return {
        text: 'Low Risk',
        color:
          'bg-green-100/70 text-green-800 dark:bg-green-900/40 dark:text-green-400 border border-white/10 dark:border-green-800/20',
      };
    } else if (score <= 7) {
      return {
        text: 'Moderate Risk',
        color:
          'bg-yellow-100/70 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400 border border-white/10 dark:border-yellow-800/20',
      };
    } else {
      return {
        text: 'High Risk',
        color:
          'bg-red-100/70 text-red-800 dark:bg-red-900/40 dark:text-red-400 border border-white/10 dark:border-red-800/20',
      };
    }
  };

  // Navigation handler
  const handleStartAssessment = () => {
    navigate('/assessment');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 bg-white/80 dark:bg-gray-800/80 rounded-xl border border-white/20 dark:border-gray-700/30">
        <LogoLoader size="large" message="Loading assessment history..." showMessage={true} />
      </div>
    );
  }

  if (assessments.length === 0 && !loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {selectedChildId ? "Child's Assessment History" : 'Assessment History'}
          </h2>
          <Button onClick={refreshAssessments} variant="outline" size="sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </Button>
        </div>

        <div className="text-center py-12 bg-white/80 dark:bg-gray-800/80 rounded-xl border border-white/20 dark:border-gray-700/30">
          <div className="flex justify-center mb-4">
            <svg
              className="w-20 h-20 text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No assessments found for this child
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            {selectedChildId
              ? "This child hasn't completed any assessments yet. Start an assessment to track their progress and development."
              : 'No assessment history available. Complete an assessment to see results here.'}
          </p>
          <Button
            onClick={handleStartAssessment}
            variant="primary"
            size="md"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Start Assessment
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {selectedChildId ? "Child's Assessment History" : 'Assessment History'}
        </h2>
        <Button onClick={refreshAssessments} variant="outline" size="sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </Button>
      </div>

      <div className="bg-white/90 dark:bg-gray-800/90 border border-white/20 dark:border-gray-700/30 rounded-xl shadow-lg divide-y divide-gray-200 dark:divide-gray-700/30 overflow-hidden">
        {assessments.map((assessment, index) => {
          // Enhanced risk score extraction to handle both text and image assessments
          const riskScore =
            assessment.results?.disorderRisk?.score ??
            assessment.results?.riskScore ??
            assessment.riskScore ??
            null;

          const riskLevel = getRiskLevelInfo(riskScore);

          console.log(`Assessment ${index} risk data:`, {
            sessionId: assessment.sessionId,
            assessmentType: assessment.assessmentType,
            sourceType: assessment.sourceType,
            riskScore,
            riskLevel: riskLevel.text,
          });

          return (
            <div
              key={assessment.sessionId || index}
              className={`${
                expandedAssessment === assessment.sessionId
                  ? 'bg-blue-50/50 dark:bg-blue-900/20'
                  : 'hover:bg-gray-50/50 dark:hover:bg-gray-700/30'
              } transition-colors duration-200`}
            >
              <div
                className="px-4 py-4 sm:px-6 cursor-pointer"
                onClick={() => toggleExpandAssessment(assessment.sessionId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center min-w-0">
                    <div className="flex-shrink-0">
                      {assessment.childId?.avatar ? (
                        <div className="h-10 w-10 rounded-full overflow-hidden border border-white/20 dark:border-gray-700/50 shadow-sm">
                          {assessment.childId.avatar.startsWith('http') ||
                          assessment.childId.avatar.startsWith('/') ? (
                            <img
                              src={assessment.childId.avatar}
                              alt={`${assessment.childName}'s profile`}
                              className="w-full h-full object-cover"
                              onError={e => {
                                e.target.style.display = 'none';
                                e.target.parentNode.innerHTML = `<div class='w-full h-full bg-gradient-to-r from-primary-400/80 to-primary-500/80 rounded-full flex items-center justify-center text-white font-medium shadow-sm border border-white/20 dark:border-primary-700/30'>${assessment.childName?.charAt(0) || 'C'}</div>`;
                              }}
                            />
                          ) : (
                            <img
                              src={`/child-avatar/${assessment.childId.avatar}.jpg`}
                              alt={`${assessment.childName}'s profile`}
                              className="w-full h-full object-cover"
                              onError={e => {
                                e.target.style.display = 'none';
                                e.target.parentNode.innerHTML = `<div class='w-full h-full bg-gradient-to-r from-primary-400/80 to-primary-500/80 rounded-full flex items-center justify-center text-white font-medium shadow-sm border border-white/20 dark:border-primary-700/30'>${assessment.childName?.charAt(0) || 'C'}</div>`;
                              }}
                            />
                          )}
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary-400/80 to-primary-500/80 flex items-center justify-center text-white font-medium shadow-sm border border-white/20 dark:border-primary-700/30">
                          {assessment.childName?.charAt(0) || 'C'}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 px-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-primary truncate">
                          {formatChildName(assessment.childName)}
                        </p>
                        <span
                          className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${riskLevel.color}`}
                        >
                          {riskLevel.text}
                        </span>
                      </div>
                      <div className="mt-1">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-medium">
                            {assessment.assessmentType || 'General Assessment'}
                          </span>{' '}
                          - Completed on{' '}
                          {formatDate(assessment.completedAt || assessment.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {assessment.status === 'completed' ? (
                      <Button
                        onClick={e => {
                          e.stopPropagation();
                          viewFullReport(assessment.sessionId);
                        }}
                        variant="primary"
                        size="sm"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        View Report
                      </Button>
                    ) : (
                      <Button
                        onClick={e => {
                          e.stopPropagation();
                          continueAssessment(assessment.sessionId);
                        }}
                        variant="secondary"
                        size="sm"
                      >
                        Continue
                      </Button>
                    )}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        toggleExpandAssessment(assessment.sessionId);
                      }}
                      className="ml-2 p-1 rounded-full hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-5 w-5 text-gray-500 transform transition-transform ${
                          expandedAssessment === assessment.sessionId ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded details */}
              {expandedAssessment === assessment.sessionId && (
                <div className="px-4 py-4 sm:px-6 border-t border-gray-100 dark:border-gray-700/30 bg-white/70 dark:bg-gray-800/70">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left column - Basic details */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Assessment Details
                      </h4>
                      <dl className="mt-2 text-sm">
                        <div className="mt-1">
                          <dt className="inline font-medium text-gray-700 dark:text-gray-300">
                            Type:
                          </dt>{' '}
                          <dd className="inline text-gray-700 dark:text-gray-300">
                            {assessment.assessmentType || 'General Screening'}
                          </dd>
                        </div>
                        <div className="mt-1">
                          <dt className="inline font-medium text-gray-700 dark:text-gray-300">
                            Status:
                          </dt>{' '}
                          <dd className="inline">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                assessment.status === 'completed'
                                  ? 'bg-green-100/70 text-green-800 dark:bg-green-900/40 dark:text-green-400 border border-white/10 dark:border-green-800/20'
                                  : 'bg-yellow-100/70 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400 border border-white/10 dark:border-yellow-800/20'
                              }`}
                            >
                              {assessment.status || 'In Progress'}
                            </span>
                          </dd>
                        </div>
                        <div className="mt-1">
                          <dt className="inline font-medium text-gray-700 dark:text-gray-300">
                            Date Started:
                          </dt>{' '}
                          <dd className="inline text-gray-700 dark:text-gray-300">
                            {formatDate(assessment.createdAt)}
                          </dd>
                        </div>
                        {assessment.completedAt && (
                          <div className="mt-1">
                            <dt className="inline font-medium text-gray-700 dark:text-gray-300">
                              Date Completed:
                            </dt>{' '}
                            <dd className="inline text-gray-700 dark:text-gray-300">
                              {formatDate(assessment.completedAt)}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>

                    {/* Right column - Results */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Summary of Results
                      </h4>
                      <div className="mt-2">
                        {assessment.status === 'completed' && assessment.results ? (
                          <div className="space-y-3">
                            <div className="max-h-60 overflow-y-auto bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                              <p className="text-sm text-gray-800 dark:text-gray-300 leading-relaxed">
                                {assessment.results.summary ||
                                  assessment.summary ||
                                  'This assessment evaluates your child for potential indicators. The detailed report provides more specific information.'}
                              </p>
                            </div>
                            <div className="flex items-center space-x-3 pt-2 border-t border-gray-100 dark:border-gray-700/30">
                              <button
                                onClick={() => viewFullReport(assessment.sessionId)}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                              >
                                <svg
                                  className="w-4 h-4 mr-1"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                                View Full Report
                              </button>
                              {assessment.sourceType && (
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    assessment.sourceType === 'image'
                                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                  }`}
                                >
                                  {assessment.sourceType === 'image'
                                    ? 'Image Assessment'
                                    : 'Text Assessment'}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                              This assessment is not completed yet.
                            </p>
                            {assessment.progressPercentage && (
                              <div className="w-full bg-gray-200/50 dark:bg-gray-700/50 h-2 rounded-full overflow-hidden border border-white/10 dark:border-gray-700/30">
                                <div
                                  className="h-2 bg-gradient-to-r from-primary-400 to-primary-500"
                                  style={{ width: `${assessment.progressPercentage}%` }}
                                ></div>
                              </div>
                            )}
                            <div className="mt-2">
                              <button
                                onClick={() => continueAssessment(assessment.sessionId)}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                              >
                                Continue Assessment
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AssessmentHistory;
