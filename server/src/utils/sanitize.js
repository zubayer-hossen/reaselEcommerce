import sanitizeHtml from 'sanitize-html';

// Product text may contain light formatting only. Scripts, styles, attributes and links are stripped.
const OPTIONS = {
  allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'ul', 'ol', 'li', 'h3', 'h4'],
  allowedAttributes: {},
};

export const cleanHtml = (value) => (value ? sanitizeHtml(value, OPTIONS).trim() : value);

export const cleanLocalized = (obj) => {
  if (!obj) return obj;
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, cleanHtml(v)]));
};

// Plain text only (names, labels)
export const cleanText = (value) => (value ? sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim() : value);
