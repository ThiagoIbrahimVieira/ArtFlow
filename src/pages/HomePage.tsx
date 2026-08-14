import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Sparkles, Folder, Bookmark, Palette as PaletteIcon } from 'lucide-react';
import { AppHeader } from '../components/AppHeader';
import { BottomNavigation } from '../components/BottomNavigation';
import { DailyInspirationCard } from '../components/DailyInspirationCard';
import { ProjectCard } from '../components/ProjectCard';
import { ReferenceCard } from '../components/ReferenceCard';
import { PaletteCard } from '../components/PaletteCard';
import { SectionHeader } from '../components/SectionHeader';
import { ArtworkViewer, ArtworkViewerData } from '../components/artwork/ArtworkViewer';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { listProjects } from '../services/projectService';
import { listReferences } from '../services/referenceService';
import { listPalettes } from '../services/paletteService';
import { Project, Reference, Palette, DeviantArtArtwork } from '../types';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [projects, setProjects] = useState<Project[]>([]);
  const [references, setReferences] = useState<Reference[]>([]);
  const [palettes, setPalettes] = useState<Palette[]>([]);
  const [loading, setLoading] = useState(true);

  // Artwork Viewer modal state
  const [selectedArtwork, setSelectedArtwork] = useState<ArtworkViewerData | null>(null);

  const loadHomeData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [projList, refList, palList] = await Promise.all([
        listProjects(user.uid).catch(() => []),
        listReferences(user.uid).catch(() => []),
        listPalettes(user.uid).catch(() => []),
      ]);

      setProjects(projList);
      setReferences(refList);
      setPalettes(palList);
    } catch (err) {
      console.warn('Error loading home data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHomeData();
  }, [user]);

  const handleSelectDailyArtwork = (art: DeviantArtArtwork) => {
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

  const handleSelectSavedReference = (ref: Reference) => {
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

  const paletteOfDay = palettes[0] || null;

  return (
    <div className="min-h-screen bg-[#191715] text-[#F1E2CB] max-w-[440px] md:max-w-[800px] mx-auto relative pb-28 text-left">
      <AppHeader />

      <main className="px-4 sm:px-5 space-y-7 sm:space-y-8 pt-1">
        {/* Real Daily Deviations Inspiration Carousel */}
        <section>
          <DailyInspirationCard onSelectArtwork={handleSelectDailyArtwork} />
        </section>

        {/* Active Projects (User-only, no mocks) */}
        <section>
          <SectionHeader
            title={t('home.activeProjects')}
            onActionClick={() => navigate('/projects')}
          />
          {loading ? (
            <div className="py-6 text-center text-xs text-[#A99D8E]">{t('common.loading')}</div>
          ) : projects.length > 0 ? (
            <div className="flex gap-3.5 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 sm:-mx-5 sm:px-5">
              {projects.slice(0, 4).map((proj) => (
                <ProjectCard
                  key={proj.id}
                  project={proj}
                  variant="compact"
                  onMoreClick={() => navigate('/projects')}
                />
              ))}
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-[#272320]/60 border border-[#3A332C] text-center space-y-2.5">
              <Folder className="w-6 h-6 text-[#A99D8E] mx-auto opacity-60" />
              <p className="text-xs font-sans text-[#A99D8E]">
                {t('home.noActiveProjects')}
              </p>
              <button
                type="button"
                onClick={() => navigate('/projects')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#272320] border border-[#433D37] rounded-full text-xs font-sans font-medium text-[#D9B98D] hover:bg-[#332E2A] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('projects.newProject')}</span>
              </button>
            </div>
          )}
        </section>

        {/* Recent References (User-only, no mocks) */}
        <section>
          <SectionHeader
            title={t('home.recentReferences')}
            onActionClick={() => navigate('/references')}
          />
          {loading ? (
            <div className="py-6 text-center text-xs text-[#A99D8E]">{t('common.loading')}</div>
          ) : references.length > 0 ? (
            <div className="grid grid-cols-2 gap-3.5">
              {references.slice(0, 4).map((ref) => (
                <div key={ref.id} onClick={() => handleSelectSavedReference(ref)} className="cursor-pointer">
                  <ReferenceCard reference={ref} />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-[#272320]/60 border border-[#3A332C] text-center space-y-2.5">
              <Bookmark className="w-6 h-6 text-[#A99D8E] mx-auto opacity-60" />
              <p className="text-xs font-sans text-[#A99D8E]">
                {t('home.noReferences')}
              </p>
              <button
                type="button"
                onClick={() => navigate('/references')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#272320] border border-[#433D37] rounded-full text-xs font-sans font-medium text-[#D9B98D] hover:bg-[#332E2A] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('references.addReference')}</span>
              </button>
            </div>
          )}
        </section>

        {/* Palettes Section */}
        <section>
          <SectionHeader
            title={t('palettes.myPalettes')}
            onActionClick={() => navigate('/palettes')}
          />
          {paletteOfDay ? (
            <PaletteCard palette={paletteOfDay} isFeatured />
          ) : (
            <div className="p-5 rounded-2xl bg-[#272320]/60 border border-[#3A332C] text-center space-y-2.5">
              <PaletteIcon className="w-6 h-6 text-[#A99D8E] mx-auto opacity-60" />
              <p className="text-xs font-sans text-[#A99D8E]">
                {t('palettes.noPalettesDesc')}
              </p>
              <button
                type="button"
                onClick={() => navigate('/ai?intent=create_palette')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#D9B98D] text-[#191715] rounded-full text-xs font-sans font-medium hover:bg-[#E8DAC7] transition-colors shadow-sm cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('palettes.generateWithAI')}</span>
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Artwork Detailed Modal Viewer */}
      {selectedArtwork && (
        <ArtworkViewer
          artwork={selectedArtwork}
          onClose={() => setSelectedArtwork(null)}
          onReferenceSaved={loadHomeData}
        />
      )}

      <BottomNavigation />
    </div>
  );
};
