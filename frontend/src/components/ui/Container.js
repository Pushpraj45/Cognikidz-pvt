import React from 'react';

/**
 * A responsive container component with appropriate padding at different screen sizes
 *
 * @param {Object} props
 * @param {ReactNode} props.children - Content to display in the container
 * @param {string} props.className - Additional classes for the container
 * @param {boolean} props.fluid - Whether the container should be full-width (default: false)
 * @param {string} props.as - HTML element to render as (default: 'div')
 */
const Container = ({ children, className = '', fluid = false, as: Component = 'div' }) => {
  const containerClasses = fluid
    ? 'w-full px-4 sm:px-6 md:px-8'
    : 'w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12';

  return <Component className={`${containerClasses} ${className}`}>{children}</Component>;
};

export default Container;
