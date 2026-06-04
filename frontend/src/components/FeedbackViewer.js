import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CalendarIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  StarIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  BugAntIcon,
  ShieldCheckIcon,
  ComputerDesktopIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  LockClosedIcon,
  NoSymbolIcon,
} from '@heroicons/react/24/outline';
import TranslatedText from './ui/TranslatedText';
import { createApiUrl } from '../utils/apiConfig';
import { useAuth } from '../contexts/AuthContext';

const FeedbackViewer = () => {
  const { isLoggedIn, currentUser } = useAuth();
  const navigate = useNavigate();

  // Check if user has admin access (cognikidzcare@gmail.com and tes@gmail.com)
  const allowedEmails = ['cognikidzcare@gmail.com', 'tes@gmail.com'];
  const hasAdminAccess = isLoggedIn && allowedEmails.includes(currentUser?.email);

  const [feedback, setFeedback] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedItems, setExpandedItems] = useState({});
  const [debugInfo, setDebugInfo] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // Redirect if user doesn't have access
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', {
        state: {
          from: '/feedback-responses',
          message: 'Please log in to access feedback responses.',
        },
      });
    } else if (!hasAdminAccess) {
      navigate('/', {
        state: {
          message: 'Access denied. This page is restricted to administrators only.',
        },
      });
    }
  }, [isLoggedIn, hasAdminAccess, navigate]);

  useEffect(() => {
    // Only fetch data if user has admin access
    if (hasAdminAccess) {
      fetchFeedbackData();
    }
  }, [filters, hasAdminAccess]);

  const fetchFeedbackData = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        limit: '100',
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
      });

      // Fetch feedback and stats in parallel
      const [feedbackResponse, statsResponse] = await Promise.all([
        fetch(createApiUrl(`/api/feedback/view?${queryParams}`)),
        fetch(createApiUrl('/api/feedback/view/stats')),
      ]);

      const feedbackResult = await feedbackResponse.json();
      const statsResult = await statsResponse.json();

      if (feedbackResult.success) {
        setFeedback(feedbackResult.data);
      } else {
        setError('Failed to load feedback data: ' + (feedbackResult.message || 'Unknown error'));
      }

      if (statsResult.success) {
        setStats(statsResult.data);
      } else {
        console.warn('Failed to load stats:', statsResult.message);
      }
    } catch (err) {
      console.error('Error loading feedback:', err);
      setError('Error loading feedback: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const testApiConnection = async () => {
    try {
      const healthUrl = createApiUrl('/api/health');
      console.log('Testing health endpoint:', healthUrl);

      const response = await fetch(healthUrl);
      const result = await response.json();

      setDebugInfo({
        healthCheck: {
          url: healthUrl,
          status: response.status,
          data: result,
        },
      });

      console.log('Health check result:', result);
    } catch (err) {
      console.error('Health check failed:', err);
      setDebugInfo({
        healthCheck: {
          url: createApiUrl('/api/health'),
          error: err.message,
        },
      });
    }
  };

  const toggleExpanded = id => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRatingStars = rating => {
    if (!rating) return 'N/A';
    const stars = Array.from({ length: 5 }, (_, i) => (
      <StarIcon
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
    return (
      <div className="flex items-center space-x-1">
        <div className="flex">{stars}</div>
        <span className="text-sm text-gray-600 dark:text-gray-400">({rating}/5)</span>
      </div>
    );
  };

  const getRecommendationBar = score => {
    if (score === null || score === undefined) return 'N/A';
    const percentage = (score / 10) * 100;
    const color = score >= 8 ? 'bg-green-500' : score >= 6 ? 'bg-yellow-500' : 'bg-red-500';

    return (
      <div className="flex items-center space-x-2">
        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`${color} h-2 rounded-full transition-all duration-300`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{score}/10</span>
      </div>
    );
  };

  const getStatusBadge = status => {
    const statusColors = {
      new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      reviewed: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      in_progress: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status] || statusColors.new}`}
      >
        {status?.toUpperCase() || 'NEW'}
      </span>
    );
  };

  const getPriorityBadge = priority => {
    const priorityColors = {
      low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[priority] || priorityColors.medium}`}
      >
        {priority?.toUpperCase() || 'MEDIUM'}
      </span>
    );
  };

  const renderFeatureSection = (title, data, icon) => {
    if (!data || Object.keys(data).length === 0) return null;

    return (
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-3">
          {React.createElement(icon, { className: 'w-5 h-5 text-blue-600 dark:text-blue-400' })}
          <h4 className="font-semibold text-gray-900 dark:text-white">
            <TranslatedText>{title}</TranslatedText>
          </h4>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
          {Object.entries(data).map(([key, value]) => {
            if (value === null || value === undefined || value === '') return null;

            return (
              <div key={key} className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}:
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {typeof value === 'number' && key.includes('rating')
                    ? getRatingStars(value)
                    : typeof value === 'object'
                      ? Array.isArray(value)
                        ? value.join(', ')
                        : Object.keys(value).length > 0
                          ? `${Object.keys(value).length} items`
                          : 'No data'
                      : String(value)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderBugReports = bugReports => {
    if (!bugReports || bugReports.length === 0) return null;

    return (
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-3">
          <BugAntIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
          <h4 className="font-semibold text-gray-900 dark:text-white">
            Bug Reports ({bugReports.length})
          </h4>
        </div>
        <div className="space-y-3">
          {bugReports.map((bug, index) => (
            <div
              key={index}
              className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800"
            >
              <div className="flex justify-between items-start mb-2">
                <h5 className="font-medium text-gray-900 dark:text-white">
                  {bug.location || 'Unknown Location'}
                </h5>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    bug.impact === 'High'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : bug.impact === 'Medium'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  }`}
                >
                  {bug.impact || 'Medium'} Impact
                </span>
              </div>
              {bug.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{bug.description}</p>
              )}
              {bug.reproductionSteps && (
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  <strong>Steps to reproduce:</strong> {bug.reproductionSteps}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render clean performance issues section
  const renderPerformanceIssues = performanceIssues => {
    if (
      !performanceIssues ||
      !performanceIssues.encountered ||
      performanceIssues.encountered.length === 0
    )
      return null;

    return (
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          <h4 className="font-semibold text-gray-900 dark:text-white">Performance Issues</h4>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
          <div className="space-y-2">
            {performanceIssues.encountered.map((issue, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-orange-800 dark:text-orange-200">{issue}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Enhanced assessment display function
  const renderAssessmentDetails = assessmentSystem => {
    if (!assessmentSystem) return null;

    return (
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-3">
          <DocumentTextIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h4 className="font-semibold text-gray-900 dark:text-white">Assessment Details</h4>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-3">
          {assessmentSystem.assessmentsAttempted &&
            assessmentSystem.assessmentsAttempted.length > 0 && (
              <div>
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Assessments Attempted:
                </span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {assessmentSystem.assessmentsAttempted.map((assessment, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200 rounded-full"
                    >
                      {assessment}
                    </span>
                  ))}
                </div>
              </div>
            )}
          {assessmentSystem.overallRating && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-700 dark:text-blue-300">Overall Rating:</span>
              {getRatingStars(assessmentSystem.overallRating)}
            </div>
          )}
          {assessmentSystem.suggestions && (
            <div>
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Suggestions:
              </span>
              <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                {assessmentSystem.suggestions}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Enhanced dashboard experience display function
  const renderDashboardExperience = dashboard => {
    if (!dashboard) return null;

    const getRatingBar = (rating, maxRating = 5) => {
      const percentage = (rating / maxRating) * 100;
      const color =
        rating >= 4
          ? 'bg-green-500'
          : rating >= 3
            ? 'bg-yellow-500'
            : rating >= 2
              ? 'bg-orange-500'
              : 'bg-red-500';

      return (
        <div className="flex items-center space-x-2">
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`${color} h-2 rounded-full transition-all duration-300`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 min-w-[40px]">
            {rating}/{maxRating}
          </span>
        </div>
      );
    };

    const hasIssues =
      dashboard.issues && Object.values(dashboard.issues).some(issue => issue?.hasIssue);

    return (
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-3">
          <ComputerDesktopIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h4 className="font-semibold text-gray-900 dark:text-white">Dashboard Experience</h4>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 space-y-4">
          {/* Ratings */}
          {dashboard.navigationEase && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-purple-700 dark:text-purple-300">
                  Navigation Ease:
                </span>
              </div>
              {getRatingBar(dashboard.navigationEase)}
            </div>
          )}
          {dashboard.informationClarity && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-purple-700 dark:text-purple-300">
                  Information Clarity:
                </span>
              </div>
              {getRatingBar(dashboard.informationClarity)}
            </div>
          )}
          {dashboard.loadingSpeed && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-purple-700 dark:text-purple-300">Loading Speed:</span>
              </div>
              {getRatingBar(dashboard.loadingSpeed)}
            </div>
          )}
          {dashboard.visualAppeal && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-purple-700 dark:text-purple-300">Visual Appeal:</span>
              </div>
              {getRatingBar(dashboard.visualAppeal)}
            </div>
          )}

          {/* Issues Status */}
          {dashboard.issues && (
            <div className="pt-2 border-t border-purple-200 dark:border-purple-700">
              <span className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-2 block">
                Feature Issues:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(dashboard.issues).map(([feature, issue]) => (
                  <div key={feature} className="flex items-center space-x-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        issue?.hasIssue ? 'bg-red-500' : 'bg-green-500'
                      }`}
                    ></div>
                    <span className="text-xs text-purple-700 dark:text-purple-300 capitalize">
                      {feature.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span
                      className={`text-xs ${
                        issue?.hasIssue
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-green-600 dark:text-green-400'
                      }`}
                    >
                      {issue?.hasIssue ? 'Issue' : 'OK'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Show access denied screen for unauthorized users
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center pt-20">
        <div className="text-center max-w-md mx-auto">
          <LockClosedIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Authentication Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You need to be logged in to access feedback responses. Redirecting to login...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center pt-20">
        <div className="text-center max-w-md mx-auto">
          <NoSymbolIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This page is restricted to administrators only. You don't have permission to view
            feedback responses.
          </p>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 dark:text-red-300 mr-2" />
              <div className="text-left">
                <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                  Current user: {currentUser?.email || 'Unknown'}
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  Only cognikidzcare@gmail.com and tes@gmail.com can access this page
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading feedback data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center pt-20">
        <div className="text-center max-w-md mx-auto">
          <div className="text-red-600 dark:text-red-400 text-xl mb-4">⚠️ Connection Error</div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-4 text-left">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              <strong>Debug Info:</strong>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              API URL: {createApiUrl('/api/feedback/view')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Environment: {process.env.NODE_ENV}
            </p>
          </div>
          <div className="space-y-2">
            <button
              onClick={fetchFeedbackData}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Retrying...' : 'Try Again'}
            </button>
            <button
              onClick={testApiConnection}
              className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Test API Connection
            </button>
          </div>
          {debugInfo && (
            <div className="mt-4 bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-left">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Connection Test Results:
              </p>
              <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Feedback Responses
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Comprehensive feedback data from {feedback.length} submissions
              </p>
              <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                <ShieldCheckIcon className="h-4 w-4 mr-1" />
                Admin Access: {currentUser?.email}
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={fetchFeedbackData}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Overview */}
      {stats && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <DocumentTextIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {stats.total}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <TranslatedText>Total Feedback</TranslatedText>
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <StarIcon className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {stats.averageOverallRating || 'N/A'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <TranslatedText>Avg Rating</TranslatedText>
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <ChartBarIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {stats.averageRecommendationScore || 'N/A'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg NPS</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {stats.statusBreakdown?.resolved || 0}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Resolved</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {feedback.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No feedback yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Feedback submissions will appear here once users start providing feedback.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {feedback.map(item => (
              <div
                key={item._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Feedback Header */}
                <div
                  className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => toggleExpanded(item._id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <UserIcon className="w-5 h-5 text-gray-400" />
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {item.name || 'Anonymous'}
                          </h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                            <EnvelopeIcon className="w-4 h-4" />
                            <span>{item.email}</span>
                            <CalendarIcon className="w-4 h-4 ml-2" />
                            <span>{formatDate(item.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(item.status)}
                        {getPriorityBadge(item.priority)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {item.overallRating && (
                        <div className="text-right">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Overall Rating
                          </div>
                          <div>{getRatingStars(item.overallRating)}</div>
                        </div>
                      )}
                      {item.recommendationScore !== null &&
                        item.recommendationScore !== undefined && (
                          <div className="text-right">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              NPS Score
                            </div>
                            <div className="w-24">
                              {getRecommendationBar(item.recommendationScore)}
                            </div>
                          </div>
                        )}
                      {expandedItems[item._id] ? (
                        <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedItems[item._id] && (
                  <div className="px-6 py-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Left Column */}
                      <div>
                        {/* User Information */}
                        {(item.testingDuration || item.deviceInfo) && (
                          <div className="mb-6">
                            <div className="flex items-center space-x-2 mb-3">
                              <DevicePhoneMobileIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                Testing Information
                              </h4>
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 space-y-2">
                              {item.testingDuration && (
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600 dark:text-gray-400">
                                    Duration:
                                  </span>
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {item.testingDuration}
                                  </span>
                                </div>
                              )}
                              {item.deviceInfo?.deviceType && (
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600 dark:text-gray-400">
                                    Device:
                                  </span>
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {item.deviceInfo.deviceType}
                                  </span>
                                </div>
                              )}
                              {item.deviceInfo?.browser && (
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600 dark:text-gray-400">
                                    Browser:
                                  </span>
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {item.deviceInfo.browser}
                                  </span>
                                </div>
                              )}
                              {item.deviceInfo?.operatingSystem && (
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600 dark:text-gray-400">
                                    OS:
                                  </span>
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {item.deviceInfo.operatingSystem}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Feature Testing */}
                        {renderFeatureSection(
                          'Account Management',
                          item.accountManagement,
                          UserIcon
                        )}
                        {renderFeatureSection(
                          'Child Profile Management',
                          item.childProfileManagement,
                          UserIcon
                        )}

                        {/* Enhanced Assessment Display */}
                        {renderAssessmentDetails(item.assessmentSystem)}

                        {/* Enhanced Dashboard Experience Display */}
                        {renderDashboardExperience(item.dashboard)}
                      </div>

                      {/* Right Column */}
                      <div>
                        {/* Chatbot Feedback */}
                        {renderFeatureSection(
                          'Chatbot Experience',
                          item.chatbot,
                          ChatBubbleLeftRightIcon
                        )}

                        {/* Articles & Resources */}
                        {renderFeatureSection(
                          'Articles & Resources',
                          item.articlesResources,
                          DocumentTextIcon
                        )}

                        {/* Security & Privacy */}
                        {(item.securityConcerns || item.dataProtectionConfidence) && (
                          <div className="mb-6">
                            <div className="flex items-center space-x-2 mb-3">
                              <ShieldCheckIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                Security & Privacy
                              </h4>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 space-y-3">
                              {item.dataProtectionConfidence && (
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600 dark:text-gray-400">
                                    Data Protection Confidence:
                                  </span>
                                  {getRatingStars(item.dataProtectionConfidence)}
                                </div>
                              )}
                              {item.securityConcerns &&
                                Object.entries(item.securityConcerns).some(
                                  ([_, v]) => v?.hasConcern
                                ) && (
                                  <div>
                                    <strong className="text-sm text-gray-700 dark:text-gray-300">
                                      Security Concerns:
                                    </strong>
                                    <ul className="mt-1 space-y-1">
                                      {Object.entries(item.securityConcerns).map(
                                        ([key, concern]) =>
                                          concern?.hasConcern && (
                                            <li
                                              key={key}
                                              className="text-sm text-gray-600 dark:text-gray-400"
                                            >
                                              • {key.replace(/([A-Z])/g, ' $1').trim()}:{' '}
                                              {concern.description}
                                            </li>
                                          )
                                      )}
                                    </ul>
                                  </div>
                                )}
                            </div>
                          </div>
                        )}

                        {/* Performance Issues */}
                        {renderPerformanceIssues(item.performanceIssues)}

                        {/* Mobile Responsiveness */}
                        {renderFeatureSection(
                          'Mobile Experience',
                          item.mobileResponsiveness,
                          DevicePhoneMobileIcon
                        )}
                      </div>
                    </div>

                    {/* Full-width sections */}
                    <div className="mt-8 space-y-6">
                      {/* Bug Reports */}
                      {renderBugReports(item.bugReports)}

                      {/* Overall Experience */}
                      {(item.whatWorkedWell ||
                        item.needsImprovement ||
                        item.additionalFeedback) && (
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                            Overall Experience
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {item.whatWorkedWell && (
                              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                                <h5 className="font-medium text-green-800 dark:text-green-200 mb-2">
                                  What Worked Well
                                </h5>
                                <p className="text-sm text-green-700 dark:text-green-300">
                                  {item.whatWorkedWell}
                                </p>
                              </div>
                            )}
                            {item.needsImprovement && (
                              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                                <h5 className="font-medium text-orange-800 dark:text-orange-200 mb-2">
                                  Needs Improvement
                                </h5>
                                <p className="text-sm text-orange-700 dark:text-orange-300">
                                  {item.needsImprovement}
                                </p>
                              </div>
                            )}
                            {item.additionalFeedback && (
                              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                                <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                                  Additional Feedback
                                </h5>
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                  {item.additionalFeedback}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Future Testing */}
                      {(item.futureParticipation ||
                        item.preferredFeatures?.length ||
                        item.contactPreference?.length) && (
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                            Future Testing Preferences
                          </h4>
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                            {item.futureParticipation && (
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  Future Participation:
                                </span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {item.futureParticipation}
                                </span>
                              </div>
                            )}
                            {item.preferredFeatures?.length > 0 && (
                              <div>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  Preferred Features:
                                </span>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {item.preferredFeatures.map((feature, index) => (
                                    <span
                                      key={index}
                                      className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full"
                                    >
                                      {feature}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {item.contactPreference?.length > 0 && (
                              <div>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  Contact Preference:
                                </span>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {item.contactPreference.map((pref, index) => (
                                    <span
                                      key={index}
                                      className="px-2 py-1 text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full"
                                    >
                                      {pref}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Admin Notes */}
                      {item.adminNotes && (
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                            Admin Notes
                          </h4>
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                              {item.adminNotes}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackViewer;
