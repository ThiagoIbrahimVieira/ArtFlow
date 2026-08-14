import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Palette, Mountain, Image as ImageIcon, Pencil, Trash2 } from 'lucide-react';
import { Project } from '../types';
import { ProgressBar } from './ProgressBar';
import { StatusBadge } from './StatusBadge';
import { ArtworkImage } from './ArtworkImage';
import { useLanguage } from '../hooks/useLanguage';

interface ProjectCardProps {
  project: Project;
  variant?: 'compact' | 'full';
  onEdit?: (project: Project) => void;
  onDelete?: (projectId: string) => void;
  onMoreClick?: () => void;
  className?: string;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  variant = 'full',
  onEdit,
  onDelete,
  onMoreClick,
  className = '',
}) => {
  const { t } = useLanguage();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const getCategoryIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('environment') || cat.includes('paisagem') || cat.includes('cenário')) {
      return <Mountain className="w-3.5 h-3.5 text-[#D9B98D]" />;
    }
    if (cat.includes('illustration') || cat.includes('ilustra')) {
      return <ImageIcon className="w-3.5 h-3.5 text-[#D9B98D]" />;
    }
    return <Palette className="w-3.5 h-3.5 text-[#D9B98D]" />;
  };

  const handleMenuTrigger = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMoreClick) {
      onMoreClick();
    } else {
      setShowMenu((prev) => !prev);
    }
  };

  if (variant === 'compact') {
    return (
      <div className={`flex-shrink-0 w-[215px] sm:w-[225px] rounded-2xl bg-[#272320] border border-[#3A332C] p-3.5 flex flex-col justify-between shadow-md hover:border-[#514940] transition-colors ${className}`}>
        <div>
          <div className="relative w-full h-[120px] rounded-xl overflow-hidden mb-3 bg-[#191715]">
            {project.imageUrl ? (
              <ArtworkImage
                src={project.imageUrl}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#7A7165]">
                <ImageIcon className="w-8 h-8 opacity-40" />
              </div>
            )}
            <div ref={menuRef} className="absolute top-2 right-2">
              <button
                type="button"
                onClick={handleMenuTrigger}
                aria-label={t('common.actions')}
                className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-[#FDF8F0] hover:bg-black/80 transition-colors cursor-pointer"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-8 z-30 bg-[#191715] border border-[#433D37] rounded-xl py-1 shadow-2xl min-w-[120px] text-left animate-in fade-in">
                  {onEdit && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        onEdit(project);
                      }}
                      className="w-full px-3 py-2 text-xs font-sans text-[#FDF8F0] hover:bg-[#272320] flex items-center gap-2"
                    >
                      <Pencil className="w-3.5 h-3.5 text-[#D9B98D]" />
                      <span>{t('common.edit')}</span>
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        onDelete(project.id);
                      }}
                      className="w-full px-3 py-2 text-xs font-sans text-red-400 hover:bg-[#272320] flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t('common.delete')}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          <h4 className="font-display text-[16px] text-[#FDF8F0] font-semibold truncate text-left tracking-tight">
            {project.title}
          </h4>
          <p className="text-[11px] font-sans text-[#A99D8E] truncate mb-2.5 text-left">
            {project.category}
          </p>
        </div>
        <div>
          <div className="flex justify-between items-center text-[10px] font-sans text-[#A99D8E] mb-1.5">
            <span>{t('common.progress')}</span>
            <span className="text-[#FDF8F0] font-semibold">{project.progress}%</span>
          </div>
          <ProgressBar progress={project.progress} height="h-1.5" />
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full rounded-2xl bg-[#272320] border border-[#3A332C] p-4 flex items-stretch gap-4 relative text-left shadow-md hover:border-[#514940] transition-colors ${className}`}>
      {/* Artwork Thumbnail */}
      <div className="w-[115px] sm:w-[135px] flex-shrink-0 rounded-xl overflow-hidden relative bg-[#191715]">
        {project.imageUrl ? (
          <ArtworkImage
            src={project.imageUrl}
            alt={project.title}
            className="w-full h-[135px] object-cover"
          />
        ) : (
          <div className="w-full h-[135px] flex items-center justify-center text-[#7A7165]">
            <ImageIcon className="w-8 h-8 opacity-40" />
          </div>
        )}
      </div>

      {/* Info Content */}
      <div className="flex-1 flex flex-col justify-between min-w-0 pr-6">
        <div>
          <h3 className="font-display text-[18px] sm:text-[19px] text-[#FDF8F0] font-semibold tracking-tight truncate leading-tight">
            {project.title}
          </h3>

          <div className="flex items-center gap-1.5 text-xs font-sans text-[#A99D8E] mt-1.5 mb-2.5">
            <span className="w-6 h-6 rounded-full bg-[#191715] border border-[#433D37] flex items-center justify-center flex-shrink-0">
              {getCategoryIcon(project.category)}
            </span>
            <span className="truncate">{project.category}</span>
          </div>

          <StatusBadge status={project.status} />
        </div>

        <div className="mt-3">
          <div className="flex justify-between items-center text-xs font-sans text-[#FDF8F0] font-medium mb-1.5">
            <span className="text-[11px] text-[#A99D8E]">{t('common.progress')}</span>
            <span className="font-semibold text-[#FDF8F0]">{project.progress}%</span>
          </div>
          <ProgressBar progress={project.progress} height="h-1.5" />
        </div>
      </div>

      {/* More Options Dropdown */}
      <div ref={menuRef} className="absolute top-3.5 right-3">
        <button
          type="button"
          onClick={handleMenuTrigger}
          aria-label={t('common.actions')}
          className="text-[#A99D8E] hover:text-[#FDF8F0] p-1.5 transition-colors rounded-lg hover:bg-[#332E2A] cursor-pointer"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {showMenu && (
          <div className="absolute right-0 top-8 z-30 bg-[#191715] border border-[#433D37] rounded-xl py-1 shadow-2xl min-w-[120px] animate-in fade-in">
            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onEdit(project);
                }}
                className="w-full px-3 py-2 text-xs font-sans text-[#FDF8F0] hover:bg-[#272320] flex items-center gap-2"
              >
                <Pencil className="w-3.5 h-3.5 text-[#D9B98D]" />
                <span>{t('common.edit')}</span>
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onDelete(project.id);
                }}
                className="w-full px-3 py-2 text-xs font-sans text-red-400 hover:bg-[#272320] flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('common.delete')}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
