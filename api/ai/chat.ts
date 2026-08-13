import { getFirebaseAdmin } from '../_lib/firebaseAdmin';
import { verifyFirebaseIdToken } from '../_lib/verifyIdToken';
import { checkAiRateLimit } from '../_lib/rateLimit';
import { ChatRequestSchema } from '../_lib/ai/chatSchemas';
import { processArtFlowAIChat } from '../_lib/ai/chatService';

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
    console.error('verifyFirebaseIdToken failed in /api/ai/chat:', e?.message || e);
    return res.status(401).json({
      data: null,
      error: { code: 'AUTH_INVALID', message: 'Invalid or expired ID token.' },
    });
  }

  // 5. Input payload validation with Zod
  const rawBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  const parseResult = ChatRequestSchema.safeParse(rawBody);
  if (!parseResult.success) {
    return res.status(400).json({
      data: null,
      error: { code: 'VALIDATION_ERROR', message: parseResult.error.issues[0]?.message || 'Invalid chat request format.' },
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

  const rateLimitResult = await checkAiRateLimit(uid, adminDb);
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
        code: rateLimitResult.code || 'AI_RATE_LIMIT_EXCEEDED',
        message: rateLimitResult.message || 'Limite de mensagens do ArtFlow AI excedido.',
      },
    });
  }

  // 7. Check Gemini API key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      data: null,
      error: { code: 'CONFIG_ERROR', message: 'GEMINI_API_KEY is not configured in Vercel environment variables.' },
    });
  }

  // 8. Process Chat with Gemini
  try {
    const result = await processArtFlowAIChat({
      uid,
      message: requestData.message,
      history: requestData.history,
      intent: requestData.intent,
      projectId: requestData.projectId,
      db: adminDb,
    });

    return res.status(200).json({
      data: result,
      error: null,
    });
  } catch (err: any) {
    const code = err?.message || 'GEMINI_UPSTREAM_ERROR';
    console.error('ArtFlow AI chat error:', code);

    if (code === 'GEMINI_AUTH_ERROR') {
      return res.status(500).json({
        data: null,
        error: {
          code: 'GEMINI_AUTH_ERROR',
          message: 'A chave da API Gemini está inválida ou expirada.',
        },
      });
    }

    if (code === 'GEMINI_RATE_LIMIT_EXCEEDED') {
      return res.status(429).json({
        data: null,
        error: {
          code: 'GEMINI_RATE_LIMIT_EXCEEDED',
          message: 'A cota do Gemini foi atingida. Aguarde alguns instantes e tente novamente.',
        },
      });
    }

    if (code === 'GEMINI_MODEL_NOT_FOUND') {
      return res.status(404).json({
        data: null,
        error: {
          code: 'GEMINI_MODEL_NOT_FOUND',
          message: 'O modelo de inteligência artificial configurado não foi encontrado.',
        },
      });
    }

    return res.status(500).json({
      data: null,
      error: {
        code: 'GEMINI_UPSTREAM_ERROR',
        message: 'Não foi possível obter resposta da IA no momento.',
      },
    });
  }
}
