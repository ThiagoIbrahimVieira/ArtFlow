import React from 'react';
import { useLanguage } from '../hooks/useLanguage';

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
  const { t } = useLanguage();

  return (
    <div className={`grid grid-cols-3 divide-x divide-[#3A332C] text-center pt-3 border-t border-[#3A332C] ${className}`}>
      <div className="flex flex-col items-center">
        <span className="font-sans text-[22px] font-semibold text-[#FDF8F0]">
          {projectsCount}
        </span>
        <span className="text-[11px] font-sans text-[#A99D8E] mt-0.5">
          {t('profile.projectsTab')}
        </span>
      </div>

      <div className="flex flex-col items-center">
        <span className="font-sans text-[22px] font-semibold text-[#FDF8F0]">
          {referencesCount}
        </span>
        <span className="text-[11px] font-sans text-[#A99D8E] mt-0.5">
          {t('profile.referencesTab')}
        </span>
      </div>

      <div className="flex flex-col items-center">
        <span className="font-sans text-[22px] font-semibold text-[#FDF8F0]">
          {palettesCount}
        </span>
        <span className="text-[11px] font-sans text-[#A99D8E] mt-0.5">
          {t('profile.palettesTab')}
        </span>
      </div>
    </div>
  );
};
