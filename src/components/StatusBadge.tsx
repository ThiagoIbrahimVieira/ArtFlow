import React from 'react';
import { ProjectStatus } from '../types';

interface StatusBadgeProps {
  status: ProjectStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const dotColors: Record<string, string> = {
    'idea': 'bg-[#988775]',
    'sketching': 'bg-[#D9B98D]',
    'in_progress': 'bg-[#E5A855]',
    'review': 'bg-[#7AA88D]',
    'completed': 'bg-[#5B8C69]',
    'Sketching': 'bg-[#D9B98D]',
    'In Progress': 'bg-[#E5A855]',
    'Review': 'bg-[#7AA88D]',
    'Completed': 'bg-[#5B8C69]',
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#191715] border border-[#433D37] text-[12px] font-sans font-medium text-[#F1E2CB] ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColors[status] || 'bg-[#D9B98D]'}`} />
      <span>{status}</span>
    </div>
  );
};
