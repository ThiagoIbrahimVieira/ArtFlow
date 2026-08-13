import { put } from '@vercel/blob';
import { verifyFirebaseIdToken } from '../_lib/verifyIdToken';

export const config = {
  api: {
    bodyParser: false, // Handle raw stream for file upload
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      data: null,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' },
    });
  }

  // 1. Check Firebase Project ID
  const projectId = process.env.FIREBASE_PROJECT_ID?.replace(/^["']|["']$/g, '').trim();
  if (!projectId) {
    return res.status(500).json({
      data: null,
      error: {
        code: 'FIREBASE_ADMIN_CONFIG_ERROR',
        message: 'Configuração do servidor Firebase indisponível.',
      },
    });
  }

  // 2. Authorization header check & verification
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

  // 3. Check Vercel Blob token
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) {
    return res.status(503).json({
      data: null,
      error: {
        code: 'BLOB_TOKEN_NOT_CONFIGURED',
        message: 'O armazenamento de arquivos (Vercel Blob) ainda não foi configurado no ambiente da Vercel.',
      },
    });
  }

  // 4. Content-Type and size checks
  const contentType = req.headers['content-type'] || 'image/jpeg';
  const uploadType = (req.query?.type as string) || (req.headers['x-upload-type'] as string) || 'projects';
  const cleanUploadType = ['projects', 'references', 'avatar'].includes(uploadType) ? uploadType : 'projects';

  const contentLength = req.headers['content-length'];
  if (contentLength && parseInt(contentLength, 10) > 5 * 1024 * 1024) {
    return res.status(413).json({
      data: null,
      error: { code: 'PAYLOAD_TOO_LARGE', message: 'A imagem excede o tamanho máximo permitido de 5 MB.' },
    });
  }

  const extension = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
  const randomSuffix = Math.random().toString(36).substring(2, 9);
  const pathname = `users/${uid}/${cleanUploadType}/${Date.now()}-${randomSuffix}.${extension}`;

  try {
    // Read raw body chunks from stream
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const buffer = Buffer.concat(chunks);

    if (buffer.length === 0) {
      return res.status(400).json({
        data: null,
        error: { code: 'EMPTY_PAYLOAD', message: 'No file data received.' },
      });
    }

    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(413).json({
        data: null,
        error: { code: 'PAYLOAD_TOO_LARGE', message: 'A imagem excede o tamanho máximo permitido de 5 MB.' },
      });
    }

    const blob = await put(pathname, buffer, {
      access: 'public',
      token: blobToken,
      contentType,
    });

    return res.status(200).json({
      data: {
        url: blob.url,
        pathname: blob.pathname,
      },
      error: null,
    });
  } catch (err: any) {
    console.error('Vercel Blob upload error:', err);
    return res.status(500).json({
      data: null,
      error: {
        code: 'UPLOAD_FAILED',
        message: 'Falha ao processar o upload da imagem na Vercel Blob.',
      },
    });
  }
}
