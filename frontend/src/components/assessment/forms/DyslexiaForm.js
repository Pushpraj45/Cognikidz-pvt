import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import api from '../../../services/api';
import { toast } from 'react-hot-toast';
import ConsentModal from '../../profile/ConsentModal';
import { AssessmentLoader } from '../../ui/LogoLoader';

const DyslexiaForm = () => {
  const { childId } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [childData, setChildData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showConsentModal, setShowConsentModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    // Language and Reading section
    languageReading: {
      letterRecognition: 1, // 1-5 scale: 1=Never, 5=Always
      phonemicAwareness: 1,
      blendingSegmenting: 1,
      readingSpeed: 1,
      spelling: 1,
      letterConfusion: 1,
    },
    // Cognitive section
    cognitive: {
      workingMemory: 1,
      verbalMemory: 1,
    },
    // Academic section
    academic: {
      readingComprehension: 1,
      avoidanceReading: 1,
    },

    // Additional notes
    additionalNotes: '',
  });

  useEffect(() => {
    const fetchChildData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // Fix the API endpoint to match the backend route
        const response = await api.get(`/api/childprofile/${childId}`);
        console.log('Child profile response:', response.data);

        // Handle the direct response data format (no .success and .data wrappers)
        if (response.data) {
          setChildData(response.data);
        } else {
          setError('Failed to fetch child profile - no data returned');
          toast.error('Failed to fetch child profile');
        }
      } catch (error) {
        console.error('Error fetching child profile:', error);
        setError('Error loading child data');
        toast.error('Error loading child data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchChildData();
  }, [childId, navigate]);

  // If loading or error, show appropriate UI
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 pt-20">
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="rounded-full h-16 w-16 border-4 border-primary border-t-transparent mb-6"
          />
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-gray-600 dark:text-gray-300 font-medium text-lg"
          >
            Loading child data...
          </motion.p>
        </div>
      </div>
    );
  }

  if (error || !childData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 pt-20 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center"
          >
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
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
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {error || 'Child profile not found'}
            </h2>
            <p className="mb-8 text-gray-600 dark:text-gray-300 text-lg">
              We couldn't load the child's profile information.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/assessment')}
              className="px-8 py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold text-lg"
            >
              Back to Assessment
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  const handleChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleTextChange = e => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      // Handle nested fields
      const [section, field] = name.split('.');
      handleChange(section, field, value);
    } else {
      // Handle top-level fields
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (isSubmitting) return;

    // Show consent modal first
    setShowConsentModal(true);
  };

  const handleConsentAgree = async () => {
    setShowConsentModal(false);
    setIsSubmitting(true);

    try {
      // Combine child data with form data
      const payload = {
        childId,
        childData: {
          name:
            childData.lastName && childData.lastName !== 'undefined'
              ? `${childData.firstName} ${childData.lastName}`
              : childData.firstName,
          age: childData.age,
          gender: childData.gender,
        },
        assessmentType: 'dyslexia',
        formData,
        language: i18n.language || 'en', // Add the current language
      };

      // Add a brief delay to show the loader
      await new Promise(resolve => setTimeout(resolve, 1500));

      const response = await api.post('/api/assessment/start', payload);

      if (response.data.success) {
        toast.success('Assessment started successfully');
        // Navigate to assessment and trigger full-screen mode
        navigate(`/assessment/${response.data.sessionId}`, {
          state: {
            triggerFullScreen: true,
            sessionId: response.data.sessionId,
          },
        });
      } else {
        toast.error(response.data.message || 'Failed to start assessment');
      }
    } catch (error) {
      console.error('Error starting assessment:', error);
      toast.error('Error starting assessment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConsentClose = () => {
    setShowConsentModal(false);
  };

  // Helper function to render radio option buttons with animations
  const renderRadioOptions = (section, field, value) => (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1 xs:gap-2 sm:gap-3 mt-3">
      {[1, 2, 3, 4, 5].map(option => (
        <motion.label
          key={option}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`flex flex-col items-center cursor-pointer transition-all duration-200 p-1.5 xs:p-2 sm:p-2.5 rounded-lg xs:rounded-xl w-full h-[60px] xs:h-[65px] sm:h-[75px] md:h-[80px] justify-between
            ${
              formData[section][field] === option
                ? 'bg-gradient-to-t from-green-600/20 to-green-600/10 border-2 border-green-600 shadow-lg scale-105'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 hover:border-green-600/30'
            }`}
        >
          <input
            type="radio"
            name={`${section}.${field}`}
            value={option}
            checked={formData[section][field] === option}
            onChange={() => handleChange(section, field, option)}
            className="sr-only"
          />
          <motion.span
            animate={{
              backgroundColor: formData[section][field] === option ? '#059669' : '#e5e7eb',
              color: formData[section][field] === option ? '#ffffff' : '#4b5563',
            }}
            className={`flex items-center justify-center w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 rounded-full text-xs xs:text-sm sm:text-sm font-semibold transition-all duration-200 flex-shrink-0`}
          >
            {option}
          </motion.span>
          <span className="text-[9px] xs:text-[10px] sm:text-xs text-center text-gray-600 dark:text-gray-400 font-medium leading-tight px-0.5 xs:px-1 break-words w-full">
            {['Never', 'Rarely', 'Sometimes', 'Often', 'Always'][option - 1]}
          </span>
        </motion.label>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 pt-20 xs:pt-24 sm:pt-32 pb-8 xs:pb-12">
      <div className="max-w-5xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate('/assessment')}
          className="mb-4 xs:mb-6 flex items-center gap-2 px-3 xs:px-4 py-2 xs:py-2 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-lg xs:rounded-xl shadow-sm hover:bg-green-50 dark:hover:bg-gray-700 transition-all text-green-700 dark:text-green-200 font-medium xs:font-semibold text-sm xs:text-base"
        >
          <svg
            className="w-4 h-4 xs:w-5 xs:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
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
          className="bg-white dark:bg-gray-800 rounded-2xl xs:rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header Section */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 xs:p-6 sm:p-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
                Dyslexia Assessment Form
              </h1>
              <p className="text-green-100 text-sm xs:text-base sm:text-lg">
                Comprehensive assessment for {childData.firstName} {childData.lastName}
              </p>
            </motion.div>
          </div>

          {/* Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-4 xs:p-6 sm:p-8 border-b border-gray-200 dark:border-gray-700"
          >
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl xs:rounded-2xl p-3 xs:p-4 sm:p-6">
              <div className="flex items-start space-x-2 xs:space-x-3">
                <div className="flex-shrink-0">
                  <svg
                    className="w-5 h-5 xs:w-6 xs:h-6 text-green-600 dark:text-green-400"
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
                </div>
                <div>
                  <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2 text-sm xs:text-base sm:text-lg">
                    Assessment Instructions
                  </h3>
                  <p className="text-xs xs:text-sm sm:text-base text-green-800 dark:text-green-200 leading-relaxed">
                    Rate each behavior based on how often it occurs. Consider the child's reading
                    and learning patterns over the past 6 months. Focus on language skills,
                    cognitive abilities, and academic performance.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <form onSubmit={handleSubmit} className="p-4 xs:p-6 sm:p-8">
            <div className="space-y-6 xs:space-y-8 sm:space-y-12">
              {/* Language and Reading Section */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-xl xs:rounded-2xl p-4 xs:p-6 sm:p-8 border border-green-200 dark:border-green-700/30"
              >
                <div className="flex items-center mb-4 xs:mb-6">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-full p-2 xs:p-3 mr-3 xs:mr-4 shadow-lg"
                  >
                    <svg
                      className="w-5 h-5 xs:w-6 xs:h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </motion.div>
                  <h2 className="text-lg xs:text-xl sm:text-2xl font-bold text-green-800 dark:text-green-200">
                    Language & Reading Skills
                  </h2>
                </div>

                <div className="grid gap-3 xs:gap-4 sm:gap-6">
                  {[
                    {
                      field: 'letterRecognition',
                      title: 'Letter Recognition Difficulty',
                      description: 'Struggles with recognizing letters or learning sounds',
                    },
                    {
                      field: 'phonemicAwareness',
                      title: 'Phonemic Awareness Issues',
                      description: 'Difficulty with identifying individual sounds in words',
                    },
                    {
                      field: 'blendingSegmenting',
                      title: 'Sound Blending Problems',
                      description:
                        'Trouble combining sounds to form words or breaking words into sounds',
                    },
                    {
                      field: 'readingSpeed',
                      title: 'Reading Fluency',
                      description: 'Reads slowly, inaccurately, or with hesitation',
                    },
                    {
                      field: 'spelling',
                      title: 'Spelling & Writing',
                      description: 'Difficulty with correct spelling and written expression',
                    },
                    {
                      field: 'letterConfusion',
                      title: 'Letter Confusion',
                      description: 'Frequently confuses similar-looking letters (b/d, p/q)',
                    },
                  ].map((item, index) => (
                    <motion.div
                      key={item.field}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-lg xs:rounded-xl p-3 xs:p-4 sm:p-5 border border-green-100 dark:border-green-800/30 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <div className="mb-3">
                        <h3 className="text-sm xs:text-sm sm:text-base font-semibold text-green-800 dark:text-green-200 mb-1">
                          {item.title}
                        </h3>
                        <p className="text-xs xs:text-xs sm:text-sm text-green-700 dark:text-green-300 opacity-80">
                          {item.description}
                        </p>
                      </div>
                      {renderRadioOptions('languageReading', item.field)}
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Cognitive Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="space-y-4 xs:space-y-6"
              >
                <div className="flex items-center space-x-2 xs:space-x-3 mb-4 xs:mb-6">
                  <div className="w-10 h-10 xs:w-12 xs:h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg xs:rounded-xl flex items-center justify-center">
                    <svg
                      className="w-5 h-5 xs:w-6 xs:h-6 text-white"
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
                  </div>
                  <h2 className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    Cognitive Abilities
                  </h2>
                </div>

                <div className="grid gap-4 xs:gap-6 sm:gap-8">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl xs:rounded-2xl p-3 xs:p-4 sm:p-6 border border-gray-200/50 dark:border-gray-600/50">
                    <label className="block text-sm xs:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Has difficulty with working memory tasks
                    </label>
                    {renderRadioOptions('cognitive', 'workingMemory')}
                  </div>

                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl xs:rounded-2xl p-3 xs:p-4 sm:p-6 border border-gray-200/50 dark:border-gray-600/50">
                    <label className="block text-sm xs:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Struggles with verbal memory and recall
                    </label>
                    {renderRadioOptions('cognitive', 'verbalMemory')}
                  </div>
                </div>
              </motion.div>

              {/* Academic Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="space-y-4 xs:space-y-6"
              >
                <div className="flex items-center space-x-2 xs:space-x-3 mb-4 xs:mb-6">
                  <div className="w-10 h-10 xs:w-12 xs:h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg xs:rounded-xl flex items-center justify-center">
                    <svg
                      className="w-5 h-5 xs:w-6 xs:h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 14l9-5-9-5-9 5 9 5z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    Academic Performance
                  </h2>
                </div>

                <div className="grid gap-4 xs:gap-6 sm:gap-8">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl xs:rounded-2xl p-3 xs:p-4 sm:p-6 border border-gray-200/50 dark:border-gray-600/50">
                    <label className="block text-sm xs:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Has difficulty with reading comprehension
                    </label>
                    {renderRadioOptions('academic', 'readingComprehension')}
                  </div>

                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl xs:rounded-2xl p-3 xs:p-4 sm:p-6 border border-gray-200/50 dark:border-gray-600/50">
                    <label className="block text-sm xs:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Avoids reading or shows reluctance to read
                    </label>
                    {renderRadioOptions('academic', 'avoidanceReading')}
                  </div>
                </div>
              </motion.div>

              {/* Additional Notes */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="space-y-4 xs:space-y-6"
              >
                <div className="flex items-center space-x-2 xs:space-x-3 mb-4 xs:mb-6">
                  <div className="w-10 h-10 xs:w-12 xs:h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg xs:rounded-xl flex items-center justify-center">
                    <svg
                      className="w-5 h-5 xs:w-6 xs:h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    Additional Notes
                  </h2>
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl xs:rounded-2xl p-3 xs:p-4 sm:p-6 border border-gray-200/50 dark:border-gray-600/50">
                  <label className="block text-sm xs:text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    Any additional observations or concerns (Optional)
                  </label>
                  <textarea
                    name="additionalNotes"
                    value={formData.additionalNotes}
                    onChange={handleTextChange}
                    rows={4}
                    className="w-full px-3 xs:px-4 py-2 xs:py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg xs:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 resize-none text-sm xs:text-sm sm:text-base"
                    placeholder="Please provide any additional context, observations, or specific concerns about the child's reading and learning patterns that might help with the assessment..."
                  />
                </div>
              </motion.div>

              {/* Enhanced Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 }}
                className="flex flex-col sm:flex-row justify-end space-y-3 xs:space-y-4 sm:space-y-0 sm:space-x-4 xs:sm:space-x-6 pt-6 xs:pt-8 border-t border-gray-200 dark:border-gray-700"
              >
                <motion.button
                  type="button"
                  onClick={() => navigate('/assessment')}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto px-6 xs:px-8 py-3 xs:py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg xs:rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-medium xs:font-semibold text-base xs:text-lg shadow-lg hover:shadow-xl"
                >
                  Cancel Assessment
                </motion.button>

                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={!isSubmitting ? { scale: 1.02, y: -2 } : {}}
                  whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                  className="w-full sm:w-auto px-6 xs:px-8 py-3 xs:py-4 bg-gradient-to-r from-green-600 via-green-700 to-emerald-600 hover:from-green-700 hover:via-green-800 hover:to-emerald-700 text-white rounded-lg xs:rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium xs:font-semibold text-base xs:text-lg shadow-xl shadow-green-500/25 hover:shadow-2xl hover:shadow-green-500/40 flex items-center justify-center space-x-2 xs:space-x-3 group min-h-[48px] xs:min-h-[52px]"
                >
                  <AnimatePresence>
                    {isSubmitting && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        className="w-4 h-4 xs:w-5 xs:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
                      />
                    )}
                  </AnimatePresence>
                  <span className="flex items-center gap-1 xs:gap-2">
                    {isSubmitting ? 'Starting Assessment...' : 'Start Dyslexia Assessment'}
                    {!isSubmitting && (
                      <svg
                        className="w-4 h-4 xs:w-5 xs:h-5 group-hover:translate-x-1 transition-transform duration-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    )}
                  </span>
                </motion.button>
              </motion.div>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Enhanced Consent Modal */}
      <ConsentModal
        isOpen={showConsentModal}
        onClose={handleConsentClose}
        onAgree={handleConsentAgree}
        assessmentType="dyslexia"
      />

      {/* Show AssessmentLoader when starting assessment */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <AssessmentLoader
            message="Starting Dyslexia assessment..."
            stage="Analyzing form responses"
            className="bg-white dark:bg-gray-800 rounded-xl xs:rounded-2xl p-6 xs:p-8 shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md"
          />
        </div>
      )}
    </div>
  );
};

export default DyslexiaForm;
