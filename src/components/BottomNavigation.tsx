import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Image as ImageIcon, Folder, Palette as PaletteIcon, User } from 'lucide-react';

interface NavItem {
  key: string;
  label: string;
  path: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'home', label: 'Home', path: '/home', icon: Home },
  { key: 'references', label: 'References', path: '/references', icon: ImageIcon },
  { key: 'projects', label: 'Projects', path: '/projects', icon: Folder },
  { key: 'palettes', label: 'Palettes', path: '/palettes', icon: PaletteIcon },
  { key: 'profile', label: 'Profile', path: '/profile', icon: User },
];

export const BottomNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#191715]/95 backdrop-blur-xl border-t border-[#332E2A] pb-[env(safe-area-inset-bottom,8px)] pt-2 px-3">
      <div className="max-w-[440px] mx-auto flex items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path || (item.path === '/home' && currentPath === '/');
          
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              aria-label={item.label}
              className={`flex flex-col items-center justify-center py-1 px-3 min-w-[64px] rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-[#F1E2CB]'
                  : 'text-[#A99D8E] hover:text-[#D9B98D]'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`w-6 h-6 transition-transform duration-200 ${
                    isActive ? 'scale-110 stroke-[2.2]' : 'stroke-[1.6]'
                  }`}
                />
              </div>
              <span className={`text-[11px] font-sans mt-1 tracking-tight ${
                isActive ? 'font-medium text-[#F1E2CB]' : 'font-normal text-[#A99D8E]'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
