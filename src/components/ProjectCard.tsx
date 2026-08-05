import React from 'react';
import { MoreVertical, Palette, Mountain, Image as ImageIcon } from 'lucide-react';
import { Project } from '../types';
import { ProgressBar } from './ProgressBar';
import { StatusBadge } from './StatusBadge';
import { ArtworkImage } from './ArtworkImage';

interface ProjectCardProps {
  project: Project;
  variant?: 'compact' | 'full';
  onMoreClick?: () => void;
  className?: string;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  variant = 'full',
  onMoreClick,
  className = '',
}) => {
  const getCategoryIcon = (category: string) => {
    if (category.toLowerCase().includes('environment')) {
      return <Mountain className="w-3.5 h-3.5 text-[#D9B98D]" />;
    }
    if (category.toLowerCase().includes('illustration')) {
      return <ImageIcon className="w-3.5 h-3.5 text-[#D9B98D]" />;
    }
    return <Palette className="w-3.5 h-3.5 text-[#D9B98D]" />;
  };

  if (variant === 'compact') {
    return (
      <div className={`flex-shrink-0 w-[200px] rounded-2xl bg-[#272320] border border-[#3A332C] p-3 flex flex-col justify-between ${className}`}>
        <div>
          <div className="relative w-full h-[110px] rounded-xl overflow-hidden mb-2.5">
            <ArtworkImage
              src={project.imageUrl}
              alt={project.title}
              className="w-full h-full object-cover"
            />
            <button
              onClick={onMoreClick}
              aria-label="More options"
              className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-[#F1E2CB] hover:bg-black/60 transition-colors"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </div>
          <h4 className="font-serif text-[15px] text-[#F1E2CB] font-normal truncate">
            {project.title}
          </h4>
          <p className="text-[11px] font-sans text-[#A99D8E] truncate mb-2">
            {project.category}
          </p>
        </div>
        <div>
          <div className="flex justify-between items-center text-[10px] font-sans text-[#A99D8E] mb-1">
            <span>Progress</span>
            <span className="text-[#F1E2CB] font-medium">{project.progress}%</span>
          </div>
          <ProgressBar progress={project.progress} height="h-1" />
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full rounded-2xl bg-[#272320] border border-[#3A332C] p-3.5 flex items-stretch gap-3.5 relative ${className}`}>
      {/* Artwork Thumbnail */}
      <div className="w-[110px] sm:w-[130px] flex-shrink-0 rounded-xl overflow-hidden relative">
        <ArtworkImage
          src={project.imageUrl}
          alt={project.title}
          className="w-full h-[130px] object-cover"
        />
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
          <div className="flex justify-end items-center text-xs font-sans text-[#F1E2CB] font-medium mb-1">
            <span>{project.progress}%</span>
          </div>
          <ProgressBar progress={project.progress} height="h-1.5" />
        </div>
      </div>

      {/* More Options Button */}
      <button
        onClick={onMoreClick}
        aria-label="More options"
        className="absolute top-3.5 right-3 text-[#A99D8E] hover:text-[#F1E2CB] p-1 transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
    </div>
  );
};
