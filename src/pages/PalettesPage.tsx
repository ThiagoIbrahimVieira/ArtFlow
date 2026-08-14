import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Plus, X, Palette as PaletteIcon } from 'lucide-react';
import { AppHeader } from '../components/AppHeader';
import { BottomNavigation } from '../components/BottomNavigation';
import { PaletteCard } from '../components/PaletteCard';
import { ColorSwatchEditor } from '../components/color/ColorSwatchEditor';
import { Palette } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { listPalettes, createPalette } from '../services/paletteService';

export const PalettesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [palettes, setPalettes] = useState<Palette[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const paletteCategories = [
    t('palettes.harmonies.warm'),
    t('palettes.harmonies.cool'),
    t('palettes.harmonies.analogous'),
    t('palettes.harmonies.complementary'),
    t('palettes.harmonies.triadic'),
    t('palettes.harmonies.monochromatic'),
    t('palettes.harmonies.custom'),
  ];

  // Manual Palette Modal State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualCategory, setManualCategory] = useState(paletteCategories[0]);
  const [manualColors, setManualColors] = useState(['#191715', '#3D2918', '#A45F32', '#D9B98D', '#F1E2CB']);
  const [isCreating, setIsCreating] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchPalettes = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const data = await listPalettes(user.uid);
      setPalettes(data);
    } catch (err: any) {
      console.error('Failed to list palettes:', err);
      setError(t('errors.firestoreError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPalettes();
  }, [user]);

  const handleCreateManualPalette = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !manualName.trim()) return;

    if (manualColors.length < 1 || manualColors.length > 20) {
      setModalError(t('errors.generic'));
      return;
    }

    setModalError(null);
    setIsCreating(true);

    try {
      const created = await createPalette(user.uid, {
        name: manualName.trim(),
        category: manualCategory.trim(),
        colors: manualColors,
        generatedBy: 'manual',
      });

      setPalettes((prev) => [created, ...prev]);
      setManualName('');
      setManualColors(['#191715', '#3D2918', '#A45F32', '#D9B98D', '#F1E2CB']);
      setIsManualModalOpen(false);
    } catch (err: any) {
      setModalError(err?.message || t('errors.firestoreError'));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#191715] text-[#F1E2CB] max-w-[440px] md:max-w-[800px] mx-auto relative pb-28 text-left">
      <AppHeader />

      <main className="px-4 sm:px-5 space-y-5 pt-1">
        {/* Title & Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-[24px] sm:text-[26px] font-semibold text-[#FDF8F0] leading-tight tracking-tight">
              {t('palettes.myPalettes')}
            </h2>
            <p className="text-xs font-sans text-[#A99D8E] mt-0.5">
              {t('palettes.colorMuseDesc')}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsManualModalOpen(true)}
              aria-label={t('palettes.newPalette')}
              className="p-2.5 rounded-2xl bg-[#272320] border border-[#3A332C] text-[#FDF8F0] hover:bg-[#332E2A] transition-colors shadow-sm cursor-pointer"
              title={t('palettes.newPalette')}
            >
              <Plus className="w-5 h-5" />
            </button>

            {/* Navigate to ArtFlow AI with intent create_palette */}
            <button
              type="button"
              onClick={() => navigate('/ai?intent=create_palette')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#D9B98D] text-[#191715] font-sans text-xs font-semibold hover:bg-[#E8DAC7] transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{t('palettes.generateWithAI')}</span>
            </button>
          </div>
        </div>

        {/* Featured & Palette List */}
        {loading ? (
          <div className="py-12 text-center text-xs font-sans text-[#A99D8E]">{t('common.loading')}</div>
        ) : error ? (
          <div className="py-12 text-center space-y-3">
            <p className="text-sm font-sans text-red-400">{error}</p>
            <button
              type="button"
              onClick={fetchPalettes}
              className="px-4 py-2 bg-[#272320] border border-[#433D37] text-[#D9B98D] text-xs font-sans rounded-xl hover:bg-[#332E2A] transition-colors cursor-pointer"
            >
              {t('common.retry')}
            </button>
          </div>
        ) : palettes.length > 0 ? (
          <>
            <PaletteCard palette={palettes[0]} isFeatured />
            <div className="space-y-3.5 pt-1">
              {palettes.slice(1).map((palette) => (
                <PaletteCard key={palette.id} palette={palette} />
              ))}
            </div>
          </>
        ) : (
          <div className="py-16 text-center text-[#A99D8E] space-y-3">
            <PaletteIcon className="w-10 h-10 mx-auto text-[#7A7165] opacity-50" />
            <p className="text-sm font-sans">{t('palettes.noPalettesFound')}</p>
            <div className="flex justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsManualModalOpen(true)}
                className="px-4 py-2 rounded-full border border-[#433D37] text-xs font-sans text-[#FDF8F0] hover:bg-[#272320] cursor-pointer"
              >
                {t('palettes.newPalette')}
              </button>
              <button
                type="button"
                onClick={() => navigate('/ai?intent=create_palette')}
                className="px-4 py-2 rounded-full bg-[#D9B98D] text-[#191715] text-xs font-sans font-medium hover:bg-[#E8DAC7] cursor-pointer"
              >
                ✨ {t('palettes.generateWithAI')}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Manual Palette Creation Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto no-scrollbar">
          <div className="w-full max-w-[390px] max-h-[90vh] bg-[#272320] border border-[#433D37] rounded-3xl p-5 text-[#F1E2CB] shadow-2xl flex flex-col space-y-4 my-auto text-left">
            <div className="flex items-center justify-between border-b border-[#3A332C] pb-3">
              <h3 className="font-display text-[20px] font-semibold text-[#FDF8F0]">
                {t('palettes.newPalette')}
              </h3>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                aria-label={t('common.close')}
                className="text-[#A99D8E] hover:text-[#FDF8F0] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-900/40 border border-red-500/50 rounded-xl text-red-200 text-xs font-sans">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateManualPalette} className="space-y-3.5 overflow-y-auto no-scrollbar max-h-[65vh] pr-0.5">
              <div>
                <label className="block text-xs font-sans text-[#A99D8E] mb-1 font-medium">
                  {t('palettes.paletteNameLabel')} *
                </label>
                <input
                  type="text"
                  placeholder={t('palettes.paletteNamePlaceholder')}
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  maxLength={80}
                  className="w-full px-3.5 py-2 text-xs font-sans bg-[#191715] border border-[#3A332C] rounded-xl text-[#FDF8F0] focus:outline-none focus:border-[#D9B98D]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-sans text-[#A99D8E] mb-1 font-medium">
                  {t('palettes.harmonyLabel')}
                </label>
                <input
                  type="text"
                  placeholder={t('palettes.harmonyLabel')}
                  value={manualCategory}
                  onChange={(e) => setManualCategory(e.target.value)}
                  maxLength={60}
                  className="w-full px-3.5 py-2 text-xs font-sans bg-[#191715] border border-[#3A332C] rounded-xl text-[#FDF8F0] focus:outline-none focus:border-[#D9B98D] mb-1.5"
                />
                <div className="flex flex-wrap gap-1">
                  {paletteCategories.map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setManualCategory(cat)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-sans transition-colors cursor-pointer ${
                        manualCategory === cat
                          ? 'bg-[#D9B98D] text-[#191715] font-semibold'
                          : 'bg-[#191715] text-[#A99D8E] hover:text-[#FDF8F0] border border-[#3A332C]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Graphic Color Swatch Editor with full ColorPicker */}
              <ColorSwatchEditor
                colors={manualColors}
                onChange={setManualColors}
              />

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  disabled={isCreating}
                  className="flex-1 py-2.5 rounded-full border border-[#433D37] text-xs font-sans text-[#A99D8E] hover:bg-[#332E2A] cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 py-2.5 rounded-full bg-[#D9B98D] text-[#191715] font-semibold text-xs font-sans hover:bg-[#E8DAC7] disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
                >
                  {isCreating ? t('common.loading') : t('palettes.savePalette')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BottomNavigation />
    </div>
  );
};
