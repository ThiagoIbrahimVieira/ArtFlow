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
import { Palette, PaletteColor } from '../types';

export interface CreatePaletteInput {
  name: string;
  category?: string;
  description?: string;
  mood?: string;
  harmony?: string;
  colors: (string | PaletteColor)[];
  usageTips?: string[];
  contrastNotes?: string[];
  generatedBy?: 'manual' | 'gemini';
}

export function isValidHexColor(hex: string): boolean {
  if (typeof hex !== 'string') return false;
  const trimmed = hex.trim();
  return /^#[0-9a-fA-F]{6}$/.test(trimmed);
}

export function normalizeHexColor(hex: string): string {
  const trimmed = hex.trim();
  if (!trimmed.startsWith('#')) {
    return `#${trimmed.toUpperCase()}`;
  }
  return trimmed.toUpperCase();
}

export function validatePaletteInput(input: Partial<CreatePaletteInput>): { valid: boolean; error?: string } {
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (name.length < 1 || name.length > 80) {
      return { valid: false, error: 'Palette name must be between 1 and 80 characters.' };
    }
  }

  if (input.colors !== undefined) {
    if (!Array.isArray(input.colors) || input.colors.length < 1 || input.colors.length > 50) {
      return { valid: false, error: 'Palettes must contain between 1 and 50 colors.' };
    }

    for (let i = 0; i < input.colors.length; i++) {
      const color = input.colors[i];
      const hex = typeof color === 'string' ? color : color?.hex;
      if (!hex || !isValidHexColor(hex)) {
        return { valid: false, error: `Invalid HEX color format at position ${i + 1}. Expected 6-digit hex code like #A45F32.` };
      }
    }
  }

  return { valid: true };
}

export function normalizePaletteColors(colors: (string | PaletteColor)[]): PaletteColor[] {
  return colors.map((c, idx) => {
    if (typeof c === 'string') {
      const normalizedHex = normalizeHexColor(c);
      return {
        hex: normalizedHex,
        name: `Color ${idx + 1}`,
        role: idx === 0 ? 'Primary' : idx === 1 ? 'Secondary' : 'Accent',
      };
    }
    return {
      hex: normalizeHexColor(c.hex),
      name: c.name || `Color ${idx + 1}`,
      role: c.role || 'Tone',
    };
  });
}

function mapDocToPalette(id: string, data: any): Palette {
  const colorsData = data.colors || [];
  const normalizedColors = Array.isArray(colorsData)
    ? colorsData.map((c: any) => (typeof c === 'string' ? c : c.hex || '#000000'))
    : [];

  return {
    id,
    name: data.name || 'Untitled Palette',
    category: data.category || data.mood || 'Warm',
    colors: normalizedColors,
    isSaved: true,
    description: data.description || '',
    mood: data.mood || '',
    harmony: data.harmony || 'Analogous',
    usageTips: data.usageTips || [],
    contrastNotes: data.contrastNotes || [],
    generatedBy: data.generatedBy || 'manual',
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

export async function listPalettes(uid: string): Promise<Palette[]> {
  const colRef = collection(db, 'users', uid, 'palettes');
  const fetchFn = async () => {
    let snap;
    try {
      const q = query(colRef, orderBy('createdAt', 'desc'));
      snap = await getDocs(q);
    } catch {
      snap = await getDocs(colRef);
    }
    return snap.docs.map((d) => mapDocToPalette(d.id, d.data()));
  };
  return withTimeout(fetchFn());
}

export async function getPalette(uid: string, paletteId: string): Promise<Palette | null> {
  const docRef = doc(db, 'users', uid, 'palettes', paletteId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return mapDocToPalette(snap.id, snap.data());
}

export async function createPalette(uid: string, input: CreatePaletteInput): Promise<Palette> {
  const validation = validatePaletteInput(input);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid palette data');
  }

  const structuredColors = normalizePaletteColors(input.colors);

  const docData = {
    name: input.name.trim(),
    category: input.category || input.mood || 'Warm',
    description: input.description ? input.description.trim() : '',
    mood: input.mood ? input.mood.trim() : 'Balanced',
    harmony: input.harmony || 'Custom',
    colors: structuredColors,
    usageTips: input.usageTips || [],
    contrastNotes: input.contrastNotes || [],
    generatedBy: input.generatedBy || 'manual',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const colRef = collection(db, 'users', uid, 'palettes');
  const createdRef = await addDoc(colRef, docData);

  return {
    id: createdRef.id,
    name: docData.name,
    category: docData.category,
    colors: structuredColors.map((c) => c.hex),
    isSaved: true,
    description: docData.description,
    mood: docData.mood,
    harmony: docData.harmony,
    usageTips: docData.usageTips,
    contrastNotes: docData.contrastNotes,
    generatedBy: docData.generatedBy as 'manual' | 'gemini',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function saveGeneratedPalette(
  uid: string,
  generatedPalette: {
    paletteName: string;
    description: string;
    harmony: string;
    colors: Array<{ hex: string; name: string; role: string }>;
    usageTips: string[];
    contrastNotes?: string[];
  }
): Promise<Palette> {
  return createPalette(uid, {
    name: generatedPalette.paletteName,
    description: generatedPalette.description,
    harmony: generatedPalette.harmony,
    colors: generatedPalette.colors,
    usageTips: generatedPalette.usageTips,
    contrastNotes: generatedPalette.contrastNotes || [],
    generatedBy: 'gemini',
  });
}

export async function updatePalette(uid: string, paletteId: string, updates: Partial<CreatePaletteInput>): Promise<void> {
  const validation = validatePaletteInput(updates);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid palette update');
  }

  const allowed: Record<string, any> = {
    updatedAt: serverTimestamp(),
  };

  if (updates.name !== undefined) allowed.name = updates.name.trim();
  if (updates.description !== undefined) allowed.description = updates.description.trim();
  if (updates.category !== undefined) allowed.category = updates.category.trim();
  if (updates.mood !== undefined) allowed.mood = updates.mood.trim();
  if (updates.harmony !== undefined) allowed.harmony = updates.harmony.trim();
  if (updates.colors !== undefined) {
    allowed.colors = normalizePaletteColors(updates.colors);
  }

  const docRef = doc(db, 'users', uid, 'palettes', paletteId);
  await updateDoc(docRef, allowed);
}

export async function deletePalette(uid: string, paletteId: string): Promise<void> {
  const docRef = doc(db, 'users', uid, 'palettes', paletteId);
  await deleteDoc(docRef);
}
