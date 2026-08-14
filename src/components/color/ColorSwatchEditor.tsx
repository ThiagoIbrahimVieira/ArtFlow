import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ColorPicker } from './ColorPicker';
import { useLanguage } from '../../hooks/useLanguage';

interface ColorSwatchEditorProps {
  colors: string[];
  onChange: (colors: string[]) => void;
}

export const ColorSwatchEditor: React.FC<ColorSwatchEditorProps> = ({
  colors,
  onChange,
}) => {
  const { t } = useLanguage();
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const activeColor = colors[selectedIndex] || colors[0] || '#D9B98D';

  const handleColorChange = (newHex: string) => {
    const updated = [...colors];
    updated[selectedIndex] = newHex;
    onChange(updated);
  };

  const handleAddColor = () => {
    if (colors.length >= 10) return;
    const defaultNewHex = colors.length % 2 === 0 ? '#E5A855' : '#82A89C';
    const updated = [...colors, defaultNewHex];
    onChange(updated);
    setSelectedIndex(updated.length - 1);
  };

  const handleRemoveColor = (indexToRemove: number) => {
    if (colors.length <= 2) return;
    const updated = colors.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
    if (selectedIndex >= updated.length) {
      setSelectedIndex(updated.length - 1);
    }
  };

  return (
    <div className="space-y-3.5 text-left">
      <div className="flex items-center justify-between">
        <label className="text-xs font-sans text-[#A99D8E] font-medium">
          {t('palettes.colorsCount')} ({colors.length}/10)
        </label>
        <span className="text-[10px] font-sans text-[#7A7165]">
          HEX / HSB
        </span>
      </div>

      {/* Swatches Grid */}
      <div className="flex flex-wrap gap-2 items-center">
        {colors.map((hex, idx) => {
          const isSelected = selectedIndex === idx;
          return (
            <div key={idx} className="relative group">
              <button
                type="button"
                onClick={() => setSelectedIndex(idx)}
                aria-label={`Color ${idx + 1}`}
                className={`w-10 h-10 rounded-xl border-2 transition-all shadow-md relative overflow-hidden flex items-center justify-center cursor-pointer ${
                  isSelected
                    ? 'border-[#FDF8F0] scale-105 ring-2 ring-[#D9B98D]/50'
                    : 'border-[#433D37] hover:border-[#D9B98D]'
                }`}
                style={{ backgroundColor: hex }}
              >
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-white shadow-sm" />
                )}
              </button>

              {colors.length > 2 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveColor(idx);
                  }}
                  aria-label={t('colorPicker.removeColor')}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-600/90 text-white flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shadow cursor-pointer"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          );
        })}

        {colors.length < 10 && (
          <button
            type="button"
            onClick={handleAddColor}
            aria-label={t('colorPicker.addColor')}
            className="w-10 h-10 rounded-xl border border-dashed border-[#51483E] text-[#A99D8E] hover:text-[#FDF8F0] hover:border-[#D9B98D] flex items-center justify-center transition-colors cursor-pointer"
            title={t('colorPicker.addColor')}
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Color Picker for active swatch */}
      <div className="pt-1">
        <ColorPicker color={activeColor} onChange={handleColorChange} />
      </div>
    </div>
  );
};
