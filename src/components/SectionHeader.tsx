import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface SectionHeaderProps {
  title: string;
  actionText?: string;
  onActionClick?: () => void;
  rightElement?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  actionText,
  onActionClick,
  rightElement,
  className = '',
}) => {
  const { t } = useLanguage();
  const resolvedActionText = actionText !== undefined ? actionText : t('home.seeAll');

  return (
    <div className={`flex items-center justify-between mb-3.5 ${className}`}>
      <h2 className="font-display text-[19px] sm:text-[21px] font-semibold text-[#FDF8F0] tracking-tight">
        {title}
      </h2>
      {rightElement ? (
        rightElement
      ) : onActionClick ? (
        <button
          type="button"
          onClick={onActionClick}
          className="flex items-center text-xs font-sans font-medium text-[#D9B98D] hover:text-[#FDF8F0] transition-colors gap-0.5 active:opacity-75 py-1 px-1.5"
        >
          <span>{resolvedActionText}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      ) : null}
    </div>
  );
};
