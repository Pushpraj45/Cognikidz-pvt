import React from 'react';
import { BellIcon } from '@heroicons/react/24/outline';

const NotificationBadge = ({ count = 0, size = 'sm', className = '' }) => {
  if (count === 0) return null;

  const sizeClasses = {
    xs: 'h-4 w-4 text-xs',
    sm: 'h-5 w-5 text-xs',
    md: 'h-6 w-6 text-sm',
    lg: 'h-8 w-8 text-base',
  };

  const badgeClasses = {
    xs: 'min-w-[16px] h-4 text-xs px-1',
    sm: 'min-w-[20px] h-5 text-xs px-1.5',
    md: 'min-w-[24px] h-6 text-sm px-2',
    lg: 'min-w-[32px] h-8 text-base px-2',
  };

  return (
    <div className={`relative inline-flex ${className}`}>
      <BellIcon className={`${sizeClasses[size]} text-gray-600 dark:text-gray-300`} />
      <span
        className={`absolute -top-2 -right-2 ${badgeClasses[size]} bg-red-500 text-white rounded-full flex items-center justify-center font-bold leading-none border-2 border-white dark:border-gray-800 shadow-sm`}
        style={{
          fontSize:
            size === 'xs' ? '10px' : size === 'sm' ? '11px' : size === 'md' ? '12px' : '14px',
        }}
      >
        {count > 99 ? '99+' : count}
      </span>
    </div>
  );
};

export default NotificationBadge;
