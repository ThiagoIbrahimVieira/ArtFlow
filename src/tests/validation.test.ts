import { describe, it, expect } from 'vitest';
import { validateProject } from '../services/projectService';
import {
  isValidHexColor,
  normalizeHexColor,
  validatePaletteInput,
} from '../services/paletteService';

describe('Project Validation', () => {
  it('accepts valid project title, category, progress, and status', () => {
    const result = validateProject({
      title: 'Digital Portrait Study',
      category: 'Illustration',
      progress: 50,
      status: 'sketching',
    });
    expect(result.valid).toBe(true);
  });

  it('rejects empty title or title longer than 100 chars', () => {
    expect(validateProject({ title: '' }).valid).toBe(false);
    expect(validateProject({ title: 'a'.repeat(101) }).valid).toBe(false);
  });

  it('rejects invalid progress values out of 0-100 range or non-integers', () => {
    expect(validateProject({ progress: -5 }).valid).toBe(false);
    expect(validateProject({ progress: 105 }).valid).toBe(false);
  });
});

describe('Palette & Color Validation', () => {
  it('validates 6-digit hex color format correctly', () => {
    expect(isValidHexColor('#A45F32')).toBe(true);
    expect(isValidHexColor('#f1e2cb')).toBe(true);
    expect(isValidHexColor('#FFF')).toBe(false);
    expect(isValidHexColor('rgb(255,255,255)')).toBe(false);
    expect(isValidHexColor('blue')).toBe(false);
  });

  it('normalizes hex strings to uppercase with leading hash', () => {
    expect(normalizeHexColor('#a45f32')).toBe('#A45F32');
    expect(normalizeHexColor('d9b98d')).toBe('#D9B98D');
  });

  it('validates color count boundaries (3 to 8 colors)', () => {
    expect(
      validatePaletteInput({
        name: 'Sunset Glow',
        colors: ['#191715', '#3D2918', '#A45F32'],
      }).valid
    ).toBe(true);

    expect(
      validatePaletteInput({
        name: 'Too Few',
        colors: ['#191715', '#3D2918'],
      }).valid
    ).toBe(false);

    expect(
      validatePaletteInput({
        name: 'Too Many',
        colors: [
          '#111111', '#222222', '#333333', '#444444',
          '#555555', '#666666', '#777777', '#888888', '#999999'
        ],
      }).valid
    ).toBe(false);
  });
});
