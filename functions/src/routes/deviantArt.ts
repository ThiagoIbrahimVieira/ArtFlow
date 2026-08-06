// src/routes/deviantArt.ts
import { Router, Request, Response } from 'express';
import { DeviantArtQuerySchema } from '../validation/schemas.js';
import { fetchDailyDeviations } from '../services/deviantArtService.js';
import { ApiSuccess, ApiError } from '../types/api.js';

export const deviantArtRouter = Router();

deviantArtRouter.get('/', async (req: Request, res: Response) => {
  const parseResult = DeviantArtQuerySchema.safeParse(req.query);
  if (!parseResult.success) {
    const error: ApiError = { code: 'VALIDATION_ERROR', message: parseResult.error.message };
    return res.status(400).json({ data: null, error });
  }
  const { date, limit } = parseResult.data;
  try {
    const items = await fetchDailyDeviations({ date, limit });
    const response: ApiSuccess<{ items: any[] }> = { data: { items }, error: null };
    return res.json(response);
  } catch (e) {
    const err = e as Error;
    const error: ApiError = { code: 'DEVIANTART_ERROR', message: err.message };
    return res.status(500).json({ data: null, error });
  }
});
