import React, { useState, useEffect, useRef } from 'react';
import { Star, CheckCircle, Pencil, LogOut, Loader2 } from 'lucide-react';
import { AppHeader } from '../components/AppHeader';
import { BottomNavigation } from '../components/BottomNavigation';
import { ProfileStats } from '../components/ProfileStats';
import { SectionHeader } from '../components/SectionHeader';
import { ArtworkImage } from '../components/ArtworkImage';
import { Activity, Project } from '../types';
import { useAuth } from '../hooks/useAuth';
import { updateUserProfile, getUserRecentActivities } from '../services/userService';
import { listProjects } from '../services/projectService';
import { listReferences } from '../services/referenceService';
import { listPalettes } from '../services/paletteService';
import { uploadImageFile } from '../services/uploadService';

function getInitials(name: string): string {
  if (!name) return 'A';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const ProfilePage: React.FC = () => {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [isSavingBio, setIsSavingBio] = useState(false);

  const [stats, setStats] = useState<{
    projectsCount: number;
    referencesCount: number;
    palettesCount: number;
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [finishedProjectsCount, setFinishedProjectsCount] = useState<number>(0);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  // Avatar upload state
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  useEffect(() => {
    if (profile?.bio) {
      setBioInput(profile.bio);
    }
  }, [profile]);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (!user) return;
      try {
        setStatsLoading(true);
        setActivitiesLoading(true);

        const [projects, references, palettes, activities] = await Promise.all([
          listProjects(user.uid).catch(() => []),
          listReferences(user.uid).catch(() => []),
          listPalettes(user.uid).catch(() => []),
          getUserRecentActivities(user.uid).catch(() => []),
        ]);

        if (isMounted) {
          setStats({
            projectsCount: projects.length,
            referencesCount: references.length,
            palettesCount: palettes.length,
          });

          const finished = (projects as Project[]).filter((p) => p.progress === 100).length;
          setFinishedProjectsCount(finished);

          setRecentActivities(activities);
        }
      } catch (err) {
        console.error('Failed to load profile data:', err);
        if (isMounted) {
          setStats({ projectsCount: 0, referencesCount: 0, palettesCount: 0 });
          setRecentActivities([]);
        }
      } finally {
        if (isMounted) {
          setStatsLoading(false);
          setActivitiesLoading(false);
        }
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleSaveBio = async () => {
    if (!user) return;
    setIsSavingBio(true);
    try {
      await updateUserProfile(user.uid, { bio: bioInput.trim() });
      await refreshProfile();
      setIsEditingBio(false);
      setStatusMessage({ text: 'Bio atualizada com sucesso!' });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error('Failed to update bio:', err);
      setStatusMessage({ text: 'Falha ao atualizar bio.', isError: true });
    } finally {
      setIsSavingBio(false);
    }
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setStatusMessage({ text: 'Formato inválido. Use JPEG, PNG ou WebP.', isError: true });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage({ text: 'A imagem deve ter no máximo 5 MB.', isError: true });
      return;
    }

    setIsUploadingAvatar(true);
    setStatusMessage(null);

    try {
      const uploadRes = await uploadImageFile(file, 'avatar');
      await updateUserProfile(user.uid, { avatarUrl: uploadRes.url });
      await refreshProfile();
      setStatusMessage({ text: 'Foto de perfil atualizada!' });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      console.warn('Avatar upload error:', err);
      if (err?.message?.includes('Vercel Blob') || err?.message?.includes('não configurado')) {
        setStatusMessage({ text: 'Armazenamento Vercel Blob não configurado na Vercel.', isError: true });
      } else {
        setStatusMessage({ text: err?.message || 'Falha ao atualizar foto de perfil.', isError: true });
      }
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const name = profile?.displayName || profile?.name || user?.displayName || 'Artist';
  const username = profile?.username || '@artist';
  const bio = profile?.bio || 'Artista criando no ArtFlow.';
  const avatarUrl = profile?.avatarUrl || null;

  return (
    <div className="min-h-screen bg-[#191715] text-[#F1E2CB] max-w-[440px] md:max-w-[800px] mx-auto relative pb-24 text-left">
      <AppHeader />

      <main className="px-4 sm:px-5 space-y-5 pt-1">
        {/* Status Toast message */}
        {statusMessage && (
          <div
            className={`p-3 rounded-xl text-xs font-sans border animate-fade-in ${
              statusMessage.isError
                ? 'bg-red-950/50 border-red-500/40 text-red-200'
                : 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {/* Profile Info Card */}
        <div className="w-full bg-[#272320] border border-[#3A332C] rounded-3xl p-4 shadow-md space-y-4">
          <div className="flex items-center gap-4">
            {/* Avatar with upload trigger */}
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 border border-[#433D37] shadow-inner bg-[#191715]">
              {avatarUrl && (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) ? (
                <ArtworkImage
                  src={avatarUrl}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="font-serif text-2xl text-[#D9B98D] tracking-wider font-semibold">
                    {getInitials(name)}
                  </span>
                </div>
              )}

              {isUploadingAvatar ? (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-[#D9B98D] animate-spin" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  aria-label="Upload profile image"
                  className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-[#191715]/90 text-[#F1E2CB] flex items-center justify-center border border-white/20 hover:bg-[#191715] transition-colors"
                  title="Alterar foto de perfil"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              )}

              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarFileChange}
                className="sr-only"
              />
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              <h2 className="font-serif text-[22px] font-normal text-[#F1E2CB] leading-tight truncate">
                {name}
              </h2>
              <p className="text-xs font-sans text-[#A99D8E] mt-0.5">
                {username}
              </p>

              {isEditingBio ? (
                <div className="mt-2 flex gap-1.5">
                  <input
                    type="text"
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    maxLength={200}
                    className="w-full px-2 py-1 text-xs bg-[#191715] border border-[#433D37] rounded-lg text-[#F1E2CB] focus:outline-none focus:border-[#D9B98D]"
                  />
                  <button
                    onClick={handleSaveBio}
                    disabled={isSavingBio}
                    className="px-2.5 py-1 text-xs bg-[#D9B98D] text-[#191715] rounded-lg font-medium hover:bg-[#E8DAC7] disabled:opacity-50"
                  >
                    {isSavingBio ? '...' : 'Salvar'}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <p className="text-xs font-sans text-[#D9B98D] line-clamp-2">
                    {bio}
                  </p>
                  <button
                    onClick={() => setIsEditingBio(true)}
                    className="text-[#A99D8E] hover:text-[#F1E2CB] p-0.5"
                    title="Editar bio"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Real Statistics Bar (0 if empty) */}
          {statsLoading || !stats ? (
            <div className="grid grid-cols-3 gap-2 py-3 bg-[#191715]/60 rounded-2xl border border-[#3A332C]/60 text-center animate-pulse">
              <div className="h-8 bg-[#332E2A] rounded-lg mx-2" />
              <div className="h-8 bg-[#332E2A] rounded-lg mx-2" />
              <div className="h-8 bg-[#332E2A] rounded-lg mx-2" />
            </div>
          ) : (
            <ProfileStats
              projectsCount={stats.projectsCount}
              referencesCount={stats.referencesCount}
              palettesCount={stats.palettesCount}
            />
          )}
        </div>

        {/* Account Actions / Logout */}
        <div className="flex justify-end">
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#272320] border border-[#3A332C] text-[#E06D53] hover:bg-[#332E2A] text-xs font-sans font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Encerrar Sessão</span>
          </button>
        </div>

        {/* Real Achievements Section (Computed from actual data) */}
        <section>
          <SectionHeader title="Conquistas Reais" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Finished Works (computed from real completed projects) */}
            <div className="bg-[#272320] border border-[#3A332C] rounded-2xl p-4 flex items-center gap-3.5 text-left relative overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-[#3D3528] border border-[#6B5A3C] flex items-center justify-center text-[#D9B98D] flex-shrink-0 shadow-sm">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h4 className="font-serif text-[16px] font-normal text-[#F1E2CB]">
                  {finishedProjectsCount} Obras Finalizadas
                </h4>
                <p className="text-[11px] font-sans text-[#A99D8E] mt-0.5">
                  Projetos com 100% de conclusão.
                </p>
              </div>
            </div>

            {/* Total References Saved */}
            <div className="bg-[#272320] border border-[#3A332C] rounded-2xl p-4 flex items-center gap-3.5 text-left relative overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-[#3D2C1E] border border-[#6B4B32] flex items-center justify-center text-[#E5A855] flex-shrink-0 shadow-sm">
                <Star className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h4 className="font-serif text-[16px] font-normal text-[#F1E2CB]">
                  {stats?.referencesCount ?? 0} Referências Salvas
                </h4>
                <p className="text-[11px] font-sans text-[#A99D8E] mt-0.5">
                  Biblioteca visual de inspiração.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Real Recent Activity Section (No mocks) */}
        <section>
          <SectionHeader title="Atividade Recente" />

          {activitiesLoading ? (
            <div className="py-6 text-center text-xs text-[#A99D8E]">
              Carregando atividades...
            </div>
          ) : recentActivities.length > 0 ? (
            <div className="bg-[#272320] border border-[#3A332C] rounded-2xl divide-y divide-[#3A332C] overflow-hidden">
              {recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-3.5 flex items-center justify-between hover:bg-[#332E2A] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Activity Thumbnail */}
                    {act.type === 'palette' ? (
                      <div className="w-11 h-11 rounded-xl bg-[#191715] p-1 grid grid-cols-2 gap-0.5 border border-[#433D37] flex-shrink-0">
                        <div className="bg-[#3D2314] rounded-xs" />
                        <div className="bg-[#B85028] rounded-xs" />
                        <div className="bg-[#D48E28] rounded-xs" />
                        <div className="bg-[#D9B98D] rounded-xs" />
                      </div>
                    ) : act.thumbnail ? (
                      <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 border border-[#433D37] bg-[#191715]">
                        <ArtworkImage
                          src={act.thumbnail}
                          alt={act.targetName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-[#191715] border border-[#433D37] flex items-center justify-center text-[#A99D8E] text-[10px]">
                        Art
                      </div>
                    )}

                    {/* Activity text */}
                    <div className="min-w-0 text-left">
                      <p className="text-[11px] font-sans text-[#A99D8E] truncate">
                        {act.title}
                      </p>
                      <h5 className="font-serif text-[14px] text-[#F1E2CB] font-normal truncate">
                        {act.targetName}
                      </h5>
                      <span className="text-[10px] font-sans text-[#7A7165]">
                        {act.time}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs font-sans text-[#7A7165] bg-[#272320]/40 rounded-2xl border border-[#3A332C]">
              Nenhuma atividade recente registrada ainda.
            </div>
          )}
        </section>
      </main>

      <BottomNavigation />
    </div>
  );
};
