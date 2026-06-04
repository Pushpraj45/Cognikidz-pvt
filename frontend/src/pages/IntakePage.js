import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import IntakeForm from '../components/assessment/IntakeForm';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { FADE_UP } from '../utils/animations';
import { toast } from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { LanguageContext } from '../contexts/LanguageContext';
import TranslatedText from '../components/ui/TranslatedText';

/**
 * Intake Page Component
 *
 * This page allows users to fill out an intake form for a child assessment.
 * Once the form is submitted, the user can start the assessment directly.
 */
const IntakePage = () => {
  const navigate = useNavigate();
  const [intakeCompleted, setIntakeCompleted] = useState(false);
  const [intakeId, setIntakeId] = useState(null);
  const { language } = useContext(LanguageContext);

  // Handle successful submission of the intake form
  const handleIntakeSuccess = data => {
    setIntakeId(data._id || data.intakeId || (data.data && (data.data._id || data.data.intakeId)));
    setIntakeCompleted(true);
    toast.success('Intake information saved successfully!');
  };

  // Start the assessment process with the completed intake
  const startAssessment = () => {
    if (!intakeId) {
      toast.error('No intake ID available. Please try again.');
      return;
    }

    // Save the intake ID to localStorage as a backup
    localStorage.setItem('lastIntakeId', intakeId);

    // 🔍 DEBUG: Log language parameter flow from IntakePage
    console.log('🔍 [LANGUAGE DEBUG] IntakePage Language Flow:', {
      component: 'IntakePage',
      method: 'startAssessment',
      intakeId,
      contextLanguage: language,
      languageType: typeof language,
      languageUndefined: language === undefined,
      languageNull: language === null,
      hasLanguage: language !== undefined && language !== null,
      languageValue: language
    });

    // Navigate to the assessment with the intake ID and language as query parameters
    // The assessment page will handle starting the actual assessment
    navigate(`/assessment?intakeId=${intakeId}&language=${encodeURIComponent(language || 'en')}`);
  };

  return (
    <div className="bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 min-h-screen py-20">
      <Helmet>
        <title>Assessment Intake | Cognikidz</title>
        <meta name="description" content="Complete this form to start your child's assessment" />
      </Helmet>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={FADE_UP}
        className="container mx-auto px-4"
      >
        {intakeCompleted ? (
          <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md text-center">
            <h1 className="text-3xl font-bold text-green-600 mb-6">Assessment Intake Completed!</h1>
            <p className="text-lg mb-8">
              Thank you for providing this information. We're now ready to start your child's
              personalized assessment.
            </p>
            <button
              onClick={startAssessment}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-lg"
            >
              Start Assessment Now
            </button>
            <p className="mt-4 text-sm text-gray-600">
              You can also return to this assessment later from your dashboard.
            </p>
          </div>
        ) : (
          <>
            <div className="max-w-4xl mx-auto mb-8 text-center">
              <h1 className="text-3xl font-bold mb-4">Assessment Intake</h1>
              <p className="text-gray-600">
                Please complete this form to help us create a personalized assessment for your
                child. This information will help us better understand your child's needs and
                abilities.
              </p>
            </div>

            <IntakeForm onSuccess={handleIntakeSuccess} />
          </>
        )}
      </motion.div>
    </div>
  );
};

export default IntakePage;
