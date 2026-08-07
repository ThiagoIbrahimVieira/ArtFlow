import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

interface FirebaseAdminServices {
  db: Firestore;
  auth: Auth;
}

let cachedServices: FirebaseAdminServices | null = null;

export function getFirebaseAdmin(): FirebaseAdminServices {
  if (cachedServices) {
    return cachedServices;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID?.replace(/^["']|["']$/g, "").trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.replace(/^["']|["']$/g, "").trim();
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !rawPrivateKey) {
    throw new Error("FIREBASE_ADMIN_CONFIG_ERROR");
  }

  const privateKey = rawPrivateKey
    .replace(/^["']|["']$/g, "")
    .replace(/\\n/g, "\n")
    .trim();

  const validPrivateKey =
    privateKey.includes("-----BEGIN PRIVATE KEY-----") &&
    privateKey.includes("-----END PRIVATE KEY-----");

  if (!validPrivateKey) {
    throw new Error("FIREBASE_ADMIN_CONFIG_ERROR");
  }

  try {
    const app =
      getApps().length > 0
        ? getApp()
        : initializeApp({
            projectId,
            credential: cert({
              projectId,
              clientEmail,
              privateKey,
            }),
          });

    cachedServices = {
      db: getFirestore(app),
      auth: getAuth(app),
    };

    return cachedServices;
  } catch (e) {
    throw new Error("FIREBASE_ADMIN_CONFIG_ERROR");
  }
}

export function getAdminAuth(): Auth {
  return getFirebaseAdmin().auth;
}

export function getAdminDb(): Firestore {
  return getFirebaseAdmin().db;
}

