import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminAuthInstance: Auth | null = null;
let adminDbInstance: Firestore | null = null;
let initError: string | null = null;

function normalizePrivateKey(key: string): string {
  if (!key) return '';
  let cleaned = key.trim();

  // Strip leading and trailing quotes if pasted with quotes
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  // Replace literal '\n' sequences with real newlines
  cleaned = cleaned.replace(/\\n/g, '\n');

  // Strip carriage returns
  cleaned = cleaned.replace(/\r/g, '');

  return cleaned;
}

function initFirebaseAdmin() {
  if (getApps().length > 0) {
    try {
      const app = getApps()[0];
      adminAuthInstance = getAuth(app);
      adminDbInstance = getFirestore(app);
    } catch (e: any) {
      initError = e.message;
    }
    return;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && rawPrivateKey) {
    try {
      const privateKey = normalizePrivateKey(rawPrivateKey);
      const app = initializeApp({
        credential: cert({
          projectId: projectId.trim(),
          clientEmail: clientEmail.trim(),
          privateKey,
        }),
      });
      adminAuthInstance = getAuth(app);
      adminDbInstance = getFirestore(app);
    } catch (err: any) {
      initError = `Firebase Admin cert error: ${err.message}`;
    }
  } else {
    try {
      const app = initializeApp();
      adminAuthInstance = getAuth(app);
      adminDbInstance = getFirestore(app);
    } catch (err: any) {
      initError = 'Variáveis do Firebase Admin (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) não foram configuradas nas Environment Variables da Vercel.';
    }
  }
}

export function getAdminAuth(): Auth {
  if (!adminAuthInstance) {
    initFirebaseAdmin();
  }
  if (!adminAuthInstance) {
    throw new Error(initError || 'Firebase Admin Auth is not initialized.');
  }
  return adminAuthInstance;
}

export function getAdminDb(): Firestore {
  if (!adminDbInstance) {
    initFirebaseAdmin();
  }
  if (!adminDbInstance) {
    throw new Error(initError || 'Firebase Admin Firestore is not initialized.');
  }
  return adminDbInstance;
}
