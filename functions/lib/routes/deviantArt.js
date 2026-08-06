// src/routes/deviantArt.ts
import { Router } from 'express';
import { DeviantArtQuerySchema } from '../validation/schemas.js';
import { fetchDailyDeviations } from '../services/deviantArtService.js';
export const deviantArtRouter = Router();
deviantArtRouter.get('/', async (req, res) => {
    const parseResult = DeviantArtQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
        const error = { code: 'VALIDATION_ERROR', message: parseResult.error.message };
        return res.status(400).json({ data: null, error });
    }
    const { date, limit } = parseResult.data;
    try {
        const items = await fetchDailyDeviations({ date, limit });
        const response = { data: { items }, error: null };
        return res.json(response);
    }
    catch (e) {
        const err = e;
        const error = { code: 'DEVIANTART_ERROR', message: err.message };
        return res.status(500).json({ data: null, error });
    }
});
