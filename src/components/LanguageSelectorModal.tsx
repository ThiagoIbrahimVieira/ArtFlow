import React from 'react';
import { Check, Globe2, X } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { SupportedLanguage } from '../i18n';

export const LanguageSelectorModal: React.FC = () => {
  const { language, setLanguage, isLanguageModalOpen, closeLanguageModal, t } = useLanguage();

  if (!isLanguageModalOpen) return null;

  const handleSelect = (selected: SupportedLanguage) => {
    setLanguage(selected);
    closeLanguageModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
        onClick={closeLanguageModal}
      />

      {/* Bottom Sheet Modal */}
      <div className="relative w-full max-w-md bg-[#221E1B] border-t sm:border border-[#433D37] rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl z-10 animate-in slide-in-from-bottom-5 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#332E2A]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#2D2723] border border-[#433D37] flex items-center justify-center text-[#D9B98D]">
              <Globe2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-display font-semibold text-[#FDF8F0] tracking-tight">
                {t('languageModal.title')}
              </h3>
              <p className="text-[11px] font-sans text-[#A99D8E]">
                {t('languageModal.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={closeLanguageModal}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#A99D8E] hover:text-[#F1E2CB] hover:bg-[#2D2723] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Options */}
        <div className="py-4 space-y-2.5">
          {/* Portuguese */}
          <button
            type="button"
            onClick={() => handleSelect('pt-BR')}
            className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all ${
              language === 'pt-BR'
                ? 'bg-[#33291F] border-[#D9B98D] text-[#FDF8F0] shadow-sm'
                : 'bg-[#1D1917] border-[#3A332C] text-[#D8C7B5] hover:bg-[#28231F] hover:border-[#514940]'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🇧🇷</span>
              <div className="text-left">
                <div className="text-xs sm:text-sm font-sans font-medium text-[#F1E2CB]">
                  {t('languageModal.ptBR')}
                </div>
                <div className="text-[10px] font-sans text-[#A99D8E]">
                  Português padrão
                </div>
              </div>
            </div>
            {language === 'pt-BR' && (
              <div className="w-6 h-6 rounded-full bg-[#D9B98D] text-[#191715] flex items-center justify-center shadow-xs">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            )}
          </button>

          {/* English */}
          <button
            type="button"
            onClick={() => handleSelect('en')}
            className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all ${
              language === 'en'
                ? 'bg-[#33291F] border-[#D9B98D] text-[#FDF8F0] shadow-sm'
                : 'bg-[#1D1917] border-[#3A332C] text-[#D8C7B5] hover:bg-[#28231F] hover:border-[#514940]'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🇺🇸</span>
              <div className="text-left">
                <div className="text-xs sm:text-sm font-sans font-medium text-[#F1E2CB]">
                  {t('languageModal.en')}
                </div>
                <div className="text-[10px] font-sans text-[#A99D8E]">
                  International English
                </div>
              </div>
            </div>
            {language === 'en' && (
              <div className="w-6 h-6 rounded-full bg-[#D9B98D] text-[#191715] flex items-center justify-center shadow-xs">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            )}
          </button>
        </div>

        {/* Footer cancel button */}
        <button
          type="button"
          onClick={closeLanguageModal}
          className="w-full py-2.5 rounded-xl border border-[#3A332C] bg-[#191715] hover:bg-[#272320] text-xs font-sans font-medium text-[#A99D8E] hover:text-[#F1E2CB] transition-colors"
        >
          {t('languageModal.cancel')}
        </button>
      </div>
    </div>
  );
};
