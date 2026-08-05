import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  sendEmailVerification as firebaseSendEmailVerification,
  updateProfile as firebaseUpdateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';

import { auth, googleProvider } from '../lib/firebase';
import { createUserProfile, getUserProfile } from './userService';
import { UserProfile } from '../types';

export interface SignUpParams {
  displayName: string;
  email: string;
  password: string;
}

export interface AuthState {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  authenticated: boolean;
  emailVerified: boolean;
}

export function parseAuthError(error: any): string {
  const code = error?.code || '';
  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network connection error. Please check your internet connection.';
    case 'auth/user-disabled':
      return 'This user account has been disabled.';
    case 'auth/requires-recent-login':
      return 'Please re-authenticate before performing this operation.';
    default:
      return error?.message || 'An unexpected authentication error occurred.';
  }
}

export async function signUp({ displayName, email, password }: SignUpParams): Promise<{ user: FirebaseUser; profile: UserProfile }> {
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedName = displayName.trim();

  if (!trimmedName) {
    throw new Error('Please enter your full name.');
  }
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('Please enter a valid email address.');
  }
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
    const user = userCredential.user;

    await firebaseUpdateProfile(user, { displayName: trimmedName });

    try {
      await firebaseSendEmailVerification(user);
    } catch (verr) {
      console.warn('Could not send verification email immediately:', verr);
    }

    const profile = await createUserProfile(user.uid, {
      displayName: trimmedName,
      email: normalizedEmail,
    });

    return { user, profile };
  } catch (error) {
    throw new Error(parseAuthError(error));
  }
}

export async function signIn(email: string, password: string): Promise<{ user: FirebaseUser; profile: UserProfile | null }> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error('Please enter your email address.');
  }
  if (!password) {
    throw new Error('Please enter your password.');
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
    const user = userCredential.user;
    const profile = await getUserProfile(user.uid);

    return { user, profile };
  } catch (error) {
    throw new Error(parseAuthError(error));
  }
}

export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    throw new Error(parseAuthError(error));
  }
}

export async function resetPassword(email: string): Promise<{ success: boolean; message: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('Please enter a valid email address.');
  }

  try {
    await firebaseSendPasswordResetEmail(auth, normalizedEmail);
  } catch (error) {
    // Generic response per security requirement
    console.warn('Password reset attempt error:', error);
  }

  return {
    success: true,
    message: 'If an account exists for this email, a password reset link has been sent.',
  };
}

export async function resendVerificationEmail(): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('No authenticated user found.');
  }
  try {
    await firebaseSendEmailVerification(currentUser);
  } catch (error) {
    throw new Error(parseAuthError(error));
  }
}

export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}

export function listenForAuthenticationChanges(
  callback: (user: FirebaseUser | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

export async function restoreSession(): Promise<{ user: FirebaseUser | null; profile: UserProfile | null }> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return { user: null, profile: null };
  }
  const profile = await getUserProfile(currentUser.uid);
  return { user: currentUser, profile };
}
