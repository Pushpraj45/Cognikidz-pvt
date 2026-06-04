import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon, PlayIcon } from '@heroicons/react/24/outline';
import TranslatedText from './ui/TranslatedText';
import { useTranslation } from 'react-i18next';

const InteractiveHowItWorks = () => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const steps = [
    {
      id: 1,
      title: 'step1.title',
      description: 'step1.description',
      image: '/assets/screenshots/step1/profile-desktop1.png',
      features: ['step1.features.0', 'step1.features.1', 'step1.features.2'],
      color: 'from-blue-500 to-purple-600',
      iconBg: 'bg-blue-100 text-blue-600',
      accentColor: 'text-blue-600',
    },
    {
      id: 2,
      title: 'step2.title',
      description: 'step2.description',
      image: '/assets/screenshots/step2/assessmentform-1.png',
      features: ['step2.features.0', 'step2.features.1', 'step2.features.2'],
      color: 'from-purple-500 to-pink-600',
      iconBg: 'bg-purple-100 text-purple-600',
      accentColor: 'text-purple-600',
    },
    {
      id: 3,
      title: 'step3.title',
      description: 'step3.description',
      image: '/assets/screenshots/step2/assessment-qs.png',
      features: ['step3.features.0', 'step3.features.1', 'step3.features.2'],
      color: 'from-orange-500 to-amber-600',
      iconBg: 'bg-orange-100 text-orange-600',
      accentColor: 'text-orange-600',
    },
    {
      id: 4,
      title: 'step4.title',
      description: 'step4.description',
      image: '/assets/screenshots/step3/assessment-report1.png',
      features: ['step4.features.0', 'step4.features.1', 'step4.features.2'],
      color: 'from-green-500 to-teal-600',
      iconBg: 'bg-green-100 text-green-600',
      accentColor: 'text-green-600',
    },
  ];

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlaying) {
      const interval = setInterval(() => {
        setCurrentStep(prev => (prev + 1) % steps.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isAutoPlaying, steps.length]);

  const nextStep = () => {
    setIsAutoPlaying(false);
    setCurrentStep(prev => (prev + 1) % steps.length);
  };

  const prevStep = () => {
    setIsAutoPlaying(false);
    setCurrentStep(prev => (prev - 1 + steps.length) % steps.length);
  };

  const goToStep = index => {
    setIsAutoPlaying(false);
    setCurrentStep(index);
  };

  return (
    <section className="py-20 lg:py-32 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial from-blue-500/5 to-transparent opacity-60"></div>
        <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-radial from-purple-500/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-gradient-radial from-pink-500/10 to-transparent rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center mb-4 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full pl-1 pr-4 py-1 shadow-lg hover:shadow-xl transition-all duration-300">
              <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full w-7 h-7 flex items-center justify-center mr-3">
                <PlayIcon className="h-4 w-4" />
              </span>
              <span className="text-blue-700 dark:text-blue-300 text-sm font-semibold tracking-wide">
                <TranslatedText ns="hero" i18nKey="cta.interactiveDemo" />
              </span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white leading-tight">
              <TranslatedText ns="howItWorks" i18nKey="title" />
            </h2>

            <p className="text-xl text-gray-600 dark:text-gray-300">
              <TranslatedText ns="howItWorks" i18nKey="subtitle" />
            </p>
          </motion.div>
        </div>

        {/* Main Interactive Section */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Side - Content */}
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="order-2 lg:order-1"
            >
              <div className="relative">
                {/* Step Counter */}
                <div className="flex items-center mb-6">
                  <div
                    className={`w-12 h-12 rounded-xl ${steps[currentStep].iconBg} flex items-center justify-center font-bold text-lg`}
                  >
                    {steps[currentStep].id}
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center gap-2">
                      {steps.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => goToStep(index)}
                          className={`h-2 rounded-full transition-all duration-300 ${
                            index === currentStep
                              ? 'bg-gradient-to-r ' + steps[currentStep].color + ' w-8'
                              : 'bg-gray-300 dark:bg-gray-600 w-2 hover:w-4'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
                  <TranslatedText ns="howItWorks" i18nKey={steps[currentStep].title} />
                </h3>

                {/* Description */}
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                  <TranslatedText ns="howItWorks" i18nKey={steps[currentStep].description} />
                </p>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  {steps[currentStep].features.map((feature, index) => (
                    <motion.div
                      key={feature}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div
                        className={`w-6 h-6 rounded-full bg-gradient-to-r ${steps[currentStep].color} flex items-center justify-center`}
                      >
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                        <TranslatedText ns="howItWorks" i18nKey={feature} />
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* Navigation Controls */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={prevStep}
                    className="flex items-center justify-center w-12 h-12 rounded-xl border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors group"
                  >
                    <ChevronLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200" />
                  </button>

                  <div className="flex-1 text-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      <TranslatedText ns="howItWorks" i18nKey="stepLabel" /> {currentStep + 1}{' '}
                      <TranslatedText ns="howItWorks" i18nKey="ofLabel" /> {steps.length}
                    </span>
                  </div>

                  <button
                    onClick={nextStep}
                    className="flex items-center justify-center w-12 h-12 rounded-xl border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors group"
                  >
                    <ChevronRightIcon className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200" />
                  </button>

                  <button
                    onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                    className={`flex items-center justify-center w-12 h-12 rounded-xl border-2 transition-all ${
                      isAutoPlaying
                        ? 'border-transparent bg-blue-500 text-white'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    {isAutoPlaying ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <PlayIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Right Side - Image Slider */}
            <div className="order-1 lg:order-2 relative">
              <div className="relative">
                {/* Background glow */}
                <div
                  className={`absolute -inset-4 bg-gradient-to-r ${steps[currentStep].color} rounded-2xl blur-xl opacity-20`}
                />

                {/* Image container */}
                <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStep}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.05 }}
                      transition={{ duration: 0.5 }}
                      className="aspect-video w-full relative overflow-hidden"
                    >
                      <img
                        src={steps[currentStep].image}
                        alt={steps[currentStep].title}
                        className="w-full h-full object-cover object-top"
                        onError={e => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      {/* Fallback for missing images */}
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 hidden items-center justify-center">
                        <div className="text-center">
                          <div
                            className={`w-16 h-16 rounded-full ${steps[currentStep].iconBg} flex items-center justify-center mx-auto mb-4`}
                          >
                            <span className="text-2xl font-bold">{steps[currentStep].id}</span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400">
                            {steps[currentStep].title}
                          </p>
                        </div>
                      </div>

                      {/* Overlay gradient */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent`}
                      />
                    </motion.div>
                  </AnimatePresence>

                  {/* Step indicator overlay */}
                  <div className="absolute top-4 left-4">
                    <div
                      className={`px-3 py-1 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-white/20 ${steps[currentStep].accentColor} font-semibold text-sm`}
                    >
                      <TranslatedText ns="howItWorks" i18nKey="stepLabel" /> {currentStep + 1}
                    </div>
                  </div>
                </div>

                {/* Floating elements */}
                <motion.div
                  animate={{
                    y: [0, -10, 0],
                    rotate: [0, 5, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-lg"
                />

                <motion.div
                  animate={{
                    y: [0, 10, 0],
                    rotate: [0, -5, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 1,
                  }}
                  className="absolute -bottom-2 -left-2 w-6 h-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-full shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Step Navigation Dots */}
        <div className="flex justify-center mt-16 space-x-4">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => goToStep(index)}
              className={`group relative p-3 rounded-xl transition-all duration-300 ${
                index === currentStep
                  ? 'bg-white dark:bg-gray-800 shadow-lg'
                  : 'hover:bg-white/50 dark:hover:bg-gray-800/50'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold transition-all duration-300 ${
                  index === currentStep
                    ? steps[index].iconBg
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 group-hover:bg-gray-300 dark:group-hover:bg-gray-600'
                }`}
              >
                {step.id}
              </div>
              {index === currentStep && (
                <motion.div
                  layoutId="activeStep"
                  className="absolute inset-0 rounded-xl border-2 border-transparent"
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default InteractiveHowItWorks;
