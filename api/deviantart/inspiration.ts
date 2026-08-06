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

    let daUrl: URL;
    if (queryText) {
      daUrl = new URL('https://www.deviantart.com/api/v1/oauth2/browse/popular');
      daUrl.searchParams.append('q', queryText);
    } else {
      daUrl = new URL('https://www.deviantart.com/api/v1/oauth2/browse/dailydeviations');
    }
    daUrl.searchParams.append('limit', '24');
    daUrl.searchParams.append('with_session', 'false');

    let daRes = await fetch(daUrl.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'ArtFlow/1.0',
      },
    });

    if (!daRes.ok && queryText) {
      // Fallback to newest browse if popular endpoint returns non-200
      daUrl = new URL('https://www.deviantart.com/api/v1/oauth2/browse/newest');
      daUrl.searchParams.append('q', queryText);
      daUrl.searchParams.append('limit', '24');
      daUrl.searchParams.append('with_session', 'false');
      daRes = await fetch(daUrl.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': 'ArtFlow/1.0',
        },
      });
    }

    if (!daRes.ok) {
      throw new Error(`DeviantArt API error ${daRes.status}`);
    }

    const daData = await daRes.json();
    const results = Array.isArray(daData.results) ? daData.results : [];

    const items = results
      .filter((item: any) => !item.is_mature && !item.is_nsfw && (item.content?.src || (item.thumbs && item.thumbs[0]?.src)))
      .map((item: any) => ({
        id: item.deviationid || String(Math.random()),
        title: item.title || 'DeviantArt Artwork',
        artist: item.author?.username || 'DeviantArt Artist',
        artistProfileUrl: item.author?.profileurl || null,
        thumbnailUrl: item.content?.src || (item.thumbs && item.thumbs[0] ? item.thumbs[0].src : ''),
        sourceUrl: item.url || 'https://www.deviantart.com',
        category: item.category || 'Digital Art',
        width: item.content?.width || null,
        height: item.content?.height || null,
      }));

    return res.status(200).json({
      data: {
        items,
        nextOffset: daData.next_offset || null,
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
