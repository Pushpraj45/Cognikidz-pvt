import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  CheckIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  CurrencyRupeeIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import TranslatedText from '../ui/TranslatedText';
import PricingService from '../../services/PricingService';
import { toast } from 'react-hot-toast';
import { SimpleSpinner } from '../ui/LogoLoader';

const AssessmentPricingModal = ({
  isOpen,
  onClose,
  assessmentType,
  onProceed,
  childId,
  assessmentName,
}) => {
  const { user } = useAuth();
  const [currency, setCurrency] = useState('INR');
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [accessCheck, setAccessCheck] = useState(null);

  useEffect(() => {
    if (isOpen && assessmentType) {
      loadPricingData();
      checkUserAccess();
    }
  }, [isOpen, assessmentType]);

  const loadPricingData = async () => {
    try {
      const response = await PricingService.getAssessmentPrice(assessmentType);
      setPricing(response.data);
    } catch (error) {
      console.error('Error loading pricing:', error);
      toast.error('Failed to load pricing information');
    }
  };

  const checkUserAccess = async () => {
    try {
      const response = await PricingService.checkUserAccess(assessmentType);
      setAccessCheck(response);
    } catch (error) {
      console.error('Error checking access:', error);
    }
  };

  const handlePurchase = async () => {
    if (!user) {
      toast.error('Please login to purchase assessments');
      return;
    }

    setLoading(true);
    try {
      const purchaseData = {
        purchaseType: 'individual',
        assessmentType: assessmentType,
        amount: currency === 'INR' ? pricing.priceINR : pricing.priceUSD,
        currency: currency,
        paymentMethod: 'admin-granted', // For now, using admin-granted
      };

      await PricingService.createPurchase(purchaseData);
      toast.success('Purchase completed successfully!');
      onProceed();
    } catch (error) {
      console.error('Error creating purchase:', error);
      toast.error('Failed to complete purchase');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (priceINR, priceUSD) => {
    if (currency === 'INR') {
      return `₹${priceINR}`;
    } else {
      return `$${priceUSD}`;
    }
  };

  const getAssessmentIcon = type => {
    const icons = {
      'adhd-form': '🧠',
      'autism-form': '🌟',
      'dyslexia-form': '📚',
      'general-form': '📋',
      'autism-image': '🖼️',
      'adhd-game': '🎮',
      'dyslexia-game': '🎯',
      'autism-game': '🎪',
    };
    return icons[type] || '📊';
  };

  const getAssessmentColor = type => {
    const colors = {
      'adhd-form': 'from-blue-500 to-indigo-600',
      'autism-form': 'from-purple-500 to-violet-600',
      'dyslexia-form': 'from-green-500 to-emerald-600',
      'general-form': 'from-gray-500 to-gray-600',
      'autism-image': 'from-pink-500 to-rose-600',
      'adhd-game': 'from-orange-500 to-red-600',
      'dyslexia-game': 'from-teal-500 to-cyan-600',
      'autism-game': 'from-indigo-500 to-purple-600',
    };
    return colors[type] || 'from-primary to-secondary';
  };

  // If user already has access, show success message
  if (accessCheck?.hasAccess) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 relative"
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>

              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckIcon className="h-10 w-10 text-white" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  <TranslatedText>Access Granted!</TranslatedText>
                </h2>

                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  <TranslatedText>
                    You already have access to this assessment. You can proceed directly.
                  </TranslatedText>
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold py-3 px-6 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <TranslatedText>Cancel</TranslatedText>
                  </button>
                  <button
                    onClick={onProceed}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300"
                  >
                    <TranslatedText>Start Assessment</TranslatedText>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-8 relative"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>

            <div className="text-center">
              {/* Assessment Icon */}
              <div
                className={`w-20 h-20 bg-gradient-to-br ${getAssessmentColor(assessmentType)} rounded-full flex items-center justify-center mx-auto mb-6`}
              >
                <span className="text-3xl">{getAssessmentIcon(assessmentType)}</span>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {assessmentName || 'Assessment'}
              </h2>

              <p className="text-gray-600 dark:text-gray-300 mb-6">
                <TranslatedText>
                  This assessment requires a one-time purchase to access professional insights and
                  detailed reports.
                </TranslatedText>
              </p>

              {/* Pricing Display */}
              {pricing && (
                <div className="bg-gradient-to-br from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20 rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <button
                      onClick={() => setCurrency('INR')}
                      className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-all duration-300 ${
                        currency === 'INR'
                          ? 'bg-primary text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <CurrencyRupeeIcon className="h-4 w-4" />
                      <span>INR</span>
                    </button>
                    <button
                      onClick={() => setCurrency('USD')}
                      className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-all duration-300 ${
                        currency === 'USD'
                          ? 'bg-primary text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <CurrencyDollarIcon className="h-4 w-4" />
                      <span>USD</span>
                    </button>
                  </div>

                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">
                      {formatPrice(pricing.priceINR, pricing.priceUSD)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      {pricing.duration}
                    </div>

                    <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                      {pricing.features.slice(0, 3).map((feature, idx) => (
                        <div key={idx} className="flex items-center justify-center">
                          <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold py-3 px-6 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <TranslatedText>Cancel</TranslatedText>
                </button>
                <button
                  onClick={handlePurchase}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <SimpleSpinner size="small" className="text-white" />
                      <TranslatedText>Processing...</TranslatedText>
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-4 w-4" />
                      <TranslatedText>Purchase & Start</TranslatedText>
                    </>
                  )}
                </button>
              </div>

              {/* Additional Info */}
              <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">
                <TranslatedText>
                  * One-time purchase. Access includes detailed reports and professional insights.
                </TranslatedText>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AssessmentPricingModal;
