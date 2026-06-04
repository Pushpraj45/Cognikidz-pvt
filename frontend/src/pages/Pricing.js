import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  CheckIcon,
  StarIcon,
  SparklesIcon,
  AcademicCapIcon,
  BeakerIcon,
  ChartBarIcon,
  HeartIcon,
  BoltIcon,
  ArrowRightIcon,
  CurrencyDollarIcon,
  CurrencyRupeeIcon,
  GiftIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import TranslatedText from '../components/ui/TranslatedText';
import LogoLoader from '../components/ui/LogoLoader';
import { useTranslation } from 'react-i18next';
import PricingService from '../services/PricingService';
import { toast } from 'react-hot-toast';

// Enhanced Glass morphism components
const GlassMorphism = ({ children, className = '', delay = 0, colorAccent = 'primary' }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.97 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    className={`glassmorphism-card rounded-xl shadow-colored-lg hover:shadow-colored-xl transition-all duration-300 hover:translate-y-[-2px] ${className}`}
  >
    <div className="relative">
      <div
        className={`absolute inset-0 bg-gradient-to-br from-${colorAccent}/3 to-transparent rounded-xl`}
      ></div>
      <div className="relative z-10">{children}</div>
    </div>
  </motion.div>
);

// Animated gradient text
const AnimatedGradientText = ({ children, className = '' }) => (
  <span
    className={`bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-gradient bg-300% ${className}`}
  >
    {children}
  </span>
);

// Badge component
const Badge = ({ children, icon: Icon, className = '' }) => (
  <div
    className={`inline-flex items-center mb-6 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full pl-1 pr-4 py-1 shadow-lg hover:shadow-xl transition-all duration-300 ${className}`}
  >
    <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full w-7 h-7 flex items-center justify-center mr-3">
      <Icon className="h-4 w-4" />
    </span>
    <span className="text-blue-700 dark:text-blue-300 text-sm font-semibold tracking-wide">
      {children}
    </span>
  </div>
);

