import React, { useState, useEffect, useRef } from 'react';
import { MessageSquarePlus, X } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string) => Promise<void> | void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose, onCreate }) => {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const defaultName = t('ai.newChatModal.defaultName') || 'Chat';
      setTitle(defaultName);
      setIsSubmitting(false);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [isOpen, t]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = title.trim() || t('ai.newChatModal.defaultName') || 'Chat';
    setIsSubmitting(true);
    try {
      await onCreate(finalTitle);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-[#221E1B] border-t sm:border border-[#433D37] rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl z-10 animate-in slide-in-from-bottom-5 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#332E2A]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#2D2723] border border-[#433D37] flex items-center justify-center text-[#D9B98D]">
              <MessageSquarePlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-display font-semibold text-[#FDF8F0] tracking-tight">
                {t('ai.newChatModal.title')}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#A99D8E] hover:text-[#F1E2CB] hover:bg-[#2D2723] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="pt-4 space-y-4">
          <div>
            <label className="block text-xs font-sans font-medium text-[#D8C7B5] mb-1.5">
              {t('ai.newChatModal.inputLabel')}
            </label>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('ai.newChatModal.inputPlaceholder')}
              maxLength={40}
              className="w-full bg-[#191715] border border-[#433D37] rounded-xl px-3.5 py-2.5 text-sm font-sans text-[#FDF8F0] placeholder-[#7A7165] focus:outline-none focus:border-[#D9B98D] transition-colors shadow-inner"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#3A332C] bg-[#191715] hover:bg-[#272320] text-xs font-sans font-medium text-[#A99D8E] hover:text-[#F1E2CB] transition-colors"
            >
              {t('ai.newChatModal.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#D9B98D] to-[#C29E6F] hover:from-[#E5C9A1] hover:to-[#CFAB7E] text-[#191715] font-sans font-semibold text-xs transition-all shadow-md active:scale-98 disabled:opacity-50"
            >
              {isSubmitting ? '...' : t('ai.newChatModal.createButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
