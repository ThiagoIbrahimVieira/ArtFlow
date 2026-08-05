import admin from 'firebase-admin';
import { getAuth, getFirestore } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  // Expect service account JSON path in env var
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!serviceAccountPath) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_PATH env variable not set');
  }
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
  });
}

export const auth = getAuth();
export const db = getFirestore();
