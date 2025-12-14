import React, { useMemo } from 'react';
import { Knowledge } from '../types';
import { renderTemplate } from '@/lib/utils/template';

interface DynamicCardProps {
  template: string;
  knowledge: Knowledge;
  className?: string;
}

export const DynamicCard: React.FC<DynamicCardProps> = ({ template, knowledge, className }) => {
  const htmlContent = useMemo(() => {
    return renderTemplate(template, knowledge);
  }, [template, knowledge]);

  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: htmlContent }} 
    />
  );
};
