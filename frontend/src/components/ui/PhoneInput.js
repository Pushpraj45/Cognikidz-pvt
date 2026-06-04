import React, { useState } from 'react';

const PhoneInput = ({
  id,
  name,
  value = '',
  onChange,
  onBlur,
  error,
  label,
  helpText,
  required = false,
  disabled = false,
  className = '',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby,
  ...props
}) => {
  // Common country codes
  const countryCodes = [
    { code: '+1', country: 'US', flag: '🇺🇸' },
    { code: '+1', country: 'CA', flag: '🇨🇦' },
    { code: '+91', country: 'IN', flag: '🇮🇳' },
    { code: '+44', country: 'GB', flag: '🇬🇧' },
    { code: '+61', country: 'AU', flag: '🇦🇺' },
    { code: '+33', country: 'FR', flag: '🇫🇷' },
    { code: '+49', country: 'DE', flag: '🇩🇪' },
    { code: '+81', country: 'JP', flag: '🇯🇵' },
    { code: '+86', country: 'CN', flag: '🇨🇳' },
    { code: '+55', country: 'BR', flag: '🇧🇷' },
    { code: '+7', country: 'RU', flag: '🇷🇺' },
    { code: '+34', country: 'ES', flag: '🇪🇸' },
    { code: '+39', country: 'IT', flag: '🇮🇹' },
    { code: '+31', country: 'NL', flag: '🇳🇱' },
    { code: '+46', country: 'SE', flag: '🇸🇪' },
    { code: '+47', country: 'NO', flag: '🇳🇴' },
    { code: '+45', country: 'DK', flag: '🇩🇰' },
    { code: '+41', country: 'CH', flag: '🇨🇭' },
    { code: '+43', country: 'AT', flag: '🇦🇹' },
    { code: '+32', country: 'BE', flag: '🇧🇪' },
  ];

  // Parse existing value to extract country code and number
  const parsePhoneValue = phoneValue => {
    if (!phoneValue) return { countryCode: '+91', number: '' }; // Default to India

    // Check if value starts with a country code
    for (const country of countryCodes) {
      if (phoneValue.startsWith(country.code)) {
        return {
          countryCode: country.code,
          number: phoneValue.substring(country.code.length).trim(),
        };
      }
    }

    // If no country code found, assume it's just a number and use default country code
    return { countryCode: '+91', number: phoneValue };
  };

  const { countryCode: initialCountryCode, number: initialNumber } = parsePhoneValue(value);
  const [selectedCountryCode, setSelectedCountryCode] = useState(initialCountryCode);
  const [phoneNumber, setPhoneNumber] = useState(initialNumber);

  const handleCountryCodeChange = e => {
    const newCountryCode = e.target.value;
    setSelectedCountryCode(newCountryCode);

    // Update the full phone value
    const fullValue = phoneNumber ? `${newCountryCode} ${phoneNumber}` : newCountryCode;
    if (onChange) {
      onChange({
        target: {
          name,
          value: fullValue,
        },
      });
    }
  };

  const handlePhoneNumberChange = e => {
    const newNumber = e.target.value;
    setPhoneNumber(newNumber);

    // Update the full phone value
    const fullValue = newNumber ? `${selectedCountryCode} ${newNumber}` : '';
    if (onChange) {
      onChange({
        target: {
          name,
          value: fullValue,
        },
      });
    }
  };

  const errorId = error ? `${id}-error` : undefined;
  const helpTextId = helpText ? `${id}-help` : undefined;
  const describedBy = [errorId, helpTextId, ariaDescribedby].filter(Boolean).join(' ') || undefined;

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm md:text-base font-medium text-gray-700 dark:text-gray-300"
        >
          {label}{' '}
          {required && (
            <span className="text-red-500" aria-hidden="true">
              *
            </span>
          )}
          {required && <span className="sr-only">(required)</span>}
        </label>
      )}

      <div className="flex">
        {/* Country Code Selector */}
        <select
          value={selectedCountryCode}
          onChange={handleCountryCodeChange}
          disabled={disabled}
          className={`px-3 py-3 md:py-2 border border-r-0 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary focus:border-transparent text-base md:text-sm min-h-[44px] ${
            error
              ? 'border-red-500 text-red-500 dark:text-red-400'
              : 'border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100'
          } ${
            disabled
              ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed'
              : 'bg-white dark:bg-gray-800'
          }`}
        >
          {countryCodes.map(country => (
            <option key={`${country.code}-${country.country}`} value={country.code}>
              {country.flag} {country.code}
            </option>
          ))}
        </select>

        {/* Phone Number Input */}
        <input
          id={id}
          name={name}
          type="tel"
          placeholder="Enter phone number"
          value={phoneNumber}
          onChange={handlePhoneNumberChange}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-required={required}
          aria-disabled={disabled}
          aria-describedby={describedBy}
          aria-label={ariaLabel}
          className={`flex-1 px-3 py-3 md:py-2 border rounded-r-md focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary focus:border-transparent text-base md:text-sm min-h-[44px] ${
            error
              ? 'border-red-500 text-red-500 dark:text-red-400 placeholder-red-500/50 dark:placeholder-red-400/50'
              : 'border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100'
          } ${
            disabled
              ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed'
              : 'bg-white dark:bg-gray-800'
          } ${className}`}
          {...props}
        />
      </div>

      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-500 dark:text-red-400" role="alert">
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

export default PhoneInput;
