import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import AssessmentService from '../../services/AssessmentService';
import QuestionCard from './QuestionCard';
import QuestionStepper from './QuestionStepper';
import TranslatedText from '../ui/TranslatedText';
import { LanguageContext } from '../../contexts/LanguageContext';

// Animated Robot Component for Loading States
const AnimatedRobot = ({ message = 'Thinking...', isVisible = true }) => {
  const robotMessages = [
    '🤖 Analyzing your response...',
    '🧠 Processing your answers...',
    '⚙️ Calculating results...',
    '🔍 Preparing your report...',
    '💭 Almost ready...',
    '🎯 Finalizing assessment...',
  ];

  const [currentMessage, setCurrentMessage] = useState(message);

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setCurrentMessage(robotMessages[Math.floor(Math.random() * robotMessages.length)]);
    }, 2000);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -20 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center py-8"
    >
      {/* Robot Animation */}
      <motion.div
        animate={{
          rotate: [0, -10, 10, -5, 5, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut',
        }}
        className="relative mb-6"
      >
        {/* Robot Body */}
        <div className="relative">
          {/* Main Robot */}
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg flex items-center justify-center relative overflow-hidden">
            {/* Robot Face */}
            <div className="flex flex-col items-center">
              {/* Eyes */}
              <div className="flex gap-2 mb-1">
                <motion.div
                  animate={{ scale: [1, 0.8, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-2 h-2 bg-white rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 0.8, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                  className="w-2 h-2 bg-white rounded-full"
                />
              </div>
              {/* Mouth */}
              <motion.div
                animate={{ width: ['8px', '12px', '8px'] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="h-1 bg-white rounded-full"
              />
            </div>

            {/* Circuit Pattern Overlay */}
            <div className="absolute inset-0 opacity-20">
              <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
                <motion.path
                  d="M4 12h4l2-8 4 16 2-8h4"
                  stroke="white"
                  strokeWidth="1"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </svg>
            </div>
          </div>

          {/* Antenna */}
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute -top-4 left-1/2 transform -translate-x-1/2"
          >
            <div className="w-0.5 h-4 bg-gray-400 rounded-full relative">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-green-400 rounded-full"
              />
            </div>
          </motion.div>
        </div>

        {/* Thinking Dots */}
        <motion.div
          className="absolute -right-8 -top-2 flex gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              animate={{
                y: [0, -4, 0],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              className="w-1.5 h-1.5 bg-blue-400 rounded-full"
            />
          ))}
        </motion.div>
      </motion.div>

      {/* Loading Message */}
      <motion.div
        key={currentMessage}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
          <TranslatedText>{currentMessage}</TranslatedText>
        </p>
        <div className="flex items-center justify-center gap-1">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.15,
              }}
              className="w-2 h-2 bg-blue-500 rounded-full"
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

/**
 * AssessmentQuiz Component
 *
 * Handles the quiz flow of an assessment, including:
 * - Displaying questions
 * - Collecting responses
 * - Submitting answers to get the next question
 * - Tracking progress
 * - Handling completion
 *
 * @param {Object} props Component props
 * @param {string} props.sessionId Assessment session ID
 * @param {Array} props.questions Initial questions for the assessment
 * @param {Function} props.onComplete Callback when assessment completes
 * @param {Function} props.onPause Callback when assessment is paused
 * @param {number} props.childAge Child's age
 * @param {string} props.childName Child's name
 */
const AssessmentQuiz = ({ sessionId, questions, onComplete, onPause, childAge, childName }) => {
  // State management
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [pastQuestions, setPastQuestions] = useState([]);
  const [responses, setResponses] = useState([]);
  const [currentResponse, setCurrentResponse] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [assessmentData, setAssessmentData] = useState(null);
  const [error, setError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [shouldRetry, setShouldRetry] = useState(false);
  const [timeoutError, setTimeoutError] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [summary, setSummary] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [response, setResponse] = useState(null);
  const [sanitizedChildName, setSanitizedChildName] = useState('');
  const [totalQuestions, setTotalQuestions] = useState(15); // Default estimate
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [questionKey, setQuestionKey] = useState(0); // For smooth transitions

  const navigate = useNavigate();
  const { language } = useContext(LanguageContext);

  // Remove all child name sanitization - use the name as provided
  useEffect(() => {
    if (childName) {
      setSanitizedChildName(childName);
    } else {
      setSanitizedChildName('');
    }
  }, [childName]);

  // Initialize with first question
  useEffect(() => {
    if (questions && questions.length > 0 && !currentQuestion) {
      console.log('Setting initial question:', questions[0]);
      setCurrentQuestion(questions[0]); // Use question exactly as received
    }
  }, [questions, currentQuestion]);

  // Try to set current question whenever either questions or sessionId changes
  useEffect(() => {
    if (questions?.length > 0 && !currentQuestion) {
      console.log('Setting current question from updated questions prop:', questions[0]);
      setCurrentQuestion(questions[0]); // Use question exactly as received
    }
  }, [questions, currentQuestion]);

  // Load initial assessment data
  useEffect(() => {
    if (sessionId) {
      loadAssessmentData();
    }
  }, [sessionId]);

  // Retry loading assessment data if initial load failed to get questions
  useEffect(() => {
    if (assessmentData && (!assessmentData.questions || assessmentData.questions.length === 0)) {
      // Wait a bit and retry once
      const retryTimer = setTimeout(() => {
        console.log('No questions found in loaded data, retrying...');
        loadAssessmentData();
      }, 2000);

      return () => clearTimeout(retryTimer);
    }
  }, [assessmentData]);

  // Load assessment data from the server
  const loadAssessmentData = async () => {
    try {
      setError(null);
      console.log('Loading assessment data for session:', sessionId);
      const data = await AssessmentService.getAssessment(sessionId);
      console.log('Assessment data loaded:', data);
      setAssessmentData(data);

      // Clear any retry counter for successful loads
      sessionStorage.removeItem(`retry_${sessionId}`);

      // Check if assessment is completed or should be completed
      const responseCount = data.responses?.length || 0;
      const isCompleted = data.status === 'completed' || responseCount >= 15; // Updated to 15 questions

      console.log(
        `Assessment completion check: responses=${responseCount}, status=${data.status}, isCompleted=${isCompleted}`
      );

      if (isCompleted && data.results) {
        console.log('Assessment is completed with results, navigating to results page...');
        // Navigate to results page
        navigate(`/assessment-complete/${sessionId}`, {
          state: {
            results: {
              ...data.results,
              childName: sanitizedChildName || childName || data.results?.childName || 'Child',
              childAge: childAge,
              assessmentType: data.assessmentType || 'general',
            },
            sessionId: sessionId,
            assessmentComplete: true,
          },
        });
        return;
      } else if (isCompleted && !data.results) {
        console.log('Assessment should be completed but no results found, completing manually...');

        // Try to complete the assessment manually
        try {
          setCurrentQuestion(null);
          setSubmitError('Assessment completed. Generating your report...');
          setIsSubmitting(true);

          // Call the completion endpoint directly
          const completionResponse = await fetch(`/api/assessment/${sessionId}/complete`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          });

          if (completionResponse.ok) {
            const completionData = await completionResponse.json();
            console.log('Manual completion successful:', completionData);

            // Navigate to results with the completion data
            navigate(`/assessment-complete/${sessionId}`, {
              state: {
                results: {
                  ...(completionData.results || completionData.summary),
                  childName:
                    sanitizedChildName ||
                    childName ||
                    completionData.results?.childName ||
                    completionData.summary?.childName ||
                    'Child',
                  childAge: childAge,
                  assessmentType: data.assessmentType || 'general',
                },
                sessionId: sessionId,
                assessmentComplete: true,
              },
            });
            return;
          } else {
            console.error('Manual completion failed with status:', completionResponse.status);
            const errorData = await completionResponse.json().catch(() => ({}));
            console.error('Error details:', errorData);

            // Don't retry on 4xx client errors - these won't resolve themselves
            if (completionResponse.status >= 400 && completionResponse.status < 500) {
              setSubmitError(
                'Assessment completed, but there was an issue with the completion request. Please contact support.'
              );
              setIsSubmitting(false);
            } else {
              // Only retry on server errors (5xx) and limit retries
              const retryCount = parseInt(sessionStorage.getItem(`retry_${sessionId}`) || '0');
              if (retryCount < 2) {
                // Reduced to 2 retries
                sessionStorage.setItem(`retry_${sessionId}`, (retryCount + 1).toString());
                console.log(`Retrying completion (attempt ${retryCount + 1}/2) in 3 seconds...`);
                setTimeout(() => {
                  // Try the completion request again, NOT loadAssessmentData
                  fetch(`/api/assessment/${sessionId}/complete`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                  })
                    .then(retryResponse => {
                      if (retryResponse.ok) {
                        return retryResponse.json().then(retryData => {
                          navigate(`/assessment-complete/${sessionId}`, {
                            state: {
                              results: {
                                ...retryData.results,
                                childName:
                                  sanitizedChildName ||
                                  childName ||
                                  retryData.results?.childName ||
                                  'Child',
                                childAge: childAge,
                                assessmentType: data.assessmentType || 'general',
                              },
                              sessionId: sessionId,
                              assessmentComplete: true,
                            },
                          });
                        });
                      } else {
                        setSubmitError(
                          'Assessment completed, but report generation failed. Please contact support.'
                        );
                        setIsSubmitting(false);
                      }
                    })
                    .catch(retryError => {
                      console.error('Retry failed:', retryError);
                      setSubmitError(
                        'Assessment completed, but report generation failed. Please contact support.'
                      );
                      setIsSubmitting(false);
                    });
                }, 3000);
              } else {
                setSubmitError(
                  'Assessment completed, but there was an issue generating the report. Please contact support.'
                );
                setIsSubmitting(false);
                // Clear retry count
                sessionStorage.removeItem(`retry_${sessionId}`);
              }
            }
          }
        } catch (error) {
          console.error('Error completing assessment manually:', error);
          setSubmitError(
            'Assessment completed, but there was an issue generating the report. Please try refreshing the page.'
          );
          setIsSubmitting(false);
        }
        return;
      }

      // Set total questions estimate - ENHANCED FOR 15-QUESTION ASSESSMENTS
      if (data.progress && data.progress.total) {
        setTotalQuestions(Math.max(data.progress.total, 15)); // Ensure minimum of 15
      } else if (data.questions && data.questions.length > 0) {
        // Use actual question count but ensure minimum of 15 for comprehensive assessment
        setTotalQuestions(Math.max(data.questions.length, 15));
      } else if (data.estimatedQuestions) {
        setTotalQuestions(Math.max(data.estimatedQuestions, 15)); // Ensure minimum of 15
      } else {
        setTotalQuestions(15); // Default to 15 questions for comprehensive assessment
      }

      // If we have responses, set up the state accordingly
      if (data.responses && data.responses.length > 0) {
        setResponses(data.responses);
        setPastQuestions(data.questions?.slice(0, data.responses.length) || []);

        // Set current question to the next unanswered one
        if (data.questions?.length > data.responses.length) {
          const nextQuestion = data.questions[data.responses.length];
          setCurrentQuestion(nextQuestion);
        }
      } else if (data.questions && data.questions.length > 0) {
        // Use the questions from the loaded data
        console.log('Setting current question from API data:', data.questions[0]);
        setCurrentQuestion(data.questions[0]);
      } else if (questions && questions.length > 0) {
        // Use the initial questions passed as props
        console.log('Setting current question from props:', questions[0]);
        setCurrentQuestion(questions[0]);
      } else {
        console.warn('No questions available from API or props');
        if (data.isLimitedAccess) {
          console.warn('Limited access data received - questions may be missing');
        }
      }

      // Set progress - calculate based on responses vs total questions
      const answeredQuestions = data.responses?.length || 0;
      const totalQs = data.questions?.length || totalQuestions;
      const calculatedProgress = totalQs > 0 ? Math.round((answeredQuestions / totalQs) * 100) : 0;
      setProgress(calculatedProgress);
    } catch (error) {
      setError('Error loading assessment data. Please try again.');
      toast.error('Error loading assessment data');
      console.error('Error loading assessment:', error);
    }
  };

  const handleResponseChange = newResponse => {
    setCurrentResponse(newResponse);
    setSelectedOption(newResponse);
    setResponse(newResponse);
    setSubmitError(null);
  };

  // Submit answer handler with enhanced loading state
  const handleSubmitAnswer = async () => {
    if (!currentQuestion || isSubmitting) return;

    if (!currentResponse) {
      setSubmitError('Please provide an answer before continuing');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const formData = {
      sessionId,
      questionId: currentQuestion.id,
      response: currentResponse,
    };

    console.log('Submitting answer: ', formData);

    try {
      const result = await AssessmentService.submitAnswer(
        sessionId,
        currentQuestion.id,
        currentResponse
      );

      // Update responses array
      setResponses(prev => [
        ...prev,
        { questionId: currentQuestion.id, response: currentResponse },
      ]);

      // Calculate progress based on actual responses
      const newAnsweredCount = responses.length + 1;
      const calculatedProgress = Math.round((newAnsweredCount / totalQuestions) * 100);
      setProgress(calculatedProgress);

      if (result.isComplete) {
        // Store the completion in localStorage for dashboard refresh
        localStorage.setItem('latestCompletedAssessment', sessionId);

        console.log('Assessment completed! Result structure:', result);
        console.log('Summary data:', result.summary);
        console.log('Results data:', result.results);

        // The backend returns structured results in the 'results' field (not 'summary')
        // Navigate directly to results page with the correct data structure
        toast.success('Assessment completed successfully!');

        // Debug child name values before navigation
        console.log('🔍 Pre-navigation child name debug:');
        console.log('sanitizedChildName:', sanitizedChildName);
        console.log('childName:', childName);
        console.log('result.results?.childName:', result.results?.childName);
        console.log('result.summary?.childName:', result.summary?.childName);

        const finalChildName =
          sanitizedChildName ||
          childName ||
          result.results?.childName ||
          result.summary?.childName ||
          'Child';
        console.log('Final child name for navigation:', finalChildName);

        // Pass the results in the expected format
        navigate(`/assessment-complete/${sessionId}`, {
          state: {
            results: {
              ...(result.results || result.summary), // Backend sends results in 'results' field
              childName: finalChildName,
              childAge: childAge,
              assessmentType: assessmentData?.assessmentType || 'general',
            },
            sessionId: sessionId,
            assessmentComplete: true,
          },
        });
        return;
      }

      if (result.nextQuestion) {
        // Add a small delay for better UX and then transition to next question
        setTimeout(() => {
          setCurrentQuestion(result.nextQuestion);
          setQuestionKey(prev => prev + 1); // Trigger transition
          setSelectedOption(null);
          setResponse(null);
          setCurrentResponse(null);
          setIsSubmitting(false);
        }, 1500); // 1.5 second delay to show robot animation
      } else {
        // Handle case where no next question is returned but assessment isn't complete
        setSubmitError('No additional questions available. Please refresh the page.');
        setIsSubmitting(false);
      }
    } catch (error) {
      setIsSubmitting(false);
      setSubmitError(error.message || 'Failed to submit answer. Please try again.');
      console.error('Error submitting answer:', error);
    }
  };

  // Handle retry on error
  const handleRetry = async () => {
    setShouldRetry(false);
    setTimeoutError(false);
    setError(null);
    setSubmitError(null);

    try {
      await loadAssessmentData();
    } catch (error) {
      setError('Failed to reload assessment data. Please refresh the page.');
      console.error('Error on retry:', error);
    }
  };

  // Handle pausing the assessment with confirmation
  const handlePause = async () => {
    try {
      console.log('Pausing assessment:', sessionId);
      await AssessmentService.pauseAssessment(sessionId);

      // Navigate to paused page with proper sessionId in URL
      navigate(`/assessment/paused?sessionId=${sessionId}`, {
        state: {
          assessmentType: assessmentData?.assessmentType || 'general',
          childInfo: {
            name: sanitizedChildName,
            age: childAge,
            id: assessmentData?.childId,
          },
          answers: responses,
          currentQuestion: responses.length,
          duration: 0,
          sessionId,
        },
      });
    } catch (error) {
      toast.error('Error pausing assessment');
      console.error('Error pausing assessment:', error);
    }
  };

  // Handle exit with confirmation
  const handleExitConfirm = () => {
    setShowExitConfirm(true);
  };

  const handleConfirmExit = async () => {
    try {
      await AssessmentService.pauseAssessment(sessionId);
      toast.success('Assessment discarded');
      navigate('/assessments');
    } catch (error) {
      console.error('Error discarding assessment:', error);
      toast.error('Error discarding assessment');
      navigate('/assessments');
    }
  };

  // Render enhanced help overlay
  const renderHelpOverlay = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative"
      >
        {/* Close button */}
        <button
          onClick={() => setShowHelp(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Header with icon */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Need Help? 🤔</h3>
            <p className="text-gray-600 dark:text-gray-400">We're here to guide you</p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4 mb-8">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
            <p className="text-gray-800 dark:text-gray-200">
              This question helps us understand how <strong>{sanitizedChildName}</strong> handles{' '}
              <em>{currentQuestion?.skill?.toLowerCase() || 'this developmental area'}</em>.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span>💡</span> Consider these examples:
            </h4>
            <div className="grid gap-2">
              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <span className="text-2xl">😊</span>
                <span className="text-gray-700 dark:text-gray-300">
                  If they always exhibit this behavior, select "Very Often"
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <span className="text-2xl">🤷</span>
                <span className="text-gray-700 dark:text-gray-300">
                  If they rarely show this behavior, select "Rarely"
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <span>🎯</span>
              Remember, there are no right or wrong answers. Your honest observations help us
              provide better insights for {sanitizedChildName}.
            </p>
          </div>
        </div>

        {/* Contact info */}
        <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span>📧</span>
              <span>Need more help? Contact us at</span>
              <a
                href="mailto:support@cognikidz.com"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                support@cognikidz.com
              </a>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Got It! 👍
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );

  // Enhanced completion screen component
  const CompletionScreen = ({ summary }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="max-w-4xl mx-auto"
    >
      {/* Celebration Animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="text-center mb-8"
      >
        {/* Confetti Animation */}
        <div className="relative">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                background: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'][i % 5],
                left: `${50 + (Math.random() - 0.5) * 600}px`,
                top: `${100 + (Math.random() - 0.5) * 200}px`,
              }}
              animate={{
                y: [0, -100, 400],
                rotate: [0, 360],
                opacity: [1, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 3,
                delay: i * 0.1,
                ease: 'easeOut',
              }}
            />
          ))}

          {/* Trophy Animation */}
          <motion.div
            animate={{
              y: [0, -10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="text-8xl sm:text-9xl mb-4"
          >
            🏆
          </motion.div>
        </div>
      </motion.div>

      {/* Main completion card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="bg-gradient-to-br from-white via-blue-50 to-purple-50 dark:from-gray-800 dark:via-blue-900/20 dark:to-purple-900/20 backdrop-blur-xl rounded-3xl p-8 sm:p-12 shadow-2xl border border-white/20 dark:border-gray-700/50 relative overflow-hidden"
      >
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-3xl" />

        <div className="relative z-10 text-center">
          {/* Success icon with animation */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
            className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg shadow-green-500/25"
          >
            <motion.svg
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="h-12 w-12 text-white"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </motion.svg>
          </motion.div>

          {/* Title and description */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4"
          >
            <TranslatedText>🎉 Assessment Completed!</TranslatedText>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto"
          >
            <TranslatedText>
              Excellent work! Your responses have been carefully analyzed. We're now generating your
              personalized assessment report with detailed insights and recommendations.
            </TranslatedText>
          </motion.p>

          {/* Progress section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="mb-8"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full"
              />
              <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
                <TranslatedText>Generating your detailed report...</TranslatedText>
              </span>
            </div>

            {/* Animated progress bar */}
            <div className="w-full max-w-md mx-auto bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 3, ease: 'easeInOut' }}
              />
            </div>
          </motion.div>

          {/* Steps being processed */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
          >
            {[
              { icon: '🧠', text: 'Analyzing responses', delay: 0 },
              { icon: '📊', text: 'Calculating scores', delay: 0.5 },
              { icon: '📝', text: 'Preparing report', delay: 1 },
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.6 + step.delay }}
                className="bg-white/60 dark:bg-gray-800/60 rounded-2xl p-4 border border-gray-200/50 dark:border-gray-600/50 backdrop-blur-sm"
              >
                <div className="text-2xl mb-2">{step.icon}</div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  <TranslatedText>{step.text}</TranslatedText>
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* Estimated time */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="text-sm text-gray-500 dark:text-gray-400"
          >
            This usually takes just a few moments. Thank you for your patience!
          </motion.p>
        </div>
      </motion.div>
    </motion.div>
  );

  // Enhanced error display with better UX
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto"
      >
        <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-700/50 rounded-3xl p-8 shadow-xl backdrop-blur-sm">
          <div className="text-center">
            {/* Error icon with animation */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <svg
                className="w-8 h-8 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </motion.div>

            <h3 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-4">
              <TranslatedText>Oops! Something went wrong</TranslatedText>
            </h3>
            <p className="text-red-600 dark:text-red-300 mb-6 text-lg leading-relaxed">{error}</p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>Try Again</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.history.back()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                <span>Go Back</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Enhanced loading state with better user experience
  if (!currentQuestion) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center min-h-[500px] max-w-4xl mx-auto px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <AnimatedRobot message="🔍 Loading your personalized questions..." />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-center mt-8 max-w-lg"
        >
          {questions && questions.length > 0 ? (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-2xl p-6">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-yellow-600 dark:text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <p className="text-yellow-800 dark:text-yellow-200 font-medium mb-2">
                Questions Loaded Successfully
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Questions are loaded but not displaying. Please try refreshing the page if this
                persists.
              </p>
            </div>
          ) : (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-2xl p-6">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <svg
                  className="w-6 h-6 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </motion.div>
              <p className="text-blue-800 dark:text-blue-200 font-medium mb-2">
                Preparing Your Assessment
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {language === 'hi'
                  ? 'हम आपकी प्रोफ़ाइल के आधार पर प्रश्नों को अनुकूलित कर रहे हैं। यह हमें सबसे सटीक आकलन प्रदान करने में मदद करता है।'
                  : "We're customizing questions based on your profile. This helps us provide the most accurate assessment possible."}
              </p>
            </div>
          )}
        </motion.div>

        {/* Helpful tips while loading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl"
        >
          {[
            {
              icon: '💡',
              title: 'Honest Responses',
              text:
                language === 'hi'
                  ? 'सबसे सटीक परिणामों के लिए प्रश्नों का ईमानदारी से जवाब दें'
                  : 'Answer questions honestly for the most accurate results',
            },
            {
              icon: '⏱️',
              title: 'Take Your Time',
              text:
                language === 'hi'
                  ? 'कोई जल्दबाजी नहीं - हर प्रश्न के बारे में सावधानी से सोचें'
                  : "There's no rush - think carefully about each question",
            },
          ].map((tip, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2 + index * 0.2 }}
              className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-4 border border-gray-200/50 dark:border-gray-600/50 backdrop-blur-sm"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{tip.icon}</span>
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                    {tip.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{tip.text}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    );
  }

  return (
    <>
      <AnimatePresence>{showHelp && renderHelpOverlay()}</AnimatePresence>

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Discard Assessment?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {language === 'hi'
                  ? 'क्या आप वाकई बाहर निकलना चाहते हैं? सभी प्रगति खो जाएगी और पुनर्प्राप्त नहीं की जा सकती।'
                  : 'Are you sure you want to exit? All progress will be lost and cannot be recovered.'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmExit}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Yes, Discard
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {isComplete ? (
          <CompletionScreen summary={summary} />
        ) : (
          <motion.div
            key={`question-${questionKey}`}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, scale: 0.95 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="mx-auto max-w-4xl w-full px-4 sm:px-6 h-full flex flex-col justify-between"
          >
            {/* Progress indicator */}
            <div className="mb-6">
              <QuestionStepper
                currentStep={responses.length + 1}
                totalSteps={totalQuestions}
                progress={progress}
                onNext={handleSubmitAnswer}
                isNextDisabled={!currentResponse || isSubmitting}
                isSubmitting={isSubmitting}
              />
            </div>

            {/* Show robot when submitting */}
            <AnimatePresence>
              {isSubmitting && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-40 flex items-center justify-center"
                >
                  <AnimatedRobot isVisible={true} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Question card */}
            <QuestionCard
              question={currentQuestion}
              response={currentResponse}
              onResponseChange={handleResponseChange}
              onHelp={() => setShowHelp(true)}
              childName={sanitizedChildName}
              childAge={childAge}
            />

            {/* Enhanced action button section with better responsiveness */}
            <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4 relative z-10 fullscreen-buttons mt-auto pt-8">
              <div className="flex flex-wrap gap-2 sm:gap-3 justify-center sm:justify-start">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePause}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-600 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl backdrop-blur-sm z-20"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <span className="hidden sm:inline">Save & Exit</span>
                  <span className="sm:hidden">Save</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleExitConfirm}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-600 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl backdrop-blur-sm z-20"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span className="hidden sm:inline">Discard & Exit</span>
                  <span className="sm:hidden">Exit</span>
                </motion.button>
              </div>

              <motion.button
                onClick={handleSubmitAnswer}
                disabled={!currentResponse || isSubmitting}
                whileHover={!isSubmitting && currentResponse ? { scale: 1.05, y: -3 } : {}}
                whileTap={!isSubmitting && currentResponse ? { scale: 0.98 } : {}}
                className={`relative overflow-hidden px-6 sm:px-8 py-3 sm:py-4 rounded-2xl flex items-center gap-3 font-semibold text-sm sm:text-base transition-all duration-300 shadow-xl hover:shadow-2xl disabled:hover:shadow-xl z-20 ${
                  !currentResponse || isSubmitting
                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-60'
                    : 'bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 text-white hover:from-blue-600 hover:via-purple-700 hover:to-pink-600 shadow-blue-500/25 hover:shadow-blue-500/40'
                }`}
              >
                {/* Animated background gradient */}
                {currentResponse && !isSubmitting && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-2xl"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    style={{
                      background:
                        'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    }}
                  />
                )}

                {/* Button content */}
                <div className="relative z-10 flex items-center gap-3">
                  {isSubmitting ? (
                    <>
                      <motion.div
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      <span className="hidden sm:inline">Processing Answer...</span>
                      <span className="sm:hidden">Processing...</span>
                    </>
                  ) : currentResponse ? (
                    <>
                      <span>Continue</span>
                      <motion.svg
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </motion.svg>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                      <span className="hidden sm:inline">Select an answer</span>
                      <span className="sm:hidden">Select answer</span>
                    </>
                  )}
                </div>

                {/* Pulse effect when enabled */}
                {currentResponse && !isSubmitting && (
                  <motion.div
                    className="absolute inset-0 bg-white/20 rounded-2xl"
                    animate={{
                      scale: [1, 1.05, 1],
                      opacity: [0, 0.3, 0],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </motion.button>
            </div>

            {/* Error message */}
            <AnimatePresence>
              {submitError && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                >
                  <p className="text-red-600 dark:text-red-400 text-sm">{submitError}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AssessmentQuiz;
