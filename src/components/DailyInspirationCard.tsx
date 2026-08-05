import React from 'react';
import { Sun, ArrowRight } from 'lucide-react';
import { HERO_ARTWORK_URL } from '../data/mockData';
import { ArtworkImage } from './ArtworkImage';

interface DailyInspirationCardProps {
  onViewPrompt?: () => void;
  promptText?: string;
  artworkUrl?: string;
}

export const DailyInspirationCard: React.FC<DailyInspirationCardProps> = ({
  onViewPrompt,
  promptText = "Create a character using only warm tones",
  artworkUrl = HERO_ARTWORK_URL,
}) => {
  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-[#272320] border border-[#433D37] shadow-lg group">
      {/* Background artwork image */}
      <div className="absolute inset-0 z-0">
        <ArtworkImage
          src={artworkUrl}
          alt="Daily Inspiration Artwork"
          className="w-full h-full object-cover object-center filter brightness-[0.7] contrast-[1.05]"
        />
        {/* Soft vignette gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#191715]/90 via-[#191715]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#191715]/80 via-transparent to-black/30" />
      </div>

      {/* Content layout */}
      <div className="relative z-10 p-5 min-h-[220px] flex flex-col justify-between">
        {/* Header tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#191715]/60 backdrop-blur-md border border-white/10 w-fit text-[#F1E2CB]">
          <Sun className="w-3.5 h-3.5 stroke-[1.8] text-[#D9B98D]" />
          <span className="text-xs font-sans font-medium">Daily Inspiration</span>
        </div>

        {/* Main prompt text */}
        <div className="my-3 max-w-[260px]">
          <h3 className="font-serif text-[22px] leading-[1.25] text-[#F1E2CB] font-normal tracking-tight">
            {promptText}
          </h3>
        </div>

        {/* Actions & pagination dots */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={onViewPrompt}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F1E2CB] text-[#191715] hover:bg-[#D9B98D] transition-all font-sans text-xs font-medium active:scale-95 shadow-md"
          >
            <span>View Prompt</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2]" />
          </button>

          {/* Carousel dots */}
          <div className="flex items-center gap-1.5 pr-1">
            <span className="w-2 h-2 rounded-full bg-[#F1E2CB]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#F1E2CB]/40" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#F1E2CB]/40" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#F1E2CB]/40" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#F1E2CB]/40" />
          </div>
        </div>
      </div>
    </div>
  );
};
