import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';

const isDev = Boolean(import.meta.env.DEV);
const useEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
const appId = import.meta.env.VITE_FIREBASE_APP_ID;

if (!isDev) {
  if (!apiKey || !authDomain || !projectId || !storageBucket || !messagingSenderId || !appId) {
    console.error('Production Firebase configuration is missing required environment variables.');
  }
}

const firebaseConfig = {
  apiKey: apiKey || (isDev ? 'demo-key' : ''),
  authDomain: authDomain || (isDev ? 'artflow-demo.firebaseapp.com' : ''),
  projectId: projectId || (isDev ? 'artflow-demo' : ''),
  storageBucket: storageBucket || (isDev ? 'artflow-demo.appspot.com' : ''),
  messagingSenderId: messagingSenderId || (isDev ? '123456789012' : ''),
  appId: appId || (isDev ? '1:123456789012:web:demo' : ''),
};

const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

if (isDev && useEmulators) {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
  } catch (e) {
    // Emulator connection might already be active
  }
}

export { app, auth, db, googleProvider };


