import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import DashboardService from '../services/DashboardService';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';

// Create the context
export const ReportsContext = createContext();

// Hook for using the context
export const useReports = () => useContext(ReportsContext);

// Sample dummy data for development
const DUMMY_REPORTS = [
  {
    id: '1',
    childName: 'Emma Johnson',
    childId: 'child1',
    assessmentType: 'Cognitive Development',
    assessmentDate: '2023-10-15',
    status: 'complete',
    summary:
      'Emma shows strong cognitive abilities across most domains with particular strength in problem-solving and memory tasks.',
    scores: [
      {
        domain: 'Language Skills',
        score: 7,
        description: 'Expressive and receptive language abilities',
      },
      {
        domain: 'Problem Solving',
        score: 9,
        description: 'Ability to analyze situations and find solutions',
      },
      { domain: 'Memory', score: 8, description: 'Short and long-term memory retention' },
      { domain: 'Attention', score: 6, description: 'Focus and sustained attention abilities' },
      {
        domain: 'Social Cognition',
        score: 7,
        description: 'Understanding of social cues and interactions',
      },
    ],
    recommendations: [
      'Continue to engage in reading activities to strengthen language skills',
      'Provide more challenging puzzle games to enhance problem-solving abilities',
      'Practice mindfulness activities to improve attention span',
      'Schedule a follow-up assessment in 6 months to track progress',
    ],
  },
  {
    id: '2',
    childName: 'Noah Smith',
    childId: 'child2',
    assessmentType: 'Behavioral Assessment',
    assessmentDate: '2023-11-02',
    status: 'complete',
    summary:
      'Noah demonstrates age-appropriate behavior in most contexts with some challenges in emotional regulation during transitions.',
    scores: [
      {
        domain: 'Emotional Regulation',
        score: 5,
        description: 'Ability to manage emotions appropriately',
      },
      {
        domain: 'Peer Relationships',
        score: 8,
        description: 'Quality of interactions with same-age peers',
      },
      { domain: 'Compliance', score: 7, description: 'Following rules and instructions' },
      {
        domain: 'Adaptability',
        score: 4,
        description: 'Adjusting to changes in routine or environment',
      },
      { domain: 'Focus', score: 6, description: 'Ability to maintain attention on tasks' },
    ],
    recommendations: [
      'Implement a visual schedule to help with transitions throughout the day',
      'Practice emotional vocabulary to help identify and express feelings',
      'Use positive reinforcement techniques to encourage adaptive behaviors',
      'Consider additional support for developing coping strategies during transitions',
    ],
  },
  {
    id: '3',
    childName: 'Sophia Martinez',
    childId: 'child3',
    assessmentType: 'Language Development',
    assessmentDate: '2023-09-20',
    status: 'complete',
    summary:
      'Sophia shows above-average language development with strong vocabulary and conversation skills for her age.',
    scores: [
      { domain: 'Vocabulary', score: 9, description: 'Range of words understood and used' },
      { domain: 'Grammar', score: 8, description: 'Use of appropriate grammatical structures' },
      { domain: 'Comprehension', score: 8, description: 'Understanding of spoken language' },
      { domain: 'Expression', score: 9, description: 'Ability to communicate thoughts and ideas' },
      { domain: 'Pragmatics', score: 7, description: 'Social use of language in context' },
    ],
    recommendations: [
      'Continue to read diverse types of books to expand vocabulary further',
      'Engage in complex conversation about abstract concepts',
      'Introduce basic writing activities to support literacy development',
      'Consider enrichment activities like debate or storytelling classes',
    ],
  },
  {
    id: '4',
    childName: 'Liam Taylor',
    childId: 'child4',
    assessmentType: 'Motor Skills Assessment',
    assessmentDate: '2023-10-05',
    status: 'pending',
    summary:
      'Assessment in progress. Initial observations indicate age-appropriate gross motor development with some fine motor challenges.',
    scores: [
      { domain: 'Gross Motor', score: 7, description: 'Large movement coordination' },
      { domain: 'Fine Motor', score: 4, description: 'Small, precise movements and manipulation' },
      { domain: 'Balance', score: 6, description: 'Stability and equilibrium maintenance' },
      {
        domain: 'Visual-Motor Integration',
        score: 5,
        description: 'Coordination of visual perception and motor skills',
      },
      { domain: 'Motor Planning', score: 6, description: 'Planning and sequencing movements' },
    ],
    recommendations: [
      'Incorporate more fine motor activities like drawing, beading, and cutting',
      'Consider occupational therapy consultation for fine motor development',
      'Encourage outdoor play to further strengthen gross motor skills',
      'Provide opportunities for bilateral coordination activities',
    ],
  },
  {
    id: '5',
    childName: 'Olivia Wilson',
    childId: 'child5',
    assessmentType: 'Social-Emotional Assessment',
    assessmentDate: '2023-11-10',
    status: 'incomplete',
    summary: 'Assessment not yet completed. Preliminary data collection in progress.',
    scores: [],
    recommendations: [],
  },
];

