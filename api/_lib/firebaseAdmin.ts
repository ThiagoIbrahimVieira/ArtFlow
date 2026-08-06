import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminAuthInstance: Auth | null = null;
let adminDbInstance: Firestore | null = null;
let initError: string | null = null;

function cleanValue(val?: string): string {
  if (!val) return '';
  let cleaned = val.trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned;
}

function normalizePrivateKey(key: string): string {
  if (!key) return '';
  let cleaned = cleanValue(key);

  cleaned = cleaned.replace(/\\n/g, '\n');
  cleaned = cleaned.replace(/\r/g, '');

  return cleaned;
}

function initFirebaseAdmin() {
  if (adminAuthInstance && adminDbInstance) return;

  try {
    if (getApps().length > 0) {
      const app = getApps()[0];
      adminAuthInstance = getAuth(app);
      adminDbInstance = getFirestore(app);
      return;
    }

    const projectId = cleanValue(process.env.FIREBASE_PROJECT_ID);
    const clientEmail = cleanValue(process.env.FIREBASE_CLIENT_EMAIL);
    const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && rawPrivateKey) {
      const privateKey = normalizePrivateKey(rawPrivateKey);
      const app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
      adminAuthInstance = getAuth(app);
      adminDbInstance = getFirestore(app);
    } else {
      initError = 'Variáveis do Firebase Admin (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) não foram configuradas nas Environment Variables da Vercel.';
    }
  } catch (err: any) {
    initError = `Erro de inicialização do Firebase Admin: ${err.message}`;
  }
}

export function getAdminAuth(): Auth {
  initFirebaseAdmin();
  if (!adminAuthInstance) {
    throw new Error(initError || 'Firebase Admin Auth não foi inicializado.');
  }
  return adminAuthInstance;
}

export function getAdminDb(): Firestore {
  initFirebaseAdmin();
  if (!adminDbInstance) {
    throw new Error(initError || 'Firebase Admin Firestore não foi inicializado.');
  }
  return adminDbInstance;
}
