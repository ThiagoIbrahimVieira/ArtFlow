import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Project, ProjectStatus } from '../types';
import { HERO_ARTWORK_URL } from '../data/mockData';

export interface CreateProjectInput {
  title: string;
  category: string;
  description?: string;
  status?: ProjectStatus;
  progress?: number;
  imageUrl?: string;
  thumbnailUrl?: string | null;
  deadline?: Date | null;
}

export interface UpdateProjectInput {
  title?: string;
  category?: string;
  description?: string;
  status?: ProjectStatus;
  progress?: number;
  imageUrl?: string;
  thumbnailUrl?: string | null;
  deadline?: Date | null;
}

export function validateProject(input: Partial<CreateProjectInput>): { valid: boolean; error?: string } {
  if (input.title !== undefined) {
    const title = input.title.trim();
    if (title.length < 1 || title.length > 100) {
      return { valid: false, error: 'Project title must be between 1 and 100 characters.' };
    }
  }
  if (input.category !== undefined) {
    const cat = input.category.trim();
    if (cat.length < 1 || cat.length > 50) {
      return { valid: false, error: 'Category must be between 1 and 50 characters.' };
    }
  }
  if (input.description !== undefined && input.description !== null) {
    if (input.description.length > 1000) {
      return { valid: false, error: 'Description cannot exceed 1000 characters.' };
    }
  }
  if (input.progress !== undefined) {
    if (typeof input.progress !== 'number' || !Number.isInteger(input.progress) || input.progress < 0 || input.progress > 100) {
      return { valid: false, error: 'Progress must be an integer between 0 and 100.' };
    }
  }
  const validStatuses = new Set(['idea', 'sketching', 'in_progress', 'review', 'completed', 'Sketching', 'In Progress', 'Review', 'Completed']);
  if (input.status !== undefined && !validStatuses.has(input.status)) {
    return { valid: false, error: 'Invalid project status.' };
  }
  return { valid: true };
}

export function normalizeStatus(status?: ProjectStatus): ProjectStatus {
  if (!status) return 'sketching';
  const lower = status.toLowerCase().replace(/\s+/g, '_');
  if (lower === 'in_progress' || status === 'In Progress') return 'in_progress';
  if (lower === 'completed' || status === 'Completed') return 'completed';
  if (lower === 'review' || status === 'Review') return 'review';
  if (lower === 'sketching' || status === 'Sketching') return 'sketching';
  if (lower === 'idea') return 'idea';
  return 'sketching';
}

function mapDocToProject(id: string, data: any): Project {
  return {
    id,
    title: data.title || 'Untitled Project',
    category: data.category || 'Digital Art',
    description: data.description || '',
    status: data.status || 'sketching',
    progress: typeof data.progress === 'number' ? data.progress : 0,
    imageUrl: data.imageUrl || data.thumbnailUrl || HERO_ARTWORK_URL,
    thumbnailUrl: data.thumbnailUrl || data.imageUrl || HERO_ARTWORK_URL,
    deadline: data.deadline instanceof Timestamp ? data.deadline.toDate() : data.deadline || null,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
  };
}

export async function listProjects(uid: string): Promise<Project[]> {
  try {
    const colRef = collection(db, 'users', uid, 'projects');
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => mapDocToProject(d.id, d.data()));
  } catch (error) {
    console.error('Failed to list projects:', error);
    return [];
  }
}

export async function getProject(uid: string, projectId: string): Promise<Project | null> {
  const docRef = doc(db, 'users', uid, 'projects', projectId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return mapDocToProject(snap.id, snap.data());
}

export async function createProject(uid: string, input: CreateProjectInput): Promise<Project> {
  const validation = validateProject(input);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid project data');
  }

  let progress = input.progress !== undefined ? input.progress : 10;
  let status = normalizeStatus(input.status);

  if (status === 'completed') {
    progress = 100;
  } else if (progress === 100) {
    status = 'completed';
  }

  const docData = {
    title: input.title.trim(),
    category: input.category.trim(),
    description: input.description ? input.description.trim() : '',
    status,
    progress,
    thumbnailUrl: input.thumbnailUrl || input.imageUrl || HERO_ARTWORK_URL,
    imageUrl: input.imageUrl || input.thumbnailUrl || HERO_ARTWORK_URL,
    deadline: input.deadline ? Timestamp.fromDate(new Date(input.deadline)) : null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const colRef = collection(db, 'users', uid, 'projects');
  const createdRef = await addDoc(colRef, docData);

  return {
    id: createdRef.id,
    title: docData.title,
    category: docData.category,
    description: docData.description,
    status: docData.status,
    progress: docData.progress,
    imageUrl: docData.imageUrl,
    thumbnailUrl: docData.thumbnailUrl,
    deadline: input.deadline || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function updateProject(uid: string, projectId: string, updates: UpdateProjectInput): Promise<void> {
  const validation = validateProject(updates);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid project update data');
  }

  const allowedUpdates: Record<string, any> = {
    updatedAt: serverTimestamp(),
  };

  if (updates.title !== undefined) allowedUpdates.title = updates.title.trim();
  if (updates.category !== undefined) allowedUpdates.category = updates.category.trim();
  if (updates.description !== undefined) allowedUpdates.description = updates.description.trim();
  
  if (updates.status !== undefined) {
    allowedUpdates.status = normalizeStatus(updates.status);
    if (allowedUpdates.status === 'completed') {
      allowedUpdates.progress = 100;
    }
  }

  if (updates.progress !== undefined) {
    let p = Math.max(0, Math.min(100, Math.round(updates.progress)));
    allowedUpdates.progress = p;
    if (p === 100) {
      allowedUpdates.status = 'completed';
    }
  }

  if (updates.imageUrl !== undefined) allowedUpdates.imageUrl = updates.imageUrl;
  if (updates.thumbnailUrl !== undefined) allowedUpdates.thumbnailUrl = updates.thumbnailUrl;
  if (updates.deadline !== undefined) {
    allowedUpdates.deadline = updates.deadline ? Timestamp.fromDate(new Date(updates.deadline)) : null;
  }

  const docRef = doc(db, 'users', uid, 'projects', projectId);
  await updateDoc(docRef, allowedUpdates);
}

export async function updateProjectProgress(uid: string, projectId: string, progress: number): Promise<void> {
  if (typeof progress !== 'number' || progress < 0 || progress > 100) {
    throw new Error('Progress must be an integer between 0 and 100.');
  }
  const cleanProgress = Math.round(progress);
  const updates: Record<string, any> = {
    progress: cleanProgress,
    updatedAt: serverTimestamp(),
  };
  if (cleanProgress === 100) {
    updates.status = 'completed';
  }
  const docRef = doc(db, 'users', uid, 'projects', projectId);
  await updateDoc(docRef, updates);
}

export async function deleteProject(uid: string, projectId: string): Promise<void> {
  const docRef = doc(db, 'users', uid, 'projects', projectId);
  await deleteDoc(docRef);
}
