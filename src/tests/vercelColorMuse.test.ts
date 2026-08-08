import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockJwtVerify = vi.fn();
const mockRunTransaction = vi.fn();

vi.mock('jose', () => ({
  createRemoteJWKSet: vi.fn(() => ({})),
  jwtVerify: (...args: any[]) => mockJwtVerify(...args),
}));

vi.mock('firebase-admin/app', () => ({
  getApps: vi.fn(() => []),
  getApp: vi.fn(),
  initializeApp: vi.fn(),
  cert: vi.fn(),
}));

vi.mock('firebase-admin/auth', () => ({
  getAuth: vi.fn(() => ({
    verifyIdToken: vi.fn(),
  })),
}));

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(() => ({
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({})),
    })),
    runTransaction: (...args: any[]) => mockRunTransaction(...args),
  })),
  Timestamp: {
    now: () => ({ seconds: Math.floor(Date.now() / 1000) }),
  },
}));

import handler from '../../api/ai/color-muse';

function createMockReqRes(method: string = 'POST', headers: Record<string, string> = {}, body: any = {}) {
  const req = {
    method,
    headers: { ...headers },
    body,
  };
  let statusCode = 200;
  let jsonResponse: any = null;

  const res = {
    status: (code: number) => {
      statusCode = code;
      return res;
    },
    json: (payload: any) => {
      jsonResponse = payload;
      return res;
    },
    getStatusCode: () => statusCode,
    getResponse: () => jsonResponse,
  };

  return { req, res };
}

