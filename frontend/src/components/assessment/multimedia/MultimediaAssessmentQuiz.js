import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../../contexts/ToastContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { AssessmentLoader, ReportLoader } from '../../ui/LogoLoader';
import ImageAssessmentService from '../../../services/ImageAssessmentService';
import AssessmentConsentPage from './AssessmentConsentPage';

/**
 * ImageAssessmentQuiz Component
 *
 * Handles image-based assessment questions for:
 * - Autism: Social interaction and behavior assessment
 * - ADHD: Attention and organization assessment
 * - Dyslexia: Text processing and visual preference assessment
 */
const QuestionStepper = ({
  currentStep,
  totalSteps,
  progress,
  onNext,
  isNextDisabled,
  isSubmitting,
}) => {
  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Progress Text */}
      <div className="flex justify-between items-center mt-2">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Question {currentStep} of {totalSteps}
        </span>
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
};

const MultimediaAssessmentQuiz = ({
  sessionId,
  assessmentType,
  onComplete,
  childAge,
  childName,
  childData,
}) => {
  const { theme } = useTheme();
  const { info, error, success } = useToast();
  const [showConsent, setShowConsent] = useState(true);
  const [currentImageSet, setCurrentImageSet] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [responses, setResponses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [assessmentSession, setAssessmentSession] = useState(null);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [exitType, setExitType] = useState(null); // 'save' or 'discard'
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Handle consent completion
  const handleConsentGiven = () => {
    setShowConsent(false);
    startAssessmentSession();
  };

  // Handle consent cancellation
  const handleConsentCancel = () => {
    if (onComplete) {
      onComplete({ cancelled: true, reason: 'User cancelled consent' });
    }
  };

  // Handle exit assessment
  const handleExitAssessment = () => {
    setShowExitConfirm(true);
  };

  const confirmExitAssessment = () => {
    if (onComplete) {
      if (exitType === 'save' && responses.length > 0) {
        // Save progress and exit
        onComplete({
          cancelled: true,
          reason: 'User saved and exited assessment',
          responses: responses,
          questionsCompleted: responses.length,
          totalQuestions: totalQuestions,
          saveProgress: true,
        });
      } else {
        // Discard and exit
        onComplete({
          cancelled: true,
          reason: 'User discarded and exited assessment',
          responses: [],
          questionsCompleted: 0,
          totalQuestions: totalQuestions,
          saveProgress: false,
        });
      }
    }
  };

  const cancelExitAssessment = () => {
    setShowExitConfirm(false);
    setExitType(null);
  };

  // Start the actual assessment session
  const startAssessmentSession = async () => {
    try {
      setIsLoading(true);

      // Convert multimedia assessment types to backend format
      const backendAssessmentType = assessmentType.replace('-multimedia', '');

      // Get childId from props or navigation state
      // The childData should contain the actual MongoDB ObjectId
      const childId = childData?._id || childData?.id || null;

      // Validate that we have a valid childId
      if (!childId) {
        throw new Error(
          'Child ID is required to start the assessment. Please select a child first.'
        );
      }

      console.log('Starting assessment with:', {
        sessionId,
        childId,
        childName,
        childAge,
        assessmentType: backendAssessmentType,
      });

      const sessionData = await ImageAssessmentService.startAssessment({
        assessmentType: backendAssessmentType,
        totalQuestions: 10,
        childId,
        childAge,
        metadata: {
          userAgent: navigator.userAgent,
          deviceType: window.innerWidth < 768 ? 'mobile' : 'desktop',
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          childName: childName || 'Child',
          childAge: childAge || null,
        },
      });

      setAssessmentSession(sessionData);
      // Backend returns imageSets array, we need the first one as imageSet
      // Transform data structure to match what ImageComparisonQuestion expects
      console.log('🔍 Raw sessionData.imageSets[0]:', sessionData.imageSets[0]);

      const firstImageSet =
        sessionData.imageSets && sessionData.imageSets[0]
          ? {
              setId: sessionData.imageSets[0].setId, // Explicitly preserve setId
              assessmentArea: sessionData.imageSets[0].assessmentArea,
              difficulty: sessionData.imageSets[0].difficulty,
              descriptions: sessionData.imageSets[0].descriptions,
              images: {
                positive: sessionData.imageSets[0].positive,
                negative: sessionData.imageSets[0].negative,
              },
            }
          : null;

      console.log('🔍 Transformed firstImageSet:', firstImageSet);
      setCurrentImageSet(firstImageSet);
      setCurrentQuestion(1); // Start with question 1
      setTotalQuestions(sessionData.totalQuestions);
      setStartTime(Date.now());
      setProgress(0); // Start with 0% progress

      info(`Started ${assessmentType} assessment`);
    } catch (err) {
      console.error('Error starting assessment:', err);
      const msg = (err && err.message) || '';
      if (msg.toLowerCase().includes('payment') || msg.toLowerCase().includes('402')) {
        error('Purchase required to start this assessment');
        // Redirect user to pricing immediately
        window.location.href = '/pricing';
      } else {
        error('Failed to start assessment. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResponse = async (selectedImage, responseTime) => {
    if (!currentImageSet || isLoadingNext) return;

    setIsLoadingNext(true);
    // Get setId with improved fallback logic
    let setId = currentImageSet?.setId;

    // If setId is not available from currentImageSet, try multiple fallback strategies
    if (!setId && assessmentSession?.imageSets) {
      // Strategy 1: Use current question index (0-based for arrays)
      const currentIndex = currentQuestion - 1;
      if (assessmentSession.imageSets[currentIndex]) {
        setId = assessmentSession.imageSets[currentIndex];
        console.log(`🔍 Using setId from imageSets[${currentIndex}]:`, setId);
      }

      // Strategy 2: Use responses length as index (more accurate for current state)
      if (!setId && assessmentSession.imageSets[responses.length]) {
        setId = assessmentSession.imageSets[responses.length];
        console.log(
          `🔍 Using setId from imageSets[${responses.length}] (responses.length):`,
          setId
        );
      }
    }

    // Validate setId before creating response
    if (!setId) {
      console.error('❌ Unable to determine setId for response', {
        currentImageSet,
        assessmentSession: assessmentSession?.imageSets,
        currentQuestion,
        responses: responses.length,
      });
      error('Unable to determine which question to submit. Please restart the assessment.');
      setIsLoadingNext(false);
      return;
    }

    const responseData = {
      setId: setId,
      selectedImage,
      responseTime,
    };

    // Debug logging for setId resolution
    console.log('🔍 SetId Resolution:', {
      fromCurrentImageSet: currentImageSet?.setId,
      fromSessionImageSets: assessmentSession?.imageSets,
      currentQuestionIndex: currentQuestion - 1,
      responsesLength: responses.length,
      finalSetId: setId,
      currentQuestion: currentQuestion,
    });

    // Debug logging
    console.log('🎯 User Response:', {
      questionNumber: currentQuestion,
      setId: currentImageSet.setId,
      selectedImage,
      responseTime,
      assessmentArea: currentImageSet.assessmentArea,
      difficulty: currentImageSet.difficulty,
    });

    // Additional debug: verify currentImageSet structure
    console.log('🔍 Current ImageSet structure:', {
      hasSetId: !!currentImageSet.setId,
      setIdValue: currentImageSet.setId,
      hasImages: !!currentImageSet.images,
      imageKeys: currentImageSet.images ? Object.keys(currentImageSet.images) : 'no images',
      fullStructure: currentImageSet,
    });

    try {
      // Submit response to backend
      const response = await ImageAssessmentService.submitResponse(
        assessmentSession.sessionId,
        responseData
      );

      // Debug backend response
      console.log('🔄 Backend Response:', {
        completed: response.completed,
        currentQuestion: response.currentQuestion,
        questionsCompleted: response.questionsCompleted,
        hasResults: !!response.results,
        hasNextImageSet: !!response.imageSet,
      });

      if (response.results) {
        console.log('📊 Final Results:', response.results);
      }

      // Add to local responses
      const newResponse = {
        ...responseData,
        assessmentArea: currentImageSet.assessmentArea,
        difficulty: currentImageSet.difficulty,
        timestamp: new Date().toISOString(),
      };

      const updatedResponses = [...responses, newResponse];
      setResponses(updatedResponses);

      // Debug local state
      console.log('📝 Local Responses Update:', {
        totalResponses: updatedResponses.length,
        currentQuestionCount: currentQuestion,
        totalQuestions,
        newResponse: {
          selectedImage: newResponse.selectedImage,
          assessmentArea: newResponse.assessmentArea,
        },
        allResponses: updatedResponses.map(r => ({
          setId: r.setId,
          selectedImage: r.selectedImage,
          assessmentArea: r.assessmentArea,
        })),
      });

      // Check if assessment is complete
      if (response.completed) {
        // Assessment completed
        setIsLoadingNext(false);
        success(
          `Assessment completed! Answered ${response.questionsCompleted || updatedResponses.length} questions.`
        );

        // Trigger completion with results
        if (onComplete) {
          onComplete({
            completed: true,
            responses: updatedResponses,
            results: response.results,
            sessionId: response.sessionId,
            totalQuestions,
            questionsCompleted: response.questionsCompleted || updatedResponses.length,
            assessmentType,
            childName,
            childAge,
            duration: Date.now() - startTime,
          });
        }
        return;
      }

      // Continue to next question
      if (response.nextImageSet) {
        // Transform data structure to match what ImageComparisonQuestion expects
        const transformedImageSet = {
          setId: response.nextImageSet.setId, // Explicitly preserve setId
          assessmentArea: response.nextImageSet.assessmentArea,
          difficulty: response.nextImageSet.difficulty,
          descriptions: response.nextImageSet.descriptions,
          images: {
            positive: response.nextImageSet.positive,
            negative: response.nextImageSet.negative,
          },
        };
        setCurrentImageSet(transformedImageSet);
        setCurrentQuestion(response.currentQuestion); // Backend now returns 1-based count
        setProgress((response.currentQuestion / totalQuestions) * 100);

        info(`Question ${response.currentQuestion} of ${totalQuestions}`);
      } else {
        // No more questions available - complete assessment
        setIsLoadingNext(false);
        success(`Assessment completed! Answered ${updatedResponses.length} questions.`);

        if (onComplete) {
          onComplete({
            completed: true,
            responses: updatedResponses,
            sessionId: assessmentSession.sessionId,
            totalQuestions,
            questionsCompleted: updatedResponses.length,
            assessmentType,
            childName,
            childAge,
            duration: Date.now() - startTime,
          });
        }
      }
    } catch (err) {
      console.error('Error submitting response:', err);
      error('Failed to submit response. Please try again.');
    } finally {
      setIsLoadingNext(false);
    }
  };

  // Fix progress calculation: use responses.length for accurate progress tracking
  const progressPercentage = Math.min((responses.length / totalQuestions) * 100, 100);

  // Show consent page first
  if (showConsent) {
    return (
      <AssessmentConsentPage
        assessmentType={assessmentType}
        childName={childName}
        onConsent={handleConsentGiven}
        onCancel={handleConsentCancel}
      />
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
          <AssessmentLoader message="Loading assessment..." stage="Preparing questions" />
        </div>
      </div>
    );
  }

  // Show error state
  if (!currentImageSet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 text-xl mb-4">Assessment Error</div>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Unable to load assessment questions
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Reload Assessment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
      {/* Enhanced Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 h-3 relative overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-r-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
      </div>

      {/* Redesigned Header */}
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Left Section - Assessment Info */}
            <div className="flex items-center space-x-4">
              {/* Assessment Icon */}
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>

              {/* Assessment Details */}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                  {assessmentType.charAt(0).toUpperCase() + assessmentType.slice(1)} Assessment
                </h1>
                <div className="flex items-center space-x-4 mt-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Question {currentQuestion} of {totalQuestions}
                  </p>
                  {childName && (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{childName}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Section - Progress & Controls */}
            <div className="flex items-center space-x-4">
              {/* Progress Display */}
              <div className="hidden sm:flex flex-col items-end space-y-1">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round(progressPercentage)}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Complete</div>
              </div>

              {/* Mobile Progress */}
              <div className="sm:hidden flex items-center space-x-2">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {Math.round(progressPercentage)}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Complete</div>
              </div>

              {/* Exit Controls */}
              <div className="flex items-center space-x-2">
                {responses.length > 0 && (
                  <button
                    onClick={() => {
                      setExitType('save');
                      setShowExitConfirm(true);
                    }}
                    className="inline-flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
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
                  </button>
                )}

                <button
                  onClick={() => {
                    setExitType('discard');
                    setShowExitConfirm(true);
                  }}
                  className="inline-flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  <span className="hidden sm:inline">Discard & Exit</span>
                  <span className="sm:hidden">Exit</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-6xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImageSet?.setId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ImageComparisonQuestion
                imageSet={currentImageSet}
                onResponse={handleResponse}
                isLoadingNext={isLoadingNext}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Enhanced Footer */}
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Click on the image that {childName} prefers or finds more interesting
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              There's no right or wrong answer - go with your first instinct
            </p>
          </div>
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-gray-200 dark:border-gray-700"
          >
            <div className="text-center">
              <div
                className={`text-5xl mb-4 ${exitType === 'save' ? 'text-green-500' : 'text-yellow-500'}`}
              >
                {exitType === 'save' ? '💾' : '⚠️'}
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {exitType === 'save' ? 'Save and Exit Assessment?' : 'Discard and Exit Assessment?'}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                {exitType === 'save' ? (
                  <>
                    Your progress will be saved and you can resume later.
                    {responses.length > 0 && (
                      <span className="block mt-2 text-sm text-gray-600 dark:text-gray-400">
                        You've completed {responses.length} out of {totalQuestions} questions.
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    All progress will be lost and cannot be recovered.
                    {responses.length > 0 && (
                      <span className="block mt-2 text-sm text-gray-600 dark:text-gray-400">
                        You've completed {responses.length} out of {totalQuestions} questions.
                      </span>
                    )}
                  </>
                )}
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={cancelExitAssessment}
                  className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-3 rounded-lg transition-colors"
                >
                  Continue Assessment
                </button>
                <button
                  onClick={confirmExitAssessment}
                  className={`flex-1 ${exitType === 'save' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white px-4 py-3 rounded-lg transition-colors`}
                >
                  {exitType === 'save' ? 'Save & Exit' : 'Discard & Exit'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const ImageComparisonQuestion = ({ imageSet, onResponse, isLoadingNext }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [positiveImageLoaded, setPositiveImageLoaded] = useState(false);
  const [negativeImageLoaded, setNegativeImageLoaded] = useState(false);
  const [positiveImageError, setPositiveImageError] = useState(false);
  const [negativeImageError, setNegativeImageError] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  // Reset loading states when imageSet changes
  useEffect(() => {
    setPositiveImageLoaded(false);
    setNegativeImageLoaded(false);
    setPositiveImageError(false);
    setNegativeImageError(false);
    setSelectedImage(null);
    setQuestionStartTime(Date.now());
  }, [imageSet.setId]);

  const bothImagesReady =
    positiveImageLoaded && negativeImageLoaded && !positiveImageError && !negativeImageError;

  const handleImageSelect = imageType => {
    if (!bothImagesReady || selectedImage || isLoadingNext) return;

    setSelectedImage(imageType);
    setIsTransitioning(true);

    // Add delay before moving to next question
    setTimeout(() => {
      onResponse(imageType, Date.now() - questionStartTime);
      setSelectedImage(null); // Reset selection
      setIsTransitioning(false);
    }, 1000);
  };

  const handleFullScreen = (imageUrl, imageType) => {
    if (!bothImagesReady) return;
    setFullScreenImage({ url: imageUrl, type: imageType });
    setIsFullScreen(true);
  };

  const closeFullScreen = () => {
    setIsFullScreen(false);
    setFullScreenImage(null);
  };

  const handlePositiveImageLoad = () => {
    setPositiveImageLoaded(true);
    setPositiveImageError(false);
  };

  const handleNegativeImageLoad = () => {
    setNegativeImageLoaded(true);
    setNegativeImageError(false);
  };

  const handlePositiveImageError = () => {
    setPositiveImageError(true);
    console.error('Failed to load positive image:', imageSet.images.positive);
  };

  const handleNegativeImageError = () => {
    setNegativeImageError(true);
    console.error('Failed to load negative image:', imageSet.images.negative);
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      {/* Question Header */}
      <div className="text-center mb-4 sm:mb-6 px-4 flex-shrink-0">
        <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-4">
          Which image do you prefer?
        </h3>
        <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-300">
          {bothImagesReady
            ? 'Look at both images and choose the one you like better'
            : 'Loading images, please wait...'}
        </p>
        {!bothImagesReady && (
          <div className="mt-3 sm:mt-4">
            <div className="inline-flex items-center text-blue-400 text-sm sm:text-base">
              <svg
                className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Preparing images...
            </div>
          </div>
        )}
      </div>

      {/* Images Grid - Responsive Design */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 px-4 sm:px-6 lg:px-8 min-h-0 pb-4">
        {/* Positive Image */}
        <div
          className={`relative rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-300 bg-gradient-to-br from-blue-100/50 to-purple-100/50 dark:from-blue-900/20 dark:to-purple-900/20 backdrop-blur-sm border border-gray-300/50 dark:border-gray-600/50 ${
            selectedImage === 'positive'
              ? 'ring-4 ring-blue-500 scale-[1.02] shadow-2xl shadow-blue-500/50 border-blue-500/50'
              : bothImagesReady
                ? 'hover:scale-[1.01] hover:shadow-xl hover:border-blue-400/50 hover:ring-2 hover:ring-blue-400/30'
                : ''
          } ${isLoadingNext || !bothImagesReady ? 'pointer-events-none opacity-50' : ''} ${bothImagesReady ? 'cursor-pointer' : ''} aspect-[3/2] sm:aspect-[4/3] lg:aspect-[5/4] max-h-[300px] sm:max-h-[350px] lg:max-h-[450px]`}
        >
          <div className="h-full" onClick={() => handleImageSelect('positive')}>
            {/* Image Container */}
            <div className="relative w-full h-full">
              <img
                src={imageSet.images.positive}
                alt="Option A"
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  positiveImageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={handlePositiveImageLoad}
                onError={handlePositiveImageError}
              />

              {/* Loading Spinner for Positive Image */}
              {!positiveImageLoaded && !positiveImageError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                  <div className="text-center text-gray-700 dark:text-white">
                    <svg
                      className="animate-spin h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-blue-500 mx-auto mb-2 sm:mb-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                      Loading Option A...
                    </p>
                  </div>
                </div>
              )}

              {/* Error State for Positive Image */}
              {positiveImageError && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-100/50 dark:bg-red-900/20">
                  <div className="text-center text-red-700 dark:text-white">
                    <div className="text-red-500 dark:text-red-400 text-2xl sm:text-3xl lg:text-4xl mb-2">
                      ⚠️
                    </div>
                    <p className="text-xs sm:text-sm text-red-600 dark:text-red-300">
                      Failed to load image
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Image Label */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-3 sm:p-4 lg:p-6">
              <p className="text-lg sm:text-xl lg:text-2xl font-bold mb-1 sm:mb-2">Option A</p>
              <p className="text-sm sm:text-base lg:text-lg opacity-90">
                {bothImagesReady ? 'Click to select this option' : 'Loading...'}
              </p>
            </div>
          </div>

          {/* Full Screen Button */}
          {bothImagesReady && (
            <button
              onClick={e => {
                e.stopPropagation();
                handleFullScreen(imageSet.images.positive, 'positive');
              }}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 lg:top-6 lg:right-6 bg-black/60 hover:bg-black/80 text-white p-2 sm:p-2.5 lg:p-3 rounded-full transition-all backdrop-blur-sm"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
            </button>
          )}

          {selectedImage === 'positive' && (
            <>
              <div className="absolute inset-0 bg-blue-500/30 backdrop-blur-md"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 sm:px-6 sm:py-3 lg:px-8 lg:py-4 rounded-xl sm:rounded-2xl shadow-2xl text-base sm:text-lg lg:text-xl font-bold">
                  Selected ✓
                </div>
              </div>
            </>
          )}
        </div>

        {/* Negative Image */}
        <div
          className={`relative rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-300 bg-gradient-to-br from-purple-100/50 to-pink-100/50 dark:from-purple-900/20 dark:to-pink-900/20 backdrop-blur-sm border border-gray-300/50 dark:border-gray-600/50 ${
            selectedImage === 'negative'
              ? 'ring-4 ring-purple-500 scale-[1.02] shadow-2xl shadow-purple-500/50 border-purple-500/50'
              : bothImagesReady
                ? 'hover:scale-[1.01] hover:shadow-xl hover:border-purple-400/50 hover:ring-2 hover:ring-purple-400/30'
                : ''
          } ${isLoadingNext || !bothImagesReady ? 'pointer-events-none opacity-50' : ''} ${bothImagesReady ? 'cursor-pointer' : ''} aspect-[3/2] sm:aspect-[4/3] lg:aspect-[5/4] max-h-[300px] sm:max-h-[350px] lg:max-h-[450px]`}
        >
          <div className="h-full" onClick={() => handleImageSelect('negative')}>
            {/* Image Container */}
            <div className="relative w-full h-full">
              <img
                src={imageSet.images.negative}
                alt="Option B"
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  negativeImageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={handleNegativeImageLoad}
                onError={handleNegativeImageError}
              />

              {/* Loading Spinner for Negative Image */}
              {!negativeImageLoaded && !negativeImageError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                  <div className="text-center text-gray-700 dark:text-white">
                    <svg
                      className="animate-spin h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-purple-500 mx-auto mb-2 sm:mb-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                      Loading Option B...
                    </p>
                  </div>
                </div>
              )}

              {/* Error State for Negative Image */}
              {negativeImageError && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-100/50 dark:bg-red-900/20">
                  <div className="text-center text-red-700 dark:text-white">
                    <div className="text-red-500 dark:text-red-400 text-2xl sm:text-3xl lg:text-4xl mb-2">
                      ⚠️
                    </div>
                    <p className="text-xs sm:text-sm text-red-600 dark:text-red-300">
                      Failed to load image
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Image Label */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-3 sm:p-4 lg:p-6">
              <p className="text-lg sm:text-xl lg:text-2xl font-bold mb-1 sm:mb-2">Option B</p>
              <p className="text-sm sm:text-base lg:text-lg opacity-90">
                {bothImagesReady ? 'Click to select this option' : 'Loading...'}
              </p>
            </div>
          </div>

          {/* Full Screen Button */}
          {bothImagesReady && (
            <button
              onClick={e => {
                e.stopPropagation();
                handleFullScreen(imageSet.images.negative, 'negative');
              }}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 lg:top-6 lg:right-6 bg-black/60 hover:bg-black/80 text-white p-2 sm:p-2.5 lg:p-3 rounded-full transition-all backdrop-blur-sm"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
            </button>
          )}

          {selectedImage === 'negative' && (
            <>
              <div className="absolute inset-0 bg-purple-500/30 backdrop-blur-md"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 sm:px-6 sm:py-3 lg:px-8 lg:py-4 rounded-xl sm:rounded-2xl shadow-2xl text-base sm:text-lg lg:text-xl font-bold">
                  Selected ✓
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Full Screen Modal */}
      {isFullScreen && fullScreenImage && (
        <div
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-50"
          onClick={closeFullScreen}
        >
          <div className="relative max-w-[95vw] max-h-[95vh] p-4">
            <img
              src={fullScreenImage.url}
              alt={`Full screen view - Option ${fullScreenImage.type === 'positive' ? 'A' : 'B'}`}
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            />

            {/* Close Button */}
            <button
              onClick={closeFullScreen}
              className="absolute top-6 right-6 bg-black/70 hover:bg-black/90 text-white p-4 rounded-full transition-all backdrop-blur-sm"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Image Info */}
            <div className="absolute bottom-6 left-6 bg-black/80 text-white p-4 rounded-xl backdrop-blur-sm">
              <p className="text-lg font-semibold">
                Option {fullScreenImage.type === 'positive' ? 'A' : 'B'}
              </p>
              <p className="text-sm text-gray-300">Click anywhere to close</p>
            </div>
          </div>
        </div>
      )}

      {/* Instructions for when images are loading */}
      {!bothImagesReady && (
        <div className="text-center mt-4 sm:mt-6 px-4 flex-shrink-0">
          <div className="inline-flex items-center bg-blue-900/30 text-blue-200 px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Please wait while we load the images for this question
          </div>
        </div>
      )}
    </div>
  );
};

export default MultimediaAssessmentQuiz;
