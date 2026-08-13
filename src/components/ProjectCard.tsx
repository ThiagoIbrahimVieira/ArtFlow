import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Palette, Mountain, Image as ImageIcon, Pencil, Trash2 } from 'lucide-react';
import { Project } from '../types';
import { ProgressBar } from './ProgressBar';
import { StatusBadge } from './StatusBadge';
import { ArtworkImage } from './ArtworkImage';

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
    if (cat.includes('environment') || cat.includes('paisagem')) {
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
      <div className={`flex-shrink-0 w-[200px] rounded-2xl bg-[#272320] border border-[#3A332C] p-3 flex flex-col justify-between ${className}`}>
        <div>
          <div className="relative w-full h-[110px] rounded-xl overflow-hidden mb-2.5 bg-[#191715]">
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
            <div ref={menuRef} className="absolute top-1.5 right-1.5">
              <button
                onClick={handleMenuTrigger}
                aria-label="More options"
                className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-[#F1E2CB] hover:bg-black/70 transition-colors"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-8 z-30 bg-[#191715] border border-[#433D37] rounded-xl py-1 shadow-2xl min-w-[120px] text-left">
                  {onEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        onEdit(project);
                      }}
                      className="w-full px-3 py-1.5 text-xs text-[#F1E2CB] hover:bg-[#272320] flex items-center gap-2"
                    >
                      <Pencil className="w-3.5 h-3.5 text-[#D9B98D]" />
                      <span>Editar</span>
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        onDelete(project.id);
                      }}
                      className="w-full px-3 py-1.5 text-xs text-red-400 hover:bg-[#272320] flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          <h4 className="font-serif text-[15px] text-[#F1E2CB] font-normal truncate text-left">
            {project.title}
          </h4>
          <p className="text-[11px] font-sans text-[#A99D8E] truncate mb-2 text-left">
            {project.category}
          </p>
        </div>
        <div>
          <div className="flex justify-between items-center text-[10px] font-sans text-[#A99D8E] mb-1">
            <span>Progresso</span>
            <span className="text-[#F1E2CB] font-medium">{project.progress}%</span>
          </div>
          <ProgressBar progress={project.progress} height="h-1" />
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full rounded-2xl bg-[#272320] border border-[#3A332C] p-3.5 flex items-stretch gap-3.5 relative text-left ${className}`}>
      {/* Artwork Thumbnail */}
      <div className="w-[110px] sm:w-[130px] flex-shrink-0 rounded-xl overflow-hidden relative bg-[#191715]">
        {project.imageUrl ? (
          <ArtworkImage
            src={project.imageUrl}
            alt={project.title}
            className="w-full h-[130px] object-cover"
          />
        ) : (
          <div className="w-full h-[130px] flex items-center justify-center text-[#7A7165]">
            <ImageIcon className="w-8 h-8 opacity-40" />
          </div>
        )}
      </div>

      {/* Info Content */}
      <div className="flex-1 flex flex-col justify-between min-w-0 pr-6">
        <div>
          <h3 className="font-serif text-[18px] text-[#F1E2CB] font-normal tracking-tight truncate leading-tight">
            {project.title}
          </h3>

          <div className="flex items-center gap-1.5 text-xs text-[#A99D8E] mt-1.5 mb-2.5">
            <span className="w-6 h-6 rounded-full bg-[#191715] border border-[#433D37] flex items-center justify-center flex-shrink-0">
              {getCategoryIcon(project.category)}
            </span>
            <span className="truncate">{project.category}</span>
          </div>

          <StatusBadge status={project.status} />
        </div>

        <div className="mt-3">
          <div className="flex justify-between items-center text-xs font-sans text-[#F1E2CB] font-medium mb-1">
            <span className="text-[11px] text-[#A99D8E]">Progresso</span>
            <span>{project.progress}%</span>
          </div>
          <ProgressBar progress={project.progress} height="h-1.5" />
        </div>
      </div>

      {/* More Options Dropdown */}
      <div ref={menuRef} className="absolute top-3.5 right-3">
        <button
          onClick={handleMenuTrigger}
          aria-label="Opções do projeto"
          className="text-[#A99D8E] hover:text-[#F1E2CB] p-1 transition-colors rounded-lg hover:bg-[#332E2A]"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {showMenu && (
          <div className="absolute right-0 top-8 z-30 bg-[#191715] border border-[#433D37] rounded-xl py-1 shadow-2xl min-w-[120px]">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onEdit(project);
                }}
                className="w-full px-3 py-1.5 text-xs text-[#F1E2CB] hover:bg-[#272320] flex items-center gap-2"
              >
                <Pencil className="w-3.5 h-3.5 text-[#D9B98D]" />
                <span>Editar</span>
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onDelete(project.id);
                }}
                className="w-full px-3 py-1.5 text-xs text-red-400 hover:bg-[#272320] flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
