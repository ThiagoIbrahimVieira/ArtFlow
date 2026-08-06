import {
  cert,
  getApp,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import {
  getFirestore,
  type Firestore,
} from "firebase-admin/firestore";

interface FirebaseAdminServices {
  auth: Auth;
  db: Firestore;
}

let cachedServices: FirebaseAdminServices | null = null;

function requireEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`MISSING_${name}`);
  }

  return value;
}

export function getFirebaseAdmin(): FirebaseAdminServices {
  if (cachedServices) {
    return cachedServices;
  }

  const projectId = requireEnvironmentVariable("FIREBASE_PROJECT_ID");
  const clientEmail = requireEnvironmentVariable("FIREBASE_CLIENT_EMAIL");

  const rawPrivateKey =
    requireEnvironmentVariable("FIREBASE_PRIVATE_KEY");

  const privateKey = rawPrivateKey
    .replace(/^["']|["']$/g, "")
    .replace(/\\n/g, "\n")
    .trim();

  const validPrivateKey =
    privateKey.includes("-----BEGIN PRIVATE KEY-----") &&
    privateKey.includes("-----END PRIVATE KEY-----");

  if (!validPrivateKey) {
    throw new Error("INVALID_FIREBASE_PRIVATE_KEY");
  }

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
    auth: getAuth(app),
    db: getFirestore(app),
  };

  return cachedServices;
}
