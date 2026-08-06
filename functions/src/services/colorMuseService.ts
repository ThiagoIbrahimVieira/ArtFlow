// src/services/colorMuseService.ts
import { GoogleGenAI } from '@google/genai';
import { ColorMuseRequest, GeminiPaletteSchema } from '../validation/schemas.js';
import { adminAuth } from '../lib/firebaseAdmin.js'; // for future auth checks if needed

/**
 * Generate a color palette using Gemini.
 * Uses the configured GEMINI_API_KEY secret (available via env in emulator).
 */
export async function generatePalette(request: ColorMuseRequest): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const client = new GoogleGenAI({ apiKey });
  // Use a configurable model; default to 'gemini-3.6-flash' if not set via env
  const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  const promptText = request.prompt || [
    request.medium ? `Art Medium: ${request.medium}` : '',
    request.subject ? `Subject: ${request.subject}` : '',
    request.mood ? `Mood: ${request.mood}` : '',
    request.baseColor ? `Base Color: ${request.baseColor}` : '',
  ].filter(Boolean).join(', ');

  const result = await client.models.generateContent({
    model: modelName,
    contents: [{ role: 'user', parts: [{ text: `Create a color palette based on the following description:\n\"${promptText}\"\nYou must output a JSON object matching this schema:\n${JSON.stringify(GeminiPaletteSchema.shape, null, 2)}\nThe palette must contain exactly ${request.colorCount} colors. Each color object must have a HEX string (uppercase, # prefix), a short name, and a role description. Also include a paletteName, description, harmony, usageTips, and contrastNotes. Do not add any extra fields.` }] }],
    config: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1000,
      responseMimeType: 'application/json',
    },
  });

  const text = result.text;
  if (!text) {
    throw new Error('Gemini returned empty response');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    throw new Error('Gemini response is not valid JSON');
  }

  // Validate against Zod schema
  const validation = GeminiPaletteSchema.safeParse(parsed);
  if (!validation.success) {
    throw new Error('Gemini response does not match required schema');
  }

  // Additional post‑validation: enforce colorCount and HEX format
  const palette = validation.data;
  if (palette.colors.length !== request.colorCount) {
    throw new Error(`Gemini returned ${palette.colors.length} colors, expected ${request.colorCount}`);
  }

  // Normalize HEX values to uppercase
  palette.colors = palette.colors.map((c) => ({
    ...c,
    hex: c.hex.toUpperCase(),
  }));

  return palette;
}
