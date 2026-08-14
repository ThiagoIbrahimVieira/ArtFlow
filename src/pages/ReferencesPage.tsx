import React, { useState, useEffect } from 'react';
import { Search, LayoutGrid, Sparkles, Plus, X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { AppHeader } from '../components/AppHeader';
import { BottomNavigation } from '../components/BottomNavigation';
import { CategoryChip } from '../components/CategoryChip';
import { ReferenceCard } from '../components/ReferenceCard';
import { SectionHeader } from '../components/SectionHeader';
import { ArtworkViewer, ArtworkViewerData } from '../components/artwork/ArtworkViewer';
import { Reference, DeviantArtArtwork } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import {
  listReferences,
  toggleBookmark,
  saveReference,
  searchSavedReferences,
  filterReferencesByCategory,
} from '../services/referenceService';
import { deviantArtProvider } from '../services/deviantArtProvider';
import { uploadImageFile } from '../services/uploadService';

const SEARCH_SUGGESTIONS = [
  { label: 'Train', query: 'train' },
  { label: 'Locomotive', query: 'locomotive' },
  { label: 'Dragon', query: 'dragon' },
  { label: 'Castle', query: 'castle' },
  { label: 'Landscape', query: 'landscape' },
  { label: 'Forest', query: 'forest' },
  { label: 'Warrior', query: 'warrior' },
  { label: 'Sci-fi Mech', query: 'sci-fi robot mech' },
];

export const ReferencesPage: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const categories = [
    t('common.all'),
    'Characters',
    'Landscapes',
    'Poses',
    'Color',
    'Concept Art',
  ];

  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
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
  const [hasSearchedDa, setHasSearchedDa] = useState(false);

  // Manual Add Reference modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadTab, setUploadTab] = useState<'upload' | 'url'>('upload');
  const [newCategory, setNewCategory] = useState('Characters');
  const [newTags, setNewTags] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Artwork Detailed Viewer
  const [selectedArtwork, setSelectedArtwork] = useState<ArtworkViewerData | null>(null);

  const fetchUserReferences = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const data = await listReferences(user.uid);
      setReferences(data);
    } catch (err: any) {
      console.error('Failed to list references:', err);
      setError(t('errors.firestoreError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserReferences();
  }, [user]);

  const handleBookmarkToggle = async (id: string) => {
    if (!user) return;
    const target = references.find((r) => r.id === id);
    if (!target) return;

    // Optimistic UI update
    setReferences((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isBookmarked: !item.isBookmarked, bookmarked: !item.isBookmarked } : item
      )
    );

    try {
      await toggleBookmark(user.uid, id, target.isBookmarked);
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
      setReferences((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isBookmarked: target.isBookmarked, bookmarked: target.isBookmarked } : item
        )
      );
    }
  };

  const handleFetchDeviantArt = async (q: string = '') => {
    setDaLoading(true);
    setDaError(null);
    setHasSearchedDa(true);
    try {
      const isAll = selectedCategory === categories[0] || selectedCategory === 'All' || selectedCategory === 'Todos';
      const items = await deviantArtProvider.searchArtworks(q, isAll ? undefined : selectedCategory);
      setDaArtworks(items);
    } catch (err: any) {
      setDaError(err?.message || t('errors.generic'));
    } finally {
      setDaLoading(false);
    }
  };

  const [savedDaIds, setSavedDaIds] = useState<Record<string, boolean>>({});

  const handleSaveDeviantArtReference = async (art: DeviantArtArtwork, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user) return;
    try {
      setSavedDaIds((prev) => ({ ...prev, [art.id]: true }));
      const isAll = selectedCategory === categories[0] || selectedCategory === 'All' || selectedCategory === 'Todos';
      const targetCategory = (art.category && art.category !== 'All') 
        ? art.category 
        : (!isAll ? selectedCategory : 'General');

      const saved = await saveReference(user.uid, {
        title: art.title,
        imageUrl: art.thumbnailUrl,
        source: 'deviantart',
        sourceUrl: art.sourceUrl,
        artistName: art.artist,
        artistProfileUrl: art.artistProfileUrl,
        description: art.description,
        tags: art.tags,
        category: targetCategory,
        bookmarked: true,
        deviantArtId: art.id,
      });

      setReferences((prev) => [saved, ...prev.filter((r) => r.id !== saved.id)]);
    } catch (err: any) {
      setSavedDaIds((prev) => ({ ...prev, [art.id]: false }));
      console.error('Failed to save reference:', err);
    }
  };

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setModalError(t('errors.invalidImage'));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setModalError(t('errors.invalidImage'));
      return;
    }

    setModalError(null);
    setSelectedFile(file);
    setFilePreview(URL.createObjectURL(file));
  };

  const handleAddManualReference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTitle.trim()) return;

    setModalError(null);
    setIsSaving(true);

    try {
      let finalImageUrl = newImageUrl.trim();

      if (uploadTab === 'upload') {
        if (!selectedFile) {
          setModalError(t('upload.dropzone'));
          setIsSaving(false);
          return;
        }

        try {
          const uploadRes = await uploadImageFile(selectedFile, 'references');
          finalImageUrl = uploadRes.url;
        } catch (uploadErr: any) {
          if (uploadErr?.message?.includes('Vercel Blob') || uploadErr?.message?.includes('não configurado')) {
            setModalError('Vercel Blob storage is not configured.');
            setIsSaving(false);
            return;
          }
          throw uploadErr;
        }
      } else {
        if (!finalImageUrl) {
          setModalError(t('errors.invalidImage'));
          setIsSaving(false);
          return;
        }
      }

      const tagsArray = newTags
        .split(',')
        .map((tagVal) => tagVal.trim().replace(/^#/, ''))
        .filter(Boolean);

      const saved = await saveReference(user.uid, {
        title: newTitle.trim(),
        imageUrl: finalImageUrl,
        category: newCategory.trim(),
        tags: tagsArray,
        source: 'manual',
        bookmarked: true,
      });

      setReferences((prev) => [saved, ...prev]);
      setNewTitle('');
      setNewImageUrl('');
      setSelectedFile(null);
      setFilePreview(null);
      setNewTags('');
      setIsAddModalOpen(false);
    } catch (err: any) {
      setModalError(err?.message || t('errors.firestoreError'));
    } finally {
      setIsSaving(false);
    }
  };

  const openViewerForRef = (ref: Reference) => {
    setSelectedArtwork({
      id: ref.id,
      title: ref.title,
      imageUrl: ref.imageUrl,
      artist: ref.artistName,
      artistProfileUrl: ref.artistProfileUrl,
      sourceUrl: ref.sourceUrl,
      category: ref.category,
      description: ref.description,
      tags: ref.tags,
      source: ref.source || 'manual',
      isSaved: true,
    });
  };

  const openViewerForDa = (art: DeviantArtArtwork) => {
    const isSaved = references.some((r) => r.sourceUrl === art.sourceUrl || (r.deviantArtId && r.deviantArtId === art.id));
    setSelectedArtwork({
      id: art.id,
      title: art.title,
      imageUrl: art.thumbnailUrl,
      artist: art.artist,
      artistProfileUrl: art.artistProfileUrl,
      sourceUrl: art.sourceUrl,
      category: art.category,
      description: art.description,
      tags: art.tags,
      publishedTime: art.publishedTime,
      source: 'deviantart',
      isSaved,
    });
  };

  const isCategoryAll = selectedCategory === categories[0] || selectedCategory === 'All' || selectedCategory === 'Todos';
  const filteredByCategory = isCategoryAll ? references : filterReferencesByCategory(references, selectedCategory);
  const filteredReferences = searchSavedReferences(filteredByCategory, searchQuery);

  return (
    <div className="min-h-screen bg-[#191715] text-[#F1E2CB] max-w-[440px] md:max-w-[800px] mx-auto relative pb-28 text-left">
      <AppHeader />

      <main className="px-4 sm:px-5 space-y-4 pt-1">
        {/* Search Bar & Action Buttons */}
        <div className="flex gap-2 items-center">
          <div className="relative flex-1 flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-[#A99D8E]" />
            <input
              type="text"
              placeholder={t('references.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm font-sans bg-[#272320] border border-[#3A332C] rounded-2xl text-[#FDF8F0] placeholder-[#A99D8E] focus:outline-none focus:border-[#D9B98D] transition-colors"
            />
          </div>

          {/* Add Manual Reference */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            aria-label={t('references.addReference')}
            className="p-2.5 rounded-2xl bg-[#272320] border border-[#3A332C] text-[#FDF8F0] hover:bg-[#332E2A] transition-colors shadow-sm cursor-pointer"
            title={t('references.addReference')}
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* DeviantArt Search */}
          <button
            type="button"
            onClick={() => {
              setIsDaModalOpen(true);
              handleFetchDeviantArt(daQuery);
            }}
            aria-label={t('references.saveFromDeviantArt')}
            className="p-2.5 rounded-2xl bg-[#D9B98D] text-[#191715] hover:bg-[#E8DAC7] transition-colors shadow-sm cursor-pointer"
            title={t('references.saveFromDeviantArt')}
          >
            <Sparkles className="w-5 h-5" />
          </button>
        </div>

        {/* Category Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 sm:-mx-5 sm:px-5">
          {categories.map((cat) => (
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
            title={t('references.myReferences')}
            rightElement={
              <div className="p-1.5 rounded-lg bg-[#272320] border border-[#3A332C] text-[#D9B98D]">
                <LayoutGrid className="w-4 h-4" />
              </div>
            }
          />

          {/* 2-Column Responsive Grid */}
          {loading ? (
            <div className="py-12 text-center text-[#A99D8E] text-xs font-sans">
              {t('common.loading')}
            </div>
          ) : error ? (
            <div className="py-12 text-center space-y-3">
              <p className="text-sm font-sans text-red-400">{error}</p>
              <button
                type="button"
                onClick={fetchUserReferences}
                className="px-4 py-2 bg-[#272320] border border-[#433D37] text-[#D9B98D] text-xs font-sans rounded-xl hover:bg-[#332E2A] transition-colors cursor-pointer"
              >
                {t('common.retry')}
              </button>
            </div>
          ) : filteredReferences.length > 0 ? (
            <div className="grid grid-cols-2 gap-3.5">
              {filteredReferences.map((ref) => (
                <div
                  key={ref.id}
                  onClick={() => openViewerForRef(ref)}
                  className="cursor-pointer"
                >
                  <ReferenceCard
                    reference={ref}
                    onBookmarkToggle={handleBookmarkToggle}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-[#A99D8E] space-y-2">
              <p className="text-sm font-sans">{t('references.noReferencesFound')}</p>
              <p className="text-xs font-sans text-[#7A7165]">
                {t('references.noReferencesDesc')}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* DeviantArt Search / Inspiration Modal */}
      {isDaModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-[460px] max-h-[88vh] bg-[#272320] border border-[#433D37] rounded-3xl p-4 sm:p-5 text-[#F1E2CB] shadow-2xl flex flex-col space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#3A332C] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#D9B98D]" />
                <h3 className="font-display text-[20px] font-semibold text-[#FDF8F0]">
                  DeviantArt
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDaModalOpen(false)}
                aria-label={t('common.close')}
                className="text-[#A99D8E] hover:text-[#FDF8F0] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input with Query Expansion */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={language === 'pt-BR' ? 'ex: trem de carga, dragão, castelo...' : 'e.g. freight train, dragon, castle...'}
                value={daQuery}
                onChange={(e) => setDaQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFetchDeviantArt(daQuery)}
                className="flex-1 px-3 py-2 text-xs font-sans bg-[#191715] border border-[#3A332C] rounded-xl text-[#FDF8F0] focus:outline-none focus:border-[#D9B98D]"
              />
              <button
                type="button"
                onClick={() => handleFetchDeviantArt(daQuery)}
                disabled={daLoading}
                className="px-3.5 py-2 bg-[#D9B98D] text-[#191715] text-xs font-sans font-semibold rounded-xl hover:bg-[#E8DAC7] disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
              >
                {daLoading ? t('common.loading') : t('common.search')}
              </button>
            </div>

            {/* Suggestion Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-[10px] font-sans text-[#7A7165] flex-shrink-0">
                {language === 'pt-BR' ? 'Sugestões:' : 'Suggestions:'}
              </span>
              {SEARCH_SUGGESTIONS.map((sug) => (
                <button
                  key={sug.label}
                  type="button"
                  onClick={() => {
                    setDaQuery(sug.query);
                    handleFetchDeviantArt(sug.query);
                  }}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-sans bg-[#191715] hover:bg-[#332E2A] text-[#A99D8E] hover:text-[#FDF8F0] border border-[#3A332C] transition-colors flex-shrink-0 cursor-pointer"
                >
                  {sug.label}
                </button>
              ))}
            </div>

            {daError && (
              <div className="p-3 bg-red-900/40 border border-red-500/40 rounded-xl text-red-200 text-xs font-sans">
                {daError}
              </div>
            )}

            {/* Results Grid */}
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pt-1 pr-1">
              {daLoading ? (
                <div className="py-12 text-center text-xs font-sans text-[#A99D8E] flex flex-col items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-[#D9B98D]" />
                  <span>{t('ai.searching')}</span>
                </div>
              ) : daArtworks.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {daArtworks.map((art) => (
                    <div
                      key={art.id}
                      onClick={() => openViewerForDa(art)}
                      className="bg-[#191715] rounded-xl overflow-hidden border border-[#3A332C] flex flex-col justify-between cursor-pointer hover:border-[#D9B98D]/60 transition-colors group"
                    >
                      <div className="relative aspect-square overflow-hidden bg-black/40">
                        <img
                          src={art.thumbnailUrl}
                          alt={art.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-2 text-left">
                        <h5 className="font-display text-xs font-semibold text-[#FDF8F0] truncate">{art.title}</h5>
                        <p className="text-[10px] font-sans text-[#A99D8E] truncate">{t('home.byArtist')} {art.artist}</p>
                        <button
                          type="button"
                          onClick={(e) => handleSaveDeviantArtReference(art, e)}
                          disabled={Boolean(savedDaIds[art.id])}
                          className={`mt-2 w-full py-1 text-[11px] font-sans font-medium rounded-lg transition-colors cursor-pointer ${
                            savedDaIds[art.id]
                              ? 'bg-[#3A332C] text-[#D9B98D] border border-[#52483E] cursor-default'
                              : 'bg-[#272320] border border-[#433D37] text-[#D9B98D] hover:bg-[#332E2A]'
                          }`}
                        >
                          {savedDaIds[art.id] ? `${t('artwork.savedToReference')} ✓` : t('references.saveReference')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-xs font-sans text-[#A99D8E] space-y-2">
                  {hasSearchedDa ? (
                    <>
                      <p>{t('references.noReferencesFound')}</p>
                    </>
                  ) : (
                    <p>{t('references.saveFromDeviantArt')}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manual Add Reference Modal with Upload & URL tabs */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto no-scrollbar">
          <div className="w-full max-w-[380px] max-h-[90vh] bg-[#272320] border border-[#433D37] rounded-3xl p-5 text-[#F1E2CB] shadow-2xl space-y-4 my-auto text-left">
            <div className="flex items-center justify-between border-b border-[#3A332C] pb-3">
              <h3 className="font-display text-[20px] font-semibold text-[#FDF8F0]">
                {t('references.addReference')}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                aria-label={t('common.close')}
                className="text-[#A99D8E] hover:text-[#FDF8F0] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-900/40 border border-red-500/40 rounded-xl text-red-200 text-xs font-sans">
                {modalError}
              </div>
            )}

            {/* Tab switch: Upload vs URL */}
            <div className="flex bg-[#191715] p-1 rounded-xl border border-[#3A332C]">
              <button
                type="button"
                onClick={() => setUploadTab('upload')}
                className={`flex-1 py-1.5 text-xs font-sans font-medium rounded-lg transition-colors cursor-pointer ${
                  uploadTab === 'upload' ? 'bg-[#272320] text-[#FDF8F0] shadow-sm' : 'text-[#A99D8E]'
                }`}
              >
                {t('references.uploadLocal')}
              </button>
              <button
                type="button"
                onClick={() => setUploadTab('url')}
                className={`flex-1 py-1.5 text-xs font-sans font-medium rounded-lg transition-colors cursor-pointer ${
                  uploadTab === 'url' ? 'bg-[#272320] text-[#FDF8F0] shadow-sm' : 'text-[#A99D8E]'
                }`}
              >
                URL
              </button>
            </div>

            <form onSubmit={handleAddManualReference} className="space-y-3.5 pt-1">
              <div>
                <label className="block text-xs font-sans text-[#A99D8E] mb-1 font-medium">
                  {t('references.titleLabel')} *
                </label>
                <input
                  type="text"
                  placeholder={t('references.titlePlaceholder')}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-sans bg-[#191715] border border-[#3A332C] rounded-xl text-[#FDF8F0] focus:outline-none focus:border-[#D9B98D]"
                  required
                />
              </div>

              {uploadTab === 'upload' ? (
                <div>
                  <label className="block text-xs font-sans text-[#A99D8E] mb-1 font-medium">
                    {t('projects.coverImageLabel')}
                  </label>
                  {filePreview ? (
                    <div className="relative w-full h-32 rounded-xl overflow-hidden bg-[#191715] border border-[#3A332C] group">
                      <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                      <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-xs text-[#FDF8F0] font-sans gap-1.5">
                        <Upload className="w-4 h-4 text-[#D9B98D]" />
                        <span>{t('projects.changeCover')}</span>
                        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileSelection} className="sr-only" />
                      </label>
                    </div>
                  ) : (
                    <label className="w-full h-24 rounded-xl border-2 border-dashed border-[#433D37] hover:border-[#D9B98D] bg-[#191715] flex flex-col items-center justify-center cursor-pointer p-3 transition-colors text-center">
                      <ImageIcon className="w-5 h-5 text-[#A99D8E] mb-1" />
                      <span className="text-xs font-sans text-[#FDF8F0]">{t('upload.dropzone')}</span>
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileSelection} className="sr-only" />
                    </label>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-sans text-[#A99D8E] mb-1 font-medium">
                    URL *
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-sans bg-[#191715] border border-[#3A332C] rounded-xl text-[#FDF8F0] focus:outline-none focus:border-[#D9B98D]"
                    required={uploadTab === 'url'}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-sans text-[#A99D8E] mb-1 font-medium">
                  {t('projects.categoryLabel')}
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-sans bg-[#191715] border border-[#3A332C] rounded-xl text-[#FDF8F0] focus:outline-none focus:border-[#D9B98D]"
                >
                  <option value="Characters">Characters</option>
                  <option value="Landscapes">Landscapes</option>
                  <option value="Poses">Poses</option>
                  <option value="Color">Color</option>
                  <option value="Concept Art">Concept Art</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-sans text-[#A99D8E] mb-1 font-medium">
                  {t('references.tagsLabel')}
                </label>
                <input
                  type="text"
                  placeholder={t('references.tagsPlaceholder')}
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-sans bg-[#191715] border border-[#3A332C] rounded-xl text-[#FDF8F0] focus:outline-none focus:border-[#D9B98D]"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-full border border-[#433D37] text-xs font-sans text-[#A99D8E] hover:bg-[#332E2A] cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded-full bg-[#D9B98D] text-[#191715] font-semibold text-xs font-sans hover:bg-[#E8DAC7] disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  {isSaving ? t('upload.uploading') : t('references.saveReference')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detailed Artwork Viewer */}
      {selectedArtwork && (
        <ArtworkViewer
          artwork={selectedArtwork}
          onClose={() => setSelectedArtwork(null)}
          onReferenceSaved={fetchUserReferences}
        />
      )}

      <BottomNavigation />
    </div>
  );
};
