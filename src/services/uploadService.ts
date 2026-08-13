import { auth } from '../lib/firebase';

export interface UploadResult {
  url: string;
  pathname?: string;
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'Nenhum arquivo selecionado.' };
  }

  const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validMimeTypes.includes(file.type)) {
    return { valid: false, error: 'Formato de arquivo não suportado. Use JPEG, PNG ou WebP.' };
  }

  const maxSizeBytes = 5 * 1024 * 1024; // 5 MB
  if (file.size > maxSizeBytes) {
    return { valid: false, error: 'O arquivo excede o limite máximo de 5 MB.' };
  }

  return { valid: true };
}

export function validateUploadFile(file: File): void {
  const result = validateImageFile(file);
  if (!result.valid) {
    throw new Error(result.error || 'Arquivo de imagem inválido.');
  }
}

export async function uploadImageFile(
  file: File,
  type: 'projects' | 'references' | 'avatar' = 'projects'
): Promise<UploadResult> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Arquivo de imagem inválido.');
  }

  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Você precisa estar autenticado para enviar imagens.');
  }

  const idToken = await currentUser.getIdToken(true);

  try {
    const res = await fetch(`/api/upload?type=${type}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': file.type,
        'x-upload-type': type,
      },
      body: file,
    });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await res.text().catch(() => '');
      console.warn('Non-JSON response from upload endpoint:', text);
      throw new Error('Serviço de upload indisponível.');
    }

    const json = await res.json();
    if (!res.ok || json.error) {
      if (json.error?.code === 'BLOB_TOKEN_NOT_CONFIGURED') {
        throw new Error('Armazenamento de imagens (Vercel Blob) não configurado na Vercel.');
      }
      throw new Error(json.error?.message || 'Falha no upload da imagem.');
    }

    return {
      url: json.data.url,
      pathname: json.data.pathname,
    };
  } catch (err: any) {
    console.error('Upload image error:', err);
    throw err;
  }
}
