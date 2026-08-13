import { describe, it, expect } from 'vitest';
import { validateProject, normalizeStatus } from '../services/projectService';
import { validateUploadFile } from '../services/uploadService';
import { searchSavedReferences, filterReferencesByCategory } from '../services/referenceService';
import { Reference } from '../types';

describe('Project Validation & Status Normalization', () => {
  it('validates correct project data with custom category and valid progress', () => {
    const result = validateProject({
      title: 'Dark Fantasy Knight',
      category: 'Concept Art / Character',
      description: 'Armor study and rendering.',
      progress: 75,
    });
    expect(result.valid).toBe(true);
  });

  it('rejects empty project title', () => {
    const result = validateProject({
      title: '   ',
      category: 'Illustration',
    });
    expect(result.valid).toBe(false);
  });

  it('rejects progress outside 0-100 range', () => {
    const resultBelow = validateProject({ progress: -5 });
    const resultAbove = validateProject({ progress: 150 });
    expect(resultBelow.valid).toBe(false);
    expect(resultAbove.valid).toBe(false);
  });

  it('normalizes status correctly when progress is 100%', () => {
    expect(normalizeStatus('in_progress', 100)).toBe('completed');
    expect(normalizeStatus('sketching', 100)).toBe('completed');
  });

  it('normalizes status correctly when progress is 0%', () => {
    expect(normalizeStatus('in_progress', 0)).toBe('idea');
  });
});

describe('Upload Service Validation', () => {
  it('validates allowed image types and size', () => {
    const file = new File(['fake-image-data'], 'artwork.png', { type: 'image/png' });
    expect(() => validateUploadFile(file)).not.toThrow();
  });

  it('throws for disallowed mime types (e.g. pdf, exe, text)', () => {
    const pdfFile = new File(['fake-pdf'], 'document.pdf', { type: 'application/pdf' });
    expect(() => validateUploadFile(pdfFile)).toThrow(/Formato de arquivo não suportado/);
  });

  it('throws for files larger than 5MB', () => {
    const bigData = new Uint8Array(6 * 1024 * 1024);
    const bigFile = new File([bigData], 'large.jpg', { type: 'image/jpeg' });
    expect(() => validateUploadFile(bigFile)).toThrow(/excede o limite máximo/);
  });
});

describe('Reference Search & Filter', () => {
  const mockReferences: Reference[] = [
    {
      id: 'ref-1',
      title: 'Gothic Cathedral Study',
      imageUrl: 'https://img.com/1.jpg',
      category: 'Architecture',
      artistName: 'Hans Painter',
      tags: ['gothic', 'cathedral', 'lighting'],
      isBookmarked: true,
      bookmarked: true,
    },
    {
      id: 'ref-2',
      title: 'Cyberpunk Samurai',
      imageUrl: 'https://img.com/2.jpg',
      category: 'Characters',
      artistName: 'Neo Artist',
      tags: ['cyberpunk', 'neon', 'blade'],
      isBookmarked: false,
      bookmarked: false,
    },
  ];

  it('searches references by title, artist, or tags', () => {
    expect(searchSavedReferences(mockReferences, 'cathedral')).toHaveLength(1);
    expect(searchSavedReferences(mockReferences, 'neo')).toHaveLength(1);
    expect(searchSavedReferences(mockReferences, 'blade')).toHaveLength(1);
    expect(searchSavedReferences(mockReferences, 'nonexistent')).toHaveLength(0);
  });

  it('filters references by category', () => {
    expect(filterReferencesByCategory(mockReferences, 'Architecture')).toHaveLength(1);
    expect(filterReferencesByCategory(mockReferences, 'All')).toHaveLength(2);
  });
});
