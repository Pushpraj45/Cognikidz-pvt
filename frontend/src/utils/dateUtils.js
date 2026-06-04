// Date utility functions for child profiles and assessments

import { isValid, parseISO, format } from 'date-fns';

export const calculateAge = birthDate => {
  if (!birthDate) return null;

  const birth = new Date(birthDate);
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
};

export const formatDate = (date, format = 'short') => {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return '';

  const options = {
    short: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric' },
    full: {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
  };

  return dateObj.toLocaleDateString('en-US', options[format] || options.short);
};

export const getAgeInMonths = birthDate => {
  if (!birthDate) return null;

  const birth = new Date(birthDate);
  const today = new Date();

  const years = today.getFullYear() - birth.getFullYear();
  const months = today.getMonth() - birth.getMonth();

  return years * 12 + months;
};

export const isValidDate = date => {
  const dateObj = new Date(date);
  return !isNaN(dateObj.getTime());
};

export const formatDateForInput = date => {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return '';

  return dateObj.toISOString().split('T')[0];
};

export const getRelativeTime = date => {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInMs = now - dateObj;
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;

  return `${Math.floor(diffInDays / 365)} years ago`;
};

/**
 * Safely format a date with fallback to handle various input formats
 * @param {string|Date} dateInput - Date string or Date object
 * @param {string} formatString - Optional format string (default: long format)
 * @returns {string} Formatted date string or 'Invalid Date'
 */
export const formatDateSafely = (dateInput, formatString = 'MMMM d, yyyy') => {
  if (!dateInput) return 'Invalid Date';

  try {
    let date;

    // Handle different input types
    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === 'string') {
      // Try parsing ISO string first
      date = parseISO(dateInput);

      // If that fails, try creating a new Date
      if (!isValid(date)) {
        date = new Date(dateInput);
      }
    } else {
      // Try converting to Date
      date = new Date(dateInput);
    }

    // Check if date is valid
    if (!isValid(date)) {
      console.warn('Invalid date input:', dateInput);
      return 'Invalid Date';
    }

    return format(date, formatString);
  } catch (error) {
    console.error('Date formatting error:', error, 'Input:', dateInput);
    return 'Invalid Date';
  }
};

/**
 * Get a date from various possible field names (handles backend inconsistencies)
 * @param {Object} obj - Object that might contain date fields
 * @param {Array} fieldNames - Array of possible field names to check
 * @returns {string|Date|null} First valid date found
 */
export const getDateFromObject = (
  obj,
  fieldNames = ['created_at', 'createdAt', 'timestamp', 'date']
) => {
  if (!obj) return null;

  for (const fieldName of fieldNames) {
    if (obj[fieldName]) {
      return obj[fieldName];
    }
  }

  return null;
};

/**
 * Format article date with multiple fallback attempts
 * @param {Object} article - Article object
 * @returns {string} Formatted date string
 */
export const formatArticleDate = article => {
  const dateValue = getDateFromObject(article, [
    'created_at',
    'createdAt',
    'timestamp',
    'publishedAt',
    'submittedAt',
  ]);
  return formatDateSafely(dateValue);
};

/**
 * Format comment date with multiple fallback attempts
 * @param {Object} comment - Comment object
 * @returns {string} Formatted date string
 */
export const formatCommentDate = comment => {
  const dateValue = getDateFromObject(comment, ['created_at', 'createdAt', 'timestamp']);
  return formatDateSafely(dateValue);
};

/**
 * Format date for display in lists (shorter format)
 * @param {string|Date} dateInput - Date input
 * @returns {string} Short formatted date
 */
export const formatDateShort = dateInput => {
  return formatDateSafely(dateInput, 'MMM d, yyyy');
};

/**
 * Format relative time (e.g., "2 hours ago")
 * @param {string|Date} dateInput - Date input
 * @returns {string} Relative time string
 */
export const formatRelativeTime = dateInput => {
  if (!dateInput) return 'Unknown time';

  try {
    let date;
    if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      date = new Date(dateInput);
    }

    if (!isValid(date)) return 'Unknown time';

    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;

    // For older dates, return formatted date
    return formatDateShort(date);
  } catch (error) {
    console.error('Relative time formatting error:', error);
    return 'Unknown time';
  }
};
