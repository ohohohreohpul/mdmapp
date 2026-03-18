/**
 * Utility functions for cleaning WordPress content
 */

/**
 * Remove WordPress Gutenberg block comments and clean HTML for display
 */
export function cleanWordPressContent(content: string): string {
  if (!content) return '';
  
  let cleaned = content;
  
  // Remove WordPress Gutenberg block comments
  cleaned = cleaned.replace(/<!--\s*wp:[^>]*-->/g, '');
  cleaned = cleaned.replace(/<!--\s*\/wp:[^>]*-->/g, '');
  
  // Remove empty HTML tags
  cleaned = cleaned.replace(/<p>\s*<\/p>/gi, '');
  cleaned = cleaned.replace(/<div>\s*<\/div>/gi, '');
  
  // Trim whitespace
  cleaned = cleaned.trim();
  
  return cleaned;
}

/**
 * Strip all HTML tags and return plain text
 */
export function stripHtml(html: string): string {
  if (!html) return '';
  
  let text = html;
  
  // Remove WordPress block comments first
  text = text.replace(/<!--\s*wp:[^>]*-->/g, '');
  text = text.replace(/<!--\s*\/wp:[^>]*-->/g, '');
  
  // Replace common block elements with newlines
  text = text.replace(/<\/p>/gi, '\n');
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/li>/gi, '\n');
  text = text.replace(/<\/h[1-6]>/gi, '\n');
  
  // Remove all remaining HTML tags
  text = text.replace(/<[^>]*>/g, '');
  
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  
  // Clean up multiple newlines
  text = text.replace(/\n{3,}/g, '\n\n');
  
  // Trim
  text = text.trim();
  
  return text;
}

/**
 * Get excerpt from content (first N characters)
 */
export function getExcerpt(content: string, maxLength: number = 150): string {
  const plainText = stripHtml(content);
  
  if (plainText.length <= maxLength) {
    return plainText;
  }
  
  // Cut at last space before maxLength
  const truncated = plainText.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.7) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}
