import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../ui/Button';
import { getCleanChildName, getChildAge } from '../../utils/nameUtils';
import AvatarImage from '../ui/AvatarImage';

const ChildProfileCard = ({
  child = {
    id: '1',
    name: 'Alex Smith',
    age: 7,
    gender: 'male',
    birthdate: '2016-05-15',
    lastAssessment: '2023-02-10',
    assessmentStatus: 'completed', // completed, in-progress, not-started
    assessmentType: 'adhd',
    hasResults: true,
    avatar: 'default', // Newly added property
    photo: null, // Newly added property
  },
  onEdit,
  onDelete,
}) => {
  const getStatusBadge = () => {
    switch (child.assessmentStatus) {
      case 'completed':
        return (
          <span className="bg-success/10 text-success dark:bg-success/20 dark:text-success text-xs px-2.5 py-1 rounded-full font-normal">
            Assessment Complete
          </span>
        );
      case 'in-progress':
        return (
          <span className="bg-warning/10 text-warning dark:bg-warning/20 dark:text-warning text-xs px-2.5 py-1 rounded-full font-normal">
            In Progress
          </span>
        );
      case 'not-started':
      default:
        return (
          <span className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs px-2.5 py-1 rounded-full font-normal">
            No Assessments
          </span>
        );
    }
  };

  const getAssessmentTypeLabel = () => {
    switch (child.assessmentType) {
      case 'adhd':
        return 'ADHD Screening';
      case 'asd':
        return 'Autism Screening';
      case 'dyslexia':
        return 'Dyslexia Screening';
      default:
        return '';
    }
  };

  const getAvatarPlaceholder = () => {
    // Check if child has an uploaded image (S3 URL or file path)
    if (child.avatar && (child.avatar.startsWith('http') || child.avatar.startsWith('/'))) {
      return (
        <div className="w-16 h-16 rounded-full overflow-hidden border border-white/20 dark:border-gray-700/50 shadow-sm">
          <img
            src={child.avatar}
            alt={`${getDisplayName()}'s profile`}
            className="w-full h-full object-cover"
            onError={e => {
              // Fallback to default avatar if image fails to load
              e.target.style.display = 'none';
              e.target.parentNode.innerHTML = `
                <div class="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-8 h-8">
                    <path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clip-rule="evenodd" />
                  </svg>
                </div>
              `;
            }}
          />
        </div>
      );
    }

    // Legacy check for child.photo field (in case some profiles still use this)
    if (child.photo && (child.photo.startsWith('http') || child.photo.startsWith('/'))) {
      return (
        <div className="w-16 h-16 rounded-full overflow-hidden border border-white/20 dark:border-gray-700/50 shadow-sm">
          <img
            src={child.photo}
            alt={`${getDisplayName()}'s profile`}
            className="w-full h-full object-cover"
            onError={e => {
              // Fallback to default avatar if image fails to load
              e.target.style.display = 'none';
              e.target.parentNode.innerHTML = `
                <div class="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-8 h-8">
                    <path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clip-rule="evenodd" />
                  </svg>
                </div>
              `;
            }}
          />
        </div>
      );
    }

    // If child has selected a predefined avatar
    if (
      child.avatar &&
      child.avatar !== 'default' &&
      !child.avatar.startsWith('http') &&
      !child.avatar.startsWith('/')
    ) {
      const getAvatarImage = avatarId => {
        // Use actual JPG images for child avatars
        const imagePath = `/child-avatar/${avatarId}.jpg`;

        return (
          <AvatarImage
            imagePath={imagePath}
            avatarId={avatarId}
            className="w-16 h-16"
            fallbackType="emoji"
          />
        );
      };

      return getAvatarImage(child.avatar);
    }

    // Default avatar based on gender
    return (
      <div
        className={`flex items-center justify-center w-16 h-16 rounded-full ${
          child.gender === 'female'
            ? 'bg-secondary/10 text-secondary dark:bg-secondary/20 dark:text-secondary-300'
            : 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-300'
        } border border-white/20 dark:border-gray-700/50 shadow-sm`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-8 h-8"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    );
  };

  // Improved name display function to handle firstName/lastName properly
  const getDisplayName = () => {
    return getCleanChildName(child, 'Child');
  };

  // Use the centralized age calculation function
  const getAgeDisplay = () => {
    const age = getChildAge(child);
    if (age === 'Unknown') return 'Unknown age';
    return `${age} year${age !== '1' ? 's' : ''} old`;
  };

  const formatDate = dateString => {
    if (!dateString) return 'Unknown date';

    try {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      const date = new Date(dateString);

      if (isNaN(date.getTime())) {
        return 'Unknown date';
      }

      return date.toLocaleDateString('en-US', options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown date';
    }
  };

  // Animation variants
  const buttonVariants = {
    hover: { scale: 1.05, transition: { duration: 0.2 } },
    tap: { scale: 0.95, transition: { duration: 0.2 } },
  };

  // Edit button handler
  const handleEdit = () => {
    // Pass either id or _id, whichever is available
    onEdit(child.id || child._id);
  };

  // Delete button handler
  const handleDelete = () => {
    // Pass either id or _id, whichever is available
    onDelete(child.id || child._id);
  };

  // Get child ID for routing
  const getChildId = () => {
    return child.id || child._id || 'unknown';
  };

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-lg shadow-sm border border-white/20 dark:border-gray-700/50 overflow-hidden font-sans">
      <div className="px-6 py-5 border-b border-gray-200/80 dark:border-gray-700/80">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            {getAvatarPlaceholder()}
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {getDisplayName()}
              </h3>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                <span>{getAgeDisplay()}</span>
                {child.gender && (
                  <>
                    <span className="mx-2">•</span>
                    <span className="capitalize">{child.gender}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex">
            <motion.button
              onClick={handleEdit}
              className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-300 p-1.5 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-dark-primary/50"
              aria-label={`Edit ${getDisplayName()}'s profile`}
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
                aria-hidden="true"
              >
                <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32l8.4-8.4z" />
                <path d="M5.25 5.25a3 3 0 00-3 3v10.5a3 3 0 003 3h10.5a3 3 0 003-3V13.5a.75.75 0 00-1.5 0v5.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V8.25a1.5 1.5 0 011.5-1.5h5.25a.75.75 0 000-1.5H5.25z" />
              </svg>
            </motion.button>
            <motion.button
              onClick={handleDelete}
              className="text-gray-400 hover:text-danger dark:text-gray-500 dark:hover:text-danger p-1.5 rounded-full ml-1 focus:outline-none focus:ring-2 focus:ring-danger/50"
              aria-label={`Delete ${getDisplayName()}'s profile`}
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z"
                  clipRule="evenodd"
                />
              </svg>
            </motion.button>
          </div>
        </div>
      </div>

      <div className="px-6 py-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <span className="text-sm font-normal text-gray-700 dark:text-gray-300 mr-3">
              Status:
            </span>
            {getStatusBadge()}
          </div>
          {child.lastAssessment && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Last updated: {formatDate(child.lastAssessment)}
            </span>
          )}
        </div>

        {child.assessmentStatus === 'completed' && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Last Assessment:
            </h4>
            <div className="bg-gray-50/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-md p-3 border border-gray-100/80 dark:border-gray-700/50">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {getAssessmentTypeLabel()}
                </span>
                <motion.span whileHover={{ x: 3, transition: { duration: 0.2 } }}>
                  <Link
                    to={`/reports?childId=${getChildId()}`}
                    className="text-sm text-primary dark:text-dark-primary hover:underline inline-flex items-center"
                  >
                    View Results
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-4 h-4 ml-1"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Link>
                </motion.span>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 mt-5">
          <motion.div className="flex-1" whileHover="hover" whileTap="tap">
            <Button
              as={Link}
              to={`/assessments?childId=${getChildId()}`}
              variant="primary"
              fullWidth
              className="transition-all duration-200 group px-6 py-4 text-base font-semibold"
              variants={buttonVariants}
            >
              <span className="inline-flex items-center">
                {child.assessmentStatus === 'in-progress' ? (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5 mr-2 animate-pulse"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5.5a.75.75 0 001.5 0V5z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Continue Assessment
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform duration-200"
                      aria-hidden="true"
                    >
                      <path d="M3.288 4.819A1.5 1.5 0 001 6.095v7.81a1.5 1.5 0 002.288 1.277l6.323-3.905c.155-.096.285-.213.389-.344v2.973a1.5 1.5 0 002.288 1.276l6.323-3.905a1.5 1.5 0 000-2.553L12.288 4.82A1.5 1.5 0 0010 6.095v2.973a1.506 1.506 0 00-.389-.344L3.288 4.82z" />
                    </svg>
                    Start Assessment
                  </>
                )}
              </span>
            </Button>
          </motion.div>

          <motion.div className="flex-1" whileHover="hover" whileTap="tap">
            <Button
              as={Link}
              to={`/dashboard?tab=history&childId=${getChildId()}`}
              variant="outline"
              fullWidth
              variants={buttonVariants}
              className="transition-all duration-200 px-6 py-4 text-base font-semibold"
            >
              <span className="inline-flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5 mr-2"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z"
                    clipRule="evenodd"
                  />
                </svg>
                View History
              </span>
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ChildProfileCard;
