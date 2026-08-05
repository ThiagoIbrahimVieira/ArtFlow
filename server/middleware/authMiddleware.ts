import { Request, Response, NextFunction } from 'express';
import { getAdminAuth } from '../lib/firebaseAdmin';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
  };
}

export async function requireFirebaseAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      data: null,
      error: {
        code: 'AUTH_REQUIRED',
        message: 'Authentication token is required.',
      },
    });
    return;
  }

  const idToken = authHeader.split('Bearer ')[1]?.trim();

  if (!idToken) {
    res.status(401).json({
      data: null,
      error: {
        code: 'AUTH_INVALID_TOKEN',
        message: 'Invalid bearer token format.',
      },
    });
    return;
  }

  const adminAuth = getAdminAuth();
  if (!adminAuth) {
    // Development fallback if Firebase Admin credentials are not initialized
    req.user = { uid: 'dev-user-id', email: 'dev@artflow.app' };
    next();
    return;
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };
    next();
  } catch (error: any) {
    console.error('Firebase ID token verification failed:', error?.message || error);
    res.status(401).json({
      data: null,
      error: {
        code: 'AUTH_INVALID_TOKEN',
        message: 'Your authentication session is invalid or has expired.',
      },
    });
  }
}
