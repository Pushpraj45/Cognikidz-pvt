import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ArrowDownTrayIcon, PrinterIcon } from '@heroicons/react/24/outline';
import ReportCard from './ReportCard';

const ReportPreviewModal = ({ report, isOpen, onClose, onDownload }) => {
  // Handle keyboard events (Escape to close)
  useEffect(() => {
    const handleKeyDown = e => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // If not open, don't render anything
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60"
            onClick={onClose}
          />

          {/* Modal container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, type: 'spring', damping: 15 }}
            className="relative bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-xl border border-white/20 dark:border-gray-700/30 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            {/* Decorative elements */}
            <div className="absolute -top-24 -right-24 w-40 h-40 bg-gradient-radial from-primary/20 to-transparent rounded-full blur-xl z-0"></div>
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-radial from-secondary/20 to-transparent rounded-full blur-xl z-0"></div>

            {/* Modal header */}
            <div className="flex items-center justify-between sticky top-0 z-10 bg-white/90 dark:bg-gray-800/90 border-b border-white/20 dark:border-gray-700/30 p-4 rounded-t-xl">
              <div className="inline-flex items-center">
                <span className="bg-primary text-white dark:bg-primary/90 dark:text-white rounded-full w-6 h-6 flex items-center justify-center mr-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Assessment Report
                </h2>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/70 dark:bg-gray-700/70 border border-white/10 dark:border-gray-700/30"
                >
                  <PrinterIcon className="h-5 w-5" />
                  <span className="sr-only">Print</span>
                </button>

                <button
                  onClick={onDownload}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/70 dark:bg-gray-700/70 border border-white/10 dark:border-gray-700/30"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  <span className="sr-only">Download</span>
                </button>

                <button
                  onClick={onClose}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/70 dark:bg-gray-700/70 border border-white/10 dark:border-gray-700/30"
                >
                  <XMarkIcon className="h-5 w-5" />
                  <span className="sr-only">Close</span>
                </button>
              </div>
            </div>

            {/* Modal content */}
            <div className="p-4 relative z-10">
              <ReportCard report={report} />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ReportPreviewModal;
