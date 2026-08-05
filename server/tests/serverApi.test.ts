import { describe, it, expect } from 'vitest';
import { getMockDeviantArtInspiration } from '../services/deviantArtService';

describe('DeviantArt Server Service', () => {
  it('returns normalized inspiration artwork matching response format', () => {
    const res = getMockDeviantArtInspiration('Guardian', 'Digital Art');
    expect(res.items).toBeDefined();
    expect(Array.isArray(res.items)).toBe(true);
    expect(res.items.length).toBeGreaterThan(0);

    const first = res.items[0];
    expect(first.id).toBeTruthy();
    expect(first.title).toBeTruthy();
    expect(first.artist).toBeTruthy();
    expect(first.thumbnailUrl).toBeTruthy();
    expect(first.sourceUrl).toBeTruthy();
  });
});
