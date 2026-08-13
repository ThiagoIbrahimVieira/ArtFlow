import { describe, it, expect } from 'vitest';
import { normalizeArtSearchQuery, isVisualArt } from '../services/deviantArtProvider';

describe('DeviantArt Provider - Query Expansion', () => {
  it('translates Portuguese search queries into expanded English art keywords', () => {
    const expanded = normalizeArtSearchQuery('trem de carga');
    expect(expanded).toContain('freighttrain');
    expect(expanded).toContain('train');
    expect(expanded).toContain('locomotive');
  });

  it('translates dragon and fantasy keywords', () => {
    const expanded = normalizeArtSearchQuery('dragão');
    expect(expanded).toContain('dragon');
  });

  it('normalizes accents and whitespace properly', () => {
    const expanded = normalizeArtSearchQuery('  Paisagem com Árvores  ');
    expect(expanded.length).toBeGreaterThan(0);
    expect(expanded).toContain('landscape');
    expect(expanded).toContain('scenery');
    expect(expanded).toContain('trees');
  });

  it('handles unknown single words by cleaning them', () => {
    const expanded = normalizeArtSearchQuery('cyberpunk');
    expect(expanded).toContain('cyberpunk');
  });
});

describe('DeviantArt Provider - Visual Art Filtering', () => {
  it('accepts valid digital and traditional visual artwork with images', () => {
    const item = {
      deviationid: 'dev-1',
      title: 'Epic Dragon Painting',
      author: { username: 'artist_pro' },
      content: { src: 'https://images.deviantart.com/dragon.jpg' },
      category: 'digital art / illustrations',
      is_mature: false,
    };
    expect(isVisualArt(item)).toBe(true);
  });

  it('rejects photography items', () => {
    const photoItem = {
      deviationid: 'dev-2',
      title: 'City Street Photo',
      author: { username: 'photographer' },
      content: { src: 'https://images.deviantart.com/photo.jpg' },
      category: 'photography / street',
      is_mature: false,
    };
    expect(isVisualArt(photoItem)).toBe(false);
  });

  it('rejects literature and poetry items', () => {
    const literatureItem = {
      deviationid: 'dev-3',
      title: 'A Tale of Shadows',
      author: { username: 'writer' },
      category: 'literature / prose / fiction',
      is_mature: false,
    };
    expect(isVisualArt(literatureItem)).toBe(false);
  });

  it('rejects mature content items', () => {
    const matureItem = {
      deviationid: 'dev-4',
      title: 'Sensitive Illustration',
      author: { username: 'nsfw_artist' },
      content: { src: 'https://images.deviantart.com/nsfw.jpg' },
      category: 'digital art',
      is_mature: true,
    };
    expect(isVisualArt(matureItem)).toBe(false);
  });

  it('rejects items with no image content or thumbnail', () => {
    const emptyItem = {
      deviationid: 'dev-5',
      title: 'Just Text Post',
      author: { username: 'blogger' },
      category: 'digital art',
      is_mature: false,
    };
    expect(isVisualArt(emptyItem)).toBe(false);
  });
});
