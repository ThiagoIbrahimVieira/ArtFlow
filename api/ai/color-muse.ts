import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore, Timestamp } from 'firebase-admin/firestore';
import { jwtVerify, createRemoteJWKSet } from 'jose';
import { z } from 'zod';

// ==========================================
// 1. SCHEMAS
// ==========================================
export const ColorMuseRequestSchema = z.object({
  medium: z.string().max(80).optional(),
  subject: z.string().max(120).optional(),
  mood: z.string().max(80).optional(),
  baseColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, { message: 'Invalid hex color' })
    .optional(),
  colorCount: z.number().int().min(3).max(8).default(5),
});

export const PaletteColorSchema = z.object({
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/i, { message: 'Invalid hex code format' }),
  name: z.string().min(1).max(60),
  role: z.string().min(1).max(60),
});

export const GeminiPaletteSchema = z.object({
  paletteName: z.string().min(1).max(80),
  description: z.string().min(1).max(300),
  harmony: z.string().min(1).max(60),
  colors: z.array(PaletteColorSchema).min(3).max(8),
  usageTips: z.array(z.string()).min(1),
  contrastNotes: z.array(z.string()).optional(),
});

// ==========================================
// 2. FIREBASE ADMIN SERVICE
// ==========================================
interface FirebaseAdminServices {
  db: Firestore;
  auth: Auth;
}

let cachedServices: FirebaseAdminServices | null = null;

