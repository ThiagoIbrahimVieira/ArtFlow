import React from 'react';
import { Sparkles, User } from 'lucide-react';
import { AIMessage as AIMessageType } from '../../types';
import { AIPaletteCard } from './AIPaletteCard';
import { AISourceCard } from './AISourceCard';

interface AIMessageProps {
  message: AIMessageType;
}

export const AIMessage: React.FC<AIMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex items-start justify-end gap-2.5 max-w-[90%] ml-auto text-left">
        <div className="bg-[#3D2918] border border-[#513E2C] rounded-2xl rounded-tr-sm px-4 py-3 text-xs sm:text-sm font-sans text-[#F1E2CB] shadow-md leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
        <div className="w-7 h-7 rounded-full bg-[#272320] border border-[#433D37] flex items-center justify-center text-[#D9B98D] flex-shrink-0 mt-0.5">
          <User className="w-3.5 h-3.5" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5 max-w-[92%] sm:max-w-[85%] text-left">
      <div className="w-8 h-8 rounded-full bg-[#272320] border border-[#433D37] flex items-center justify-center text-[#D9B98D] flex-shrink-0 mt-0.5 shadow-sm">
        <Sparkles className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0 bg-[#272320] border border-[#3A332C] rounded-2xl rounded-tl-sm p-4 text-xs sm:text-sm font-sans text-[#F1E2CB] shadow-md leading-relaxed">
        {/* Assistant text content */}
        <div className="whitespace-pre-wrap leading-relaxed space-y-2">
          {message.content}
        </div>

        {/* Structured Palette Card */}
        {message.palette && <AIPaletteCard palette={message.palette} />}

        {/* Citations and sources */}
        {message.sources && message.sources.length > 0 && (
          <AISourceCard sources={message.sources} />
        )}
      </div>
    </div>
  );
};
