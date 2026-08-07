import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, X } from 'lucide-react';
import { AppHeader } from '../components/AppHeader';
import { BottomNavigation } from '../components/BottomNavigation';
import { PaletteCard } from '../components/PaletteCard';
import { MOCK_PALETTES } from '../data/mockData';
import { Palette, ColorMuseResponse } from '../types';
import { useAuth } from '../hooks/useAuth';
import { apiFetch } from '../lib/apiClient';
import {
  listPalettes,
  saveGeneratedPalette,
  createPalette,
} from '../services/paletteService';

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

const ColorWheelInput: React.FC<{
  value: string;
  onChange: (val: string) => void;
}> = ({ value, onChange }) => {
  const [showWheel, setShowWheel] = useState(false);
  const colorPickerRef = React.useRef<HTMLInputElement>(null);
  const wheelRef = React.useRef<HTMLDivElement>(null);

  const isValidHex = /^#([A-Fa-f0-9]{6})$/.test(value);
  const displayColor = isValidHex ? value.toUpperCase() : '#D9B98D';

  const handleWheelClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!wheelRef.current) return;
    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const x = e.clientX - rect.left - centerX;
    const y = e.clientY - rect.top - centerY;

    const angleRad = Math.atan2(y, x);
    let angleDeg = (angleRad * 180) / Math.PI + 90;
    if (angleDeg < 0) angleDeg += 360;

    const dist = Math.sqrt(x * x + y * y);
    const maxRadius = rect.width / 2;
    const satPercent = Math.min(100, Math.round((dist / maxRadius) * 100));

    const newHex = hslToHex(angleDeg, satPercent, 50);
    onChange(newHex);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setShowWheel(!showWheel)}
          title="Open Color Circle Wheel"
          className="relative w-8 h-8 rounded-full overflow-hidden border border-[#433D37] hover:border-[#D9B98D] transition-all shadow-md flex items-center justify-center shrink-0 group focus:outline-none focus:ring-1 focus:ring-[#D9B98D]"
          style={{
            background: isValidHex
              ? displayColor
              : 'conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
          }}
        >
          <div className="absolute inset-0 rounded-full border border-white/20 pointer-events-none" />
        </button>

        <div className="relative flex-1">
          <input
            type="text"
            placeholder="#HEX"
            value={value}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            className="w-full px-2.5 py-1.5 text-xs bg-[#191715] border border-[#3A332C] rounded-xl text-[#F1E2CB] font-mono uppercase focus:border-[#D9B98D] outline-none"
          />
          <input
            ref={colorPickerRef}
            type="color"
            value={isValidHex ? displayColor : '#D9B98D'}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            className="sr-only"
          />
        </div>
      </div>

      {showWheel && (
        <div className="absolute left-0 top-10 z-40 bg-[#272320] border border-[#433D37] p-3 rounded-2xl shadow-2xl flex flex-col items-center gap-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between w-full text-[11px] text-[#A99D8E] font-medium">
            <span>Color Circle Wheel</span>
            <button
              type="button"
              onClick={() => setShowWheel(false)}
              className="hover:text-[#F1E2CB] text-xs px-1"
            >
              ✕
            </button>
          </div>

          <div
            ref={wheelRef}
            onClick={handleWheelClick}
            className="relative w-32 h-32 rounded-full cursor-crosshair border-2 border-[#3A332C] shadow-lg overflow-hidden shrink-0 transition-transform active:scale-95"
            style={{
              background: `
                radial-gradient(circle at center, #ffffff 0%, transparent 70%),
                conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)
              `,
            }}
          >
            <div className="absolute inset-0 rounded-full border border-black/10 pointer-events-none" />
          </div>

          <div className="flex items-center gap-2 w-full pt-1.5 border-t border-[#3A332C]">
            <div
              className="w-5 h-5 rounded-md border border-[#433D37]"
              style={{ backgroundColor: displayColor }}
            />
            <span className="text-[11px] font-mono text-[#F1E2CB] flex-1">{displayColor}</span>
            <button
              type="button"
              onClick={() => colorPickerRef.current?.click()}
              className="text-[10px] text-[#D9B98D] underline hover:text-[#E8DAC7]"
            >
              More...
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const PalettesPage: React.FC = () => {
  const { user } = useAuth();
  const [palettes, setPalettes] = useState<Palette[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Color Muse Generator Modal state
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [medium, setMedium] = useState('Digital Illustration');
  const [subject, setSubject] = useState('Fantasy Character');
  const [mood, setMood] = useState('Mystical & Warm');
  const [baseColor, setBaseColor] = useState('#D9B98D');
  const [colorCount, setColorCount] = useState(5);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [generatedResult, setGeneratedResult] = useState<ColorMuseResponse | null>(null);
  const [isSavingGenerated, setIsSavingGenerated] = useState(false);

  // Manual Palette Modal state
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualCategory, setManualCategory] = useState('Warm');
  const [manualColors, setManualColors] = useState(['#191715', '#3D2918', '#A45F32', '#D9B98D', '#F1E2CB']);

  const fetchPalettes = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const data = await listPalettes(user.uid);
      setPalettes(data);
    } catch (err: any) {
      console.error('Failed to list palettes:', err);
      setError('Não foi possível carregar as paletas. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (!user) return;
    setLoading(true);
    setError(null);
    listPalettes(user.uid)
      .then((data) => {
        if (isMounted) {
          setPalettes(data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to list palettes:', err);
          setError('Não foi possível carregar as paletas. Verifique sua conexão.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const isAdmin = user?.email?.toLowerCase() === 'thiagoibrahimvieira@gmail.com';

  const [cooldown, setCooldown] = useState<number>(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleGenerateColorMuse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || (!isAdmin && cooldown > 0)) return;
    setAiLoading(true);
    setAiError(null);
    setGeneratedResult(null);

    try {
      const idToken = await user.getIdToken(true);
      const res = await apiFetch('/api/ai/color-muse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          medium,
          subject,
          mood,
          baseColor: baseColor.trim() || undefined,
          colorCount,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await res.text().catch(() => '');
        console.error('Non-JSON response from Color Muse server:', res.status, text);
        throw new Error(`Erro no servidor da IA Gemini (Status ${res.status}). Por favor, verifique o Redeploy na Vercel.`);
      }

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message || 'Color Muse generation failed.');
      }

      setGeneratedResult(json.data);
    } catch (err: any) {
      setAiError(err?.message || 'Color Muse server error. Please try again.');
    } finally {
      setAiLoading(false);
      if (!isAdmin) setCooldown(10);
    }
  };

  const handleSaveColorMusePalette = async () => {
    if (!user || !generatedResult) return;
    setIsSavingGenerated(true);
    try {
      const saved = await saveGeneratedPalette(user.uid, generatedResult);
      setPalettes((prev) => [saved, ...prev]);
      setIsAiModalOpen(false);
      setGeneratedResult(null);
    } catch (err: any) {
      alert(err?.message || 'Failed to save generated palette.');
    } finally {
      setIsSavingGenerated(false);
    }
  };

  const handleCreateManualPalette = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !manualName.trim()) return;

    try {
      const created = await createPalette(user.uid, {
        name: manualName,
        category: manualCategory,
        colors: manualColors,
        generatedBy: 'manual',
      });
      setPalettes((prev) => [created, ...prev]);
      setManualName('');
      setIsManualModalOpen(false);
    } catch (err: any) {
      alert(err?.message || 'Failed to create palette.');
    }
  };

  const featuredPalette = palettes[0] || MOCK_PALETTES[0];
  const libraryPalettes = palettes.length > 1 ? palettes.slice(1) : MOCK_PALETTES.slice(1);

  return (
    <div className="min-h-screen bg-[#191715] text-[#F1E2CB] max-w-[440px] mx-auto relative pb-24">
      <AppHeader />

      <main className="px-4 sm:px-5 space-y-4 pt-1">
        {/* Title & Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-[26px] font-normal text-[#F1E2CB] leading-tight">
              Palette Library
            </h2>
            <p className="text-xs font-sans text-[#A99D8E] mt-1">
              Curated color palettes to inspire your art.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsManualModalOpen(true)}
              aria-label="Add Palette"
              className="p-2 rounded-2xl bg-[#272320] border border-[#3A332C] text-[#F1E2CB] hover:bg-[#332E2A]"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#D9B98D] text-[#191715] font-sans text-xs font-medium hover:bg-[#E8DAC7] shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>Color Muse</span>
            </button>
          </div>
        </div>

        {/* Featured & Palette List */}
        {loading ? (
          <div className="py-12 text-center text-xs text-[#A99D8E]">Loading palettes...</div>
        ) : error ? (
          <div className="py-12 text-center space-y-3">
            <p className="text-sm font-sans text-red-400">{error}</p>
            <button
              onClick={fetchPalettes}
              className="px-4 py-2 bg-[#272320] border border-[#433D37] text-[#D9B98D] text-xs font-sans rounded-xl hover:bg-[#332E2A] transition-colors"
            >
              Tentar novamente
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
          <div className="py-12 text-center text-[#A99D8E]">
            <p className="text-sm font-sans">No palettes yet. Create or generate one above!</p>
          </div>
        )}
      </main>

      {/* Color Muse Generator Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-[400px] max-h-[85vh] overflow-y-auto no-scrollbar bg-[#272320] border border-[#433D37] rounded-3xl p-5 text-[#F1E2CB] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#3A332C] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#D9B98D]" />
                <h3 className="font-serif text-[20px] font-normal text-[#F1E2CB]">
                  Color Muse AI
                </h3>
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="text-[#A99D8E] hover:text-[#F1E2CB] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {aiError && (
              <div className="p-3 bg-red-900/40 border border-red-500/50 rounded-xl text-red-200 text-xs">
                {aiError}
              </div>
            )}

            {!generatedResult ? (
              <form onSubmit={handleGenerateColorMuse} className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-sans text-[#A99D8E] mb-1">Art Medium</label>
                  <input
                    type="text"
                    value={medium}
                    onChange={(e) => setMedium(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#191715] border border-[#3A332C] rounded-xl text-[#F1E2CB]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-sans text-[#A99D8E] mb-1">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#191715] border border-[#3A332C] rounded-xl text-[#F1E2CB]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-sans text-[#A99D8E] mb-1">Mood & Vibe</label>
                  <input
                    type="text"
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#191715] border border-[#3A332C] rounded-xl text-[#F1E2CB]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-sans text-[#A99D8E] mb-1">Base Color (Optional)</label>
                    <ColorWheelInput value={baseColor} onChange={setBaseColor} />
                  </div>
                  <div>
                    <label className="block text-xs font-sans text-[#A99D8E] mb-1">Color Count (3-8)</label>
                    <input
                      type="number"
                      min={3}
                      max={8}
                      value={colorCount}
                      onChange={(e) => setColorCount(parseInt(e.target.value) || 5)}
                      className="w-full px-3 py-2 text-xs bg-[#191715] border border-[#3A332C] rounded-xl text-[#F1E2CB]"
                    />
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAiModalOpen(false)}
                    className="flex-1 py-2.5 rounded-full border border-[#433D37] text-xs text-[#A99D8E]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={aiLoading || (!isAdmin && cooldown > 0)}
                    className="flex-1 py-2.5 rounded-full bg-[#D9B98D] text-[#191715] font-semibold text-xs hover:bg-[#E8DAC7] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {aiLoading
                      ? 'Generating...'
                      : !isAdmin && cooldown > 0
                      ? `Wait ${cooldown}s...`
                      : 'Generate Palette'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 pt-1">
                <div>
                  <h4 className="font-serif text-[18px] text-[#F1E2CB]">{generatedResult.paletteName}</h4>
                  <p className="text-xs text-[#A99D8E] mt-0.5">{generatedResult.description}</p>
                  <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] bg-[#3D2918] text-[#D9B98D] border border-[#513E2C]">
                    Harmony: {generatedResult.harmony}
                  </span>
                </div>

                {/* Swatches with roles */}
                <div className="space-y-2">
                  {generatedResult.colors.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 bg-[#191715] p-2 rounded-xl border border-[#3A332C]">
                      <div className="w-8 h-8 rounded-lg border border-white/10" style={{ backgroundColor: c.hex }} />
                      <div className="flex-1 min-w-0 text-left">
                        <span className="font-sans text-xs text-[#F1E2CB] font-medium">{c.name}</span>
                        <p className="text-[10px] text-[#A99D8E]">{c.role} ({c.hex})</p>
                      </div>
                    </div>
                  ))}
                </div>

                {generatedResult.usageTips && generatedResult.usageTips.length > 0 && (
                  <div className="bg-[#191715] p-3 rounded-xl border border-[#3A332C] text-left">
                    <h5 className="text-xs font-serif text-[#D9B98D] mb-1">Usage Tips</h5>
                    <ul className="list-disc list-inside text-[11px] text-[#A99D8E] space-y-0.5">
                      {generatedResult.usageTips.map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setGeneratedResult(null)}
                    className="flex-1 py-2 rounded-full border border-[#433D37] text-xs text-[#A99D8E]"
                  >
                    Regenerate
                  </button>
                  <button
                    onClick={handleSaveColorMusePalette}
                    disabled={isSavingGenerated}
                    className="flex-1 py-2 rounded-full bg-[#F1E2CB] text-[#191715] font-semibold text-xs hover:bg-[#D9B98D]"
                  >
                    {isSavingGenerated ? 'Saving...' : 'Save Palette'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Palette Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-[360px] bg-[#272320] border border-[#433D37] rounded-3xl p-5 text-[#F1E2CB] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#3A332C] pb-3">
              <h3 className="font-serif text-[20px] font-normal text-[#F1E2CB]">
                Create Palette
              </h3>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="text-[#A99D8E] hover:text-[#F1E2CB] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualPalette} className="space-y-3.5 pt-1">
              <div>
                <label className="block text-xs font-sans text-[#A99D8E] mb-1">Palette Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sunset Glow"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#191715] border border-[#3A332C] rounded-xl text-[#F1E2CB]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-sans text-[#A99D8E] mb-1">Category</label>
                <select
                  value={manualCategory}
                  onChange={(e) => setManualCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#191715] border border-[#3A332C] rounded-xl text-[#F1E2CB]"
                >
                  <option value="Warm">Warm</option>
                  <option value="Moody">Moody</option>
                  <option value="Vintage">Vintage</option>
                  <option value="Cool">Cool</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-sans text-[#A99D8E] mb-1">HEX Swatches</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {manualColors.map((hex, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={hex}
                      onChange={(e) => {
                        const updated = [...manualColors];
                        updated[idx] = e.target.value;
                        setManualColors(updated);
                      }}
                      className="w-full px-1 py-2 text-[10px] text-center bg-[#191715] border border-[#3A332C] rounded-lg text-[#F1E2CB]"
                    />
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="flex-1 py-2.5 rounded-full border border-[#433D37] text-xs text-[#A99D8E]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-full bg-[#F1E2CB] text-[#191715] font-semibold text-xs hover:bg-[#D9B98D]"
                >
                  Create
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
