import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  CreditCardIcon,
  CurrencyDollarIcon,
  CurrencyRupeeIcon,
  CheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { SimpleSpinner } from '../ui/LogoLoader';

const PaymentCard = ({ onClose, disorderType, selectedChild, onPaymentComplete }) => {
  // Map UI disorder types to backend/pricing keys
  const TYPE_MAP = {
    adhd: 'adhd',
    asd: 'autism',
    autism: 'autism',
    dyslexia: 'dyslexia',
    general: 'general',
    'autism-image': 'autism-image',
    'autism-image-assessment': 'autism-image',
    'adhd-interactive': 'adhd-game',
    'adhd-game': 'adhd-game',
    'dyslexia-interactive': 'dyslexia-game',
    'dyslexia-game': 'dyslexia-game',
  };
  const savedCurrency =
    typeof window !== 'undefined' ? localStorage.getItem('currency_pref') : null;
  const [currency, setCurrency] = useState(savedCurrency || 'INR');
  const [isProcessing, setIsProcessing] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [activeCoupons, setActiveCoupons] = useState([]);
  const navigate = useNavigate();

  // Pricing configuration
  const getPricing = () => {
    const pricing = {
      adhd: { INR: 199, USD: 4.99, name: 'ADHD Screening' },
      autism: { INR: 199, USD: 4.99, name: 'Autism Screening' },
      dyslexia: { INR: 199, USD: 4.99, name: 'Dyslexia Screening' },
      general: { INR: 0, USD: 0, name: 'Comprehensive Multi Disorder' },
      'autism-image': { INR: 249, USD: 5.99, name: 'Autism Image Assessment' },
      'adhd-game': { INR: 299, USD: 6.99, name: 'Interactive ADHD Games' },
      'dyslexia-game': { INR: 299, USD: 6.99, name: 'Interactive Dyslexia Games' },
    };

    const pricingKey = TYPE_MAP[disorderType] || 'adhd';
    return pricing[pricingKey];
  };

  const pricing = getPricing();
  const isFree = pricing.INR === 0;

  // Load active coupons
  useEffect(() => {
    (async () => {
      try {
        const svc = (await import('../../services/PricingService')).default;
        const res = await svc.getActiveCoupons();
        if (res?.success) setActiveCoupons(res.data || []);
      } catch (e) {}
    })();
  }, []);

  const handlePayment = async () => {
    if (isFree) {
      // For free assessments, proceed directly
      handlePaymentComplete();
      return;
    }

    setIsProcessing(true);

    try {
      const PricingService = (await import('../../services/PricingService')).default;
      const payload = {
        purchaseType: 'individual',
        assessmentType: TYPE_MAP[disorderType] || disorderType,
        currency,
        discountCode: coupon || undefined,
      };
      const { success, data, message } = await PricingService.initiateRazorpayOrder(payload);
      if (!success) throw new Error(message || 'Failed to initiate payment');
      // Razorpay checkout open (omitted for brevity). On success, verify payment then navigate.
      toast.success('Order created. Complete payment in checkout...');
    } catch (e) {
      console.error('Payment init failed:', e);
      toast.error(e.message || 'Unable to start payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentComplete = () => {
    // Always navigate to assessment after payment
    if (disorderType === 'dyslexia-interactive' || disorderType === 'dyslexia-game') {
      navigate(`/assessment/games/dyslexia?childId=${selectedChild._id}`);
    } else if (disorderType === 'adhd-interactive' || disorderType === 'adhd-game') {
      navigate(`/assessment/games/adhd?childId=${selectedChild._id}`);
    } else if (disorderType && disorderType.includes('-multimedia')) {
      navigate(`/assessment/${disorderType}/form/${selectedChild._id}`);
    } else {
      navigate(`/assessment/${disorderType}/form/${selectedChild._id}`);
    }

    // Call onPaymentComplete callback if provided
    if (onPaymentComplete) {
      onPaymentComplete();
    }
  };

  const formatPrice = price => {
    if (price === 0) return 'Free';
    return currency === 'INR' ? `₹${price}` : `$${price}`;
  };

  const getAssessmentIcon = () => {
    switch (disorderType) {
      case 'adhd':
      case 'adhd-interactive':
      case 'adhd-game':
        return '⚡';
      case 'autism':
      case 'asd':
      case 'autism-image':
      case 'autism-image-assessment':
        return '🧩';
      case 'dyslexia':
      case 'dyslexia-interactive':
      case 'dyslexia-game':
        return '📚';
      case 'general':
        return '🔍';
      default:
        return '📋';
    }
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
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">{getAssessmentIcon()}</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Assessment Payment
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Complete payment to start the assessment
            </p>
          </div>

          {/* Assessment Details */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{pricing.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Assessment for {selectedChild?.firstName || 'Child'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {formatPrice(currency === 'INR' ? pricing.INR : pricing.USD)}
                </div>
                {!isFree && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">One-time payment</div>
                )}
              </div>
            </div>
          </div>

          {/* Currency Toggle */}
          {!isFree && (
            <div className="flex items-center justify-center gap-4 mb-6">
              <button
                onClick={() => {
                  setCurrency('INR');
                  localStorage.setItem('currency_pref', 'INR');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                  currency === 'INR'
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <CurrencyRupeeIcon className="h-4 w-4" />
                <span>INR</span>
              </button>
              <button
                onClick={() => {
                  setCurrency('USD');
                  localStorage.setItem('currency_pref', 'USD');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                  currency === 'USD'
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <CurrencyDollarIcon className="h-4 w-4" />
                <span>USD</span>
              </button>
            </div>
          )}

          {/* Coupon Entry */}
          {!isFree && (
            <div className="mb-4">
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                Coupon Code
              </label>
              <div className="flex gap-2">
                <input
                  value={coupon}
                  onChange={e => setCoupon(e.target.value)}
                  placeholder="Enter code"
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                />
                {activeCoupons && activeCoupons.length > 0 && (
                  <div className="text-xs text-gray-500 self-center">
                    Active:{' '}
                    {activeCoupons.map(c => `${c.code} (-${c.discountPercentage}%)`).join(', ')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Features List */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <SparklesIcon className="h-4 w-4 mr-2 text-primary" />
              What's included:
            </h4>
            <ul className="space-y-2">
              <li className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                Professional assessment evaluation
              </li>
              <li className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                Detailed assessment report
              </li>
              <li className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                Expert recommendations
              </li>
              <li className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                30-day access to results
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="glassmorphism px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300"
            >
              Back to Child Selection
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePayment}
              disabled={isProcessing}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all duration-300 ${
                isFree
                  ? 'bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white'
                  : 'bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isProcessing ? (
                <>
                  <SimpleSpinner size="small" className="text-white" />
                  Processing...
                </>
              ) : isFree ? (
                <>
                  <CheckIcon className="h-4 w-4" />
                  Start Free Assessment
                </>
              ) : (
                <>
                  <CreditCardIcon className="h-4 w-4" />
                  Pay & Start Assessment
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PaymentCard;
