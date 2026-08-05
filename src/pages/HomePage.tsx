import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { BottomNavigation } from '../components/BottomNavigation';
import { DailyInspirationCard } from '../components/DailyInspirationCard';
import { ProjectCard } from '../components/ProjectCard';
import { ReferenceCard } from '../components/ReferenceCard';
import { PaletteCard } from '../components/PaletteCard';
import { SectionHeader } from '../components/SectionHeader';
import { MOCK_PROJECTS, MOCK_REFERENCES, MOCK_PALETTES } from '../data/mockData';
import { useAuth } from '../hooks/useAuth';
import { listProjects } from '../services/projectService';
import { listReferences } from '../services/referenceService';
import { listPalettes } from '../services/paletteService';
import { Project, Reference, Palette } from '../types';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [promptMessage, setPromptMessage] = useState<string | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [references, setReferences] = useState<Reference[]>([]);
  const [palettes, setPalettes] = useState<Palette[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadHomeData() {
      if (!user) return;
      try {
        const [fetchedProjects, fetchedReferences, fetchedPalettes] = await Promise.all([
          listProjects(user.uid),
          listReferences(user.uid),
          listPalettes(user.uid),
        ]);

        if (isMounted) {
          setProjects(fetchedProjects.length > 0 ? fetchedProjects.slice(0, 2) : MOCK_PROJECTS.slice(3, 5));
          setReferences(fetchedReferences.length > 0 ? fetchedReferences.slice(0, 2) : MOCK_REFERENCES.slice(0, 2));
          setPalettes(fetchedPalettes.length > 0 ? fetchedPalettes : MOCK_PALETTES);
        }
      } catch (err) {
        console.error('Error loading home data:', err);
        if (isMounted) {
          setProjects(MOCK_PROJECTS.slice(3, 5));
          setReferences(MOCK_REFERENCES.slice(0, 2));
          setPalettes(MOCK_PALETTES);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadHomeData();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const paletteOfDay = palettes[0] || MOCK_PALETTES[0];

  const handleViewPrompt = () => {
    setPromptMessage("Daily Challenge: Use warm ochres, burned siennas, terracotta, and soft creams to draw a character with autumn lighting!");
    setTimeout(() => setPromptMessage(null), 5000);
  };

  return (
    <div className="min-h-screen bg-[#191715] text-[#F1E2CB] max-w-[440px] mx-auto relative pb-24">
      <AppHeader />

      <main className="px-4 sm:px-5 space-y-6 pt-1">
        {/* Daily Inspiration Toast notification if active */}
        {promptMessage && (
          <div className="p-3 bg-[#D9B98D] text-[#191715] text-xs font-sans rounded-2xl shadow-lg border border-[#F1E2CB] animate-fade-in">
            {promptMessage}
          </div>
        )}

        {/* Hero Daily Inspiration */}
        <section>
          <DailyInspirationCard onViewPrompt={handleViewPrompt} />
        </section>

        {/* Active Projects */}
        <section>
          <SectionHeader
            title="Active Projects"
            onActionClick={() => navigate('/projects')}
          />
          {loading ? (
            <div className="py-6 text-center text-xs text-[#A99D8E]">Loading projects...</div>
          ) : (
            <div className="flex gap-3.5 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 sm:-mx-5 sm:px-5">
              {projects.map((proj) => (
                <ProjectCard
                  key={proj.id}
                  project={proj}
                  variant="compact"
                />
              ))}
            </div>
          )}
        </section>

        {/* Recent References */}
        <section>
          <SectionHeader
            title="Recent References"
            onActionClick={() => navigate('/references')}
          />
          {loading ? (
            <div className="py-6 text-center text-xs text-[#A99D8E]">Loading references...</div>
          ) : (
            <div className="grid grid-cols-2 gap-3.5">
              {references.map((ref) => (
                <ReferenceCard key={ref.id} reference={ref} />
              ))}
            </div>
          )}
        </section>

        {/* Palette of the Day */}
        <section>
          <SectionHeader
            title="Palette of the Day"
            onActionClick={() => navigate('/palettes')}
          />
          <PaletteCard palette={paletteOfDay} isFeatured />
        </section>
      </main>

      <BottomNavigation />
    </div>
  );
};
