import React, { useState, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FullScreenProvider } from '../../contexts/FullScreenContext';
import FullScreenButton from '../ui/FullScreenButton';
import { LanguageContext } from '../../contexts/LanguageContext';

const AssessmentLayout = ({
  children,
  title = 'Assessment',
  currentStep = 1,
  totalSteps = 1,
  onNext = () => {},
  onPrevious = () => {},
  canGoNext = true,
  isSubmitting = false,
  isLastStep = false,
  childName = 'Child',
  assessmentType = 'general',
  onExit = () => {},
  enableFullScreen = true,
}) => {
  const navigate = useNavigate();
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const layoutRef = useRef(null);

  // Get current language from context
  const { language } = useContext(LanguageContext);

  // Display child name exactly as provided without any cleaning
  const getDisplayChildName = () => {
    return childName || 'Child';
  };

  const handleExit = () => {
    setShowExitConfirm(true);
  };

  const handleConfirmExit = () => {
    setShowExitConfirm(false);
    if (onExit) {
      onExit();
    } else {
      navigate('/assessments');
    }
  };

  const progress = totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0;

  return (
    <FullScreenProvider autoEnter={enableFullScreen} targetElement={layoutRef.current}>
      <div
        ref={layoutRef}
        className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pt-20 pb-8"
      >
        {/* Full Screen Button */}
        <FullScreenButton position="top-right" variant="primary" size="medium" showLabel={true} />

        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-blue-600/20 rounded-full blur-3xl"></div>
        </div>

        <div className="container max-w-5xl mx-auto relative z-10 px-4 sm:px-6 lg:px-8">
          {/* Progress Bar */}
          {totalSteps > 1 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {language === 'hi' ? 'चरण' : 'Step'} {currentStep}{' '}
                  {language === 'hi' ? 'का' : 'of'} {totalSteps}
                </span>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {progress}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </motion.div>
          )}

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {children}
          </motion.div>
        </div>

        {/* Exit Confirmation Modal */}
        {showExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {language === 'hi' ? 'आकलन से बाहर निकलें?' : 'Exit Assessment?'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {language === 'hi'
                  ? 'क्या आप वाकई बाहर निकलना चाहते हैं? आपकी प्रगति सहेजी जाएगी, लेकिन आपको आकलन पूरा करने के लिए बाद में फिर से शुरू करना होगा।'
                  : "Are you sure you want to exit? Your progress will be saved, but you'll need to resume later to complete the assessment."}
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  onClick={handleConfirmExit}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  {language === 'hi' ? 'आकलन से बाहर निकलें' : 'Exit Assessment'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </FullScreenProvider>
  );
};

export default AssessmentLayout;
