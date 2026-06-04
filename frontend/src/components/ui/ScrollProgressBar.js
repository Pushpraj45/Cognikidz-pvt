import React from 'react';
import useScrollProgress from '../../hooks/useScrollProgress';
import { useLocation } from 'react-router-dom';

const ScrollProgressBar = () => {
  const scrollProgress = useScrollProgress();
  const location = useLocation();

  // Hide progress bar on assessment paths
  const isAssessmentPath = location.pathname.includes('/assessment/');

  if (isAssessmentPath) return null;

  return (
    <div className="fixed top-14 sm:top-16 md:top-18 lg:top-20 left-0 right-0 z-30 h-1 bg-gray-200/30 dark:bg-gray-800/30">
      <div
        className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300 ease-out shadow-colored-sm"
        style={{
          width: `${scrollProgress}%`,
          boxShadow: scrollProgress > 0 ? '0 0 12px rgba(99, 102, 241, 0.4)' : 'none',
        }}
      />
    </div>
  );
};

export default ScrollProgressBar;
