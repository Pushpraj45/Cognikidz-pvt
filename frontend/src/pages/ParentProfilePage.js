import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  UserIcon,
  PencilSquareIcon,
  SparklesIcon,
  ChartBarIcon,
  CogIcon,
  BellIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import LogoLoader from '../components/ui/LogoLoader';
import TranslatedText from '../components/ui/TranslatedText';
import EnhancedParentProfile from '../components/profile/EnhancedParentProfile';
import ChildrenManagement from '../components/profile/ChildrenManagement';
import NotificationsPanel from '../components/profile/NotificationsPanel';

const ParentProfilePage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  const navigate = useNavigate();

  // Enhanced animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.25, 0.25, 0.75],
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, rotateX: -10 },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        duration: 0.7,
        ease: 'easeOut',
      },
    },
    hover: {
      y: -8,
      scale: 1.02,
      rotateY: 2,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: 'easeOut',
      },
    },
  };

  return (
    <div className="min-h-screen bg-background dark:bg-dark-background relative overflow-hidden">
      {/* Standard website background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial from-primary/5 to-transparent opacity-60 dark:opacity-30"></div>
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-radial from-secondary/10 to-transparent rounded-full dark:from-secondary/5"></div>
        <div className="absolute bottom-40 left-20 w-[600px] h-[600px] bg-gradient-radial from-accent/10 to-transparent rounded-full dark:from-accent/5"></div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10"
      >
        {/* Page Header - Works with main navbar */}
        <div className="mt-16">
          <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-12 xs:h-14 sm:h-16">
              <div className="flex items-center space-x-3 xs:space-x-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors text-sm xs:text-sm sm:text-base font-medium"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 xs:h-4 xs:w-4 sm:h-5 sm:w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  <span className="hidden xs:inline">Back to Dashboard</span>
                  <span className="xs:hidden">Back</span>
                </button>
              </div>
              <div className="w-20 xs:w-32"></div> {/* Spacer for center alignment */}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 pt-4 xs:pt-6 pb-6 xs:pb-8">
          {/* Enhanced Header */}
          <motion.div variants={headerVariants} className="text-center mb-6 xs:mb-8">
            <div className="inline-flex items-center mb-4 xs:mb-6 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full pl-1 pr-3 xs:pr-4 py-1 shadow-lg hover:shadow-xl transition-all duration-300">
              <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full w-6 h-6 xs:w-7 xs:h-7 flex items-center justify-center mr-2 xs:mr-3">
                <UserIcon className="h-3 w-3 xs:h-4 xs:w-4" />
              </span>
              <span className="text-blue-700 dark:text-blue-300 text-xs xs:text-sm font-semibold tracking-wide">
                <TranslatedText>Parent Dashboard</TranslatedText>
              </span>
            </div>

            <h2 className="text-2xl xs:text-3xl md:text-4xl font-bold mb-3 xs:mb-4 text-gray-900 dark:text-white leading-tight">
              <TranslatedText>My Profile</TranslatedText>{' '}
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-gradient bg-300%">
                <TranslatedText>Center</TranslatedText>
              </span>
            </h2>
            <p className="text-base xs:text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl mx-auto px-4">
              <TranslatedText>
                Manage your account settings and oversee your children's developmental journey
              </TranslatedText>
            </p>
          </motion.div>

          {/* Quick Stats Bar */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3 xs:gap-4 sm:gap-6 mb-6 xs:mb-8"
          >
            <div className="group bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl xs:rounded-2xl p-4 xs:p-6 border border-white/20 dark:border-gray-700/30 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs xs:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Profile Status
                  </p>
                  <p className="text-lg xs:text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                    Complete
                  </p>
                </div>
                <div className="w-10 h-10 xs:w-12 xs:h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg xs:rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                  <ChartBarIcon className="h-5 w-5 xs:h-6 xs:w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="group bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl xs:rounded-2xl p-4 xs:p-6 border border-white/20 dark:border-gray-700/30 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs xs:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Active Children
                  </p>
                  <p className="text-lg xs:text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                    2
                  </p>
                </div>
                <div className="w-10 h-10 xs:w-12 xs:h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg xs:rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                  <UserIcon className="h-5 w-5 xs:h-6 xs:w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="group bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl xs:rounded-2xl p-4 xs:p-6 border border-white/20 dark:border-gray-700/30 shadow-lg hover:shadow-xl transition-all duration-300 xs:col-span-2 md:col-span-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs xs:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Notifications
                  </p>
                  <p className="text-lg xs:text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                    3 New
                  </p>
                </div>
                <div className="w-10 h-10 xs:w-12 xs:h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg xs:rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                  <BellIcon className="h-5 w-5 xs:h-6 xs:w-6 text-white" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 xs:gap-8">
            <div className="xl:col-span-1 relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 dark:from-blue-600/10 dark:to-purple-600/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <EnhancedParentProfile />
              </div>
            </div>
            <div className="xl:col-span-1 mt-6">
              <NotificationsPanel />
            </div>

            <div className="xl:col-span-1 relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 dark:from-blue-600/10 dark:to-cyan-600/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <ChildrenManagement isLoading={isLoading} />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ParentProfilePage;
