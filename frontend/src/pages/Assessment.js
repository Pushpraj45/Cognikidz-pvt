import React, { useEffect, useState, useRef, useContext } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { toast } from 'react-hot-toast';
import IntakeService from '../services/IntakeService';
import AssessmentService from '../services/AssessmentService';
import LogoLoader from '../components/ui/LogoLoader';
import AssessmentLayout from '../components/assessment/AssessmentLayout';
import AssessmentQuiz from '../components/assessment/AssessmentQuiz';
import DisorderSelector from '../components/assessment/DisorderSelector';
import TranslatedText from '../components/ui/TranslatedText';
import { useTranslation } from 'react-i18next';
import { FullScreenProvider } from '../contexts/FullScreenContext';
import FullScreenButton from '../components/ui/FullScreenButton';
import { LanguageContext } from '../contexts/LanguageContext';

/**
 * Assessment Page Component
 *
 * This component now serves multiple purposes:
 * 1. Starting an assessment from an intake
 * 2. Continuing an existing assessment
 * 3. Selecting an assessment type (DisorderSelector)
 * 4. Rendering specific assessment-related components passed as children
 */
const Assessment = ({ children }) => {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const assessmentRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assessmentData, setAssessmentData] = useState(null);
  const [initializing, setInitializing] = useState(false);
  const [targetElement, setTargetElement] = useState(null);
  const { language } = useContext(LanguageContext);

  // Extract data from location state and search params
  const intakeData = location.state?.intakeData;
  const assessmentType = location.state?.assessmentType;
  const triggerFullScreen = location.state?.triggerFullScreen;
  const disorderType = searchParams.get('disorder'); // Get disorder from URL query parameter
  
  // Check for intakeId in URL parameters (for direct navigation from IntakePage)
  const intakeIdFromUrl = searchParams.get('intakeId');
  const languageFromUrl = searchParams.get('language');

  // Update target element when ref is available
  useEffect(() => {
    if (assessmentRef.current) {
      setTargetElement(assessmentRef.current);
    }
  }, [assessmentRef.current]);

  useEffect(() => {
    if (children) {
      // If children are provided, render them directly (for custom assessment routes)
      setLoading(false);
      return;
    }

    if (sessionId) {
      // Load existing assessment session
      loadAssessment();
    } else if (intakeData && assessmentType) {
      // Create new assessment from intake data (passed via state)
      initializeAssessment();
    } else if (intakeIdFromUrl) {
      // Create new assessment from URL parameters (direct navigation from IntakePage)
      initializeAssessmentFromUrl();
    } else {
      // Show disorder selector if no specific assessment data
      setLoading(false);
    }
  }, [sessionId, intakeData, assessmentType, intakeIdFromUrl, children]);

  const loadAssessment = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading assessment for session:', sessionId);
      const data = await AssessmentService.getAssessment(sessionId);
      console.log('Assessment data loaded:', data);
      setAssessmentData(data);
    } catch (err) {
      console.error('Error loading assessment:', err);
      setError(err.message || 'Failed to load assessment');
    } finally {
      setLoading(false);
    }
  };

  const initializeAssessment = async () => {
    try {
      setInitializing(true);
      setError(null);
      console.log('Initializing assessment with intake data:', intakeData);

      // Use the correct service method with language support
      const response = await AssessmentService.startAssessmentFromIntake(
        intakeData.intakeId,
        assessmentType,
        false, // gameBasedAssessment
        language // Pass the current language
      );
      console.log('Assessment created:', response);

      if (response.sessionId) {
        // Navigate to the new assessment session
        navigate(`/assessment/${response.sessionId}`, {
          replace: true,
          state: { assessmentData: response },
        });
      } else {
        throw new Error('No session ID returned from assessment creation');
      }
    } catch (err) {
      console.error('Error initializing assessment:', err);
      setError(err.message || 'Failed to initialize assessment');
      setInitializing(false);
    }
  };

  const initializeAssessmentFromUrl = async () => {
    try {
      setInitializing(true);
      setError(null);
      console.log('Initializing assessment with URL intake ID:', intakeIdFromUrl);

      // Use language from URL params or context
      const assessmentLanguage = languageFromUrl || language;

      // 🔍 DEBUG: Log language parameter flow from Assessment URL initialization
      console.log('🔍 [LANGUAGE DEBUG] Assessment URL Language Flow:', {
        component: 'Assessment',
        method: 'initializeAssessmentFromUrl',
        intakeIdFromUrl,
        languageFromUrl,
        contextLanguage: language,
        finalLanguage: assessmentLanguage,
        languageType: typeof assessmentLanguage,
        languageUndefined: assessmentLanguage === undefined,
        languageNull: assessmentLanguage === null,
        hasLanguage: assessmentLanguage !== undefined && assessmentLanguage !== null,
        languageValue: assessmentLanguage
      });

      // Use the correct service method with language support
      const response = await AssessmentService.startAssessmentFromIntake(
        intakeIdFromUrl,
        'general', // Default assessment type
        false, // gameBasedAssessment
        assessmentLanguage // Pass the determined language
      );
      console.log('Assessment created from URL:', response);

      if (response.sessionId) {
        // Navigate to the new assessment session
        navigate(`/assessment/${response.sessionId}`, {
          replace: true,
          state: { assessmentData: response },
        });
      } else {
        throw new Error('No session ID returned from assessment creation');
      }
    } catch (err) {
      console.error('Error initializing assessment from URL:', err);
      setError(err.message || 'Failed to initialize assessment');
      setInitializing(false);
    }
  };

  const handleAssessmentComplete = data => {
    console.log('Assessment completed:', data);
    // Navigate to results page
    navigate(`/assessment/${sessionId}/complete`, {
      state: { results: data },
    });
  };

  const handleAssessmentPause = () => {
    console.log('Assessment paused');
    // Navigate to paused page
    navigate(`/assessment/${sessionId}/paused`);
  };

  const { t } = useTranslation('assessment');

  // Loading state
  if (loading || initializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Enhanced spacing and better layout */}
        <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <LogoLoader size="large" message={t('page.loading')} />
                <p className="mt-6 text-lg font-medium text-gray-700 dark:text-gray-300">
                  {initializing ? t('page.loading_setup') : t('page.loading')}
                </p>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {t('page.loading_hint')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-8 text-center">
              <h2 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-4">
                {t('page.error_title')}
              </h2>
              <p className="text-red-600 dark:text-red-300 mb-6">{error}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  {t('page.try_again')}
                </button>
                <button
                  onClick={() => navigate('/assessments')}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  {t('page.back_to_assessments')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If children are provided, render them with better layout
  if (children) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Enhanced spacing from navbar */}
        <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </div>
    );
  }

  // Show disorder selector if no session data
  if (!sessionId && !assessmentData) {
    return (
      <>
        <Helmet>
          <title>Choose Assessment Type - CogniKidz</title>
          <meta
            name="description"
            content="Select the appropriate assessment type for your child"
          />
        </Helmet>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          {/* Better spacing and layout for disorder selector */}
          <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <DisorderSelector initialDisorderType={disorderType} />
            </div>
          </div>
        </div>
      </>
    );
  }

  // Render assessment quiz with improved layout
  return (
    <>
      <Helmet>
        <title>Assessment in Progress - CogniKidz</title>
        <meta name="description" content="Complete your child's developmental assessment" />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Enhanced spacing and better container */}
        <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {/* Assessment Header with better spacing */}
            <div className="mb-8 text-center">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {t('page.in_progress_title')}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                {t('page.in_progress_hint')}
              </p>
            </div>

            {/* Main Assessment Container */}
            <div
              ref={assessmentRef}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/20 overflow-auto relative min-h-screen"
            >
              <FullScreenProvider
                autoEnter={triggerFullScreen || false}
                targetElement={targetElement}
              >
                {/* Full Screen Button */}
                <FullScreenButton
                  position="top-right"
                  variant="primary"
                  size="medium"
                  showLabel={true}
                />

                <div className="p-6 sm:p-8 lg:p-12 h-full flex flex-col min-h-screen">
                  <AssessmentQuiz
                    sessionId={sessionId}
                    questions={assessmentData?.questions}
                    onComplete={handleAssessmentComplete}
                    onPause={handleAssessmentPause}
                    childAge={assessmentData?.childAge}
                    childName={assessmentData?.childName}
                  />
                </div>
              </FullScreenProvider>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Assessment;
