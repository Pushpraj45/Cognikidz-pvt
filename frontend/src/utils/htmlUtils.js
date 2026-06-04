import DOMPurify from 'dompurify';

/**
 * Creates a markup object for dangerouslySetInnerHTML after sanitizing the content
 * This safely renders HTML content while preventing XSS attacks
 * @param {string} dirty - The HTML string to sanitize
 * @returns {object} - Object with __html property for React's dangerouslySetInnerHTML
 */
export const createSafeMarkup = dirty => {
  if (!dirty || typeof dirty !== 'string') {
    return { __html: '' };
  }

  // Configure DOMPurify to allow common HTML tags used in articles
  const config = {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'u',
      'b',
      'i',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'blockquote',
      'a',
      'img',
      'div',
      'span',
      'code',
      'pre',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'target'],
    ALLOWED_URI_REGEXP:
      /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.]+(?:[^a-z+.:]|$))/i,
  };

  return { __html: DOMPurify.sanitize(dirty, config) };
};

/**
 * Strips HTML tags from content to create plain text excerpt
 * @param {string} html - HTML string
 * @param {number} maxLength - Maximum length of excerpt
 * @returns {string} - Plain text excerpt
 */
export const stripHtmlTags = (html, maxLength = 200) => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Remove HTML tags and decode entities
  const plainText = html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
    .replace(/&amp;/g, '&') // Replace encoded ampersands
    .replace(/&lt;/g, '<') // Replace encoded less than
    .replace(/&gt;/g, '>') // Replace encoded greater than
    .replace(/&quot;/g, '"') // Replace encoded quotes
    .trim();

  if (plainText.length <= maxLength) {
    return plainText;
  }

  return plainText.substring(0, maxLength).trim() + '...';
};

/**
 * Checks if content contains HTML tags
 * @param {string} content - Content to check
 * @returns {boolean} - True if content contains HTML
 */
export const containsHTML = content => {
  if (!content || typeof content !== 'string') {
    return false;
  }

  return /<[^>]*>/g.test(content);
};
