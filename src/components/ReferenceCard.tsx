import React, { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { Reference } from '../types';
import { ArtworkImage } from './ArtworkImage';

interface ReferenceCardProps {
  reference: Reference;
  onBookmarkToggle?: (id: string) => void;
  className?: string;
  showTitle?: boolean;
}

export const ReferenceCard: React.FC<ReferenceCardProps> = ({
  reference,
  onBookmarkToggle,
  className = '',
  showTitle = true,
}) => {
  const [isBookmarked, setIsBookmarked] = useState(reference.isBookmarked);

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
    if (onBookmarkToggle) {
      onBookmarkToggle(reference.id);
    }
  };

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden bg-[#272320] border border-[#3A332C] group shadow-md ${className}`}>
      {/* Aspect ratio square container */}
      <div className="relative w-full aspect-square overflow-hidden">
        <ArtworkImage
          src={reference.imageUrl}
          alt={reference.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient overlay for title readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-85" />

        {/* Bookmark Button top right */}
        <button
          onClick={handleBookmark}
          aria-label={isBookmarked ? "Remove bookmark" : "Save reference"}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 ${
            isBookmarked
              ? 'bg-[#191715]/80 text-[#D9B98D] border border-[#D9B98D]/40'
              : 'bg-black/40 text-[#F1E2CB] hover:bg-black/60 border border-white/20'
          }`}
        >
          <Bookmark
            className={`w-4 h-4 ${isBookmarked ? 'fill-[#D9B98D] stroke-[#D9B98D]' : 'stroke-current'}`}
          />
        </button>

        {/* Title bottom left */}
        {showTitle && (
          <div className="absolute bottom-3 left-3 right-3 text-left">
            <h4 className="font-display text-[15px] font-semibold text-[#FDF8F0] leading-tight drop-shadow-sm truncate">
              {reference.title}
            </h4>
          </div>
        )}
      </div>
    </div>
  );
};
