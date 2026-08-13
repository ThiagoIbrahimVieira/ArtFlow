export function isVisualArt(item: any): boolean {
  if (!item) return false;
  if (item.is_mature || item.is_nsfw) return false;

  // Must have a valid image
  const hasImage = Boolean(item.content?.src || (Array.isArray(item.thumbs) && item.thumbs[0]?.src));
  if (!hasImage) return false;

  const category = (item.category || '').toLowerCase();
  const categoryPath = (item.category_path || '').toLowerCase();
  const title = (item.title || '').toLowerCase();
  const tags = Array.isArray(item.tags) ? item.tags.map((t: any) => (typeof t === 'string' ? t.toLowerCase() : t.tag_name?.toLowerCase() || '')) : [];

  const allMeta = `${category} ${categoryPath} ${tags.join(' ')} ${title}`;

  // Explicitly rejected non-visual / photo categories
  const rejectedKeywords = [
    'photography',
    'photo/',
    'stock photography',
    'literature',
    'poetry',
    'prose',
    'fiction',
    'journal',
    'news',
    'crafts/culinary',
    'flash/games',
  ];

  for (const kw of rejectedKeywords) {
    if (category.includes(kw) || categoryPath.includes(kw)) {
      return false;
    }
  }

  // If photography tag is explicit and no visual drawing tag is found, filter out
  if (tags.includes('photography') || tags.includes('photo') || tags.includes('photograph')) {
    const hasVisualOverride = tags.some((t: string) => ['digitalart', 'drawing', 'illustration', 'painting', 'conceptart'].includes(t));
    if (!hasVisualOverride) return false;
  }

  return true;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      data: null,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
    });
  }

  const clientId = process.env.DEVIANTART_CLIENT_ID;
  const clientSecret = process.env.DEVIANTART_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({
      data: null,
      error: {
        code: 'CONFIG_ERROR',
        message: 'DEVIANTART_CLIENT_ID or DEVIANTART_CLIENT_SECRET is not configured in Vercel environment variables.',
      },
    });
  }

  try {
    const tokenParams = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    });

    const tokenRes = await fetch('https://www.deviantart.com/oauth2/token', {
      method: 'POST',
      body: tokenParams,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (!tokenRes.ok) {
      throw new Error(`DeviantArt token request failed with status ${tokenRes.status}`);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    const queryText = ((req.query.query as string) || '').trim();
    const tagsParam = ((req.query.tags as string) || '').trim();

    let fetchedResults: any[] = [];
    let nextOffset: number | null = null;

    if (tagsParam || queryText) {
      // Multiple tags query expansion
      const candidateTags = tagsParam
        ? tagsParam.split(',').map((t) => t.trim().toLowerCase().replace(/[^a-z0-9]/g, '')).filter(Boolean)
        : [queryText.toLowerCase().replace(/[^a-z0-9]/g, '')];

      const seenIds = new Set<string>();

      for (const tag of candidateTags.slice(0, 3)) {
        if (!tag) continue;
        try {
          const tagUrl = new URL('https://www.deviantart.com/api/v1/oauth2/browse/tags');
          tagUrl.searchParams.append('tag', tag);
          tagUrl.searchParams.append('limit', '20');
          tagUrl.searchParams.append('with_session', 'false');

          const tagRes = await fetch(tagUrl.toString(), {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'User-Agent': 'ArtFlow/1.0',
            },
          });

          if (tagRes.ok) {
            const tagData = await tagRes.json();
            if (Array.isArray(tagData.results)) {
              for (const r of tagData.results) {
                if (r.deviationid && !seenIds.has(r.deviationid)) {
                  seenIds.add(r.deviationid);
                  fetchedResults.push(r);
                }
              }
            }
          }
        } catch (err) {
          console.warn(`Failed fetching tag ${tag}:`, err);
        }
      }

      // If tags yielded no results, fallback to dailydeviations
      if (fetchedResults.length === 0) {
        const daUrl = new URL('https://www.deviantart.com/api/v1/oauth2/browse/dailydeviations');
        daUrl.searchParams.append('limit', '24');
        daUrl.searchParams.append('with_session', 'false');
        const fallbackRes = await fetch(daUrl.toString(), {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'User-Agent': 'ArtFlow/1.0',
          },
        });
        if (fallbackRes.ok) {
          const fbData = await fallbackRes.json();
          fetchedResults = Array.isArray(fbData.results) ? fbData.results : [];
          nextOffset = fbData.next_offset || null;
        }
      }
    } else {
      // Daily Deviations endpoint
      const daUrl = new URL('https://www.deviantart.com/api/v1/oauth2/browse/dailydeviations');
      daUrl.searchParams.append('limit', '24');
      daUrl.searchParams.append('with_session', 'false');

      const daRes = await fetch(daUrl.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': 'ArtFlow/1.0',
        },
      });

      if (!daRes.ok) {
        throw new Error(`DeviantArt API error ${daRes.status}`);
      }

      const daData = await daRes.json();
      fetchedResults = Array.isArray(daData.results) ? daData.results : [];
      nextOffset = daData.next_offset || null;
    }

    // Filter for visual arts only (no photo/literature/mature)
    const items = fetchedResults
      .filter(isVisualArt)
      .map((item: any) => ({
        id: item.deviationid || String(Math.random()),
        title: item.title || 'DeviantArt Artwork',
        artist: item.author?.username || 'DeviantArt Artist',
        artistProfileUrl: item.author?.profileurl || (item.author?.username ? `https://www.deviantart.com/${item.author.username}` : null),
        thumbnailUrl: item.content?.src || (item.thumbs && item.thumbs[0] ? item.thumbs[0].src : ''),
        sourceUrl: item.url || 'https://www.deviantart.com',
        category: item.category || 'Digital Art',
        description: item.excerpt || null,
        tags: Array.isArray(item.tags) ? item.tags.map((t: any) => (typeof t === 'string' ? t : t.tag_name)).filter(Boolean) : [],
        publishedTime: item.published_time ? new Date(parseInt(item.published_time, 10) * 1000).toLocaleDateString() : null,
        width: item.content?.width || null,
        height: item.content?.height || null,
      }));

    return res.status(200).json({
      data: {
        items,
        nextOffset,
      },
      error: null,
    });
  } catch (err: any) {
    console.error('DeviantArt API Error:', err);
    return res.status(500).json({
      data: null,
      error: { code: 'DEVIANTART_ERROR', message: err?.message || 'Failed to fetch DeviantArt inspiration.' },
    });
  }
}
