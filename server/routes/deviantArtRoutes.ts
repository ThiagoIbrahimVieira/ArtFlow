import { Router, Response } from 'express';
import { fetchDeviantArtInspiration } from '../services/deviantArtService';
import { publicApiRateLimiter } from '../middleware/rateLimitMiddleware';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const deviantArtRouter = Router();

deviantArtRouter.get(
  '/inspiration',
  publicApiRateLimiter,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const rawLimit = req.query.limit ? parseInt(String(req.query.limit), 10) : 12;
      const rawOffset = req.query.offset ? parseInt(String(req.query.offset), 10) : 0;
      const queryStr = req.query.query ? String(req.query.query).trim().substring(0, 100) : '';
      const categoryStr = req.query.category ? String(req.query.category).trim().substring(0, 50) : '';

      const limit = isNaN(rawLimit) ? 12 : Math.max(1, Math.min(24, rawLimit));
      const offset = isNaN(rawOffset) ? 0 : Math.max(0, rawOffset);

      const result = await fetchDeviantArtInspiration({
        limit,
        offset,
        query: queryStr,
        category: categoryStr,
      });

      res.json({
        data: result,
        error: null,
      });
    } catch (error: any) {
      console.error('DeviantArt route handler error:', error);
      res.status(500).json({
        data: null,
        error: {
          code: 'DEVIANTART_UNAVAILABLE',
          message: 'Unable to retrieve DeviantArt inspiration at this time.',
        },
      });
    }
  }
);
