import React from 'react';
import { Bell } from 'lucide-react';

interface AppHeaderProps {
  onNotificationClick?: () => void;
  showNotification?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onNotificationClick,
  showNotification = true,
}) => {
  return (
    <header className="flex items-center justify-between pt-3 pb-4 px-5 bg-[#191715]/80 backdrop-blur-md sticky top-0 z-30">
      <h1 className="font-serif text-[28px] font-normal tracking-tight text-[#F1E2CB]">
        ArtFlow
      </h1>
      {showNotification && (
        <button
          onClick={onNotificationClick}
          aria-label="Notifications"
          className="w-10 h-10 rounded-full bg-[#272320] border border-[#433D37] flex items-center justify-center text-[#F1E2CB] hover:bg-[#332E2A] active:scale-95 transition-all shadow-sm"
        >
          <Bell className="w-[18px] h-[18px] stroke-[1.75]" />
        </button>
      )}
    </header>
  );
};
