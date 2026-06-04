import React, { useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ChatWidget from '../components/ChatWidget';
import TranslatedText from '../components/ui/TranslatedText';
import InteractiveHowItWorks from '../components/InteractiveHowItWorks';
import EnhancedHero from '../components/EnhancedHero';
import ProgressTrackingSection from '../components/ProgressTrackingSection';
import Button from '../components/ui/Button';
import { useTranslation } from 'react-i18next';

// Icons from Radix UI
import { ArrowRightIcon } from '@radix-ui/react-icons';

// Icons from Heroicons
import { BeakerIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

// Animated gradient text with animation like in About.js
const AnimatedGradientText = ({ children, className = '' }) => (
  <span className={`animated-gradient-text ${className}`}>{children}</span>
);

const LandingPage = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const cardsRef = useRef(null);
  const ctaRef = useRef(null);
  const { t } = useTranslation();

  const handleGetStarted = () => {
    if (isLoggedIn) {
      navigate('/dashboard');
    } else {
      navigate('/signup');
    }
  };

  return (
    <div className="bg-background dark:bg-dark-background relative overflow-hidden font-sans">
      {/* Static background decorations - responsive sizes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial from-primary/5 to-transparent opacity-60 dark:opacity-30"></div>
        <div className="absolute top-0 right-0 w-[400px] sm:w-[600px] lg:w-[800px] h-[400px] sm:h-[600px] lg:h-[800px] bg-gradient-radial from-secondary/10 to-transparent rounded-full dark:from-secondary/5"></div>
        <div className="absolute bottom-20 sm:bottom-40 left-4 sm:left-10 lg:left-20 w-[300px] sm:w-[500px] lg:w-[600px] h-[300px] sm:h-[500px] lg:h-[600px] bg-gradient-radial from-accent/10 to-transparent rounded-full dark:from-accent/5"></div>

        {/* Static dots - responsive positioning and sizes */}
        <div className="absolute top-[30%] left-[10%] sm:left-[15%] w-2 sm:w-3 h-2 sm:h-3 bg-primary rounded-full"></div>
        <div className="absolute top-[25%] right-[5%] sm:right-[10%] w-1.5 sm:w-2 h-1.5 sm:h-2 bg-accent rounded-full"></div>
        <div className="absolute top-[80%] right-[25%] sm:right-[30%] w-1.5 sm:w-2 h-1.5 sm:h-2 bg-secondary rounded-full"></div>
        <div className="absolute top-[60%] left-[2%] sm:left-[5%] w-1.5 sm:w-2 h-1.5 sm:h-2 bg-primary rounded-full"></div>
      </div>

      {/* Enhanced Hero Section */}
      <EnhancedHero />

      {/* Interactive How It Works Section */}
      <InteractiveHowItWorks />

      {/* Free Assessment Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial from-blue-500/5 to-transparent opacity-60"></div>
          <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-radial from-purple-500/10 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-64 h-64 bg-gradient-radial from-pink-500/10 to-transparent rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-12 sm:mb-16">
              <div className="inline-flex items-center mb-4 sm:mb-6 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full pl-1 pr-4 py-1 shadow-lg">
                <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full w-7 h-7 flex items-center justify-center mr-3">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                    />
                  </svg>
                </span>
                <span className="text-blue-700 dark:text-blue-300 text-sm font-semibold tracking-wide">
                  <TranslatedText ns="common" i18nKey="freeAssessment" />
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-text dark:text-white leading-tight">
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Free
                </span>{' '}
                Comprehensive Assessment
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl mx-auto">
                Experience our complete multi-disorder assessment suite at no cost. Understand your
                child's unique needs with our evidence-based evaluation tools.
              </p>
            </div>

            {/* Free Assessment Card */}
            <div className="max-w-4xl mx-auto">
              <div className="group cursor-pointer transform hover:scale-105 transition-all duration-500">
                {/* Enhanced card glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 rounded-3xl blur-lg opacity-0 group-hover:opacity-80 transition-all duration-700 animate-gradient bg-300%"></div>

                <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl overflow-hidden shadow-2xl group-hover:shadow-3xl transition-all duration-500 border border-blue-200/50 dark:border-blue-700/50 group-hover:border-blue-400/50 dark:group-hover:border-blue-400/50">
                  {/* Top decoration */}
                  <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 animate-gradient bg-300%"></div>

                  <div className="p-6 sm:p-8 lg:p-10">
                    <div className="flex flex-col lg:flex-row items-center gap-6 sm:gap-8 lg:gap-10">
                      {/* Left side - Icon and content */}
                      <div className="lg:w-2/3">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="relative flex-shrink-0">
                            <div className="absolute inset-0 bg-blue-400/30 rounded-full blur-xl animate-pulse"></div>
                            <div className="relative bg-gradient-to-br from-blue-500/20 to-indigo-500/10 dark:from-blue-500/30 dark:to-indigo-500/20 w-20 h-20 rounded-2xl flex items-center justify-center z-10 shadow-lg group-hover:shadow-xl transition-all duration-300 backdrop-blur-sm border border-blue-400/20">
                              <svg
                                className="h-10 w-10 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-2xl sm:text-3xl font-bold text-text dark:text-white mb-2">
                              Multi-Disorder Assessment
                            </h3>
                            <p className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-lg font-semibold">
                              Completely Free • No Hidden Costs
                            </p>
                          </div>
                        </div>

                        <p className="text-gray-700 dark:text-gray-300 mb-6 text-lg leading-relaxed">
                          Get a comprehensive evaluation covering ADHD, Autism, and Dyslexia in one
                          integrated assessment. Our AI-powered tools provide detailed insights and
                          personalized recommendations.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                          <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full p-2">
                              <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                            </div>
                            <span className="text-gray-700 dark:text-gray-300 font-medium">
                              ADHD Evaluation
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-full p-2">
                              <CheckCircleIcon className="h-5 w-5 text-indigo-600" />
                            </div>
                            <span className="text-gray-700 dark:text-gray-300 font-medium">
                              Autism Screening
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full p-2">
                              <CheckCircleIcon className="h-5 w-5 text-purple-600" />
                            </div>
                            <span className="text-gray-700 dark:text-gray-300 font-medium">
                              Dyslexia Assessment
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-pink-100 to-blue-100 dark:from-pink-900/30 dark:to-blue-900/30 rounded-full p-2">
                              <CheckCircleIcon className="h-5 w-5 text-pink-600" />
                            </div>
                            <span className="text-gray-700 dark:text-gray-300 font-medium">
                              AI-Powered Reports
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                          <Link
                            to="/assessment"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            Start Free Assessment
                            <ArrowRightIcon className="h-5 w-5" />
                          </Link>
                          <Link
                            to="/assessment"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 font-semibold rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300"
                          >
                            Learn More
                          </Link>
                        </div>
                      </div>

                      {/* Right side - Visual element */}
                      <div className="lg:w-1/3">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-2xl blur-2xl"></div>
                          <div className="relative bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-700/50">
                            <div className="text-center">
                              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                                100%
                              </div>
                              <div className="text-blue-700 dark:text-blue-300 font-semibold mb-1">
                                Free
                              </div>
                              <div className="text-sm text-blue-600 dark:text-blue-400">
                                No Credit Card Required
                              </div>
                            </div>
                            <div className="mt-4 space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-blue-700 dark:text-blue-300">
                                  Assessment Value:
                                </span>
                                <span className="text-gray-600 dark:text-gray-400 line-through">
                                  $299
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-blue-700 dark:text-blue-300">
                                  Your Price:
                                </span>
                                <span className="text-green-600 font-bold">$0</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust indicators */}
            <div className="text-center mt-8 sm:mt-12">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Trusted by thousands of families worldwide
              </p>
              <div className="flex items-center justify-center gap-6 text-gray-400">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm">Secure & Private</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm">Evidence-Based</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm">Instant Results</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Progress Tracking Dashboard Section */}
      <ProgressTrackingSection />

      {/* Enhanced Assessment Tools Section */}
      <section
        ref={cardsRef}
        className="py-12 sm:py-16 lg:py-24 relative overflow-hidden bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/20"
      >
        {/* Enhanced decorative elements - responsive */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(59,130,246,0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_40%,rgba(59,130,246,0.05),transparent_50%)]"></div>
        <div className="absolute top-10 sm:top-20 right-4 sm:right-10 lg:right-20 w-32 sm:w-56 lg:w-72 h-32 sm:h-56 lg:h-72 bg-gradient-to-br from-purple-300/40 to-blue-300/40 dark:from-purple-600/20 dark:to-blue-600/20 rounded-full blur-3xl opacity-70 animate-pulse"></div>
        <div
          className="absolute bottom-10 sm:bottom-20 left-4 sm:left-10 lg:left-20 w-28 sm:w-44 lg:w-56 h-28 sm:h-44 lg:h-56 bg-gradient-to-br from-blue-300/40 to-purple-300/40 dark:from-blue-600/20 dark:to-purple-600/20 rounded-full blur-3xl opacity-70 animate-pulse"
          style={{ animationDelay: '1s' }}
        ></div>

        {/* Floating particles - responsive */}
        <div
          className="absolute top-1/4 left-1/4 w-1.5 sm:w-2 h-1.5 sm:h-2 bg-primary/20 rounded-full animate-float"
          style={{ animationDelay: '0s' }}
        ></div>
        <div
          className="absolute top-1/3 right-1/3 w-2 sm:w-3 h-2 sm:h-3 bg-secondary/20 rounded-full animate-float"
          style={{ animationDelay: '2s' }}
        ></div>
        <div
          className="absolute bottom-1/4 left-1/3 w-1 sm:w-1.5 h-1 sm:h-1.5 bg-accent/20 rounded-full animate-float"
          style={{ animationDelay: '4s' }}
        ></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto mb-12 sm:mb-16 lg:mb-20">
            <div className="relative">
              <div className="inline-flex items-center mb-4 sm:mb-6 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full pl-1 pr-4 py-1 shadow-lg hover:shadow-xl transition-all duration-300">
                <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full w-7 h-7 flex items-center justify-center mr-3">
                  <BeakerIcon className="h-4 w-4" />
                </span>
                <span className="text-blue-700 dark:text-blue-300 text-sm font-semibold tracking-wide">
                  <TranslatedText ns="assessmentTools" i18nKey="badge" />
                </span>
              </div>

              <h2 className="text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-text dark:text-white leading-tight">
                <TranslatedText ns="assessmentTools" i18nKey="title" />
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl mx-auto px-4 sm:px-0">
                <TranslatedText ns="assessmentTools" i18nKey="subtitle" />
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-7xl mx-auto">
            {/* ADHD Card */}
            <div className="group cursor-pointer">
              <div className="relative h-full transform hover:scale-105 transition-all duration-500">
                {/* Enhanced card glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-primary-600 to-primary-500 rounded-3xl blur-lg opacity-0 group-hover:opacity-80 transition-all duration-700 animate-gradient bg-300%"></div>

                <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl overflow-hidden h-full shadow-xl group-hover:shadow-2xl transition-all duration-500 border border-gray-200/50 dark:border-gray-700/50 group-hover:border-primary/30 dark:group-hover:border-primary/30">
                  {/* Enhanced top decoration */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-600 via-primary-400 to-primary-600 animate-gradient bg-300%"></div>

                  <div className="p-4 sm:p-6 lg:p-8">
                    <div className="flex items-center gap-3 sm:gap-4 lg:gap-5 mb-6 sm:mb-8">
                      <div className="relative flex-shrink-0">
                        <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-pulse"></div>
                        <div className="relative bg-gradient-to-br from-primary/20 to-primary/10 dark:from-primary/30 dark:to-primary/20 w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 rounded-2xl flex items-center justify-center z-10 shadow-lg group-hover:shadow-xl transition-all duration-300 backdrop-blur-sm border border-primary/20">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-primary"
                          >
                            <path
                              d="M12 16.01C14.2091 16.01 16 14.2191 16 12.01C16 9.80087 14.2091 8.01001 12 8.01001C9.79086 8.01001 8 9.80087 8 12.01C8 14.2191 9.79086 16.01 12 16.01Z"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            />
                            <path
                              d="M3 12C3 10.1807 4.24892 6.29168 7 3C9.23005 6.3078 12.877 4.65779 15 3C19.6674 6.25309 21.0571 10.4308 21 12V15C21 18.5 19 21 12 21C5 21 3 18.5 3 15V12Z"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            />
                            <path
                              d="M12 8V4M12 8L14 6M12 8L10 6"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-text dark:text-white mb-1 sm:mb-2">
                          <TranslatedText ns="assessmentTools" i18nKey="tools.adhd.title" />
                        </h3>
                        <p className="text-primary-600 dark:text-primary-400 text-xs sm:text-sm font-normal tracking-wide uppercase">
                          <TranslatedText ns="assessmentTools" i18nKey="tools.adhd.subtitle" />
                        </p>
                      </div>
                    </div>

                    <p className="text-gray-700 dark:text-gray-300 mb-6 sm:mb-8 text-sm sm:text-base leading-relaxed">
                      <TranslatedText ns="assessmentTools" i18nKey="tools.adhd.description" />
                    </p>

                    <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                      <li className="flex items-start group/item">
                        <div className="bg-primary/20 rounded-full p-1 mr-2 sm:mr-3 group-hover/item:bg-primary/30 transition-colors duration-200 flex-shrink-0 mt-0.5">
                          <CheckCircleIcon className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                          <TranslatedText ns="assessmentTools" i18nKey="tools.adhd.features.0" />
                        </span>
                      </li>
                      <li className="flex items-start group/item">
                        <div className="bg-primary/20 rounded-full p-1 mr-2 sm:mr-3 group-hover/item:bg-primary/30 transition-colors duration-200 flex-shrink-0 mt-0.5">
                          <CheckCircleIcon className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                          <TranslatedText ns="assessmentTools" i18nKey="tools.adhd.features.1" />
                        </span>
                      </li>
                      <li className="flex items-start group/item">
                        <div className="bg-primary/20 rounded-full p-1 mr-2 sm:mr-3 group-hover/item:bg-primary/30 transition-colors duration-200 flex-shrink-0 mt-0.5">
                          <CheckCircleIcon className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                          <TranslatedText ns="assessmentTools" i18nKey="tools.adhd.features.2" />
                        </span>
                      </li>
                    </ul>

                    <div className="mt-auto">
                      <Link
                        to="/assessment?disorder=adhd"
                        className="inline-flex items-center gap-2 text-primary dark:text-primary-400 font-semibold bg-primary/10 hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30 px-3 sm:px-4 py-2 rounded-xl transition-all duration-300 group/link text-sm sm:text-base"
                      >
                        <TranslatedText ns="assessmentTools" i18nKey="tools.adhd.learnMore" />
                        <ArrowRightIcon className="h-3 h-3 sm:h-4 sm:w-4 group-hover/link:translate-x-1 transition-transform duration-300" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Autism Card */}
            <div className="group cursor-pointer">
              <div className="relative h-full transform hover:scale-105 transition-all duration-500">
                {/* Enhanced card glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-secondary via-secondary-600 to-secondary-500 rounded-3xl blur-lg opacity-0 group-hover:opacity-80 transition-all duration-700 animate-gradient bg-300%"></div>

                <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl overflow-hidden h-full shadow-xl group-hover:shadow-2xl transition-all duration-500 border border-gray-200/50 dark:border-gray-700/50 group-hover:border-secondary/30 dark:group-hover:border-secondary/30">
                  {/* Enhanced top decoration */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary-600 via-secondary-400 to-secondary-600 animate-gradient bg-300%"></div>

                  <div className="p-4 sm:p-6 lg:p-8">
                    <div className="flex items-center gap-3 sm:gap-4 lg:gap-5 mb-6 sm:mb-8">
                      <div className="relative flex-shrink-0">
                        <div className="absolute inset-0 bg-secondary/30 rounded-full blur-xl animate-pulse"></div>
                        <div className="relative bg-gradient-to-br from-secondary/20 to-secondary/10 dark:from-secondary/30 dark:to-secondary/20 w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 rounded-2xl flex items-center justify-center z-10 shadow-lg group-hover:shadow-xl transition-all duration-300 backdrop-blur-sm border border-secondary/20">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-secondary"
                          >
                            <path
                              d="M14 19C17.771 19 19.657 19 20.828 17.828C22 16.657 22 14.771 22 11C22 7.229 22 5.343 20.828 4.172C19.657 3 17.771 3 14 3H10C6.229 3 4.343 3 3.172 4.172C2 5.343 2 7.229 2 11C2 14.771 2 16.657 3.172 17.828C4.343 19 6.229 19 10 19H14Z"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            />
                            <path
                              d="M12 19V22"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                            <path
                              d="M8 22H16"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                            <path
                              d="M8 11V10C8 7.79086 9.79086 6 12 6V6C14.2091 6 16 7.79086 16 10V11"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                            <path
                              d="M8 11C8.55228 11 9 11.4477 9 12C9 12.5523 8.55228 13 8 13C7.44772 13 7 12.5523 7 12C7 11.4477 7.44772 11 8 11Z"
                              fill="currentColor"
                            />
                            <path
                              d="M16 11C16.5523 11 17 11.4477 17 12C17 12.5523 16.5523 13 16 13C15.4477 13 15 12.5523 15 12C15 11.4477 15.4477 11 16 11Z"
                              fill="currentColor"
                            />
                          </svg>
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-text dark:text-white mb-1 sm:mb-2">
                          <TranslatedText ns="assessmentTools" i18nKey="tools.autism.title" />
                        </h3>
                        <p className="text-secondary-600 dark:text-secondary-400 text-xs sm:text-sm font-normal tracking-wide uppercase">
                          <TranslatedText ns="assessmentTools" i18nKey="tools.autism.subtitle" />
                        </p>
                      </div>
                    </div>

                    <p className="text-gray-700 dark:text-gray-300 mb-6 sm:mb-8 text-sm sm:text-base leading-relaxed">
                      <TranslatedText ns="assessmentTools" i18nKey="tools.autism.description" />
                    </p>

                    <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                      <li className="flex items-start group/item">
                        <div className="bg-secondary/20 rounded-full p-1 mr-2 sm:mr-3 group-hover/item:bg-secondary/30 transition-colors duration-200 flex-shrink-0 mt-0.5">
                          <CheckCircleIcon className="h-3 w-3 sm:h-4 sm:w-4 text-secondary" />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                          <TranslatedText ns="assessmentTools" i18nKey="tools.autism.features.0" />
                        </span>
                      </li>
                      <li className="flex items-start group/item">
                        <div className="bg-secondary/20 rounded-full p-1 mr-2 sm:mr-3 group-hover/item:bg-secondary/30 transition-colors duration-200 flex-shrink-0 mt-0.5">
                          <CheckCircleIcon className="h-3 w-3 sm:h-4 sm:w-4 text-secondary" />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                          <TranslatedText ns="assessmentTools" i18nKey="tools.autism.features.1" />
                        </span>
                      </li>
                      <li className="flex items-start group/item">
                        <div className="bg-secondary/20 rounded-full p-1 mr-2 sm:mr-3 group-hover/item:bg-secondary/30 transition-colors duration-200 flex-shrink-0 mt-0.5">
                          <CheckCircleIcon className="h-3 w-3 sm:h-4 sm:w-4 text-secondary" />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                          <TranslatedText ns="assessmentTools" i18nKey="tools.autism.features.2" />
                        </span>
                      </li>
                    </ul>

                    <div className="mt-auto">
                      <Link
                        to="/assessment?disorder=autism"
                        className="inline-flex items-center gap-2 text-secondary dark:text-secondary-400 font-semibold bg-secondary/10 hover:bg-secondary/20 dark:bg-secondary/20 dark:hover:bg-secondary/30 px-3 sm:px-4 py-2 rounded-xl transition-all duration-300 group/link text-sm sm:text-base"
                      >
                        <TranslatedText ns="assessmentTools" i18nKey="tools.autism.learnMore" />
                        <ArrowRightIcon className="h-3 w-3 sm:h-4 sm:w-4 group-hover/link:translate-x-1 transition-transform duration-300" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dyslexia Card */}
            <div className="group cursor-pointer">
              <div className="relative h-full transform hover:scale-105 transition-all duration-500">
                {/* Enhanced card glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-accent via-accent-600 to-accent-500 rounded-3xl blur-lg opacity-0 group-hover:opacity-80 transition-all duration-700 animate-gradient bg-300%"></div>

                <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl overflow-hidden h-full shadow-xl group-hover:shadow-2xl transition-all duration-500 border border-gray-200/50 dark:border-gray-700/50 group-hover:border-accent/30 dark:group-hover:border-accent/30">
                  {/* Enhanced top decoration */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-600 via-accent-400 to-accent-600 animate-gradient bg-300%"></div>

                  <div className="p-4 sm:p-6 lg:p-8">
                    <div className="flex items-center gap-3 sm:gap-4 lg:gap-5 mb-6 sm:mb-8">
                      <div className="relative flex-shrink-0">
                        <div className="absolute inset-0 bg-accent/30 rounded-full blur-xl animate-pulse"></div>
                        <div className="relative bg-gradient-to-br from-accent/20 to-accent/10 dark:from-accent/30 dark:to-accent/20 w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 rounded-2xl flex items-center justify-center z-10 shadow-lg group-hover:shadow-xl transition-all duration-300 backdrop-blur-sm border border-accent/20">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-accent"
                          >
                            <path
                              d="M12 21V12M12 12V3M12 12H21M12 12H3"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M20 7L18.5 5.5M18.5 5.5L17 4M18.5 5.5L20 4M18.5 5.5L17 7"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M4 7L5.5 5.5M5.5 5.5L7 4M5.5 5.5L4 4M5.5 5.5L7 7"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M7 20L5.5 18.5M5.5 18.5L4 17M5.5 18.5L4 20M5.5 18.5L7 17"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M20 17L18.5 18.5M18.5 18.5L17 20M18.5 18.5L17 17M18.5 18.5L20 20"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-text dark:text-white mb-1 sm:mb-2">
                          <TranslatedText ns="assessmentTools" i18nKey="tools.dyslexia.title" />
                        </h3>
                        <p className="text-accent-600 dark:text-accent-400 text-xs sm:text-sm font-normal tracking-wide uppercase">
                          <TranslatedText ns="assessmentTools" i18nKey="tools.dyslexia.subtitle" />
                        </p>
                      </div>
                    </div>

                    <p className="text-gray-700 dark:text-gray-300 mb-6 sm:mb-8 text-sm sm:text-base leading-relaxed">
                      <TranslatedText ns="assessmentTools" i18nKey="tools.dyslexia.description" />
                    </p>

                    <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                      <li className="flex items-start group/item">
                        <div className="bg-accent/20 rounded-full p-1 mr-2 sm:mr-3 group-hover/item:bg-accent/30 transition-colors duration-200 flex-shrink-0 mt-0.5">
                          <CheckCircleIcon className="h-3 w-3 sm:h-4 sm:w-4 text-accent" />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                          <TranslatedText
                            ns="assessmentTools"
                            i18nKey="tools.dyslexia.features.0"
                          />
                        </span>
                      </li>
                      <li className="flex items-start group/item">
                        <div className="bg-accent/20 rounded-full p-1 mr-2 sm:mr-3 group-hover/item:bg-accent/30 transition-colors duration-200 flex-shrink-0 mt-0.5">
                          <CheckCircleIcon className="h-3 w-3 sm:h-4 sm:w-4 text-accent" />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                          <TranslatedText
                            ns="assessmentTools"
                            i18nKey="tools.dyslexia.features.1"
                          />
                        </span>
                      </li>
                      <li className="flex items-start group/item">
                        <div className="bg-accent/20 rounded-full p-1 mr-2 sm:mr-3 group-hover/item:bg-accent/30 transition-colors duration-200 flex-shrink-0 mt-0.5">
                          <CheckCircleIcon className="h-3 w-3 sm:h-4 sm:w-4 text-accent" />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                          <TranslatedText
                            ns="assessmentTools"
                            i18nKey="tools.dyslexia.features.2"
                          />
                        </span>
                      </li>
                    </ul>

                    <div className="mt-auto">
                      <Link
                        to="/assessment?disorder=dyslexia"
                        className="inline-flex items-center gap-2 text-accent dark:text-accent-400 font-semibold bg-accent/10 hover:bg-accent/20 dark:bg-accent/20 dark:hover:bg-accent/30 px-3 sm:px-4 py-2 rounded-xl transition-all duration-300 group/link text-sm sm:text-base"
                      >
                        <TranslatedText ns="assessmentTools" i18nKey="tools.dyslexia.learnMore" />
                        <ArrowRightIcon className="h-3 w-3 sm:h-4 sm:w-4 group-hover/link:translate-x-1 transition-transform duration-300" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* View all assessments button */}
          <div className="text-center mt-8 sm:mt-12">
            <Link
              to="/assessment"
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md hover:shadow-lg hover:border-primary/30 dark:hover:border-primary/30 transition-all duration-300 text-gray-800 dark:text-gray-200 font-normal text-sm sm:text-base"
            >
              <TranslatedText ns="assessmentTools" i18nKey="viewAll" />
              <ArrowRightIcon className="h-3 w-3 sm:h-4 sm:w-4 text-primary dark:text-primary-400" />
            </Link>
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section
        ref={ctaRef}
        className="py-12 sm:py-16 lg:py-24 relative overflow-hidden bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/20"
      >
        {/* Enhanced decorative background elements - responsive */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(59,130,246,0.15),transparent_50%)] dark:bg-[radial-gradient(circle_at_70%_30%,rgba(59,130,246,0.08),transparent_50%)]"></div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>

        {/* Floating elements - responsive */}
        <div className="absolute top-10 sm:top-20 right-4 sm:right-10 lg:right-20 w-20 sm:w-28 lg:w-32 h-20 sm:h-28 lg:h-32 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-2xl opacity-60 animate-pulse"></div>
        <div
          className="absolute bottom-10 sm:bottom-20 left-4 sm:left-10 lg:left-20 w-16 sm:w-20 lg:w-24 h-16 sm:h-20 lg:h-24 bg-gradient-to-br from-secondary/20 to-accent/20 rounded-full blur-2xl opacity-60 animate-pulse"
          style={{ animationDelay: '2s' }}
        ></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/30 dark:border-gray-700/30 overflow-hidden group hover:shadow-3xl transition-all duration-500">
            <div className="flex flex-col lg:flex-row">
              {/* Enhanced Image column */}
              <div className="lg:w-2/5 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-secondary/85 to-accent/90 opacity-95"></div>
                <img
                  src="https://images.unsplash.com/photo-1529390079861-591de354faf5?q=80&w=2070&auto=format&fit=crop"
                  alt="Interactive demo preview"
                  className="object-cover h-full w-full min-h-[300px] sm:min-h-[400px] lg:min-h-[600px]"
                />
                <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-8 lg:p-12">
                  <div className="text-white text-center">
                    <div className="relative">
                      <div className="bg-white/25 backdrop-blur-lg rounded-2xl p-3 sm:p-4 mb-6 sm:mb-8 inline-block shadow-xl border border-white/30 group-hover:scale-110 transition-transform duration-500">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="w-8 sm:w-10 lg:w-12 h-8 sm:h-10 lg:h-12 text-white"
                        >
                          <path d="M9 12l2 2 4-4" />
                          <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3" />
                          <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3" />
                          <path d="M12 21c0-1-1-3-3-3s-3 2-3 3 1 3 3 3 3-2 3-3" />
                          <path d="M12 3c0 1-1 3-3 3s-3-2-3-3 1-3 3-3 3 2 3 3" />
                        </svg>
                      </div>
                      <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold mb-3 sm:mb-4 leading-tight">
                        <TranslatedText ns="cta" i18nKey="mainTitle" />
                      </h3>
                      <p className="text-white/95 text-sm sm:text-base lg:text-lg leading-relaxed px-2 sm:px-0">
                        <TranslatedText ns="cta" i18nKey="description" />
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Text column */}
              <div className="lg:w-3/5 p-6 sm:p-8 lg:p-16">
                <div className="h-full flex flex-col justify-center">
                  <div className="mb-4 sm:mb-6">
                    <div className="inline-flex items-center mb-3 sm:mb-4 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full pl-1 pr-4 py-1 shadow-lg hover:shadow-xl transition-all duration-300">
                      <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full w-7 h-7 flex items-center justify-center mr-3">
                        <svg
                          className="w-2.5 sm:w-3 h-2.5 sm:h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                      <span className="text-blue-700 dark:text-blue-300 text-sm font-semibold tracking-wide">
                        <TranslatedText ns="common" i18nKey="trustedByFamilies" />
                      </span>
                    </div>
                  </div>

                  <h2 className="text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-text dark:text-white leading-tight">
                    <TranslatedText ns="cta" i18nKey="mainTitle" />
                  </h2>

                  <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 lg:mb-10 leading-relaxed">
                    <TranslatedText ns="cta" i18nKey="description" />
                  </p>

                  <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8 lg:mb-10">
                    <div className="flex items-start gap-3 sm:gap-4 group/feature">
                      <div className="bg-gradient-to-br from-primary/20 to-primary/10 dark:from-primary/30 dark:to-primary/20 rounded-2xl p-2 sm:p-3 group-hover/feature:scale-110 transition-transform duration-300 shadow-lg flex-shrink-0">
                        <CheckCircleIcon className="h-5 sm:h-6 w-5 sm:w-6 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-base sm:text-lg text-text dark:text-white mb-1 sm:mb-2">
                          <TranslatedText ns="cta" i18nKey="features.evidenceBased.title" />
                        </h4>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                          <TranslatedText ns="cta" i18nKey="features.evidenceBased.description" />
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 sm:gap-4 group/feature">
                      <div className="bg-gradient-to-br from-secondary/20 to-secondary/10 dark:from-secondary/30 dark:to-secondary/20 rounded-2xl p-2 sm:p-3 group-hover/feature:scale-110 transition-transform duration-300 shadow-lg flex-shrink-0">
                        <CheckCircleIcon className="h-5 sm:h-6 w-5 sm:w-6 text-secondary" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-base sm:text-lg text-text dark:text-white mb-1 sm:mb-2">
                          <TranslatedText ns="cta" i18nKey="features.privateSecure.title" />
                        </h4>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                          <TranslatedText ns="cta" i18nKey="features.privateSecure.description" />
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 sm:gap-4 group/feature">
                      <div className="bg-gradient-to-br from-accent/20 to-accent/10 dark:from-accent/30 dark:to-accent/20 rounded-2xl p-2 sm:p-3 group-hover/feature:scale-110 transition-transform duration-300 shadow-lg flex-shrink-0">
                        <CheckCircleIcon className="h-5 sm:h-6 w-5 sm:w-6 text-accent" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-base sm:text-lg text-text dark:text-white mb-1 sm:mb-2">
                          <TranslatedText ns="cta" i18nKey="features.actionable.title" />
                        </h4>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                          <TranslatedText ns="cta" i18nKey="features.actionable.description" />
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <Button
                      variant="gradient"
                      size="lg"
                      onClick={handleGetStarted}
                      className="w-full sm:w-auto"
                    >
                      {isLoggedIn ? (
                        <TranslatedText ns="cta" i18nKey="buttons.getStarted" />
                      ) : (
                        <TranslatedText ns="cta" i18nKey="buttons.createAccount" />
                      )}
                      <ArrowRightIcon className="h-5 sm:h-6 w-5 sm:w-6 ml-2 transition-transform duration-300" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Add ChatWidget at the end */}
      <ChatWidget />
    </div>
  );
};

// Use React.memo to prevent unnecessary re-renders
export default React.memo(LandingPage);
