import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useToast } from '../../../contexts/ToastContext';
import { useTheme } from '../../../contexts/ThemeContext';
import LogoLoader, { AssessmentLoader } from '../../ui/LogoLoader';
import api from '../../../services/api';

const MultimediaAssessmentForm = ({ assessmentType }) => {
  const { theme } = useTheme();
  const { childId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [childData, setChildData] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState(null);
  const { success, error: showError } = useToast();

  useEffect(() => {
    const fetchChildData = async () => {
      try {
        setIsLoading(true);

        // Get child data from API
        const response = await api.get(`/api/childprofile/${childId}`);
        setChildData(response.data);
      } catch (error) {
        console.error('Error fetching child data:', error);
        setError('Unable to load child information. Please try again.');
        showError('Error loading child information');
      } finally {
        setIsLoading(false);
      }
    };

    if (childId) {
      fetchChildData();
    }
  }, [childId, showError]);

  const handleStartAssessment = async () => {
    if (isStarting) return;

    setIsStarting(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock successful response
      const mockSessionId = `${assessmentType}-session-${Date.now()}`;

      console.log('Starting image assessment:', {
        sessionId: mockSessionId,
        assessmentType,
        childData,
      });

      success('Image assessment started successfully!');

      // Navigate to the full-screen assessment session with child data
      navigate(`/assessment/multimedia/session/${mockSessionId}`, {
        state: {
          childData: childData,
          assessmentType: assessmentType,
        },
      });
    } catch (error) {
      console.error('Error starting assessment:', error);
      showError('Error starting assessment. Please try again.');
    } finally {
      setIsStarting(false);
    }
  };

  const getAssessmentInfo = () => {
    switch (assessmentType) {
      case 'autism-multimedia':
        return {
          title: 'Autism Image Assessment',
          description:
            'Simple image comparison tasks to evaluate social understanding through positive and negative scenarios',
          features: [
            'Compare social scenarios',
            'Identify emotions in images',
            'Analyze social interactions',
            'Evaluate visual preferences',
          ],
          duration: '20-35 minutes',
          icon: '🖼️',
          color: 'from-blue-500 to-indigo-600',
        };
      case 'adhd-multimedia':
        return {
          title: 'ADHD Image Assessment',
          description:
            'Image-based tasks to evaluate attention, organization, and environmental preferences',
          features: [
            'Compare attention scenarios',
            'Evaluate organization preferences',
            'Analyze environmental choices',
            'Assess task approach patterns',
          ],
          duration: '20-35 minutes',
          icon: '🖼️',
          color: 'from-orange-500 to-red-500',
        };
      case 'dyslexia-multimedia':
        return {
          title: 'Dyslexia Image Assessment',
          description:
            'Image-based tasks to evaluate text processing, visual preferences, and learning styles',
          features: [
            'Compare text clarity preferences',
            'Evaluate layout choices',
            'Analyze visual processing',
            'Assess learning style preferences',
          ],
          duration: '20-35 minutes',
          icon: '🖼️',
          color: 'from-purple-500 to-pink-500',
        };
      default:
        return {
          title: 'Image Assessment',
          description: 'Interactive image-based assessment',
          features: [],
          duration: '20-35 minutes',
          icon: '🖼️',
          color: 'from-primary to-secondary',
        };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LogoLoader size="large" message="Loading child information..." showMessage={true} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 pt-32 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate('/assessment')}
            className="mb-8 flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Assessments
          </button>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="text-red-500 dark:text-red-400 text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Unable to Load Assessment
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const assessmentInfo = getAssessmentInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 pt-32 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate('/assessment')}
          className="mb-8 flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Assessments
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 sm:p-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3">
                {assessmentInfo.title}
              </h1>
              <p className="text-blue-100 text-base sm:text-lg">{assessmentInfo.description}</p>
            </motion.div>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8 lg:p-10">
            {/* Child Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-8"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Child Information
              </h2>
              {childData ? (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {childData.name?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {childData.name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Age: {childData.age} years • Grade: {childData.grade || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                  <p className="text-yellow-800 dark:text-yellow-200">
                    Loading child information...
                  </p>
                </div>
              )}
            </motion.div>

            {/* Assessment Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-8"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Assessment Features
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {assessmentInfo.features.map((feature, index) => (
                  <motion.div
                    key={feature}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center space-x-3"
                  >
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Duration Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-8"
            >
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-200">Duration</h3>
                    <p className="text-blue-800 dark:text-blue-300">{assessmentInfo.duration}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Start Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="text-center"
            >
              <button
                onClick={handleStartAssessment}
                disabled={isStarting || !childData}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {isStarting ? 'Starting Assessment...' : 'Start Assessment'}
              </button>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {isStarting && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
          <AssessmentLoader
            message="Starting image assessment..."
            stage="Loading assessment content"
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-200 dark:border-gray-700"
          />
        </div>
      )}
    </div>
  );
};

export default MultimediaAssessmentForm;
