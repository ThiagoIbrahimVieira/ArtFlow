import React, { useState } from 'react';
import { Bookmark, Check, Copy, Palette as PaletteIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { AIPaletteData } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { saveGeneratedPalette } from '../../services/paletteService';

interface AIPaletteCardProps {
  palette: AIPaletteData;
}

export const AIPaletteCard: React.FC<AIPaletteCardProps> = ({ palette }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const colorsList = Array.isArray(palette.colors) ? palette.colors : [];
  const hasMoreColors = colorsList.length > 5;
  const visibleColors = isExpanded ? colorsList : colorsList.slice(0, 5);

  const handleSave = async () => {
    if (!user || isSaved || isSaving) return;
    setIsSaving(true);
    try {
      await saveGeneratedPalette(user.uid, {
        paletteName: palette.paletteName,
        description: palette.description,
        harmony: palette.harmony,
        colors: palette.colors,
        usageTips: palette.usageTips,
        contrastNotes: palette.contrastNotes,
      });
      setIsSaved(true);
    } catch (err: any) {
      console.error('Failed to save palette:', err);
      alert(t('errors.generic'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyColors = async () => {
    const hexList = palette.colors.map((c) => c.hex).join(', ');
    try {
      await navigator.clipboard.writeText(hexList);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  return (
    <div className="mt-3 w-full bg-[#191715] border border-[#3A332C] rounded-2xl p-3.5 sm:p-4 text-[#F1E2CB] shadow-lg space-y-3 text-left">
      {/* Title & Harmony Badge */}
      <div className="flex items-start justify-between gap-2 border-b border-[#2D2824] pb-2.5">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-[#D9B98D] font-medium font-sans mb-0.5">
            <PaletteIcon className="w-3.5 h-3.5" />
            <span>{t('palettes.generateWithAI')}</span>
          </div>
          <h4 className="font-display text-[17px] font-semibold text-[#FDF8F0] leading-tight">
            {palette.paletteName}
          </h4>
          <p className="text-[11px] font-sans text-[#A99D8E] mt-0.5">
            {palette.description}
          </p>
        </div>

        <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-sans font-medium bg-[#3D2918] text-[#D9B98D] border border-[#513E2C] flex-shrink-0">
          {palette.harmony}
        </span>
      </div>

      {/* Colors Swatches List */}
      <div className="space-y-1.5">
        {visibleColors.map((c, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 bg-[#272320]/80 p-2 rounded-xl border border-[#3A332C]"
          >
            <div
              className="w-7 h-7 rounded-lg border border-white/15 flex-shrink-0 shadow-inner"
              style={{ backgroundColor: c.hex }}
            />
            <div className="flex-1 min-w-0">
              <span className="font-sans text-xs text-[#FDF8F0] font-medium block truncate">
                {c.name}
              </span>
              <p className="text-[10px] font-sans text-[#A99D8E] truncate">
                {c.role}
              </p>
            </div>
            <span className="font-mono text-xs text-[#D9B98D] font-medium tracking-wide">
              {c.hex}
            </span>
          </div>
        ))}
      </div>

      {/* Ver mais / Ver menos button */}
      {hasMoreColors && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-1.5 px-3 rounded-xl bg-[#272320]/80 hover:bg-[#272320] border border-[#3A332C] text-[#D9B98D] hover:text-[#E8DAC7] text-[11px] font-sans font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>{isExpanded ? t('palettes.showLess') : `${t('palettes.showMore')} (+${colorsList.length - 5})`}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      )}

      {/* Usage Tips */}
      {palette.usageTips && palette.usageTips.length > 0 && (
        <div className="bg-[#272320]/60 p-2.5 rounded-xl border border-[#3A332C] text-left">
          <h5 className="text-[11px] font-sans font-medium text-[#D9B98D] mb-1">
            {t('palettes.usageTips')}
          </h5>
          <ul className="list-disc list-inside text-[10px] font-sans text-[#A99D8E] space-y-0.5">
            {palette.usageTips.map((tip, idx) => (
              <li key={idx}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap sm:flex-nowrap gap-2 pt-1 border-t border-[#2D2824]">
        <button
          type="button"
          onClick={handleCopyColors}
          aria-label={t('palettes.copyColors')}
          className="flex-1 min-w-[120px] py-2 px-2.5 rounded-full border border-[#433D37] text-xs font-sans text-[#A99D8E] hover:text-[#FDF8F0] hover:bg-[#272320] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          {isCopied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span className="text-emerald-400 truncate">{t('common.done')}</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{t('palettes.copyColors')}</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaved || isSaving}
          className={`flex-1 min-w-[120px] py-2 px-2.5 rounded-full text-xs font-sans font-medium flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer ${
            isSaved
              ? 'bg-[#3A332C] text-[#D9B98D] border border-[#52483E] cursor-default'
              : 'bg-[#D9B98D] text-[#191715] hover:bg-[#E8DAC7] active:scale-95'
          }`}
        >
          {isSaved ? (
            <>
              <Check className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">✓ {t('palettes.savedInArtFlow')}</span>
            </>
          ) : (
            <>
              <Bookmark className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{isSaving ? t('common.loading') : t('palettes.savePalette')}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
