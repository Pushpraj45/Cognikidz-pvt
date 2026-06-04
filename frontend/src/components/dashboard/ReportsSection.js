import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DocumentTextIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  InformationCircleIcon,
  BellIcon,
  StarIcon,
  SparklesIcon,
  AcademicCapIcon,
  ChartBarIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '../../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import LogoLoader from '../ui/LogoLoader';
import ReportService from '../../services/ReportService';

const ReportsSection = ({ selectedChildId, onRefresh }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [childInfo, setChildInfo] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'detail'
  const { success: showSuccess, error: showError } = useToast();
  const navigate = useNavigate();

  // Load reports when child is selected
  useEffect(() => {
    if (selectedChildId) {
      loadChildReports();
    } else {
      setReports([]);
      setChildInfo(null);
    }
  }, [selectedChildId]);

  const loadChildReports = async () => {
    if (!selectedChildId) return;

    try {
      setLoading(true);
      console.log(`🔍 Loading AI reports for child: ${selectedChildId}`);

      const response = await ReportService.getChildReports(selectedChildId);

      if (response.success) {
        setReports(response.data.reports || []);
        setChildInfo(response.data.child);
        console.log(`✅ Loaded ${response.data.reports?.length || 0} AI reports`);
      } else {
        showError('Failed to load reports');
      }
    } catch (error) {
      console.error('❌ Error loading child reports:', error);
      showError('Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = async report => {
    try {
      setLoading(true);
      const response = await ReportService.getReportById(report.id);

      if (response.success) {
        setSelectedReport(response.data.report);
        setViewMode('detail');

        // Mark as viewed if not already
        if (!report.viewedByParent) {
          await ReportService.markReportAsViewed(report.id);
          loadChildReports(); // Refresh to update viewed status
        }
      }
    } catch (error) {
      console.error('❌ Error loading report details:', error);
      showError('Failed to load report details');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToList = () => {
    setSelectedReport(null);
    setViewMode('list');
  };

  const getPriorityColor = priority => {
    const colors = {
      low: 'text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-800',
      medium: 'text-yellow-600 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900',
      high: 'text-orange-600 bg-orange-100 dark:text-orange-300 dark:bg-orange-900',
      critical: 'text-red-600 bg-red-100 dark:text-red-300 dark:bg-red-900',
    };
    return colors[priority] || colors.low;
  };

  const getPriorityIcon = priority => {
    const icons = {
      low: <InformationCircleIcon className="h-4 w-4" />,
      medium: <ClockIcon className="h-4 w-4" />,
      high: <ExclamationTriangleIcon className="h-4 w-4" />,
      critical: <BellIcon className="h-4 w-4" />,
    };
    return icons[priority] || icons.low;
  };

  const getReportTypeIcon = reportType => {
    const icons = {
      'mini-report': <StarIcon className="h-5 w-5" />,
      'suite-progress-report': <ChartBarIcon className="h-5 w-5" />,
      'comprehensive-assessment-report': <AcademicCapIcon className="h-5 w-5" />,
      'progress-alert-report': <SparklesIcon className="h-5 w-5" />,
      'concern-alert-report': <ExclamationTriangleIcon className="h-5 w-5" />,
      'weekly-summary': <CalendarIcon className="h-5 w-5" />,
      'monthly-summary': <DocumentTextIcon className="h-5 w-5" />,
      'quarterly-summary': <DocumentTextIcon className="h-5 w-5" />,
    };
    return icons[reportType] || <DocumentTextIcon className="h-5 w-5" />;
  };

  const getReportTypeTitle = reportType => {
    const titles = {
      'mini-report': 'Progress Update',
      'suite-progress-report': 'Assessment Suite Report',
      'comprehensive-assessment-report': 'Comprehensive Assessment',
      'progress-alert-report': 'Progress Alert',
      'concern-alert-report': 'Attention Needed',
      'weekly-summary': 'Weekly Summary',
      'monthly-summary': 'Monthly Summary',
      'quarterly-summary': 'Quarterly Summary',
    };
    return titles[reportType] || 'Assessment Report';
  };

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!selectedChildId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <DocumentTextIcon className="h-16 w-16 mb-4" />
        <h3 className="text-lg font-medium mb-2">No Child Selected</h3>
        <p className="text-sm text-center">
          Please select a child from the list to view their AI-generated reports
        </p>
      </div>
    );
  }

  if (loading && !selectedReport) {
    return (
      <div className="flex items-center justify-center h-64">
        <LogoLoader message="Loading reports..." />
      </div>
    );
  }

  // Detail View
  if (viewMode === 'detail' && selectedReport) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBackToList}
            className="flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            ← Back to Reports
          </button>
          <div className="flex items-center space-x-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(selectedReport.priority)}`}
            >
              {getPriorityIcon(selectedReport.priority)}
              <span className="ml-1">{selectedReport.priority.toUpperCase()}</span>
            </span>
          </div>
        </div>

        {/* Report Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-start space-x-4 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              {getReportTypeIcon(selectedReport.reportType)}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {selectedReport.title}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {getReportTypeTitle(selectedReport.reportType)} • Generated{' '}
                {formatDate(selectedReport.generatedAt)}
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Summary</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {selectedReport.summary}
            </p>
          </div>

          {/* Insights */}
          {selectedReport.insights && selectedReport.insights.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                <LightBulbIcon className="h-5 w-5 mr-2 text-yellow-500" />
                Key Insights
              </h3>
              <ul className="space-y-2">
                {selectedReport.insights.map((insight, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></span>
                    <p className="text-gray-700 dark:text-gray-300">{insight}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {selectedReport.recommendations && selectedReport.recommendations.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                <CheckCircleIcon className="h-5 w-5 mr-2 text-green-500" />
                Recommendations
              </h3>
              <ul className="space-y-3">
                {selectedReport.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <p className="text-gray-700 dark:text-gray-300">{recommendation}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Sections */}
          {selectedReport.sections && selectedReport.sections.length > 0 && (
            <div className="space-y-6">
              {selectedReport.sections.map((section, index) => (
                <div key={index} className="border-t pt-6 first:border-t-0 first:pt-0">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    {section.heading}
                  </h3>
                  <div className="text-gray-700 dark:text-gray-300">
                    {section.type === 'list' && Array.isArray(section.data) ? (
                      <ul className="list-disc list-inside space-y-1">
                        {section.data.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="leading-relaxed">{section.content}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AI Metadata */}
          {selectedReport.aiMetadata && (
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Generated by {selectedReport.aiMetadata.model} •{' '}
                {selectedReport.aiMetadata.provider} • Tokens: {selectedReport.aiMetadata.tokens}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            AI Reports {childInfo && `for ${childInfo.firstName}`}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {reports.length} report{reports.length !== 1 ? 's' : ''} available
          </p>
        </div>
        <button
          onClick={loadChildReports}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Reports List */}
      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <DocumentTextIcon className="h-16 w-16 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Reports Yet</h3>
          <p className="text-sm text-center">
            AI reports will appear here as your child completes assessments and games
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {reports.map(report => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleViewReport(report)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        {getReportTypeIcon(report.reportType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {report.title}
                          </h3>
                          {!report.viewedByParent && (
                            <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          {getReportTypeTitle(report.reportType)} • {formatDate(report.generatedAt)}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                          {report.summary}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(report.priority)}`}
                      >
                        {getPriorityIcon(report.priority)}
                        <span className="ml-1">{report.priority}</span>
                      </span>
                      <EyeIcon className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default ReportsSection;
