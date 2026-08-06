// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebaseAdmin.js';

// Extend Express Request type with uid property
export interface AuthenticatedRequest extends Request {
  uid?: string;
}

/**
 * Firebase ID‑token authentication middleware.
 * Expects `Authorization: Bearer <ID_TOKEN>` header.
 * On success, attaches `req.uid` and calls next().
 * On failure, responds with 401 and a generic error payload.
 */
export const authMiddleware = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return _res.status(401).json({
      data: null,
      error: { code: 'AUTH_REQUIRED', message: 'Authorization header missing.' },
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return _res.status(401).json({
      data: null,
      error: { code: 'AUTH_REQUIRED', message: 'Invalid Authorization header format.' },
    });
  }

  const idToken = parts[1];
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    req.uid = decoded.uid;
    return next();
  } catch (e) {
    console.error('Auth token verification failed:', (e as Error).message);
    return _res.status(401).json({
      data: null,
      error: { code: 'AUTH_REQUIRED', message: 'Invalid or expired ID token.' },
    });
  }
};
