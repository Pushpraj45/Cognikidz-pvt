import React from 'react';
import TranslatedText from './TranslatedText';

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  disabled = false,
  onClick,
  className = '',
  loadingText = 'Processing...',
  as: Component = 'button',
  'aria-label': ariaLabel,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

  const variantClasses = {
    gradient:
      'group inline-flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-2xl shadow-xl shadow-indigo-500/25 hover:shadow-2xl hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-105 hover:-translate-y-1',
    primary:
      'bg-primary dark:bg-dark-primary text-white hover:bg-primary/90 dark:hover:bg-dark-primary/90 focus-visible:ring-primary dark:focus-visible:ring-dark-primary',
    secondary:
      'bg-secondary dark:bg-dark-secondary text-white hover:bg-secondary/90 dark:hover:bg-dark-secondary/90 focus-visible:ring-secondary dark:focus-visible:ring-dark-secondary',
    outline:
      'border border-gray-300 dark:border-gray-600 bg-transparent text-text dark:text-dark-text hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-text dark:hover:text-dark-text',
    ghost:
      'text-text dark:text-dark-text hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-text dark:hover:text-dark-text',
    link: 'text-primary dark:text-dark-primary underline-offset-4 hover:underline',
    danger: 'bg-danger text-white hover:bg-danger/90 focus-visible:ring-danger',
  };

  const sizeClasses = {
    sm: 'h-10 sm:h-9 px-4 sm:px-3 text-sm sm:text-xs',
    md: 'h-12 sm:h-10 py-3 sm:py-2 px-5 sm:px-4 text-base sm:text-sm',
    lg: 'h-14 sm:h-11 py-3 sm:py-2 px-8 text-base',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`;

  const touchClass = 'min-h-[44px] min-w-[44px]';

  const buttonProps = {
    type,
    className: `${buttonClasses} ${touchClass}`,
    disabled: disabled || isLoading,
    onClick,
    'aria-disabled': disabled || isLoading,
    'aria-busy': isLoading,
    ...(ariaLabel && { 'aria-label': ariaLabel }),
    ...props,
  };

  return Component === 'button' ? (
    <button {...buttonProps}>
      {isLoading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <TranslatedText>{loadingText}</TranslatedText>
        </>
      ) : (
        children
      )}
    </button>
  ) : (
    <Component className={`${buttonClasses} ${touchClass}`} {...props}>
      {children}
    </Component>
  );
};

export default Button;
