import { doc, getDoc, setDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, Activity } from '../types';
import { listProjects } from './projectService';
import { listReferences } from './referenceService';
import { listPalettes } from './paletteService';

const RESERVED_USERNAMES = new Set([
  'admin', 'administrator', 'support', 'help', 'artflow', 'official',
  'system', 'root', 'user', 'moderator', 'null', 'undefined'
]);

export function validateUsername(username: string): { valid: boolean; error?: string } {
  const trimmed = username.trim();
  if (trimmed.length < 3 || trimmed.length > 24) {
    return { valid: false, error: 'Username must be between 3 and 24 characters.' };
  }
  if (!/^[a-z0-9_]+$/.test(trimmed)) {
    return { valid: false, error: 'Username can only contain lowercase letters, numbers, and underscores.' };
  }
  if (RESERVED_USERNAMES.has(trimmed.toLowerCase())) {
    return { valid: false, error: 'This username is reserved.' };
  }
  return { valid: true };
}

export async function generateAvailableUsername(displayName: string, email: string): Promise<string> {
  const base = (displayName || email.split('@')[0] || 'artist')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .substring(0, 18);
  
  const cleanBase = base.length >= 3 ? base : `${base}_art`;
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const username = `${cleanBase}_${randomSuffix}`;

  const validation = validateUsername(username);
  if (!validation.valid) {
    return `artist_${Date.now().toString().slice(-6)}`;
  }
  return username;
}

export async function createUserProfile(
  uid: string,
  data: {
    displayName: string;
    email: string;
    username?: string;
    avatarUrl?: string | null;
    bio?: string;
  }
): Promise<UserProfile> {
  const normalizedEmail = data.email.trim().toLowerCase();
  const username = data.username
    ? data.username.toLowerCase().trim()
    : await generateAvailableUsername(data.displayName, normalizedEmail);

  const validation = validateUsername(username);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid username');
  }

  const profileRef = doc(db, 'users', uid);
  const existingDoc = await getDoc(profileRef);

  if (existingDoc.exists()) {
    const existingData = existingDoc.data();
    return {
      uid,
      displayName: existingData.displayName || data.displayName,
      name: existingData.displayName || data.displayName,
      email: existingData.email || normalizedEmail,
      username: existingData.username || username,
      avatarUrl: existingData.avatarUrl || data.avatarUrl || null,
      bio: existingData.bio || data.bio || 'Passionate artist creating art on ArtFlow.',
      createdAt: existingData.createdAt,
      updatedAt: existingData.updatedAt,
    };
  }

  const defaultAvatar = data.avatarUrl || null;

  const newProfile = {
    displayName: data.displayName.trim(),
    email: normalizedEmail,
    username,
    avatarUrl: defaultAvatar,
    bio: data.bio || 'Passionate artist creating art on ArtFlow.',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(profileRef, newProfile);

  return {
    uid,
    displayName: newProfile.displayName,
    name: newProfile.displayName,
    email: newProfile.email,
    username: newProfile.username,
    avatarUrl: newProfile.avatarUrl,
    bio: newProfile.bio,
    projectsCount: 0,
    referencesCount: 0,
    palettesCount: 0,
  };
}

export async function ensureUserProfile(
  uid: string,
  data: {
    displayName: string;
    email: string;
  }
): Promise<UserProfile | null> {
  try {
    return await createUserProfile(uid, data);
  } catch (err) {
    console.error('ensureUserProfile error (non-fatal):', err);
    return null;
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const profileRef = doc(db, 'users', uid);
    const snap = await getDoc(profileRef);
    if (!snap.exists()) {
      return null;
    }
    const data = snap.data();
    return {
      uid,
      displayName: data.displayName || 'Artist',
      name: data.displayName || 'Artist',
      email: data.email || '',
      username: data.username ? `@${data.username.replace(/^@/, '')}` : '@artist',
      avatarUrl: data.avatarUrl || null,
      bio: data.bio || '',
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<{
    displayName: string;
    username: string;
    avatarUrl: string | null;
    bio: string;
  }>
): Promise<Partial<UserProfile>> {
  const allowedUpdates: Record<string, any> = {
    updatedAt: serverTimestamp(),
  };

  if (updates.displayName !== undefined) {
    allowedUpdates.displayName = updates.displayName.trim();
  }
  if (updates.bio !== undefined) {
    allowedUpdates.bio = updates.bio.trim();
  }
  if (updates.avatarUrl !== undefined) {
    allowedUpdates.avatarUrl = updates.avatarUrl;
  }
  if (updates.username !== undefined) {
    const rawUsername = updates.username.replace(/^@/, '').toLowerCase().trim();
    const validation = validateUsername(rawUsername);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid username');
    }
    allowedUpdates.username = rawUsername;
  }

  const profileRef = doc(db, 'users', uid);
  await updateDoc(profileRef, allowedUpdates);

  return updates;
}

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export async function getUserRecentActivities(uid: string): Promise<Activity[]> {
  try {
    const [projects, references, palettes] = await Promise.all([
      listProjects(uid).catch(() => []),
      listReferences(uid).catch(() => []),
      listPalettes(uid).catch(() => []),
    ]);

    const activities: Activity[] = [];

    for (const p of projects) {
      const d = p.updatedAt ? new Date(p.updatedAt) : p.createdAt ? new Date(p.createdAt) : new Date();
      activities.push({
        id: `act_p_${p.id}`,
        title: p.progress === 100 ? 'Completed project' : 'Updated project',
        targetName: p.title,
        time: formatRelativeTime(d),
        thumbnail: p.imageUrl || p.thumbnailUrl || '',
        type: 'project',
        rawDate: d,
      });
    }

    for (const r of references) {
      const d = r.createdAt ? new Date(r.createdAt) : new Date();
      activities.push({
        id: `act_r_${r.id}`,
        title: 'Saved reference',
        targetName: r.title,
        time: formatRelativeTime(d),
        thumbnail: r.imageUrl || '',
        type: 'reference',
        rawDate: d,
      });
    }

    for (const pal of palettes) {
      const d = pal.createdAt ? new Date(pal.createdAt) : new Date();
      activities.push({
        id: `act_pal_${pal.id}`,
        title: pal.generatedBy === 'gemini' ? 'Generated palette' : 'Created palette',
        targetName: pal.name,
        time: formatRelativeTime(d),
        thumbnail: '',
        type: 'palette',
        rawDate: d,
      });
    }

    activities.sort((a, b) => (b.rawDate?.getTime() || 0) - (a.rawDate?.getTime() || 0));

    return activities.slice(0, 10);
  } catch (err) {
    console.error('Failed to load recent activities:', err);
    return [];
  }
}
