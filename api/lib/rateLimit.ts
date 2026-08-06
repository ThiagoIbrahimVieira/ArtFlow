import { getAdminDb } from './firebaseAdmin.js';

export async function checkRateLimit(uid: string): Promise<{ allowed: boolean; code?: string; message?: string }> {
  if (!uid) {
    return { allowed: false, code: 'AUTH_REQUIRED', message: 'User ID missing.' };
  }

  let db;
  try {
    db = getAdminDb();
  } catch (err) {
    // If Firestore Admin is unconfigured, allow request to proceed or mock
    return { allowed: true };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const docRef = db.collection('rateLimits').doc(uid);

  try {
    await db.runTransaction(async (t: any) => {
      const snap = await t.get(docRef);
      let hourlyStart = nowSeconds;
      let dailyStart = nowSeconds;
      let hourlyCount = 0;
      let dailyCount = 0;

      if (snap.exists) {
        const data = snap.data() || {};
        hourlyStart = typeof data.hourlyStart === 'number' ? data.hourlyStart : (data.hourlyStart?.seconds ?? nowSeconds);
        dailyStart = typeof data.dailyStart === 'number' ? data.dailyStart : (data.dailyStart?.seconds ?? nowSeconds);
        hourlyCount = data.hourlyCount ?? 0;
        dailyCount = data.dailyCount ?? 0;

        if (nowSeconds - hourlyStart >= 3600) {
          hourlyStart = nowSeconds;
          hourlyCount = 0;
        }
        if (nowSeconds - dailyStart >= 86400) {
          dailyStart = nowSeconds;
          dailyCount = 0;
        }
      }

      if (hourlyCount >= 10 || dailyCount >= 30) {
        throw new Error('APP_RATE_LIMIT_EXCEEDED');
      }

      hourlyCount += 1;
      dailyCount += 1;

      t.set(docRef, {
        hourlyStart,
        dailyStart,
        hourlyCount,
        dailyCount,
        updatedAt: nowSeconds,
      });
    });

    return { allowed: true };
  } catch (e: any) {
    if (e?.message === 'APP_RATE_LIMIT_EXCEEDED') {
      return {
        allowed: false,
        code: 'APP_RATE_LIMIT_EXCEEDED',
        message: 'ArtFlow rate limit reached (10 generations per hour or 30 per day).',
      };
    }
    console.error('Rate limit error:', e);
    // Return allowed if Firestore is uninitialized or in test mock mode
    return { allowed: true };
  }
}
