import React from 'react';
import Container from './Container';

/**
 * A responsive form component with mobile-friendly styling
 *
 * @param {Object} props
 * @param {ReactNode} props.children - Form fields and content
 * @param {Function} props.onSubmit - Form submission handler
 * @param {string} props.className - Additional classes
 * @param {string} props.title - Form title (optional)
 * @param {string} props.description - Form description (optional)
 * @param {boolean} props.narrow - Whether to use a narrower layout (default: false)
 */
const ResponsiveForm = ({
  children,
  onSubmit,
  className = '',
  title,
  description,
  narrow = false,
}) => {
  return (
    <Container>
      <div className={`w-full ${narrow ? 'max-w-md' : 'max-w-2xl'} mx-auto`}>
        <form
          onSubmit={onSubmit}
          className={`bg-white dark:bg-gray-800 shadow-md rounded-lg p-5 sm:p-8 ${className}`}
          noValidate
        >
          {title && (
            <h2 className="text-xl sm:text-2xl font-bold mb-2 text-gray-800 dark:text-white">
              {title}
            </h2>
          )}

          {description && (
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-6">
              {description}
            </p>
          )}

          <div className="space-y-5">{children}</div>
        </form>
      </div>
    </Container>
  );
};

export default ResponsiveForm;
