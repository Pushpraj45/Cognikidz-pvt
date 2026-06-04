import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DocumentTextIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  CalendarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import DashboardService from '../../services/DashboardService';
import PDFDownloadButton from '../ui/PDFDownloadButton';
import { useToast } from '../../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import LogoLoader from '../ui/LogoLoader';

// Helper function to format child names (same as DashboardOverview)
const formatChildName = childName => {
  if (!childName || childName.trim() === '') return 'Child Assessment';
  // Remove any "N/A" text and clean up the name
  return childName.replace(/\s*N\/A\s*/gi, '').trim() || 'Child Assessment';
};

const ChildReports = ({ selectedChildId, onRefresh, activeFilter = 'all' }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [childInfo, setChildInfo] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const { success: showSuccess, error: showError } = useToast();
  const navigate = useNavigate();

  // Load reports when child is selected or filter changes
  useEffect(() => {
    if (selectedChildId) {
      loadChildReports();
    } else {
      setReports([]);
      setChildInfo(null);
    }
  }, [selectedChildId, pagination.page, activeFilter]);

  // Helper function already defined at module level - no need to redefine

  // Helper function to create a summary from the full text
  const createSummary = (fullText, maxLength = 250) => {
    if (!fullText || fullText.trim() === '') return 'Assessment completed successfully.';

    // Clean up markdown and get first meaningful paragraph
    const cleanText = fullText
      .replace(/^#{1,6}\s*/gm, '') // Remove headers
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
      .replace(/\*([^*]+)\*/g, '$1') // Remove italic
      .replace(/^[-*+]\s+/gm, '') // Remove bullet points
      .replace(/^\d+\.\s+/gm, '') // Remove numbered lists
      .replace(/\n\s*\n/g, ' ') // Replace line breaks with spaces
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();

    // Get the first meaningful sentences (up to 2 sentences for better context)
    const sentences = cleanText.split('.').filter(s => s.trim().length > 15);
    let summary;

    if (sentences.length >= 2) {
      summary = sentences[0] + '. ' + sentences[1];
    } else {
      summary = sentences[0] || cleanText;
    }

    if (summary.length > maxLength) {
      summary = summary.substring(0, maxLength).trim();
      // Try to cut at a word boundary
      const lastSpace = summary.lastIndexOf(' ');
      if (lastSpace > maxLength * 0.75) {
        summary = summary.substring(0, lastSpace);
      }
      summary += '...';
    } else if (!summary.endsWith('.')) {
      summary += '.';
    }

    return summary;
  };

  const loadChildReports = async () => {
    if (!selectedChildId) return;

    try {
      setLoading(true);
      console.log(`Loading reports for child: ${selectedChildId}`);

      // Use DashboardService.getAllReports (same backend endpoint as working sections)
      const response = await DashboardService.getAllReports({
        page: pagination.page,
        limit: pagination.limit,
        childId: selectedChildId,
        assessmentType: activeFilter !== 'all' ? activeFilter : undefined,
      });

      if (response.success) {
        setReports(response.data.reports || []);
        // Child info might not be in getAllReports, but that's okay
        setPagination(prev => ({
          ...prev,
          ...response.data.pagination,
        }));

        console.log(`Loaded ${response.data.reports?.length || 0} reports for child`);
      }
    } catch (error) {
      console.error('Error loading child reports:', error);
      showError('Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = report => {
    // Navigate to the assessment complete page with the correct session ID
    navigate(`/assessment-complete/${report.id}`);
  };

  const handleDownloadReport = async report => {
    try {
      await DashboardService.downloadReport(report.id);
      showSuccess('Report downloaded successfully');
    } catch (error) {
      console.error('Error downloading report:', error);
      showError('Failed to download report. Please try again.');
    }
  };

  const handleDeleteReport = async report => {
    if (
      !window.confirm(
        `Are you sure you want to delete the ${report.assessmentType} report for ${formatChildName(report.childName)}?`
      )
    ) {
      return;
    }

    try {
      await DashboardService.deleteReport(report.id);
      showSuccess('Report deleted successfully');
      loadChildReports(); // Refresh the list
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error deleting report:', error);
      showError('Failed to delete report. Please try again.');
    }
  };

  const getRiskLevelColor = riskScore => {
    if (!riskScore) return 'text-gray-500 dark:text-gray-400';
    if (riskScore <= 3) return 'text-green-600 dark:text-green-400';
    if (riskScore <= 7) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getRiskLevelIcon = riskScore => {
    if (!riskScore) return <ClockIcon className="h-4 w-4" />;
    if (riskScore <= 3) return <CheckCircleIcon className="h-4 w-4" />;
    if (riskScore <= 7) return <ExclamationTriangleIcon className="h-4 w-4" />;
    return <ExclamationTriangleIcon className="h-4 w-4" />;
  };

  const getRiskLevelText = score => {
    if (!score || isNaN(score)) return 'Assessment Complete';
    if (score <= 3) return 'Low Risk';
    if (score <= 7) return 'Moderate Risk';
    return 'High Risk';
  };

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatAssessmentType = type => {
    const typeMap = {
      adhd: 'ADHD',
      autism: 'Autism',
      asd: 'Autism Spectrum',
      dyslexia: 'Dyslexia',
      general: 'General',
    };
    return typeMap[type?.toLowerCase()] || type || 'Assessment';
  };

  if (!selectedChildId) {
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Select a Child</h3>
        <p className="text-gray-500 dark:text-gray-400">
          Choose a child from the dropdown above to view their assessment reports.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {childInfo && (
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 h-10 w-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
              <span className="text-primary-700 dark:text-primary-300 font-medium text-lg">
                {formatChildName(childInfo.name).charAt(0)}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatChildName(childInfo.name)}'s Reports
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {reports.length} assessment report{reports.length !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <LogoLoader size="medium" message="Loading reports..." showMessage={true} />
        </div>
      )}

      {/* Reports List */}
      <AnimatePresence>
        {reports.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 bg-white/80 dark:bg-gray-800/80 rounded-lg border border-white/20 dark:border-gray-700/30"
          >
            <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Reports Available
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Complete an assessment to generate reports for{' '}
              {formatChildName(childInfo?.name) || 'this child'}.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {reports.map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/90 dark:bg-gray-800/90 rounded-lg border border-white/20 dark:border-gray-700/30 p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex-shrink-0">
                        <ChartBarIcon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {formatAssessmentType(report.assessmentType)} Assessment
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <CalendarIcon className="h-4 w-4" />
                            <span>{formatDate(report.assessmentDate)}</span>
                          </div>
                          {report.riskScore && (
                            <div
                              className={`flex items-center space-x-1 ${getRiskLevelColor(report.riskScore)}`}
                            >
                              {getRiskLevelIcon(report.riskScore)}
                              <span>
                                {getRiskLevelText(report.riskScore)} ({report.riskScore}/10)
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="mb-4">
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                        {createSummary(report.summary)}
                      </p>
                    </div>

                    {/* Risk Level */}
                    {report.riskScore && (
                      <div className="mb-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            report.riskScore <= 3
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : report.riskScore <= 7
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                        >
                          {report.riskScore <= 3
                            ? 'Low Risk'
                            : report.riskScore <= 7
                              ? 'Moderate Risk'
                              : 'High Risk'}
                        </span>
                      </div>
                    )}

                    {/* Domain Scores Preview */}
                    {report.domainScores && report.domainScores.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Key Areas Assessed:
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {report.domainScores.slice(0, 3).map((domain, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                            >
                              {domain.domain}: {domain.score}%
                            </span>
                          ))}
                          {report.domainScores.length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                              +{report.domainScores.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleViewReport(report)}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-md hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-colors"
                      title="View Full Report"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View
                    </button>
                    <PDFDownloadButton
                      type="assessment-report"
                      itemId={report.id}
                      itemName={formatChildName(report.childName)}
                      variant="success"
                      size="sm"
                    >
                      Export PDF
                    </PDFDownloadButton>
                    <button
                      onClick={() => handleDeleteReport(report)}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-md hover:bg-red-100 dark:hover:bg-red-800/40 transition-colors"
                      title="Delete Report"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      {!loading && reports.length > 0 && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white/80 dark:bg-gray-800/80 rounded-lg border border-white/20 dark:border-gray-700/30 px-4 py-3">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}{' '}
            reports
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page <= 1}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChildReports;
