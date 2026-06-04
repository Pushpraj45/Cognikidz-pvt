import React from 'react';
import { useAutoTranslateBulk } from '../../hooks/useTranslation';

/**
 * Component for translating lists of text items efficiently using bulk translation
 * @param {Array} texts - Array of text strings to translate
 * @param {Function} renderItem - Function to render each translated item (item, index, isLoading) => JSX
 * @param {Function} renderLoading - Optional loading state renderer
 * @param {Object} containerProps - Props for the container element
 * @param {string} as - Container HTML element (default: div)
 */
const TranslatedList = ({
  texts = [],
  renderItem,
  renderLoading,
  as: Container = 'div',
  ...containerProps
}) => {
  const { texts: translatedTexts, isLoading } = { texts, isLoading: false };

  if (isLoading && renderLoading) {
    return <Container {...containerProps}>{renderLoading()}</Container>;
  }

  return (
    <Container {...containerProps}>
      {translatedTexts.map((text, index) =>
        renderItem ? renderItem(text, index, isLoading) : <span key={index}>{text}</span>
      )}
    </Container>
  );
};

/**
 * Simple navigation list translator
 * @param {Array} items - Array of {text, href?, onClick?, ...props} objects
 * @param {string} as - HTML element for each item (default: a)
 * @param {Object} itemProps - Props to apply to each item
 * @param {Object} containerProps - Props for the container
 */
export const TranslatedNavList = ({
  items = [],
  as: ItemComponent = 'a',
  itemProps = {},
  containerProps = {},
  ...props
}) => {
  const texts = items.map(item => item.text || '');
  const { texts: translatedTexts, isLoading } = { texts, isLoading: false };

  return (
    <div {...containerProps}>
      {items.map((item, index) => {
        const { text, ...itemAttributes } = item;
        return (
          <ItemComponent key={index} {...itemAttributes} {...itemProps} {...props}>
            {translatedTexts[index] || text}
          </ItemComponent>
        );
      })}
    </div>
  );
};

/**
 * Button list translator
 * @param {Array} buttons - Array of {text, onClick, ...props} objects
 * @param {Object} containerProps - Props for the container
 * @param {Object} buttonProps - Default props for all buttons
 */
export const TranslatedButtonList = ({
  buttons = [],
  containerProps = {},
  buttonProps = {},
  ...props
}) => {
  const texts = buttons.map(button => button.text || '');
  const { texts: translatedTexts, isLoading } = useAutoTranslateBulk(texts);

  return (
    <div {...containerProps}>
      {buttons.map((button, index) => {
        const { text, ...buttonAttributes } = button;
        return (
          <button
            key={index}
            {...buttonAttributes}
            {...buttonProps}
            {...props}
            disabled={isLoading || buttonAttributes.disabled}
          >
            {translatedTexts[index] || text}
          </button>
        );
      })}
    </div>
  );
};

export default TranslatedList;
