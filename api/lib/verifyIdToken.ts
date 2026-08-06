import { jwtVerify, createRemoteJWKSet } from 'jose';

const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

export async function verifyFirebaseIdToken(idToken: string, projectId: string): Promise<{ uid: string }> {
  const cleanProjectId = projectId.replace(/^["']|["']$/g, '').trim();
  const { payload } = await jwtVerify(idToken, JWKS, {
    issuer: `https://securetoken.google.com/${cleanProjectId}`,
    audience: cleanProjectId,
  });
  if (!payload.sub) {
    throw new Error('ID Token payload does not contain subject (sub).');
  }
  return { uid: payload.sub };
}
