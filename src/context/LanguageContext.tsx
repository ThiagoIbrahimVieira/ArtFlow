import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { SupportedLanguage, DEFAULT_LANGUAGE, getTranslation } from '../i18n';
import { useAuth } from '../hooks/useAuth';
import { getUserProfile, updateUserProfile } from '../services/userService';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  t: (path: string, params?: Record<string, string | number>) => string;
  isLanguageModalOpen: boolean;
  openLanguageModal: () => void;
  closeLanguageModal: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'artflow_language';

function getInitialLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;

  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved === 'pt-BR' || saved === 'en') {
      return saved;
    }

    const browserLang = navigator.language || (navigator as any).userLanguage || '';
    if (browserLang.toLowerCase().startsWith('pt')) {
      return 'pt-BR';
    }
  } catch (err) {
    console.warn('Could not read initial language preference:', err);
  }

  return 'en';
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(getInitialLanguage);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState<boolean>(false);
  const { user } = useAuth();

  // Sync html lang attribute whenever language changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  // Sync language with Firestore profile on user login
  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    getUserProfile(user.uid)
      .then((profile) => {
        if (!isMounted || !profile) return;
        const userSavedLang = profile.language;
        if ((userSavedLang === 'pt-BR' || userSavedLang === 'en') && userSavedLang !== language) {
          setLanguageState(userSavedLang);
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, userSavedLang);
          } catch (e) {
            // Ignore localStorage errors
          }
        }
      })
      .catch((err) => console.warn('Could not sync language from profile:', err));

    return () => {
      isMounted = false;
    };
  }, [user]);

  const setLanguage = useCallback(
    async (newLang: SupportedLanguage) => {
      if (newLang !== 'pt-BR' && newLang !== 'en') return;

      setLanguageState(newLang);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, newLang);
      } catch (err) {
        console.warn('Could not save language to localStorage:', err);
      }

      if (user) {
        try {
          await updateUserProfile(user.uid, { language: newLang });
        } catch (err) {
          console.warn('Could not persist language to Firestore:', err);
        }
      }
    },
    [user]
  );

  const t = useCallback(
    (path: string, params?: Record<string, string | number>) => {
      return getTranslation(language, path, params);
    },
    [language]
  );

  const openLanguageModal = useCallback(() => setIsLanguageModalOpen(true), []);
  const closeLanguageModal = useCallback(() => setIsLanguageModalOpen(false), []);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      isLanguageModalOpen,
      openLanguageModal,
      closeLanguageModal,
    }),
    [language, setLanguage, t, isLanguageModalOpen, openLanguageModal, closeLanguageModal]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
