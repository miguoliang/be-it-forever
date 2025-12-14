import Handlebars from 'handlebars';
import DOMPurify from 'dompurify';

/**
 * Compiles a Handlebars template with data and sanitizes the output HTML.
 * Handles both client-side and server-side (via JSDOM) environments.
 */
export const renderTemplate = (template: string, data: unknown): string => {
  if (!template) return '';

  try {
    const compiledTemplate = Handlebars.compile(template);
    const rawHtml = compiledTemplate(data);
    
    // Initialize sanitizer based on environment
    let sanitizer;
    if (typeof window !== 'undefined') {
      sanitizer = DOMPurify(window);
    } else {
      // SSR fallback using JSDOM
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { JSDOM } = require('jsdom');
      const window = new JSDOM('').window;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const purify = DOMPurify(window as any);
      sanitizer = purify;
    }

    return sanitizer.sanitize(rawHtml);
  } catch (error) {
    console.error("Template rendering error:", error);
    return `<div class="p-4 text-red-500 border border-red-500 rounded bg-red-50">Error rendering template: ${(error as Error).message}</div>`;
  }
};
