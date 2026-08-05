import { doc, getDoc, setDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';

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

  const defaultAvatar = data.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80';

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
      avatarUrl: data.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
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
