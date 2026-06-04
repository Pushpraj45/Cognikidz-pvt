import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import TranslatedText from './ui/TranslatedText';
import { useTranslation } from 'react-i18next';
import {
  SparklesIcon,
  ArrowRightIcon,
  BoltIcon,
  AcademicCapIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const EnhancedHero = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { t } = useTranslation();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = e => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleGetStarted = () => {
    if (isLoggedIn) {
      navigate('/dashboard');
    } else {
      navigate('/signup');
    }
  };

  const features = ['features.0', 'features.1', 'features.2'];

  const floatingElements = [
    { id: 1, icon: AcademicCapIcon, color: 'text-blue-500', delay: 0 },
    { id: 2, icon: SparklesIcon, color: 'text-purple-500', delay: 1 },
    { id: 3, icon: BoltIcon, color: 'text-pink-500', delay: 2 },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pt-32 pb-20">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Orbs */}
        <motion.div
          animate={{
            x: mousePosition.x * 0.05,
            y: mousePosition.y * 0.05,
          }}
          transition={{ type: 'spring', stiffness: 50, damping: 30 }}
          className="absolute top-20 left-20 w-96 h-96 bg-gradient-radial from-blue-400/20 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: mousePosition.x * -0.03,
            y: mousePosition.y * -0.03,
          }}
          transition={{ type: 'spring', stiffness: 50, damping: 30 }}
          className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-radial from-purple-500/20 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: mousePosition.x * 0.02,
            y: mousePosition.y * 0.04,
          }}
          transition={{ type: 'spring', stiffness: 50, damping: 30 }}
          className="absolute top-1/2 right-1/4 w-64 h-64 bg-gradient-radial from-pink-400/15 to-transparent rounded-full blur-2xl"
        />

        {/* Floating Icons */}
        {floatingElements.map(element => (
          <motion.div
            key={element.id}
            initial={{ opacity: 0, y: 100 }}
            animate={{
              opacity: 1,
              y: 0,
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 2,
              delay: element.delay * 0.5,
              rotate: {
                duration: 6,
                repeat: Infinity,
                ease: 'easeInOut',
              },
            }}
            className={`absolute ${
              element.id === 1
                ? 'top-1/4 left-1/4'
                : element.id === 2
                  ? 'top-1/3 right-1/4'
                  : 'bottom-1/4 left-1/3'
            }`}
          >
            <div className={`w-12 h-12 ${element.color} opacity-20`}>
              <element.icon className="w-full h-full" />
            </div>
          </motion.div>
        ))}

        {/* Animated Grid Pattern */}
        <div className="absolute inset-0 opacity-5">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
            className="w-full h-full"
            style={{
              backgroundImage: `radial-gradient(circle, #6366f1 1px, transparent 1px)`,
              backgroundSize: '50px 50px',
            }}
          />
        </div>
      </div>

      <div className="container mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center max-w-7xl mx-auto">
          {/* Content Column */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center mb-8 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full pl-1 pr-4 py-1 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full w-7 h-7 flex items-center justify-center mr-3">
                <SparklesIcon className="h-4 w-4" />
              </span>
              <span className="text-blue-700 dark:text-blue-300 text-sm font-semibold tracking-wide">
                <TranslatedText ns="hero" i18nKey="badge" />
              </span>
            </motion.div>

            {/* Main Heading with Gradient Animation */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight"
            >
              <span className="text-gray-900 dark:text-white">
                <TranslatedText ns="hero" i18nKey="title.unlocking" />
              </span>
              <br />
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-gradient bg-300%">
                <TranslatedText ns="hero" i18nKey="title.everyChilds" />
              </span>
              <br />
              <span className="text-gray-900 dark:text-white">
                <TranslatedText ns="hero" i18nKey="title.uniquePotential" />
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl leading-relaxed"
            >
              <TranslatedText ns="hero" i18nKey="description" />
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-4 mb-10"
            >
              <motion.button
                onClick={handleGetStarted}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-lg rounded-2xl shadow-lg overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '0%' }}
                  transition={{ duration: 0.3 }}
                />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoggedIn ? (
                    <TranslatedText ns="hero" i18nKey="cta.getStarted" />
                  ) : (
                    <TranslatedText ns="cta" i18nKey="buttons.createAccount" />
                  )}
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRightIcon className="h-5 w-5" />
                  </motion.div>
                </span>
              </motion.button>

              <motion.button
                onClick={() => navigate('/support')}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-semibold text-lg rounded-2xl transition-all duration-300 flex items-center justify-center gap-2"
              >
                <TranslatedText ns="hero" i18nKey="cta.learnMore" />
                <BoltIcon className="h-5 w-5" />
              </motion.button>
            </motion.div>

            {/* Feature List */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="flex flex-wrap gap-6 justify-center lg:justify-start"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 1 + index * 0.1 }}
                  className="flex items-center gap-2"
                >
                  <div className="w-5 h-5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                    <CheckCircleIcon className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    <TranslatedText ns="hero" i18nKey={feature} />
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Visual Column */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative"
          >
            <div className="relative">
              {/* Main Visual Container */}
              <motion.div
                animate={{
                  y: [0, -20, 0],
                  rotate: [0, 1, -1, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="relative z-10"
              >
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/50 dark:border-gray-700/50">
                  {/* Preview of App Screenshot */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className="relative rounded-2xl overflow-hidden shadow-lg"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1588072432836-e10032774350?q=80&w=2072&auto=format&fit=crop"
                      alt="Child development activities"
                      className="w-full h-auto object-cover"
                      onError={e => {
                        // Fallback gradient if image doesn't load
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 hidden items-center justify-center">
                      <div className="text-center text-white">
                        <AcademicCapIcon className="h-16 w-16 mx-auto mb-4 opacity-80" />
                        <p className="text-lg font-semibold">
                          <TranslatedText ns="features" i18nKey="childDevelopment" />
                        </p>
                      </div>
                    </div>

                    {/* Overlay Elements */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                  </motion.div>

                  {/* Floating Stats */}
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                    className="absolute -top-4 -right-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        <TranslatedText ns="features" i18nKey="ai" />
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        <TranslatedText ns="features" i18nKey="proven" />
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    animate={{ y: [0, 5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, delay: 2 }}
                    className="absolute -bottom-2 -left-2 bg-white dark:bg-gray-800 p-3 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        <TranslatedText ns="features" i18nKey="realTimeAnalysis" />
                      </span>
                    </div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Background Decorative Elements */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute -top-8 -left-8 w-16 h-16 border-2 border-blue-300 dark:border-blue-600 rounded-full opacity-30"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                className="absolute -bottom-6 -right-6 w-12 h-12 border-2 border-purple-300 dark:border-purple-600 rounded-full opacity-30"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500"
        >
          <span className="text-sm font-medium">
            <TranslatedText ns="hero" i18nKey="cta.scrollToExplore" />
          </span>
          <div className="w-6 h-10 border-2 border-current rounded-full flex justify-center">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1 h-3 bg-current rounded-full mt-2"
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default EnhancedHero;
