import React from 'react';
import { ProjectStatus } from '../types';
import { useLanguage } from '../hooks/useLanguage';

interface StatusBadgeProps {
  status: ProjectStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const { t } = useLanguage();

  const dotColors: Record<string, string> = {
    idea: 'bg-[#988775]',
    sketching: 'bg-[#D9B98D]',
    in_progress: 'bg-[#E5A855]',
    review: 'bg-[#7AA88D]',
    completed: 'bg-[#5B8C69]',
    Sketching: 'bg-[#D9B98D]',
    'In Progress': 'bg-[#E5A855]',
    Review: 'bg-[#7AA88D]',
    Completed: 'bg-[#5B8C69]',
  };

  const getStatusLabel = (s: string): string => {
    switch (s.toLowerCase()) {
      case 'idea':
      case 'ideia':
        return t('projects.status.idea');
      case 'sketching':
      case 'rascunho':
        return t('projects.status.sketching');
      case 'in_progress':
      case 'in progress':
      case 'em progresso':
        return t('projects.status.in_progress');
      case 'review':
      case 'revisão':
        return t('projects.status.review');
      case 'completed':
      case 'concluído':
      case 'finalizado':
        return t('projects.status.completed');
      default:
        return s;
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#191715] border border-[#433D37] text-[12px] font-sans font-medium text-[#FDF8F0] ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColors[status] || 'bg-[#D9B98D]'}`} />
      <span>{getStatusLabel(status)}</span>
    </div>
  );
};
