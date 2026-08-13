import { DeviantArtArtwork, ArtProvider } from '../types';

// Map of common Portuguese artistic terms to expanded English tag candidates
const PT_TO_EN_ART_TAGS: Record<string, string[]> = {
  'trem de carga': ['freighttrain', 'train', 'locomotive', 'railroad', 'cargotrain'],
  'trem': ['train', 'locomotive', 'railway', 'steamtrain'],
  'locomotiva': ['locomotive', 'train', 'steamtrain', 'railroad'],
  'ferrovia': ['railroad', 'railway', 'train', 'tracks'],
  'dragao': ['dragon', 'fantasycreature', 'creaturedesign', 'mythology'],
  'dragão': ['dragon', 'fantasycreature', 'creaturedesign', 'mythology'],
  'castelo': ['castle', 'medieval', 'fortress', 'fantasyarchitecture'],
  'paisagem': ['landscape', 'scenery', 'environmentart', 'nature'],
  'arvore': ['trees', 'tree', 'nature', 'landscape'],
  'arvores': ['trees', 'tree', 'forest', 'landscape'],
  'floresta': ['forest', 'woods', 'enchantedforest', 'environmentdesign'],
  'espada': ['sword', 'weapon', 'fantasyweapon', 'props'],
  'guerreiro': ['warrior', 'knight', 'characterdesign', 'conceptart'],
  'guerreira': ['warrior', 'knight', 'femalecharacter', 'conceptart'],
  'mago': ['wizard', 'mage', 'sorcerer', 'magic', 'fantasyart'],
  'bruxa': ['witch', 'sorceress', 'magic', 'darkfantasy'],
  'robo': ['robot', 'mecha', 'cyborg', 'scifi', 'conceptart'],
  'robô': ['robot', 'mecha', 'cyborg', 'scifi', 'conceptart'],
  'nave': ['spaceship', 'spacecraft', 'starship', 'scifiart'],
  'nave espacial': ['spaceship', 'spacecraft', 'starship', 'scifi'],
  'cidade': ['cityscape', 'city', 'urban', 'cyberpunkcity'],
  'anatomia': ['anatomy', 'figurestudy', 'gesturedrawing', 'anatomyart'],
  'retrato': ['portrait', 'face', 'digitalportrait', 'characterart'],
  'poses': ['poses', 'gesturedrawing', 'figuredrawing', 'dynamicposes'],
  'personagem': ['characterdesign', 'originalcharacter', 'conceptart', 'character'],
  'natureza': ['nature', 'landscape', 'botanical', 'environmentart'],
  'praia': ['beach', 'seascape', 'ocean', 'coast'],
  'ceu': ['sky', 'clouds', 'skyscape', 'sunset'],
  'céu': ['sky', 'clouds', 'skyscape', 'sunset'],
};

export function isVisualArt(item: any): boolean {
  if (!item) return false;

  // Must have an image URL
  const src = item.content?.src || (Array.isArray(item.thumbs) && item.thumbs[0]?.src);
  if (!src) return false;

  // No mature content
  if (item.is_mature) return false;

  const category = (item.category || item.category_path || '').toLowerCase();
  const title = (item.title || '').toLowerCase();
  const tags = Array.isArray(item.tags) ? item.tags.map((t: any) => (typeof t === 'string' ? t.toLowerCase() : (t.tag_name || '').toLowerCase())) : [];

  // Exclude photography
  if (
    category.includes('photography') ||
    category.includes('photo/') ||
    tags.includes('photography') ||
    tags.includes('photo')
  ) {
    return false;
  }

  // Exclude literature, poetry, prose, fiction
  if (
    category.includes('literature') ||
    category.includes('poetry') ||
    category.includes('prose') ||
    category.includes('fiction') ||
    category.includes('journal') ||
    category.includes('status') ||
    category.includes('culinary')
  ) {
    return false;
  }

  return true;
}

export function normalizeArtSearchQuery(query: string): string[] {
  if (!query || !query.trim()) return ['art', 'digitalart', 'illustration'];

  const cleanQuery = query
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove accents

  const rawClean = query.trim().toLowerCase();

  // Check direct phrase dictionary
  if (PT_TO_EN_ART_TAGS[rawClean]) {
    return PT_TO_EN_ART_TAGS[rawClean];
  }
  if (PT_TO_EN_ART_TAGS[cleanQuery]) {
    return PT_TO_EN_ART_TAGS[cleanQuery];
  }

  // Split words and look for match combos
  const words = cleanQuery.split(/\s+/).filter(Boolean);
  const candidates: string[] = [];

  for (const w of words) {
    if (PT_TO_EN_ART_TAGS[w]) {
      candidates.push(...PT_TO_EN_ART_TAGS[w]);
    }
  }

  // Add alphanumeric combined tag and individual word tags
  const combinedTag = cleanQuery.replace(/[^a-z0-9]/g, '');
  if (combinedTag) candidates.push(combinedTag);

  for (const w of words) {
    const cleanWord = w.replace(/[^a-z0-9]/g, '');
    if (cleanWord.length >= 3 && !candidates.includes(cleanWord)) {
      candidates.push(cleanWord);
    }
  }

  if (candidates.length === 0) {
    candidates.push(cleanQuery.replace(/[^a-z0-9]/g, '') || 'art');
  }

  // Deduplicate preserving order
  return Array.from(new Set(candidates)).slice(0, 6);
}

export class DeviantArtProvider implements ArtProvider {
  async getDailyInspirations(): Promise<DeviantArtArtwork[]> {
    try {
      const res = await fetch('/api/deviantart/inspiration');
      if (!res.ok) {
        throw new Error(`Failed to fetch daily deviations: status ${res.status}`);
      }
      const json = await res.json();
      return json.data?.items || [];
    } catch (err) {
      console.error('DeviantArtProvider.getDailyInspirations error:', err);
      throw err;
    }
  }

  async searchArtworks(query: string, category?: string): Promise<DeviantArtArtwork[]> {
    const candidateTags = normalizeArtSearchQuery(query);
    const tagsParam = encodeURIComponent(candidateTags.join(','));
    const url = `/api/deviantart/inspiration?tags=${tagsParam}${category && category !== 'All' ? `&category=${encodeURIComponent(category)}` : ''}`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to search artworks: status ${res.status}`);
      }
      const json = await res.json();
      const items: DeviantArtArtwork[] = json.data?.items || [];
      return items;
    } catch (err) {
      console.error('DeviantArtProvider.searchArtworks error:', err);
      throw err;
    }
  }
}

export const deviantArtProvider = new DeviantArtProvider();
