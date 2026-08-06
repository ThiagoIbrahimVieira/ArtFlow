// src/validation/schemas.ts
import { z } from 'zod';
// DeviantArt query params
export const DeviantArtQuerySchema = z.object({
    date: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), {
        message: 'Invalid date format',
    }),
    limit: z.number().int().min(1).max(24).optional(),
});
// Color Muse request body
export const ColorMuseRequestSchema = z.object({
    medium: z.string().min(1).max(200).optional(),
    subject: z.string().min(1).max(200).optional(),
    mood: z.string().min(1).max(200).optional(),
    baseColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/).optional().or(z.literal('')),
    prompt: z.string().min(1).max(500).optional(),
    colorCount: z.number().int().min(1).max(10),
}).refine((data) => Boolean(data.prompt || data.medium || data.subject || data.mood), {
    message: 'At least prompt or one of (medium, subject, mood) must be provided.',
});
// Gemini palette response schema (post‑validation)
export const GeminiPaletteSchema = z.object({
    paletteName: z.string().min(1).max(100),
    description: z.string().min(1).max(500),
    harmony: z.string().min(1).max(100),
    colors: z.array(z.object({
        hex: z.string().regex(/^#([A-Fa-f0-9]{6})$/),
        name: z.string().min(1).max(100),
        role: z.string().min(1).max(50),
    })).min(1).max(10),
    usageTips: z.array(z.string()).max(5),
    contrastNotes: z.array(z.string()).max(5),
});
