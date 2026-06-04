import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import LogoLoader from '../components/ui/LogoLoader';
import { motion, AnimatePresence } from 'framer-motion';
import { FADE_UP } from '../utils/animations';
import { useAuth } from '../contexts/AuthContext';
import ChildProfileService from '../services/ChildProfileService';
import { useToast } from '../contexts/ToastContext';
import AssessmentService from '../services/AssessmentService';
import AssessmentHistory from '../components/dashboard/AssessmentHistory';
import AssessmentTimeline from '../components/dashboard/AssessmentTimeline';
import DashboardOverview from '../components/dashboard/DashboardOverview';
import AssessmentTypeFilter from '../components/dashboard/AssessmentTypeFilter';

import { useTheme } from '../contexts/ThemeContext';
import { generateDashboardDemoData } from '../utils/dummyData';
import DashboardService from '../services/DashboardService';
import { debounce } from '../utils/debounce';
import { getCleanChildName, getChildAge } from '../utils/nameUtils';
import TranslatedText from '../components/ui/TranslatedText';
import { useTranslation } from 'react-i18next';
import { TranslatedButtonList } from '../components/ui/TranslatedList';
import PDFDownloadButton from '../components/ui/PDFDownloadButton';
import Button from '../components/ui/Button';

/**
 * Dashboard Component
 *
 * Features:
 * - Global assessment type filter placed beside parent name header
 * - Filter works across all dashboard tabs (overview, history, reports, progress)
 * - Responsive design with compact filter variant for smaller screens
 * - Backend filtering support for both text and image assessments
 */
