import React from 'react';
import { ChevronRight } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  actionText?: string;
  onActionClick?: () => void;
  rightElement?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  actionText = 'See All',
  onActionClick,
  rightElement,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-between mb-3.5 ${className}`}>
      <h2 className="font-serif text-[20px] font-normal text-[#F1E2CB] tracking-tight">
        {title}
      </h2>
      {rightElement ? (
        rightElement
      ) : onActionClick ? (
        <button
          onClick={onActionClick}
          className="flex items-center text-xs font-sans text-[#A99D8E] hover:text-[#D9B98D] transition-colors gap-0.5 active:opacity-75"
        >
          <span>{actionText}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      ) : null}
    </div>
  );
};
