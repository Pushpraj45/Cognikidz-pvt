import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api'; // Import the configured API service
import { getChildAvatarElement } from '../../utils/nameUtils';
import PaymentCard from './PaymentCard';
import PricingService from '../../services/PricingService';
import { useTranslation } from 'react-i18next';

const ChildSelector = ({ onClose, disorderType }) => {
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showPaymentCard, setShowPaymentCard] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation('assessment');

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        setIsLoading(true);
        // Use the api service which already includes token headers
        const response = await api.get('/api/childprofile');
        console.log('Child profiles response:', response.data);

        if (response.data && Array.isArray(response.data)) {
          const filteredChildren = response.data.filter(child => !child.isDeleted);
          setChildren(filteredChildren);
          if (filteredChildren.length > 0) {
            setSelectedChildId(filteredChildren[0]._id);
          }
        } else {
          // If API call fails or returns unexpected data, use dummy data for multimedia assessments
          if (disorderType && disorderType.includes('-multimedia')) {
            console.log('API failed, using dummy child data for multimedia assessment');
            const dummyChildren = [
              {
                _id: 'dummy-child-1',
                firstName: 'Emma',
                lastName: 'Johnson',
                age: 8,
                gender: 'female',
                dateOfBirth: '2015-03-15',
                avatar: null,
                isDeleted: false,
              },
              {
                _id: 'dummy-child-2',
                firstName: 'Alex',
                lastName: 'Smith',
                age: 10,
                gender: 'male',
                dateOfBirth: '2013-08-22',
                avatar: null,
                isDeleted: false,
              },
            ];
            setChildren(dummyChildren);
            setSelectedChildId(dummyChildren[0]._id);
            toast.info('Using demo child profiles for multimedia assessment');
          } else {
            toast.error('Failed to fetch children profiles');
            console.error('Unexpected response format:', response.data);
          }
        }
      } catch (error) {
        console.error('Error fetching children profiles:', error);

        // For multimedia assessments, provide dummy data as fallback
        if (disorderType && disorderType.includes('-multimedia')) {
          console.log('API error, using dummy child data for multimedia assessment');
          const dummyChildren = [
            {
              _id: 'dummy-child-1',
              firstName: 'Emma',
              lastName: 'Johnson',
              age: 8,
              gender: 'female',
              dateOfBirth: '2015-03-15',
              avatar: null,
              isDeleted: false,
            },
            {
              _id: 'dummy-child-2',
              firstName: 'Alex',
              lastName: 'Smith',
              age: 10,
              gender: 'male',
              dateOfBirth: '2013-08-22',
              avatar: null,
              isDeleted: false,
            },
          ];
          setChildren(dummyChildren);
          setSelectedChildId(dummyChildren[0]._id);
          toast.info('Using demo child profiles for multimedia assessment');
        } else {
          toast.error('Error loading profiles. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchChildren();
  }, [disorderType]);

  const mapDisorderToAssessmentType = type => {
    // Map UI disorderType to pricing assessmentType keys
    const map = {
      autism: 'autism-form',
      asd: 'autism-form',
      adhd: 'adhd-form',
      dyslexia: 'dyslexia-form',
      general: 'general-form',
      'autism-image': 'autism-image',
      'autism-image-assessment': 'autism-image',
      // Multimedia flows map to image-based entitlement
      'autism-multimedia': 'autism-image',
      'asd-multimedia': 'autism-image',
      'adhd-game': 'adhd-game',
      'adhd-interactive': 'adhd-game',
      'dyslexia-game': 'dyslexia-game',
      'dyslexia-interactive': 'dyslexia-game',
    };
    return map[type] || 'general-form';
  };

  const handleStartAssessment = async () => {
    if (!selectedChildId) {
      toast.error(t('toasts.select_child'));
      return;
    }
    try {
      const assessmentType = mapDisorderToAssessmentType(disorderType);
      // Check user access; if allowed, navigate directly
      const access = await PricingService.checkUserAccess(assessmentType);
      if (access?.success && access?.hasAccess) {
        // Navigate directly to assessment
        if (disorderType === 'dyslexia-interactive' || disorderType === 'dyslexia-game') {
          navigate(`/assessment/games/dyslexia?childId=${selectedChildId}`);
        } else if (disorderType === 'adhd-interactive' || disorderType === 'adhd-game') {
          navigate(`/assessment/games/adhd?childId=${selectedChildId}`);
        } else if (disorderType && disorderType.includes('-multimedia')) {
          navigate(`/assessment/${disorderType}/form/${selectedChildId}`);
        } else {
          navigate(`/assessment/${disorderType}/form/${selectedChildId}`);
        }
        return;
      }
      // Show toast and redirect before entering any image privacy/consent screens
      toast.error(t('toasts.purchase_required'));
      navigate('/pricing', {
        state: { pricingType: 'individual', blockedAssessment: assessmentType },
      });
    } catch (e) {
      console.error('Access check failed:', e);
      toast.error(t('toasts.verify_failed'));
    }
  };

  const handlePaymentComplete = () => {
    // Payment completed and navigation will happen in PaymentCard
    // No need to close modals as navigation will handle it
  };

  const handleClosePaymentCard = () => {
    setShowPaymentCard(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="glassmorphism-card rounded-xl shadow-colored-lg max-w-md w-full p-6"
        >
          {isLoading ? (
            <div className="py-8 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full glassmorphism-primary flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary animate-spin rounded-full"></div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mt-4">{t('child_selector.loading')}</p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center">
                <div className="w-8 h-8 glassmorphism-accent mr-3 rounded-full flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-accent"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                {t('child_selector.title')}
              </h2>

              {children.length === 0 ? (
                <div className="py-6 text-center glassmorphism rounded-xl p-6 my-4">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {t('child_selector.no_profiles')}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={onClose}
                      className="glassmorphism px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300"
                    >
                      {t('child_selector.cancel')}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate('/add-child')}
                      className="glassmorphism-primary px-4 py-2 rounded-lg text-gray-800 dark:text-white font-medium shadow-colored-sm"
                    >
                      {t('child_selector.create_child')}
                    </motion.button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-3 my-4 max-h-60 overflow-y-auto pr-1">
                    {children.map((child, index) => (
                      <motion.div
                        key={child._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => setSelectedChildId(child._id)}
                        className={`p-3 backdrop-blur-sm rounded-lg cursor-pointer flex items-center transition-all duration-300 ${
                          selectedChildId === child._id
                            ? 'glassmorphism-primary shadow-colored-sm'
                            : 'glassmorphism-hover'
                        }`}
                      >
                        <div className="rounded-full overflow-hidden h-12 w-12 flex-shrink-0 border-2 border-white/50 dark:border-gray-700/50">
                          {getChildAvatarElement(child, 'h-12 w-12')}
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-gray-800 dark:text-white">
                            {child.firstName}{' '}
                            {child.lastName && child.lastName !== 'N/A' && child.lastName !== 'NA'
                              ? child.lastName
                              : ''}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Age:{' '}
                            {(() => {
                              const birthDate = child.dateOfBirth || child.birthdate;
                              if (birthDate) {
                                const birth = new Date(birthDate);
                                const now = new Date();
                                let age = now.getFullYear() - birth.getFullYear();
                                const monthDiff = now.getMonth() - birth.getMonth();
                                if (
                                  monthDiff < 0 ||
                                  (monthDiff === 0 && now.getDate() < birth.getDate())
                                ) {
                                  age--;
                                }
                                return t('child_selector.age_years', { count: age });
                              }
                              return child.age || 'Unknown';
                            })()}
                          </p>
                        </div>
                        {selectedChildId === child._id && (
                          <div className="ml-auto">
                            <div className="h-6 w-6 bg-primary/20 rounded-full flex items-center justify-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 text-primary"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={onClose}
                      className="glassmorphism px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300"
                    >
                      {t('child_selector.cancel')}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleStartAssessment}
                      className="glassmorphism-primary px-4 py-2 rounded-lg text-gray-800 dark:text-white font-medium shadow-colored-sm"
                    >
                      {t('child_selector.continue')}
                    </motion.button>
                  </div>
                </>
              )}
            </>
          )}
        </motion.div>
      </motion.div>

      {/* Payment Card */}
      {showPaymentCard && (
        <PaymentCard
          onClose={handleClosePaymentCard}
          disorderType={disorderType}
          selectedChild={children.find(child => child._id === selectedChildId)}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </AnimatePresence>
  );
};

export default ChildSelector;
