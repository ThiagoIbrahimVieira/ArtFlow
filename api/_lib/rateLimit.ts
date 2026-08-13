import { type Firestore, Timestamp } from 'firebase-admin/firestore';

export async function checkRateLimit(uid: string, db: Firestore | null): Promise<{ allowed: boolean; code?: string; message?: string }> {
  if (!uid) {
    return { allowed: false, code: 'AUTH_REQUIRED', message: 'User ID missing.' };
  }

  if (!db) {
    return {
      allowed: false,
      code: 'RATE_LIMIT_UNAVAILABLE',
      message: 'O controle de uso está temporariamente indisponível.',
    };
  }

  const now = Timestamp.now();
  const docRef = db.collection('rateLimits').doc(uid);

  try {
    await db.runTransaction(async (t) => {
      const snap = await t.get(docRef);
      let hourlyStart = now;
      let dailyStart = now;
      let hourlyCount = 0;
      let dailyCount = 0;

      if (snap.exists) {
        const data = snap.data() || {};
        hourlyStart = data.hourlyStart ?? now;
        dailyStart = data.dailyStart ?? now;
        hourlyCount = data.hourlyCount ?? 0;
        dailyCount = data.dailyCount ?? 0;

        if (now.seconds - hourlyStart.seconds >= 3600) {
          hourlyStart = now;
          hourlyCount = 0;
        }
        if (now.seconds - dailyStart.seconds >= 86400) {
          dailyStart = now;
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
        updatedAt: now,
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
    console.error('Rate-limit storage unavailable', e);
    return {
      allowed: false,
      code: 'RATE_LIMIT_UNAVAILABLE',
      message: 'O controle de uso está temporariamente indisponível.',
    };
  }
}

export async function checkAiRateLimit(
  uid: string,
  db: Firestore | null
): Promise<{ allowed: boolean; code?: string; message?: string }> {
  if (!uid) {
    return { allowed: false, code: 'AUTH_REQUIRED', message: 'User ID missing.' };
  }

  if (!db) {
    return {
      allowed: false,
      code: 'RATE_LIMIT_UNAVAILABLE',
      message: 'O controle de uso está temporariamente indisponível.',
    };
  }

  const now = Timestamp.now();
  const docRef = db.collection('rateLimits').doc(`${uid}_ai`);

  try {
    await db.runTransaction(async (t) => {
      const snap = await t.get(docRef);
      let hourlyStart = now;
      let dailyStart = now;
      let hourlyCount = 0;
      let dailyCount = 0;

      if (snap.exists) {
        const data = snap.data() || {};
        hourlyStart = data.hourlyStart ?? now;
        dailyStart = data.dailyStart ?? now;
        hourlyCount = data.hourlyCount ?? 0;
        dailyCount = data.dailyCount ?? 0;

        if (now.seconds - hourlyStart.seconds >= 3600) {
          hourlyStart = now;
          hourlyCount = 0;
        }
        if (now.seconds - dailyStart.seconds >= 86400) {
          dailyStart = now;
          dailyCount = 0;
        }
      }

      // Limits: 30 msgs/hour, 100 msgs/day
      if (hourlyCount >= 30 || dailyCount >= 100) {
        throw new Error('AI_RATE_LIMIT_EXCEEDED');
      }

      hourlyCount += 1;
      dailyCount += 1;

      t.set(docRef, {
        hourlyStart,
        dailyStart,
        hourlyCount,
        dailyCount,
        updatedAt: now,
      });
    });

    return { allowed: true };
  } catch (e: any) {
    if (e?.message === 'AI_RATE_LIMIT_EXCEEDED') {
      return {
        allowed: false,
        code: 'AI_RATE_LIMIT_EXCEEDED',
        message: 'Você atingiu o limite de mensagens do ArtFlow AI (30 por hora ou 100 por dia). Aguarde alguns instantes.',
      };
    }
    console.error('AI Rate-limit storage unavailable', e);
    return {
      allowed: false,
      code: 'RATE_LIMIT_UNAVAILABLE',
      message: 'O controle de uso da IA está temporariamente indisponível.',
    };
  }
}
