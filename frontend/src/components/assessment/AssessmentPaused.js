import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import AssessmentLayout from './AssessmentLayout';
import { useLanguage } from '../../contexts/LanguageContext';
import AssessmentService from '../../services/AssessmentService';

const AssessmentPaused = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const [sessionId, setSessionId] = useState(null);

  // Get sessionId from multiple sources
  useEffect(() => {
    // Try to get sessionId from URL params first
    const urlSessionId = searchParams.get('sessionId');
    if (urlSessionId) {
      setSessionId(urlSessionId);
      return;
    }

    // Try to get from location state
    if (location.state?.sessionId) {
      setSessionId(location.state.sessionId);
      return;
    }

    // If no sessionId found, redirect to assessments
    console.warn('No sessionId found, redirecting to assessments');
    navigate('/assessments');
  }, [searchParams, location.state, navigate]);

  // Get assessment data from location state with better fallbacks
  const {
    assessmentType = 'general',
    childInfo = { name: 'Child', age: 8, gender: 'male' },
    answers = {},
    currentQuestion = 0,
    duration = 0,
  } = location.state || {};

  const handleResume = async () => {
    if (!sessionId) {
      console.error('No sessionId available for resume');
      navigate('/assessments');
      return;
    }

    try {
      // Resume the assessment on the backend
      await AssessmentService.resumeAssessment(sessionId);

      // Navigate to the assessment session
      navigate(`/assessment/${sessionId}`, {
        replace: true,
      });
    } catch (error) {
      console.error('Error resuming assessment:', error);
      // If resume fails, still try to navigate to the assessment
      navigate(`/assessment/${sessionId}`, {
        replace: true,
      });
    }
  };

  const handleDashboard = () => {
    navigate('/assessments');
  };

  // Clean child name display
  const getCleanChildName = () => {
    if (!childInfo.name) return 'Child';

    let cleaned = childInfo.name
      .replace(/Test\s+N\/A|N\/A|undefined|Test\s+/gi, '')
      .replace(/Raj\s+N\/A/gi, 'Raj')
      .replace(/\s+N\/A/gi, '')
      .replace(/N\/A\s+/gi, '')
      .trim();

    const nameParts = cleaned.split(/\s+/).filter(part => part.length > 0);
    if (nameParts.length > 1) {
      cleaned = [...new Set(nameParts)].join(' ');
    }

    return cleaned || 'Child';
  };

  return (
    <AssessmentLayout>
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glassmorphism rounded-xl p-6"
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full glassmorphism-primary flex items-center justify-center mx-auto mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-primary dark:text-primary-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">
              {t('assessment.paused.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">{t('assessment.paused.subtitle')}</p>
          </div>

          <div className="glassmorphism-secondary rounded-xl p-6 mb-8">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
              {t('assessment.paused.resumeTitle')}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {t('assessment.paused.resumeDescription')}
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300">
              <div className="glassmorphism p-3 rounded-lg">
                <span className="font-medium">Child:</span> {getCleanChildName()}
              </div>
              <div className="glassmorphism p-3 rounded-lg">
                <span className="font-medium">Age:</span> {childInfo.age}
              </div>
              <div className="glassmorphism p-3 rounded-lg">
                <span className="font-medium">Assessment:</span>{' '}
                {assessmentType
                  ? assessmentType.charAt(0).toUpperCase() + assessmentType.slice(1)
                  : 'General'}
              </div>
              <div className="glassmorphism p-3 rounded-lg">
                <span className="font-medium">Progress:</span> {currentQuestion + 1} questions
                answered
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleResume}
              disabled={!sessionId}
              className="glassmorphism-primary px-8 py-3 rounded-lg text-gray-800 dark:text-white font-semibold flex items-center justify-center gap-2 shadow-colored-sm hover:shadow-colored-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
              {t('assessment.paused.resumeButton')}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDashboard}
              className="glassmorphism px-8 py-3 rounded-lg text-gray-700 dark:text-gray-200 font-semibold flex items-center justify-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              {t('assessment.paused.dashboardButton')}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AssessmentLayout>
  );
};

export default AssessmentPaused;
