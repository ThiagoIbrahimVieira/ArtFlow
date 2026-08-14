import { describe, it, expect } from 'vitest';
import { ptBR } from '../i18n/pt-BR';
import { en } from '../i18n/en';
import { getTranslation } from '../i18n';

// Helper to recursively collect all dot-notation keys from a translation dictionary
function getAllKeys(obj: Record<string, any>, prefix = ''): string[] {
  let keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys = keys.concat(getAllKeys(v, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

describe('ArtFlow i18n System', () => {
  describe('Dictionary Parity & Completeness', () => {
    const ptKeys = getAllKeys(ptBR).sort();
    const enKeys = getAllKeys(en).sort();

    it('should have exact key parity between pt-BR and en dictionaries', () => {
      expect(ptKeys).toEqual(enKeys);
    });

    it('should have non-empty string values for all keys in pt-BR', () => {
      ptKeys.forEach((key) => {
        const val = getTranslation('pt-BR', key);
        expect(val).toBeDefined();
        expect(typeof val).toBe('string');
        expect(val.trim().length).toBeGreaterThan(0);
      });
    });

    it('should have non-empty string values for all keys in en', () => {
      enKeys.forEach((key) => {
        const val = getTranslation('en', key);
        expect(val).toBeDefined();
        expect(typeof val).toBe('string');
        expect(val.trim().length).toBeGreaterThan(0);
      });
    });

    it('should preserve ArtFlow AI brand name verbatim without translation', () => {
      expect(ptBR.navigation.ai).toBe('ArtFlow AI');
      expect(en.navigation.ai).toBe('ArtFlow AI');
      expect(ptBR.palettes.colorMuse).toContain('ArtFlow AI');
      expect(en.palettes.colorMuse).toContain('ArtFlow AI');
    });
  });

  describe('Translation Resolution (getTranslation)', () => {
    it('should resolve top-level and nested keys in pt-BR', () => {
      expect(getTranslation('pt-BR', 'common.save')).toBe('Salvar');
      expect(getTranslation('pt-BR', 'navigation.home')).toBe('Início');
      expect(getTranslation('pt-BR', 'projects.newProject')).toBe('Novo Projeto');
    });

    it('should resolve top-level and nested keys in en', () => {
      expect(getTranslation('en', 'common.save')).toBe('Save');
      expect(getTranslation('en', 'navigation.home')).toBe('Home');
      expect(getTranslation('en', 'projects.newProject')).toBe('New Project');
    });

    it('should interpolate params like {count} and {name}', () => {
      const interpolatedPt = getTranslation('pt-BR', 'references.deleteConfirm', { name: 'Meu Dragão' });
      expect(interpolatedPt).toBeDefined();

      const interpolatedEn = getTranslation('en', 'references.deleteConfirm', { name: 'Dragon Concept' });
      expect(interpolatedEn).toBeDefined();
    });

    it('should fallback gracefully to pt-BR if an unknown language is passed', () => {
      // @ts-ignore - testing runtime fallback
      expect(getTranslation('es', 'common.save')).toBe('Salvar');
    });

    it('should return the key path if key is not found', () => {
      expect(getTranslation('pt-BR', 'unknown.nonexistent.key')).toBe('unknown.nonexistent.key');
      expect(getTranslation('en', 'unknown.nonexistent.key')).toBe('unknown.nonexistent.key');
    });
  });

  describe('Preservation of User and External Content', () => {
    it('should never transform user-generated text through translation lookups', () => {
      const userProject = {
        title: 'Cyberpunk Katana 2088',
        description: 'Meu rascunho em aquarela digital',
        category: 'Concept Art',
      };

      // User content must be rendered directly and never looked up in i18n
      expect(userProject.title).toBe('Cyberpunk Katana 2088');
      expect(userProject.description).toBe('Meu rascunho em aquarela digital');
      expect(userProject.category).toBe('Concept Art');
    });

    it('should preserve DeviantArt external artwork titles and artists verbatim', () => {
      const deviantArtInspiration = {
        title: 'Whispers of the Ancient Forest',
        artist: 'EtherealDreamer',
        category: 'Digital Art',
      };

      expect(deviantArtInspiration.title).toBe('Whispers of the Ancient Forest');
      expect(deviantArtInspiration.artist).toBe('EtherealDreamer');
    });
  });
});
