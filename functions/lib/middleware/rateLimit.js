import { adminDb } from '../lib/firebaseAdmin.js';
import { Timestamp } from 'firebase-admin/firestore';
/**
 * Persistent per‑user rate limiting using Firestore transaction.
 * Limits: 10 per hour, 30 per day.
 */
export const rateLimitMiddleware = async (req, res, next) => {
    const uid = req.uid;
    if (!uid) {
        // Should never happen because authMiddleware runs first.
        return res.status(401).json({
            data: null,
            error: { code: 'AUTH_REQUIRED', message: 'User ID missing.' },
        });
    }
    const now = Timestamp.now();
    const docRef = adminDb.collection('rateLimits').doc(uid);
    try {
        await adminDb.runTransaction(async (t) => {
            const snap = await t.get(docRef);
            let hourlyStart = now;
            let dailyStart = now;
            let hourlyCount = 0;
            let dailyCount = 0;
            if (snap.exists) {
                const data = snap.data();
                hourlyStart = data.hourlyStart ?? now;
                dailyStart = data.dailyStart ?? now;
                hourlyCount = data.hourlyCount ?? 0;
                dailyCount = data.dailyCount ?? 0;
                // Reset if window passed
                if (now.seconds - hourlyStart.seconds >= 3600) {
                    hourlyStart = now;
                    hourlyCount = 0;
                }
                if (now.seconds - dailyStart.seconds >= 86400) {
                    dailyStart = now;
                    dailyCount = 0;
                }
            }
            // Check limits
            if (hourlyCount >= 10 || dailyCount >= 30) {
                throw new Error('RATE_LIMIT_EXCEEDED');
            }
            // Increment counters
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
        // Transaction succeeded
        return next();
    }
    catch (e) {
        if (e.message === 'RATE_LIMIT_EXCEEDED') {
            return res.status(429).json({
                data: null,
                error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests.' },
            });
        }
        console.error('Rate limit middleware error:', e);
        return res.status(500).json({
            data: null,
            error: { code: 'INTERNAL_SERVER_ERROR', message: 'Rate limit check failed.' },
        });
    }
};
