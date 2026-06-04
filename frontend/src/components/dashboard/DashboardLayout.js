import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FADE_UP } from '../../utils/animations';
import FloatingActionButton from './FloatingActionButton';
import LanguageSelector from '../ui/LanguageSelector';

// Icons
import {
  HomeIcon,
  PersonIcon,
  StackIcon,
  GearIcon,
  ExitIcon,
  MagnifyingGlassIcon,
  BellIcon,
  MoonIcon,
  SunIcon,
} from '@radix-ui/react-icons';

const DashboardLayout = ({
  children,
  userRole = 'parent', // parent or admin
  onLogout,
  onThemeToggle,
  isDarkTheme = false,
  childrenData = [],
  // Note: Global dashboard filter is now placed in Dashboard.js header
  // beside the parent name for consistent filtering across all tabs
}) => {
  const location = useLocation();
  const isActive = path => location.pathname === path;

  // Define navigation links based on user role
  const navLinks = [
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: <HomeIcon className="w-5 h-5" />,
      roles: ['parent', 'admin'],
    },
    {
      title: 'Children',
      path: '/dashboard/children',
      icon: <PersonIcon className="w-5 h-5" />,
      roles: ['parent', 'admin'],
    },
    {
      title: 'Resources',
      path: '/blog',
      icon: <StackIcon className="w-5 h-5" />,
      roles: ['parent', 'admin'],
    },
    {
      title: 'Content Management',
      path: '/dashboard/content',
      icon: <StackIcon className="w-5 h-5" />,
      roles: ['admin'],
    },
    {
      title: 'System Health',
      path: '/dashboard/system',
      icon: <GearIcon className="w-5 h-5" />,
      roles: ['admin'],
    },
    {
      title: 'Settings',
      path: '/dashboard/settings',
      icon: <GearIcon className="w-5 h-5" />,
      roles: ['parent', 'admin'],
    },
  ];

  // Filter links based on user role
  const filteredLinks = navLinks.filter(link => link.roles.includes(userRole));

  return (
    <div className="min-h-screen bg-background dark:bg-dark-background relative overflow-hidden">
      {/* Background decorations similar to login page */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial from-primary/5 to-transparent opacity-60 dark:opacity-30"></div>
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-radial from-secondary/10 to-transparent rounded-full dark:from-secondary/5"></div>
        <div className="absolute bottom-40 left-20 w-[600px] h-[600px] bg-gradient-radial from-accent/10 to-transparent rounded-full dark:from-accent/5"></div>

        {/* Static dots */}
        <div className="absolute top-[20%] left-[15%] w-3 h-3 bg-primary rounded-full opacity-40"></div>
        <div className="absolute top-[25%] right-[10%] w-2 h-2 bg-accent rounded-full opacity-40"></div>
        <div className="absolute bottom-[30%] right-[20%] w-2 h-2 bg-secondary rounded-full opacity-40"></div>
        <div className="absolute top-[60%] left-[5%] w-2 h-2 bg-primary rounded-full opacity-40"></div>
      </div>

      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white/90 dark:bg-gray-800/90 border-r border-white/20 dark:border-gray-700/30 z-30 shadow-lg">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center px-4 border-b border-white/20 dark:border-gray-700/30">
            <Link to="/dashboard" className="flex items-center">
              <span className="text-xl font-bold text-primary">CogniKidz</span>
            </Link>

            <button
              onClick={onThemeToggle}
              className="ml-auto p-2 rounded-full hover:bg-white/50 dark:hover:bg-gray-700/50 text-gray-500 dark:text-gray-400 transition-colors"
              aria-label="Toggle theme"
            >
              {isDarkTheme ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>
          </div>

          {/* Nav Links */}
          <div className="flex-1 px-2 py-4 overflow-y-auto">
            <nav className="space-y-1">
              {filteredLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive(link.path)
                      ? 'bg-primary/10 text-primary dark:bg-primary-900/20 dark:text-primary-300 border border-primary/10 dark:border-primary-700/30'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50 border border-transparent hover:border-white/10 dark:hover:border-gray-700/20'
                  }`}
                >
                  <span className="mr-3">{link.icon}</span>
                  {link.title}
                </Link>
              ))}
            </nav>
          </div>

          {/* Logout Button */}
          <div className="p-4 border-t border-white/20 dark:border-gray-700/30">
            <button
              onClick={onLogout}
              className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-white/10 dark:border-gray-700/20"
            >
              <ExitIcon className="w-5 h-5 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 ml-64">
        {/* Top navbar */}
        <header className="sticky top-0 z-20 bg-white/90 dark:bg-gray-800/90 border-b border-white/20 dark:border-gray-700/30 h-16 shadow-sm">
          <div className="px-6 h-full flex items-center justify-between">
            {/* Search */}
            <div className="w-96">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  className="block w-full pl-10 pr-3 py-2 border border-white/20 dark:border-gray-700/30 rounded-lg bg-white/70 dark:bg-gray-800/70 text-gray-900 dark:text-gray-100 focus:ring-primary focus:border-primary text-sm"
                />
              </div>
            </div>

            {/* User actions */}
            <div className="flex items-center space-x-3">
              {/* Language Selector */}
              <LanguageSelector variant="compact" className="mx-2" />

              <button className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors">
                <BellIcon className="h-5 w-5" />
              </button>
              <div className="ml-4 flex items-center">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary-400/80 to-primary-500/80 flex items-center justify-center text-white font-medium shadow-sm border border-white/20 dark:border-gray-700/30">
                  {userRole === 'parent' ? 'P' : 'A'}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {userRole === 'parent' ? 'Parent User' : 'Admin User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {userRole === 'parent' ? 'Parent Account' : 'Administrator'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6 relative z-10">
          <motion.div variants={FADE_UP} initial="hidden" animate="visible" className="w-full">
            {children}
          </motion.div>
        </main>
      </div>

      {/* Floating Action Button */}
      {userRole === 'parent' && <FloatingActionButton childrenData={childrenData} />}
    </div>
  );
};

export default DashboardLayout;
