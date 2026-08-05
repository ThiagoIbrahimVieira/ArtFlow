import React from 'react';

interface ProfileStatsProps {
  projectsCount: number;
  referencesCount: number;
  palettesCount: number;
  className?: string;
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({
  projectsCount,
  referencesCount,
  palettesCount,
  className = '',
}) => {
  return (
    <div className={`grid grid-cols-3 divide-x divide-[#3A332C] text-center pt-3 border-t border-[#3A332C] ${className}`}>
      <div className="flex flex-col items-center">
        <span className="font-serif text-[22px] font-normal text-[#F1E2CB]">
          {projectsCount}
        </span>
        <span className="text-[11px] font-sans text-[#A99D8E] mt-0.5">
          Projects
        </span>
      </div>

      <div className="flex flex-col items-center">
        <span className="font-serif text-[22px] font-normal text-[#F1E2CB]">
          {referencesCount}
        </span>
        <span className="text-[11px] font-sans text-[#A99D8E] mt-0.5">
          References
        </span>
      </div>

      <div className="flex flex-col items-center">
        <span className="font-serif text-[22px] font-normal text-[#F1E2CB]">
          {palettesCount}
        </span>
        <span className="text-[11px] font-sans text-[#A99D8E] mt-0.5">
          Palettes
        </span>
      </div>
    </div>
  );
};
