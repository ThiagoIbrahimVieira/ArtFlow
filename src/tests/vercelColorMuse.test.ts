import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from '../../api/ai/color-muse';

// Mock firebaseAdmin and rateLimit modules
vi.mock('../../api/lib/firebaseAdmin', () => ({
  adminAuth: {
    verifyIdToken: vi.fn(),
  },
  adminDb: {},
}));

vi.mock('../../api/lib/rateLimit', () => ({
  checkRateLimit: vi.fn(),
}));

const mockGenerateContent = vi.fn();

// Mock @google/genai SDK
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
      models = {
        generateContent: (...args: any[]) => mockGenerateContent(...args),
      };
    },
  };
});

import { adminAuth } from '../../api/lib/firebaseAdmin';
import { checkRateLimit } from '../../api/lib/rateLimit';
import { GoogleGenAI } from '@google/genai';

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

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...origEnv, GEMINI_API_KEY: 'test-fake-api-key' };
    (checkRateLimit as any).mockResolvedValue({ allowed: true });
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
    (adminAuth.verifyIdToken as any).mockRejectedValue(new Error('Invalid token'));
    const { req, res } = createMockReqRes('POST', { authorization: 'Bearer invalid-token' }, { medium: 'oil', subject: 'landscape', mood: 'calm', colorCount: 5 });
    await handler(req, res);
    expect(res.getStatusCode()).toBe(401);
    expect(res.getResponse()?.error?.code).toBe('AUTH_REQUIRED');
  });

  it('4. Invalid payload returns 400', async () => {
    (adminAuth.verifyIdToken as any).mockResolvedValue({ uid: 'user-123' });
    const { req, res } = createMockReqRes('POST', { authorization: 'Bearer valid-token' }, { colorCount: 999 }); // missing prompt/medium and colorCount > 10
    await handler(req, res);
    expect(res.getStatusCode()).toBe(400);
    expect(res.getResponse()?.error?.code).toBe('VALIDATION_ERROR');
  });

  it('5. Secret missing returns controlled error', async () => {
    delete process.env.GEMINI_API_KEY;
    (adminAuth.verifyIdToken as any).mockResolvedValue({ uid: 'user-123' });
    const { req, res } = createMockReqRes('POST', { authorization: 'Bearer valid-token' }, { medium: 'oil', subject: 'landscape', mood: 'calm', colorCount: 5 });
    await handler(req, res);
    expect(res.getStatusCode()).toBe(500);
    expect(res.getResponse()?.error?.code).toBe('CONFIG_ERROR');
  });

  it('6. Mocked Gemini returns valid palette', async () => {
    (adminAuth.verifyIdToken as any).mockResolvedValue({ uid: 'user-123' });
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

    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify(mockPalette),
    });

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

  it('7. Gemini 429 rate limit returns correct code', async () => {
    (adminAuth.verifyIdToken as any).mockResolvedValue({ uid: 'user-123' });
    const err429 = new Error('Quota exceeded for Gemini');
    (err429 as any).status = 429;

    mockGenerateContent.mockRejectedValueOnce(err429);

    const { req, res } = createMockReqRes(
      'POST',
      { authorization: 'Bearer valid-token' },
      { medium: 'oil', subject: 'forest', mood: 'mystic', colorCount: 5 }
    );

    await handler(req, res);

    expect(res.getStatusCode()).toBe(429);
    expect(res.getResponse()?.error?.code).toBe('GEMINI_DAILY_QUOTA_EXCEEDED');
  });

  it('8. Internal rate-limit returns different code', async () => {
    (adminAuth.verifyIdToken as any).mockResolvedValue({ uid: 'user-123' });
    (checkRateLimit as any).mockResolvedValue({
      allowed: false,
      code: 'APP_RATE_LIMIT_EXCEEDED',
      message: 'ArtFlow limit reached',
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
    (adminAuth.verifyIdToken as any).mockResolvedValue({ uid: 'user-123' });
    mockGenerateContent.mockRejectedValueOnce(new Error('Internal unexpected error secret=KEY123'));

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
    expect(res.getResponse()?.error?.code).toBe('GEMINI_ERROR');
  });
});
