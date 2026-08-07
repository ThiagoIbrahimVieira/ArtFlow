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
import { Reference } from '../types';

export interface SaveReferenceInput {
  title: string;
  imageUrl: string;
  source?: 'manual' | 'deviantart';
  sourceUrl?: string | null;
  artistName?: string | null;
  category?: string;
  bookmarked?: boolean;
  deviantArtId?: string | null;
}

function mapDocToReference(id: string, data: any): Reference {
  return {
    id,
    title: data.title || 'Saved Reference',
    imageUrl: data.imageUrl || '',
    source: data.source || 'manual',
    sourceUrl: data.sourceUrl || null,
    artistName: data.artistName || null,
    category: data.category || 'General',
    isBookmarked: data.bookmarked ?? data.isBookmarked ?? true,
    bookmarked: data.bookmarked ?? data.isBookmarked ?? true,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
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

export async function listReferences(uid: string): Promise<Reference[]> {
  const colRef = collection(db, 'users', uid, 'references');
  const fetchFn = async () => {
    let snap;
    try {
      const q = query(colRef, orderBy('createdAt', 'desc'));
      snap = await getDocs(q);
    } catch {
      snap = await getDocs(colRef);
    }
    return snap.docs.map((d) => mapDocToReference(d.id, d.data()));
  };
  return withTimeout(fetchFn());
}

export async function getReference(uid: string, referenceId: string): Promise<Reference | null> {
  const docRef = doc(db, 'users', uid, 'references', referenceId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return mapDocToReference(snap.id, snap.data());
}

export async function saveReference(uid: string, input: SaveReferenceInput): Promise<Reference> {
  if (!input.title || input.title.trim().length === 0) {
    throw new Error('Reference title is required.');
  }
  if (!input.imageUrl || input.imageUrl.trim().length === 0) {
    throw new Error('Image URL is required.');
  }

  const existing = await listReferences(uid);
  const isDuplicate = existing.some((ref) => {
    if (input.sourceUrl && ref.sourceUrl && ref.sourceUrl === input.sourceUrl) {
      return true;
    }
    if (input.imageUrl && ref.imageUrl === input.imageUrl) {
      return true;
    }
    return false;
  });

  if (isDuplicate) {
    const existingMatch = existing.find(
      (ref) => ref.sourceUrl === input.sourceUrl || ref.imageUrl === input.imageUrl
    );
    if (existingMatch) {
      return existingMatch;
    }
  }

  const docData = {
    title: input.title.trim(),
    imageUrl: input.imageUrl.trim(),
    source: input.source || 'manual',
    sourceUrl: input.sourceUrl || null,
    artistName: input.artistName || null,
    category: input.category ? input.category.trim() : 'General',
    bookmarked: input.bookmarked !== undefined ? input.bookmarked : true,
    deviantArtId: input.deviantArtId || null,
    createdAt: serverTimestamp(),
  };

  const colRef = collection(db, 'users', uid, 'references');
  const createdRef = await addDoc(colRef, docData);

  return {
    id: createdRef.id,
    title: docData.title,
    imageUrl: docData.imageUrl,
    source: docData.source,
    sourceUrl: docData.sourceUrl,
    artistName: docData.artistName,
    category: docData.category,
    isBookmarked: docData.bookmarked,
    bookmarked: docData.bookmarked,
    createdAt: new Date(),
  };
}

export async function updateReference(
  uid: string,
  referenceId: string,
  updates: Partial<SaveReferenceInput>
): Promise<void> {
  const allowed: Record<string, any> = {};
  if (updates.title !== undefined) allowed.title = updates.title.trim();
  if (updates.category !== undefined) allowed.category = updates.category.trim();
  if (updates.imageUrl !== undefined) allowed.imageUrl = updates.imageUrl.trim();
  if (updates.bookmarked !== undefined) allowed.bookmarked = updates.bookmarked;

  const docRef = doc(db, 'users', uid, 'references', referenceId);
  await updateDoc(docRef, allowed);
}

export async function toggleBookmark(uid: string, referenceId: string, currentBookmarkedState: boolean): Promise<boolean> {
  const newState = !currentBookmarkedState;
  const docRef = doc(db, 'users', uid, 'references', referenceId);
  await updateDoc(docRef, { bookmarked: newState });
  return newState;
}

export async function removeReference(uid: string, referenceId: string): Promise<void> {
  const docRef = doc(db, 'users', uid, 'references', referenceId);
  await deleteDoc(docRef);
}

export function searchSavedReferences(references: Reference[], queryText: string): Reference[] {
  if (!queryText.trim()) return references;
  const q = queryText.toLowerCase().trim();
  return references.filter(
    (ref) =>
      ref.title.toLowerCase().includes(q) ||
      ref.category.toLowerCase().includes(q) ||
      (ref.artistName && ref.artistName.toLowerCase().includes(q))
  );
}

export function filterReferencesByCategory(references: Reference[], category: string): Reference[] {
  if (!category || category === 'All') return references;
  return references.filter(
    (ref) => ref.category.toLowerCase() === category.toLowerCase()
  );
}
