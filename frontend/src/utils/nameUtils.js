/**
 * Utility functions for handling child names consistently across the application
 */

import React from 'react';
import AvatarImage from '../components/ui/AvatarImage';

/**
 * Cleans and formats a child's name, removing any N/A, null, or undefined values
 * @param {Object} child - Child object with firstName, lastName, and/or name properties
 * @param {string} fallback - Fallback text to use if no valid name is found
 * @returns {string} Clean, formatted name
 */
export const getCleanChildName = (child, fallback = 'Child Profile') => {
  if (!child) return fallback;

  const firstName = child.firstName?.toString().trim() || '';
  const lastName = child.lastName?.toString().trim() || '';

  // Remove invalid values including "undefined", "null", "N/A"
  const invalidValues = ['N/A', 'NA', 'null', 'undefined', 'n/a', 'na'];

  const cleanFirstName =
    firstName && !invalidValues.includes(firstName.toLowerCase()) ? firstName : '';
  const cleanLastName = lastName && !invalidValues.includes(lastName.toLowerCase()) ? lastName : '';

  // Construct display name
  if (cleanFirstName && cleanLastName) {
    return `${cleanFirstName} ${cleanLastName}`;
  } else if (cleanFirstName) {
    return cleanFirstName;
  } else if (cleanLastName) {
    return cleanLastName;
  }

  // Fallback: try using the 'name' field if available
  if (
    child.name &&
    child.name.toString().trim() &&
    !invalidValues.includes(child.name.toString().trim().toLowerCase())
  ) {
    return child.name.toString().trim();
  }

  return fallback;
};

/**
 * Splits a full name into firstName and lastName components
 * @param {string} fullName - Full name to split
 * @returns {Object} Object with firstName and lastName properties
 */
export const splitFullName = fullName => {
  if (!fullName || typeof fullName !== 'string') {
    return { firstName: '', lastName: '' };
  }

  const trimmedName = fullName.trim();
  if (!trimmedName) {
    return { firstName: '', lastName: '' };
  }

  if (trimmedName.includes(' ')) {
    const parts = trimmedName.split(' ').filter(part => part.trim().length > 0);
    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' '),
    };
  }

  return {
    firstName: trimmedName,
    lastName: '',
  };
};

/**
 * Validates that a name doesn't contain invalid values
 * @param {string} name - Name to validate
 * @returns {boolean} True if name is valid
 */
export const isValidName = name => {
  if (!name || typeof name !== 'string') {
    return false;
  }

  const trimmedName = name.trim();
  const invalidValues = ['N/A', 'NA', 'null', 'undefined', 'n/a'];

  return trimmedName.length > 0 && !invalidValues.includes(trimmedName.toLowerCase());
};

/**
 * Gets child initials for avatar display
 * @param {Object} child - Child object
 * @returns {string} Initials (e.g., "JD" for John Doe)
 */
export const getChildInitials = child => {
  const cleanName = getCleanChildName(child, '');

  if (!cleanName) {
    return 'CH'; // Child default
  }

  const parts = cleanName.split(' ').filter(part => part.trim().length > 0);

  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  } else if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }

  return 'CH';
};

/**
 * Calculates child age from birth date
 * @param {string|Date} dateOfBirth - Birth date as string or Date object
 * @returns {number} Age in years
 */
export const calculateChildAge = dateOfBirth => {
  if (!dateOfBirth) return 0;

  const today = new Date();
  const birth = new Date(dateOfBirth);

  if (isNaN(birth.getTime())) return 0;

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
};

/**
 * Formats child age with proper fallbacks
 * @param {Object} child - Child object with dateOfBirth, dob, or age property
 * @returns {string} Formatted age string
 */
export const getChildAge = child => {
  if (!child) return 'Unknown';

  // Try different date field names
  const dateOfBirth = child.dateOfBirth || child.dob || child.birthdate;

  if (dateOfBirth) {
    const age = calculateChildAge(dateOfBirth);
    return age > 0 ? `${age}` : 'Unknown';
  }

  // Fallback to age field if available
  if (child.age && !isNaN(child.age)) {
    return `${child.age}`;
  }

  return 'Unknown';
};

/**
 * Returns a React element for the child's avatar/photo, using the same logic as ChildDetailsPage.js
 * @param {Object} child - Child object
 * @param {string} className - CSS classes for the avatar container
 * @returns {JSX.Element}
 */
export const getChildAvatarElement = (child, className = 'w-12 h-12') => {
  if (!child) return null;
  const { avatar, photo, gender } = child;
  const childName = getCleanChildName(child);

  // Uploaded image (URL or file path)
  if (avatar && (avatar.startsWith('http') || avatar.startsWith('/'))) {
    return (
      <div
        className={`${className} rounded-full overflow-hidden border border-white/20 dark:border-gray-700/50 shadow-sm`}
      >
        <img
          src={avatar}
          alt={`${childName}'s profile`}
          className="w-full h-full object-cover"
          onError={e => {
            e.target.style.display = 'none';
            e.target.parentNode.innerHTML = `<div class='w-full h-full bg-gradient-to-br from-primary to-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold'>${getChildInitials(child)}</div>`;
          }}
        />
      </div>
    );
  }
  // Legacy photo field
  if (photo && (photo.startsWith('http') || photo.startsWith('/'))) {
    return (
      <div
        className={`${className} rounded-full overflow-hidden border border-white/20 dark:border-gray-700/50 shadow-sm`}
      >
        <img
          src={photo}
          alt={`${childName}'s profile`}
          className="w-full h-full object-cover"
          onError={e => {
            e.target.style.display = 'none';
            e.target.parentNode.innerHTML = `<div class='w-full h-full bg-gradient-to-br from-primary to-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold'>${getChildInitials(child)}</div>`;
          }}
        />
      </div>
    );
  }
  // Predefined avatar (e.g., boy1, girl2)
  if (avatar && avatar !== 'default' && !avatar.startsWith('http') && !avatar.startsWith('/')) {
    const imagePath = `/child-avatar/${avatar}.jpg`;
    return (
      <AvatarImage
        imagePath={imagePath}
        avatarId={avatar}
        className={className}
        fallbackType="emoji"
      />
    );
  }
  // Default fallback: initials or icon
  return (
    <div
      className={`flex items-center justify-center ${className} rounded-full ${
        gender === 'female'
          ? 'bg-secondary/10 text-secondary dark:bg-secondary/20 dark:text-secondary-300'
          : 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-300'
      } border border-white/20 dark:border-gray-700/50 shadow-sm`}
    >
      <span className="text-xl font-bold">{getChildInitials(child)}</span>
    </div>
  );
};
