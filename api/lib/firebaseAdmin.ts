let adminAuthInstance: any = null;
let adminDbInstance: any = null;
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
  if (adminAuthInstance && adminDbInstance) return;

  try {
    // Dynamic require so module load never crashes Vercel function startup
    const { initializeApp, getApps, cert } = require('firebase-admin/app');
    const { getAuth } = require('firebase-admin/auth');
    const { getFirestore } = require('firebase-admin/firestore');

    if (getApps().length > 0) {
      const app = getApps()[0];
      adminAuthInstance = getAuth(app);
      adminDbInstance = getFirestore(app);
      return;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && rawPrivateKey) {
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
    } else {
      initError = 'Variáveis do Firebase Admin (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) não foram configuradas nas Environment Variables da Vercel.';
    }
  } catch (err: any) {
    initError = `Erro de inicialização do Firebase Admin: ${err.message}`;
  }
}

export function getAdminAuth(): any {
  initFirebaseAdmin();
  if (!adminAuthInstance) {
    throw new Error(initError || 'Firebase Admin Auth não foi inicializado.');
  }
  return adminAuthInstance;
}

export function getAdminDb(): any {
  initFirebaseAdmin();
  if (!adminDbInstance) {
    throw new Error(initError || 'Firebase Admin Firestore não foi inicializado.');
  }
  return adminDbInstance;
}
