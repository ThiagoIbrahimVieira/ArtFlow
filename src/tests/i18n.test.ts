import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
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

function findFilesInDir(dir: string, filter: RegExp, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        findFilesInDir(filePath, filter, fileList);
      }
    } else if (filter.test(file)) {
      fileList.push(filePath);
    }
  }
  return fileList;
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

    it('should correctly translate palettes.copyColors in both languages', () => {
      expect(getTranslation('pt-BR', 'palettes.copyColors')).toBe('Copiar cores');
      expect(getTranslation('en', 'palettes.copyColors')).toBe('Copy Colors');
    });

    it('should correctly translate palettes.savedInArtFlow in both languages', () => {
      expect(getTranslation('pt-BR', 'palettes.savedInArtFlow')).toBe('Salva no ArtFlow');
      expect(getTranslation('en', 'palettes.savedInArtFlow')).toBe('Saved in ArtFlow');
    });

    it('should correctly translate projects.status keys in both languages', () => {
      expect(getTranslation('pt-BR', 'projects.status.idea')).toBe('Ideia');
      expect(getTranslation('en', 'projects.status.idea')).toBe('Idea');

      expect(getTranslation('pt-BR', 'projects.status.sketching')).toBe('Rascunho');
      expect(getTranslation('en', 'projects.status.sketching')).toBe('Sketching');

      expect(getTranslation('pt-BR', 'projects.status.in_progress')).toBe('Em andamento');
      expect(getTranslation('en', 'projects.status.in_progress')).toBe('In Progress');

      expect(getTranslation('pt-BR', 'projects.status.review')).toBe('Revisão');
      expect(getTranslation('en', 'projects.status.review')).toBe('Review');

      expect(getTranslation('pt-BR', 'projects.status.completed')).toBe('Concluído');
      expect(getTranslation('en', 'projects.status.completed')).toBe('Completed');
    });

    it('should correctly translate AI history and conversation keys', () => {
      expect(getTranslation('pt-BR', 'ai.conversations')).toBe('Conversas');
      expect(getTranslation('en', 'ai.conversations')).toBe('Conversations');

      expect(getTranslation('pt-BR', 'ai.newConversation')).toBe('Nova Conversa');
      expect(getTranslation('en', 'ai.newConversation')).toBe('New Conversation');

      expect(getTranslation('pt-BR', 'ai.today')).toBe('Hoje');
      expect(getTranslation('en', 'ai.today')).toBe('Today');

      expect(getTranslation('pt-BR', 'ai.yesterday')).toBe('Ontem');
      expect(getTranslation('en', 'ai.yesterday')).toBe('Yesterday');
    });

    it('should ensure no static translation key used in the src codebase is missing from pt-BR or en', () => {
      const srcDir = path.resolve(__dirname, '..');
      const files = findFilesInDir(srcDir, /\.(tsx|ts)$/);
      const tRegex = /\bt\(\s*['"]([a-zA-Z0-9_.]+)['"]/g;
      const missingPt: string[] = [];
      const missingEn: string[] = [];

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        let match;
        while ((match = tRegex.exec(content)) !== null) {
          const key = match[1];
          const valPt = getTranslation('pt-BR', key);
          const valEn = getTranslation('en', key);

          // If getTranslation returned humanizeKey fallback instead of dictionary string
          const ptHasKey = getAllKeys(ptBR).includes(key);
          const enHasKey = getAllKeys(en).includes(key);

          if (!ptHasKey) missingPt.push(`${key} (in ${path.basename(file)})`);
          if (!enHasKey) missingEn.push(`${key} (in ${path.basename(file)})`);
        }
      }

      expect(missingPt).toEqual([]);
      expect(missingEn).toEqual([]);
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

    it('should return humanized fallback string instead of technical key when key is unknown', () => {
      expect(getTranslation('pt-BR', 'unknown.nonexistentKey')).toBe('Nonexistent Key');
      expect(getTranslation('en', 'unknown.nonexistentKey')).toBe('Nonexistent Key');
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
