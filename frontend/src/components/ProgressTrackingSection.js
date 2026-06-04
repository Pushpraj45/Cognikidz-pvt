import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import TranslatedText from './ui/TranslatedText';
import { useTranslation } from 'react-i18next';
import {
  ChartBarIcon,
  ClockIcon,
  TrophyIcon,
  ArrowRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

const ProgressTrackingSection = () => {
  const { t } = useTranslation();
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      id: 0,
      title: 'features.liveDashboard.title',
      subtitle: 'features.liveDashboard.subtitle',
      description: 'features.liveDashboard.description',
      image: '/assets/screenshots/step3/dashboard-parent.png',
      icon: ChartBarIcon,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'from-blue-50 to-blue-100',
    },
    {
      id: 1,
      title: 'features.smartReports.title',
      subtitle: 'features.smartReports.subtitle',
      description: 'features.smartReports.description',
      image: '/assets/screenshots/step2/assessment-report1.png',
      icon: ClockIcon,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'from-purple-50 to-purple-100',
    },
    {
      id: 2,
      title: 'features.progressTimeline.title',
      subtitle: 'features.progressTimeline.subtitle',
      description: 'features.progressTimeline.description',
      image: '/assets/screenshots/step2/progress-2.png',
      icon: TrophyIcon,
      color: 'from-green-500 to-green-600',
      bgColor: 'from-green-50 to-green-100',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  };

  return (
    <section className="py-20 relative overflow-hidden bg-gradient-to-br from-slate-50/80 via-white to-indigo-50/60 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900/10 font-sans">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(99,102,241,0.08),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_40%,rgba(99,102,241,0.04),transparent_50%)]"></div>

      {/* Floating gradient orbs */}
      <div className="absolute top-20 right-1/4 w-64 h-64 bg-gradient-to-br from-indigo-300/30 to-purple-300/30 dark:from-indigo-600/15 dark:to-purple-600/15 rounded-full blur-3xl opacity-60 animate-float-slow"></div>
      <div
        className="absolute bottom-20 left-1/4 w-48 h-48 bg-gradient-to-br from-blue-300/30 to-cyan-300/30 dark:from-blue-600/15 dark:to-cyan-600/15 rounded-full blur-3xl opacity-60 animate-float-slow"
        style={{ animationDelay: '2s' }}
      ></div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="max-w-7xl mx-auto"
        >
          {/* Header Section */}
          <motion.div variants={itemVariants} className="text-center mb-16">
            <div className="inline-flex items-center mb-6 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full pl-1 pr-4 py-1 shadow-lg hover:shadow-xl transition-all duration-300">
              <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full w-7 h-7 flex items-center justify-center mr-3">
                <SparklesIcon className="h-4 w-4" />
              </span>
              <span className="text-blue-700 dark:text-blue-300 text-sm font-semibold tracking-wide">
                <TranslatedText ns="progressTracking" i18nKey="badge" />
              </span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white leading-tight">
              <TranslatedText ns="progressTracking" i18nKey="title" />{' '}
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-gradient bg-300%">
                <TranslatedText ns="progressTracking" i18nKey="effortlessly" />
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl mx-auto">
              <TranslatedText ns="progressTracking" i18nKey="subtitle" />
            </p>
          </motion.div>

          {/* Feature Showcase */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            {/* Interactive Feature List */}
            <div className="space-y-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.id}
                  variants={itemVariants}
                  onHoverStart={() => setActiveFeature(index)}
                  className={`group cursor-pointer relative overflow-hidden rounded-2xl transition-all duration-500 ${
                    activeFeature === index
                      ? 'bg-white dark:bg-gray-800 shadow-2xl scale-105'
                      : 'bg-white/60 dark:bg-gray-800/60 hover:bg-white/80 dark:hover:bg-gray-800/80 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {/* Background gradient */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-r ${feature.bgColor} dark:from-gray-700/20 dark:to-gray-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  ></div>

                  <div className="relative p-6 flex items-center gap-6">
                    {/* Icon */}
                    <div
                      className={`relative flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}
                    >
                      <feature.icon className="h-8 w-8 text-white" />
                      {activeFeature === index && (
                        <motion.div
                          layoutId="activeGlow"
                          className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 rounded-xl"
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          <TranslatedText ns="progressTracking" i18nKey={feature.title} />
                        </h3>
                        <span
                          className={`text-sm font-normal px-2 py-1 rounded-full bg-gradient-to-r ${feature.color} text-white`}
                        >
                          <TranslatedText ns="progressTracking" i18nKey={feature.subtitle} />
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed">
                        <TranslatedText ns="progressTracking" i18nKey={feature.description} />
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Dashboard Preview */}
            <div className="relative">
              <motion.div
                key={activeFeature}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="relative group"
              >
                {/* Image container with enhanced styling */}
                <div className="relative overflow-hidden rounded-2xl shadow-2xl bg-white dark:bg-gray-800 p-2">
                  <div className="aspect-[4/3] overflow-hidden rounded-xl">
                    <img
                      src={features[activeFeature].image}
                      alt="Dashboard preview"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                </div>

                {/* Feature indicator dots */}
                <div className="flex justify-center mt-6 gap-2">
                  {features.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveFeature(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        activeFeature === index
                          ? 'bg-indigo-500 w-8'
                          : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                      }`}
                    />
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div variants={itemVariants} className="text-center mt-16">
            <Link
              to="/dashboard"
              className="group inline-flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-2xl shadow-xl shadow-indigo-500/25 hover:shadow-2xl hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-105 hover:-translate-y-1"
            >
              <ChartBarIcon className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
              <TranslatedText ns="progressTracking" i18nKey="cta" />
              <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Custom animations for floating elements */}
      <style jsx>{`
        @keyframes float-slow {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }
        .animate-float-slow {
          animation: float-slow 6s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
};

export default ProgressTrackingSection;