describe('Vercel Function /api/ai/color-muse Test Suite', () => {
  const origEnv = process.env;
  const origFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...origEnv,
      GEMINI_API_KEY: 'test-fake-api-key',
      FIREBASE_PROJECT_ID: 'projeto-escolar-etec',
      FIREBASE_CLIENT_EMAIL: 'test@example.com',
      FIREBASE_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\nfake\n-----END PRIVATE KEY-----',
    };
    mockJwtVerify.mockResolvedValue({ payload: { sub: 'user-123' } });
    mockRunTransaction.mockImplementation(async (cb: any) => {
      return cb({
        get: vi.fn().mockResolvedValue({ exists: false }),
        set: vi.fn(),
      });
    });
  });

  afterEach(() => {
    globalThis.fetch = origFetch;
  });

  it('1. GET returns 405 Method Not Allowed', async () => {
    const { req, res } = createMockReqRes('GET');
    await handler(req, res);
    expect(res.getStatusCode()).toBe(405);
    expect(res.getResponse()?.error?.code).toBe('METHOD_NOT_ALLOWED');
  });

  it('2. POST without token returns 401', async () => {
    const { req, res } = createMockReqRes('POST', {}, { medium: 'oil', subject: 'landscape', mood: 'calm', colorCount: 5 });
    await handler(req, res);
    expect(res.getStatusCode()).toBe(401);
    expect(res.getResponse()?.error?.code).toBe('AUTH_REQUIRED');
  });

  it('3. Token invalid returns 401', async () => {
    mockJwtVerify.mockRejectedValue(new Error('Invalid token'));
    const { req, res } = createMockReqRes('POST', { authorization: 'Bearer invalid-token' }, { medium: 'oil', subject: 'landscape', mood: 'calm', colorCount: 5 });
    await handler(req, res);
    expect(res.getStatusCode()).toBe(401);
    expect(res.getResponse()?.error?.code).toBe('AUTH_REQUIRED');
  });

  it('4. Invalid payload returns 400', async () => {
    const { req, res } = createMockReqRes('POST', { authorization: 'Bearer valid-token' }, { colorCount: 999 });
    await handler(req, res);
    expect(res.getStatusCode()).toBe(400);
    expect(res.getResponse()?.error?.code).toBe('VALIDATION_ERROR');
  });

  it('5. Secret missing or invalid admin config returns FIREBASE_ADMIN_CONFIG_ERROR (500)', async () => {
    delete process.env.FIREBASE_PROJECT_ID;
    const { req, res } = createMockReqRes('POST', { authorization: 'Bearer valid-token' }, { medium: 'oil', subject: 'landscape', mood: 'calm', colorCount: 5 });
    await handler(req, res);
    expect(res.getStatusCode()).toBe(500);
    expect(res.getResponse()?.error?.code).toBe('FIREBASE_ADMIN_CONFIG_ERROR');
    expect(res.getResponse()?.error?.message).toBe('A configuração do servidor Firebase está inválida.');
  });

  it('5b. Invalid private key returns FIREBASE_ADMIN_CONFIG_ERROR (500)', async () => {
    process.env.FIREBASE_PRIVATE_KEY = 'invalid-key-no-headers';
    const { req, res } = createMockReqRes('POST', { authorization: 'Bearer valid-token' }, { medium: 'oil', subject: 'landscape', mood: 'calm', colorCount: 5 });
    await handler(req, res);
    expect(res.getStatusCode()).toBe(500);
    expect(res.getResponse()?.error?.code).toBe('FIREBASE_ADMIN_CONFIG_ERROR');
  });

  it('5c. Firestore rate-limit unavailable returns 503 RATE_LIMIT_UNAVAILABLE', async () => {
    mockRunTransaction.mockRejectedValue(new Error('Firestore connection failure'));
    const { req, res } = createMockReqRes('POST', { authorization: 'Bearer valid-token' }, { medium: 'oil', subject: 'landscape', mood: 'calm', colorCount: 5 });
    await handler(req, res);
    expect(res.getStatusCode()).toBe(503);
    expect(res.getResponse()?.error?.code).toBe('RATE_LIMIT_UNAVAILABLE');
    expect(res.getResponse()?.error?.message).toBe('O controle de uso está temporariamente indisponível.');
  });

  it('6. Mocked Gemini returns valid palette', async () => {
    const mockPalette = {
      paletteName: 'Mystic Forest',
      description: 'A deep green palette',
      harmony: 'Analogous',
      colors: [
        { hex: '#112233', name: 'Dark Green', role: 'Dominant' },
        { hex: '#445566', name: 'Moss', role: 'Secondary' },
        { hex: '#778899', name: 'Sage', role: 'Accent' },
        { hex: '#AABBCC', name: 'Leaf', role: 'Accent' },
        { hex: '#DDEEFF', name: 'Mist', role: 'Background' },
      ],
      usageTips: ['Use dark green for shadows'],
      contrastNotes: ['High contrast with white text'],
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify(mockPalette) }],
            },
          },
        ],
      }),
    } as any);

    const { req, res } = createMockReqRes(
      'POST',
      { authorization: 'Bearer valid-token' },
      { medium: 'oil', subject: 'forest', mood: 'mystic', colorCount: 5 }
    );

    await handler(req, res);

    expect(res.getStatusCode()).toBe(200);
    expect(res.getResponse()?.data?.palette?.paletteName).toBe('Mystic Forest');
    expect(res.getResponse()?.data?.palette?.colors.length).toBe(5);
  });

  it('7. Gemini 429 daily quota returns GEMINI_DAILY_QUOTA_EXCEEDED', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => JSON.stringify({
        error: { code: 429, message: 'Quota exceeded for Gemini daily', status: 'RESOURCE_EXHAUSTED' }
      }),
    } as any);

    const { req, res } = createMockReqRes(
      'POST',
      { authorization: 'Bearer valid-token' },
      { medium: 'oil', subject: 'forest', mood: 'mystic', colorCount: 5 }
    );

    await handler(req, res);

    expect(res.getStatusCode()).toBe(429);
    expect(res.getResponse()?.error?.code).toBe('GEMINI_DAILY_QUOTA_EXCEEDED');
  });

  it('7b. Gemini 429 rate limit returns GEMINI_RATE_LIMIT_EXCEEDED', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => JSON.stringify({
        error: { code: 429, message: 'Rate limit per minute exceeded', status: 'RESOURCE_EXHAUSTED' }
      }),
    } as any);

    const { req, res } = createMockReqRes(
      'POST',
      { authorization: 'Bearer valid-token' },
      { medium: 'oil', subject: 'forest', mood: 'mystic', colorCount: 5 }
    );

    await handler(req, res);

    expect(res.getStatusCode()).toBe(429);
    expect(res.getResponse()?.error?.code).toBe('GEMINI_RATE_LIMIT_EXCEEDED');
  });

  it('7c. Gemini 400 Bad Request returns GEMINI_BAD_REQUEST', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({
        error: { code: 400, message: 'Invalid parameter', status: 'INVALID_ARGUMENT' }
      }),
    } as any);

    const { req, res } = createMockReqRes(
      'POST',
      { authorization: 'Bearer valid-token' },
      { medium: 'oil', subject: 'forest', mood: 'mystic', colorCount: 5 }
    );

    await handler(req, res);

    expect(res.getStatusCode()).toBe(400);
    expect(res.getResponse()?.error?.code).toBe('GEMINI_BAD_REQUEST');
  });

  it('7d. Gemini 401/403 Auth Error returns GEMINI_AUTH_ERROR', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => JSON.stringify({
        error: { code: 403, message: 'Permission denied', status: 'PERMISSION_DENIED' }
      }),
    } as any);

    const { req, res } = createMockReqRes(
      'POST',
      { authorization: 'Bearer valid-token' },
      { medium: 'oil', subject: 'forest', mood: 'mystic', colorCount: 5 }
    );

    await handler(req, res);

    expect(res.getStatusCode()).toBe(403);
    expect(res.getResponse()?.error?.code).toBe('GEMINI_AUTH_ERROR');
  });

  it('7e. Gemini 404 Model Not Found returns GEMINI_MODEL_NOT_FOUND', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => JSON.stringify({
        error: { code: 404, message: 'models/gemini-xxx not found', status: 'NOT_FOUND' }
      }),
    } as any);

    const { req, res } = createMockReqRes(
      'POST',
      { authorization: 'Bearer valid-token' },
      { medium: 'oil', subject: 'forest', mood: 'mystic', colorCount: 5 }
    );

    await handler(req, res);

    expect(res.getStatusCode()).toBe(404);
    expect(res.getResponse()?.error?.code).toBe('GEMINI_MODEL_NOT_FOUND');
  });

  it('7f. Gemini 500 Upstream Error returns GEMINI_UPSTREAM_ERROR', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => JSON.stringify({
        error: { code: 500, message: 'Internal error', status: 'INTERNAL' }
      }),
    } as any);

    const { req, res } = createMockReqRes(
      'POST',
      { authorization: 'Bearer valid-token' },
      { medium: 'oil', subject: 'forest', mood: 'mystic', colorCount: 5 }
    );

    await handler(req, res);

    expect(res.getStatusCode()).toBe(502);
    expect(res.getResponse()?.error?.code).toBe('GEMINI_UPSTREAM_ERROR');
  });

  it('7g. Invalid JSON from Gemini returns GEMINI_INVALID_RESPONSE', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: 'NOT_A_JSON_STRING' }],
            },
          },
        ],
      }),
    } as any);

    const { req, res } = createMockReqRes(
      'POST',
      { authorization: 'Bearer valid-token' },
      { medium: 'oil', subject: 'forest', mood: 'mystic', colorCount: 5 }
    );

    await handler(req, res);

    expect(res.getStatusCode()).toBe(502);
    expect(res.getResponse()?.error?.code).toBe('GEMINI_INVALID_RESPONSE');
  });

  it('7h. Schema mismatch or count mismatch returns GEMINI_SCHEMA_ERROR', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify({ paletteName: 'Incomplete' }) }],
            },
          },
        ],
      }),
    } as any);

    const { req, res } = createMockReqRes(
      'POST',
      { authorization: 'Bearer valid-token' },
      { medium: 'oil', subject: 'forest', mood: 'mystic', colorCount: 5 }
    );

    await handler(req, res);

    expect(res.getStatusCode()).toBe(502);
    expect(res.getResponse()?.error?.code).toBe('GEMINI_SCHEMA_ERROR');
  });

  it('8. Internal rate-limit returns different code', async () => {
    mockRunTransaction.mockImplementation(async (cb: any) => {
      return cb({
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({ hourlyCount: 15, hourlyStart: { seconds: Math.floor(Date.now() / 1000) } }),
        }),
        set: vi.fn(),
      });
    });

    const { req, res } = createMockReqRes(
      'POST',
      { authorization: 'Bearer valid-token' },
      { medium: 'oil', subject: 'forest', mood: 'mystic', colorCount: 5 }
    );

    await handler(req, res);

    expect(res.getStatusCode()).toBe(429);
    expect(res.getResponse()?.error?.code).toBe('APP_RATE_LIMIT_EXCEEDED');
  });

  it('9 & 10. No error exposes stack trace or GEMINI_API_KEY', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Internal unexpected error secret=KEY123'));

    const { req, res } = createMockReqRes(
      'POST',
      { authorization: 'Bearer valid-token' },
      { medium: 'oil', subject: 'forest', mood: 'mystic', colorCount: 5 }
    );

    await handler(req, res);

    const jsonStr = JSON.stringify(res.getResponse());
    expect(jsonStr).not.toContain('stack');
    expect(jsonStr).not.toContain('test-fake-api-key');
    expect(jsonStr).not.toContain('KEY123');
    expect(res.getResponse()?.error?.code).toBe('GEMINI_UPSTREAM_ERROR');
  });
});
