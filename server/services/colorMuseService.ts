import { GoogleGenAI, Type, Schema } from '@google/genai';
import { ColorMuseRequest, ColorMuseResponse } from '../../src/types';
import { isValidHexColor, normalizeHexColor } from '../../src/services/paletteService';

export function validateColorMuseRequest(input: any): { valid: boolean; error?: string; cleanData?: ColorMuseRequest } {
  if (!input || typeof input !== 'object') {
    return { valid: false, error: 'Request body must be a valid JSON object.' };
  }

  const medium = typeof input.medium === 'string' ? input.medium.trim() : '';
  const subject = typeof input.subject === 'string' ? input.subject.trim() : '';
  const mood = typeof input.mood === 'string' ? input.mood.trim() : '';
  const baseColor = typeof input.baseColor === 'string' ? input.baseColor.trim() : undefined;
  const colorCount = typeof input.colorCount === 'number' ? Math.round(input.colorCount) : 5;

  if (!medium || medium.length > 60) {
    return { valid: false, error: 'Medium is required and must be under 60 characters.' };
  }
  if (!subject || subject.length > 300) {
    return { valid: false, error: 'Subject is required and must be under 300 characters.' };
  }
  if (!mood || mood.length > 80) {
    return { valid: false, error: 'Mood is required and must be under 80 characters.' };
  }
  if (baseColor && !isValidHexColor(baseColor)) {
    return { valid: false, error: 'Base color must be a valid 6-digit hexadecimal code (e.g. #D9B98D).' };
  }
  if (isNaN(colorCount) || colorCount < 3 || colorCount > 8) {
    return { valid: false, error: 'Color count must be an integer between 3 and 8.' };
  }

  return {
    valid: true,
    cleanData: {
      medium,
      subject,
      mood,
      baseColor: baseColor ? normalizeHexColor(baseColor) : undefined,
      colorCount,
    },
  };
}

const colorMuseResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    paletteName: { type: Type.STRING, description: 'Creative name for the palette' },
    description: { type: Type.STRING, description: 'Short practical description' },
    harmony: { type: Type.STRING, description: 'Color harmony type (e.g. Analogous, Complementary, Triadic)' },
    colors: {
      type: Type.ARRAY,
      description: 'Array of colors matching colorCount',
      items: {
        type: Type.OBJECT,
        properties: {
          hex: { type: Type.STRING, description: '6-digit hex code e.g. #A45F32' },
          name: { type: Type.STRING, description: 'Descriptive color name' },
          role: { type: Type.STRING, description: 'Practical role in composition e.g. Key light, Shadow, Accent' },
        },
        required: ['hex', 'name', 'role'],
      },
    },
    usageTips: {
      type: Type.ARRAY,
      description: '2 to 4 practical application tips',
      items: { type: Type.STRING },
    },
    contrastNotes: {
      type: Type.ARRAY,
      description: 'Contrast and readability suggestions',
      items: { type: Type.STRING },
    },
  },
  required: ['paletteName', 'description', 'harmony', 'colors', 'usageTips', 'contrastNotes'],
};

export function getMockColorMusePalette(req: ColorMuseRequest): ColorMuseResponse {
  const baseHex = req.baseColor || '#D9B98D';
  const swatches = [
    { hex: '#191715', name: 'Deep Shadow', role: 'Key Shadow & Structure' },
    { hex: '#3D2918', name: 'Terracotta Core', role: 'Midtone Base' },
    { hex: '#A45F32', name: 'Burned Sienna', role: 'Warm Secondary' },
    { hex: baseHex, name: 'Golden Cream', role: 'Primary Highlight' },
    { hex: '#F1E2CB', name: 'Soft Cream', role: 'Rim Light Accent' },
    { hex: '#E5A855', name: 'Amber Flame', role: 'Focal Accent' },
    { hex: '#82A89C', name: 'Cool Sage', role: 'Complementary Shadow' },
    { hex: '#3A332C', name: 'Charcoal Neutral', role: 'Background Separation' },
  ];

  const count = Math.max(3, Math.min(8, req.colorCount));
  const selectedSwatches = swatches.slice(0, count);

  return {
    paletteName: `${req.mood} ${req.subject.split(' ')[0]} Palette`,
    description: `A tailored palette designed for ${req.medium} depicting ${req.subject} with a ${req.mood.toLowerCase()} mood.`,
    harmony: 'Analogous with Warm Accents',
    colors: selectedSwatches.map((s) => ({
      hex: normalizeHexColor(s.hex),
      name: s.name,
      role: s.role,
    })),
    usageTips: [
      `Use ${selectedSwatches[0].hex} for main structural outlines and deep shadow values.`,
      `Apply ${selectedSwatches[1].hex} to unify warm midtones across the subject.`,
      `Save ${selectedSwatches[selectedSwatches.length - 1].hex} for vivid focal highlights.`,
    ],
    contrastNotes: [
      'Ensure high value separation between shadow tones and highlight accents for optimal depth.',
    ],
  };
}

export async function generateColorMusePalette(req: ColorMuseRequest): Promise<ColorMuseResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('GEMINI_API_KEY not configured. Returning rule-based Color Muse fallback.');
    return getMockColorMusePalette(req);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `You are Color Muse, an assistant specialized in practical color theory for illustration, painting, photography, graphic design and concept art. Create coherent and useful color palettes based on the user's artistic medium, subject, mood and optional base color.

Requirements:
- Return exactly the requested number of colors (${req.colorCount}).
- Every color must use a valid six-digit hexadecimal code starting with #.
- Give each color a concise name.
- Explain the practical role of each color in composition.
- Include 2 to 4 useful application tips.
- Consider visual contrast and readability.
- Treat artistic color decisions as suggestions rather than absolute rules.
- Avoid unnecessary technical jargon.
- Keep the response concise.
- Return only data matching the required JSON schema.`;

    const prompt = `Art Medium: ${req.medium}
Subject: ${req.subject}
Mood / Vibe: ${req.mood}
${req.baseColor ? `Base Color Anchor: ${req.baseColor}` : ''}
Required Color Count: ${req.colorCount}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: colorMuseResponseSchema,
        temperature: 0.7,
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Gemini API returned an empty response.');
    }

    const parsed: ColorMuseResponse = JSON.parse(responseText);

    // Validate and post-process output
    if (!parsed || !Array.isArray(parsed.colors)) {
      throw new Error('Invalid schema returned from Gemini.');
    }

    // Post-processing: Normalize HEX and verify color count & format
    const validColors = parsed.colors
      .filter((c) => c && isValidHexColor(c.hex))
      .map((c) => ({
        hex: normalizeHexColor(c.hex),
        name: c.name ? String(c.name).trim() : 'Color',
        role: c.role ? String(c.role).trim() : 'Tone',
      }));

    if (validColors.length < 3) {
      throw new Error('Generated palette did not contain enough valid HEX colors.');
    }

    return {
      paletteName: parsed.paletteName?.trim() || `${req.mood} Palette`,
      description: parsed.description?.trim() || `Color palette for ${req.subject}`,
      harmony: parsed.harmony?.trim() || 'Harmonious',
      colors: validColors.slice(0, req.colorCount),
      usageTips: Array.isArray(parsed.usageTips) ? parsed.usageTips.slice(0, 4) : [],
      contrastNotes: Array.isArray(parsed.contrastNotes) ? parsed.contrastNotes.slice(0, 3) : [],
    };
  } catch (error: any) {
    console.error('Color Muse Gemini generation error:', error?.message || error);
    // Graceful fallback if API fails or returns invalid response
    return getMockColorMusePalette(req);
  }
}
