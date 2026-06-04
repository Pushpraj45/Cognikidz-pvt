import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import ReportsManagement from '../components/reports/ReportsManagement';
import ReportCard from '../components/reports/ReportCard';
import { FADE_UP } from '../utils/animations';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, DocumentTextIcon, FunnelIcon } from '@heroicons/react/24/outline';
import DashboardService from '../services/DashboardService';
import ChildProfileService from '../services/ChildProfileService';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import TranslatedText from '../components/ui/TranslatedText';

const ReportsPage = () => {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { error: showError, success: showSuccess } = useToast();

  const [reports, setReports] = useState([]);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'complete', 'pending', 'incomplete'
  const [selectedChild, setSelectedChild] = useState('all'); // 'all' or childId
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Load children profiles once on mount
  useEffect(() => {
    if (isLoggedIn) {
      const loadChildren = async () => {
        try {
          const childrenData = await ChildProfileService.getChildren();
          setChildren(childrenData || []);
        } catch (error) {
          console.error('Error fetching children:', error);
          showError('Failed to load children profiles');
        }
      };
      loadChildren();
    }
  }, [isLoggedIn, showError]);

  // Load data on component mount
  useEffect(() => {
    console.log('🔄 ReportsPage useEffect triggered:', {
      isLoggedIn,
      reportId,
      activeTab,
      selectedChild,
      timestamp: new Date().toISOString(),
    });

    if (isLoggedIn) {
      if (reportId) {
        // Fetch specific report by ID
        const loadReport = async () => {
          try {
            const response = await DashboardService.getReportById(reportId);
            if (response.success) {
              setSelectedReport(response.data.report);
            }
          } catch (error) {
            console.error('Error fetching report:', error);
            // showError('Failed to load report details');
            // navigate('/reports');
          }
        };
        loadReport();
      } else {
        // Fetch all reports
        const loadReports = async () => {
          try {
            setLoading(true);

            const params = {
              page: 1,
              limit: 100,
            };

            if (activeTab !== 'all') {
              params.status = activeTab;
            }

            if (selectedChild !== 'all') {
              params.childId = selectedChild;
            }

            console.log('📡 Making API call with params:', params);
            const response = await DashboardService.getAllReports(params);

            if (response.success) {
              setReports(response.data.reports || []);
              setPagination(prev => ({
                ...prev,
                ...response.data.pagination,
              }));
            }
          } catch (error) {
            console.error('Error fetching reports:', error);
            // showError('Failed to load assessment reports. Please try again.');
          } finally {
            setLoading(false);
          }
        };
        loadReports();
      }
    }
  }, [isLoggedIn, reportId, activeTab, selectedChild]);

  // Handle report deletion
  const handleDelete = useCallback(
    async id => {
      if (window.confirm('Are you sure you want to delete this report?')) {
        try {
          await DashboardService.deleteReport(id);
          showSuccess('Report deleted successfully');

          // If we're currently viewing the report that was deleted, navigate back to reports list
          if (reportId === id) {
            navigate('/reports');
          } else {
            // Refresh the reports list by calling fetchReports directly
            if (isLoggedIn && !reportId) {
              const params = {
                page: 1,
                limit: 100,
              };

              if (activeTab !== 'all') {
                params.status = activeTab;
              }

              if (selectedChild !== 'all') {
                params.childId = selectedChild;
              }

              try {
                const response = await DashboardService.getAllReports(params);
                if (response.success) {
                  setReports(response.data.reports || []);
                  setPagination(prev => ({
                    ...prev,
                    ...response.data.pagination,
                  }));
                }
              } catch (error) {
                console.error('Error refreshing reports after delete:', error);
              }
            }
          }
        } catch (error) {
          console.error('Error deleting report:', error);
          showError('Failed to delete report. Please try again.');
        }
      }
    },
    [reportId, navigate, showSuccess, showError, isLoggedIn, activeTab, selectedChild]
  );

  // Handle report download
  const handleDownload = useCallback(
    async id => {
      try {
        await DashboardService.downloadReport(id);
        showSuccess('Report downloaded successfully');
      } catch (error) {
        console.error('Error downloading report:', error);
        showError('Failed to download report. Please try again.');
      }
    },
    [showSuccess, showError]
  );

  // Handle tab change
  const handleTabChange = tab => {
    setActiveTab(tab);
  };

  // Handle child selection change
  const handleChildChange = e => {
    setSelectedChild(e.target.value);
  };

  // Filter reports based on active tab AND selected child
  const filteredReports = useMemo(() => {
    console.log('🔥 Filtering reports:', {
      totalReports: reports.length,
      activeTab,
      selectedChild,
      sampleReport: reports[0],
    });

    const filtered = reports.filter(report => {
      const statusMatch = activeTab === 'all' ? true : report.status === activeTab;
      const childMatch = selectedChild === 'all' ? true : report.childId === selectedChild;
      return statusMatch && childMatch;
    });

    console.log('✅ Filtered reports result:', {
      filteredCount: filtered.length,
      activeTab,
      selectedChild,
    });

    return filtered;
  }, [reports, activeTab, selectedChild]);

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

      <div className="container mx-auto px-4 pt-24 pb-16 relative z-10">
        {selectedReport ? (
          // Single report view
          <motion.div initial="hidden" animate="visible" variants={FADE_UP} className="space-y-6">
            {/* Back button */}
            <button
              onClick={() => navigate('/reports')}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-400 transition-colors bg-white/80 dark:bg-gray-800/80 rounded-lg border border-white/20 dark:border-gray-700/30"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back to Reports
            </button>

            {/* Report display */}
            <ReportCard report={selectedReport} />
          </motion.div>
        ) : (
          // Reports list view
          <motion.div initial="hidden" animate="visible" variants={FADE_UP} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-400 transition-colors bg-white/80 dark:bg-gray-800/80 rounded-lg border border-white/20 dark:border-gray-700/30"
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-1" />
                  Back to Dashboard
                </button>
              </div>
            </div>

            {/* Centered Badge */}
            <div className="flex justify-center mb-2">
              <div className="relative">
                <div className="absolute -top-12 -left-12 w-32 h-32 bg-gradient-radial from-indigo-500/20 to-transparent rounded-full blur-lg z-0 opacity-70"></div>
                <div className="relative z-10 inline-flex items-center bg-gradient-to-r from-indigo-500/10 to-purple-600/20 rounded-full pl-1 pr-4 py-1">
                  <span className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2">
                    <DocumentTextIcon className="h-4 w-4" />
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400 text-sm font-medium">
                    Assessment Reports
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center mb-2">
              <h1 className="text-3xl font-bold text-text dark:text-dark-text flex items-center justify-center">
                Assessment Reports
              </h1>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                View and manage your child's assessment reports
              </p>
            </div>

            {/* Filter options */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              {/* Status filter tabs - Updated to match dashboard styling */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-3 shadow-lg border border-white/20 dark:border-gray-700/30"
              >
                <nav className="flex flex-wrap gap-2">
                  {[
                    {
                      key: 'all',
                      label: 'All Reports',
                      icon: (
                        <svg
                          className="w-5 h-5"
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
                      ),
                    },
                    {
                      key: 'completed',
                      label: 'Completed',
                      icon: (
                        <svg
                          className="w-5 h-5"
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
                      ),
                    },
                    {
                      key: 'active',
                      label: 'In Progress',
                      icon: (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                      ),
                    },
                    {
                      key: 'paused',
                      label: 'Paused',
                      icon: (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      ),
                    },
                  ].map((tab, index) => (
                    <motion.button
                      key={tab.key}
                      onClick={() => handleTabChange(tab.key)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 ${
                        activeTab === tab.key
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/60 dark:hover:bg-gray-700/60'
                      }`}
                    >
                      <span className="text-base">{tab.icon}</span>
                      <span>{tab.label}</span>
                      {activeTab === tab.key && (
                        <motion.div
                          layoutId="activeTabIndicator"
                          className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl -z-10"
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                    </motion.button>
                  ))}
                </nav>
              </motion.div>

              {/* Child filter dropdown */}
              <div className="flex items-center">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <FunnelIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    value={selectedChild}
                    onChange={handleChildChange}
                    className="block w-full sm:w-48 pl-10 pr-3 py-2 border border-white/20 dark:border-gray-700/30 rounded-md bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 focus:ring-primary focus:border-primary shadow-sm"
                  >
                    <option value="all">All Children</option>
                    {children.map(child => (
                      <option key={child._id || child.id} value={child._id || child.id}>
                        {child.name || `${child.firstName} ${child.lastName}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Reports management component */}
            <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl border border-white/20 dark:border-gray-700/30 p-4 shadow-lg">
              <ReportsManagement
                reports={filteredReports}
                isLoading={loading}
                onDelete={handleDelete}
                onDownload={handleDownload}
              />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
