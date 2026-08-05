let cachedToken = null;
async function getAccessToken() {
    if (cachedToken && Date.now() < cachedToken.expiryTimestamp - 60_000) {
        // return cached if not within 60s of expiry
        return cachedToken.access_token;
    }
    const clientId = process.env.DEVIANTART_CLIENT_ID;
    const clientSecret = process.env.DEVIANTART_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
        throw new Error('DEVIANTART_CLIENT_ID or DEVIANTART_CLIENT_SECRET not configured');
    }
    const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
    });
    const resp = await fetch('https://www.deviantart.com/oauth2/token', {
        method: 'POST',
        body: params,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    if (!resp.ok) {
        throw new Error(`DeviantArt token request failed: ${resp.status}`);
    }
    const data = (await resp.json());
    if (!data.access_token || !data.expires_in) {
        throw new Error('Invalid token response from DeviantArt');
    }
    cachedToken = {
        access_token: data.access_token,
        token_type: data.token_type,
        expires_in: data.expires_in,
        expiryTimestamp: Date.now() + data.expires_in * 1000,
    };
    return cachedToken.access_token;
}
/**
 * Fetch daily deviations from DeviantArt API.
 * Supports optional `date` (ISO string) and limits results locally.
 * Filters out items flagged as mature/explicit or missing required fields.
 */
export async function fetchDailyDeviations(params) {
    const token = await getAccessToken();
    const url = new URL('https://www.deviantart.com/api/v1/oauth2/browse/dailydeviations');
    if (params.date)
        url.searchParams.append('date', params.date);
    url.searchParams.append('with_session', 'false');
    const resp = await fetch(url.toString(), {
        headers: {
            Authorization: `Bearer ${token}`,
            'User-Agent': 'ArtFlow/1.0 (https://github.com/thiag/artflow)',
        },
    });
    if (!resp.ok) {
        throw new Error(`DeviantArt API error: ${resp.status}`);
    }
    const json = await resp.json();
    if (!Array.isArray(json.results)) {
        throw new Error('Unexpected DeviantArt response format');
    }
    const normalized = json.results
        .filter((item) => {
        // Safety checks
        if (item.is_mature || item.is_nsfw)
            return false;
        if (!item.content || !item.content.src)
            return false;
        if (!item.title || !item.author || !item.author.userid)
            return false;
        return true;
    })
        .map((item) => ({
        id: item.deviationid,
        title: item.title,
        artist: item.author.username,
        artistProfileUrl: item.author.profileurl || null,
        thumbnailUrl: item.thumbs && item.thumbs[0] ? item.thumbs[0].src : null,
        sourceUrl: item.url || null,
        width: item.content.width ?? null,
        height: item.content.height ?? null,
        category: item.category || null,
    }));
    if (params.limit && params.limit > 0) {
        return normalized.slice(0, params.limit);
    }
    return normalized;
}
