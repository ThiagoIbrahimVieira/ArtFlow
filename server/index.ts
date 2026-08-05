import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import process from 'process';
import { deviantArtRouter } from './routes/deviantArtRoutes';
import { colorMuseRouter } from './routes/colorMuseRoutes';

dotenv.config();

export const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Request logging middleware (excluding sensitive headers & fields)
app.use((req: Request, _res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    data: { status: 'ok', timestamp: new Date().toISOString() },
    error: null,
  });
});

// Register feature routes
app.use('/api/deviantart', deviantArtRouter);
app.use('/api/ai', colorMuseRouter);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    data: null,
    error: {
      code: 'RESOURCE_NOT_FOUND',
      message: 'Requested API endpoint does not exist.',
    },
  });
});

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err?.message || err);
  res.status(500).json({
    data: null,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected server error occurred.',
    },
  });
});

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (process.env.NODE_ENV !== 'test' && isMainModule) {
  app.listen(PORT, () => {
    console.log(`ArtFlow Backend Server running on port ${PORT}`);
  });
}
