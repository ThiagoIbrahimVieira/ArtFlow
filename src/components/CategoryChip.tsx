import React from 'react';

interface CategoryChipProps {
  label: string;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export const CategoryChip: React.FC<CategoryChipProps> = ({
  label,
  isSelected = false,
  onClick,
  className = '',
}) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-xs font-sans font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 active:scale-95 ${
        isSelected
          ? 'bg-[#F1E2CB] text-[#191715] shadow-sm font-semibold'
          : 'bg-[#272320] text-[#A99D8E] border border-[#433D37] hover:border-[#514940] hover:text-[#F1E2CB]'
      } ${className}`}
    >
      {label}
    </button>
  );
};
