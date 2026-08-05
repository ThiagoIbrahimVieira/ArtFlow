import { describe, it, expect } from 'vitest';
import {
  validateColorMuseRequest,
  getMockColorMusePalette,
} from '../../server/services/colorMuseService';

describe('Color Muse Input & Output Validation', () => {
  it('validates request inputs and cleans data', () => {
    const res = validateColorMuseRequest({
      medium: 'Digital Illustration',
      subject: 'Autumn Character',
      mood: 'Warm & Coziness',
      baseColor: '#d9b98d',
      colorCount: 5,
    });

    expect(res.valid).toBe(true);
    expect(res.cleanData?.baseColor).toBe('#D9B98D');
    expect(res.cleanData?.colorCount).toBe(5);
  });

  it('rejects excessive lengths or invalid color counts', () => {
    const resShort = validateColorMuseRequest({
      medium: '',
      subject: 'Character',
      mood: 'Warm',
      colorCount: 2,
    });
    expect(resShort.valid).toBe(false);
  });

  it('generates structured rule-based palette matching requested colorCount and uppercase HEX format', () => {
    const palette = getMockColorMusePalette({
      medium: 'Oil Painting',
      subject: 'Landscape',
      mood: 'Moody Night',
      colorCount: 4,
    });

    expect(palette.colors.length).toBe(4);
    expect(palette.paletteName).toBe('Moody Night Landscape Palette');
    palette.colors.forEach((color) => {
      expect(color.hex).toMatch(/^#[0-9A-F]{6}$/);
      expect(color.name).toBeTruthy();
      expect(color.role).toBeTruthy();
    });
  });
});
