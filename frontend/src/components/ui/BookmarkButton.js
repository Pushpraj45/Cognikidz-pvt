import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import BookmarkService from '../../services/BookmarkService';
import { useToast } from '../../contexts/ToastContext';

const BookmarkButton = ({
  resourceId,
  size = 'md',
  variant = 'default',
  showText = false,
  className = '',
  onBookmarkChange = null,
}) => {
  const { isLoggedIn } = useAuth();
  const { error: showError, success: showSuccess } = useToast();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Check if resource is bookmarked on mount
  useEffect(() => {
    const checkBookmarkStatus = async () => {
      if (!isLoggedIn || !resourceId) {
        setIsChecking(false);
        return;
      }

      try {
        // Get user's bookmarks and check if this resource is bookmarked
        const response = await BookmarkService.getBookmarks({
          limit: 1000, // Get all bookmarks to check status
        });

        const isBookmarked = response.bookmarks.some(bookmark => bookmark.resource === resourceId);

        setIsBookmarked(isBookmarked);
      } catch (error) {
        console.error('Error checking bookmark status:', error);
        // Don't show error for status check, just assume not bookmarked
      } finally {
        setIsChecking(false);
      }
    };

    checkBookmarkStatus();
  }, [isLoggedIn, resourceId]);

  const handleToggleBookmark = async e => {
    // Prevent event propagation to parent elements
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      showError('Please log in to bookmark resources');
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    try {
      const response = await BookmarkService.toggleBookmark(resourceId);
      const newBookmarkStatus = response.data.bookmarked;

      setIsBookmarked(newBookmarkStatus);

      if (newBookmarkStatus) {
        showSuccess('Resource added to bookmarks');
      } else {
        showSuccess('Resource removed from bookmarks');
      }

      // Call callback if provided
      if (onBookmarkChange) {
        onBookmarkChange(newBookmarkStatus);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      showError(error.friendlyMessage || 'Failed to update bookmark');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking initial status to prevent flickering
  if (isChecking) {
    return (
      <button
        className={`bookmark-button loading ${className} inline-flex items-center justify-center rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 ${size === 'sm' ? 'p-1.5' : size === 'lg' ? 'p-3' : 'p-2'} text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20`}
        disabled
        aria-label="Checking bookmark status"
      >
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
        {showText && <span className="ml-2">Checking...</span>}
      </button>
    );
  }

  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
  };

  const variantClasses = {
    default: isBookmarked
      ? 'text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
      : 'text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20',
    outline: isBookmarked
      ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
      : 'text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20',
    ghost: isBookmarked
      ? 'text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
      : 'text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20',
  };

  return (
    <button
      onClick={handleToggleBookmark}
      onMouseDown={e => e.stopPropagation()}
      disabled={isLoading}
      className={`
        bookmark-button
        inline-flex items-center justify-center
        rounded-lg transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900
        disabled:opacity-50 disabled:cursor-not-allowed
        hover:scale-105 active:scale-95
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      aria-label={isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
      ) : (
        <svg
          className={`${size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'} transition-transform duration-200 ${isBookmarked ? 'scale-110' : 'scale-100'}`}
          fill={isBookmarked ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </svg>
      )}

      {showText && (
        <span className="ml-2 text-sm font-medium">
          {isLoading ? 'Updating...' : isBookmarked ? 'Bookmarked' : 'Bookmark'}
        </span>
      )}
    </button>
  );
};

export default BookmarkButton;
