import React, { useMemo } from 'react';
import Handlebars from 'handlebars';
import DOMPurify from 'dompurify';
import { Knowledge } from '../types';

interface DynamicCardProps {
  template: string;
  knowledge: Knowledge;
  className?: string;
}

export const DynamicCard: React.FC<DynamicCardProps> = ({ template, knowledge, className }) => {
  const htmlContent = useMemo(() => {
    if (!template) return '';
    try {
      const compiledTemplate = Handlebars.compile(template);
      const rawHtml = compiledTemplate(knowledge);
      
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
  }, [template, knowledge]);

  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: htmlContent }} 
    />
  );
};