export const ReportsProvider = ({ children }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isLoggedIn } = useAuth();
  const { error: showError, success: showSuccess } = useToast();
  const [useDummyData, setUseDummyData] = useState(false); // Changed to false to use real data by default

  // Fetch reports from the server
  const fetchReports = useCallback(async () => {
    if (!isLoggedIn) return;

    if (useDummyData) {
      setReports(DUMMY_REPORTS);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Use DashboardService to get all reports
      const response = await DashboardService.getAllReports();

      if (response.success) {
        setReports(response.data.reports || []);
      } else {
        throw new Error('Failed to fetch reports');
      }
    } catch (err) {
      console.error('Failed to fetch reports:', err);
      setError('Failed to load reports data');
      showError('Failed to load assessment reports. Please try again later.');

      // Fallback to dummy data if API fails
      setReports(DUMMY_REPORTS);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, showError, useDummyData]);

  // Load reports on mount and when auth state changes
  // DISABLED: ReportsPage handles its own API calls to prevent infinite loops
  // useEffect(() => {
  //   fetchReports();
  // }, [fetchReports, isLoggedIn]);

  // Delete a report
  const deleteReport = async reportId => {
    if (useDummyData) {
      setReports(reports.filter(report => report.id !== reportId));
      showSuccess('Report deleted successfully');
      return;
    }

    try {
      // Call DashboardService to delete report
      await DashboardService.deleteReport(reportId);

      // Update local state
      setReports(reports.filter(report => report.id !== reportId));
      showSuccess('Report deleted successfully');
    } catch (err) {
      console.error('Failed to delete report:', err);
      showError('Failed to delete report. Please try again.');
    }
  };

  // Get a single report by ID
  const getReportById = reportId => {
    return reports.find(report => report.id === reportId) || null;
  };

  // Download a report
  const downloadReport = async reportId => {
    const report = getReportById(reportId);

    if (!report) {
      showError('Report not found');
      return;
    }

    if (useDummyData) {
      // In development, we'll just show a success message
      showSuccess(`Report for ${report.childName} prepared for download`);
      return;
    }

    try {
      // Call DashboardService to download report
      await DashboardService.downloadReport(reportId);
      showSuccess('Report downloaded successfully');
    } catch (err) {
      console.error('Failed to download report:', err);
      showError('Failed to download report. Please try again.');
    }
  };

  // Toggle between dummy and real data (for development)
  const toggleDummyData = () => {
    setUseDummyData(!useDummyData);
    fetchReports();
  };

  // Context value
  const value = {
    reports,
    loading,
    error,
    fetchReports,
    deleteReport,
    getReportById,
    downloadReport,
    useDummyData,
    toggleDummyData,
  };

  return <ReportsContext.Provider value={value}>{children}</ReportsContext.Provider>;
};

export default ReportsProvider;
