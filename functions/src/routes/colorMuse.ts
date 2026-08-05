// src/routes/colorMuse.ts
import { Router, Request, Response } from 'express';
import { ColorMuseRequestSchema } from '../validation/schemas';
import { generatePalette } from '../services/colorMuseService';
import { ApiSuccess, ApiError } from '../types/api';

export const colorMuseRouter = Router();

colorMuseRouter.post('/color-palette', async (req: Request, res: Response) => {
  const parseResult = ColorMuseRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    const error: ApiError = { code: 'VALIDATION_ERROR', message: parseResult.error.message };
    return res.status(400).json({ data: null, error });
  }
  try {
    const palette = await generatePalette(parseResult.data);
    const response: ApiSuccess<{ palette: any }> = { data: { palette }, error: null };
    return res.json(response);
  } catch (e) {
    const err = e as Error;
    const error: ApiError = { code: 'GEMINI_ERROR', message: err.message };
    return res.status(500).json({ data: null, error });
  }
});
