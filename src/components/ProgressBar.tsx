import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  className?: string;
  height?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  className = '',
  height = 'h-1.5',
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div
      role="progressbar"
      aria-valuenow={clampedProgress}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`w-full bg-[#191715] rounded-full overflow-hidden border border-[#3A332C] ${height} ${className}`}
    >
      <div
        className="bg-gradient-to-r from-[#D9B98D] to-[#F1E2CB] h-full rounded-full transition-all duration-500 ease-out"
        style={{ width: `${clampedProgress}%` }}
      />
    </div>
  );
};
