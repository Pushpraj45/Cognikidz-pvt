import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChildProfileCard from './ChildProfileCard';
import ChildProfileForm from './ChildProfileForm';
import Button from '../ui/Button';
import ChildProfileService from '../../services/ChildProfileService';
import AuthService from '../../services/AuthService';
import {
  PlusCircleIcon,
  UserGroupIcon,
  SparklesIcon,
  HeartIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

const ChildrenManagement = ({
  childrenData,
  isLoading: initialLoading = false,
  onAddChild,
  onEditChild,
  onDeleteChild,
}) => {
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [editingChildId, setEditingChildId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [children, setChildren] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [notification, setNotification] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Initialize component with user data check
    initializeComponent();
  }, [initialLoading]);

  // Debug effect to monitor children state changes
  useEffect(() => {
    console.log('Children state changed:', children);
  }, [children]);

  // Sync with childrenData prop if provided
  useEffect(() => {
    if (childrenData && Array.isArray(childrenData)) {
      console.log('Syncing with childrenData prop:', childrenData);
      setChildren(childrenData);
    }
  }, [childrenData]);

  const initializeComponent = async () => {
    try {
      setError(null); // Clear previous errors

      // Get and validate token
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Please login to view children profiles');
        return;
      }

      console.log('Token found, length:', token.length);
      console.log('Token starts with:', token.substring(0, 10));

      // Check for user data, refresh if needed
      let userData = JSON.parse(localStorage.getItem('user_data') || '{}');
      if (!userData.id && !userData._id) {
        console.log('No user ID found, attempting to fetch from server');
        try {
          // Try first with getCurrentUser which may use cached data
          userData = await AuthService.getCurrentUser();

          // If still no ID, directly fetch from profile endpoint
          if (!userData || (!userData.id && !userData._id)) {
            console.log('Still no user ID, fetching directly from profile endpoint');
            userData = await AuthService.getUserProfile();

            if (!userData || (!userData.id && !userData._id)) {
              setError('Unable to retrieve your profile. Please try logging in again.');
              return;
            }
          }

          // Ensure we have an id field
          userData.id = userData._id || userData.id;

          // Store the updated user data
          localStorage.setItem('user_data', JSON.stringify(userData));
          console.log('User data refreshed, ID:', userData.id);
        } catch (userError) {
          console.error('Error fetching user data:', userError);
          setError('Failed to authenticate. Please log in again.');
          return;
        }
      } else {
        console.log('User data found in storage, ID:', userData.id || userData._id);
      }

      // Now fetch children
      if (!initialLoading) {
        try {
          await fetchChildren();
        } catch (fetchError) {
          console.error('Error fetching children during initialization:', fetchError);
          setError('Could not load children profiles. Please try refreshing the page.');
        }
      }
    } catch (error) {
      console.error('Error during component initialization:', error);
      setError('An error occurred. Please try again later.');
    }
  };

  const fetchChildren = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Fetching children...');

      try {
        const data = await ChildProfileService.getChildren();
        console.log('Children data received:', data);
        console.log('Data type:', typeof data);
        console.log('Is array:', Array.isArray(data));
        console.log('Data length:', data ? data.length : 'null/undefined');

        if (Array.isArray(data)) {
          console.log('Setting children state with array:', data);
          setChildren(data);
          console.log('Children state updated, count:', data.length);
        } else {
          console.log('Data is not an array, setting empty array');
          setChildren([]);
        }
      } catch (fetchError) {
        console.error('Error in initial fetch attempt:', fetchError);

        // If first attempt failed, try getting a fresh user token and refetching
        try {
          // Check if token is still valid
          const userData = await AuthService.getCurrentUser();
          if (!userData) {
            throw new Error('User not authenticated');
          }

          // Retry fetching children with refreshed auth
          const data = await ChildProfileService.getChildren();
          console.log('Children data received on retry:', data);
          console.log('Retry data type:', typeof data);
          console.log('Retry is array:', Array.isArray(data));

          if (Array.isArray(data)) {
            console.log('Setting children state on retry with array:', data);
            setChildren(data);
            console.log('Children state updated on retry, count:', data.length);
          } else {
            console.log('Retry data is not an array, setting empty array');
            setChildren([]);
          }
        } catch (retryError) {
          console.error('Error in retry fetch attempt:', retryError);
          throw retryError;
        }
      }
    } catch (error) {
      console.error('Error fetching children:', error);
      setError('Failed to load children. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddChild = async childData => {
    try {
      setIsLoading(true);
      setError(null); // Clear any previous errors

      // Get parent ID from user data
      let userData = JSON.parse(localStorage.getItem('user_data') || '{}');

      // If parent ID is not available, try to fetch it
      if (!userData.id && !userData._id) {
        console.log('Parent ID not found in local storage, fetching from server');
        try {
          // Fetch user profile from server
          userData = await AuthService.getUserProfile();

          if (!userData || (!userData.id && !userData._id)) {
            throw new Error('Unable to retrieve parent ID from server');
          }

          // Ensure we have an id field
          userData.id = userData._id || userData.id;

          // Store the updated user data
          localStorage.setItem('user_data', JSON.stringify(userData));
          console.log('Updated user data with ID:', userData.id);
        } catch (userError) {
          console.error('Error fetching user data:', userError);
          throw new Error('Parent ID not available. Please log in again.');
        }
      }

      const parentId = userData.id || userData._id;

      if (!parentId) {
        throw new Error('Parent ID not available. Please log in again.');
      }

      const formattedData = {
        ...childData,
        dob: childData.birthdate || childData.dob,
        parental_consent: true,
        parent_id: parentId,
      };

      console.log('Adding child with parent_id:', parentId);
      console.log('Formatted data:', formattedData);

      const newChild = await ChildProfileService.createChild(formattedData);
      console.log('Child created successfully:', newChild);

      // Clear cache and refresh the children list
      console.log('Refreshing children list after creation...');
      console.log('Current children state before refresh:', children);

      // Clear the cache to ensure fresh data
      ChildProfileService.clearCache();
      await fetchChildren();
      console.log('Fetch children completed, checking state after refresh...');

      // Add a small delay to ensure state updates are processed
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log('Children state after fetch:', children);

      // Force a re-render by updating the refresh key
      setRefreshKey(prev => prev + 1);

      // Close the add form
      setIsAddingChild(false);

      // Small delay to ensure DOM updates before scrolling
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);

      // Show success notification
      setNotification({
        type: 'success',
        message: 'Child profile created successfully!',
      });

      // Clear notification after 3 seconds
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    } catch (error) {
      console.error('Error adding child:', error);
      setError(error.message || 'Failed to add child. Please try again.');

      // Show error notification
      setNotification({
        type: 'error',
        message: error.message || 'Failed to add child. Please try again.',
      });

      // Clear error notification after 5 seconds
      setTimeout(() => {
        setNotification(null);
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditChild = async (childId, childData) => {
    try {
      setIsLoading(true);
      setError(null); // Clear any previous errors

      const formattedData = {
        ...childData,
        dob: childData.birthdate || childData.dob,
      };

      const updatedChild = await ChildProfileService.updateChild(childId, formattedData);
      console.log('Child updated successfully:', updatedChild);

      // Clear cache and refresh the children list
      ChildProfileService.clearCache();
      await fetchChildren();

      // Force a re-render by updating the refresh key
      setRefreshKey(prev => prev + 1);

      // Close the edit form
      setEditingChildId(null);

      // Small delay to ensure DOM updates before scrolling
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);

      // Show success notification
      setNotification({
        type: 'success',
        message: 'Child profile updated successfully!',
      });

      // Clear notification after 3 seconds
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    } catch (error) {
      console.error('Error updating child:', error);
      setError(error.message || 'Failed to update child. Please try again.');

      // Show error notification
      setNotification({
        type: 'error',
        message: error.message || 'Failed to update child. Please try again.',
      });

      // Clear error notification after 5 seconds
      setTimeout(() => {
        setNotification(null);
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteChild = async childId => {
    try {
      setIsLoading(true);
      setError(null); // Clear any previous errors

      // Check if we have a valid ID
      if (!childId) {
        throw new Error('Invalid child ID');
      }

      // Some children might have _id field instead of id
      const id = childId.id || childId._id || childId;

      await ChildProfileService.deleteChild(id);
      console.log('Child deleted successfully');

      // Clear cache and refresh the children list
      ChildProfileService.clearCache();
      await fetchChildren();

      // Force a re-render by updating the refresh key
      setRefreshKey(prev => prev + 1);

      // Small delay to ensure DOM updates before scrolling
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);

      // Show success notification
      setNotification({
        type: 'success',
        message: 'Child profile deleted successfully!',
      });

      // Clear notification after 3 seconds
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    } catch (error) {
      console.error('Error deleting child:', error);
      setError(error.message || 'Failed to delete child. Please try again.');

      // Show error notification
      setNotification({
        type: 'error',
        message: error.message || 'Failed to delete child. Please try again.',
      });

      // Clear error notification after 5 seconds
      setTimeout(() => {
        setNotification(null);
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddChildClick = () => {
    setIsAddingChild(true);
    setEditingChildId(null);
  };

  const handleEditChildClick = childId => {
    setEditingChildId(childId);
    setIsAddingChild(false);
  };

  const handleCancelAddEdit = () => {
    setIsAddingChild(false);
    setEditingChildId(null);
  };

  const handleSaveChild = async childData => {
    try {
      if (editingChildId) {
        await handleEditChild(editingChildId, childData);
      } else {
        await handleAddChild(childData);
      }
    } catch (error) {
      console.error('Error saving child:', error);
      // Error handling is already done in handleAddChild and handleEditChild
    }
  };

  const handleAddAnother = () => {
    setIsAddingChild(true);
    setEditingChildId(null);
  };

  const handleConfirmDelete = () => {
    if (showDeleteConfirm) {
      handleDeleteChild(showDeleteConfirm);
      setShowDeleteConfirm(null);
    }
  };

  const editingChild = editingChildId ? children.find(child => child.id === editingChildId) : null;

  return (
    <div
      className="group relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl xs:rounded-2xl overflow-hidden border border-white/20 dark:border-gray-700/30 shadow-lg hover:shadow-2xl transition-all duration-500"
      key={refreshKey}
    >
      {/* Enhanced gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white/30 to-cyan-50/50 dark:from-blue-900/20 dark:via-gray-800/30 dark:to-cyan-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      {/* Animated border glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-teal-500/20 dark:from-blue-600/10 dark:via-cyan-600/10 dark:to-teal-600/10 rounded-xl xs:rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>

      <div className="relative border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="px-4 xs:px-6 py-4 xs:py-6 flex flex-col xs:flex-row justify-between items-start xs:items-center space-y-3 xs:space-y-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 xs:w-10 xs:h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg xs:rounded-xl flex items-center justify-center shadow-lg">
              <UserGroupIcon className="h-4 w-4 xs:h-5 xs:w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg xs:text-xl font-bold text-gray-900 dark:text-white">
                Children Profiles
              </h2>
              <p className="text-xs xs:text-sm text-gray-600 dark:text-gray-400">
                Manage profiles for your children{' '}
                {children && children.length > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 ml-2">
                    <HeartIcon className="h-3 w-3 mr-1" />
                    {children.length} active
                  </span>
                )}
                {children && children.length >= 10 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 ml-2">
                    Maximum limit reached
                  </span>
                )}
              </p>
            </div>
          </div>

          {!isAddingChild && !editingChildId && (
            <div>
              <Button
                variant="gradient"
                onClick={handleAddChildClick}
                disabled={children && children.length >= 10}
                className="whitespace-nowrap w-full xs:w-auto text-sm"
              >
                <PlusCircleIcon className="h-4 w-4 xs:h-5 xs:w-5 mr-2" />
                {children && children.length >= 10 ? 'Limit Reached' : 'Add Child'}
                {children && children.length > 0 && children.length < 10 && (
                  <span className="bg-white/20 px-2 py-1 rounded-full text-xs ml-2 hidden xs:inline">
                    {10 - children.length} left
                  </span>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="relative px-4 xs:px-6 py-6 xs:py-8">
        {/* Notification Display */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mb-4 p-4 rounded-lg border ${
                notification.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'
                  : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
              }`}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {notification.type === 'success' ? (
                    <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-5 h-5 bg-red-400 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{notification.message}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {isAddingChild && (
            <div key="adding" className="space-y-6">
              <ChildProfileForm
                onSave={handleSaveChild}
                onCancel={handleCancelAddEdit}
                onAddAnother={handleAddAnother}
              />
            </div>
          )}

          {editingChildId && (
            <div key="editing" className="space-y-6">
              <ChildProfileForm
                child={editingChild}
                onSave={handleSaveChild}
                onCancel={handleCancelAddEdit}
              />
            </div>
          )}

          {!isAddingChild && !editingChildId && (
            <div key="list" className="space-y-6">
              {isLoading ? (
                <div className="py-12 xs:py-16">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="relative w-12 h-12 xs:w-16 xs:h-16">
                      <div className="absolute inset-0 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-pulse"></div>
                      <div className="absolute inset-2 border-4 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <div className="text-center">
                      <h3 className="text-base xs:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Loading children...
                      </h3>
                      <p className="text-xs xs:text-sm text-gray-600 dark:text-gray-400">
                        Please wait while we fetch your children's profiles
                      </p>
                    </div>
                  </div>
                </div>
              ) : children.length === 0 ? (
                <div className="py-12 xs:py-16 px-4 xs:px-6 flex flex-col items-center justify-center text-center">
                  {/* Enhanced empty state illustration */}
                  <div className="relative mb-6 xs:mb-8">
                    <div className="w-20 h-20 xs:w-24 xs:h-24 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center shadow-lg">
                      <UserGroupIcon className="w-10 h-10 xs:w-12 xs:h-12 text-blue-600 dark:text-blue-400" />
                    </div>

                    {/* Floating sparkles */}
                    <div className="absolute -top-2 -right-2 w-5 h-5 xs:w-6 xs:h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                      <div className="w-2.5 h-2.5 xs:w-3 xs:h-3 text-white">
                        <SparklesIcon className="w-2.5 h-2.5 xs:w-3 xs:h-3 text-white" />
                      </div>
                    </div>

                    <div className="absolute -bottom-1 -left-3 w-3 h-3 xs:w-4 xs:h-4 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 xs:w-2 xs:h-2 text-white">
                        <HeartIcon className="w-1.5 h-1.5 xs:w-2 xs:h-2 text-white" />
                      </div>
                    </div>
                  </div>

                  <h3 className="text-xl xs:text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    Ready to Start?
                  </h3>
                  <p className="text-sm xs:text-base text-gray-600 dark:text-gray-400 mb-6 xs:mb-8 max-w-md leading-relaxed">
                    Create your first child profile to unlock personalized assessments, track
                    developmental milestones, and receive expert insights tailored just for them.
                  </p>

                  <Button
                    variant="gradient"
                    onClick={handleAddChildClick}
                    className="w-full xs:w-auto"
                  >
                    <PlusCircleIcon className="h-4 w-4 xs:h-5 xs:w-5 mr-2" />
                    Add Your First Child
                    <span className="bg-white/20 px-2 py-1 rounded-full text-xs ml-2 hidden xs:inline">
                      Let's begin!
                    </span>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 xs:gap-6">
                  {children.map((child, index) => (
                    <div key={child.id} className="space-y-6">
                      <ChildProfileCard
                        child={child}
                        onEdit={() => handleEditChildClick(child.id)}
                        onDelete={() => setShowDeleteConfirm(child.id)}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Enhanced Error State */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl xs:rounded-2xl p-4 xs:p-6 text-center">
                  <div className="w-10 h-10 xs:w-12 xs:h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircleIcon className="h-5 w-5 xs:h-6 xs:w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-base xs:text-lg font-semibold text-red-900 dark:text-red-200 mb-2">
                    Something went wrong
                  </h3>
                  <p className="text-sm xs:text-base text-red-700 dark:text-red-300 mb-4">
                    {error}
                  </p>
                  <Button
                    variant="gradient"
                    onClick={() => {
                      setError(null);
                      fetchChildren();
                    }}
                    className="w-full xs:w-auto"
                  >
                    Try Again
                  </Button>
                </div>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Enhanced Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl xs:rounded-2xl p-4 xs:p-6 max-w-sm xs:max-w-md w-full shadow-2xl">
              <div className="text-center mb-4 xs:mb-6">
                <div className="w-12 h-12 xs:w-16 xs:h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircleIcon className="h-6 w-6 xs:h-8 xs:w-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-base xs:text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Delete Child Profile?
                </h3>
                <p className="text-sm xs:text-base text-gray-600 dark:text-gray-400">
                  This action cannot be undone. All associated data will be permanently removed.
                </p>
              </div>
              <div className="flex flex-col xs:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 w-full"
                >
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleConfirmDelete} className="flex-1 w-full">
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChildrenManagement;
