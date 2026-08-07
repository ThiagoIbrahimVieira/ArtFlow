import React, { useState, useEffect } from 'react';
import { Flame, Star, ChevronRight, Pencil, LogOut } from 'lucide-react';
import { AppHeader } from '../components/AppHeader';
import { BottomNavigation } from '../components/BottomNavigation';
import { ProfileStats } from '../components/ProfileStats';
import { SectionHeader } from '../components/SectionHeader';
import { ArtworkImage } from '../components/ArtworkImage';
import { MOCK_ACHIEVEMENTS, MOCK_ACTIVITIES } from '../data/mockData';
import { useAuth } from '../hooks/useAuth';
import { updateUserProfile } from '../services/userService';
import { listProjects } from '../services/projectService';
import { listReferences } from '../services/referenceService';
import { listPalettes } from '../services/paletteService';

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
  const [isSaving, setIsSaving] = useState(false);

  const [stats, setStats] = useState<{
    projectsCount: number;
    referencesCount: number;
    palettesCount: number;
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (profile?.bio) {
      setBioInput(profile.bio);
    }
  }, [profile]);

  useEffect(() => {
    let isMounted = true;
    async function loadStats() {
      if (!user) return;
      try {
        setStatsLoading(true);
        const [projects, references, palettes] = await Promise.all([
          listProjects(user.uid).catch(() => []),
          listReferences(user.uid).catch(() => []),
          listPalettes(user.uid).catch(() => []),
        ]);
        if (isMounted) {
          setStats({
            projectsCount: projects.length,
            referencesCount: references.length,
            palettesCount: palettes.length,
          });
        }
      } catch (err) {
        console.error('Failed to load profile stats:', err);
        if (isMounted) {
          setStats({ projectsCount: 0, referencesCount: 0, palettesCount: 0 });
        }
      } finally {
        if (isMounted) {
          setStatsLoading(false);
        }
      }
    }
    loadStats();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleSaveBio = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateUserProfile(user.uid, { bio: bioInput });
      await refreshProfile();
      setIsEditingBio(false);
    } catch (err) {
      console.error('Failed to update bio:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUploadClick = () => {
    alert('BLOCKED: O armazenamento de imagens (Firebase Storage) não está configurado no projeto. O avatar de iniciais neutras é utilizado por padrão.');
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
  const bio = profile?.bio || 'Passionate artist creating art on ArtFlow.';
  const avatarUrl = profile?.avatarUrl || null;

  return (
    <div className="min-h-screen bg-[#191715] text-[#F1E2CB] max-w-[440px] mx-auto relative pb-24">
      <AppHeader />

      <main className="px-4 sm:px-5 space-y-5 pt-1">
        {/* Profile Info Card */}
        <div className="w-full bg-[#272320] border border-[#3A332C] rounded-3xl p-4 shadow-md space-y-4">
          <div className="flex items-center gap-4">
            {/* Avatar with edit overlay */}
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 border border-[#433D37] shadow-inner">
              {avatarUrl && (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) ? (
                <ArtworkImage
                  src={avatarUrl}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#191715] flex items-center justify-center border border-[#433D37]">
                  <span className="font-serif text-2xl text-[#D9B98D] tracking-wider font-semibold">
                    {getInitials(name)}
                  </span>
                </div>
              )}
              <button
                onClick={handleImageUploadClick}
                aria-label="Upload profile image"
                className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-[#191715]/80 text-[#F1E2CB] flex items-center justify-center border border-white/20 hover:bg-[#191715]"
              >
                <Pencil className="w-3 h-3" />
              </button>
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0 text-left">
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
                    className="w-full px-2 py-1 text-xs bg-[#191715] border border-[#433D37] rounded-lg text-[#F1E2CB]"
                  />
                  <button
                    onClick={handleSaveBio}
                    disabled={isSaving}
                    className="px-2.5 py-1 text-xs bg-[#F1E2CB] text-[#191715] rounded-lg font-medium hover:bg-[#D9B98D]"
                  >
                    {isSaving ? '...' : 'Save'}
                  </button>
                </div>
              ) : (
                <p className="text-xs font-sans text-[#D9B98D] mt-1.5 line-clamp-2">
                  {bio}
                </p>
              )}
            </div>
          </div>

          {/* Statistics Bar */}
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
            <span>Log Out</span>
          </button>
        </div>

        {/* Achievements Section */}
        <section>
          <SectionHeader title="Achievements" actionText="See All" />

          <div className="grid grid-cols-2 gap-3.5">
            {/* 7 Day Streak */}
            <div className="bg-[#272320] border border-[#3A332C] rounded-2xl p-4 flex flex-col items-center text-center relative overflow-hidden group">
              {/* Subtle background glow */}
              <div className="absolute inset-0 bg-radial from-[#D9B98D]/10 to-transparent opacity-60" />
              <div className="w-12 h-12 rounded-full bg-[#3D2C1E] border border-[#6B4B32] flex items-center justify-center text-[#E5A855] mb-2.5 shadow-sm group-hover:scale-110 transition-transform">
                <Flame className="w-6 h-6 fill-[#E5A855]/30" />
              </div>
              <h4 className="font-serif text-[16px] font-normal text-[#F1E2CB]">
                {MOCK_ACHIEVEMENTS[0].title}
              </h4>
              <p className="text-[11px] font-sans text-[#A99D8E] mt-0.5">
                {MOCK_ACHIEVEMENTS[0].description}
              </p>
            </div>

            {/* 10 Finished Works */}
            <div className="bg-[#272320] border border-[#3A332C] rounded-2xl p-4 flex flex-col items-center text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-radial from-[#F1E2CB]/10 to-transparent opacity-60" />
              <div className="w-12 h-12 rounded-full bg-[#3D3528] border border-[#6B5A3C] flex items-center justify-center text-[#F1E2CB] mb-2.5 shadow-sm group-hover:scale-110 transition-transform">
                <Star className="w-6 h-6 fill-[#F1E2CB]/30" />
              </div>
              <h4 className="font-serif text-[16px] font-normal text-[#F1E2CB]">
                {MOCK_ACHIEVEMENTS[1].title}
              </h4>
              <p className="text-[11px] font-sans text-[#A99D8E] mt-0.5">
                {MOCK_ACHIEVEMENTS[1].description}
              </p>
            </div>
          </div>
        </section>

        {/* Recent Activity Section */}
        <section>
          <SectionHeader title="Recent Activity" actionText="See All" />

          <div className="bg-[#272320] border border-[#3A332C] rounded-2xl divide-y divide-[#3A332C] overflow-hidden">
            {MOCK_ACTIVITIES.map((act) => (
              <div
                key={act.id}
                className="p-3.5 flex items-center justify-between hover:bg-[#332E2A] transition-colors cursor-pointer"
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
                  ) : (
                    <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 border border-[#433D37]">
                      <ArtworkImage
                        src={act.thumbnail}
                        alt={act.targetName}
                        className="w-full h-full object-cover"
                      />
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
                    <span className="text-[10px] font-sans text-[#8C8072]">
                      {act.time}
                    </span>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-[#A99D8E] flex-shrink-0 ml-2" />
              </div>
            ))}
          </div>
        </section>
      </main>

      <BottomNavigation />
    </div>
  );
};
