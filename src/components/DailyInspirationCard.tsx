import React, { useState, useEffect } from 'react';
import { Sun, ArrowRight, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { DeviantArtArtwork } from '../types';
import { deviantArtProvider } from '../services/deviantArtProvider';

interface DailyInspirationCardProps {
  onSelectArtwork: (artwork: DeviantArtArtwork) => void;
}

export const DailyInspirationCard: React.FC<DailyInspirationCardProps> = ({
  onSelectArtwork,
}) => {
  const [artworks, setArtworks] = useState<DeviantArtArtwork[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDailyDeviations = async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await deviantArtProvider.getDailyInspirations();
      if (items.length === 0) {
        throw new Error('Nenhuma inspiração diária encontrada no momento.');
      }
      setArtworks(items);
      setCurrentIndex(0);
    } catch (err: any) {
      console.warn('Failed to load Daily Deviations:', err);
      setError('Não foi possível carregar a inspiração de hoje.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyDeviations();
  }, []);

  const handleNext = () => {
    if (artworks.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % artworks.length);
    }
  };

  const handlePrev = () => {
    if (artworks.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + artworks.length) % artworks.length);
    }
  };

  if (loading) {
    return (
      <div className="relative w-full h-[230px] rounded-3xl overflow-hidden bg-[#272320] border border-[#433D37] p-5 flex flex-col justify-between animate-pulse">
        <div className="w-32 h-6 bg-[#332E2A] rounded-full" />
        <div className="space-y-2">
          <div className="w-3/4 h-5 bg-[#332E2A] rounded-lg" />
          <div className="w-1/2 h-4 bg-[#332E2A] rounded-lg" />
        </div>
        <div className="flex justify-between items-center">
          <div className="w-28 h-8 bg-[#332E2A] rounded-full" />
          <div className="w-16 h-3 bg-[#332E2A] rounded-full" />
        </div>
      </div>
    );
  }

  if (error || artworks.length === 0) {
    return (
      <div className="relative w-full min-h-[200px] rounded-3xl overflow-hidden bg-[#272320] border border-[#433D37] p-5 flex flex-col items-center justify-center text-center space-y-3">
        <Sun className="w-8 h-8 text-[#D9B98D] opacity-60" />
        <p className="text-xs font-sans text-[#A99D8E] max-w-[260px]">
          {error || 'Não foi possível carregar a inspiração de hoje.'}
        </p>
        <button
          onClick={fetchDailyDeviations}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#191715] border border-[#433D37] text-[#D9B98D] text-xs font-sans font-medium rounded-full hover:bg-[#332E2A] transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Tentar novamente</span>
        </button>
      </div>
    );
  }

  const currentArt = artworks[currentIndex];

  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-[#272320] border border-[#433D37] shadow-lg group select-none text-left">
      {/* Background artwork image */}
      <div
        className="absolute inset-0 z-0 cursor-pointer"
        onClick={() => onSelectArtwork(currentArt)}
      >
        <img
          src={currentArt.thumbnailUrl}
          alt={currentArt.title}
          className="w-full h-full object-cover object-center filter brightness-[0.65] contrast-[1.05] group-hover:scale-105 transition-transform duration-500"
        />
        {/* Vignette gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#191715]/95 via-[#191715]/65 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#191715]/90 via-transparent to-black/30" />
      </div>

      {/* Content layout */}
      <div className="relative z-10 p-5 min-h-[220px] flex flex-col justify-between pointer-events-none">
        {/* Header tag */}
        <div className="flex items-center justify-between pointer-events-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#191715]/70 backdrop-blur-md border border-white/10 w-fit text-[#F1E2CB]">
            <Sun className="w-3.5 h-3.5 stroke-[1.8] text-[#D9B98D]" />
            <span className="text-[11px] font-sans font-medium">Daily Inspiration</span>
          </div>

          {/* Prev/Next arrows on hover */}
          {artworks.length > 1 && (
            <div className="flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity">
              <button
                onClick={handlePrev}
                aria-label="Previous artwork"
                className="w-6 h-6 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleNext}
                aria-label="Next artwork"
                className="w-6 h-6 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Artwork title & artist */}
        <div
          className="my-3 max-w-[280px] pointer-events-auto cursor-pointer"
          onClick={() => onSelectArtwork(currentArt)}
        >
          <h3 className="font-serif text-[20px] sm:text-[22px] leading-[1.25] text-[#F1E2CB] font-normal tracking-tight truncate">
            {currentArt.title}
          </h3>
          <p className="text-xs font-sans text-[#D9B98D] mt-0.5 truncate">
            Art by {currentArt.artist}
          </p>
        </div>

        {/* Actions & pagination dots */}
        <div className="flex items-center justify-between pt-1 pointer-events-auto">
          <button
            onClick={() => onSelectArtwork(currentArt)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F1E2CB] text-[#191715] hover:bg-[#D9B98D] transition-all font-sans text-xs font-medium active:scale-95 shadow-md"
          >
            <span>Ver Obra</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2]" />
          </button>

          {/* Carousel dots */}
          <div className="flex items-center gap-1.5 pr-1">
            {artworks.slice(0, 5).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`rounded-full transition-all ${
                  currentIndex % 5 === idx
                    ? 'w-2.5 h-2.5 bg-[#F1E2CB]'
                    : 'w-1.5 h-1.5 bg-[#F1E2CB]/40 hover:bg-[#F1E2CB]/70'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