const Dashboard = ({ demoMode = false }) => {
  const { isLoggedIn, currentUser } = useAuth();
  const { t } = useTranslation(['dashboard', 'common']);
  const { error: showError, success: showSuccess } = useToast();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [children, setChildren] = useState([]);
  const [childAssessments, setChildAssessments] = useState({});
  const [selectedChild, setSelectedChild] = useState(null);
  const [recentProgress, setRecentProgress] = useState([]);
  const [upcomingAssessments, setUpcomingAssessments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assessmentsLoading, setAssessmentsLoading] = useState(false);
  const [upcomingLoading, setUpcomingLoading] = useState(false);
  const [timelineData, setTimelineData] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [entitlements, setEntitlements] = useState(null);
  const [useDemoData, setUseDemoData] = useState(demoMode);
  const [demoData, setDemoData] = useState(null);

  // Assessment type filter state
  const [activeAssessmentFilter, setActiveAssessmentFilter] = useState('all');
  const [assessmentCounts, setAssessmentCounts] = useState({});

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [childToDelete, setChildToDelete] = useState(null);

  // Add refs to track ongoing requests and prevent duplicates
  const ongoingRequests = useRef(new Set());
  const requestCache = useRef(new Map());

  // Cache for API responses
  const [cache, setCache] = useState(new Map());
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Add refresh trigger to force re-renders

  // Helper function to create a cache key
  const createCacheKey = (endpoint, params = {}) => {
    return `${endpoint}_${JSON.stringify(params)}`;
  };

  // Helper function to check if request is already ongoing
  const isRequestOngoing = cacheKey => {
    return ongoingRequests.current.has(cacheKey);
  };

  // Helper function to mark request as ongoing
  const markRequestOngoing = cacheKey => {
    ongoingRequests.current.add(cacheKey);
  };

  // Helper function to mark request as complete
  const markRequestComplete = cacheKey => {
    ongoingRequests.current.delete(cacheKey);
  };

  // Fetch assessment counts for filter badges
  const fetchAssessmentCounts = useCallback(async () => {
    if (useDemoData) {
      // Mock counts for demo data
      setAssessmentCounts({ text: 8, image: 3, game: 5 });
      return;
    }

    try {
      const result = await DashboardService.getAssessmentCounts();
      if (result.success) {
        setAssessmentCounts(result.data.counts);
      }
    } catch (error) {
      console.error('Failed to fetch assessment counts:', error);
    }
  }, [useDemoData]);

  // Handle assessment type filter change
  const handleAssessmentFilterChange = useCallback(filterType => {
    setActiveAssessmentFilter(filterType);
    // Clear cache when filter changes to force refetch with new filter
    setCache(new Map());
    ongoingRequests.current.clear();
    // Trigger data refresh
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Initialize demo data if demoMode is true
  useEffect(() => {
    if (demoMode && !demoData) {
      setUseDemoData(true);
      const demoDataSet = generateDashboardDemoData();
      setDemoData(demoDataSet);
    }
  }, [demoMode, demoData]);

  // Fetch assessment counts when component mounts or user changes
  useEffect(() => {
    if (isLoggedIn) {
      fetchAssessmentCounts();
    }
  }, [isLoggedIn, fetchAssessmentCounts]);

  // Set initial tab from query params if available
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const tabParam = queryParams.get('tab');
    const childAdded = queryParams.get('childAdded');
    const refresh = queryParams.get('refresh');

    if (tabParam && ['overview', 'children', 'assessments', 'history'].includes(tabParam)) {
      setActiveTab(tabParam);
    }

    // Force refresh if child was added or refresh flag is set
    if (childAdded === 'true' || refresh === 'true') {
      // Clear cache and force re-fetch
      setCache(new Map());
      ongoingRequests.current.clear();

      // Reset loading state first
      setLoading(false);
      setError(null);

      // Trigger a refresh after a small delay to allow state to settle
      setTimeout(() => {
        // Call fetch function directly without circular dependency
        if (!useDemoData && isLoggedIn) {
          const refreshChildren = async () => {
            try {
              setLoading(true);
              const childrenData = await ChildProfileService.getChildren();
              setChildren(childrenData);

              // Set first child as selected if no selection exists
              if (childrenData && childrenData.length > 0 && !selectedChild) {
                setSelectedChild(childrenData[0].id);
              }

              // Trigger refresh of other data
              setRefreshTrigger(prev => prev + 1);

              // Show success message
              showSuccess('Children profiles updated successfully!');
            } catch (err) {
              console.error('Failed to refresh children:', err);
              setError('Failed to load children profiles');
            } finally {
              setLoading(false);
            }
          };
          refreshChildren();
        }
      }, 100);

      // Clean up URL params after handling
      const newUrl = new URL(window.location);
      newUrl.searchParams.delete('childAdded');
      newUrl.searchParams.delete('refresh');
      window.history.replaceState({}, '', newUrl);
    }

    // Check if demo flag is set in URL
    const demoParam = queryParams.get('demo');
    if (demoParam === 'true') {
      setUseDemoData(true);
      // Generate demo data
      setDemoData(generateDashboardDemoData());
    }
  }, [location.search, useDemoData, isLoggedIn]);

  // If demo data is available and demo mode is enabled, use it
  useEffect(() => {
    if (useDemoData && demoData) {
      setChildren(demoData.children);
      setChildAssessments(demoData.assessments);

      // Set the first child as selected by default
      if (demoData.children.length > 0) {
        setSelectedChild(demoData.children[0].id);
      }

      // Create recent progress from all children's latest assessments
      const allCompletedAssessments = [];
      Object.entries(demoData.assessments).forEach(([childId, assessments]) => {
        const childName = demoData.children.find(child => child.id === childId)?.name;

        assessments
          .filter(a => a.status === 'completed')
          .forEach(assessment => {
            allCompletedAssessments.push({
              ...assessment,
              childName,
              childId,
            });
          });
      });

      // Sort and format for recent progress
      const recent = allCompletedAssessments
        .filter(a => a.status === 'completed' && a.results && a.results.disorderRisk)
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
        .slice(0, 5)
        .map(a => ({
          id: a.sessionId,
          childId: a.childId,
          childName: a.childName,
          date: new Date(a.completedAt).toLocaleDateString(),
          area: a.assessmentType,
          score: a.results.disorderRisk.score,
          improvement: a.results.disorderRisk.interpretation
            ? `Risk: ${a.results.disorderRisk.interpretation}`
            : 'N/A',
        }));

      setRecentProgress(recent);

      // Get upcoming assessments
      const upcoming = allCompletedAssessments
        .filter(a => a.status === 'scheduled')
        .slice(0, 3)
        .map(a => ({
          sessionId: a.sessionId,
          childId: a.childId,
          childName: a.childName,
          type: a.assessmentType,
          date: new Date(a.lastActiveAt).toLocaleDateString(),
          status: a.status,
        }));

      setUpcomingAssessments(upcoming);
    }
  }, [useDemoData, demoData]);

  // Load children data with request deduplication
  const fetchChildren = useCallback(async () => {
    if (!isLoggedIn || useDemoData) return;

    const cacheKey = createCacheKey('children');

    // Check if request is already ongoing
    if (isRequestOngoing(cacheKey)) {
      console.log('Children fetch already in progress, skipping...');
      return;
    }

    try {
      // Only show loading if we don't have any children data
      if (!children || children.length === 0) {
        setLoading(true);
      }
      setError(null);
      markRequestOngoing(cacheKey);

      const childrenData = await ChildProfileService.getChildren();
      setChildren(childrenData);

      // If we have children and no child is selected, select the first one
      if (childrenData && childrenData.length > 0) {
        setSelectedChild(prev => prev || childrenData[0].id);
      } else {
        // No children available, clear selection
        setSelectedChild(null);
      }
    } catch (err) {
      console.error('Failed to fetch children:', err);
      setError('Failed to load children profiles');
      showError('Failed to load children profiles. Please try again later.');

      // If API fails, switch to demo data for testing
      setUseDemoData(true);
      const demoDataSet = generateDashboardDemoData();
      setDemoData(demoDataSet);
    } finally {
      setLoading(false);
      markRequestComplete(cacheKey);
    }
  }, [isLoggedIn, showError, useDemoData, children]);

  // Force refresh children data (bypasses cache)
  const forceRefreshChildren = useCallback(async () => {
    if (!isLoggedIn || useDemoData) return;

    try {
      setLoading(true);

      // Clear cache for children
      const cacheKey = createCacheKey('children');
      ongoingRequests.current.delete(cacheKey);

      const childrenData = await ChildProfileService.getChildren();
      setChildren(childrenData);

      // Update selected child appropriately
      if (childrenData && childrenData.length > 0) {
        // If current selection is valid, keep it; otherwise select first child
        if (selectedChild && childrenData.find(c => c.id === selectedChild)) {
          // Current selection is still valid
        } else {
          setSelectedChild(childrenData[0].id);
        }
      } else {
        // No children available, clear selection
        setSelectedChild(null);
      }

      return childrenData;
    } catch (err) {
      console.error('Failed to force refresh children:', err);
      showError('Failed to refresh children profiles. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, selectedChild, showError, useDemoData]);

  // Helper function to clean up state after child operations
  const cleanupChildState = useCallback(
    deletedChildId => {
      console.log('Cleaning up state for deleted child:', deletedChildId);
      console.log(
        'Current children before cleanup:',
        children?.map(c => ({ id: c.id, name: getCleanChildName(c) }))
      );

      // Remove from children list and handle selected child in one update
      setChildren(prevChildren => {
        const filtered = prevChildren.filter(child => child.id !== deletedChildId);
        console.log('Children before deletion:', prevChildren.length);
        console.log('Children after deletion:', filtered.length);
        console.log(
          'Filtered children:',
          filtered.map(c => ({ id: c.id, name: getCleanChildName(c) }))
        );

        // Update selected child if the deleted child was selected
        setSelectedChild(currentSelected => {
          if (currentSelected === deletedChildId) {
            const newSelected = filtered.length > 0 ? filtered[0].id : null;
            console.log('Selected child changed from', currentSelected, 'to', newSelected);
            return newSelected;
          }
          return currentSelected;
        });

        return filtered;
      });

      // Clean up child assessments
      setChildAssessments(prev => {
        const updated = { ...prev };
        delete updated[deletedChildId];
        return updated;
      });

      // Clear any timeline data for this child
      setTimelineData(prev => prev?.filter(item => item.childId !== deletedChildId) || []);

      // Trigger a component refresh
      setRefreshTrigger(prev => prev + 1);
      console.log('State cleanup completed for child:', deletedChildId);
    },
    [] // No dependencies to avoid stale closures
  );

  // Handle child deletion with better state management
  const handleDeleteChild = useCallback(
    async childId => {
      // Validate that the child exists in current state
      const child = children.find(c => c.id === childId);

      if (!child) {
        console.warn(`Child with ID ${childId} not found in current state`);
        showError('Child profile not found. The list will be refreshed.');
        // Refresh children list to sync with server
        await forceRefreshChildren();
        return;
      }

      // Double-check that this child hasn't already been deleted
      if (childToDelete && childToDelete.id === childId) {
        console.warn('Delete operation already in progress for this child');
        return;
      }

      setChildToDelete(child);
      setShowDeleteModal(true);
    },
    [children, childToDelete, showError, forceRefreshChildren]
  );

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  // Load assessments for all children with request deduplication
  const fetchAllAssessments = useCallback(async () => {
    if (!children.length || useDemoData) return;

    const cacheKey = createCacheKey('allAssessments', { childrenIds: children.map(c => c.id) });

    // Check if request is already ongoing
    if (isRequestOngoing(cacheKey)) {
      console.log('All assessments fetch already in progress, skipping...');
      return;
    }

    try {
      setUpcomingLoading(true);
      markRequestOngoing(cacheKey);

      const allAssessments = [];
      const upcoming = [];

      // Fetch assessments for each child
      for (const child of children) {
        try {
          const childCacheKey = createCacheKey('childAssessments', { childId: child.id });

          // Skip if this child's assessments are already being fetched
          if (isRequestOngoing(childCacheKey)) {
            continue;
          }

          markRequestOngoing(childCacheKey);
          const result = await AssessmentService.getChildAssessments(child.id);
          markRequestComplete(childCacheKey);

          if (result.assessments && result.assessments.length > 0) {
            // Store assessments for the individual child view
            setChildAssessments(prev => ({
              ...prev,
              [child.id]: result.assessments,
            }));

            // Add to the combined assessments list with child info
            result.assessments.forEach(assessment => {
              allAssessments.push({
                ...assessment,
                childName: getCleanChildName(child),
                childId: child.id,
              });

              // Check for incomplete assessments to add to upcoming
              if (assessment.status !== 'completed') {
                upcoming.push({
                  sessionId: assessment.sessionId,
                  childId: child.id,
                  childName: getCleanChildName(child),
                  type: assessment.assessmentType,
                  date: new Date(assessment.lastActiveAt).toLocaleDateString(),
                  status: assessment.status,
                });
              }
            });
          }
        } catch (err) {
          console.error(`Failed to fetch assessments for child ${child.id}:`, err);
        }
      }

      // Sort by date and take most recent ones
      const recent = allAssessments
        .filter(a => a.status === 'completed' && a.results && a.results.disorderRisk)
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
        .slice(0, 5)
        .map(a => ({
          id: a.sessionId,
          childId: a.childId,
          childName: a.childName,
          date: new Date(a.completedAt).toLocaleDateString(),
          area: a.assessmentType,
          score: a.results.disorderRisk.score,
          improvement: a.results.disorderRisk.interpretation
            ? `Risk: ${a.results.disorderRisk.interpretation}`
            : 'N/A',
        }));

      setRecentProgress(recent);
      setUpcomingAssessments(upcoming.slice(0, 3)); // Take top 3
    } catch (err) {
      console.error('Failed to fetch all assessments:', err);
      showError('Failed to load assessment data. Please try again.');
    } finally {
      setUpcomingLoading(false);
      markRequestComplete(cacheKey);
    }
  }, [children, showError, useDemoData]);

  useEffect(() => {
    if (children.length > 0 && !useDemoData) {
      fetchAllAssessments();
    }
  }, [fetchAllAssessments]);

  // Fetch child assessments and progress data
  const fetchChildAssessments = useCallback(async () => {
    if (!selectedChild || useDemoData) return;

    const cacheKey = `childData_${selectedChild}_${activeAssessmentFilter}`;

    // Check if request is already ongoing
    if (isRequestOngoing(cacheKey)) {
      console.log('Child data request already in progress, skipping...');
      return;
    }

    try {
      setAssessmentsLoading(true);
      markRequestOngoing(cacheKey);

      // Convert filter for API
      const filterParam = activeAssessmentFilter !== 'all' ? activeAssessmentFilter : null;

      // Fetch child assessments and timeline in parallel
      const [assessmentsResult, timelineResult] = await Promise.all([
        // Check if we already loaded this child's assessments
        childAssessments[selectedChild]
          ? Promise.resolve({ assessments: childAssessments[selectedChild] })
          : AssessmentService.getChildAssessments(selectedChild, filterParam),
        // Fetch timeline data from new API
        AssessmentService.getAssessmentTimeline(selectedChild, filterParam),
      ]);

      // Update child assessments if we fetched new data
      if (!childAssessments[selectedChild]) {
        setChildAssessments(prev => ({
          ...prev,
          [selectedChild]: assessmentsResult.assessments || [],
        }));
      }

      // Use timeline data from new API
      if (timelineResult && timelineResult.length > 0) {
        console.log('Timeline data from API:', timelineResult);
        // Ensure child names are properly formatted in timeline data
        const formattedTimelineResult = timelineResult.map(item => {
          // Try to find child name from the item first
          if (item.childName && item.childName !== 'Child Assessment') {
            return item;
          }

          // Find the selected child using multiple comparison methods
          const selectedChildProfile = children.find(
            c =>
              c.id === selectedChild ||
              c._id === selectedChild ||
              c.id?.toString() === selectedChild?.toString()
          );

          // Get clean child name or use first child if only one exists
          const childName = selectedChildProfile
            ? getCleanChildName(selectedChildProfile)
            : children.length === 1
              ? getCleanChildName(children[0])
              : 'Child Assessment';

          console.log('Timeline item child name resolution:', {
            originalChildName: item.childName,
            selectedChild,
            foundProfile: !!selectedChildProfile,
            finalChildName: childName,
          });

          return {
            ...item,
            childName,
          };
        });
        setTimelineData(formattedTimelineResult);
      } else {
        console.log('No timeline data from API, using fallback formatting');
        // Fallback to formatting existing assessment data
        const childData = assessmentsResult.assessments || [];
        const selectedChildProfile = children.find(
          c =>
            c.id === selectedChild ||
            c._id === selectedChild ||
            c.id?.toString() === selectedChild?.toString()
        );
        const selectedChildName = selectedChildProfile
          ? getCleanChildName(selectedChildProfile)
          : children.length === 1
            ? getCleanChildName(children[0])
            : '';
        const formattedTimelineData = formatTimelineData(childData, selectedChildName);
        setTimelineData(formattedTimelineData);
      }
    } catch (err) {
      console.error('Failed to fetch child data:', err);
      showError('Failed to load assessment data. Please try again.');

      // If API fails, use demo data for the selected child
      if (!useDemoData) {
        const selectedChildProfile = children.find(
          c =>
            c.id === selectedChild ||
            c._id === selectedChild ||
            c.id?.toString() === selectedChild?.toString()
        );
        const childName = selectedChildProfile
          ? getCleanChildName(selectedChildProfile)
          : children.length === 1
            ? getCleanChildName(children[0])
            : 'Test Child';
        const demoChildData = generateDashboardDemoData().assessments[selectedChild] || [];

        // Update state with demo data for this child
        setChildAssessments(prev => ({
          ...prev,
          [selectedChild]: demoChildData,
        }));

        // Prepare timeline data
        const formattedTimelineData = formatTimelineData(demoChildData, childName);
        setTimelineData(formattedTimelineData);
      }
    } finally {
      setAssessmentsLoading(false);
      markRequestComplete(cacheKey);
    }
  }, [selectedChild, childAssessments, showError, children, useDemoData, activeAssessmentFilter]);

  // Optimized effect that triggers for all tabs that need filtered data
  useEffect(() => {
    if ((activeTab === 'history' || activeTab === 'overview') && selectedChild && !useDemoData) {
      // Add a small delay to prevent rapid successive calls
      const timeoutId = setTimeout(() => {
        fetchChildAssessments();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [selectedChild, activeTab, useDemoData, activeAssessmentFilter, fetchChildAssessments]);

  // Fetch user purchases when assessments tab is active
  useEffect(() => {
    const loadPurchases = async () => {
      if (!isLoggedIn || activeTab !== 'assessments') return;
      try {
        setPurchasesLoading(true);
        const result = await (
          await import('../services/PricingService')
        ).default.getUserPurchases();
        if (result?.success) {
          // Hide pending purchases from the list
          const items = (result.data || []).filter(p => p.paymentStatus === 'completed');
          setPurchases(items);
        }
        try {
          const ent = await (
            await import('../services/PricingService')
          ).default.getUserEntitlements();
          if (ent?.success) setEntitlements(ent.data);
        } catch (e) {
          // optional
        }
      } catch (err) {
        console.error('Failed to load purchases:', err);
      } finally {
        setPurchasesLoading(false);
      }
    };
    loadPurchases();
  }, [isLoggedIn, activeTab]);

  const assessmentRouteFromType = type => {
    if (!type) return null;
    const base = type.replace('-form', '');
    return `/assessment/${base}/form`;
  };

  const handleStartFromPurchase = purchase => {
    if (purchase.purchaseType === 'individual' && purchase.assessmentType) {
      const route = assessmentRouteFromType(purchase.assessmentType);
      if (route) navigate(route);
    } else if (purchase.purchaseType === 'combo') {
      navigate('/pricing', { state: { pricingType: 'combo' } });
    }
  };

  const displayTitle = p => {
    const map = {
      'general-form': 'General Assessment',
      'adhd-form': 'ADHD Assessment',
      'autism-form': 'Autism Assessment',
      'dyslexia-form': 'Dyslexia Assessment',
      'autism-image': 'Autism Image Assessment',
      'adhd-game': 'ADHD Games',
      'dyslexia-game': 'Dyslexia Games',
      'autism-essential': 'Autism Essential Pack',
      'adhd-core': 'ADHD Core Pack',
      'dyslexia-core': 'Dyslexia Core Pack',
      'general-neuro-check': 'General Neuro Check',
      'dual-insight-pack': 'Dual Insight Pack',
      'all-inclusive-pack': 'All Inclusive Pack',
    };
    if (p.purchaseType === 'individual') return map[p.assessmentType] || p.assessmentType;
    return map[p.packageId] || p.packageId;
  };

  // If not logged in and not in demo mode, redirect to login page
  if (!isLoggedIn && !demoMode) {
    return <Navigate to="/login" />;
  }

  // Function to get a color class based on risk score
  const getRiskColor = score => {
    if (score <= 3) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    if (score <= 7)
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  };

  // Format assessment data for timeline
  const formatTimelineData = (assessments, childName) => {
    if (!assessments || assessments.length === 0) return [];

    return assessments.map(assessment => {
      // Use the child name from the assessment itself, fallback to provided childName
      let actualChildName = assessment.childName;

      // If no valid child name, try fallbacks
      if (!actualChildName || actualChildName === 'Child Assessment') {
        actualChildName = childName;
      }

      // Final fallback - if we still don't have a name and there's only one child, use it
      if (!actualChildName && children.length === 1) {
        actualChildName = getCleanChildName(children[0]);
      }

      // Ultimate fallback
      if (!actualChildName) {
        actualChildName = 'Child Assessment';
      }

      return {
        id: assessment.sessionId,
        date: assessment.completedAt || assessment.lastActiveAt,
        type: assessment.assessmentType,
        status: assessment.status,
        score: assessment.results?.disorderRisk?.score,
        childName: actualChildName,
        notes: assessment.results?.summary || 'No notes available',
        reportUrl:
          assessment.status === 'completed' ? `/assessment/complete/${assessment.sessionId}` : null,
      };
    });
  };

  // Handle add to calendar event
  const handleAddToCalendar = assessment => {
    showSuccess(`Added ${assessment.type} assessment to calendar`);
  };

  // Toggle demo mode
  const toggleDemoMode = () => {
    setUseDemoData(prev => !prev);
    if (!useDemoData) {
      // Generate demo data
      const demoDataSet = generateDashboardDemoData();
      setDemoData(demoDataSet);
    } else {
      // Clear demo data and fetch real data
      setDemoData(null);
      setChildren([]);
      setChildAssessments({});
      setSelectedChild(null);
      setRecentProgress([]);
      setUpcomingAssessments([]);
      fetchChildren();
    }
  };

  // Confirm and execute child deletion
  const confirmDeleteChild = async () => {
    if (!childToDelete) return;

    const deletedChildId = childToDelete.id;
    const deletedChildName = getCleanChildName(childToDelete);

    try {
      setLoading(true);

      console.log('Starting deletion process for child:', deletedChildId);

      // Clear all caches before deletion to prevent stale data
      setCache(new Map());
      ongoingRequests.current.clear();

      // Call the backend deletion
      await ChildProfileService.deleteChild(deletedChildId);

      console.log('Backend deletion successful for child:', deletedChildId);

      // Immediately update the state using the cleanup helper
      cleanupChildState(deletedChildId);

      console.log('State cleanup completed for child:', deletedChildId);

      showSuccess(`${deletedChildName}'s profile has been deleted successfully`);

      // Optionally refresh from server after a short delay to ensure consistency
      // But don't wait for it since we've already updated the local state
      setTimeout(async () => {
        try {
          console.log('Performing background refresh after deletion');
          const freshChildren = await ChildProfileService.getChildren();

          // Only update if the current state is different from server state
          setChildren(currentChildren => {
            if (
              JSON.stringify(currentChildren.map(c => c.id).sort()) !==
              JSON.stringify(freshChildren.map(c => c.id).sort())
            ) {
              console.log('Server state differs from local state, updating...');
              return freshChildren;
            }
            console.log('Local state matches server state, no update needed');
            return currentChildren;
          });
        } catch (err) {
          console.error('Background refresh failed (non-critical):', err);
        }
      }, 1000);
    } catch (error) {
      console.error('Error deleting child:', error);

      // Handle specific error cases
      if (error.response?.status === 404) {
        console.log('Child already deleted on server, cleaning up local state');
        showError('This child profile has already been deleted.');
        // Clean up local state since it's already gone from server
        cleanupChildState(deletedChildId);
      } else if (error.response?.status === 403) {
        showError('You do not have permission to delete this child profile.');
      } else if (error.response?.status >= 500) {
        showError('Server error occurred. Please try again later.');
      } else {
        showError('Failed to delete child profile. Please try again.');
      }
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setChildToDelete(null);
    }
  };

  // Cancel child deletion
  const cancelDeleteChild = () => {
    setShowDeleteModal(false);
    setChildToDelete(null);
  };

  // Delete Confirmation Modal Component
  const DeleteConfirmationModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      onClick={cancelDeleteChild}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative w-full max-w-md bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 p-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
          <svg
            className="w-8 h-8 text-red-600 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </div>

        {/* Modal Content */}
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Delete Child Profile
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-gray-900 dark:text-white">
              {getCleanChildName(childToDelete)}
            </span>
            's profile? This action cannot be undone and will permanently remove all associated
            data.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={cancelDeleteChild}
            variant="outline"
            size="md"
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDeleteChild}
            variant="danger"
            size="md"
            className="flex-1"
            disabled={loading}
            isLoading={loading}
            loadingText="Deleting..."
          >
            Delete Profile
          </Button>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-radial from-red-500/10 to-transparent rounded-full blur-xl opacity-70"></div>
        <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-gradient-radial from-red-400/10 to-transparent rounded-full blur-xl opacity-70"></div>
      </motion.div>
    </motion.div>
  );

  // Show loading screen when refreshing after child creation
  if (loading && children.length === 0) {
    return (
      <div className="min-h-screen bg-background dark:bg-dark-background relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial from-primary/5 to-transparent opacity-60 dark:opacity-30"></div>
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-radial from-secondary/10 to-transparent rounded-full dark:from-secondary/5"></div>
          <div className="absolute bottom-40 left-20 w-[600px] h-[600px] bg-gradient-radial from-accent/10 to-transparent rounded-full dark:from-accent/5"></div>
        </div>
        <div className="flex items-center justify-center min-h-screen pt-24">
          <LogoLoader size="large" message="Loading your dashboard..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-dark-background relative overflow-hidden">
      {/* Enhanced background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial from-primary/5 to-transparent opacity-60 dark:opacity-30"></div>
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-radial from-secondary/10 to-transparent rounded-full dark:from-secondary/5"></div>
        <div className="absolute bottom-40 left-20 w-[600px] h-[600px] bg-gradient-radial from-accent/10 to-transparent rounded-full dark:from-accent/5"></div>

        {/* Enhanced floating elements */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 dark:from-indigo-600/10 dark:to-purple-600/10 rounded-full blur-2xl animate-pulse"></div>
        <div
          className="absolute top-3/4 right-1/3 w-24 h-24 bg-gradient-to-r from-pink-400/20 to-rose-400/20 dark:from-pink-600/10 dark:to-rose-600/10 rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: '2s' }}
        ></div>

        {/* Animated dots */}
        <div className="absolute top-[20%] left-[15%] w-3 h-3 bg-primary rounded-full opacity-40 animate-pulse"></div>
        <div
          className="absolute top-[25%] right-[10%] w-2 h-2 bg-accent rounded-full opacity-40 animate-pulse"
          style={{ animationDelay: '1s' }}
        ></div>
        <div
          className="absolute bottom-[30%] right-[20%] w-2 h-2 bg-secondary rounded-full opacity-40 animate-pulse"
          style={{ animationDelay: '3s' }}
        ></div>
        <div
          className="absolute top-[60%] left-[10%] w-1.5 h-1.5 bg-indigo-500 rounded-full opacity-30 animate-pulse"
          style={{ animationDelay: '4s' }}
        ></div>
        <div
          className="absolute bottom-[60%] right-[15%] w-1.5 h-1.5 bg-purple-500 rounded-full opacity-30 animate-pulse"
          style={{ animationDelay: '2.5s' }}
        ></div>
      </div>

      <div className="container mx-auto px-4 pt-24 pb-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-8 flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6 relative"
        >
          {/* Subtle background glow */}
          <div className="absolute -inset-4 bg-gradient-to-r from-primary/5 via-purple-500/5 to-pink-500/5 rounded-2xl blur-xl opacity-50"></div>

          <motion.div className="relative z-10 flex-1">
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-3xl font-bold text-text dark:text-dark-text flex items-center gap-2"
            >
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-gradient bg-300%">
                {currentUser?.firstName ||
                  currentUser?.first_name ||
                  currentUser?.name?.split(' ')[0] ||
                  'Parent'}
                's
              </span>
              Dashboard
              <motion.div
                animate={{ rotate: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="text-2xl"
              >
                <svg
                  className="w-8 h-8 text-primary"
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
              </motion.div>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-2"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="w-2 h-2 bg-green-500 rounded-full"
              ></motion.div>
              Welcome back,{' '}
              {currentUser?.firstName ||
                currentUser?.first_name ||
                currentUser?.name?.split(' ')[0] ||
                'Parent'}
              ! Here's how your children are progressing.
            </motion.p>
          </motion.div>

          {/* Global Assessment Filter */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="relative z-10 lg:w-auto w-full"
          >
            <AssessmentTypeFilter
              activeFilter={activeAssessmentFilter}
              onFilterChange={handleAssessmentFilterChange}
              assessmentCounts={assessmentCounts}
              variant="compact"
            />
          </motion.div>
        </motion.div>

        {/* Enhanced Dashboard Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-3 shadow-lg border border-white/20 dark:border-gray-700/30"
        >
          <nav className="flex flex-wrap gap-2">
            {[
              {
                key: 'overview',
                label: 'Overview',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                key: 'assessments',
                label: 'Your Assessments',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 7V3m8 4V3M5 11h14M5 19h14M5 15h14"
                    />
                  </svg>
                ),
              },
              {
                key: 'children',
                label: 'Children',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                ),
              },
              {
                key: 'history',
                label: 'History',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                ),
              },
            ].map((tab, index) => (
              <motion.button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg shadow-primary/25'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/60 dark:hover:bg-gray-700/60'
                }`}
              >
                <span className="text-base">{tab.icon}</span>
                <span>
                  {tab.key === 'overview' && t('tabs.overview', { ns: 'dashboard' })}
                  {tab.key === 'assessments' && t('tabs.assessments', { ns: 'dashboard' })}
                  {tab.key === 'children' && t('tabs.children', { ns: 'dashboard' })}
                  {tab.key === 'history' && t('tabs.history', { ns: 'dashboard' })}
                </span>
                {activeTab === tab.key && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 bg-gradient-to-r from-primary to-purple-500 rounded-xl -z-10"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </motion.button>
            ))}
          </nav>
        </motion.div>

        {activeTab === 'overview' && (
          <DashboardOverview
            activeFilter={activeAssessmentFilter}
            key={`overview-${activeAssessmentFilter}-${refreshTrigger}`}
          />
        )}

        {activeTab === 'assessments' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-lg border border-white/20 dark:border-gray-700/50 p-6 backdrop-blur-sm relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {t('tabs.assessments', { ns: 'dashboard' })}
                </h2>
                <Link
                  to="/pricing"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                >
                  {t('assessments.buy_more', { ns: 'dashboard' })}
                </Link>
              </div>

              {/* Remaining allowances */}
              {entitlements && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  {['autism', 'adhd', 'dyslexia'].map(base => (
                    <div
                      key={base}
                      className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="text-xs uppercase text-gray-500 dark:text-gray-400">
                        {t('assessments.remaining', { ns: 'dashboard', base })}
                      </div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {Math.max(0, entitlements[base]?.remaining ?? 0)}
                      </div>
                      {(entitlements[base]?.remaining ?? 0) === 0 && (
                        <Link to="/pricing" className="text-xs text-primary">
                          {t('assessments.buy_more', { ns: 'dashboard' })}
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {purchasesLoading ? (
                <div className="flex justify-center items-center py-10">
                  <LogoLoader size="medium" message="Loading purchases..." showMessage={true} />
                </div>
              ) : purchases && purchases.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {purchases.map(p => (
                    <div
                      key={p._id}
                      className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/60"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {p.purchaseType === 'combo' ? 'Combo Package' : 'Individual Assessment'}
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            p.paymentStatus === 'completed'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : p.paymentStatus === 'pending'
                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                        >
                          {p.paymentStatus}
                        </span>
                      </div>
                      <div className="text-gray-900 dark:text-white font-semibold mb-1">
                        {displayTitle(p)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        {p.currency} {p.amount}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStartFromPurchase(p)}
                          disabled={p.paymentStatus !== 'completed'}
                          className="flex-1 px-3 py-2 text-sm rounded-md text-white bg-primary disabled:opacity-50"
                        >
                          {p.purchaseType === 'combo'
                            ? t('assessments.view', { ns: 'dashboard' })
                            : t('assessments.start', { ns: 'dashboard' })}
                        </button>
                        {p.purchaseType === 'combo' && (
                          <Link
                            to="/pricing"
                            className="px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                          >
                            {t('assessments.details', { ns: 'dashboard' })}
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                  No purchases yet. Browse plans and get started.
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            {/* Background decorations */}
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-gradient-radial from-secondary/10 to-transparent rounded-full blur-xl z-0 opacity-70"></div>
            <div className="absolute bottom-10 -left-10 w-56 h-56 bg-gradient-radial from-primary/10 to-transparent rounded-full blur-xl z-0 opacity-70"></div>

            <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-lg border border-white/20 dark:border-gray-700/50 p-6 backdrop-blur-sm relative z-10">
              <div className="relative">
                <div className="absolute -top-12 -left-12 w-32 h-32 bg-gradient-radial from-orange-500/20 to-transparent rounded-full blur-lg z-0 opacity-70"></div>
                <div className="relative z-10 inline-flex items-center mb-6 bg-gradient-to-r from-orange-500/10 to-orange-600/20 rounded-full pl-1 pr-4 py-1">
                  <span className="bg-orange-500 text-white dark:bg-orange-600 dark:text-white rounded-full w-6 h-6 flex items-center justify-center mr-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  <span className="text-orange-600 dark:text-orange-400 text-sm font-medium">
                    Assessments Timeline & History
                  </span>
                </div>
              </div>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Assessment History & Timeline
              </h2>

              {/* Child Selector */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6">
                <div className="w-full sm:w-64">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Child
                  </label>
                  <div className="relative">
                    <select
                      value={selectedChild || ''}
                      onChange={e => setSelectedChild(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300/50 dark:border-gray-600/50 rounded-lg bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary shadow-sm backdrop-blur-sm appearance-none"
                    >
                      <option value="">Select a child</option>
                      {children.map(child => (
                        <option key={child.id} value={child.id}>
                          {getCleanChildName(child)} ({getChildAge(child)} years)
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                      <svg
                        className="fill-current h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assessment Timeline */}
              <div className="bg-white/80 dark:bg-gray-800/80 border border-white/20 dark:border-gray-700/30 rounded-xl shadow-md p-5 mb-8 backdrop-blur-sm">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-primary dark:text-primary-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
                  </svg>
                  Timeline
                </h3>

                {!selectedChild ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-white/10 dark:border-gray-700/30 p-6">
                    Please select a child to view their timeline.
                  </div>
                ) : assessmentsLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <LogoLoader size="medium" message="Loading timeline..." showMessage={true} />
                  </div>
                ) : !timelineData || timelineData.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-white/10 dark:border-gray-700/30 p-6">
                    <div className="flex justify-center mb-4">
                      <svg
                        className="w-16 h-16 text-gray-400 dark:text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No assessments found for this child
                    </h4>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                      This child hasn't completed any assessments yet. Start an assessment to track
                      their progress and development.
                    </p>
                    <Link
                      to="/assessment"
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg transform hover:-translate-y-0.5 font-medium"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Start Assessment
                    </Link>
                  </div>
                ) : (
                  <AssessmentTimeline
                    assessments={timelineData}
                    onAddToCalendar={handleAddToCalendar}
                  />
                )}
              </div>

              {/* Assessment History list */}
              <div className="mt-8">
                <AssessmentHistory
                  selectedChildId={selectedChild}
                  timelineData={timelineData}
                  onRefresh={fetchChildAssessments}
                  activeFilter={activeAssessmentFilter}
                  key={`history-${selectedChild}-${activeAssessmentFilter}`}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Children Tab */}
        {activeTab === 'children' && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={FADE_UP}
            className="bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-sm border border-white/20 dark:border-gray-700/50 p-6"
          >
            <div className="relative">
              <div className="absolute -top-12 -left-12 w-32 h-32 bg-gradient-radial from-green-500/20 to-transparent rounded-full blur-lg z-0 opacity-70"></div>
              <div className="relative z-10 inline-flex items-center mb-4 bg-gradient-to-r from-green-500/10 to-green-600/20 rounded-full pl-1 pr-4 py-1">
                <span className="bg-green-500 text-white dark:bg-green-600 dark:text-white rounded-full w-6 h-6 flex items-center justify-center mr-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                  Children Management
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Children Profiles
              </h2>
              <Button
                onClick={() => navigate('/add-child')}
                variant="primary"
                size="md"
                className="inline-flex items-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-sm"
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  ></path>
                </svg>
                Add Child
              </Button>
            </div>

            {loading && (!children || children.length === 0) ? (
              <div className="flex justify-center items-center py-8">
                <LogoLoader
                  size="large"
                  message="Loading children profiles..."
                  showMessage={true}
                />
              </div>
            ) : error && (!children || children.length === 0) ? (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
                {error}
              </div>
            ) : children && children.length > 0 ? (
              <div className="relative">
                {loading && children && children.length > 0 && (
                  <div className="absolute top-0 left-0 right-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm z-10 rounded-lg p-2">
                    <div className="flex items-center justify-center py-2">
                      <LogoLoader size="small" message="Refreshing..." showMessage={true} />
                    </div>
                  </div>
                )}
                <div
                  className="overflow-x-auto"
                  key={`children-table-${refreshTrigger}-${children.length}`}
                >
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                        <th className="pb-3 font-medium">Name</th>
                        <th className="pb-3 font-medium">Date of Birth</th>
                        <th className="pb-3 font-medium">Age</th>
                        <th className="pb-3 font-medium">Gender</th>
                        <th className="pb-3 font-medium">Grade</th>
                        <th className="pb-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody key={`children-tbody-${refreshTrigger}-${children.length}`}>
                      {children.map(child => (
                        <tr
                          key={`child-row-${child.id}-${child.name || ''}`}
                          className="border-b border-gray-100 dark:border-gray-700 hover:bg-white/50 dark:hover:bg-gray-700/50"
                        >
                          <td className="py-4 text-gray-900 dark:text-white font-medium">
                            {getCleanChildName(child)}
                          </td>
                          <td className="py-4 text-gray-500 dark:text-gray-400">
                            {child.dateOfBirth || child.dob
                              ? new Date(child.dateOfBirth || child.dob).toLocaleDateString()
                              : 'Not set'}
                          </td>
                          <td className="py-4 text-gray-500 dark:text-gray-400">
                            {getChildAge(child)} years
                          </td>
                          <td className="py-4 text-gray-500 dark:text-gray-400 capitalize">
                            {child.gender || 'Not set'}
                          </td>
                          <td className="py-4 text-gray-500 dark:text-gray-400">
                            {child.grade || 'Not set'}
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => {
                                  if (
                                    location.pathname !== '/dashboard' ||
                                    !location.search.includes('tab=children')
                                  ) {
                                    navigate('/dashboard?tab=children');
                                  }
                                  navigate(`/child/${child.id}`);
                                }}
                                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-800/40 rounded-md border border-blue-200 dark:border-blue-700/50 transition-colors duration-200"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                                View
                              </button>
                              <Link
                                to={`/edit-child/${child.id}`}
                                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-800/40 rounded-md border border-indigo-200 dark:border-indigo-700/50 transition-colors duration-200"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                                Edit
                              </Link>
                              <button
                                onClick={() => handleDeleteChild(child.id)}
                                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-800/40 rounded-md border border-red-200 dark:border-red-700/50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={
                                  loading || (childToDelete && childToDelete.id === child.id)
                                }
                              >
                                {loading && childToDelete && childToDelete.id === child.id ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin mr-1"></div>
                                    Deleting...
                                  </>
                                ) : (
                                  <>
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-4 w-4 mr-1"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                    Delete
                                  </>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No children profiles found. Add your first child to get started.
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Accessibility quick settings button */}
      {/* <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, duration: 0.3 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          className="bg-primary dark:bg-dark-primary text-white p-3 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-dark-primary/50"
          aria-label="Accessibility settings"
          size="sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
            />
          </svg>
        </Button>
      </motion.div> */}

      {/* Add animation styles */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: scale(1) translate(0px, 0px);
          }
          33% {
            transform: scale(1.1) translate(20px, -20px);
          }
          66% {
            transform: scale(0.9) translate(-20px, 20px);
          }
          100% {
            transform: scale(1) translate(0px, 0px);
          }
        }
        .animate-blob {
          animation: blob 10s infinite ease-in-out;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>

      <AnimatePresence>{showDeleteModal && <DeleteConfirmationModal />}</AnimatePresence>
    </div>
  );
};

export default Dashboard;
