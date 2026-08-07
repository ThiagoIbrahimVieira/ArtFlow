import { z } from "zod";

export const ColorMuseRequestSchema = z
  .object({
    medium: z.string().trim().min(1).max(60),
    subject: z.string().trim().min(1).max(300),
    mood: z.string().trim().min(1).max(80),
    baseColor: z
      .union([
        z.literal(""),
        z.string().regex(/^#[A-Fa-f0-9]{6}$/),
      ])
      .optional(),
    colorCount: z.coerce.number().int().min(3).max(8),
  })
  .strict();

export const GeminiPaletteSchema = z.object({
  paletteName: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(500),
  harmony: z.string().trim().min(1).max(100),
  colors: z
    .array(
      z.object({
        hex: z.string().regex(/^#[A-Fa-f0-9]{6}$/),
        name: z.string().trim().min(1).max(100),
        role: z.string().trim().min(1).max(150),
      }),
    )
    .min(3)
    .max(8),
  usageTips: z.array(z.string().trim().min(1).max(200)).max(8),
  contrastNotes: z
    .array(z.string().trim().min(1).max(200))
    .max(8),
});

export type ColorMuseRequest = z.infer<
  typeof ColorMuseRequestSchema
>;
