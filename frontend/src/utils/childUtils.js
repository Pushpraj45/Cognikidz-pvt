/**
 * Utility functions for handling child-related data
 */

/**
 * Formats a child name by cleaning up any "N/A" text and trimming whitespace
 * @param {string} childName - The child's name to format
 * @returns {string} - The formatted child name or 'Child Assessment' as fallback
 */
export const formatChildName = childName => {
  if (!childName || childName.trim() === '') return 'Child Assessment';
  // Remove any "N/A" text and clean up the name
  return childName.replace(/\s*N\/A\s*/gi, '').trim() || 'Child Assessment';
};

/**
 * Gets the age of a child from their birth date
 * @param {Object} child - Child object with birthDate or age property
 * @returns {number} - The child's age in years
 */
export const getChildAge = child => {
  if (!child) return 0;

  // If age is already provided
  if (child.age) return child.age;

  // If birthDate is provided, calculate age
  if (child.birthDate) {
    const birthDate = new Date(child.birthDate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  return 0;
};

/**
 * Gets a clean child name for display purposes
 * @param {Object} child - Child object
 * @returns {string} - Clean child name for display
 */
export const getCleanChildName = child => {
  if (!child) return 'Child Assessment';

  if (child.name) return formatChildName(child.name);
  if (child.firstName && child.lastName) {
    return formatChildName(`${child.firstName} ${child.lastName}`);
  }
  if (child.firstName) return formatChildName(child.firstName);
  if (child.first_name) return formatChildName(child.first_name);

  return 'Child Assessment';
};
