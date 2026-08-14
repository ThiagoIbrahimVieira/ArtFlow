import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Languages } from 'lucide-react';
import { HERO_ARTWORK_URL } from '../data/mockData';
import { FormInput } from '../components/FormInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { ArtworkImage } from '../components/ArtworkImage';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';

export const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { t, openLanguageModal } = useLanguage();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await signUp({ displayName: fullName, email, password });
      navigate('/home', { replace: true });
    } catch (err: any) {
      setError(err?.message || t('errors.generic'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#191715] text-[#F1E2CB] flex flex-col justify-between p-4 sm:p-5 max-w-[440px] mx-auto pb-8 text-left">
      {/* Header */}
      <header className="flex items-center justify-between pt-2 pb-3">
        <h1 className="font-display text-[28px] font-semibold tracking-tight text-[#FDF8F0]">
          ArtFlow
        </h1>
        <button
          type="button"
          onClick={openLanguageModal}
          aria-label={t('common.language')}
          className="w-10 h-10 rounded-full bg-[#272320] border border-[#433D37] flex items-center justify-center text-[#FDF8F0] hover:bg-[#332E2A] transition-colors shadow-sm cursor-pointer"
        >
          <Languages className="w-[18px] h-[18px] stroke-[1.75]" />
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center my-2 space-y-4">
        {/* Hero Artwork Card with Sign Up heading overlay */}
        <div className="relative w-full h-[220px] rounded-3xl overflow-hidden shadow-xl border border-[#433D37]">
          <ArtworkImage
            src={HERO_ARTWORK_URL}
            alt="ArtFlow Inspiration Hero"
            className="w-full h-full object-cover filter brightness-[0.75] contrast-[1.05]"
          />
          {/* Subtle gradient overlay to ensure text contrast */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-black/40 to-transparent" />
          
          <div className="absolute bottom-5 left-5 right-5 text-left z-10">
            <h2 className="font-display text-[36px] sm:text-[38px] font-semibold text-[#FDF8F0] leading-tight tracking-tight drop-shadow-md">
              {t('auth.signUpTitle')}
            </h2>
            <p className="font-sans text-xs text-[#EEDCC6]/90 mt-1 max-w-[240px] leading-relaxed">
              {t('auth.signUpSubtitle')}
            </p>
          </div>
        </div>

        {/* Cream Rounded Form Container */}
        <div className="w-full bg-[#F5EBE0] text-[#191715] rounded-3xl p-5 shadow-2xl border border-[#E0D2C0]">
          {/* Tab navigation between Log In & Sign Up */}
          <div className="flex bg-[#E8DAC7] p-1 rounded-2xl mb-4 border border-[#D5C6B1]">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="flex-1 py-1.5 text-xs font-sans font-medium rounded-xl text-[#5C5144] hover:text-[#191715] transition-all cursor-pointer"
            >
              {t('auth.loginTab')}
            </button>
            <button
              type="button"
              className="flex-1 py-1.5 text-xs font-sans font-semibold rounded-xl bg-[#191715] text-[#FDF8F0] shadow-sm transition-all"
            >
              {t('auth.signUpTab')}
            </button>
          </div>

          {error && (
            <div className="mb-3.5 p-3 rounded-xl bg-red-100 border border-red-300 text-red-800 text-xs font-sans">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <FormInput
              label={t('auth.nameLabel')}
              placeholder={t('auth.namePlaceholder')}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />

            <FormInput
              label={t('auth.emailLabel')}
              type="email"
              placeholder={t('auth.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <FormInput
              label={t('auth.passwordLabel')}
              isPassword
              placeholder={t('auth.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="pt-2">
              <PrimaryButton type="submit" variant="dark" size="lg" disabled={isSubmitting}>
                {isSubmitting ? t('common.loading') : t('auth.signUpButton')}
              </PrimaryButton>
            </div>
          </form>

          {/* Footer Link */}
          <div className="mt-4 text-center">
            <p className="text-xs font-sans text-[#5C5144]">
              {t('auth.alreadyHaveAccount')}{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="font-semibold text-[#191715] hover:underline cursor-pointer"
              >
                {t('auth.loginTab')}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
