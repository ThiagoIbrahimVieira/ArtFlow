import { Router, Response } from 'express';
import { requireFirebaseAuth, AuthenticatedRequest } from '../middleware/authMiddleware';
import { colorMuseRateLimiter } from '../middleware/rateLimitMiddleware';
import { validateColorMuseRequest, generateColorMusePalette } from '../services/colorMuseService';

export const colorMuseRouter = Router();

colorMuseRouter.post(
  '/color-palette',
  requireFirebaseAuth,
  colorMuseRateLimiter,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const validation = validateColorMuseRequest(req.body);
      if (!validation.valid || !validation.cleanData) {
        res.status(400).json({
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error || 'Invalid request inputs.',
          },
        });
        return;
      }

      const result = await generateColorMusePalette(validation.cleanData);

      res.json({
        data: result,
        error: null,
      });
    } catch (error: any) {
      console.error('Color Muse route error:', error);
      res.status(500).json({
        data: null,
        error: {
          code: 'GEMINI_UNAVAILABLE',
          message: 'Unable to generate color palette at this time.',
        },
      });
    }
  }
);
