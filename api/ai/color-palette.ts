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
    const modelsToTry = [
      process.env.GEMINI_MODEL,
      'gemini-1.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-pro',
    ].filter(Boolean) as string[];

    let lastError: any = null;
    for (const model of modelsToTry) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            temperature: 0.7,
            responseMimeType: 'application/json',
          },
        });
        if (response && response.text) break;
      } catch (err: any) {
        lastError = err;
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error('Gemini API returned empty response.');
    }

    const parsed = JSON.parse(response.text);
    return res.status(200).json({
      data: parsed,
      error: null,
    });
  } catch (err: any) {
    console.error('Gemini Color Muse API Error:', err);
    let userMsg = err?.message || 'Failed to generate palette with Gemini AI.';
    if (userMsg.includes('403') || userMsg.includes('PERMISSION_DENIED')) {
      userMsg = 'A sua chave GEMINI_API_KEY no painel da Vercel foi negada (403 Permission Denied). Verifique se a chave foi criada no Google AI Studio (https://aistudio.google.com/app/apikey) e se está ativa.';
    }
    return res.status(500).json({
      data: null,
      error: { code: 'AI_ERROR', message: userMsg },
    });
  }
}
