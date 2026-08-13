import { describe, it, expect } from 'vitest';
import { ArtFlowAIChatRequestSchema, CreatePaletteToolSchema } from '../../api/_lib/ai/chatSchemas';
import { normalizeGeneratedPalette } from '../../api/_lib/ai/paletteTool';
import { checkAiRateLimit } from '../../api/_lib/rateLimit';

describe('ArtFlow AI Request Validation Schemas', () => {
  it('validates a valid chat request payload', () => {
    const validPayload = {
      message: 'Como aplicar chiaroscuro em uma pintura digital?',
      intent: 'chat',
      projectId: 'proj_123',
    };
    const parsed = ArtFlowAIChatRequestSchema.safeParse(validPayload);
    expect(parsed.success).toBe(true);
  });

  it('rejects an empty message or message exceeding max length', () => {
    const emptyPayload = { message: '   ' };
    expect(ArtFlowAIChatRequestSchema.safeParse(emptyPayload).success).toBe(false);

    const hugePayload = { message: 'a'.repeat(4001) };
    expect(ArtFlowAIChatRequestSchema.safeParse(hugePayload).success).toBe(false);
  });

  it('validates create_palette intent and history messages', () => {
    const validWithHistory = {
      message: 'Crie uma paleta estilo Cyberpunk Neon',
      intent: 'create_palette',
      history: [
        { role: 'user', content: 'Olá' },
        { role: 'assistant', content: 'Olá! Como posso ajudar com sua arte hoje?' },
      ],
    };
    const parsed = ArtFlowAIChatRequestSchema.safeParse(validWithHistory);
    expect(parsed.success).toBe(true);
  });
});

describe('ArtFlow AI Palette Tool Normalization', () => {
  it('normalizes and validates raw palette tool arguments', () => {
    const rawArgs = {
      paletteName: 'Pôr do Sol Místico',
      description: 'Tons alaranjados e violetas para entardecer',
      harmony: 'complementar',
      colors: [
        { hex: '#FF5500', name: 'Laranja Solar', role: 'Destaque' },
        { hex: '#4A148C', name: 'Roxo Crepúsculo', role: 'Sombra' },
        { hex: '#FFE0B2', name: 'Luz Dourada', role: 'Luz' },
      ],
      usageTips: ['Use o roxo nas oclusões ambientais'],
    };

    const normalized = normalizeGeneratedPalette(rawArgs);
    expect(normalized.paletteName).toBe('Pôr do Sol Místico');
    expect(normalized.colors).toHaveLength(3);
    expect(normalized.colors[0].hex).toBe('#FF5500');
    expect(normalized.colors[1].hex).toBe('#4A148C');
  });

  it('validates with CreatePaletteToolSchema', () => {
    const validToolCall = {
      paletteName: 'Cyberpunk Glow',
      description: 'High contrast neon palette',
      harmony: 'triádica',
      colors: [
        { hex: '#00FFFF', name: 'Cyan Neon', role: 'Luz Principal' },
        { hex: '#FF007F', name: 'Magenta Glow', role: 'Luz Secundária' },
        { hex: '#120024', name: 'Deep Violet', role: 'Fundo / Sombra' },
      ],
      usageTips: ['Destaque os elementos reflexivos com Ciano'],
    };
    const result = CreatePaletteToolSchema.safeParse(validToolCall);
    expect(result.success).toBe(true);
  });
});

describe('ArtFlow AI Rate Limiter Logic', () => {
  it('handles missing db gracefully by returning RATE_LIMIT_UNAVAILABLE', async () => {
    const check = await checkAiRateLimit('user_test_123', null);
    expect(check.allowed).toBe(false);
    expect(check.code).toBe('RATE_LIMIT_UNAVAILABLE');
  });

  it('handles missing uid by returning AUTH_REQUIRED', async () => {
    const check = await checkAiRateLimit('', null);
    expect(check.allowed).toBe(false);
    expect(check.code).toBe('AUTH_REQUIRED');
  });

  it('allows requests when under limit in mock firestore', async () => {
    const mockStore: Record<string, any> = {};
    const mockDb: any = {
      collection: () => ({
        doc: (docId: string) => ({
          _id: docId,
        }),
      }),
      runTransaction: async (cb: any) => {
        const mockTransaction = {
          get: async (docRef: any) => ({
            exists: Boolean(mockStore[docRef._id]),
            data: () => mockStore[docRef._id] || {},
          }),
          set: (docRef: any, data: any) => {
            mockStore[docRef._id] = data;
          },
        };
        return cb(mockTransaction);
      },
    };

    const res = await checkAiRateLimit('user_mock_1', mockDb);
    expect(res.allowed).toBe(true);
  });
});
