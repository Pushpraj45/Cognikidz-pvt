import React from 'react';

/**
 * A responsive grid component that adapts to different screen sizes
 *
 * @param {Object} props
 * @param {ReactNode[]} props.children - Grid items to display
 * @param {number} props.cols - Number of columns on large screens (default: 3)
 * @param {string} props.gap - Gap between grid items (default: 'gap-6')
 * @param {string} props.mobileGap - Gap on mobile (default: 'gap-4')
 * @param {string} props.className - Additional classes for the grid
 */
const ResponsiveGrid = ({
  children,
  cols = 3,
  gap = 'gap-6',
  mobileGap = 'gap-4',
  className = '',
}) => {
  // Handle different column configurations based on the cols prop
  let gridColsClasses = '';

  switch (cols) {
    case 1:
      gridColsClasses = 'grid-cols-1';
      break;
    case 2:
      gridColsClasses = 'grid-cols-1 sm:grid-cols-2';
      break;
    case 3:
      gridColsClasses = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
      break;
    case 4:
      gridColsClasses = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
      break;
    case 5:
      gridColsClasses = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5';
      break;
    case 6:
      gridColsClasses = 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6';
      break;
    default:
      gridColsClasses = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
  }

  return (
    <div className={`grid ${gridColsClasses} ${mobileGap} sm:${gap} ${className}`}>{children}</div>
  );
};

export default ResponsiveGrid;
