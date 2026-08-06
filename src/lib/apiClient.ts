/**
 * Centralized API Client helper using VITE_API_BASE_URL.
 * In development, VITE_API_BASE_URL can be empty (using Vite proxy) or point to Functions Emulator.
 * In production, VITE_API_BASE_URL can be set to the backend public URL.
 */
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '';

export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${apiBaseUrl}${cleanPath}`;
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = getApiUrl(path);
  return fetch(url, options);
}
