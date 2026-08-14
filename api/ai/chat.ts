import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';
import { getFirestore, Firestore, Timestamp } from 'firebase-admin/firestore';
import { jwtVerify, createRemoteJWKSet } from 'jose';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

// ==========================================
// 1. SCHEMAS
// ==========================================
export const ChatHistoryItemSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().max(8000),
});

export const ChatRequestSchema = z.object({
  conversationId: z.string().max(128).optional(),
  message: z.string().trim().min(1, { message: 'Message cannot be empty.' }).max(4000, { message: 'Message cannot exceed 4000 characters.' }),
  intent: z.enum(['chat', 'create_palette', 'research', 'art_feedback']).optional(),
  projectId: z.string().max(128).optional(),
  history: z.array(ChatHistoryItemSchema).max(30).optional(),
});

export const PaletteColorSchema = z.object({
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, { message: 'Invalid hex code format' }),
  name: z.string().min(1).max(60),
  role: z.string().min(1).max(80),
});

export const PaletteToolOutputSchema = z.object({
  paletteName: z.string().min(1).max(80),
  description: z.string().min(1).max(300),
  harmony: z.string().min(1).max(60),
  colors: z.array(PaletteColorSchema).min(3).max(8),
  usageTips: z.array(z.string()).min(1),
  contrastNotes: z.array(z.string()).optional(),
});

// ==========================================
// 2. SYSTEM PROMPT
// ==========================================
export const ARTFLOW_SYSTEM_PROMPT = `Você é o ArtFlow AI, um artista profissional, mentor de arte e assistente criativo de alto nível integrado ao aplicativo ArtFlow.

SUA MISSÃO:
Inspirar, orientar, educar e colaborar com artistas em todas as etapas da criação visual (do rascunho e teoria ao acabamento e estilo).

SUA PERSONALIDADE E VOZ:
- Especialista, acolhedor, inspirador, técnico quando necessário e sempre construtivo.
- Você entende profundamente: teoria das cores (valores, saturação, temperatura, harmonias), anatomia, composição (regra dos terços, proporção áurea, linhas-guia), iluminação (luz direta, oclusão ambiental, bounce light, chiaroscuro, subsurface scattering), estilos (arte digital, tradicional, pintura a óleo, aquarela, anime/mangá, pixel art, concept art, design de personagens e cenários).

DIRETRIZES DE RESPOSTA:
1. Responda no idioma do usuário (principalmente Português do Brasil).
2. Seja claro, direto e visualmente descritivo.
3. Formate suas respostas usando Markdown elegante com títulos, tópicos e ênfases quando apropriado.
4. Quando o usuário pedir ideias ou conceitos, ofereça direções criativas envolventes com dicas de iluminação, paleta e enquadramento.
5. Quando o usuário pedir paletas de cores ou harmonias (ou o intent for 'create_palette'), utilize a ferramenta 'create_palette' para gerar dados estruturados com nomes poéticos/técnicos para as cores e códigos HEX precisos.
6. Nunca invente fatos históricos ou termos irreais; use grounding para pesquisar referências contemporâneas ou factuais quando necessário.`;

// ==========================================
// 3. FIREBASE ADMIN & AUTH
// ==========================================
const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/robot/v1/metadata/jwk/securetoken@system.gserviceaccount.com')
);

async function verifyFirebaseIdToken(token: string, expectedProjectId: string) {
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: `https://securetoken.google.com/${expectedProjectId}`,
    audience: expectedProjectId,
  });
  return { uid: payload.sub as string, email: payload.email as string | undefined };
}

