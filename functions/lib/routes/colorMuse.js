// src/routes/colorMuse.ts
import { Router } from 'express';
import { ColorMuseRequestSchema } from '../validation/schemas';
import { generatePalette } from '../services/colorMuseService';
export const colorMuseRouter = Router();
colorMuseRouter.post('/color-palette', async (req, res) => {
    const parseResult = ColorMuseRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
        const error = { code: 'VALIDATION_ERROR', message: parseResult.error.message };
        return res.status(400).json({ data: null, error });
    }
    try {
        const palette = await generatePalette(parseResult.data);
        const response = { data: { palette }, error: null };
        return res.json(response);
    }
    catch (e) {
        const err = e;
        const error = { code: 'GEMINI_ERROR', message: err.message };
        return res.status(500).json({ data: null, error });
    }
});
