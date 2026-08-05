import admin from 'firebase-admin';
import { getAuth, getFirestore } from 'firebase-admin/auth';

/**
 * Initialize Firebase Admin SDK.
 * Expects environment variables:
 *   - FIREBASE_PROJECT_ID
 *   - FIREBASE_CLIENT_EMAIL
 *   - FIREBASE_PRIVATE_KEY (with escaped newlines)
 *   - FIREBASE_DATABASE_URL (optional)
 *   - FIREBASE_SERVICE_ACCOUNT_PATH (optional path to JSON key file)
 */
if (!admin.apps.length) {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (serviceAccountPath) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
    });
  } else if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    // Private key may contain escaped newlines; replace with actual newlines.
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
  } else {
    console.warn('Firebase admin credentials not fully provided; running in mock mode.');
    admin.initializeApp();
  }
}

export const auth = getAuth();
export const db = getFirestore();