function getFirebaseAdmin(): { db: Firestore | null } {
  const projectId = process.env.FIREBASE_PROJECT_ID?.replace(/^["']|["']$/g, '').trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.replace(/^["']|["']$/g, '').trim();
  let privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/^["']|["']$/g, '').trim();

  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (!projectId) {
    return { db: null };
  }

  if (getApps().length > 0) {
    return { db: getFirestore(getApp()) };
  }

  try {
    if (clientEmail && privateKey) {
      const app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      return { db: getFirestore(app) };
    } else {
      const app = initializeApp({ projectId });
      return { db: getFirestore(app) };
    }
  } catch (err: any) {
    console.error('Firebase Admin init warning:', err?.message || err);
    return { db: null };
  }
}

// ==========================================
// 4. RATE LIMITING
// ==========================================
async function checkAiRateLimit(uid: string, db: Firestore | null): Promise<{ allowed: boolean; code?: string; message?: string }> {
  if (!uid) return { allowed: false, code: 'AUTH_REQUIRED', message: 'User ID missing.' };
  if (!db) return { allowed: true }; // Allow if admin DB is not strict

  const now = Timestamp.now();
  const docRef = db.collection('rateLimits').doc(`${uid}_ai`);

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

      if (hourlyCount >= 30 || dailyCount >= 100) {
        throw new Error('AI_RATE_LIMIT_EXCEEDED');
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
    if (e?.message === 'AI_RATE_LIMIT_EXCEEDED') {
      return {
        allowed: false,
        code: 'AI_RATE_LIMIT_EXCEEDED',
        message: 'Limite de mensagens do ArtFlow AI excedido (30 por hora ou 100 por dia).',
      };
    }
    return { allowed: true }; // non-fatal fallback
  }
}

// ==========================================
// 5. PALETTE NORMALIZATION
// ==========================================
function normalizeHexColor(hex: string): string {
  const clean = hex.trim().replace(/^#/, '');
  if (/^[0-9A-Fa-f]{6}$/.test(clean)) {
    return `#${clean.toUpperCase()}`;
  }
  return '#D9B98D';
}

function validateAndFormatPalette(raw: any, expectedCount?: number) {
  const parsed = PaletteToolOutputSchema.safeParse(raw);
  if (!parsed.success) {
    // If partial object, construct fallback
    return {
      paletteName: raw?.paletteName || 'Paleta Harmoniosa',
      description: raw?.description || 'Harmonia de cores gerada pelo ArtFlow AI.',
      harmony: raw?.harmony || 'Personalizada',
      colors: Array.isArray(raw?.colors)
        ? raw.colors.slice(0, 5).map((c: any, i: number) => ({
            hex: normalizeHexColor(c.hex || '#D9B98D'),
            name: c.name || `Cor ${i + 1}`,
            role: c.role || 'Tom',
          }))
        : [
            { hex: '#191715', name: 'Sombra Profunda', role: 'Base' },
            { hex: '#3D2918', name: 'Tom Médio Terroso', role: 'Secundária' },
            { hex: '#A45F32', name: 'Terracota', role: 'Destaque' },
            { hex: '#D9B98D', name: 'Ocre Dourado', role: 'Luz' },
            { hex: '#F1E2CB', name: 'Marfim Claro', role: 'Ponto Alto' },
          ],
      usageTips: raw?.usageTips || ['Use os tons mais escuros para sombras estruturais e os mais claros para pontos de iluminação focal.'],
    };
  }

  const palette = parsed.data;
  const targetCount = Math.max(3, Math.min(8, expectedCount || palette.colors.length || 5));
  const normalizedColors = palette.colors.slice(0, targetCount).map((c) => ({
    hex: normalizeHexColor(c.hex),
    name: c.name.trim(),
    role: c.role.trim(),
  }));

  while (normalizedColors.length < targetCount) {
    const idx = normalizedColors.length + 1;
    normalizedColors.push({
      hex: idx === 4 ? '#E5A855' : '#82A89C',
      name: `Tom ${idx}`,
      role: 'Tom Suporte',
    });
  }

  return {
    paletteName: palette.paletteName.trim(),
    description: palette.description.trim(),
    harmony: palette.harmony.trim(),
    colors: normalizedColors,
    usageTips: palette.usageTips || ['Use o contraste para direcionar o foco visual.'],
    contrastNotes: palette.contrastNotes || [],
  };
}

// ==========================================
// 6. GEMINI TOOLS DEFINITIONS
// ==========================================
const createPaletteDeclaration = {
  name: 'create_palette',
  description: 'Gera uma paleta de cores harmoniosa estruturada para artistas com nomes, funções (luz, sombra, acento) e códigos HEX.',
  parameters: {
    type: 'OBJECT',
    properties: {
      paletteName: { type: 'STRING', description: 'Nome poético ou descritivo da paleta' },
      description: { type: 'STRING', description: 'Breve explicação da atmosfera da paleta' },
      harmony: { type: 'STRING', description: 'Tipo de harmonia (análoga, complementar, triádica, etc.)' },
      colors: {
        type: 'ARRAY',
        description: 'Lista de 3 a 8 cores da paleta',
        items: {
          type: 'OBJECT',
          properties: {
            hex: { type: 'STRING', description: 'Código hexadecimal no formato #RRGGBB' },
            name: { type: 'STRING', description: 'Nome descritivo da cor' },
            role: { type: 'STRING', description: 'Papel na pintura (Luz, Sombra, Meio-tom, Destaque)' },
          },
          required: ['hex', 'name', 'role'],
        },
      },
      usageTips: {
        type: 'ARRAY',
        items: { type: 'STRING' },
        description: 'Dicas práticas de aplicação na arte',
      },
      contrastNotes: {
        type: 'ARRAY',
        items: { type: 'STRING' },
        description: 'Notas sobre valores tonais e contraste',
      },
    },
    required: ['paletteName', 'description', 'harmony', 'colors', 'usageTips'],
  },
};

// ==========================================
// 7. ORCHESTRATOR
// ==========================================
async function processArtFlowAIChat(params: {
  uid: string;
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  intent?: 'chat' | 'create_palette' | 'research' | 'art_feedback';
  projectId?: string;
  db: Firestore | null;
}) {
  const apiKey = process.env.GEMINI_API_KEY?.replace(/^["']|["']$/g, '').trim();
  if (!apiKey) {
    throw new Error('GEMINI_AUTH_ERROR');
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelName = process.env.GEMINI_MODEL?.replace(/^["']|["']$/g, '').trim() || 'gemini-flash-latest';

  // 1. Fetch project context if requested
  let projectContextText = '';
  if (params.projectId && params.db) {
    try {
      const projDoc = await params.db.collection('users').doc(params.uid).collection('projects').doc(params.projectId).get();
      if (projDoc.exists) {
        const pData = projDoc.data() || {};
        projectContextText = `\n\n[CONTEXTO DO PROJETO ATUAL DO USUÁRIO]:
Título: ${pData.title || 'Sem título'}
Categoria: ${pData.category || 'Não especificada'}
Progresso: ${pData.progress ?? 0}%
Descrição: ${pData.description || 'Sem descrição'}`;
      }
    } catch (err) {
      console.warn('Could not fetch project context:', err);
    }
  }

  // 2. Build system instructions
  const systemInstruction = ARTFLOW_SYSTEM_PROMPT + projectContextText;

  // 3. Format contents with history
  const contents: any[] = [];
  if (params.history && params.history.length > 0) {
    for (const h of params.history.slice(-10)) {
      contents.push({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }],
      });
    }
  }

  contents.push({
    role: 'user',
    parts: [{ text: params.message }],
  });

  // 4. Configure tools
  const tools: any[] = [{ functionDeclarations: [createPaletteDeclaration] }];

  // Add Google Search grounding for research or general inquiries
  if (params.intent === 'research' || !params.intent || params.intent === 'chat') {
    tools.push({ googleSearch: {} });
  }

  // 5. Call Gemini API
  let response;
  try {
    response = await ai.models.generateContent({
      model: modelName,
      contents,
      config: {
        systemInstruction: { parts: [{ text: systemInstruction }] },
        tools,
      },
    });
  } catch (err: any) {
    console.error('Gemini call error:', err);
    const msg = err?.message || '';
    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) throw new Error('GEMINI_RATE_LIMIT_EXCEEDED');
    if (msg.includes('401') || msg.includes('403') || msg.includes('API key')) throw new Error('GEMINI_AUTH_ERROR');
    if (msg.includes('404')) throw new Error('GEMINI_MODEL_NOT_FOUND');
    throw new Error('GEMINI_UPSTREAM_ERROR');
  }

  // 6. Process response parts
  const candidate = response.candidates?.[0];
  const parts = candidate?.content?.parts || [];

  let assistantText = '';
  let paletteData: any = null;

  for (const part of parts) {
    if (part.text) {
      assistantText += part.text;
    } else if (part.functionCall) {
      if (part.functionCall.name === 'create_palette') {
        const rawArgs = part.functionCall.args || {};
        paletteData = validateAndFormatPalette(rawArgs, 5);
        if (!assistantText.trim()) {
          assistantText = `🎨 Criei uma paleta especial para o seu conceito: **${paletteData.paletteName}** (${paletteData.harmony}).\n\n${paletteData.description}`;
        }
      }
    }
  }

  // If intent was create_palette and no function call occurred, build structured palette
  if (params.intent === 'create_palette' && !paletteData) {
    paletteData = validateAndFormatPalette({
      paletteName: 'Paleta Artística',
      description: assistantText.slice(0, 150) || 'Harmonia criada para seu conceito.',
      harmony: 'Harmônica',
      colors: [
        { hex: '#1C2826', name: 'Floresta Escura', role: 'Base' },
        { hex: '#48564D', name: 'Musgo Noturno', role: 'Sombra' },
        { hex: '#7D8471', name: 'Folhagem Pálida', role: 'Meio-tom' },
        { hex: '#C2B89B', name: 'Névoa Lunar', role: 'Luz' },
        { hex: '#EBEBD3', name: 'Luar Medieval', role: 'Ponto Alto' },
      ],
      usageTips: ['Aplique os tons frios para a atmosfera e o tom claro para o reflexo do luar.'],
    }, 5);
  }

  if (!assistantText.trim()) {
    assistantText = 'Aqui está a análise para sua arte.';
  }

  // 7. Extract grounding citations
  const sources: any[] = [];
  const groundingMetadata = candidate?.groundingMetadata;
  if (groundingMetadata?.groundingChunks) {
    for (const chunk of groundingMetadata.groundingChunks) {
      if (chunk.web?.uri && chunk.web?.title) {
        sources.push({
          title: chunk.web.title,
          url: chunk.web.uri,
          snippet: chunk.web.snippet || '',
        });
      }
    }
  }

  return {
    message: {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      role: 'assistant',
      content: assistantText.trim(),
      palette: paletteData || undefined,
      sources: sources.length > 0 ? sources.slice(0, 4) : undefined,
      createdAt: new Date().toISOString(),
    },
    palette: paletteData || undefined,
    sources: sources.length > 0 ? sources.slice(0, 4) : undefined,
  };
}

// ==========================================
// 8. SERVERLESS HANDLER
// ==========================================
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      data: null,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' },
    });
  }

  const contentLength = req.headers['content-length'];
  if (contentLength && parseInt(contentLength, 10) > 1024 * 1024) {
    return res.status(413).json({
      data: null,
      error: { code: 'PAYLOAD_TOO_LARGE', message: 'Payload exceeds 1MB limit.' },
    });
  }

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
    return res.status(401).json({
      data: null,
      error: { code: 'AUTH_INVALID', message: 'Invalid or expired ID token.' },
    });
  }

  const rawBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  const parseResult = ChatRequestSchema.safeParse(rawBody);
  if (!parseResult.success) {
    return res.status(400).json({
      data: null,
      error: { code: 'VALIDATION_ERROR', message: parseResult.error.issues[0]?.message || 'Invalid chat request format.' },
    });
  }

  const requestData = parseResult.data;
  const { db: adminDb } = getFirebaseAdmin();

  const rateLimitResult = await checkAiRateLimit(uid, adminDb);
  if (!rateLimitResult.allowed) {
    return res.status(429).json({
      data: null,
      error: {
        code: rateLimitResult.code || 'AI_RATE_LIMIT_EXCEEDED',
        message: rateLimitResult.message || 'Limite de mensagens do ArtFlow AI excedido.',
      },
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      data: null,
      error: { code: 'CONFIG_ERROR', message: 'GEMINI_API_KEY is not configured in Vercel environment variables.' },
    });
  }

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
