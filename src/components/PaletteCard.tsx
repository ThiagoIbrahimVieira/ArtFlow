import React, { useState } from 'react';
import { Bookmark, Sun, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Palette, PaletteColor } from '../types';
import { useLanguage } from '../hooks/useLanguage';

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
  const { t } = useLanguage();
  const [isSaved, setIsSaved] = useState(palette.isSaved);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaved(!isSaved);
    if (onSaveToggle) {
      onSaveToggle(palette.id);
    }
  };

  const getColorHex = (c: string | PaletteColor): string => {
    if (typeof c === 'string') return c;
    return c?.hex || '#000000';
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

  const colorList = Array.isArray(palette.colors) ? palette.colors : [];
  const hasMoreColors = colorList.length > 5;
  const visibleColors = isExpanded ? colorList : colorList.slice(0, 5);

  if (isFeatured) {
    return (
      <div className={`w-full rounded-2xl bg-[#272320] border border-[#3A332C] p-4 shadow-md ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-[#D9B98D]" />
            <span className="font-display text-[17px] font-semibold text-[#FDF8F0]">
              {palette.name}
            </span>
          </div>
          <button
            type="button"
            onClick={handleSave}
            aria-label={isSaved ? t('common.done') : t('common.save')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-sans font-medium transition-all cursor-pointer ${
              isSaved
                ? 'bg-[#D9B98D] text-[#191715]'
                : 'bg-[#191715] text-[#FDF8F0] border border-[#433D37] hover:bg-[#332E2A]'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-[#191715]' : ''}`} />
            <span>{isSaved ? t('common.done') : t('common.save')}</span>
          </button>
        </div>

        {/* Swatches Grid */}
        <div className="grid grid-cols-5 gap-2 my-2.5">
          {visibleColors.map((c, index) => {
            const hex = getColorHex(c);
            return (
              <button
                key={index}
                type="button"
                onClick={() => handleCopyColor(hex)}
                title={`${t('common.copyHex')}: ${hex}`}
                className="relative h-12 rounded-lg transition-transform active:scale-95 group overflow-hidden border border-white/5 cursor-pointer"
                style={{ backgroundColor: hex }}
              >
                {copiedColor === hex && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Ver mais / Ver menos button */}
        {hasMoreColors && (
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1 text-[11px] font-sans font-medium text-[#D9B98D] hover:text-[#E8DAC7] transition-colors cursor-pointer"
            >
              <span>{isExpanded ? t('palettes.showLess') : `${t('palettes.showMore')} (+${colorList.length - 5})`}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}

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
        <h3 className="font-display text-[17px] font-semibold text-[#FDF8F0]">
          {palette.name}
        </h3>
        
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-sans font-medium border ${
            categoryBadgeStyle[palette.category] || 'bg-[#191715] text-[#A99D8E] border-[#433D37]'
          }`}>
            {palette.category}
          </span>

          <button
            type="button"
            onClick={handleSave}
            aria-label={isSaved ? t('common.done') : t('common.save')}
            className="text-[#A99D8E] hover:text-[#D9B98D] p-1 transition-colors cursor-pointer"
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#D9B98D] text-[#D9B98D]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Swatches Grid */}
      <div className="grid grid-cols-5 gap-2">
        {visibleColors.map((c, index) => {
          const hex = getColorHex(c);
          return (
            <button
              key={index}
              type="button"
              onClick={() => handleCopyColor(hex)}
              title={`${t('common.copyHex')}: ${hex}`}
              className="relative h-12 rounded-lg transition-transform active:scale-95 group overflow-hidden border border-white/5 cursor-pointer"
              style={{ backgroundColor: hex }}
            >
              {copiedColor === hex && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                  <Check className="w-4 h-4" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Ver mais / Ver menos button */}
      {hasMoreColors && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 text-[11px] font-sans font-medium text-[#D9B98D] hover:text-[#E8DAC7] transition-colors cursor-pointer"
          >
            <span>{isExpanded ? t('palettes.showLess') : `${t('palettes.showMore')} (+${colorList.length - 5})`}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
};