const Pricing = () => {
  const { t } = useTranslation(['pricing', 'common', 'assessment']);
  const { currentUser, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [pricingType, setPricingType] = useState('individual');
  const [currency, setCurrency] = useState('INR');
  const [assessmentPricing, setAssessmentPricing] = useState([]);
  const [comboPackages, setComboPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [disorderFilter, setDisorderFilter] = useState('all');
  const [isPayLoading, setIsPayLoading] = useState(false);
  const [entitlements, setEntitlements] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null); // { title, type, item }
  const [buyAgainAvailable, setBuyAgainAvailable] = useState(false);
  const [buyAgainPayload, setBuyAgainPayload] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [purchasesLoaded, setPurchasesLoaded] = useState(false);

  useEffect(() => {
    loadPricingData();

    // Handle pricing type from navigation state
    if (location.state?.pricingType) {
      setPricingType(location.state.pricingType);
    }
    // Prewarm Razorpay
    loadRazorpayScript();
    // Load entitlements
    (async () => {
      try {
        const res = await PricingService.getUserEntitlements();
        if (res?.success) setEntitlements(res.data);
      } catch (e) {}
    })();
    // Load last purchase
    try {
      const last = localStorage.getItem('last_purchase');
      if (last) {
        const payload = JSON.parse(last);
        setBuyAgainPayload(payload);
        setBuyAgainAvailable(true);
      }
    } catch (e) {}
  }, [location.state]);

  useEffect(() => {
    const loadPurchases = async () => {
      if (!isLoggedIn) return;
      try {
        const res = await PricingService.getUserPurchases();
        if (res?.success) setPurchases(res.data || []);
      } catch (e) {
        // ignore silently
      } finally {
        setPurchasesLoaded(true);
      }
    };
    loadPurchases();
  }, [isLoggedIn]);

  const loadPricingData = async () => {
    try {
      setLoading(true);
      const [pricingResponse, packagesResponse] = await Promise.all([
        PricingService.getAssessmentPricing(),
        PricingService.getComboPackages(),
      ]);

      const pricing = pricingResponse.data || [];
      const packages = packagesResponse.data || [];

      // Sort assessments: general first, then autism, ADHD, dyslexia
      const sortedPricing = pricing
        .filter(assessment => assessment.assessmentType !== 'autism-game') // Remove autism-game assessment
        .sort((a, b) => {
          const order = {
            'general-form': 1,
            'autism-form': 2,
            'autism-image': 3,
            'adhd-form': 4,
            'adhd-game': 5,
            'dyslexia-form': 6,
            'dyslexia-game': 7,
          };
          return (order[a.assessmentType] || 999) - (order[b.assessmentType] || 999);
        });

      // Sort combo packages in specific order
      const packageOrder = {
        'autism-essential': 1,
        'adhd-core': 2,
        'dyslexia-core': 3,
        'general-neuro-check': 4,
        'dual-insight-pack': 5,
        'all-inclusive-pack': 6,
      };

      const sortedPackages = packages
        .filter(pkg => pkg.packageId !== 'autism-advanced') // Remove autism-advanced package
        .sort((a, b) => {
          return (packageOrder[a.packageId] || 999) - (packageOrder[b.packageId] || 999);
        });

      setAssessmentPricing(sortedPricing);
      setComboPackages(sortedPackages);
    } catch (error) {
      console.error('Error loading pricing data:', error);
      toast.error('Failed to load pricing information');
    } finally {
      setLoading(false);
    }
  };

  // Dynamically load Razorpay checkout script
  const loadRazorpayScript = () =>
    new Promise(resolve => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const startRazorpayCheckout = async (item, type) => {
    setIsPayLoading(true);
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      toast.error('Payment SDK failed to load. Please check your internet connection.');
      setIsPayLoading(false);
      return;
    }

    try {
      // Create order on backend
      const payload = {
        purchaseType: type,
        currency,
      };
      if (type === 'combo') payload.packageId = item.packageId;
      else payload.assessmentType = item.assessmentType;

      // Save last purchase intent
      try {
        localStorage.setItem('last_purchase', JSON.stringify(payload));
      } catch (e) {}

      const { success, data, message } = await PricingService.initiateRazorpayOrder(payload);
      if (!success) {
        toast.error(message || 'Failed to initiate payment');
        setIsPayLoading(false);
        return;
      }

      const { keyId, order, purchaseId, title } = data;

      const userName =
        currentUser?.name ||
        `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() ||
        'CogniKidz User';

      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'CogniKidz',
        description: title || 'Assessment Purchase',
        order_id: order.id,
        prefill: {
          name: userName,
          email: currentUser?.email || '',
        },
        notes: {
          purchaseId,
          purchaseType: type,
          assessmentType: item.assessmentType || '',
          packageId: item.packageId || '',
        },
        theme: { color: '#4F46E5' },
        handler: async function (response) {
          try {
            const verifyRes = await PricingService.verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            if (verifyRes?.success) {
              // Show success overlay with deep link
              setSuccessInfo({ title: title || 'Assessment Purchase', type, item });
              setShowSuccess(true);
            } else {
              toast.error(verifyRes?.message || 'Payment verification failed');
            }
          } catch (err) {
            console.error('Payment verify error:', err);
            toast.error('Payment verification failed');
          } finally {
            setIsPayLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            toast('Payment cancelled');
            setIsPayLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      setTimeout(() => {
        rzp.open();
      }, 500);
    } catch (error) {
      console.error('Razorpay checkout error:', error);
      toast.error('Unable to start payment');
      setIsPayLoading(false);
    }
  };

  const formatPrice = (priceINR, priceUSD, assessmentType) => {
    // Show general assessment as free
    if (assessmentType === 'general-form') {
      return currency === 'INR' ? 'Free' : 'Free';
    }

    if (currency === 'INR') {
      return `₹${priceINR}`;
    } else {
      return `$${priceUSD}`;
    }
  };

  const formatSavings = (savingsINR, savingsUSD) => {
    if (currency === 'INR') {
      return `₹${savingsINR}`;
    } else {
      return `$${savingsUSD}`;
    }
  };

  const handlePurchase = async (item, type = 'individual') => {
    if (!isLoggedIn || !currentUser) {
      toast.error('Please login to purchase assessments');
      navigate('/login');
      return;
    }

    // If general assessment is free, allow access directly without admin endpoint
    if (type === 'individual' && item.assessmentType === 'general-form') {
      toast.success('Free access granted! You can now start the assessment.');
      navigate('/assessment');
      return;
    }

    // Paid assessments: start Razorpay checkout
    await startRazorpayCheckout(item, type);
  };

  const hasPurchasedAssessment = assessmentType => {
    if (!purchases?.length) return false;
    const direct = purchases.some(
      p =>
        p.purchaseType === 'individual' &&
        p.assessmentType === assessmentType &&
        p.paymentStatus === 'completed'
    );
    if (direct) return true;
    // Check combo ownership
    const ownedPackageIds = new Set(
      purchases
        .filter(p => p.purchaseType === 'combo' && p.paymentStatus === 'completed')
        .map(p => p.packageId)
    );
    if (!ownedPackageIds.size) return false;
    return comboPackages.some(
      pkg =>
        ownedPackageIds.has(pkg.packageId) &&
        pkg.includedAssessments?.some(a => a.assessmentType === assessmentType)
    );
  };

  const hasPurchasedPackage = packageId => {
    if (!purchases?.length) return false;
    return purchases.some(
      p =>
        p.purchaseType === 'combo' && p.packageId === packageId && p.paymentStatus === 'completed'
    );
  };

  const getCategoryIcon = category => {
    switch (category) {
      case 'form-based':
        return <AcademicCapIcon className="h-6 w-6" />;
      case 'image-based':
        return <BeakerIcon className="h-6 w-6" />;
      case 'game-based':
        return <ChartBarIcon className="h-6 w-6" />;
      default:
        return <SparklesIcon className="h-6 w-6" />;
    }
  };

  const getCategoryColor = category => {
    switch (category) {
      case 'form-based':
        return 'from-blue-500 to-indigo-600';
      case 'image-based':
        return 'from-green-500 to-emerald-600';
      case 'game-based':
        return 'from-purple-500 to-violet-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const isFreeAssessment = assessmentType => {
    return assessmentType === 'general-form';
  };

  // Helper function to get disorder category from assessment type
  const getDisorderCategory = assessmentType => {
    if (assessmentType.includes('autism')) return 'autism';
    if (assessmentType.includes('adhd')) return 'adhd';
    if (assessmentType.includes('dyslexia')) return 'dyslexia';
    if (assessmentType === 'general-form') return 'general';
    return 'other';
  };

  const remainingForAssessment = assessmentType => {
    const base = getDisorderCategory(assessmentType);
    if (!entitlements || !['autism', 'adhd', 'dyslexia'].includes(base)) return null;
    const rem = entitlements[base]?.remaining;
    return typeof rem === 'number' ? rem : null;
  };

  const computeStartLink = (type, item) => {
    if (type === 'combo') return '/dashboard?tab=assessments';
    const at = item?.assessmentType;
    if (at === 'general-form') return '/assessment';
    const base = getDisorderCategory(at);
    if (base && base !== 'other') return `/assessment/${base}/form`;
    return '/assessment';
  };

  const handleAddToCalendar = () => {
    try {
      const title = successInfo?.title || 'CogniKidz Assessment';
      const dt = new Date();
      const end = new Date(dt.getTime() + 30 * 60000);
      const fmt = d => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTAMP:${fmt(dt)}\nDTSTART:${fmt(dt)}\nDTEND:${fmt(end)}\nSUMMARY:${title}\nDESCRIPTION=Complete your assessment on CogniKidz\nEND:VEVENT\nEND:VCALENDAR`;
      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cognikidz-assessment.ics';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {}
  };

  // Filter assessments based on selected disorder
  const getFilteredAssessments = () => {
    if (disorderFilter === 'all') {
      return assessmentPricing;
    }
    return assessmentPricing.filter(
      assessment => getDisorderCategory(assessment.assessmentType) === disorderFilter
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background dark:bg-dark-background flex items-center justify-center">
        <LogoLoader size="large" message="Loading pricing information..." showMessage={true} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-dark-background relative overflow-hidden">
      {/* Enhanced background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial from-primary/5 to-transparent opacity-60 dark:opacity-30"></div>
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-radial from-secondary/10 to-transparent rounded-full dark:from-secondary/5"></div>
        <div className="absolute bottom-40 left-20 w-[600px] h-[600px] bg-gradient-radial from-accent/10 to-transparent rounded-full dark:from-accent/5"></div>
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-gradient-radial from-primary/8 to-transparent rounded-full dark:from-primary/4"></div>

        {/* Decorative dots */}
        <div className="absolute top-[30%] left-[15%] w-3 h-3 bg-primary rounded-full animate-pulse-light"></div>
        <div className="absolute top-[25%] right-[10%] w-2 h-2 bg-accent rounded-full animate-pulse-light"></div>
        <div className="absolute top-[80%] right-[30%] w-2 h-2 bg-secondary rounded-full animate-pulse-light"></div>
        <div className="absolute top-[60%] left-[5%] w-2 h-2 bg-primary rounded-full animate-pulse-light"></div>
        <div className="absolute top-[45%] right-[8%] w-1.5 h-1.5 bg-accent rounded-full animate-pulse-light"></div>
        <div className="absolute top-[70%] left-[25%] w-1.5 h-1.5 bg-secondary rounded-full animate-pulse-light"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-24 pb-24 relative z-10">
        {isPayLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-xl">
              <LogoLoader size="medium" message="Initializing payment..." showMessage={true} />
            </div>
          </div>
        )}
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge icon={SparklesIcon}>{t('hero.badge', { ns: 'pricing' })}</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
            {t('hero.title_lead', { ns: 'pricing' })}{' '}
            <AnimatedGradientText>
              {t('hero.title_highlight', { ns: 'pricing' })}
            </AnimatedGradientText>
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed mb-8">
            {t('hero.subtitle', { ns: 'pricing' })}
          </p>

          {/* Controls Row: Segmented Filter + Pricing/Currency Controls */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8">
            {/* Left: Compact Segmented Filter */}
            <div className="flex justify-start">
              <div className="inline-flex bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-full p-1 shadow-sm">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'autism', label: 'Autism' },
                  { value: 'adhd', label: 'ADHD' },
                  { value: 'dyslexia', label: 'Dyslexia' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setDisorderFilter(value)}
                    className={`px-3 sm:px-4 py-1.5 text-sm rounded-full transition-all duration-200 ${
                      disorderFilter === value
                        ? 'bg-primary text-white shadow'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <TranslatedText>{label}</TranslatedText>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Pricing Type + Currency */}
            <div className="flex items-center gap-3 justify-end">
              <div className="inline-flex bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-full p-1 shadow-sm">
                {[
                  { v: 'individual', l: t('filters.individual', { ns: 'pricing' }) },
                  { v: 'combo', l: t('filters.packages', { ns: 'pricing' }) },
                ].map(({ v, l }) => (
                  <button
                    key={v}
                    onClick={() => setPricingType(v)}
                    className={`px-3 sm:px-4 py-1.5 text-sm rounded-full transition-all duration-200 ${
                      pricingType === v
                        ? 'bg-primary text-white shadow'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <div className="inline-flex bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-full p-1 shadow-sm">
                {[
                  { v: 'INR', I: CurrencyRupeeIcon },
                  { v: 'USD', I: CurrencyDollarIcon },
                ].map(({ v, I }) => (
                  <button
                    key={v}
                    onClick={() => setCurrency(v)}
                    className={`px-3 sm:px-4 py-1.5 text-sm rounded-full inline-flex items-center gap-2 transition-all duration-200 ${
                      currency === v
                        ? 'bg-primary text-white shadow'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <I className="h-4 w-4" />
                    <TranslatedText>{v}</TranslatedText>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Pricing Content */}
        <motion.div
          key={pricingType}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {pricingType === 'individual' ? (
            // Individual Assessment Pricing
            <div>
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  {t('individual.title_lead', { ns: 'pricing' })}{' '}
                  <AnimatedGradientText>
                    {t('individual.title_highlight', { ns: 'pricing' })}
                  </AnimatedGradientText>
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                  {t('individual.subtitle', { ns: 'pricing' })}
                </p>
                {buyAgainAvailable && (
                  <button
                    onClick={async () => {
                      if (!buyAgainPayload) return;
                      const type = buyAgainPayload.purchaseType;
                      const at = buyAgainPayload.assessmentType;
                      const item =
                        type === 'combo'
                          ? comboPackages.find(p => p.packageId === buyAgainPayload.packageId)
                          : assessmentPricing.find(a => a.assessmentType === at);
                      if (item) await startRazorpayCheckout(item, type);
                    }}
                    className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    Buy Again
                  </button>
                )}
              </div>

              <div className={getFilteredAssessments().length <= 2 ? 'flex justify-center' : ''}>
                <div
                  className={`grid gap-6 ${
                    getFilteredAssessments().length <= 2
                      ? 'grid-cols-1 md:grid-cols-2'
                      : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                  }`}
                >
                  {getFilteredAssessments().length > 0 ? (
                    getFilteredAssessments().map((assessment, index) => (
                      <motion.div
                        key={assessment._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 * index }}
                        whileHover={{ y: -8, transition: { duration: 0.3 } }}
                        className={getFilteredAssessments().length <= 2 ? 'w-full max-w-sm' : ''}
                      >
                        <GlassMorphism
                          className={`p-6 h-full ${isFreeAssessment(assessment.assessmentType) ? 'border-2 border-green-400/30 dark:border-green-400/50' : ''}`}
                          colorAccent={
                            isFreeAssessment(assessment.assessmentType) ? 'green' : 'blue'
                          }
                        >
                          <div className="text-center">
                            {isFreeAssessment(assessment.assessmentType) && (
                              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
                                <div className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                                  <GiftIcon className="h-3 w-3" />
                                  <TranslatedText>Free</TranslatedText>
                                </div>
                              </div>
                            )}

                            <div
                              className={`w-16 h-16 bg-gradient-to-br ${getCategoryColor(
                                assessment.category
                              )} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-colored-md`}
                            >
                              {getCategoryIcon(assessment.category)}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                              {t(`types.${assessment.assessmentType}.name`, {
                                ns: 'assessment',
                                defaultValue: assessment.assessmentName,
                              })}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                              {t(`types.${assessment.assessmentType}.description`, {
                                ns: 'assessment',
                                defaultValue: assessment.description,
                              })}
                            </p>
                            <div
                              className={`text-3xl font-bold mb-4 ${isFreeAssessment(assessment.assessmentType) ? 'text-green-600 dark:text-green-400' : 'text-primary'}`}
                            >
                              {formatPrice(
                                assessment.priceINR,
                                assessment.priceUSD,
                                assessment.assessmentType
                              )}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                              {t(`types.${assessment.assessmentType}.duration`, {
                                ns: 'assessment',
                                defaultValue: assessment.duration,
                              })}
                            </div>
                            {purchasesLoaded &&
                            hasPurchasedAssessment(assessment.assessmentType) ? (
                              <button
                                onClick={() => navigate('/assessment')}
                                className="w-full font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                              >
                                <TranslatedText>Start Assessment</TranslatedText>
                              </button>
                            ) : (
                              <button
                                onClick={() => handlePurchase(assessment, 'individual')}
                                className={`w-full font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 ${
                                  isFreeAssessment(assessment.assessmentType)
                                    ? 'bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white'
                                    : 'bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white'
                                }`}
                              >
                                {isFreeAssessment(assessment.assessmentType)
                                  ? t('actions.start_free', { ns: 'common' })
                                  : t('actions.buy_and_start', { ns: 'common' })}
                              </button>
                            )}
                            {/* Inline remaining quota */}
                            {(() => {
                              const rem = remainingForAssessment(assessment.assessmentType);
                              if (rem === null) return null;
                              return (
                                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                                  {t('individual.you_have_left', { ns: 'pricing', count: rem })}
                                </div>
                              );
                            })()}
                          </div>
                        </GlassMorphism>
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <div className="text-gray-500 dark:text-gray-400 text-lg">
                        <TranslatedText>
                          No assessments found for the selected filter.
                        </TranslatedText>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Combo Packages
            <div>
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  {t('packages.title_lead', { ns: 'pricing' })}{' '}
                  <AnimatedGradientText>
                    {t('packages.title_highlight', { ns: 'pricing' })}
                  </AnimatedGradientText>
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                  {t('packages.subtitle', { ns: 'pricing' })}
                </p>
              </div>

              <div className="space-y-8">
                {/* First Row: Autism Essential, ADHD Core, Dyslexia Core */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {comboPackages
                    .filter(pkg =>
                      disorderFilter === 'all'
                        ? true
                        : pkg.includedAssessments?.some(a =>
                            a.assessmentType.includes(disorderFilter)
                          )
                    )
                    .slice(0, 3)
                    .map((pkg, index) => {
                      const isAllInclusive = pkg.packageId === 'all-inclusive-pack';
                      return (
                        <motion.div
                          key={pkg._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 0.1 * index }}
                          whileHover={{ y: -8, transition: { duration: 0.3 } }}
                          className="relative"
                        >
                          {pkg.isPopular && (
                            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                                <StarIcon className="h-4 w-4" />
                                {t('packages.most_popular', { ns: 'pricing' })}
                              </div>
                            </div>
                          )}
                          {pkg.isBestValue && (
                            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                              <div className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                                <HeartIcon className="h-4 w-4" />
                                {t('packages.best_value', { ns: 'pricing' })}
                              </div>
                            </div>
                          )}

                          <GlassMorphism
                            className={`p-8 h-full ${
                              pkg.isPopular
                                ? 'border-2 border-yellow-400/30 dark:border-yellow-400/50'
                                : pkg.isBestValue
                                  ? 'border-2 border-green-400/30 dark:border-green-400/50'
                                  : ''
                            }`}
                            colorAccent={
                              pkg.isPopular ? 'yellow' : pkg.isBestValue ? 'green' : 'blue'
                            }
                          >
                            <div className="text-center">
                              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                <TranslatedText>{pkg.packageName}</TranslatedText>
                              </h3>
                              <p className="text-gray-600 dark:text-gray-300 mb-6">
                                <TranslatedText>{pkg.description}</TranslatedText>
                              </p>

                              <div className="mb-6">
                                <div className="text-4xl font-bold text-primary mb-2">
                                  {formatPrice(pkg.priceINR, pkg.priceUSD)}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 line-through">
                                  {formatPrice(pkg.originalPriceINR, pkg.originalPriceUSD)}
                                </div>
                                <div className="text-sm text-green-600 dark:text-green-400 font-semibold">
                                  {t('packages.save', { ns: 'pricing' })}{' '}
                                  {formatSavings(pkg.savingsINR, pkg.savingsUSD)}
                                </div>
                              </div>

                              <div className="mb-6">
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                                  <TranslatedText>Included Assessments:</TranslatedText>
                                </h4>
                                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                                  {pkg.includedAssessments.map((assessment, idx) => (
                                    <li key={idx} className="flex items-center">
                                      <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                      <TranslatedText>{assessment.assessmentName}</TranslatedText>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {pkg.additionalFeatures && (
                                <div className="mb-6">
                                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                                    <TranslatedText>Additional Features:</TranslatedText>
                                  </h4>
                                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                                    {pkg.additionalFeatures.slice(0, 3).map((feature, idx) => (
                                      <li key={idx} className="flex items-center">
                                        <BoltIcon className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                                        <TranslatedText>{feature}</TranslatedText>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {hasPurchasedPackage(pkg.packageId) ? (
                                <button
                                  onClick={() => navigate('/dashboard?tab=assessments')}
                                  className={`w-full font-semibold py-4 px-6 rounded-xl transition-all duration-300 hover:scale-105 ${
                                    isAllInclusive
                                      ? 'bg-gradient-to-r from-purple-400 to-pink-500 text-white'
                                      : pkg.isBestValue
                                        ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white'
                                        : 'bg-gradient-to-r from-primary to-secondary text-white'
                                  }`}
                                >
                                  {t('actions.view_in_dashboard', { ns: 'common' })}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handlePurchase(pkg, 'combo')}
                                  className={`w-full font-semibold py-4 px-6 rounded-xl transition-all duration-300 hover:scale-105 ${
                                    pkg.isPopular
                                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white'
                                      : pkg.isBestValue
                                        ? 'bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white'
                                        : 'bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white'
                                  }`}
                                >
                                  {t('actions.get_package', { ns: 'common' })}
                                </button>
                              )}
                            </div>
                          </GlassMorphism>
                        </motion.div>
                      );
                    })}
                </div>

                {/* Second Row: General Neuro Check, Dual Insight Pack, All Inclusive Pack */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {comboPackages
                    .filter(pkg =>
                      disorderFilter === 'all'
                        ? true
                        : pkg.includedAssessments?.some(a =>
                            a.assessmentType.includes(disorderFilter)
                          )
                    )
                    .slice(3, 6)
                    .map((pkg, index) => {
                      const isAllInclusive = pkg.packageId === 'all-inclusive-pack';

                      return (
                        <motion.div
                          key={pkg._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 0.1 * (index + 3) }}
                          whileHover={{ y: -8, transition: { duration: 0.3 } }}
                          className="relative"
                        >
                          {pkg.isPopular && (
                            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                                <StarIcon className="h-4 w-4" />
                                <TranslatedText>Most Popular</TranslatedText>
                              </div>
                            </div>
                          )}
                          {pkg.isBestValue && (
                            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                              <div className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                                <HeartIcon className="h-4 w-4" />
                                <TranslatedText>Best Value</TranslatedText>
                              </div>
                            </div>
                          )}
                          {isAllInclusive && (
                            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                              <div className="bg-gradient-to-r from-purple-400 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                                <SparklesIcon className="h-4 w-4" />
                                {t('packages.complete_suite', { ns: 'pricing' })}
                              </div>
                            </div>
                          )}

                          <GlassMorphism
                            className={`p-8 h-full ${
                              pkg.isPopular
                                ? 'border-2 border-yellow-400/30 dark:border-yellow-400/50'
                                : pkg.isBestValue
                                  ? 'border-2 border-green-400/30 dark:border-green-400/50'
                                  : isAllInclusive
                                    ? 'border-2 border-purple-400/30 dark:border-purple-400/50'
                                    : ''
                            }`}
                            colorAccent={
                              pkg.isPopular
                                ? 'yellow'
                                : pkg.isBestValue
                                  ? 'green'
                                  : isAllInclusive
                                    ? 'purple'
                                    : 'blue'
                            }
                          >
                            <div className="text-center">
                              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                <TranslatedText>{pkg.packageName}</TranslatedText>
                              </h3>
                              <p className="text-gray-600 dark:text-gray-300 mb-6">
                                <TranslatedText>{pkg.description}</TranslatedText>
                              </p>

                              <div className="mb-6">
                                <div className="text-4xl font-bold text-primary mb-2">
                                  {formatPrice(pkg.priceINR, pkg.priceUSD)}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 line-through">
                                  {formatPrice(pkg.originalPriceINR, pkg.originalPriceUSD)}
                                </div>
                                <div className="text-sm text-green-600 dark:text-green-400 font-semibold">
                                  <TranslatedText>Save</TranslatedText>{' '}
                                  {formatSavings(pkg.savingsINR, pkg.savingsUSD)}
                                </div>
                              </div>

                              <div className="mb-6">
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                                  {t('packages.included', { ns: 'pricing' })}
                                </h4>
                                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                                  {pkg.includedAssessments.map((assessment, idx) => (
                                    <li key={idx} className="flex items-center">
                                      <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                      <TranslatedText>{assessment.assessmentName}</TranslatedText>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {pkg.additionalFeatures && !isAllInclusive && (
                                <div className="mb-6">
                                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                                    {t('packages.features', { ns: 'pricing' })}
                                  </h4>
                                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                                    {pkg.additionalFeatures.slice(0, 3).map((feature, idx) => (
                                      <li key={idx} className="flex items-center">
                                        <BoltIcon className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                                        <TranslatedText>{feature}</TranslatedText>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              <button
                                onClick={() => handlePurchase(pkg, 'combo')}
                                className={`w-full font-semibold py-4 px-6 rounded-xl transition-all duration-300 hover:scale-105 ${
                                  pkg.isPopular
                                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white'
                                    : pkg.isBestValue
                                      ? 'bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white'
                                      : isAllInclusive
                                        ? 'bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 text-white'
                                        : 'bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white'
                                }`}
                              >
                                <TranslatedText>Get Package</TranslatedText>
                              </button>
                            </div>
                          </GlassMorphism>
                        </motion.div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Success Overlay */}
        {showSuccess && successInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="text-4xl mb-2">✅</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {t('success.title', { ns: 'pricing' })}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{successInfo.title}</p>
                <div className="flex gap-2 justify-center">
                  <Link
                    to={computeStartLink(successInfo.type, successInfo.item)}
                    className="px-4 py-2 rounded-lg bg-primary text-white"
                    onClick={() => setShowSuccess(false)}
                  >
                    {t('actions.start_now', { ns: 'common' })}
                  </Link>
                  <button
                    onClick={handleAddToCalendar}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200"
                  >
                    {t('actions.add_to_calendar', { ns: 'common' })}
                  </button>
                  <button
                    onClick={() => setShowSuccess(false)}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200"
                  >
                    {t('actions.close', { ns: 'common' })}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {t('cta.ready', { ns: 'pricing' })}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
              {t('cta.body', { ns: 'pricing' })}
            </p>
            <Link
              to="/assessment"
              className="inline-flex items-center bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 hover:scale-105"
            >
              {t('actions.start_assessment', { ns: 'common' })}
              <ArrowRightIcon className="h-5 w-5 ml-2" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Pricing;
