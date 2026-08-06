import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      data: null,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      data: null,
      error: { code: 'CONFIG_ERROR', message: 'GEMINI_API_KEY is not configured in Vercel environment variables.' },
    });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  const { medium, subject, mood, baseColor, colorCount = 5 } = body;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Create a cohesive color palette for an artist working with:
- Art Medium: ${medium || 'Digital Illustration'}
- Subject: ${subject || 'Fantasy Character'}
- Mood/Vibe: ${mood || 'Mystical & Warm'}
${baseColor ? `- Base Color (Include this or harmonic variations): ${baseColor}` : ''}
- Number of colors: ${colorCount}

Return ONLY a valid JSON object matching this exact structure:
{
  "paletteName": "Name of Palette",
  "description": "Short description of the color story",
  "harmony": "e.g. Analogous, Triadic, Complementary",
  "colors": [
    { "hex": "#HEXCOLOR", "name": "Color Name", "role": "Dominant/Accent/etc" }
  ],
  "usageTips": ["Tip 1", "Tip 2"],
  "contrastNotes": ["Note 1", "Note 2"]
}`;

    let response;
    const modelCandidate = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    try {
      response = await ai.models.generateContent({
        model: modelCandidate,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          temperature: 0.7,
          responseMimeType: 'application/json',
        },
      });
    } catch (modelErr) {
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          temperature: 0.7,
          responseMimeType: 'application/json',
        },
      });
    }

    const text = response.text;
    if (!text) {
      throw new Error('Gemini API returned an empty response.');
    }

    const parsed = JSON.parse(text);
    return res.status(200).json({
      data: parsed,
      error: null,
    });
  } catch (err: any) {
    console.error('Gemini Color Muse API Error:', err);
    return res.status(500).json({
      data: null,
      error: { code: 'AI_ERROR', message: err?.message || 'Failed to generate palette with Gemini AI.' },
    });
  }
}
