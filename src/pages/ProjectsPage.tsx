import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { AppHeader } from '../components/AppHeader';
import { BottomNavigation } from '../components/BottomNavigation';
import { ProjectCard } from '../components/ProjectCard';
import { MOCK_PROJECTS, HERO_ARTWORK_URL } from '../data/mockData';
import { Project } from '../types';
import { useAuth } from '../hooks/useAuth';
import { listProjects, createProject, deleteProject } from '../services/projectService';

export const ProjectsPage: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Digital Painting');
  const [isCreating, setIsCreating] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchProjects = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const data = await listProjects(user.uid);
      setProjects(data);
    } catch (err: any) {
      console.error('Failed to load projects:', err);
      setError('Não foi possível carregar os projetos. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (!user) return;
    setLoading(true);
    setError(null);
    listProjects(user.uid)
      .then((data) => {
        if (isMounted) {
          setProjects(data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to load projects:', err);
          setError('Não foi possível carregar os projetos. Verifique sua conexão.');
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

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !user) return;
    setError(null);
    setIsCreating(true);

    try {
      const created = await createProject(user.uid, {
        title: newTitle,
        category: newCategory,
        status: 'sketching',
        progress: 10,
        imageUrl: HERO_ARTWORK_URL,
      });

      setProjects((prev) => [created, ...prev]);
      setNewTitle('');
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to create project.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleMoreClick = async (projectId: string) => {
    if (!user) return;
    if (window.confirm('Would you like to delete this project?')) {
      try {
        await deleteProject(user.uid, projectId);
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
      } catch (err) {
        console.error('Failed to delete project:', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#191715] text-[#F1E2CB] max-w-[440px] mx-auto relative pb-24">
      <AppHeader />

      <main className="px-4 sm:px-5 space-y-4 pt-1">
        {/* Title & New Project Action Button */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-serif text-[24px] font-normal text-[#F1E2CB]">
            My Projects
          </h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F5EBE0] text-[#191715] hover:bg-[#D9B98D] text-xs font-sans font-medium transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>

        {/* Vertically Stacked Project Cards */}
        {loading ? (
          <div className="py-12 text-center text-[#A99D8E] text-xs">
            Loading your projects...
          </div>
        ) : error ? (
          <div className="py-12 text-center space-y-3">
            <p className="text-sm font-sans text-red-400">{error}</p>
            <button
              onClick={fetchProjects}
              className="px-4 py-2 bg-[#272320] border border-[#433D37] text-[#D9B98D] text-xs font-sans rounded-xl hover:bg-[#332E2A] transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        ) : projects.length > 0 ? (
          <div className="space-y-3.5">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onMoreClick={() => handleMoreClick(project.id)}
              />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-[#A99D8E]">
            <p className="text-sm font-sans">No projects yet. Create your first project above!</p>
          </div>
        )}
      </main>

      {/* New Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-[360px] bg-[#272320] border border-[#433D37] rounded-3xl p-5 text-[#F1E2CB] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#3A332C] pb-3">
              <h3 className="font-serif text-[20px] font-normal text-[#F1E2CB]">
                New Project
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#A99D8E] hover:text-[#F1E2CB] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-2.5 bg-red-900/40 border border-red-500/50 rounded-xl text-red-200 text-xs font-sans">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-3.5 pt-1">
              <div>
                <label className="block text-xs font-sans text-[#A99D8E] mb-1">
                  Project Title
                </label>
                <input
                  type="text"
                  placeholder="e.g., Celestial Dragon Study"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
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
                  <option value="Digital Painting">Digital Painting</option>
                  <option value="Environment Design">Environment Design</option>
                  <option value="Illustration">Illustration</option>
                  <option value="Concept Art">Concept Art</option>
                  <option value="Oil Painting">Oil Painting</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-full border border-[#433D37] text-xs font-sans text-[#A99D8E]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 py-2.5 rounded-full bg-[#F1E2CB] text-[#191715] font-semibold text-xs font-sans hover:bg-[#D9B98D] transition-colors"
                >
                  {isCreating ? 'Creating...' : 'Create'}
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
