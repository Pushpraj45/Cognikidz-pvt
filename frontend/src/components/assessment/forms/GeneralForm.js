import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import api from '../../../services/api';
import { toast } from 'react-hot-toast';
import ConsentModal from '../../profile/ConsentModal';
import { AssessmentLoader } from '../../ui/LogoLoader';

const GeneralForm = () => {
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
    // Development section
    development: {
      milestones: 1, // 1-5 scale: 1=Never, 5=Always
      playSkills: 1,
      dailyRoutines: 1,
      motorSkills: 1,
    },
    // Cognitive section
    cognitive: {
      attention: 1,
      memory: 1,
      problemSolving: 1,
      learningStyle: 1,
    },
    // Social & Emotional section
    socialEmotional: {
      peerInteractions: 1,
      emotionalRegulation: 1,
      anxiety: 1,
      selfEsteem: 1,
    },
    // Communication section
    communication: {
      expressiveLanguage: 1,
      receptiveLanguage: 1,
      nonVerbalCommunication: 1,
    },
    // Additional notes
    additionalNotes: '',
    // Parent concerns
    parentConcerns: '',
    // Child strengths
    childStrengths: '',
  });

  useEffect(() => {
    const fetchChildData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // Get child profile data
        const response = await api.get(`/api/childprofile/${childId}`);
        console.log('Child profile response:', response.data);

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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-gray-900 dark:to-gray-800 pt-20">
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="rounded-full h-16 w-16 border-4 border-emerald-600 border-t-transparent mb-6"
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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-gray-900 dark:to-gray-800 pt-20 px-4">
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
        assessmentType: 'general',
        formData,
        language: i18n.language || 'en', // Add the current language
      };

      // Add a brief delay to show the loader
      await new Promise(resolve => setTimeout(resolve, 1500));

      const response = await api.post('/api/assessment/start', payload);

      if (response.data.success) {
        toast.success('Assessment started successfully!');

        // Navigate to assessment and trigger full-screen mode
        navigate(`/assessment/${response.data.sessionId}`, {
          state: {
            triggerFullScreen: true,
            sessionId: response.data.sessionId,
          },
        });
      } else {
        throw new Error(response.data.message || 'Failed to start assessment');
      }
    } catch (error) {
      console.error('Error starting assessment:', error);
      toast.error(error.response?.data?.message || 'Failed to start assessment. Please try again.');
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
                ? 'bg-gradient-to-t from-primary/20 to-primary/10 border-2 border-primary shadow-lg scale-105'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 hover:border-primary/30'
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
              backgroundColor: formData[section][field] === option ? '#6366F1' : '#e5e7eb',
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-gray-900 dark:to-gray-800 pt-32 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate('/assessment')}
          className="mb-6 flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:bg-emerald-50 dark:hover:bg-gray-700 transition-all text-emerald-700 dark:text-emerald-200 font-semibold"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          {/* Header Section */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 sm:p-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
                Comprehensive Multi-Disorder Screening
              </h1>
              <p className="text-emerald-100 text-base sm:text-lg">
                Enhanced assessment for {childData.firstName} {childData.lastName}
              </p>
            </motion.div>
          </div>

          {/* Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 sm:p-8 border-b border-gray-200 dark:border-gray-700"
          >
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-4 sm:p-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-emerald-600 dark:text-emerald-400"
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
                  <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-2 text-base sm:text-lg">
                    Assessment Instructions
                  </h3>
                  <p className="text-sm sm:text-base text-emerald-800 dark:text-emerald-200 leading-relaxed">
                    This comprehensive screening evaluates multiple developmental areas including
                    ADHD, Autism, Dyslexia, and general developmental concerns. Rate each item based
                    on your child's typical behavior over the past 6 months.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8">
            <div className="space-y-8 sm:space-y-12">
              {/* Development Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-6"
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center">
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
                        d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    Development
                  </h2>
                </div>

                <div className="grid gap-6 sm:gap-8">
                  <div className="bg-gradient-to-br from-emerald-50 to-cyan-100 dark:from-emerald-900/20 dark:to-cyan-900/20 rounded-2xl p-4 sm:p-6 border border-emerald-200/50 dark:border-emerald-600/50">
                    <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Development Milestones (compared to peers)
                    </label>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2">
                      Rate how your child meets age-appropriate developmental milestones
                    </p>
                    {renderRadioOptions('development', 'milestones', null)}
                  </div>

                  <div className="bg-gradient-to-br from-cyan-50 to-emerald-100 dark:from-cyan-900/20 dark:to-emerald-900/20 rounded-2xl p-4 sm:p-6 border border-cyan-200/50 dark:border-cyan-600/50">
                    <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Play Skills & Imagination
                    </label>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2">
                      Rate your child's play and imaginative abilities
                    </p>
                    {renderRadioOptions('development', 'playSkills', null)}
                  </div>

                  <div className="bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-4 sm:p-6 border border-emerald-200/50 dark:border-emerald-600/50">
                    <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Daily Routines & Self-Help Skills
                    </label>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2">
                      Rate your child's independence with daily routines
                    </p>
                    {renderRadioOptions('development', 'dailyRoutines', null)}
                  </div>

                  <div className="bg-gradient-to-br from-teal-50 to-emerald-100 dark:from-teal-900/20 dark:to-emerald-900/20 rounded-2xl p-4 sm:p-6 border border-teal-200/50 dark:border-teal-600/50">
                    <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Fine & Gross Motor Skills
                    </label>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2">
                      Rate your child's physical coordination and motor abilities
                    </p>
                    {renderRadioOptions('development', 'motorSkills', null)}
                  </div>
                </div>
              </motion.div>

              {/* Cognitive Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-6"
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
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
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    Cognitive Function
                  </h2>
                </div>

                <div className="grid gap-6 sm:gap-8">
                  <div className="bg-gradient-to-br from-purple-50 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-4 sm:p-6 border border-purple-200/50 dark:border-purple-600/50">
                    <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Attention & Focus
                    </label>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2">
                      Rate your child's ability to pay attention and stay focused
                    </p>
                    {renderRadioOptions('cognitive', 'attention', null)}
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-4 sm:p-6 border border-blue-200/50 dark:border-blue-600/50">
                    <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Memory
                    </label>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2">
                      Rate your child's ability to remember information
                    </p>
                    {renderRadioOptions('cognitive', 'memory', null)}
                  </div>

                  <div className="bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-4 sm:p-6 border border-indigo-200/50 dark:border-indigo-600/50">
                    <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Problem-Solving
                    </label>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2">
                      Rate your child's problem-solving and reasoning abilities
                    </p>
                    {renderRadioOptions('cognitive', 'problemSolving', null)}
                  </div>

                  <div className="bg-gradient-to-br from-violet-50 to-indigo-100 dark:from-violet-900/20 dark:to-indigo-900/20 rounded-2xl p-4 sm:p-6 border border-violet-200/50 dark:border-violet-600/50">
                    <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Learning Style
                    </label>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2">
                      Rate how well your child adapts to different learning approaches
                    </p>
                    {renderRadioOptions('cognitive', 'learningStyle', null)}
                  </div>
                </div>
              </motion.div>

              {/* Social & Emotional Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-6"
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-xl flex items-center justify-center">
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
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    Social & Emotional
                  </h2>
                </div>

                <div className="grid gap-6 sm:gap-8">
                  <div className="bg-gradient-to-br from-pink-50 to-rose-100 dark:from-pink-900/20 dark:to-rose-900/20 rounded-2xl p-4 sm:p-6 border border-pink-200/50 dark:border-pink-600/50">
                    <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Peer Interactions
                    </label>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2">
                      Rate your child's ability to interact with peers
                    </p>
                    {renderRadioOptions('socialEmotional', 'peerInteractions', null)}
                  </div>

                  <div className="bg-gradient-to-br from-rose-50 to-pink-100 dark:from-rose-900/20 dark:to-pink-900/20 rounded-2xl p-4 sm:p-6 border border-rose-200/50 dark:border-rose-600/50">
                    <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Emotional Regulation
                    </label>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2">
                      Rate your child's ability to manage emotions
                    </p>
                    {renderRadioOptions('socialEmotional', 'emotionalRegulation', null)}
                  </div>

                  <div className="bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-4 sm:p-6 border border-amber-200/50 dark:border-amber-600/50">
                    <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Anxiety/Worry
                    </label>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2">
                      Rate your child's level of anxiety or worry
                    </p>
                    {renderRadioOptions('socialEmotional', 'anxiety', null)}
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-900/20 dark:to-amber-900/20 rounded-2xl p-4 sm:p-6 border border-orange-200/50 dark:border-orange-600/50">
                    <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Self-Esteem
                    </label>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2">
                      Rate your child's confidence and self-worth
                    </p>
                    {renderRadioOptions('socialEmotional', 'selfEsteem', null)}
                  </div>
                </div>
              </motion.div>

              {/* Communication Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="space-y-6"
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center">
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
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    Communication
                  </h2>
                </div>

                <div className="grid gap-6 sm:gap-8">
                  <div className="bg-gradient-to-br from-teal-50 to-sky-100 dark:from-teal-900/20 dark:to-sky-900/20 rounded-2xl p-4 sm:p-6 border border-teal-200/50 dark:border-teal-600/50">
                    <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Expressive Language (Speaking)
                    </label>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2">
                      Rate your child's ability to express themselves verbally
                    </p>
                    {renderRadioOptions('communication', 'expressiveLanguage', null)}
                  </div>

                  <div className="bg-gradient-to-br from-sky-50 to-teal-100 dark:from-sky-900/20 dark:to-teal-900/20 rounded-2xl p-4 sm:p-6 border border-sky-200/50 dark:border-sky-600/50">
                    <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Receptive Language (Understanding)
                    </label>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2">
                      Rate your child's ability to understand spoken language
                    </p>
                    {renderRadioOptions('communication', 'receptiveLanguage', null)}
                  </div>

                  <div className="bg-gradient-to-br from-cyan-50 to-teal-100 dark:from-cyan-900/20 dark:to-teal-900/20 rounded-2xl p-4 sm:p-6 border border-cyan-200/50 dark:border-cyan-600/50">
                    <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Non-verbal Communication (gestures, expressions)
                    </label>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2">
                      Rate your child's use of non-verbal communication
                    </p>
                    {renderRadioOptions('communication', 'nonVerbalCommunication', null)}
                  </div>
                </div>
              </motion.div>

              {/* Additional Notes */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="space-y-6"
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center">
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
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    Additional Information
                  </h2>
                </div>

                <div className="grid gap-6 sm:gap-8">
                  <div className="bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-900/20 dark:to-amber-900/20 rounded-2xl p-4 sm:p-6 border border-orange-200/50 dark:border-orange-600/50">
                    <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-4">
                      Parent Concerns (Optional)
                    </label>
                    <textarea
                      name="parentConcerns"
                      value={formData.parentConcerns}
                      onChange={handleTextChange}
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 resize-none text-sm sm:text-base"
                      placeholder="Please describe any specific concerns you have about your child's development..."
                    />
                  </div>

                  <div className="bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-4 sm:p-6 border border-amber-200/50 dark:border-amber-600/50">
                    <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-4">
                      Child's Strengths & Interests (Optional)
                    </label>
                    <textarea
                      name="childStrengths"
                      value={formData.childStrengths}
                      onChange={handleTextChange}
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 resize-none text-sm sm:text-base"
                      placeholder="Please describe your child's strengths, talents, and special interests..."
                    />
                  </div>

                  <div className="bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-4 sm:p-6 border border-yellow-200/50 dark:border-yellow-600/50">
                    <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-4">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      name="additionalNotes"
                      value={formData.additionalNotes}
                      onChange={handleTextChange}
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 resize-none text-sm sm:text-base"
                      placeholder="Please add any additional information that might be relevant for the assessment..."
                    />
                  </div>
                </div>
              </motion.div>

              {/* Enhanced Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-6 pt-8 border-t border-gray-200 dark:border-gray-700"
              >
                <motion.button
                  type="button"
                  onClick={() => navigate('/assessment')}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto px-8 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl"
                >
                  Cancel Assessment
                </motion.button>

                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={!isSubmitting ? { scale: 1.02, y: -2 } : {}}
                  whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-white rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg shadow-xl shadow-emerald-500/25 hover:shadow-2xl hover:shadow-emerald-500/40 hover:scale-105 hover:-translate-y-1 flex items-center justify-center space-x-3 group"
                >
                  <AnimatePresence>
                    {isSubmitting && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
                      />
                    )}
                  </AnimatePresence>
                  <span className="flex items-center gap-2">
                    {isSubmitting ? 'Starting Assessment...' : 'Start Comprehensive Assessment'}
                    {!isSubmitting && (
                      <svg
                        className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300"
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
        assessmentType="general"
      />

      {/* Show AssessmentLoader when starting assessment */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
          <AssessmentLoader
            message="Starting comprehensive assessment..."
            stage="Analyzing multi-domain responses"
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-200 dark:border-gray-700"
          />
        </div>
      )}
    </div>
  );
};

export default GeneralForm;
