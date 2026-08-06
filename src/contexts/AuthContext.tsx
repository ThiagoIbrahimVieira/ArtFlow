import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  signUp as serviceSignUp,
  signIn as serviceSignIn,
  signOut as serviceSignOut,
  resetPassword as serviceResetPassword,
  resendVerificationEmail as serviceResendVerificationEmail,
  listenForAuthenticationChanges,
  SignUpParams,
} from '../services/authService';
import { getUserProfile } from '../services/userService';
import { UserProfile } from '../types';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  authLoading: boolean;
  profileLoading: boolean;
  isSubmittingAuth: boolean;
  authenticated: boolean;
  emailVerified: boolean;
  signUp: (params: SignUpParams) => Promise<void>;
  signIn: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  resendVerificationEmail: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState<boolean>(false);

  const fetchProfile = async (uid: string) => {
    setProfileLoading(true);
    try {
      const p = await getUserProfile(uid);
      setProfile(p);
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      // Profile failure does not terminate Firebase Auth session.
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = listenForAuthenticationChanges(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchProfile(firebaseUser.uid);
      } else {
        setProfile(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignUp = async (params: SignUpParams) => {
    setIsSubmittingAuth(true);
    try {
      const { user: newUser, profile: newProfile } = await serviceSignUp(params);
      setUser(newUser);
      setProfile(newProfile);
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleSignIn = async (email: string, pass: string) => {
    setIsSubmittingAuth(true);
    try {
      const { user: authedUser, profile: loadedProfile } = await serviceSignIn(email, pass);
      setUser(authedUser);
      setProfile(loadedProfile);
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleSignOut = async () => {
    setIsSubmittingAuth(true);
    try {
      await serviceSignOut();
      setUser(null);
      setProfile(null);
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleResetPassword = async (email: string) => {
    return serviceResetPassword(email);
  };

  const handleResendVerification = async () => {
    await serviceResendVerificationEmail();
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.uid);
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    loading: authLoading,
    authLoading,
    profileLoading,
    isSubmittingAuth,
    authenticated: !!user,
    emailVerified: user?.emailVerified ?? false,
    signUp: handleSignUp,
    signIn: handleSignIn,
    signOut: handleSignOut,
    resetPassword: handleResetPassword,
    resendVerificationEmail: handleResendVerification,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

