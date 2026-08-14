import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Image as ImageIcon, Folder, Palette as PaletteIcon, Sparkles, User } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface NavItemDef {
  key: string;
  translationKey: 'navigation.home' | 'navigation.references' | 'navigation.projects' | 'navigation.palettes' | 'navigation.ai' | 'navigation.profile';
  path: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItemDef[] = [
  { key: 'home', translationKey: 'navigation.home', path: '/home', icon: Home },
  { key: 'references', translationKey: 'navigation.references', path: '/references', icon: ImageIcon },
  { key: 'projects', translationKey: 'navigation.projects', path: '/projects', icon: Folder },
  { key: 'palettes', translationKey: 'navigation.palettes', path: '/palettes', icon: PaletteIcon },
  { key: 'ai', translationKey: 'navigation.ai', path: '/ai', icon: Sparkles },
  { key: 'profile', translationKey: 'navigation.profile', path: '/profile', icon: User },
];

export const BottomNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const currentPath = location.pathname;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#191715]/95 backdrop-blur-xl border-t border-[#332E2A] pb-[env(safe-area-inset-bottom,8px)] pt-2 px-2">
      <div className="max-w-[440px] md:max-w-[800px] mx-auto flex items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path || (item.path === '/home' && currentPath === '/');
          const isAI = item.key === 'ai';
          const label = t(item.translationKey);

          return (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              aria-label={label}
              className={`flex flex-col items-center justify-center py-1 px-1.5 min-w-[50px] rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-[#FDF8F0]'
                  : isAI
                  ? 'text-[#D9B98D] hover:text-[#FDF8F0]'
                  : 'text-[#A99D8E] hover:text-[#D9B98D]'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 stroke-[2.2]' : 'stroke-[1.6]'
                  } ${isAI && !isActive ? 'text-[#D9B98D]' : ''}`}
                />
              </div>
              <span
                className={`text-[10px] font-sans mt-1 tracking-tight truncate max-w-[62px] ${
                  isActive ? 'font-semibold text-[#FDF8F0]' : 'font-medium text-[#A99D8E]'
                } ${isAI && !isActive ? 'text-[#D9B98D]' : ''}`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
