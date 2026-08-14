import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';

interface AIComposerProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

export const AIComposer: React.FC<AIComposerProps> = ({
  onSendMessage,
  isLoading,
  placeholder,
}) => {
  const { t } = useLanguage();
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const effectivePlaceholder = placeholder || t('ai.inputPlaceholder');

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [text]);

  const handleSend = () => {
    if (!text.trim() || isLoading) return;
    onSendMessage(text.trim());
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full bg-[#191715]/95 backdrop-blur-md border-t border-[#332E2A] p-3 sm:p-4 text-left">
      <div className="relative flex items-end gap-2 bg-[#272320] border border-[#3A332C] rounded-2xl p-2 focus-within:border-[#D9B98D] transition-colors shadow-inner">
        {/* Attachment icon */}
        <button
          type="button"
          onClick={() => alert('Análise de imagem estará disponível na próxima fase do ArtFlow AI.')}
          aria-label="Attach Image"
          className="p-2 text-[#A99D8E] hover:text-[#FDF8F0] rounded-xl hover:bg-[#332E2A] transition-colors flex-shrink-0 cursor-pointer"
          title="Anexar imagem (em breve)"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={4000}
          placeholder={effectivePlaceholder}
          disabled={isLoading}
          className="flex-1 max-h-32 bg-transparent text-xs sm:text-sm text-[#FDF8F0] placeholder-[#A99D8E] focus:outline-none resize-none py-1.5 px-1 leading-relaxed font-sans"
        />

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim() || isLoading}
          aria-label={t('ai.send')}
          className="p-2.5 rounded-xl bg-[#D9B98D] text-[#191715] hover:bg-[#E8DAC7] disabled:opacity-40 disabled:hover:bg-[#D9B98D] disabled:cursor-not-allowed transition-all flex-shrink-0 active:scale-95 shadow-sm cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Character Count */}
      {text.length > 3000 && (
        <div className="text-right text-[10px] font-sans text-[#A99D8E] mt-1 pr-2">
          {text.length}/4000
        </div>
      )}
    </div>
  );
};
