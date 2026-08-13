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

export interface CreateProjectInput {
  title: string;
  category: string;
  description?: string;
  status?: ProjectStatus;
  progress?: number;
  imageUrl?: string;
  imagePath?: string | null;
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
  imagePath?: string | null;
  thumbnailUrl?: string | null;
  deadline?: Date | null;
}

export function validateProject(input: Partial<CreateProjectInput>): { valid: boolean; error?: string } {
  if (input.title !== undefined) {
    const title = input.title.trim();
    if (title.length < 1 || title.length > 100) {
      return { valid: false, error: 'O título do projeto deve ter entre 1 e 100 caracteres.' };
    }
  }
  if (input.category !== undefined) {
    const cat = input.category.trim();
    if (cat.length < 1 || cat.length > 60) {
      return { valid: false, error: 'A categoria deve ter entre 1 e 60 caracteres.' };
    }
  }
  if (input.description !== undefined && input.description !== null) {
    if (input.description.length > 1000) {
      return { valid: false, error: 'A descrição não pode exceder 1000 caracteres.' };
    }
  }
  if (input.progress !== undefined) {
    if (typeof input.progress !== 'number' || !Number.isInteger(input.progress) || input.progress < 0 || input.progress > 100) {
      return { valid: false, error: 'O progresso deve ser um valor inteiro entre 0 e 100.' };
    }
  }
  const validStatuses = new Set(['idea', 'sketching', 'in_progress', 'review', 'completed', 'Sketching', 'In Progress', 'Review', 'Completed']);
  if (input.status !== undefined && !validStatuses.has(input.status)) {
    return { valid: false, error: 'Status de projeto inválido.' };
  }
  return { valid: true };
}

export function normalizeStatus(status?: ProjectStatus, progress?: number): ProjectStatus {
  if (progress === 100) return 'completed';
  if (progress === 0) return 'idea';
  if (!status) return 'in_progress';
  const lower = status.toLowerCase().replace(/\s+/g, '_');
  if (lower === 'completed') return 'completed';
  if (lower === 'in_progress') return 'in_progress';
  if (lower === 'review') return 'review';
  if (lower === 'sketching') return 'sketching';
  if (lower === 'idea') return 'idea';
  return 'in_progress';
}

function mapDocToProject(id: string, data: any): Project {
  return {
    id,
    title: data.title || 'Untitled Project',
    category: data.category || 'Digital Art',
    description: data.description || '',
    status: data.status || 'in_progress',
    progress: typeof data.progress === 'number' ? data.progress : 0,
    imageUrl: data.imageUrl || data.thumbnailUrl || '',
    imagePath: data.imagePath || null,
    thumbnailUrl: data.thumbnailUrl || data.imageUrl || '',
    deadline: data.deadline instanceof Timestamp ? data.deadline.toDate() : data.deadline || null,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
  };
}

async function withTimeout<T>(promise: Promise<T>, ms: number = 7000): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error('FIRESTORE_TIMEOUT')), ms);
  });
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    return result;
  } finally {
    clearTimeout(timer);
  }
}

export async function listProjects(uid: string): Promise<Project[]> {
  const colRef = collection(db, 'users', uid, 'projects');
  const fetchFn = async () => {
    let snap;
    try {
      const q = query(colRef, orderBy('createdAt', 'desc'));
      snap = await getDocs(q);
    } catch {
      snap = await getDocs(colRef);
    }
    return snap.docs.map((d) => mapDocToProject(d.id, d.data()));
  };
  return withTimeout(fetchFn());
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

  const progress = input.progress !== undefined ? Math.max(0, Math.min(100, Math.round(input.progress))) : 0;
  const status = normalizeStatus(input.status, progress);

  const docData = {
    title: input.title.trim(),
    category: input.category.trim(),
    description: input.description ? input.description.trim() : '',
    status,
    progress,
    thumbnailUrl: input.thumbnailUrl || input.imageUrl || '',
    imageUrl: input.imageUrl || input.thumbnailUrl || '',
    imagePath: input.imagePath || null,
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
    imagePath: docData.imagePath,
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

  let targetProgress: number | undefined;
  if (updates.progress !== undefined) {
    targetProgress = Math.max(0, Math.min(100, Math.round(updates.progress)));
    allowedUpdates.progress = targetProgress;
  }

  if (updates.status !== undefined || targetProgress !== undefined) {
    allowedUpdates.status = normalizeStatus(updates.status, targetProgress);
  }

  if (updates.imageUrl !== undefined) {
    allowedUpdates.imageUrl = updates.imageUrl;
    allowedUpdates.thumbnailUrl = updates.thumbnailUrl || updates.imageUrl;
  }
  if (updates.imagePath !== undefined) allowedUpdates.imagePath = updates.imagePath;
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
    status: normalizeStatus(undefined, cleanProgress),
    updatedAt: serverTimestamp(),
  };
  const docRef = doc(db, 'users', uid, 'projects', projectId);
  await updateDoc(docRef, updates);
}

export async function deleteProject(uid: string, projectId: string): Promise<void> {
  const docRef = doc(db, 'users', uid, 'projects', projectId);
  await deleteDoc(docRef);
}
