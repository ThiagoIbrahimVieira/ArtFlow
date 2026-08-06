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

  const payload = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      responseMimeType: 'application/json',
    },
  };

  const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.0-flash-lite'];
  let lastErrMessage = '';

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const apiRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await apiRes.json();
      if (!apiRes.ok || json.error) {
        lastErrMessage = json.error?.message || `Gemini API returned status ${apiRes.status}`;
        if (
          apiRes.status === 429 ||
          json.error?.status === 'RESOURCE_EXHAUSTED' ||
          json.error?.code === 429 ||
          (json.error?.message && json.error.message.toLowerCase().includes('quota exceeded'))
        ) {
          return res.status(429).json({
            data: null,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'A cota gratuita de requisições da IA Gemini foi atingida temporariamente pelo Google. Aguarde 10 segundos e tente novamente!',
            },
          });
        }
        if (apiRes.status === 403 || json.error?.status === 'PERMISSION_DENIED' || json.error?.code === 403) {
          return res.status(403).json({
            data: null,
            error: {
              code: 'PERMISSION_DENIED',
              message: 'A sua chave GEMINI_API_KEY no painel da Vercel foi negada (403 Permission Denied). Crie uma nova chave gratuita em https://aistudio.google.com/app/apikey e atualize na Vercel.',
            },
          });
        }
        continue;
      }

      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        const parsed = JSON.parse(text);
        return res.status(200).json({
          data: parsed,
          error: null,
        });
      }
    } catch (err: any) {
      lastErrMessage = err?.message || 'Network error calling Gemini API';
    }
  }

  return res.status(500).json({
    data: null,
    error: {
      code: 'AI_ERROR',
      message: lastErrMessage || 'Failed to generate palette with Gemini AI.',
    },
  });
}
