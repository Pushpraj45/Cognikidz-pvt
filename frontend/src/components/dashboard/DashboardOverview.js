import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FADE_UP } from '../../utils/animations';
import DashboardService from '../../services/DashboardService';
import { useToast } from '../../contexts/ToastContext';
import LogoLoader from '../ui/LogoLoader';
import Button from '../ui/Button';
import { formatChildName } from '../../utils/childUtils';

const DashboardOverview = forwardRef(({ onDataRefresh, activeFilter = 'all' }, ref) => {
  const [overviewData, setOverviewData] = useState(null);
  const [recentAssessments, setRecentAssessments] = useState([]);
  const [inProgressAssessments, setInProgressAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { error: showError } = useToast();
  const navigate = useNavigate();

  // Navigation handlers
  const handleStartAssessment = () => {
    navigate('/assessment');
  };

  const handleStartNewAssessment = () => {
    navigate('/assessment');
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activeFilter]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Get filtered data based on active filter
      const filterParam = activeFilter !== 'all' ? activeFilter : null;

      const [overviewResult, recentAssessmentsResult, inProgressResult] = await Promise.all([
        DashboardService.getDashboardOverview(filterParam),
        DashboardService.getRecentAssessments(filterParam),
        DashboardService.getInProgressAssessments(filterParam),
      ]);

      const recentAssessments = recentAssessmentsResult.success
        ? recentAssessmentsResult.data.globalRecentAssessments || []
        : [];

      const inProgressAssessments = inProgressResult.success
        ? inProgressResult.data.inProgressAssessments || []
        : [];

      setOverviewData(overviewResult.success ? overviewResult.data : null);
      setRecentAssessments(recentAssessments);
      setInProgressAssessments(inProgressAssessments);
      setError(null);

      // Notify parent component that data has been refreshed
      if (onDataRefresh) {
        onDataRefresh(overviewResult.data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data');
      showError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Expose refresh function to parent components
  useImperativeHandle(ref, () => ({
    refresh: fetchDashboardData,
  }));

  const formatDate = dateString => {
    if (!dateString) return 'Not Available';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getRiskScoreColor = score => {
    if (!score) return 'text-gray-500 dark:text-gray-400';
    if (score <= 3) return 'text-green-600 dark:text-green-400';
    if (score <= 7) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getRiskLevelText = score => {
    if (!score || isNaN(score)) return 'Assessment Complete';
    if (score <= 3) return 'Low Risk';
    if (score <= 7) return 'Moderate Risk';
    return 'High Risk';
  };

  const getStatusBadgeColor = status => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'active':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LogoLoader size="large" message="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <Button onClick={fetchDashboardData} variant="primary" size="md">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Badge */}
      <div className="relative">
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-gradient-radial from-blue-500/20 to-transparent rounded-full blur-lg z-0 opacity-70"></div>
        <div className="relative z-10 inline-flex items-center mb-4 bg-gradient-to-r from-blue-500/10 to-blue-600/20 rounded-full pl-1 pr-4 py-1">
          <span className="bg-blue-500 text-white dark:bg-blue-600 dark:text-white rounded-full w-6 h-6 flex items-center justify-center mr-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838l-2.727 1.17 1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
            </svg>
          </span>
          <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">
            Dashboard Overview
          </span>
        </div>
      </div>

      {/* Parent Information Section */}
      <motion.div
        variants={FADE_UP}
        initial="hidden"
        animate="visible"
        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 dark:border-gray-700/30 p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Parent Information
        </h2>

        {overviewData?.parentDetails && (
          <div className="grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 xs:gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Name</h3>
              <p className="text-lg text-gray-900 dark:text-white">
                {overviewData.parentDetails.name}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Email</h3>
              <p className="text-lg text-gray-900 dark:text-white">
                {overviewData.parentDetails.email}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Status</h3>
              <span
                className={`inline-flex px-2 py-1 text-sm font-medium rounded-full ${
                  overviewData.parentDetails.status === 'Active'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}
              >
                {overviewData.parentDetails.status}
              </span>
            </div>
          </div>
        )}

        {/* Quick Stats - Improved with meaningful data */}
        {overviewData?.stats && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 text-center">
              Assessment Overview{' '}
              {activeFilter !== 'all' &&
                `(${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Only)`}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 text-center border border-blue-200/30 dark:border-blue-700/30">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {overviewData.stats.childrenCount || 0}
                </div>
                <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {overviewData.stats.childrenCount === 1 ? 'Child' : 'Children'}
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 text-center border border-green-200/30 dark:border-green-700/30">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                  {overviewData.stats.completedAssessments || 0}
                </div>
                <div className="text-sm font-medium text-green-700 dark:text-green-300">
                  Completed
                </div>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl p-4 text-center border border-yellow-200/30 dark:border-yellow-700/30">
                <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
                  {overviewData.stats.inProgressAssessments || 0}
                </div>
                <div className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                  In Progress
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4 text-center border border-purple-200/30 dark:border-purple-700/30">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                  {overviewData.stats.totalAssessments || 0}
                </div>
                <div className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  Total
                </div>
              </div>
            </div>

            {/* Additional meaningful metrics */}
            {overviewData.stats.completedAssessments > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Completion Rate:{' '}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {Math.round(
                      (overviewData.stats.completedAssessments /
                        (overviewData.stats.totalAssessments || 1)) *
                        100
                    )}
                    %
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Recent Assessment Results Section */}
      <motion.div
        variants={FADE_UP}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 dark:border-gray-700/30 p-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Recent Assessment Results
          </h2>
          <Link
            to="/dashboard?tab=reports"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium transition-colors"
          >
            View All
          </Link>
        </div>

        {recentAssessments.length === 0 ? (
          <div className="text-center py-8">
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
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No assessment results yet. Start an assessment to see results here.
            </p>
            <Button
              onClick={handleStartAssessment}
              variant="gradient"
              size="md"
              className="group relative overflow-hidden"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 group-hover:translate-x-1 transition-transform duration-300"
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
        ) : (
          <div className="space-y-3">
            {recentAssessments.slice(0, 5).map((assessment, index) => (
              <div
                key={assessment.id}
                className="flex items-center justify-between p-4 bg-gray-50/80 dark:bg-gray-700/30 rounded-xl border border-gray-200/30 dark:border-gray-600/30"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    {/* Child Avatar */}
                    <div className="flex-shrink-0">
                      {assessment.childId?.avatar ? (
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 dark:border-gray-700/50 shadow-sm">
                          {assessment.childId.avatar.startsWith('http') ||
                          assessment.childId.avatar.startsWith('/') ? (
                            <img
                              src={assessment.childId.avatar}
                              alt={`${assessment.childName}'s profile`}
                              className="w-full h-full object-cover"
                              onError={e => {
                                e.target.style.display = 'none';
                                e.target.parentNode.innerHTML = `<div class='w-full h-full bg-gradient-to-br from-primary to-primary-600 rounded-full flex items-center justify-center text-white text-sm font-bold'>${assessment.childName?.charAt(0) || 'C'}</div>`;
                              }}
                            />
                          ) : (
                            <img
                              src={`/child-avatar/${assessment.childId.avatar}.jpg`}
                              alt={`${assessment.childName}'s profile`}
                              className="w-full h-full object-cover"
                              onError={e => {
                                e.target.style.display = 'none';
                                e.target.parentNode.innerHTML = `<div class='w-full h-full bg-gradient-to-br from-primary to-primary-600 rounded-full flex items-center justify-center text-white text-sm font-bold'>${assessment.childName?.charAt(0) || 'C'}</div>`;
                              }}
                            />
                          )}
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-400/80 to-primary-500/80 flex items-center justify-center text-white font-medium shadow-sm border border-white/20 dark:border-primary-700/30">
                          {assessment.childName?.charAt(0) || 'C'}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {formatChildName(assessment.childName)}
                      </h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="capitalize">{assessment.assessmentType || 'General'}</span>
                        {assessment.sourceType && (
                          <>
                            <span>•</span>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                assessment.sourceType === 'image'
                                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                              }`}
                            >
                              {assessment.sourceType === 'image'
                                ? 'Image Assessment'
                                : 'Text Assessment'}
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span>{formatDate(assessment.completedAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-right mr-4">
                  {assessment.riskScore && (
                    <div
                      className={`text-sm font-medium ${getRiskScoreColor(assessment.riskScore)}`}
                    >
                      {getRiskLevelText(assessment.riskScore)}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Score: {assessment.riskScore}/10
                  </div>
                </div>

                <Link
                  to={`/assessment/${assessment.sessionId}/report`}
                  className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* In-Progress Assessments Section */}
      <motion.div
        variants={FADE_UP}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 dark:border-gray-700/30 p-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            In-Progress Assessments
          </h2>
          <Button
            onClick={handleStartNewAssessment}
            variant="gradient"
            size="sm"
            className="group relative overflow-hidden"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1 group-hover:translate-x-1 transition-transform duration-300"
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
            Start New
          </Button>
        </div>

        {inProgressAssessments.length === 0 ? (
          <div className="text-center py-8">
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400">No in-progress assessments.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {inProgressAssessments.map((assessment, index) => (
              <div
                key={assessment.id}
                className="flex items-center justify-between p-4 bg-gray-50/80 dark:bg-gray-700/30 rounded-xl border border-gray-200/30 dark:border-gray-600/30"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    {/* Child Avatar */}
                    <div className="flex-shrink-0">
                      {assessment.childId?.avatar ? (
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 dark:border-gray-700/50 shadow-sm">
                          {assessment.childId.avatar.startsWith('http') ||
                          assessment.childId.avatar.startsWith('/') ? (
                            <img
                              src={assessment.childId.avatar}
                              alt={`${assessment.childName}'s profile`}
                              className="w-full h-full object-cover"
                              onError={e => {
                                e.target.style.display = 'none';
                                e.target.parentNode.innerHTML = `<div class='w-full h-full bg-gradient-to-br from-primary to-primary-600 rounded-full flex items-center justify-center text-white text-sm font-bold'>${assessment.childName?.charAt(0) || 'C'}</div>`;
                              }}
                            />
                          ) : (
                            <img
                              src={`/child-avatar/${assessment.childId.avatar}.jpg`}
                              alt={`${assessment.childName}'s profile`}
                              className="w-full h-full object-cover"
                              onError={e => {
                                e.target.style.display = 'none';
                                e.target.parentNode.innerHTML = `<div class='w-full h-full bg-gradient-to-br from-primary to-primary-600 rounded-full flex items-center justify-center text-white text-sm font-bold'>${assessment.childName?.charAt(0) || 'C'}</div>`;
                              }}
                            />
                          )}
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-400/80 to-primary-500/80 flex items-center justify-center text-white font-medium shadow-sm border border-white/20 dark:border-primary-700/30">
                          {assessment.childName?.charAt(0) || 'C'}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {formatChildName(assessment.childName)}
                      </h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="capitalize">{assessment.assessmentType || 'General'}</span>
                        {assessment.sourceType && (
                          <>
                            <span>•</span>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                assessment.sourceType === 'image'
                                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                              }`}
                            >
                              {assessment.sourceType === 'image'
                                ? 'Image Assessment'
                                : 'Text Assessment'}
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span>Last active: {formatDate(assessment.lastActiveAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(assessment.status)}`}
                    >
                      {assessment.status?.charAt(0).toUpperCase() + assessment.status?.slice(1) ||
                        'In Progress'}
                    </span>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {assessment.progress?.completionPercentage || 0}% complete
                    </div>
                  </div>

                  <Link
                    to={`/assessment/${assessment.sessionId}`}
                    className="px-3 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full hover:bg-green-200 dark:hover:bg-green-800/40 transition-colors"
                  >
                    Continue
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
});

export default DashboardOverview;
