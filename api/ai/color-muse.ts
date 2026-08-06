import { getAdminAuth } from '../_lib/firebaseAdmin.js';
import { checkRateLimit } from '../_lib/rateLimit.js';
import {
  ColorMuseRequestSchema,
  GeminiPaletteSchema,
} from '../_lib/schemas.js';

export default async function handler(req: any, res: any) {
  // 1. Method check: POST only
  if (req.method !== 'POST') {
    return res.status(405).json({
      data: null,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' },
    });
  }

  // 2. Payload size check (1MB max)
  const contentLength = req.headers['content-length'];
  if (contentLength && parseInt(contentLength, 10) > 1024 * 1024) {
    return res.status(413).json({
      data: null,
      error: { code: 'PAYLOAD_TOO_LARGE', message: 'Payload exceeds 1MB limit.' },
    });
  }

  // 3. Authorization header check & verification
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      data: null,
      error: { code: 'AUTH_REQUIRED', message: 'Authorization header missing or invalid.' },
    });
  }

  const idToken = authHeader.split(' ')[1];
  let uid: string;
  try {
    const adminAuth = getAdminAuth();
    const decoded = await adminAuth.verifyIdToken(idToken);
    uid = decoded.uid;
  } catch (e: any) {
    const msg = e?.message || '';
    console.error('verifyIdToken failed:', msg);
    if (msg.includes('variáveis') || msg.includes('FIREBASE') || msg.includes('not initialized')) {
      return res.status(500).json({
        data: null,
        error: { code: 'CONFIG_ERROR', message: msg },
      });
    }
    return res.status(401).json({
      data: null,
      error: { code: 'AUTH_REQUIRED', message: `Invalid or expired ID token: ${msg}` },
    });
  }

  // 4. Rate-limit check (App rate limit)
  const rateLimitResult = await checkRateLimit(uid);
  if (!rateLimitResult.allowed) {
    return res.status(429).json({
      data: null,
      error: {
        code: rateLimitResult.code || 'APP_RATE_LIMIT_EXCEEDED',
        message: rateLimitResult.message || 'ArtFlow rate limit exceeded.',
      },
    });
  }

  // 5. Input payload validation with Zod
  const rawBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  const parseResult = ColorMuseRequestSchema.safeParse(rawBody);
  if (!parseResult.success) {
    return res.status(400).json({
      data: null,
      error: { code: 'VALIDATION_ERROR', message: parseResult.error.message },
    });
  }

  const requestData = parseResult.data;

  // 6. Gemini API Key check
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      data: null,
      error: { code: 'CONFIG_ERROR', message: 'GEMINI_API_KEY is not configured in Vercel environment variables.' },
    });
  }

  // 7. Call Gemini AI via native REST API (fetch)
  const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  const promptText = requestData.prompt || [
    requestData.medium ? `Art Medium: ${requestData.medium}` : '',
    requestData.subject ? `Subject: ${requestData.subject}` : '',
    requestData.mood ? `Mood: ${requestData.mood}` : '',
    requestData.baseColor ? `Base Color: ${requestData.baseColor}` : '',
  ].filter(Boolean).join(', ');

  try {
    const endpointUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Create a color palette based on the following description:\n"${promptText}"\nYou must output a JSON object matching this schema:\n${JSON.stringify(
                GeminiPaletteSchema.shape,
                null,
                2
              )}\nThe palette must contain exactly ${requestData.colorCount} colors. Each color object must have a HEX string (uppercase, # prefix), a short name, and a role description. Also include a paletteName, description, harmony, usageTips, and contrastNotes. Do not add any extra fields.`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1000,
        responseMimeType: 'application/json',
      },
    };

    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      const errLower = errText.toLowerCase();

      if (
        response.status === 429 ||
        errLower.includes('quota') ||
        errLower.includes('rate limit') ||
        errLower.includes('resource_exhausted')
      ) {
        if (errLower.includes('quota') || errLower.includes('daily')) {
          return res.status(429).json({
            data: null,
            error: {
              code: 'GEMINI_DAILY_QUOTA_EXCEEDED',
              message: 'A cota diária gratuita do Gemini API foi excedida pelo Google. Tente novamente mais tarde.',
            },
          });
        }
        return res.status(429).json({
          data: null,
          error: {
            code: 'GEMINI_RATE_LIMIT_EXCEEDED',
            message: 'Limite de requisições por minuto do Gemini atingido. Aguarde alguns segundos.',
          },
        });
      }

      return res.status(500).json({
        data: null,
        error: { code: 'GEMINI_ERROR', message: 'Failed to generate palette with Gemini AI.' },
      });
    }

    const resJson: any = await response.json();
    const text = resJson.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return res.status(500).json({
        data: null,
        error: { code: 'GEMINI_ERROR', message: 'Gemini returned an empty response.' },
      });
    }

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      return res.status(500).json({
        data: null,
        error: { code: 'GEMINI_ERROR', message: 'Gemini response is not valid JSON.' },
      });
    }

    // 8. Validate Gemini response against Zod schema
    const validation = GeminiPaletteSchema.safeParse(parsed);
    if (!validation.success) {
      return res.status(500).json({
        data: null,
        error: { code: 'GEMINI_ERROR', message: 'Gemini response does not match required palette schema.' },
      });
    }

    const palette = validation.data;

    // Enforce exact color count
    if (palette.colors.length !== requestData.colorCount) {
      return res.status(500).json({
        data: null,
        error: {
          code: 'GEMINI_ERROR',
          message: `Gemini returned ${palette.colors.length} colors, expected ${requestData.colorCount}`,
        },
      });
    }

    // Normalize HEX values to uppercase
    palette.colors = palette.colors.map((c) => ({
      ...c,
      hex: c.hex.toUpperCase(),
    }));

    // Return structured success (palette is NEVER saved automatically)
    return res.status(200).json({
      data: { palette },
      error: null,
    });
  } catch (err: any) {
    // Generic controlled error without stack trace leakage
    return res.status(500).json({
      data: null,
      error: {
        code: 'GEMINI_ERROR',
        message: 'Failed to generate palette with Gemini AI.',
      },
    });
  }
}
