import React, { useEffect, useCallback } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { debounce } from '../../utils/debounce';

const GlobalTranslationWrapper = ({ children }) => {
  const { language: currentLanguage, translateDynamicBulk } = useTranslation();

  // Enhanced text detection function
  const extractTextElements = useCallback(() => {
    const elements = [];
    const processedElements = new Set();

    // Get all text nodes and their parent elements
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: node => {
        const text = node.textContent.trim();
        // Filter out non-translatable content
        if (text.length < 2) return NodeFilter.FILTER_REJECT;
        if (/^[\d\s\-\.\(\)\+]*$/.test(text)) return NodeFilter.FILTER_REJECT; // Numbers, phones
        if (/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(text)) return NodeFilter.FILTER_REJECT; // Emails
        if (/^https?:\/\//.test(text)) return NodeFilter.FILTER_REJECT; // URLs
        if (text.match(/^[^\w\s]*$/)) return NodeFilter.FILTER_REJECT; // Only symbols
        if (text.match(/^\$[\d,\.]+$/)) return NodeFilter.FILTER_REJECT; // Prices

        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;

        // Skip certain elements and attributes
        const skipTags = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE'];
        const skipClasses = ['translated-text', 'no-translate', 'untranslatable'];
        const skipAttributes = ['data-no-translate', 'translate-no'];

        if (skipTags.includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
        if (skipClasses.some(cls => parent.classList.contains(cls)))
          return NodeFilter.FILTER_REJECT;
        if (skipAttributes.some(attr => parent.hasAttribute(attr))) return NodeFilter.FILTER_REJECT;
        if (parent.closest('code, pre, script, style')) return NodeFilter.FILTER_REJECT;

        return NodeFilter.FILTER_ACCEPT;
      },
    });

    let node;
    while ((node = walker.nextNode())) {
      const parent = node.parentElement;
      const elementId = `${parent.tagName}_${Array.from(parent.parentNode.children).indexOf(parent)}_${node.textContent.substring(0, 20)}`;

      if (!processedElements.has(elementId)) {
        elements.push({
          text: node.textContent.trim(),
          element: parent,
          node: node,
          id: elementId,
        });
        processedElements.add(elementId);
      }
    }

    // Also check for common form elements
    const formElements = document.querySelectorAll(
      'input[placeholder], textarea[placeholder], label, button:not([data-no-translate])'
    );
    formElements.forEach((element, index) => {
      const elementId = `form_${element.tagName}_${index}`;
      if (!processedElements.has(elementId)) {
        if (element.placeholder && element.placeholder.trim()) {
          elements.push({
            text: element.placeholder.trim(),
            element: element,
            isPlaceholder: true,
            id: elementId + '_placeholder',
          });
        }
        if (element.textContent && element.textContent.trim() && element.tagName !== 'INPUT') {
          elements.push({
            text: element.textContent.trim(),
            element: element,
            node: element.firstChild,
            id: elementId + '_text',
          });
        }
      }
    });

    // Check for alt texts and titles
    const mediaElements = document.querySelectorAll('img[alt], [title]:not([title=""])');
    mediaElements.forEach((element, index) => {
      const elementId = `media_${element.tagName}_${index}`;
      if (element.alt && element.alt.trim()) {
        elements.push({
          text: element.alt.trim(),
          element: element,
          isAlt: true,
          id: elementId + '_alt',
        });
      }
      if (element.title && element.title.trim()) {
        elements.push({
          text: element.title.trim(),
          element: element,
          isTitle: true,
          id: elementId + '_title',
        });
      }
    });

    return elements.filter(item => item.text.length >= 2);
  }, []);

  // Enhanced translation application function
  const applyTranslations = useCallback(
    async elements => {
      if (elements.length === 0) return;

      try {
        const textsToTranslate = elements.map(item => item.text);
        const translations = await translateDynamicBulk(textsToTranslate, {
          targetLanguage: currentLanguage,
          sourceLanguage: 'en',
        });

        if (translations && translations.length === elements.length) {
          elements.forEach((item, index) => {
            const translation = translations[index];
            if (translation && translation !== item.text) {
              try {
                if (item.isPlaceholder) {
                  item.element.placeholder = translation;
                } else if (item.isAlt) {
                  item.element.alt = translation;
                } else if (item.isTitle) {
                  item.element.title = translation;
                } else if (item.node) {
                  item.node.textContent = translation;
                } else if (
                  item.element.firstChild &&
                  item.element.firstChild.nodeType === Node.TEXT_NODE
                ) {
                  item.element.firstChild.textContent = translation;
                }
              } catch (error) {
                console.warn('Translation application failed for element:', error);
              }
            }
          });
        }
      } catch (error) {
        console.error('Bulk translation failed:', error);
      }
    },
    [translateDynamicBulk, currentLanguage]
  );

  // Debounced translation function
  const debouncedTranslate = useCallback(
    debounce(async () => {
      if (currentLanguage === 'en') return; // Skip if English

      const elements = extractTextElements();
      if (elements.length > 0) {
        await applyTranslations(elements);
      }
    }, 100),
    [currentLanguage, extractTextElements, applyTranslations]
  );

  // Main translation effect
  useEffect(() => {
    if (currentLanguage !== 'en') {
      // Delay to ensure DOM is ready
      const timer = setTimeout(() => {
        debouncedTranslate();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [currentLanguage, debouncedTranslate]);

  // Observe DOM changes for dynamic content
  useEffect(() => {
    if (currentLanguage === 'en') return;

    const observer = new MutationObserver(mutations => {
      let shouldTranslate = false;

      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
              shouldTranslate = true;
            }
          });
        } else if (mutation.type === 'characterData' && mutation.target.textContent.trim()) {
          shouldTranslate = true;
        }
      });

      if (shouldTranslate) {
        debouncedTranslate();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, [currentLanguage, debouncedTranslate]);

  return children;
};

export default GlobalTranslationWrapper;
