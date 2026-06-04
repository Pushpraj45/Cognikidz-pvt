import React, { useState } from 'react';

/**
 * AvatarImage Component
 *
 * Handles avatar image loading with proper React state management
 * instead of direct DOM manipulation to prevent React DOM errors.
 */
const AvatarImage = ({
  imagePath,
  avatarId,
  className = 'w-16 h-16',
  fallbackType = 'emoji', // "emoji" or "star"
}) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  if (imageError) {
    // Fallback content based on type
    if (fallbackType === 'star') {
      return (
        <div
          className={`${className} rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="white"
            className="w-8 h-8"
          >
            <path
              fillRule="evenodd"
              d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      );
    } else {
      // Emoji fallback
      return (
        <div
          className={`flex items-center justify-center ${className} rounded-full bg-yellow-100 dark:bg-yellow-900/20 text-yellow-500 dark:text-yellow-300 border border-white/20 dark:border-gray-700/50 shadow-sm`}
        >
          <span style={{ fontSize: '24px' }}>👦</span>
        </div>
      );
    }
  }

  return (
    <div
      className={`${className} rounded-full overflow-hidden border border-white/20 dark:border-gray-700/50 shadow-sm`}
    >
      <img
        src={imagePath}
        alt={`${avatarId} avatar`}
        className="w-full h-full object-cover"
        onError={handleImageError}
      />
    </div>
  );
};

export default AvatarImage;
