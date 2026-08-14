import React from 'react';
import { Bell, Languages } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface AppHeaderProps {
  onNotificationClick?: () => void;
  showNotification?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onNotificationClick,
  showNotification = true,
}) => {
  const { openLanguageModal, t } = useLanguage();

  return (
    <header className="flex items-center justify-between pt-3.5 pb-4 px-5 bg-[#191715]/85 backdrop-blur-md sticky top-0 z-30 border-b border-[#272320]/40">
      <h1 className="font-display text-[26px] sm:text-[28px] font-semibold tracking-tight text-[#FDF8F0] select-none">
        ArtFlow
      </h1>
      <div className="flex items-center gap-2">
        {/* Language selector trigger */}
        <button
          type="button"
          onClick={openLanguageModal}
          aria-label={t('languageModal.title')}
          title={t('languageModal.title')}
          className="w-10 h-10 rounded-full bg-[#272320] border border-[#433D37] flex items-center justify-center text-[#D9B98D] hover:text-[#FDF8F0] hover:bg-[#332E2A] hover:border-[#514940] active:scale-95 transition-all shadow-xs"
        >
          <Languages className="w-[18px] h-[18px] stroke-[1.75]" />
        </button>

        {showNotification && (
          <button
            type="button"
            onClick={onNotificationClick}
            aria-label="Notifications"
            className="w-10 h-10 rounded-full bg-[#272320] border border-[#433D37] flex items-center justify-center text-[#F1E2CB] hover:bg-[#332E2A] hover:border-[#514940] active:scale-95 transition-all shadow-xs"
          >
            <Bell className="w-[18px] h-[18px] stroke-[1.75]" />
          </button>
        )}
      </div>
    </header>
  );
};
