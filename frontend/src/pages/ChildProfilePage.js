import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import ChildProfileService from '../services/ChildProfileService';
import LogoLoader from '../components/ui/LogoLoader';
import { calculateAge, formatDate } from '../utils/dateUtils';
import TranslatedText from '../components/ui/TranslatedText';
import ChildProfileForm from '../components/profile/ChildProfileForm';
import Button from '../components/ui/Button';

const ChildProfilePage = () => {
  const { childId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [childData, setChildData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const isEditing = Boolean(childId);

  useEffect(() => {
    if (isEditing && childId) {
      fetchChildData();
    }
  }, [childId, isEditing]);

  const fetchChildData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const child = await ChildProfileService.getChild(childId);
      setChildData(child);
    } catch (error) {
      console.error('Error fetching child data:', error);
      setError('Failed to load child profile. Please try again.');
      toast.error('Failed to load child profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async formData => {
    try {
      if (isEditing) {
        await ChildProfileService.updateChild(childId, formData);
        toast.success('Child profile updated successfully!');
        navigate('/dashboard?refresh=true&tab=children');
      } else {
        await ChildProfileService.createChild(formData);
        toast.success('Child profile created successfully!');
        navigate('/dashboard?childAdded=true&tab=children');
      }
    } catch (error) {
      console.error('Error saving child profile:', error);
      const errorMessage = error.message || 'Failed to save child profile. Please try again.';
      toast.error(errorMessage);
      throw error; // Re-throw to let the form handle it
    }
  };

  const handleCancel = () => {
    navigate('/dashboard?tab=children');
  };

  const handleAddAnother = async formData => {
    try {
      await ChildProfileService.createChild(formData);
      toast.success('Child profile created successfully!');
      // Navigate to add child page again but indicate success
      navigate('/add-child?success=true');

      // Trigger a refresh of the dashboard in the background
      // We'll do this by updating the main dashboard URL state
      setTimeout(() => {
        // This will be picked up by the dashboard when user navigates back
        window.history.replaceState(
          { ...window.history.state, needsRefresh: true },
          '',
          window.location.href
        );
      }, 100);
    } catch (error) {
      console.error('Error saving child profile:', error);
      const errorMessage = error.message || 'Failed to save child profile. Please try again.';
      toast.error(errorMessage);
      throw error;
    }
  };

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 },
  };

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.5,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background dark:bg-dark-background relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial from-primary/5 to-transparent opacity-60 dark:opacity-30"></div>
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-radial from-secondary/10 to-transparent rounded-full dark:from-secondary/5"></div>
          <div className="absolute bottom-40 left-20 w-[600px] h-[600px] bg-gradient-radial from-accent/10 to-transparent rounded-full dark:from-accent/5"></div>
        </div>
        <div className="relative z-10">
          <LogoLoader size="large" message="Loading child profile..." showMessage={true} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background dark:bg-dark-background relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial from-primary/5 to-transparent opacity-60 dark:opacity-30"></div>
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-radial from-secondary/10 to-transparent rounded-full dark:from-secondary/5"></div>
          <div className="absolute bottom-40 left-20 w-[600px] h-[600px] bg-gradient-radial from-accent/10 to-transparent rounded-full dark:from-accent/5"></div>
        </div>
        <div className="relative z-10 text-center">
          <div className="text-red-500 text-center">
            <div className="flex justify-center mb-4">
              <svg
                className="w-20 h-20 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Child Profile Not Found</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button
            onClick={() => navigate('/dashboard')}
            variant="gradient"
            size="md"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="min-h-screen bg-background dark:bg-dark-background relative overflow-hidden"
    >
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

      <div className="relative z-10">
        {/* Page Header - Works with main navbar */}
        <div className="mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleCancel}
                  className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors text-sm font-normal"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Back to Dashboard
                </button>
              </div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {isEditing ? 'Edit Child Profile' : 'Add Child Profile'}
              </h1>
              <div className="w-32"></div> {/* Spacer for center alignment */}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <ChildProfileForm
              child={childData}
              onSave={handleSave}
              onCancel={handleCancel}
              onAddAnother={!isEditing ? handleAddAnother : null}
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default ChildProfilePage;
