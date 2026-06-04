import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import PricingService from '../../services/PricingService';
import LanguageSelector, { MobileLanguageSelector } from './LanguageSelector';
import TranslatedText from './TranslatedText';
import { useTranslation } from 'react-i18next';

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation('common');
  const { isLoggedIn, logout, currentUser } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [userName, setUserName] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const [isPaidUser, setIsPaidUser] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Track scroll position to change navbar styling when scrolled
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check if user is logged in and get user name
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      setUserName(currentUser.firstName || 'User');
    }
  }, [isLoggedIn, currentUser]);

  useEffect(() => {
    const loadPurchases = async () => {
      try {
        if (!isLoggedIn) {
          setIsPaidUser(false);
          return;
        }
        const res = await PricingService.getUserPurchases();
        const purchases = res?.data || [];
        const now = Date.now();
        const paid = purchases.some(
          p =>
            p.paymentStatus === 'completed' &&
            p.isActive !== false &&
            (!p.expiresAt || new Date(p.expiresAt).getTime() > now)
        );
        setIsPaidUser(paid);
      } catch (e) {
        setIsPaidUser(false);
      }
    };
    loadPurchases();
  }, [isLoggedIn]);

  const handleLogout = () => {
    // Use the logout function from AuthContext
    logout();

    // Close menu
    setIsUserMenuOpen(false);

    // Redirect to home
    navigate('/');
  };

  // Toggle mobile menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  // Close both menus when clicked outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsUserMenuOpen(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Navigation items configuration
  const navItems = [
    {
      to: '/assessment',
      label: t('nav.assessments'),
      icon: (
        <svg
          className="w-4 h-4 mr-2 sm:w-5 sm:h-5 sm:mr-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      ),
      dashArray: '0 2 10 95 10 15',
    },
    {
      to: '/pricing',
      label: t('nav.pricing'),
      icon: (
        <svg
          className="w-4 h-4 mr-2 sm:w-5 sm:h-5 sm:mr-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
          />
        </svg>
      ),
      dashArray: '0 17 12 63 12 40',
    },
    {
      to: '/blog',
      label: t('nav.resources'),
      icon: (
        <svg
          className="w-4 h-4 mr-2 sm:w-5 sm:h-5 sm:mr-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      ),
      dashArray: '0 32 11 35 11 73',
    },
    {
      to: '/support',
      label: t('nav.support'),
      icon: (
        <svg
          className="w-4 h-4 mr-2 sm:w-5 sm:h-5 sm:mr-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      dashArray: '0 47 9 13 9 100',
    },
  ];

  // Get stroke dasharray based on hovered index
  const getStrokeDashArray = () => {
    if (hoveredIndex >= 0 && hoveredIndex < navItems.length) {
      return navItems[hoveredIndex].dashArray;
    }
    return '0 0 10 40 10 40';
  };

  // Get stroke dashoffset based on hovered state
  const getStrokeDashOffset = () => {
    return hoveredIndex >= 0 ? 0 : 5;
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
        isScrolled
          ? 'backdrop-blur-3xl bg-gradient-to-r from-white/80 via-white/90 to-white/80 dark:from-gray-900/80 dark:via-gray-900/90 dark:to-gray-900/80 shadow-xl shadow-black/5 border-b border-gray-200/30 dark:border-gray-700/20'
          : 'backdrop-blur-xl bg-gradient-to-r from-transparent via-white/10 to-transparent dark:from-transparent dark:via-gray-900/10 dark:to-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-18 lg:h-20">
          {/* Enhanced Logo with Animation */}
          <motion.div
            className="flex-shrink-0"
            whileHover={{ scale: 1.03 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          >
            <Link
              to="/"
              className="group flex items-center space-x-3 focus:outline-none focus:ring-0 focus:border-transparent rounded-lg"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div className="relative flex items-center">
                <motion.img
                  src="/LOGO.png"
                  alt="CogniKidz Logo"
                  className="h-8 sm:h-10 md:h-12 w-auto transition-all duration-300 focus:outline-none"
                  whileHover={{
                    scale: 1.1,
                    rotate: 360,
                    filter: 'brightness(1.2) saturate(1.2)',
                  }}
                  transition={{
                    duration: 0.6,
                    ease: 'easeInOut',
                    rotate: { duration: 0.8, ease: 'easeInOut' },
                  }}
                />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-primary/30 to-purple-600/30 rounded-full opacity-0 blur-md -z-10"
                  whileHover={{ opacity: 1, scale: 1.2 }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <motion.span
                className="hidden sm:block text-lg md:text-xl lg:text-2xl font-bold bg-gradient-to-r from-primary via-purple-600 to-indigo-600 bg-clip-text text-transparent select-none focus:outline-none"
                style={{
                  WebkitTapHighlightColor: 'transparent',
                  outline: 'none',
                  border: 'none',
                }}
                whileHover={{
                  scale: 1.02,
                }}
                transition={{ duration: 0.2 }}
              >
                CogniKidz
              </motion.span>
            </Link>
          </motion.div>

          {/* Clean Navigation - Desktop */}
          <div className="hidden lg:flex items-center justify-center flex-1">
            <motion.div
              className="relative flex items-center space-x-4 md:space-x-6 lg:space-x-8"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              onMouseLeave={() => setHoveredIndex(-1)}
            >
              {navItems.map((item, index) => (
                <motion.div
                  key={item.to}
                  className="relative"
                  onMouseEnter={() => setHoveredIndex(index)}
                >
                  <Link
                    to={item.to}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 cursor-pointer relative hover:bg-white/50 dark:hover:bg-gray-800/50 backdrop-blur-sm ${
                      location.pathname === item.to
                        ? 'text-primary-600 dark:text-primary-400 bg-white/30 dark:bg-gray-800/30'
                        : 'text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400'
                    }`}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    {item.icon}
                    <TranslatedText>{item.label}</TranslatedText>

                    {/* Active indicator */}
                    {location.pathname === item.to && (
                      <motion.div
                        className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-600 to-purple-600 rounded-full"
                        layoutId="activeIndicator"
                        initial={{ opacity: 0, scaleX: 0 }}
                        animate={{ opacity: 1, scaleX: 1 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                      />
                    )}

                    {/* Hover indicator */}
                    {hoveredIndex === index && location.pathname !== item.to && (
                      <motion.div
                        className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-400 to-purple-500 rounded-full"
                        initial={{ opacity: 0, scaleX: 0 }}
                        animate={{ opacity: 1, scaleX: 1 }}
                        exit={{ opacity: 0, scaleX: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                      />
                    )}
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Right Side - Language, Auth & Theme */}
          <div className="flex items-center space-x-3">
            {/* Language Selector */}
            <motion.div
              className="hidden sm:block"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <LanguageSelector
                variant="navbar"
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
              />
            </motion.div>

            {isLoggedIn ? (
              <motion.div
                className="relative"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                <motion.button
                  onClick={e => {
                    e.stopPropagation();
                    toggleUserMenu();
                  }}
                  className="group flex items-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl hover:bg-white dark:hover:bg-gray-800 px-2 py-1.5 rounded-lg border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-300 focus:outline-none focus:ring-0 focus:border-transparent"
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <motion.div
                    className="w-6 h-6 bg-gradient-to-br from-primary via-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm"
                    whileHover={{
                      boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    {userName.charAt(0).toUpperCase()}
                  </motion.div>
                  {isPaidUser && (
                    <span
                      title="Paid User"
                      className="absolute -top-1 -right-1 inline-flex items-center justify-center w-4 h-4 text-[10px] leading-none rounded-full bg-yellow-400 text-yellow-900 shadow"
                    >
                      ★
                    </span>
                  )}
                  <span className="ml-2 hidden md:block font-medium text-gray-700 dark:text-gray-200 text-sm">
                    {userName.split(' ')[0]}
                  </span>
                  <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="ml-1 h-3 w-3 text-gray-500 dark:text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    animate={{ rotate: isUserMenuOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </motion.svg>
                </motion.button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      onClick={e => e.stopPropagation()}
                      className="absolute right-0 mt-2 w-56 backdrop-blur-2xl bg-white/95 dark:bg-gray-800/95 rounded-xl shadow-xl py-2 z-50 border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
                    >
                      <UserMenuItem to="/dashboard" onClick={() => setIsUserMenuOpen(false)}>
                        <span className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                          </svg>
                          Dashboard
                        </span>
                      </UserMenuItem>

                      {/* Progress & Reports Dropdown */}
                      <UserMenuItem to="/progress" onClick={() => setIsUserMenuOpen(false)}>
                        <span className="flex items-center">
                          <span className="inline-flex items-center justify-center w-5 h-5 mr-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                            <svg
                              className="w-4 h-4 text-blue-600 dark:text-blue-400"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 17v2a2 2 0 002 2h14a2 2 0 002-2v-2M8 17v-6m4 6V7m4 10v-3"
                              />
                            </svg>
                          </span>
                          Progress
                        </span>
                      </UserMenuItem>
                      <UserMenuItem to="/saved-articles" onClick={() => setIsUserMenuOpen(false)}>
                        <span className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                            />
                          </svg>
                          Saved Articles
                        </span>
                      </UserMenuItem>
                      <UserMenuItem to="/parent-profile" onClick={() => setIsUserMenuOpen(false)}>
                        <span className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          My Profile
                        </span>
                      </UserMenuItem>
                      <div className="my-2 mx-3 border-t border-gray-200/50 dark:border-gray-600/50" />
                      <motion.div whileHover={{ x: 2, scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                        <button
                          onClick={handleLogout}
                          className="group flex items-center w-full text-left px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50/80 dark:hover:bg-red-900/30 rounded-xl mx-3 transition-all duration-300 focus:outline-none focus:ring-0 focus:border-transparent"
                          style={{ WebkitTapHighlightColor: 'transparent' }}
                        >
                          <svg
                            className="w-4 h-4 mr-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                          </svg>
                          <TranslatedText>Logout</TranslatedText>
                        </button>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                className="flex items-center space-x-3"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    to="/login"
                    className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg font-medium text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary-400 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl hover:bg-white dark:hover:bg-gray-800 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-300 focus:outline-none focus:ring-0 focus:border-transparent"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <TranslatedText>Login</TranslatedText>
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    to="/signup"
                    className="group inline-flex items-center px-4 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-primary via-purple-600 to-indigo-600 hover:from-primary-600 hover:via-purple-700 hover:to-indigo-700 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 relative overflow-hidden focus:outline-none focus:ring-0 focus:border-transparent"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    />
                    <span className="relative z-10">
                      <TranslatedText>Get Started</TranslatedText>
                    </span>
                  </Link>
                </motion.div>
              </motion.div>
            )}

            {/* Theme Toggle */}
            <motion.button
              onClick={toggleTheme}
              className="group p-1.5 rounded-lg text-gray-600 dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl hover:bg-white dark:hover:bg-gray-800 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-300 focus:outline-none focus:ring-0 focus:border-transparent"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <AnimatePresence mode="wait">
                {theme === 'dark' ? (
                  <motion.div
                    key="sun"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Mobile menu button */}
            <motion.button
              onClick={toggleMenu}
              className="lg:hidden p-1.5 rounded-lg text-gray-700 dark:text-gray-200 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl hover:bg-white dark:hover:bg-gray-800 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-300 focus:outline-none focus:ring-0 focus:border-transparent"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <AnimatePresence mode="wait">
                {isMenuOpen ? (
                  <motion.svg
                    key="close"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </motion.svg>
                ) : (
                  <motion.svg
                    key="menu"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </motion.svg>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Enhanced Mobile menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="lg:hidden backdrop-blur-3xl bg-gradient-to-b from-white/90 to-white/95 dark:from-gray-900/90 dark:to-gray-900/95 shadow-xl border-t border-gray-200/30 dark:border-gray-700/30"
          >
            <div className="px-4 pt-4 pb-6 space-y-2">
              {navItems.map((item, index) => (
                <MobileNavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMenuOpen(false)}
                  delay={0.1 * (index + 1)}
                >
                  {item.icon}
                  <TranslatedText>{item.label}</TranslatedText>
                </MobileNavLink>
              ))}

              {/* Mobile Language Selector */}
              <motion.div
                className="px-4 py-4 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.3 }}
              >
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  <svg
                    className="w-4 h-4 mr-2 inline"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                    />
                  </svg>
                  <TranslatedText>Language</TranslatedText>
                </label>
                <MobileLanguageSelector />
              </motion.div>

              {!isLoggedIn && (
                <motion.div
                  className="pt-3 space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.3 }}
                >
                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Link
                      to="/login"
                      className="block w-full px-4 py-4 text-center rounded-xl font-medium text-primary-600 dark:text-primary-400 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-primary-200/50 dark:border-primary-700/50 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 shadow-sm hover:shadow-md focus:outline-none focus:ring-0 focus:border-transparent"
                      onClick={() => setIsMenuOpen(false)}
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      <TranslatedText>Login</TranslatedText>
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Link
                      to="/signup"
                      className="block w-full px-4 py-4 text-center rounded-xl font-semibold text-white bg-gradient-to-r from-primary via-purple-600 to-indigo-600 shadow-lg shadow-primary/25 transition-all duration-300 relative overflow-hidden focus:outline-none focus:ring-0 focus:border-transparent"
                      onClick={() => setIsMenuOpen(false)}
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      />
                      <span className="relative z-10">
                        <TranslatedText>Get Started</TranslatedText>
                      </span>
                    </Link>
                  </motion.div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

// MobileNavLink component with staggered animation
const MobileNavLink = ({ to, children, onClick, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.3 }}
    whileHover={{ scale: 1.01, x: 2 }}
    whileTap={{ scale: 0.99 }}
  >
    <Link
      to={to}
      className="group flex items-center px-4 py-4 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-400 hover:bg-gray-100/70 dark:hover:bg-gray-700/70 transition-all duration-300 shadow-sm hover:shadow-md focus:outline-none focus:ring-0 focus:border-transparent"
      onClick={onClick}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {children}
    </Link>
  </motion.div>
);

// UserMenuItem component with better animations
const UserMenuItem = ({ to, children, onClick }) => (
  <motion.div whileHover={{ x: 2, scale: 1.01 }} whileTap={{ scale: 0.99 }}>
    <Link
      to={to}
      className="group flex items-center px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary-400 hover:bg-gray-50/80 dark:hover:bg-gray-700/80 rounded-xl mx-3 transition-all duration-300 focus:outline-none focus:ring-0 focus:border-transparent"
      onClick={onClick}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {children}
    </Link>
  </motion.div>
);

export default Navbar;
