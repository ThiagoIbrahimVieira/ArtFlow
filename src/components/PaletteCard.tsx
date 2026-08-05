import React, { useState } from 'react';
import { Bookmark, Sun, Check } from 'lucide-react';
import { Palette } from '../types';

interface PaletteCardProps {
  palette: Palette;
  isFeatured?: boolean;
  onSaveToggle?: (id: string) => void;
  className?: string;
}

export const PaletteCard: React.FC<PaletteCardProps> = ({
  palette,
  isFeatured = false,
  onSaveToggle,
  className = '',
}) => {
  const [isSaved, setIsSaved] = useState(palette.isSaved);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaved(!isSaved);
    if (onSaveToggle) {
      onSaveToggle(palette.id);
    }
  };

  const handleCopyColor = (color: string) => {
    navigator.clipboard?.writeText(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(null), 1500);
  };

  const categoryBadgeStyle: Record<string, string> = {
    Warm: 'bg-[#3D2918] text-[#D9B98D] border-[#513E2C]',
    Moody: 'bg-[#1E2B30] text-[#82A89C] border-[#2E3F45]',
    Vintage: 'bg-[#362A2E] text-[#C4A49E] border-[#4A3B40]',
    Cool: 'bg-[#202938] text-[#93B4D8] border-[#313E52]',
  };

  if (isFeatured) {
    return (
      <div className={`w-full rounded-2xl bg-[#272320] border border-[#3A332C] p-4 shadow-md ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-[#D9B98D]" />
            <span className="font-serif text-[17px] font-normal text-[#F1E2CB]">
              {palette.name}
            </span>
          </div>
          <button
            onClick={handleSave}
            aria-label={isSaved ? "Saved palette" : "Save palette"}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-sans font-medium transition-all ${
              isSaved
                ? 'bg-[#D9B98D] text-[#191715]'
                : 'bg-[#191715] text-[#F1E2CB] border border-[#433D37] hover:bg-[#332E2A]'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-[#191715]' : ''}`} />
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>
        </div>

        {/* 5 Color Swatches */}
        <div className="grid grid-cols-5 gap-2 my-2.5">
          {palette.colors.map((color, index) => (
            <button
              key={index}
              onClick={() => handleCopyColor(color)}
              title={`Click to copy ${color}`}
              className="relative h-12 rounded-lg transition-transform active:scale-95 group overflow-hidden border border-white/5"
              style={{ backgroundColor: color }}
            >
              {copiedColor === color && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                  <Check className="w-4 h-4" />
                </div>
              )}
            </button>
          ))}
        </div>

        {palette.description && (
          <p className="text-[12px] font-sans text-[#A99D8E] mt-2 italic">
            {palette.description}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`w-full rounded-2xl bg-[#272320] border border-[#3A332C] p-4 shadow-md ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-serif text-[17px] font-normal text-[#F1E2CB]">
          {palette.name}
        </h3>
        
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-sans font-medium border ${
            categoryBadgeStyle[palette.category] || 'bg-[#191715] text-[#A99D8E] border-[#433D37]'
          }`}>
            {palette.category}
          </span>

          <button
            onClick={handleSave}
            aria-label={isSaved ? "Saved palette" : "Save palette"}
            className="text-[#A99D8E] hover:text-[#D9B98D] p-1 transition-colors"
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#D9B98D] text-[#D9B98D]' : ''}`} />
          </button>
        </div>
      </div>

      {/* 5 Color Swatches */}
      <div className="grid grid-cols-5 gap-2">
        {palette.colors.map((color, index) => (
          <button
            key={index}
            onClick={() => handleCopyColor(color)}
            title={`Click to copy ${color}`}
            className="relative h-12 rounded-lg transition-transform active:scale-95 group overflow-hidden border border-white/5"
            style={{ backgroundColor: color }}
          >
            {copiedColor === color && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                <Check className="w-4 h-4" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
