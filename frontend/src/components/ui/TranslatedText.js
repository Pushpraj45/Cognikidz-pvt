import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Simple component for translating text using i18next
 * @param {string} children - Text or translation key
 * @param {string} k - Explicit translation key (preferred, backward compatibility)
 * @param {string} i18nKey - Translation key (new format)
 * @param {string} ns - Namespace for translation
 * @param {Object} props - Additional props to pass to wrapper element
 * @param {string} as - HTML element to render as (default: span)
 * @param {object} values - interpolation values
 */
const TranslatedText = ({ children, as: Component = 'span', k, i18nKey, ns, values, ...props }) => {
  const { t } = useTranslation(ns);
  let content = children;

  // Handle translation key - prioritize i18nKey over k for new usage
  if (i18nKey) {
    content = t(i18nKey, values);
  } else if (k) {
    content = t(k, values);
  } else if (typeof children === 'string') {
    content = t(children, values);
  }

  return <Component {...props}>{content}</Component>;
};

/**
 * Hook version for more complex use cases
 * @param {string} text - Text to translate
 * @returns {Object} - {text, isLoading}
 */
export const useSimpleTranslation = (text, values) => {
  const { t } = useTranslation();
  return { text: t(text, values), isLoading: false };
};

/**
 * Higher-order component to make any component translatable
 * @param {React.Component} WrappedComponent
 * @returns {React.Component}
 */
export const withTranslation = WrappedComponent => {
  return function TranslatableComponent(props) {
    return <WrappedComponent {...props} TranslatedText={TranslatedText} />;
  };
};

export default TranslatedText;