export function getFirebaseAdmin(): FirebaseAdminServices {
  if (cachedServices) {
    return cachedServices;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID?.replace(/^["']|["']$/g, '').trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.replace(/^["']|["']$/g, '').trim();
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !rawPrivateKey) {
    throw new Error('FIREBASE_ADMIN_CONFIG_ERROR');
  }

  const privateKey = rawPrivateKey
    .replace(/^["']|["']$/g, '')
    .replace(/\\n/g, '\n')
    .trim();

  const validPrivateKey =
    privateKey.includes('-----BEGIN PRIVATE KEY-----') &&
    privateKey.includes('-----END PRIVATE KEY-----');

  if (!validPrivateKey) {
    throw new Error('FIREBASE_ADMIN_CONFIG_ERROR');
  }

  try {
    const app =
      getApps().length > 0
        ? getApp()
        : initializeApp({
            projectId,
            credential: cert({
              projectId,
              clientEmail,
              privateKey,
            }),
          });

    cachedServices = {
      db: getFirestore(app),
      auth: getAuth(app),
    };

    return cachedServices;
  } catch (e) {
    throw new Error('FIREBASE_ADMIN_CONFIG_ERROR');
  }
}

// ==========================================
// 3. TOKEN VERIFICATION
// ==========================================
let jwksCache: any = null;

function getJWKS() {
  if (!jwksCache) {
    jwksCache = createRemoteJWKSet(
      new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
    );
  }
  return jwksCache;
}

export async function verifyFirebaseIdToken(idToken: string, projectId: string): Promise<{ uid: string }> {
  const cleanProjectId = projectId.replace(/^["']|["']$/g, '').trim();
  const { payload } = await jwtVerify(idToken, getJWKS(), {
    issuer: `https://securetoken.google.com/${cleanProjectId}`,
    audience: cleanProjectId,
  });
  if (!payload.sub) {
    throw new Error('ID Token payload does not contain subject (sub).');
  }
  return { uid: payload.sub };
}

// ==========================================
// 4. RATE LIMITING
// ==========================================
export async function checkRateLimit(
  uid: string,
  db: Firestore | null
): Promise<{ allowed: boolean; code?: string; message?: string }> {
  if (!uid) {
    return { allowed: false, code: 'AUTH_REQUIRED', message: 'User ID missing.' };
  }

  if (!db) {
    return {
      allowed: false,
      code: 'RATE_LIMIT_UNAVAILABLE',
      message: 'O controle de uso está temporariamente indisponível.',
    };
  }

  const now = Timestamp.now();
  const docRef = db.collection('rateLimits').doc(uid);

  try {
    await db.runTransaction(async (t) => {
      const snap = await t.get(docRef);
      let hourlyStart = now;
      let dailyStart = now;
      let hourlyCount = 0;
      let dailyCount = 0;

      if (snap.exists) {
        const data = snap.data() || {};
        hourlyStart = data.hourlyStart ?? now;
        dailyStart = data.dailyStart ?? now;
        hourlyCount = data.hourlyCount ?? 0;
        dailyCount = data.dailyCount ?? 0;

        if (now.seconds - hourlyStart.seconds >= 3600) {
          hourlyStart = now;
          hourlyCount = 0;
        }
        if (now.seconds - dailyStart.seconds >= 86400) {
          dailyStart = now;
          dailyCount = 0;
        }
      }

      if (hourlyCount >= 10 || dailyCount >= 30) {
        throw new Error('APP_RATE_LIMIT_EXCEEDED');
      }

      hourlyCount += 1;
      dailyCount += 1;

      t.set(docRef, {
        hourlyStart,
        dailyStart,
        hourlyCount,
        dailyCount,
        updatedAt: now,
      });
    });

    return { allowed: true };
  } catch (e: any) {
    if (e?.message === 'APP_RATE_LIMIT_EXCEEDED') {
      return {
        allowed: false,
        code: 'APP_RATE_LIMIT_EXCEEDED',
        message: 'ArtFlow rate limit reached (10 generations per hour or 30 per day).',
      };
    }
    console.error('Rate-limit storage unavailable', e);
    return {
      allowed: false,
      code: 'RATE_LIMIT_UNAVAILABLE',
      message: 'O controle de uso está temporariamente indisponível.',
    };
  }
}

// ==========================================
// 5. SERVERLESS HANDLER
// ==========================================
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

  // 3. Environment check for Firebase project ID
  const projectId = process.env.FIREBASE_PROJECT_ID?.replace(/^["']|["']$/g, '').trim();
  if (!projectId) {
    return res.status(500).json({
      data: null,
      error: {
        code: 'FIREBASE_ADMIN_CONFIG_ERROR',
        message: 'A configuração do servidor Firebase está inválida.',
      },
    });
  }

  // 4. Authorization header check & verification
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
    const verified = await verifyFirebaseIdToken(idToken, projectId);
    uid = verified.uid;
  } catch (e: any) {
    console.error('verifyFirebaseIdToken failed:', e?.message || e);
    return res.status(401).json({
      data: null,
      error: { code: 'AUTH_REQUIRED', message: 'Invalid or expired ID token.' },
    });
  }

  // 5. Input payload validation with Zod BEFORE consuming rate-limit quota
  const rawBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  const parseResult = ColorMuseRequestSchema.safeParse(rawBody);
  if (!parseResult.success) {
    return res.status(400).json({
      data: null,
      error: { code: 'VALIDATION_ERROR', message: parseResult.error.message },
    });
  }

  const requestData = parseResult.data;

  // 6. Get Firebase Admin & Rate-limit check
  let adminDb: any = null;
  try {
    adminDb = getFirebaseAdmin().db;
  } catch (err: any) {
    return res.status(500).json({
      data: null,
      error: {
        code: 'FIREBASE_ADMIN_CONFIG_ERROR',
        message: 'A configuração do servidor Firebase está inválida.',
      },
    });
  }

  const rateLimitResult = await checkRateLimit(uid, adminDb);
  if (!rateLimitResult.allowed) {
    if (rateLimitResult.code === 'RATE_LIMIT_UNAVAILABLE') {
      return res.status(503).json({
        data: null,
        error: {
          code: 'RATE_LIMIT_UNAVAILABLE',
          message: 'O controle de uso está temporariamente indisponível.',
        },
      });
    }
    return res.status(429).json({
      data: null,
      error: {
        code: rateLimitResult.code || 'APP_RATE_LIMIT_EXCEEDED',
        message: rateLimitResult.message || 'ArtFlow rate limit exceeded.',
      },
    });
  }

  // 7. Gemini API Key check
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      data: null,
      error: { code: 'CONFIG_ERROR', message: 'GEMINI_API_KEY is not configured in Vercel environment variables.' },
    });
  }

  const cleanApiKey = apiKey.replace(/^["']|["']$/g, '').trim();
  const rawModel = process.env.GEMINI_MODEL?.replace(/^["']|["']$/g, '').trim();
  const modelName = rawModel || 'gemini-1.5-flash';

  // 8. Call Gemini AI via native REST API (fetch)
  try {
    const endpointUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(cleanApiKey)}`;
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `System Persona: You are Color Muse, a world-class master painter, color theorist, and artistic consultant. Your expertise spans color theory (analogous, complementary, triadic), lighting value, pigment interaction, and mood resonance for traditional and digital art media. Act strictly as a master artist tool. Never output intro text, conversational commentary, or explanations outside JSON. Output ONLY pure JSON representing the requested color palette.\n\nArtistic Request:\n- Art Medium: ${requestData.medium || 'Any'}\n- Subject / Theme: ${requestData.subject || 'Creative Work'}\n- Mood & Vibe: ${requestData.mood || 'Expressive'}\n- Base Color Hint: ${requestData.baseColor || 'None'}\n- Required Color Count: Exactly ${requestData.colorCount} colors.\n\nGenerate a harmonious, professional palette as pure JSON matching this exact structure:\n{\n  "paletteName": "Evocative Palette Name",\n  "description": "Concise artist note on light, mood, and color interaction (1 sentence)",\n  "harmony": "Color Theory Harmony Type (e.g. Split-Complementary, Monochromatic, Triadic, Warm Analogous)",\n  "colors": [\n    {\n      "hex": "#HEX6DIGITS",\n      "name": "Evocative Color Name",\n      "role": "Artistic Role (e.g. Primary Mass Tone, Ambient Shadow, Highlight Accent, Midtone Transition)"\n    }\n  ],\n  "usageTips": ["Practical advice on value grouping and pigment placement"],\n  "contrastNotes": ["Technical advice on value separation and focal contrast"]\n}\nThe "colors" array MUST contain exactly ${requestData.colorCount} colors. Every "hex" value MUST be an uppercase 6-digit hex code with a leading # (e.g. #E07A5F).`,
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
      let googleStatus = 'UNKNOWN';
      let googleMessage = '';
      try {
        const errJson = JSON.parse(errText);
        if (errJson?.error) {
          googleStatus = errJson.error.status || String(errJson.error.code || response.status);
          googleMessage = errJson.error.message || '';
        }
      } catch {
        googleMessage = errText.slice(0, 300);
      }

      // Safe server-side log for GEMINI_HTTP
      console.error('[GEMINI_HTTP] Error calling Gemini API:', {
        stage: 'GEMINI_HTTP',
        responseStatus: response.status,
        googleStatus,
        googleMessage,
        model: modelName,
      });

      const errLower = (googleMessage || errText).toLowerCase();

      if (response.status === 400) {
        if (errLower.includes('api_key_invalid') || errLower.includes('key not valid') || errLower.includes('api key not valid')) {
          return res.status(500).json({
            data: null,
            error: {
              code: 'GEMINI_AUTH_ERROR',
              message: 'A chave GEMINI_API_KEY configurada na Vercel está inválida ou revogada pelo Google.',
            },
          });
        }
        return res.status(400).json({
          data: null,
          error: {
            code: 'GEMINI_BAD_REQUEST',
            message: 'Requisição inválida enviada para a API do Gemini.',
          },
        });
      }

      if (response.status === 401 || response.status === 403) {
        return res.status(403).json({
          data: null,
          error: {
            code: 'GEMINI_AUTH_ERROR',
            message: 'Falha de autenticação ou permissão de acesso à API do Gemini.',
          },
        });
      }

      if (response.status === 404) {
        return res.status(404).json({
          data: null,
          error: {
            code: 'GEMINI_MODEL_NOT_FOUND',
            message: `O modelo Gemini configurado (${modelName}) não foi encontrado ou não está disponível.`,
          },
        });
      }

      if (
        response.status === 429 ||
        googleStatus === 'RESOURCE_EXHAUSTED' ||
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

      if (response.status >= 500) {
        return res.status(502).json({
          data: null,
          error: {
            code: 'GEMINI_UPSTREAM_ERROR',
            message: 'O servidor upstream do Gemini retornou um erro interno.',
          },
        });
      }

      return res.status(502).json({
        data: null,
        error: {
          code: 'GEMINI_UPSTREAM_ERROR',
          message: 'Falha na comunicação com o serviço Gemini AI.',
        },
      });
    }

    let resJson: any;
    try {
      resJson = await response.json();
    } catch (parseErr: any) {
      console.error('[GEMINI_PARSE] Failed to parse HTTP response as JSON:', {
        stage: 'GEMINI_PARSE',
        responseStatus: response.status,
        errorMessage: parseErr?.message || String(parseErr),
      });
      return res.status(502).json({
        data: null,
        error: {
          code: 'GEMINI_INVALID_RESPONSE',
          message: 'A resposta recebida do Gemini não pôde ser decodificada.',
        },
      });
    }

    const text = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.error('[GEMINI_PARSE] Gemini returned empty response text:', {
        stage: 'GEMINI_PARSE',
        responseStatus: response.status,
        finishReason: resJson.candidates?.[0]?.finishReason,
      });
      return res.status(502).json({
        data: null,
        error: {
          code: 'GEMINI_INVALID_RESPONSE',
          message: 'O Gemini retornou uma resposta de conteúdo vazia.',
        },
      });
    }

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch (jsonErr: any) {
      console.error('[GEMINI_PARSE] Failed to parse generated text content as JSON:', {
        stage: 'GEMINI_PARSE',
        errorMessage: jsonErr?.message || String(jsonErr),
      });
      return res.status(502).json({
        data: null,
        error: {
          code: 'GEMINI_INVALID_RESPONSE',
          message: 'O conteúdo retornado pelo Gemini não é um JSON válido.',
        },
      });
    }

    // 9. Validate Gemini response against Zod schema
    const validation = GeminiPaletteSchema.safeParse(parsed);
    if (!validation.success) {
      console.error('[GEMINI_SCHEMA] Gemini response does not match palette schema:', {
        stage: 'GEMINI_SCHEMA',
        errors: validation.error.format(),
      });
      return res.status(502).json({
        data: null,
        error: {
          code: 'GEMINI_SCHEMA_ERROR',
          message: 'A estrutura da paleta gerada pelo Gemini é incompatível.',
        },
      });
    }

    const palette = validation.data;

    // Enforce exact color count
    if (palette.colors.length !== requestData.colorCount) {
      console.error('[GEMINI_COLOR_COUNT] Color count mismatch:', {
        stage: 'GEMINI_COLOR_COUNT',
        expected: requestData.colorCount,
        received: palette.colors.length,
      });
      return res.status(502).json({
        data: null,
        error: {
          code: 'GEMINI_SCHEMA_ERROR',
          message: `Gemini retornou ${palette.colors.length} cores, mas o esperado era ${requestData.colorCount}.`,
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
    console.error('[GEMINI_UPSTREAM_ERROR] Unexpected error during Gemini palette generation:', {
      stage: 'GEMINI_HTTP',
      errorMessage: err?.message || String(err),
    });
    return res.status(500).json({
      data: null,
      error: {
        code: 'GEMINI_UPSTREAM_ERROR',
        message: 'Falha ao processar solicitação com a IA Gemini.',
      },
    });
  }
}
