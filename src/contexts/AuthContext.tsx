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
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async (uid: string) => {
    try {
      const p = await getUserProfile(uid);
      setProfile(p);
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
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
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignUp = async (params: SignUpParams) => {
    setLoading(true);
    try {
      const { user: newUser, profile: newProfile } = await serviceSignUp(params);
      setUser(newUser);
      setProfile(newProfile);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const { user: authedUser, profile: loadedProfile } = await serviceSignIn(email, pass);
      setUser(authedUser);
      setProfile(loadedProfile);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await serviceSignOut();
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
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
    loading,
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
