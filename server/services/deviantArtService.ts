import { DeviantArtArtwork, DeviantArtInspirationResponse } from '../../src/types';

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

interface CacheEntry {
  data: DeviantArtInspirationResponse;
  expiresAt: number;
}

let cachedToken: CachedToken | null = null;
const inspirationCache = new Map<string, CacheEntry>();

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function getDeviantArtAccessToken(): Promise<string | null> {
  const clientId = process.env.DEVIANTART_CLIENT_ID;
  const clientSecret = process.env.DEVIANTART_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60000) {
    return cachedToken.accessToken;
  }

  try {
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    });

    const res = await fetch('https://www.deviantart.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'ArtFlow-Backend/1.0',
      },
      body: params.toString(),
    });

    if (!res.ok) {
      console.error('Failed to obtain DeviantArt access token:', res.statusText);
      return null;
    }

    const data = await res.json();
    if (data.access_token && data.expires_in) {
      cachedToken = {
        accessToken: data.access_token,
        expiresAt: now + data.expires_in * 1000,
      };
      return cachedToken.accessToken;
    }
    return null;
  } catch (error) {
    console.error('Error fetching DeviantArt OAuth token:', error);
    return null;
  }
}

async function fetchWithRetry(url: string, headers: Record<string, string>, retries = 3): Promise<Response> {
  let attempt = 0;
  let delay = 500;

  while (attempt < retries) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(url, {
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok || (response.status !== 429 && response.status < 500)) {
        return response;
      }
    } catch (err) {
      if (attempt === retries - 1) throw err;
    }

    attempt++;
    await new Promise((r) => setTimeout(r, delay));
    delay *= 2;
  }

  return fetch(url, { headers });
}

export function getMockDeviantArtInspiration(queryStr?: string, categoryStr?: string): DeviantArtInspirationResponse {
  const sampleItems: DeviantArtArtwork[] = [
    {
      id: 'da-1',
      title: 'Celestial Guardian Study',
      artist: 'AetheriaArt',
      artistProfileUrl: 'https://www.deviantart.com/aetheriaart',
      thumbnailUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80',
      sourceUrl: 'https://www.deviantart.com/aetheriaart/art/Celestial-Guardian-Study-891234',
      category: 'Digital Art',
      width: 1200,
      height: 1200,
    },
    {
      id: 'da-2',
      title: 'Autumn Forest Fog',
      artist: 'SylvanScapes',
      artistProfileUrl: 'https://www.deviantart.com/sylvanscapes',
      thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
      sourceUrl: 'https://www.deviantart.com/sylvanscapes/art/Autumn-Forest-Fog-891235',
      category: 'Landscapes',
      width: 1600,
      height: 1000,
    },
    {
      id: 'da-3',
      title: 'Terracotta Portrait Study',
      artist: 'Chiaroscuro_Lab',
      artistProfileUrl: 'https://www.deviantart.com/chiaroscuro_lab',
      thumbnailUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
      sourceUrl: 'https://www.deviantart.com/chiaroscuro_lab/art/Terracotta-Portrait-Study-891236',
      category: 'Characters',
      width: 1000,
      height: 1200,
    },
    {
      id: 'da-4',
      title: 'Solitude in Marble',
      artist: 'StatuaryArt',
      artistProfileUrl: 'https://www.deviantart.com/statuaryart',
      thumbnailUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80',
      sourceUrl: 'https://www.deviantart.com/statuaryart/art/Solitude-in-Marble-891237',
      category: 'Poses',
      width: 1200,
      height: 1200,
    },
  ];

  let filtered = sampleItems;
  if (queryStr) {
    const q = queryStr.toLowerCase();
    filtered = filtered.filter((i) => i.title.toLowerCase().includes(q) || i.artist.toLowerCase().includes(q));
  }
  if (categoryStr && categoryStr !== 'All') {
    const c = categoryStr.toLowerCase();
    filtered = filtered.filter((i) => i.category?.toLowerCase().includes(c));
  }

  return {
    items: filtered.length > 0 ? filtered : sampleItems,
    nextOffset: null,
  };
}

export async function fetchDeviantArtInspiration(options: {
  limit?: number;
  offset?: number;
  category?: string;
  query?: string;
}): Promise<DeviantArtInspirationResponse> {
  const limit = Math.max(1, Math.min(24, options.limit || 12));
  const offset = Math.max(0, options.offset || 0);
  const queryStr = options.query?.trim() || '';
  const categoryStr = options.category?.trim() || '';

  const cacheKey = `${limit}:${offset}:${categoryStr}:${queryStr}`;
  const now = Date.now();
  const cached = inspirationCache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  const token = await getDeviantArtAccessToken();
  if (!token) {
    // Return safe fallback data if credentials are not set
    return getMockDeviantArtInspiration(queryStr, categoryStr);
  }

  try {
    let endpointUrl = `https://www.deviantart.com/api/v1/oauth2/browse/popular?limit=${limit}&offset=${offset}&mature_content=false`;
    if (queryStr) {
      endpointUrl = `https://www.deviantart.com/api/v1/oauth2/browse/tags?tag=${encodeURIComponent(queryStr)}&limit=${limit}&offset=${offset}&mature_content=false`;
    }

    const res = await fetchWithRetry(endpointUrl, {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'ArtFlow-Backend/1.0',
      'Accept-Encoding': 'gzip, deflate',
    });

    if (!res.ok) {
      console.warn(`DeviantArt API returned status ${res.status}`);
      return getMockDeviantArtInspiration(queryStr, categoryStr);
    }

    const data = await res.json();
    const rawResults = data.results || [];

    const items: DeviantArtArtwork[] = rawResults
      .filter((item: any) => !item.is_mature && item.content && item.content.src && item.title && item.author)
      .map((item: any) => {
        const thumb = item.thumbs?.[0]?.src || item.content?.src;
        return {
          id: String(item.deviationid || item.id || Math.random()),
          title: String(item.title).trim(),
          artist: String(item.author?.username || 'Unknown Artist'),
          artistProfileUrl: item.author?.username ? `https://www.deviantart.com/${item.author.username}` : null,
          thumbnailUrl: thumb,
          sourceUrl: item.url || `https://www.deviantart.com/deviation/${item.deviationid}`,
          category: item.category || categoryStr || 'Artwork',
          width: item.content?.width || null,
          height: item.content?.height || null,
        };
      });

    const responseData: DeviantArtInspirationResponse = {
      items,
      nextOffset: data.has_more ? data.next_offset || offset + limit : null,
    };

    inspirationCache.set(cacheKey, {
      data: responseData,
      expiresAt: now + CACHE_TTL_MS,
    });

    return responseData;
  } catch (error) {
    console.error('Error querying DeviantArt API:', error);
    return getMockDeviantArtInspiration(queryStr, categoryStr);
  }
}
