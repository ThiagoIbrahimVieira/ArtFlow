import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminAuthInstance: Auth | null = null;
let adminDbInstance: Firestore | null = null;
let initError: string | null = null;

function initFirebaseAdmin() {
  if (getApps().length > 0) {
    try {
      adminAuthInstance = getAuth();
      adminDbInstance = getFirestore();
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
      const privateKey = rawPrivateKey.replace(/\\n/g, '\n');
      const app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      adminAuthInstance = getAuth(app);
      adminDbInstance = getFirestore(app);
    } catch (err: any) {
      initError = `Firebase Admin cert initialization error: ${err.message}`;
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
