import React, { useState, useEffect } from 'react';
import { Search, LayoutGrid, Sparkles, Plus, X } from 'lucide-react';
import { AppHeader } from '../components/AppHeader';
import { BottomNavigation } from '../components/BottomNavigation';
import { CategoryChip } from '../components/CategoryChip';
import { ReferenceCard } from '../components/ReferenceCard';
import { SectionHeader } from '../components/SectionHeader';
import { MOCK_REFERENCES } from '../data/mockData';
import { Reference, DeviantArtArtwork } from '../types';
import { useAuth } from '../hooks/useAuth';
import {
  listReferences,
  toggleBookmark,
  saveReference,
  searchSavedReferences,
  filterReferencesByCategory,
} from '../services/referenceService';

const CATEGORIES = ['All', 'Characters', 'Landscapes', 'Poses', 'Color'];

export const ReferencesPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // DeviantArt inspiration modal state
  const [isDaModalOpen, setIsDaModalOpen] = useState(false);
  const [daQuery, setDaQuery] = useState('');
  const [daArtworks, setDaArtworks] = useState<DeviantArtArtwork[]>([]);
  const [daLoading, setDaLoading] = useState(false);
  const [daError, setDaError] = useState<string | null>(null);

  // Manual Add Reference modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newCategory, setNewCategory] = useState('Characters');
  const [isSaving, setIsSaving] = useState(false);

  const fetchUserReferences = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const data = await listReferences(user.uid);
      setReferences(data);
    } catch (err: any) {
      console.error('Failed to list references:', err);
      setError('Não foi possível carregar as referências. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (!user) return;
    setLoading(true);
    setError(null);
    listReferences(user.uid)
      .then((data) => {
        if (isMounted) {
          setReferences(data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to list references:', err);
          setError('Não foi possível carregar as referências. Verifique sua conexão.');
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

  const handleBookmarkToggle = async (id: string) => {
    if (!user) return;
    const target = references.find((r) => r.id === id);
    if (!target) return;

    // Optimistic UI update
    setReferences((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isBookmarked: !item.isBookmarked } : item
      )
    );

    try {
      await toggleBookmark(user.uid, id, target.isBookmarked);
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
      // Revert optimistic update on failure
      setReferences((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isBookmarked: target.isBookmarked } : item
        )
      );
    }
  };

  const handleFetchDeviantArt = async (q: string = '') => {
    setDaLoading(true);
    setDaError(null);
    try {
      const idToken = user ? await user.getIdToken() : '';
      const params = new URLSearchParams();
      if (q) params.set('query', q);
      if (selectedCategory !== 'All') params.set('category', selectedCategory);

      const res = await fetch(`/api/deviantart/inspiration?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Serviço DeviantArt (Backend Cloud Functions) ainda não publicado na Vercel.');
      }

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message || 'Failed to fetch DeviantArt inspiration');
      }

      setDaArtworks(json.data?.items || []);
    } catch (err: any) {
      setDaError(err?.message || 'DeviantArt service currently unavailable.');
    } finally {
      setDaLoading(false);
    }
  };

  const [savedDaIds, setSavedDaIds] = useState<Record<string, boolean>>({});

  const handleSaveDeviantArtReference = async (art: DeviantArtArtwork) => {
    if (!user) return;
    try {
      setSavedDaIds((prev) => ({ ...prev, [art.id]: true }));
      const targetCategory = (art.category && art.category !== 'All') 
        ? art.category 
        : (selectedCategory !== 'All' ? selectedCategory : 'General');

      const saved = await saveReference(user.uid, {
        title: art.title,
        imageUrl: art.thumbnailUrl,
        source: 'deviantart',
        sourceUrl: art.sourceUrl,
        artistName: art.artist,
        category: targetCategory,
        bookmarked: true,
        deviantArtId: art.id,
      });

      setReferences((prev) => [saved, ...prev.filter((r) => r.id !== saved.id)]);
    } catch (err: any) {
      setSavedDaIds((prev) => ({ ...prev, [art.id]: false }));
      alert(err?.message || 'Failed to save reference.');
    }
  };

  const handleAddManualReference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTitle.trim() || !newImageUrl.trim()) return;

    setIsSaving(true);
    try {
      const saved = await saveReference(user.uid, {
        title: newTitle,
        imageUrl: newImageUrl,
        category: newCategory,
        source: 'manual',
        bookmarked: true,
      });

      setReferences((prev) => [saved, ...prev]);
      setNewTitle('');
      setNewImageUrl('');
      setIsAddModalOpen(false);
    } catch (err: any) {
      alert(err?.message || 'Failed to save manual reference.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredByCategory = filterReferencesByCategory(references, selectedCategory);
  const filteredReferences = searchSavedReferences(filteredByCategory, searchQuery);

  return (
    <div className="min-h-screen bg-[#191715] text-[#F1E2CB] max-w-[440px] mx-auto relative pb-24">
      <AppHeader />

      <main className="px-4 sm:px-5 space-y-4 pt-1">
        {/* Search Bar & Action Buttons */}
        <div className="flex gap-2 items-center">
          <div className="relative flex-1 flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-[#A99D8E]" />
            <input
              type="text"
              placeholder="Search references"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm font-sans bg-[#272320] border border-[#3A332C] rounded-2xl text-[#F1E2CB] placeholder-[#A99D8E] focus:outline-none focus:border-[#514940] transition-colors"
            />
          </div>

          {/* Add Manual Reference */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            aria-label="Add Reference"
            className="p-2.5 rounded-2xl bg-[#272320] border border-[#3A332C] text-[#F1E2CB] hover:bg-[#332E2A] transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* DeviantArt Inspiration */}
          <button
            onClick={() => {
              setIsDaModalOpen(true);
              handleFetchDeviantArt();
            }}
            aria-label="DeviantArt Inspiration"
            className="p-2.5 rounded-2xl bg-[#D9B98D] text-[#191715] hover:bg-[#E8DAC7] transition-colors shadow-sm"
          >
            <Sparkles className="w-5 h-5" />
          </button>
        </div>

        {/* Horizontal Category Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 sm:-mx-5 sm:px-5">
          {CATEGORIES.map((cat) => (
            <CategoryChip
              key={cat}
              label={cat}
              isSelected={selectedCategory === cat}
              onClick={() => setSelectedCategory(cat)}
            />
          ))}
        </div>

        {/* Saved References Section Header */}
        <div className="pt-2">
          <SectionHeader
            title="Saved References"
            rightElement={
              <div className="p-1.5 rounded-lg bg-[#272320] border border-[#3A332C] text-[#D9B98D]">
                <LayoutGrid className="w-4 h-4" />
              </div>
            }
          />

          {/* 2-Column Responsive Grid */}
          {loading ? (
            <div className="py-12 text-center text-[#A99D8E] text-xs">
              Loading references...
            </div>
          ) : error ? (
            <div className="py-12 text-center space-y-3">
              <p className="text-sm font-sans text-red-400">{error}</p>
              <button
                onClick={fetchUserReferences}
                className="px-4 py-2 bg-[#272320] border border-[#433D37] text-[#D9B98D] text-xs font-sans rounded-xl hover:bg-[#332E2A] transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          ) : filteredReferences.length > 0 ? (
            <div className="grid grid-cols-2 gap-3.5">
              {filteredReferences.map((ref) => (
                <ReferenceCard
                  key={ref.id}
                  reference={ref}
                  onBookmarkToggle={handleBookmarkToggle}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-[#A99D8E]">
              <p className="text-sm font-sans">No references found</p>
            </div>
          )}
        </div>
      </main>

      {/* Manual Add Reference Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-[360px] bg-[#272320] border border-[#433D37] rounded-3xl p-5 text-[#F1E2CB] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#3A332C] pb-3">
              <h3 className="font-serif text-[20px] font-normal text-[#F1E2CB]">
                Add Reference
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#A99D8E] hover:text-[#F1E2CB] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddManualReference} className="space-y-3.5 pt-1">
              <div>
                <label className="block text-xs font-sans text-[#A99D8E] mb-1">
                  Title
                </label>
                <input
                  type="text"
                  placeholder="e.g., Anomaly Study"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#191715] border border-[#3A332C] rounded-xl text-[#F1E2CB] focus:outline-none focus:border-[#D9B98D]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-sans text-[#A99D8E] mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#191715] border border-[#3A332C] rounded-xl text-[#F1E2CB] focus:outline-none focus:border-[#D9B98D]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-sans text-[#A99D8E] mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#191715] border border-[#3A332C] rounded-xl text-[#F1E2CB] focus:outline-none focus:border-[#D9B98D]"
                >
                  <option value="Characters">Characters</option>
                  <option value="Landscapes">Landscapes</option>
                  <option value="Poses">Poses</option>
                  <option value="Color">Color</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-full border border-[#433D37] text-xs font-sans text-[#A99D8E]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded-full bg-[#F1E2CB] text-[#191715] font-semibold text-xs font-sans hover:bg-[#D9B98D]"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DeviantArt Inspiration Modal */}
      {isDaModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-[420px] max-h-[85vh] bg-[#272320] border border-[#433D37] rounded-3xl p-4 sm:p-5 text-[#F1E2CB] shadow-2xl flex flex-col space-y-3">
            <div className="flex items-center justify-between border-b border-[#3A332C] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#D9B98D]" />
                <h3 className="font-serif text-[20px] font-normal text-[#F1E2CB]">
                  DeviantArt Inspiration
                </h3>
              </div>
              <button
                onClick={() => setIsDaModalOpen(false)}
                className="text-[#A99D8E] hover:text-[#F1E2CB] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search DeviantArt artwork..."
                value={daQuery}
                onChange={(e) => setDaQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFetchDeviantArt(daQuery)}
                className="flex-1 px-3 py-2 text-xs bg-[#191715] border border-[#3A332C] rounded-xl text-[#F1E2CB] focus:outline-none focus:border-[#D9B98D]"
              />
              <button
                onClick={() => handleFetchDeviantArt(daQuery)}
                className="px-3 py-2 bg-[#D9B98D] text-[#191715] text-xs font-sans font-medium rounded-xl hover:bg-[#E8DAC7]"
              >
                Search
              </button>
            </div>

            {daError && (
              <div className="p-3 bg-red-900/30 border border-red-500/40 rounded-xl text-red-200 text-xs">
                {daError}
              </div>
            )}

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pt-1 pr-1">
              {daLoading ? (
                <div className="py-12 text-center text-xs text-[#A99D8E]">
                  Fetching artwork from DeviantArt...
                </div>
              ) : daArtworks.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {daArtworks.map((art) => (
                    <div
                      key={art.id}
                      className="bg-[#191715] rounded-xl overflow-hidden border border-[#3A332C] flex flex-col justify-between"
                    >
                      <div className="relative aspect-square overflow-hidden">
                        <img
                          src={art.thumbnailUrl}
                          alt={art.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-2 text-left">
                        <h5 className="font-serif text-xs text-[#F1E2CB] truncate">{art.title}</h5>
                        <p className="text-[10px] font-sans text-[#A99D8E] truncate">by {art.artist}</p>
                        <button
                          onClick={() => handleSaveDeviantArtReference(art)}
                          disabled={Boolean(savedDaIds[art.id])}
                          className={`mt-2 w-full py-1 text-[11px] rounded-lg transition-colors ${
                            savedDaIds[art.id]
                              ? 'bg-[#3A332C] text-[#E0C9A6] border border-[#52483E] cursor-default'
                              : 'bg-[#272320] border border-[#433D37] text-[#D9B98D] hover:bg-[#332E2A]'
                          }`}
                        >
                          {savedDaIds[art.id] ? 'Saved ✓' : 'Save Reference'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-[#A99D8E]">
                  No DeviantArt artworks available. Try another search query!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <BottomNavigation />
    </div>
  );
};
