import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware';

interface RateLimitRecord {
  hourlyCount: number;
  hourlyResetTime: number;
  dailyCount: number;
  dailyResetTime: number;
}

const userRateLimits = new Map<string, RateLimitRecord>();

const HOURLY_LIMIT = 10;
const DAILY_LIMIT = 30;
const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function colorMuseRateLimiter(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const uid = req.user?.uid || req.ip || 'anonymous';
  const now = Date.now();

  let record = userRateLimits.get(uid);

  if (!record) {
    record = {
      hourlyCount: 0,
      hourlyResetTime: now + ONE_HOUR_MS,
      dailyCount: 0,
      dailyResetTime: now + ONE_DAY_MS,
    };
    userRateLimits.set(uid, record);
  }

  // Reset hourly window if expired
  if (now > record.hourlyResetTime) {
    record.hourlyCount = 0;
    record.hourlyResetTime = now + ONE_HOUR_MS;
  }

  // Reset daily window if expired
  if (now > record.dailyResetTime) {
    record.dailyCount = 0;
    record.dailyResetTime = now + ONE_DAY_MS;
  }

  if (record.hourlyCount >= HOURLY_LIMIT || record.dailyCount >= DAILY_LIMIT) {
    res.status(429).json({
      data: null,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'You have reached the current Color Muse generation limit.',
      },
    });
    return;
  }

  record.hourlyCount += 1;
  record.dailyCount += 1;
  next();
}

// Public API Rate Limiter
const publicRateLimits = new Map<string, { count: number; resetTime: number }>();
const PUBLIC_LIMIT = 60;

export function publicApiRateLimiter(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const identifier = req.user?.uid || req.ip || 'public-user';
  const now = Date.now();

  let record = publicRateLimits.get(identifier);
  if (!record || now > record.resetTime) {
    record = { count: 0, resetTime: now + ONE_HOUR_MS };
    publicRateLimits.set(identifier, record);
  }

  if (record.count >= PUBLIC_LIMIT) {
    res.status(429).json({
      data: null,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit exceeded for public requests. Please wait a bit before trying again.',
      },
    });
    return;
  }

  record.count += 1;
  next();
}
