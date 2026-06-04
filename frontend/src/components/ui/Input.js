import React, { useState } from 'react';

const Input = ({
  id,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  label,
  helpText,
  required = false,
  disabled = false,
  className = '',
  showPasswordToggle = false,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const errorId = error ? `${id}-error` : undefined;
  const helpTextId = helpText ? `${id}-help` : undefined;
  const describedBy = [errorId, helpTextId, ariaDescribedby].filter(Boolean).join(' ') || undefined;

  // Determine the actual input type
  const inputType = type === 'password' && showPasswordToggle && showPassword ? 'text' : type;

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm md:text-base font-medium text-gray-700 dark:text-gray-300"
        >
          {label}{' '}
          {required && (
            <span className="text-danger" aria-hidden="true">
              *
            </span>
          )}
          {required && <span className="sr-only">(required)</span>}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          name={name}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-required={required}
          aria-disabled={disabled}
          aria-describedby={describedBy}
          aria-label={ariaLabel}
          className={`w-full px-3 py-3 md:py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary focus:border-transparent text-base md:text-sm min-h-[44px] ${
            type === 'password' && showPasswordToggle ? 'pr-12' : ''
          } ${
            error
              ? 'border-danger text-danger dark:text-red-400 placeholder-danger/50 dark:placeholder-red-400/50'
              : 'border-gray-300 dark:border-gray-600 text-text dark:text-dark-text'
          } ${
            disabled
              ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed'
              : 'bg-white dark:bg-gray-800'
          } ${className}`}
          {...props}
        />
        {type === 'password' && showPasswordToggle && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors duration-200"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} className="mt-1 text-sm text-danger dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      {helpText && !error && (
        <p id={helpTextId} className="mt-1 text-xs md:text-sm text-gray-500 dark:text-gray-400">
          {helpText}
        </p>
      )}
    </div>
  );
};

export default Input;
