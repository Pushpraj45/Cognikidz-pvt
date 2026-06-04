import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { createApiUrl } from '../utils/apiConfig';
import { useAuth } from '../contexts/AuthContext';

const FeedbackForm = () => {
  const { isLoggedIn, currentUser } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', {
        state: {
          from: '/feedback',
          message: 'Please log in to access the feedback form.',
        },
      });
    }
  }, [isLoggedIn, navigate]);

  const [formData, setFormData] = useState({
    // Section 1: User Information - Pre-fill with current user data
    email: currentUser?.email || '',
    name: currentUser?.firstName
      ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim()
      : '',
    testingDuration: '',
    deviceInfo: {
      deviceType: '',
      browser: '',
      operatingSystem: '',
    },

    // Section 2: Feature Testing Feedback
    accountManagement: {
      createAccount: '',
      emailVerification: '',
      googleLogin: '',
      updateProfile: '',
      rating: '',
      issues: '',
    },
    childProfileManagement: {
      createProfile: '',
      uploadAvatar: '',
      editProfile: '',
      addMultipleChildren: '',
      rating: '',
      issues: '',
    },
    assessmentSystem: {
      assessmentsAttempted: [],
      assessmentDetails: [],
      overallRating: '',
      suggestions: '',
    },
    dashboard: {
      navigationEase: '',
      informationClarity: '',
      loadingSpeed: '',
      visualAppeal: '',
      functionality: '',
      issues: {
        viewingResults: { hasIssue: false, description: '' },
        switchingChildren: { hasIssue: false, description: '' },
        accessingReports: { hasIssue: false, description: '' },
        usingFeatures: { hasIssue: false, description: '' },
      },
    },
    chatbot: {
      used: '',
      helpful: '',
      responsive: '',
      understanding: '',
      issues: '',
    },
    articlesResources: {
      accessed: '',
      contentQuality: '',
      organization: '',
      foundRelevantInfo: '',
    },

    // Section 3: Technical Issues
    performanceIssues: {
      encountered: [],
      details: [],
    },
    mobileResponsiveness: {
      used: '',
      displayCorrect: '',
      featuresAccessible: '',
      specificIssues: '',
    },

    // Section 4: Security & Privacy
    securityConcerns: {
      dataSecurity: { hasConcern: false, description: '' },
      privacyProtection: { hasConcern: false, description: '' },
      informationSharing: { hasConcern: false, description: '' },
    },
    dataProtectionConfidence: '',

    // Section 5: Overall Experience
    overallRating: '',
    whatWorkedWell: '',
    needsImprovement: '',
    recommendationScore: '',
    additionalFeedback: '',

    // Section 6: Bug Reports
    bugReports: [],

    // Section 7: Future Testing
    futureParticipation: '',
    preferredFeatures: [],
    contactPreference: [],
  });

  const [expandedSections, setExpandedSections] = useState({
    userInfo: true,
    featureTesting: false,
    technicalIssues: false,
    security: false,
    overall: false,
    bugReports: false,
    futureTesting: false,
  });

  const [submissionStatus, setSubmissionStatus] = useState({
    loading: false,
    success: false,
    error: null,
  });

  const toggleSection = useCallback(section => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  const updateFormData = useCallback((path, value) => {
    setFormData(prev => {
      const newData = { ...prev };
      const pathArray = path.split('.');
      let current = newData;

      for (let i = 0; i < pathArray.length - 1; i++) {
        if (!current[pathArray[i]]) {
          current[pathArray[i]] = {};
        }
        current = current[pathArray[i]];
      }

      current[pathArray[pathArray.length - 1]] = value;
      return newData;
    });
  }, []);

  const handleArrayChange = useCallback((path, value, checked) => {
    setFormData(prev => {
      const newData = { ...prev };
      const pathArray = path.split('.');
      let current = newData;

      for (let i = 0; i < pathArray.length - 1; i++) {
        current = current[pathArray[i]];
      }

      const arrayField = pathArray[pathArray.length - 1];
      if (!current[arrayField]) {
        current[arrayField] = [];
      }

      if (checked) {
        if (!current[arrayField].includes(value)) {
          current[arrayField] = [...current[arrayField], value];
        }
      } else {
        current[arrayField] = current[arrayField].filter(item => item !== value);
      }

      return newData;
    });
  }, []);

  const addBugReport = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      bugReports: [
        ...prev.bugReports,
        {
          location: '',
          description: '',
          reproductionSteps: '',
          impact: 'Medium',
          screenshotUrl: '',
        },
      ],
    }));
  }, []);

  const removeBugReport = useCallback(index => {
    setFormData(prev => ({
      ...prev,
      bugReports: prev.bugReports.filter((_, i) => i !== index),
    }));
  }, []);

  const updateBugReport = useCallback((index, field, value) => {
    setFormData(prev => ({
      ...prev,
      bugReports: prev.bugReports.map((report, i) =>
        i === index ? { ...report, [field]: value } : report
      ),
    }));
  }, []);

  const handleSubmit = useCallback(
    async e => {
      e.preventDefault();
      setSubmissionStatus({ loading: true, success: false, error: null });

      try {
        // Clean and prepare the form data
        const cleanedData = {
          ...formData,

          // Convert ratings properly
          accountManagement: {
            ...formData.accountManagement,
            rating: formData.accountManagement.rating
              ? Number(formData.accountManagement.rating)
              : null,
          },
          childProfileManagement: {
            ...formData.childProfileManagement,
            rating: formData.childProfileManagement.rating
              ? Number(formData.childProfileManagement.rating)
              : null,
          },
          assessmentSystem: {
            ...formData.assessmentSystem,
            overallRating: formData.assessmentSystem.overallRating
              ? Number(formData.assessmentSystem.overallRating)
              : null,
          },
          dashboard: {
            ...formData.dashboard,
            // Convert dashboard ratings to numbers (1-5 scale)
            navigationEase: formData.dashboard.navigationEase
              ? ['Very Easy', 'Easy', 'Neutral', 'Difficult', 'Very Difficult'].indexOf(
                  formData.dashboard.navigationEase
                ) + 1
              : null,
            informationClarity: formData.dashboard.informationClarity
              ? ['Very Clear', 'Clear', 'Neutral', 'Unclear', 'Very Unclear'].indexOf(
                  formData.dashboard.informationClarity
                ) + 1
              : null,
            loadingSpeed: formData.dashboard.loadingSpeed
              ? ['Very Fast', 'Fast', 'Acceptable', 'Slow', 'Very Slow'].indexOf(
                  formData.dashboard.loadingSpeed
                ) + 1
              : null,
            visualAppeal: formData.dashboard.visualAppeal
              ? ['Excellent', 'Good', 'Average', 'Poor', 'Very Poor'].indexOf(
                  formData.dashboard.visualAppeal
                ) + 1
              : null,
            functionality: formData.dashboard.functionality
              ? Number(formData.dashboard.functionality)
              : null,
          },
          chatbot: {
            ...formData.chatbot,
            helpful: formData.chatbot.helpful ? Number(formData.chatbot.helpful) : null,
            responsive: formData.chatbot.responsive ? Number(formData.chatbot.responsive) : null,
            understanding: formData.chatbot.understanding
              ? Number(formData.chatbot.understanding)
              : null,
          },
          articlesResources: {
            ...formData.articlesResources,
            contentQuality: formData.articlesResources.contentQuality
              ? Number(formData.articlesResources.contentQuality)
              : null,
            organization: formData.articlesResources.organization
              ? Number(formData.articlesResources.organization)
              : null,
          },
          dataProtectionConfidence: formData.dataProtectionConfidence
            ? Number(formData.dataProtectionConfidence)
            : null,
          overallRating: formData.overallRating ? Number(formData.overallRating) : null,
          recommendationScore:
            formData.recommendationScore !== null && formData.recommendationScore !== ''
              ? Number(formData.recommendationScore)
              : null,
        };

        // Remove completely empty fields to reduce payload
        const cleanData = obj => {
          if (Array.isArray(obj)) {
            return obj.filter(item => item !== null && item !== undefined && item !== '');
          }

          if (obj && typeof obj === 'object') {
            const cleaned = {};
            for (const [key, value] of Object.entries(obj)) {
              if (value !== null && value !== undefined && value !== '') {
                if (typeof value === 'object') {
                  const cleanedNested = cleanData(value);
                  if (
                    Array.isArray(cleanedNested)
                      ? cleanedNested.length > 0
                      : Object.keys(cleanedNested).length > 0
                  ) {
                    cleaned[key] = cleanedNested;
                  }
                } else {
                  cleaned[key] = value;
                }
              }
            }
            return cleaned;
          }

          return obj;
        };

        const finalData = cleanData(cleanedData);

        console.log('Submitting feedback data:', finalData);

        const response = await fetch(createApiUrl('/api/feedback/submit'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(finalData),
        });

        let result;
        try {
          result = await response.json();
        } catch (parseError) {
          console.error('Failed to parse response:', parseError);
          throw new Error('Invalid response from server');
        }

        if (response.ok && result.success) {
          setSubmissionStatus({
            loading: false,
            success: true,
            error: null,
          });
          // Reset form with user data
          setFormData({
            email: currentUser?.email || '',
            name: currentUser?.firstName
              ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim()
              : '',
            testingDuration: '',
            deviceInfo: { deviceType: '', browser: '', operatingSystem: '' },
            accountManagement: {
              createAccount: '',
              emailVerification: '',
              googleLogin: '',
              updateProfile: '',
              rating: '',
              issues: '',
            },
            childProfileManagement: {
              createProfile: '',
              uploadAvatar: '',
              editProfile: '',
              addMultipleChildren: '',
              rating: '',
              issues: '',
            },
            assessmentSystem: {
              assessmentsAttempted: [],
              assessmentDetails: [],
              overallRating: '',
              suggestions: '',
            },
            dashboard: {
              navigationEase: '',
              informationClarity: '',
              loadingSpeed: '',
              visualAppeal: '',
              functionality: '',
              issues: {
                viewingResults: { hasIssue: false, description: '' },
                switchingChildren: { hasIssue: false, description: '' },
                accessingReports: { hasIssue: false, description: '' },
                usingFeatures: { hasIssue: false, description: '' },
              },
            },
            chatbot: {
              used: '',
              helpful: '',
              responsive: '',
              understanding: '',
              issues: '',
            },
            articlesResources: {
              accessed: '',
              contentQuality: '',
              organization: '',
              foundRelevantInfo: '',
            },
            performanceIssues: { encountered: [], details: [] },
            mobileResponsiveness: {
              used: '',
              displayCorrect: '',
              featuresAccessible: '',
              specificIssues: '',
            },
            securityConcerns: {
              dataSecurity: { hasConcern: false, description: '' },
              privacyProtection: { hasConcern: false, description: '' },
              informationSharing: { hasConcern: false, description: '' },
            },
            dataProtectionConfidence: '',
            overallRating: '',
            whatWorkedWell: '',
            needsImprovement: '',
            recommendationScore: '',
            additionalFeedback: '',
            bugReports: [],
            futureParticipation: '',
            preferredFeatures: [],
            contactPreference: [],
          });
        } else {
          console.error('Feedback submission failed:', result);
          setSubmissionStatus({
            loading: false,
            success: false,
            error: result.message || result.error || `Server error: ${response.status}`,
          });
        }
      } catch (error) {
        console.error('Feedback submission error:', error);
        setSubmissionStatus({
          loading: false,
          success: false,
          error: `Network error: ${error.message}`,
        });
      }
    },
    [formData]
  );

  // Memoize component definitions to prevent re-creation on every render
  const SectionHeader = useCallback(
    ({ title, sectionKey, children }) => (
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div
          className="px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 cursor-pointer hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-800/30 dark:hover:to-purple-800/30 transition-colors"
          onClick={() => toggleSection(sectionKey)}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
            {expandedSections[sectionKey] ? (
              <ChevronUpIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            )}
          </div>
        </div>
        {expandedSections[sectionKey] && (
          <div className="px-6 py-6 space-y-4 bg-white dark:bg-gray-800">{children}</div>
        )}
      </div>
    ),
    [expandedSections, toggleSection]
  );

  const RadioGroup = useCallback(
    ({ label, name, options, value, onChange, required = false }) => (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="space-y-2">
          {options.map(option => (
            <label key={option} className="flex items-center">
              <input
                type="radio"
                name={name}
                value={option}
                checked={value === option}
                onChange={e => onChange(e.target.value)}
                className="h-4 w-4 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 border-gray-300 dark:border-gray-600 dark:bg-gray-700"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{option}</span>
            </label>
          ))}
        </div>
      </div>
    ),
    []
  );

  const RatingScale = useCallback(
    ({ label, value, onChange, required = false }) => (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map(rating => (
            <button
              key={rating}
              type="button"
              onClick={() => onChange(rating)}
              className={`w-10 h-10 rounded-full text-sm font-medium transition-colors duration-200 ${
                value >= rating
                  ? 'bg-yellow-400 text-yellow-900'
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-500'
              }`}
            >
              ★
            </button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>Poor</span>
          <span>Excellent</span>
        </div>
      </div>
    ),
    []
  );

  const CheckboxGroup = useCallback(
    ({ label, options, values, onChange }) => (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
        <div className="space-y-2">
          {options.map(option => (
            <label key={option} className="flex items-center">
              <input
                type="checkbox"
                checked={values.includes(option)}
                onChange={e => onChange(option, e.target.checked)}
                className="h-4 w-4 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{option}</span>
            </label>
          ))}
        </div>
      </div>
    ),
    []
  );

  const inputClasses =
    'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400';
  const selectClasses =
    'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100';
  const textareaClasses =
    'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-vertical';

  // Add stable keys and autocomplete attributes to prevent input issues
  const textAreaProps = {
    className: textareaClasses,
    autoComplete: 'off',
    spellCheck: 'true',
  };

  const inputProps = {
    className: inputClasses,
    autoComplete: 'off',
  };

  // Show loading state while checking authentication
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
            <LockClosedIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Authentication Required
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You need to be logged in to access the feedback form. Redirecting to login...
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (submissionStatus.success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Thank You!</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your feedback has been submitted successfully. We appreciate your time and input.
            </p>
            <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <p>
                📝 <strong>Submit Another:</strong>{' '}
                <button
                  onClick={() =>
                    setSubmissionStatus({ loading: false, success: false, error: null })
                  }
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Fill Out Another Feedback Form
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Beta Testing Feedback
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Help us improve CogniKidz by sharing your testing experience
            </p>
            {currentUser && (
              <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Logged in as {currentUser.firstName || currentUser.email}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {submissionStatus.error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 dark:text-red-300" />
              <div className="ml-3">
                <p className="text-sm text-red-700 dark:text-red-300">{submissionStatus.error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: User Information */}
          <SectionHeader title="1. User Information" sectionKey="userInfo">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => updateFormData('email', e.target.value)}
                  className={inputClasses}
                  placeholder="your.email@example.com"
                  readOnly={!!currentUser?.email}
                  title={currentUser?.email ? 'Email is pre-filled from your account' : ''}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name (Optional)
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => updateFormData('name', e.target.value)}
                  className={inputClasses}
                  placeholder="Your name"
                  title={currentUser?.firstName ? 'Name is pre-filled from your account' : ''}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  How long did you test?
                </label>
                <select
                  value={formData.testingDuration}
                  onChange={e => updateFormData('testingDuration', e.target.value)}
                  className={selectClasses}
                >
                  <option value="">Select duration</option>
                  <option value="Less than 30 minutes">Less than 30 minutes</option>
                  <option value="30 minutes - 1 hour">30 minutes - 1 hour</option>
                  <option value="1-2 hours">1-2 hours</option>
                  <option value="2+ hours">2+ hours</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Device Type
                </label>
                <select
                  value={formData.deviceInfo.deviceType}
                  onChange={e => updateFormData('deviceInfo.deviceType', e.target.value)}
                  className={selectClasses}
                >
                  <option value="">Select device</option>
                  <option value="Desktop">Desktop</option>
                  <option value="Laptop">Laptop</option>
                  <option value="Tablet">Tablet</option>
                  <option value="Mobile">Mobile</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Browser
                </label>
                <select
                  value={formData.deviceInfo.browser}
                  onChange={e => updateFormData('deviceInfo.browser', e.target.value)}
                  className={selectClasses}
                >
                  <option value="">Select browser</option>
                  <option value="Chrome">Chrome</option>
                  <option value="Firefox">Firefox</option>
                  <option value="Safari">Safari</option>
                  <option value="Edge">Edge</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Operating System
                </label>
                <select
                  value={formData.deviceInfo.operatingSystem}
                  onChange={e => updateFormData('deviceInfo.operatingSystem', e.target.value)}
                  className={selectClasses}
                >
                  <option value="">Select OS</option>
                  <option value="Windows">Windows</option>
                  <option value="macOS">macOS</option>
                  <option value="Linux">Linux</option>
                  <option value="iOS">iOS</option>
                  <option value="Android">Android</option>
                </select>
              </div>
            </div>
          </SectionHeader>

          {/* Section 2: Feature Testing Feedback */}
          <SectionHeader title="2. Feature Testing Feedback" sectionKey="featureTesting">
            {/* Account Management */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Account Management
              </h3>

              <CheckboxGroup
                label="Which account features did you test?"
                options={[
                  'Creating an account',
                  'Email verification',
                  'Google login',
                  'Updating profile information',
                ]}
                values={[
                  formData.accountManagement.createAccount && 'Creating an account',
                  formData.accountManagement.emailVerification && 'Email verification',
                  formData.accountManagement.googleLogin && 'Google login',
                  formData.accountManagement.updateProfile && 'Updating profile information',
                ].filter(Boolean)}
                onChange={(value, checked) => {
                  const fieldMap = {
                    'Creating an account': 'createAccount',
                    'Email verification': 'emailVerification',
                    'Google login': 'googleLogin',
                    'Updating profile information': 'updateProfile',
                  };
                  updateFormData(`accountManagement.${fieldMap[value]}`, checked ? 'Yes' : '');
                }}
              />

              <RatingScale
                label="Overall account management experience"
                value={formData.accountManagement.rating}
                onChange={value => updateFormData('accountManagement.rating', value)}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Any issues with account management?
                </label>
                <textarea
                  value={formData.accountManagement.issues}
                  onChange={e => updateFormData('accountManagement.issues', e.target.value)}
                  rows={3}
                  {...textAreaProps}
                  placeholder="Describe any issues you encountered..."
                />
              </div>
            </div>

            {/* Child Profile Management */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Child Profile Management
              </h3>

              <CheckboxGroup
                label="Which child profile features did you test?"
                options={[
                  'Creating child profiles',
                  'Uploading child avatars',
                  'Editing child information',
                  'Adding multiple children',
                ]}
                values={[
                  formData.childProfileManagement.createProfile && 'Creating child profiles',
                  formData.childProfileManagement.uploadAvatar && 'Uploading child avatars',
                  formData.childProfileManagement.editProfile && 'Editing child information',
                  formData.childProfileManagement.addMultipleChildren && 'Adding multiple children',
                ].filter(Boolean)}
                onChange={(value, checked) => {
                  const fieldMap = {
                    'Creating child profiles': 'createProfile',
                    'Uploading child avatars': 'uploadAvatar',
                    'Editing child information': 'editProfile',
                    'Adding multiple children': 'addMultipleChildren',
                  };
                  updateFormData(`childProfileManagement.${fieldMap[value]}`, checked ? 'Yes' : '');
                }}
              />

              <RatingScale
                label="Overall child profile management experience"
                value={formData.childProfileManagement.rating}
                onChange={value => updateFormData('childProfileManagement.rating', value)}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Any issues with child profile management?
                </label>
                <textarea
                  value={formData.childProfileManagement.issues}
                  onChange={e => updateFormData('childProfileManagement.issues', e.target.value)}
                  rows={3}
                  className={textareaClasses}
                  placeholder="Describe any issues you encountered..."
                />
              </div>
            </div>

            {/* Assessment System */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Assessment System
              </h3>

              <CheckboxGroup
                label="Which assessments did you attempt?"
                options={[
                  'ADHD Assessment',
                  'Autism Assessment',
                  'Dyslexia Assessment',
                  'General Assessment',
                ]}
                values={formData.assessmentSystem.assessmentsAttempted}
                onChange={(value, checked) =>
                  handleArrayChange('assessmentSystem.assessmentsAttempted', value, checked)
                }
              />

              <RatingScale
                label="Overall assessment system experience"
                value={formData.assessmentSystem.overallRating}
                onChange={value => updateFormData('assessmentSystem.overallRating', value)}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Suggestions for assessment improvements
                </label>
                <textarea
                  value={formData.assessmentSystem.suggestions}
                  onChange={e => updateFormData('assessmentSystem.suggestions', e.target.value)}
                  rows={4}
                  className={textareaClasses}
                  placeholder="Your suggestions for improving the assessment system..."
                />
              </div>
            </div>

            {/* Dashboard Experience */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Dashboard Experience
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <RadioGroup
                    label="Navigation ease"
                    name="navigationEase"
                    options={['Very Easy', 'Easy', 'Neutral', 'Difficult', 'Very Difficult']}
                    value={formData.dashboard.navigationEase}
                    onChange={value => updateFormData('dashboard.navigationEase', value)}
                  />
                </div>
                <div>
                  <RadioGroup
                    label="Information clarity"
                    name="informationClarity"
                    options={['Very Clear', 'Clear', 'Neutral', 'Unclear', 'Very Unclear']}
                    value={formData.dashboard.informationClarity}
                    onChange={value => updateFormData('dashboard.informationClarity', value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <RadioGroup
                    label="Loading speed"
                    name="loadingSpeed"
                    options={['Very Fast', 'Fast', 'Acceptable', 'Slow', 'Very Slow']}
                    value={formData.dashboard.loadingSpeed}
                    onChange={value => updateFormData('dashboard.loadingSpeed', value)}
                  />
                </div>
                <div>
                  <RadioGroup
                    label="Visual appeal"
                    name="visualAppeal"
                    options={['Excellent', 'Good', 'Average', 'Poor', 'Very Poor']}
                    value={formData.dashboard.visualAppeal}
                    onChange={value => updateFormData('dashboard.visualAppeal', value)}
                  />
                </div>
              </div>
            </div>

            {/* Chatbot Experience */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                AI Chatbot Experience
              </h3>

              <RadioGroup
                label="Did you use the AI chatbot?"
                name="chatbotUsed"
                options={['Yes', 'No']}
                value={formData.chatbot.used}
                onChange={value => updateFormData('chatbot.used', value)}
              />

              {formData.chatbot.used === 'Yes' && (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <RatingScale
                      label="How helpful was it?"
                      value={formData.chatbot.helpful}
                      onChange={value => updateFormData('chatbot.helpful', value)}
                    />
                    <RatingScale
                      label="How responsive was it?"
                      value={formData.chatbot.responsive}
                      onChange={value => updateFormData('chatbot.responsive', value)}
                    />
                    <RatingScale
                      label="How well did it understand you?"
                      value={formData.chatbot.understanding}
                      onChange={value => updateFormData('chatbot.understanding', value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Any issues with the chatbot?
                    </label>
                    <textarea
                      value={formData.chatbot.issues}
                      onChange={e => updateFormData('chatbot.issues', e.target.value)}
                      rows={3}
                      className={textareaClasses}
                      placeholder="Describe any issues you encountered with the chatbot..."
                    />
                  </div>
                </div>
              )}
            </div>
          </SectionHeader>

          {/* Section 3: Technical Issues */}
          <SectionHeader title="3. Technical Issues" sectionKey="technicalIssues">
            <CheckboxGroup
              label="Did you encounter any of these technical issues?"
              options={[
                'Slow page loading',
                'Broken links or buttons',
                'Error messages',
                'Browser compatibility issues',
                'Mobile responsiveness problems',
                'Data not saving properly',
              ]}
              values={formData.performanceIssues.encountered}
              onChange={(value, checked) =>
                handleArrayChange('performanceIssues.encountered', value, checked)
              }
            />

            <RadioGroup
              label="Did you test on mobile devices?"
              name="mobileUsed"
              options={['Yes', 'No']}
              value={formData.mobileResponsiveness.used}
              onChange={value => updateFormData('mobileResponsiveness.used', value)}
            />

            {formData.mobileResponsiveness.used === 'Yes' && (
              <div className="mt-4 space-y-4">
                <RadioGroup
                  label="Did everything display correctly on mobile?"
                  name="mobileDisplay"
                  options={['Yes', 'No', 'Mostly']}
                  value={formData.mobileResponsiveness.displayCorrect}
                  onChange={value => updateFormData('mobileResponsiveness.displayCorrect', value)}
                />

                <RadioGroup
                  label="Were all features accessible on mobile?"
                  name="mobileFeatures"
                  options={['Yes', 'No', 'Mostly']}
                  value={formData.mobileResponsiveness.featuresAccessible}
                  onChange={value =>
                    updateFormData('mobileResponsiveness.featuresAccessible', value)
                  }
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Specific mobile issues
                  </label>
                  <textarea
                    value={formData.mobileResponsiveness.specificIssues}
                    onChange={e =>
                      updateFormData('mobileResponsiveness.specificIssues', e.target.value)
                    }
                    rows={3}
                    className={textareaClasses}
                    placeholder="Describe any mobile-specific issues..."
                  />
                </div>
              </div>
            )}
          </SectionHeader>

          {/* Section 4: Security & Privacy */}
          <SectionHeader title="4. Security & Privacy" sectionKey="security">
            <div className="space-y-6">
              {Object.entries({
                dataSecurity: 'data security',
                privacyProtection: 'privacy protection',
                informationSharing: 'information sharing',
              }).map(([key, label]) => (
                <div
                  key={key}
                  className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0"
                >
                  <label className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      checked={formData.securityConcerns[key].hasConcern}
                      onChange={e =>
                        updateFormData(`securityConcerns.${key}.hasConcern`, e.target.checked)
                      }
                      className="h-4 w-4 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      I have concerns about {label}
                    </span>
                  </label>
                  {formData.securityConcerns[key].hasConcern && (
                    <textarea
                      value={formData.securityConcerns[key].description}
                      onChange={e =>
                        updateFormData(`securityConcerns.${key}.description`, e.target.value)
                      }
                      placeholder={`Describe your ${label} concerns...`}
                      rows={3}
                      className={textareaClasses}
                    />
                  )}
                </div>
              ))}
            </div>

            <RatingScale
              label="How confident are you in our data protection measures?"
              value={formData.dataProtectionConfidence}
              onChange={value => updateFormData('dataProtectionConfidence', value)}
            />
          </SectionHeader>

          {/* Section 5: Overall Experience */}
          <SectionHeader title="5. Overall Experience" sectionKey="overall">
            <RatingScale
              label="Overall rating of CogniKidz"
              value={formData.overallRating}
              onChange={value => updateFormData('overallRating', value)}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  What worked well?
                </label>
                <textarea
                  value={formData.whatWorkedWell}
                  onChange={e => updateFormData('whatWorkedWell', e.target.value)}
                  rows={4}
                  className={textareaClasses}
                  placeholder="Tell us what you liked about CogniKidz..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  What needs improvement?
                </label>
                <textarea
                  value={formData.needsImprovement}
                  onChange={e => updateFormData('needsImprovement', e.target.value)}
                  rows={4}
                  className={textareaClasses}
                  placeholder="Tell us what could be better..."
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Would you recommend CogniKidz to others? (0-10 scale)
              </label>
              <div className="flex space-x-1">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => updateFormData('recommendationScore', score)}
                    className={`w-8 h-8 rounded text-sm font-medium transition-colors duration-200 ${
                      formData.recommendationScore === score
                        ? 'bg-blue-600 dark:bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500'
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>Not likely</span>
                <span>Very likely</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Additional suggestions or feedback
              </label>
              <textarea
                value={formData.additionalFeedback}
                onChange={e => updateFormData('additionalFeedback', e.target.value)}
                rows={4}
                className={textareaClasses}
                placeholder="Any other feedback, suggestions, or comments..."
              />
            </div>
          </SectionHeader>

          {/* Section 6: Bug Reports */}
          <SectionHeader title="6. Bug Reports" sectionKey="bugReports">
            <div className="mb-4">
              <button
                type="button"
                onClick={addBugReport}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-colors duration-200"
              >
                Add Bug Report
              </button>
            </div>

            {formData.bugReports.map((bug, index) => (
              <div
                key={index}
                className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200">
                    Bug Report #{index + 1}
                  </h4>
                  <button
                    type="button"
                    onClick={() => removeBugReport(index)}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Where did it occur?
                    </label>
                    <input
                      type="text"
                      value={bug.location}
                      onChange={e => updateBugReport(index, 'location', e.target.value)}
                      className={inputClasses}
                      placeholder="e.g., Dashboard, Assessment page, Login form"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Impact on usage
                    </label>
                    <select
                      value={bug.impact}
                      onChange={e => updateBugReport(index, 'impact', e.target.value)}
                      className={selectClasses}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    What happened?
                  </label>
                  <textarea
                    value={bug.description}
                    onChange={e => updateBugReport(index, 'description', e.target.value)}
                    rows={3}
                    className={textareaClasses}
                    placeholder="Describe what went wrong..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Steps to reproduce
                  </label>
                  <textarea
                    value={bug.reproductionSteps}
                    onChange={e => updateBugReport(index, 'reproductionSteps', e.target.value)}
                    rows={3}
                    className={textareaClasses}
                    placeholder="1. Click on... 2. Then... 3. Expected vs actual result"
                  />
                </div>
              </div>
            ))}
          </SectionHeader>

          {/* Section 7: Future Testing */}
          <SectionHeader title="7. Future Testing" sectionKey="futureTesting">
            <RadioGroup
              label="Would you participate in future testing?"
              name="futureParticipation"
              options={['Yes', 'No']}
              value={formData.futureParticipation}
              onChange={value => updateFormData('futureParticipation', value)}
            />

            <CheckboxGroup
              label="Preferred features to test"
              options={[
                'New assessments',
                'Mobile app',
                'Parent dashboard',
                'AI recommendations',
                'Reports generation',
                'User interface improvements',
              ]}
              values={formData.preferredFeatures}
              onChange={(value, checked) => handleArrayChange('preferredFeatures', value, checked)}
            />

            <CheckboxGroup
              label="Best way to contact you"
              options={['Email', 'Phone', 'Text message', 'In-app notification']}
              values={formData.contactPreference}
              onChange={(value, checked) => handleArrayChange('contactPreference', value, checked)}
            />
          </SectionHeader>

          {/* Submit Button */}
          <div className="text-center pt-6">
            <button
              type="submit"
              disabled={submissionStatus.loading || !formData.email}
              className={`px-8 py-3 rounded-lg font-semibold text-white transition-colors duration-200 ${
                submissionStatus.loading || !formData.email
                  ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
              }`}
            >
              {submissionStatus.loading ? 'Submitting...' : 'Submit Feedback'}
            </button>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              * Email is required to submit feedback
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackForm;
