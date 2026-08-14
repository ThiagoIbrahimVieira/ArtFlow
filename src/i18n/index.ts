import { SupportedLanguage, TranslationDictionary } from './types';
import { ptBR } from './pt-BR';
import { en } from './en';

export * from './types';
export { ptBR } from './pt-BR';
export { en } from './en';

export const dictionaries: Record<SupportedLanguage, TranslationDictionary> = {
  'pt-BR': ptBR,
  en: en,
};

export const DEFAULT_LANGUAGE: SupportedLanguage = 'pt-BR';

/**
 * Resolves a nested key in dot notation e.g. "home.dailyInspiration"
 */
export function getTranslation(
  lang: SupportedLanguage,
  path: string,
  params?: Record<string, string | number>
): string {
  const dict = dictionaries[lang] || dictionaries[DEFAULT_LANGUAGE];
  const keys = path.split('.');

  let current: any = dict;
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      // Fallback to default dictionary if key not found
      let fallbackCurrent: any = dictionaries[DEFAULT_LANGUAGE];
      for (const fk of keys) {
        if (fallbackCurrent && typeof fallbackCurrent === 'object' && fk in fallbackCurrent) {
          fallbackCurrent = fallbackCurrent[fk];
        } else {
          return path;
        }
      }
      current = fallbackCurrent;
      break;
    }
  }

  if (typeof current !== 'string') {
    return path;
  }

  if (!params) {
    return current;
  }

  // Parameter replacement: {name} -> params.name
  return current.replace(/\{(\w+)\}/g, (_, key) => {
    return key in params ? String(params[key]) : `{${key}}`;
  });
}
