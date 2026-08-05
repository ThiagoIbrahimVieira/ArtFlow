// src/lib/firebaseAdmin.ts
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
// Initialize using Google-managed credentials (no service account path)
const adminApp = getApps().length > 0 ? getApps()[0] : initializeApp();
export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
