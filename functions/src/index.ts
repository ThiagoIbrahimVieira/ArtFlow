// src/index.ts
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';

import { deviantArtRouter } from './routes/deviantArt';
import { colorMuseRouter } from './routes/colorMuse';
import { authMiddleware } from './middleware/authMiddleware';
import { rateLimitMiddleware } from './middleware/rateLimit';

// Secrets (will be bound in deployment, available via process.env in emulators)
export const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');
export const DEVIANTART_CLIENT_ID = defineSecret('DEVIANTART_CLIENT_ID');
export const DEVIANTART_CLIENT_SECRET = defineSecret('DEVIANTART_CLIENT_SECRET');

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));

// Logging (exclude sensitive info)
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ data: { status: 'ok', timestamp: new Date().toISOString() }, error: null });
});

// Protected routes
app.use('/api/deviantart', authMiddleware, deviantArtRouter);
app.use('/api/ai', authMiddleware, rateLimitMiddleware, colorMuseRouter);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ data: null, error: { code: 'RESOURCE_NOT_FOUND', message: 'Requested API endpoint does not exist.' } });
});

// Export as second‑gen Cloud Function
export const api = onRequest(
  {
    region: 'southamerica-east1',
    cors: false,
    timeoutSeconds: 60,
    memory: '256MiB',
    secrets: [GEMINI_API_KEY, DEVIANTART_CLIENT_ID, DEVIANTART_CLIENT_SECRET],
  },
  app
);
