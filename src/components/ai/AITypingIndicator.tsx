import React from 'react';
import { Sparkles, Search } from 'lucide-react';

interface AITypingIndicatorProps {
  isSearching?: boolean;
}

export const AITypingIndicator: React.FC<AITypingIndicatorProps> = ({ isSearching }) => {
  return (
    <div className="flex items-start gap-2.5 max-w-[85%] text-left animate-in fade-in duration-200">
      <div className="w-8 h-8 rounded-full bg-[#272320] border border-[#433D37] flex items-center justify-center text-[#D9B98D] flex-shrink-0 shadow-sm">
        {isSearching ? (
          <Search className="w-4 h-4 animate-pulse" />
        ) : (
          <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
        )}
      </div>

      <div className="bg-[#272320] border border-[#3A332C] rounded-2xl rounded-tl-sm px-4 py-3 text-xs font-sans text-[#F1E2CB] flex items-center gap-2 shadow-md">
        <span>{isSearching ? '🔎 Pesquisando referências...' : 'ArtFlow AI está digitando...'}</span>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D9B98D] animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-[#D9B98D] animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-[#D9B98D] animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};
