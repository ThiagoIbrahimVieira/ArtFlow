import React, { useState } from 'react';
import { AppHeader } from '../components/AppHeader';
import { BottomNavigation } from '../components/BottomNavigation';
import { PaletteCard } from '../components/PaletteCard';
import { MOCK_PALETTES } from '../data/mockData';
import { Palette } from '../types';

export const PalettesPage: React.FC = () => {
  const [palettes, setPalettes] = useState<Palette[]>(MOCK_PALETTES);

  const featuredPalette = palettes[0];
  const libraryPalettes = palettes.slice(1);

  const handleSaveToggle = (id: string) => {
    setPalettes((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isSaved: !item.isSaved } : item
      )
    );
  };

  return (
    <div className="min-h-screen bg-[#191715] text-[#F1E2CB] max-w-[440px] mx-auto relative pb-24">
      <AppHeader />

      <main className="px-4 sm:px-5 space-y-4 pt-1">
        {/* Title & Description */}
        <div>
          <h2 className="font-serif text-[26px] font-normal text-[#F1E2CB] leading-tight">
            Palette Library
          </h2>
          <p className="text-xs font-sans text-[#A99D8E] mt-1">
            Curated color palettes to inspire your art.
          </p>
        </div>

        {/* Featured Palette of the Day */}
        <PaletteCard
          palette={featuredPalette}
          isFeatured
          onSaveToggle={handleSaveToggle}
        />

        {/* List of Palettes */}
        <div className="space-y-3.5 pt-1">
          {libraryPalettes.map((palette) => (
            <PaletteCard
              key={palette.id}
              palette={palette}
              onSaveToggle={handleSaveToggle}
            />
          ))}
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
};
