import React, { useState, useEffect } from 'react';
import { Plus, Folder } from 'lucide-react';
import { AppHeader } from '../components/AppHeader';
import { BottomNavigation } from '../components/BottomNavigation';
import { ProjectCard } from '../components/ProjectCard';
import { ProjectFormModal } from '../components/projects/ProjectFormModal';
import { Project } from '../types';
import { useAuth } from '../hooks/useAuth';
import { listProjects, createProject, updateProject, deleteProject } from '../services/projectService';

export const ProjectsPage: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State for New / Edit Project
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Delete Confirmation Modal State
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    fetchProjects();
  }, [user]);

  const handleOpenCreateModal = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (proj: Project) => {
    setEditingProject(proj);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (formData: {
    title: string;
    description: string;
    category: string;
    progress: number;
    imageUrl: string;
  }) => {
    if (!user) return;

    if (editingProject) {
      // Update existing project
      await updateProject(user.uid, editingProject.id, {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        progress: formData.progress,
        imageUrl: formData.imageUrl,
      });

      setProjects((prev) =>
        prev.map((p) =>
          p.id === editingProject.id
            ? {
                ...p,
                title: formData.title,
                description: formData.description,
                category: formData.category,
                progress: formData.progress,
                imageUrl: formData.imageUrl,
                status: formData.progress === 100 ? 'completed' : 'in_progress',
                updatedAt: new Date(),
              }
            : p
        )
      );
    } else {
      // Create brand new project
      const created = await createProject(user.uid, {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        progress: formData.progress,
        imageUrl: formData.imageUrl,
      });

      setProjects((prev) => [created, ...prev]);
    }
  };

  const handleConfirmDelete = async () => {
    if (!user || !deletingProjectId) return;
    setIsDeleting(true);
    try {
      await deleteProject(user.uid, deletingProjectId);
      setProjects((prev) => prev.filter((p) => p.id !== deletingProjectId));
      setDeletingProjectId(null);
    } catch (err) {
      console.error('Failed to delete project:', err);
      alert('Falha ao excluir o projeto.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#191715] text-[#F1E2CB] max-w-[440px] md:max-w-[800px] mx-auto relative pb-24 text-left">
      <AppHeader />

      <main className="px-4 sm:px-5 space-y-4 pt-1">
        {/* Title & New Project Action Button */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="font-serif text-[24px] font-normal text-[#F1E2CB] leading-tight">
              Meus Projetos
            </h2>
            <p className="text-xs font-sans text-[#A99D8E] mt-0.5">
              Acompanhe sua produção e progresso artístico.
            </p>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#D9B98D] text-[#191715] hover:bg-[#E8DAC7] text-xs font-sans font-medium transition-all shadow-sm active:scale-95 flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Projeto</span>
          </button>
        </div>

        {/* Vertically Stacked Project Cards */}
        {loading ? (
          <div className="py-12 text-center text-[#A99D8E] text-xs">
            Carregando seus projetos...
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
                onEdit={handleOpenEditModal}
                onDelete={(id) => setDeletingProjectId(id)}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-[#A99D8E] space-y-3">
            <Folder className="w-10 h-10 mx-auto text-[#7A7165] opacity-50" />
            <p className="text-sm font-sans">Nenhum projeto cadastrado ainda.</p>
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#272320] border border-[#433D37] rounded-full text-xs font-sans text-[#D9B98D] hover:bg-[#332E2A] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Criar seu primeiro projeto</span>
            </button>
          </div>
        )}
      </main>

      {/* Create / Edit Project Modal */}
      {isModalOpen && (
        <ProjectFormModal
          initialData={editingProject}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingProjectId && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-[340px] bg-[#272320] border border-[#433D37] rounded-3xl p-5 text-[#F1E2CB] shadow-2xl space-y-4 text-left">
            <h3 className="font-serif text-[18px] font-normal text-[#F1E2CB]">
              Excluir Projeto?
            </h3>
            <p className="text-xs font-sans text-[#A99D8E] leading-relaxed">
              Tem certeza de que deseja excluir este projeto? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeletingProjectId(null)}
                disabled={isDeleting}
                className="flex-1 py-2 rounded-full border border-[#433D37] text-xs font-sans text-[#A99D8E] hover:bg-[#332E2A]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold text-xs font-sans transition-colors"
              >
                {isDeleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNavigation />
    </div>
  );
};
