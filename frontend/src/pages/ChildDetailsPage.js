import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftIcon,
  PencilIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CalendarIcon,
  UserIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  EyeIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import ChildProfileService from '../services/ChildProfileService';
import AssessmentService from '../services/AssessmentService';
import DashboardService from '../services/DashboardService';
import { useToast } from '../contexts/ToastContext';
import LogoLoader from '../components/ui/LogoLoader';
import ProgressVisualization from '../components/dashboard/ProgressVisualization';
import AvatarImage from '../components/ui/AvatarImage';
import Button from '../components/ui/Button';
import { generateChildProgressData } from '../utils/dummyData';
import { getCleanChildName, getChildInitials, getChildAge } from '../utils/nameUtils';
import TranslatedText from '../components/ui/TranslatedText';
import PDFDownloadButton from '../components/ui/PDFDownloadButton';
import PDFService from '../services/PDFService';

const ChildDetailsPage = () => {
  const { childId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { success: showSuccess, error: showError } = useToast();

  const [child, setChild] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [reports, setReports] = useState([]);
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [error, setError] = useState(null);

  // Helper function to render child avatar properly
  const getChildAvatar = child => {
    if (!child) return null;

    const childName = getCleanChildName(child);

    // Debug logging to understand what avatar data we have
    console.log('Child avatar data:', {
      avatar: child.avatar,
      photo: child.photo,
      childName,
      childId: child.id || child._id,
    });

    // Check if child has an uploaded image (S3 URL or file path)
    if (child.avatar && (child.avatar.startsWith('http') || child.avatar.startsWith('/'))) {
      console.log('Using uploaded avatar:', child.avatar);
      return (
        <div className="w-20 h-20 rounded-full overflow-hidden border border-white/20 dark:border-gray-700/50 shadow-sm">
          <img
            src={child.avatar}
            alt={`${childName}'s profile`}
            className="w-full h-full object-cover"
            onError={e => {
              console.log('Avatar image failed to load:', child.avatar);
              // Fallback to initials if image fails to load
              e.target.style.display = 'none';
              e.target.parentNode.innerHTML = `
                <div class="w-full h-full bg-gradient-to-br from-primary to-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  ${getChildInitials(child)}
                </div>
              `;
            }}
          />
        </div>
      );
    }

    // Legacy check for child.photo field (in case some profiles still use this)
    if (child.photo && (child.photo.startsWith('http') || child.photo.startsWith('/'))) {
      console.log('Using legacy photo field:', child.photo);
      return (
        <div className="w-20 h-20 rounded-full overflow-hidden border border-white/20 dark:border-gray-700/50 shadow-sm">
          <img
            src={child.photo}
            alt={`${childName}'s profile`}
            className="w-full h-full object-cover"
            onError={e => {
              console.log('Photo image failed to load:', child.photo);
              // Fallback to initials if image fails to load
              e.target.style.display = 'none';
              e.target.parentNode.innerHTML = `
                <div class="w-full h-full bg-gradient-to-br from-primary to-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  ${getChildInitials(child)}
                </div>
              `;
            }}
          />
        </div>
      );
    }

    // If child has selected a predefined avatar
    if (
      child.avatar &&
      child.avatar !== 'default' &&
      !child.avatar.startsWith('http') &&
      !child.avatar.startsWith('/')
    ) {
      console.log('Using predefined avatar:', child.avatar);
      const imagePath = `/child-avatar/${child.avatar}.jpg`;

      return (
        <div className="w-20 h-20 rounded-full overflow-hidden border border-white/20 dark:border-gray-700/50 shadow-sm">
          <AvatarImage
            imagePath={imagePath}
            avatarId={child.avatar}
            className="w-20 h-20"
            fallbackType="emoji"
          />
        </div>
      );
    }

    console.log('Using default avatar fallback for:', childName);
    // Default avatar based on gender or initials
    return (
      <div
        className={`flex items-center justify-center w-20 h-20 rounded-full ${
          child.gender === 'female'
            ? 'bg-secondary/10 text-secondary dark:bg-secondary/20 dark:text-secondary-300'
            : 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-300'
        } border border-white/20 dark:border-gray-700/50 shadow-sm`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-10 h-10"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437.695z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    );
  };

  useEffect(() => {
    if (childId) {
      loadChildData();
    }
  }, [childId]);

  // Helper function to transform assessment data for ProgressVisualization
  const transformAssessmentDataToProgressFormat = (assessments, childName) => {
    if (!assessments || assessments.length === 0) {
      console.log('No assessments provided for progress data');
      return null;
    }

    console.log('Raw assessments for progress transformation:', assessments);

    // Filter only completed assessments that have results
    const completedAssessments = assessments.filter(assessment => {
      const isCompleted = assessment.status === 'completed';
      const hasResults = assessment.results || assessment.reportData || assessment.scores;

      console.log(`Assessment ${assessment.id || assessment.sessionId}:`, {
        status: assessment.status,
        isCompleted,
        hasResults: !!hasResults,
        results: assessment.results,
        reportData: assessment.reportData,
        scores: assessment.scores,
        disorderRisk: assessment.results?.disorderRisk,
        fullData: assessment,
      });

      return isCompleted && hasResults;
    });

    console.log(
      `Found ${completedAssessments.length} completed assessments with results out of ${assessments.length} total`
    );

    if (completedAssessments.length === 0) {
      return null;
    }

    // Create timeline data from assessments - try multiple data sources
    const timelines = completedAssessments.map(assessment => {
      // Try different possible score structures
      let scores = {};

      if (assessment.results?.scores) {
        // Original expected structure
        scores = {
          attention: (assessment.results.scores.attention || 0) * 10,
          memory: (assessment.results.scores.memory || 0) * 10,
          processing: (assessment.results.scores.processing || 0) * 10,
          executive: (assessment.results.scores.executive || 0) * 10,
          sensory: (assessment.results.scores.sensory || 0) * 10,
        };
      } else if (assessment.results?.domainScores) {
        // Alternative domain scores structure - scores are now percentages (0-100)
        const domainScores = assessment.results.domainScores;

        // Handle array format from image assessments
        if (Array.isArray(domainScores)) {
          scores = {};
          domainScores.forEach(domain => {
            const key = domain.domain.toLowerCase().replace(/[^a-z]/g, '');
            scores[key] = domain.score; // score is already percentage (0-100)
          });

          // Fill in missing domains with default values
          const defaultDomains = ['attention', 'memory', 'processing', 'executive', 'sensory'];
          defaultDomains.forEach(domain => {
            if (!scores[domain]) {
              scores[domain] = 50; // Default to 50%
            }
          });
        } else {
          // Handle object format
          scores = {
            attention: domainScores.attention || domainScores.Attention || 50,
            memory: domainScores.memory || domainScores.Memory || 50,
            processing: domainScores.processing || domainScores.Processing || 50,
            executive: domainScores.executive || domainScores.Executive || 50,
            sensory: domainScores.sensory || domainScores.Sensory || 50,
          };
        }
      } else if (assessment.results?.disorderRisk?.score) {
        // Use overall risk score for all domains if specific domain scores aren't available
        const overallScore = assessment.results.disorderRisk.score * 10;
        scores = {
          attention: overallScore,
          memory: overallScore,
          processing: overallScore,
          executive: overallScore,
          sensory: overallScore,
        };
      } else if (assessment.scores) {
        // Direct scores property
        scores = {
          attention: (assessment.scores.attention || 0) * 10,
          memory: (assessment.scores.memory || 0) * 10,
          processing: (assessment.scores.processing || 0) * 10,
          executive: (assessment.scores.executive || 0) * 10,
          sensory: (assessment.scores.sensory || 0) * 10,
        };
      } else {
        // Default/fallback scores
        console.warn('No valid score structure found for assessment:', assessment);
        scores = {
          attention: 50,
          memory: 50,
          processing: 50,
          executive: 50,
          sensory: 50,
        };
      }

      console.log('Generated scores for assessment:', {
        assessmentId: assessment.id || assessment.sessionId,
        scores,
      });

      return {
        date: assessment.completedAt || assessment.lastActiveAt || assessment.createdAt,
        scores,
      };
    });

    // Get the latest scores for current scores and domains
    const latestAssessment = completedAssessments[completedAssessments.length - 1];
    const latestTimeline = timelines[timelines.length - 1];
    const currentScores = latestTimeline ? latestTimeline.scores : {};

    const result = {
      timelines: timelines.sort((a, b) => new Date(a.date) - new Date(b.date)),
      domains: currentScores,
      currentScores,
    };

    console.log('Final progress data result:', result);
    return result;
  };

  const loadChildData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load child profile
      const childData = await ChildProfileService.getChild(childId);
      setChild(childData);

      let loadedAssessments = [];

      // Load assessment history
      try {
        const assessmentHistory = await AssessmentService.getChildAssessments(childId);
        loadedAssessments = Array.isArray(assessmentHistory) ? assessmentHistory : [];
        setAssessments(loadedAssessments);
      } catch (assessmentError) {
        console.warn('Failed to load assessments:', assessmentError);
        setAssessments([]);
      }

      // Load reports
      try {
        const reportsResponse = await DashboardService.getChildReports(childId, {
          page: 1,
          limit: 50,
        });
        if (reportsResponse.success) {
          setReports(reportsResponse.data.reports || []);
        }
      } catch (reportsError) {
        console.warn('Failed to load reports:', reportsError);
        setReports([]);
      }

      // Load progress data using the dashboard service (the correct endpoint)
      try {
        console.log('Fetching progress data from dashboard service for child:', childId);
        const progressResponse = await DashboardService.getChildProgress(childId);

        console.log('Progress response from dashboard service:', progressResponse);

        if (progressResponse.success && progressResponse.data) {
          const dashboardProgressData = progressResponse.data;

          // The dashboard service should return data in the correct format
          // Let's validate and use it directly
          if (dashboardProgressData.timelines && dashboardProgressData.timelines.length > 0) {
            console.log(
              'Successfully loaded progress data with timelines:',
              dashboardProgressData.timelines.length
            );
            setProgressData(dashboardProgressData);
          } else {
            console.log('Dashboard returned valid response but no timeline data');
            setProgressData(null);
          }
        } else {
          console.log('Dashboard service returned success=false or no data');
          setProgressData(null);
        }
      } catch (progressError) {
        console.error('Failed to load progress data from dashboard service:', progressError);

        // Fallback: try to generate progress data from assessments if dashboard fails
        try {
          const childName = getCleanChildName(childData);
          console.log('Fallback: attempting to transform assessment data for progress');
          const fallbackProgressData = transformAssessmentDataToProgressFormat(
            loadedAssessments,
            childName
          );
          setProgressData(fallbackProgressData);
        } catch (fallbackError) {
          console.error('Fallback progress data generation also failed:', fallbackError);
          setProgressData(null);
        }
      }
    } catch (error) {
      console.error('Error loading child data:', error);
      setError('Failed to load child information. Please try again.');
      showError('Failed to load child information');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = dateString => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatAge = birthDate => {
    if (!birthDate) return 'Not specified';
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
  };

  const getStatusBadge = status => {
    const statusConfig = {
      completed: { color: 'green', text: 'Completed', icon: CheckCircleIcon },
      in_progress: { color: 'yellow', text: 'In Progress', icon: ClockIcon },
      paused: { color: 'orange', text: 'Paused', icon: ExclamationTriangleIcon },
      not_started: { color: 'gray', text: 'Not Started', icon: CalendarIcon },
    };

    const config = statusConfig[status] || statusConfig.not_started;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${config.color}-100 text-${config.color}-800 dark:bg-${config.color}-900/20 dark:text-${config.color}-300`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const getRiskLevelBadge = riskScore => {
    if (riskScore === null || riskScore === undefined) {
      return <span className="text-gray-400 text-sm">Not assessed</span>;
    }

    let level, color;
    if (riskScore <= 3) {
      level = 'Low Risk';
      color = 'green';
    } else if (riskScore <= 6) {
      level = 'Moderate Risk';
      color = 'yellow';
    } else {
      level = 'High Risk';
      color = 'red';
    }

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${color}-100 text-${color}-800 dark:bg-${color}-900/20 dark:text-${color}-300`}
      >
        {level} ({riskScore}/10)
      </span>
    );
  };

  const handleViewReport = report => {
    navigate(`/assessment-complete/${report.id}`);
  };

  const handleDownloadReport = async report => {
    try {
      await DashboardService.downloadReport(report.id);
      showSuccess('Report downloaded successfully');
    } catch (error) {
      console.error('Error downloading report:', error);
      showError('Failed to download report');
    }
  };

  // Handle PDF download
  const handleExportProfile = async () => {
    try {
      await PDFService.downloadChildProfilePDF(childId, getCleanChildName(child));
    } catch (error) {
      console.error('PDF download failed:', error);
      showError('Failed to download profile PDF');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <LogoLoader size="large" message="Loading child details..." />
          </div>
        </div>
      </div>
    );
  }

  if (error || !child) {
    return (
      <div className="min-h-screen pt-20 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <svg
              className="w-20 h-20 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Error Loading Profile
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error || 'The child profile you are looking for could not be found.'}
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-600 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const childName = getCleanChildName(child);

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => navigate('/dashboard?tab=children')}
              className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              <TranslatedText>Back to Children</TranslatedText>
            </Button>
          </div>
          <div className="flex items-center space-x-3">
            <Link to={`/edit-child/${childId}`}>
              <Button
                variant="gradient"
                size="md"
                className="inline-flex items-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg"
              >
                <PencilIcon className="w-4 h-4 mr-2" />
                <TranslatedText>Edit Profile</TranslatedText>
              </Button>
            </Link>

            <Button
              onClick={handleExportProfile}
              variant="secondary"
              size="md"
              className="inline-flex items-center bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 dark:border-gray-600 font-semibold shadow-lg"
            >
              <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
              Export Profile
            </Button>
          </div>
        </motion.div>

        {/* Child Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-sm border border-white/20 dark:border-gray-700/50 p-6 mb-8"
        >
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">{getChildAvatar(child)}</div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{childName}</h1>
              <div className="flex items-center space-x-4 mt-2 text-gray-600 dark:text-gray-400">
                <span className="flex items-center">
                  <UserIcon className="w-4 h-4 mr-1" />
                  {getChildAge(child)} years old
                </span>
                <span className="flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-1" />
                  Born: {formatDate(child.dateOfBirth)}
                </span>
                {child.gender && <span className="capitalize">{child.gender}</span>}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'profile', name: 'Profile', icon: UserIcon },
              { id: 'assessments', name: 'Assessments', icon: ChartBarIcon },
              { id: 'reports', name: 'Reports', icon: DocumentTextIcon },
              { id: 'progress', name: 'Progress', icon: ChartBarIcon },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary dark:border-primary-400 dark:text-primary-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-sm border border-white/20 dark:border-gray-700/50 p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Profile Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Full Name
                    </label>
                    <p className="mt-1 text-gray-900 dark:text-white">{childName}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Date of Birth
                    </label>
                    <p className="mt-1 text-gray-900 dark:text-white">
                      {formatDate(child.dateOfBirth)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Age
                    </label>
                    <p className="mt-1 text-gray-900 dark:text-white">
                      {getChildAge(child)} years old
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Gender
                    </label>
                    <p className="mt-1 text-gray-900 dark:text-white capitalize">
                      {child.gender || 'Not specified'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Grade/Class
                    </label>
                    <p className="mt-1 text-gray-900 dark:text-white">
                      {child.grade || 'Not specified'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Languages
                    </label>
                    <p className="mt-1 text-gray-900 dark:text-white">
                      {child.languages?.length ? child.languages.join(', ') : 'Not specified'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Profile Created
                    </label>
                    <p className="mt-1 text-gray-900 dark:text-white">
                      {formatDate(child.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              {(child.concerns?.length > 0 || child.otherConcern) && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Concerns & Notes
                  </label>
                  <div className="space-y-2">
                    {child.concerns?.map((concern, index) => (
                      <span
                        key={index}
                        className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-sm mr-2 mb-2"
                      >
                        {concern}
                      </span>
                    ))}
                    {child.otherConcern && (
                      <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">
                        {child.otherConcern}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {child.notes && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Additional Notes
                  </label>
                  <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">
                    {child.notes}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'assessments' && (
            <motion.div
              key="assessments"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-sm border border-white/20 dark:border-gray-700/50 p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Assessment History
                </h2>
                <Link to={`/assessments?childId=${childId}`}>
                  <Button
                    variant="gradient"
                    size="md"
                    className="inline-flex items-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg"
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
                    Start New Assessment
                  </Button>
                </Link>
              </div>

              {assessments.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <ChartBarIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">No Assessments Yet</h3>
                  <p className="mb-4">This child hasn't completed any assessments yet.</p>
                  <Link to={`/assessments?childId=${childId}`}>
                    <Button
                      variant="gradient"
                      size="md"
                      className="inline-flex items-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg"
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
                      Start First Assessment
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {assessments.map(assessment => (
                    <div
                      key={assessment.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {assessment.assessmentType?.toUpperCase() || 'General'} Assessment
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(assessment.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          {getStatusBadge(assessment.status)}
                          {assessment.riskScore !== undefined &&
                            getRiskLevelBadge(assessment.riskScore)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'reports' && (
            <motion.div
              key="reports"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-sm border border-white/20 dark:border-gray-700/50 p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Assessment Reports
              </h2>

              {reports.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <DocumentTextIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">No Reports Available</h3>
                  <p>Complete an assessment to generate reports.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map(report => (
                    <div
                      key={report.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {report.assessmentType?.toUpperCase() || 'General'} Assessment Report
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Generated: {formatDate(report.createdAt)}
                          </p>
                          {report.riskScore !== undefined && (
                            <div className="mt-2">{getRiskLevelBadge(report.riskScore)}</div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={() => handleViewReport(report)}
                            variant="outline"
                            size="sm"
                            className="inline-flex items-center text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                          >
                            <EyeIcon className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button
                            onClick={() => handleDownloadReport(report)}
                            variant="outline"
                            size="sm"
                            className="inline-flex items-center text-green-600 dark:text-green-400 border-green-200 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/30"
                          >
                            <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                            PDF
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'progress' && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-sm border border-white/20 dark:border-gray-700/50 p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Progress Visualization
              </h2>

              {progressData && progressData.timelines && progressData.timelines.length > 0 ? (
                <div className="space-y-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700/50">
                    <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
                      Assessment Progress Overview for {childName}
                    </h3>
                    <p className="text-blue-700 dark:text-blue-300 text-sm">
                      Showing {progressData.timelines.length} assessment
                      {progressData.timelines.length === 1 ? '' : 's'} over time. Track
                      developmental progress across different cognitive domains.
                    </p>
                  </div>

                  <div className="bg-white/80 dark:bg-gray-700/80 p-4 rounded-lg shadow-inner border border-white/20 dark:border-gray-600/30">
                    <ProgressVisualization data={progressData} height={500} isDarkMode={false} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700/50">
                      <h4 className="font-medium text-green-900 dark:text-green-100 mb-1">
                        Completed Assessments
                      </h4>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {assessments.filter(a => a.status === 'completed').length}
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                        Total assessments completed
                      </p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700/50">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                        Latest Overall Score
                      </h4>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {progressData.currentScores
                          ? Math.round(
                              Object.values(progressData.currentScores).reduce((a, b) => a + b, 0) /
                                Object.values(progressData.currentScores).length
                            )
                          : 0}
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        Average across all domains
                      </p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-700/50">
                      <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-1">
                        Reports Generated
                      </h4>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {reports.length}
                      </p>
                      <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                        Available for download
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <ChartBarIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Progress Data Available
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    {assessments.length === 0 ? (
                      <>
                        Progress data will be available after {childName} completes assessments.
                        Start an assessment to begin tracking developmental progress.
                      </>
                    ) : (
                      <>
                        Some assessments are available but no completed assessments with scoring
                        data were found. Complete an assessment to see progress visualization.
                      </>
                    )}
                  </p>
                  <div className="space-y-3">
                    <Link to={`/assessments?childId=${childId}`}>
                      <Button
                        variant="gradient"
                        size="md"
                        className="inline-flex items-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg"
                      >
                        <ChartBarIcon className="w-5 h-5 mr-2" />
                        {assessments.length === 0
                          ? 'Start First Assessment'
                          : 'Take Another Assessment'}
                      </Button>
                    </Link>
                    {assessments.length > 0 && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p>
                          Found {assessments.length} assessment{assessments.length === 1 ? '' : 's'}{' '}
                          in total
                        </p>
                        <p>Completed: {assessments.filter(a => a.status === 'completed').length}</p>
                        <p>
                          In Progress: {assessments.filter(a => a.status === 'in_progress').length}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ChildDetailsPage;
