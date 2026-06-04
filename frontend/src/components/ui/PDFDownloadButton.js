import React, { useState } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';
import PDFService from '../../services/PDFService';
import { ReportLoader } from './LogoLoader';

const PDFDownloadButton = ({
  type,
  itemId,
  itemName,
  className = '',
  variant = 'primary',
  size = 'md',
  children,
  disabled = false,
  showPreview = false,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState({ isLoading: false, message: '', progress: 0 });

  const handleDownload = async () => {
    if (isDownloading || disabled) return;

    // Check if PDF service is supported
    if (!PDFService.isSupported()) {
      console.error('PDF download not supported in this environment');
      return;
    }

    setIsDownloading(true);
    setProgress({ isLoading: true, message: 'Preparing PDF generation...', progress: 0 });

    try {
      const progressCallback = progressData => {
        setProgress(progressData);
      };

      switch (type) {
        case 'article':
          await PDFService.downloadArticlePDF(itemId, itemName);
          break;
        case 'child-profile':
          await PDFService.downloadChildProfilePDF(itemId, itemName);
          break;
        case 'dashboard-progress':
          await PDFService.downloadDashboardProgressPDF(itemId);
          break;
        case 'assessment-report':
          await PDFService.downloadAssessmentReport(itemId, itemName, progressCallback);
          break;
        default:
          throw new Error('Invalid PDF download type');
      }
    } catch (error) {
      console.error('PDF download failed:', error);
      setProgress({ isLoading: false, message: 'PDF generation failed', progress: 0, error: true });
      setTimeout(() => setProgress({ isLoading: false, message: '', progress: 0 }), 2000);
    } finally {
      setIsDownloading(false);
      // Clear progress after a short delay
      setTimeout(() => {
        setProgress({ isLoading: false, message: '', progress: 0 });
      }, 1500);
    }
  };

  const handlePreview = async () => {
    if (isDownloading || disabled) return;

    try {
      await PDFService.previewPDF(type, itemId, itemName);
    } catch (error) {
      console.error('PDF preview failed:', error);
    }
  };

  const getVariantClasses = () => {
    const variants = {
      primary: 'bg-primary hover:bg-primary-600 text-white border-primary',
      secondary:
        'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 dark:border-gray-600',
      outline: 'bg-transparent hover:bg-primary hover:text-white text-primary border-primary',
      ghost:
        'bg-transparent hover:bg-gray-100 text-gray-600 border-transparent dark:hover:bg-gray-800 dark:text-gray-400',
      success: 'bg-green-600 hover:bg-green-700 text-white border-green-600',
      danger: 'bg-red-600 hover:bg-red-700 text-white border-red-600',
    };
    return variants[variant] || variants.primary;
  };

  const getSizeClasses = () => {
    const sizes = {
      xs: 'px-2 py-1 text-xs',
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
      xl: 'px-8 py-4 text-lg',
    };
    return sizes[size] || sizes.md;
  };

  const getIconSize = () => {
    const iconSizes = {
      xs: 'w-3 h-3',
      sm: 'w-4 h-4',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
      xl: 'w-6 h-6',
    };
    return iconSizes[size] || iconSizes.md;
  };

  const getEstimatedTime = () => {
    return PDFService.getEstimatedTime(type);
  };

  const buttonTitle = isDownloading
    ? `Generating PDF... (${getEstimatedTime()})`
    : `Download ${type.replace('-', ' ')} as PDF`;

  return (
    <>
      <div className="relative">
        <button
          onClick={handleDownload}
          disabled={isDownloading || disabled}
          className={`
            inline-flex items-center justify-center
            font-medium rounded-md border transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
            disabled:opacity-50 disabled:cursor-not-allowed
            hover:scale-105 active:scale-95
            ${getVariantClasses()}
            ${getSizeClasses()}
            ${className}
          `}
          title={buttonTitle}
        >
          {isDownloading ? (
            <>
              <svg
                className={`animate-spin -ml-1 mr-2 ${getIconSize()}`}
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="opacity-25"
                />
                <path
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  className="opacity-75"
                />
              </svg>
              Generating...
            </>
          ) : (
            <>
              <ArrowDownTrayIcon className={`${getIconSize()} mr-2`} />
              {children || 'Download PDF'}
            </>
          )}
        </button>

        {/* Preview button if enabled */}
        {showPreview && !isDownloading && (
          <button
            onClick={handlePreview}
            className="ml-2 inline-flex items-center px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            title="Preview PDF in new tab"
          >
            Preview
          </button>
        )}
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {progress.isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="backdrop-blur-lg bg-white/90 dark:bg-gray-800/90 rounded-2xl p-8 shadow-xl max-w-md w-full mx-4 border border-white/20 dark:border-gray-700/20"
            >
              <ReportLoader
                message={progress.message || 'Generating PDF report...'}
                showProgress={true}
                progress={progress.progress}
                className=""
              />

              {progress.error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-500 dark:text-red-400 text-center mt-4 text-sm"
                >
                  An error occurred. Please try again.
                </motion.p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Sub-components for specific use cases
export const ArticlePDFButton = ({ articleId, articleTitle, ...props }) => (
  <PDFDownloadButton type="article" itemId={articleId} itemName={articleTitle} {...props}>
    Export Article
  </PDFDownloadButton>
);

export const ChildProfilePDFButton = ({ childId, childName, ...props }) => (
  <PDFDownloadButton type="child-profile" itemId={childId} itemName={childName} {...props}>
    Export Profile
  </PDFDownloadButton>
);

export const DashboardPDFButton = ({ childId, ...props }) => (
  <PDFDownloadButton
    type="dashboard-progress"
    itemId={childId}
    itemName="Dashboard Progress"
    {...props}
  >
    Export Dashboard
  </PDFDownloadButton>
);

export const AssessmentReportPDFButton = ({ reportId, childName, ...props }) => (
  <PDFDownloadButton type="assessment-report" itemId={reportId} itemName={childName} {...props}>
    Download Report
  </PDFDownloadButton>
);

export default PDFDownloadButton;
