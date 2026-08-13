import React from 'react';
import { ExternalLink, Globe } from 'lucide-react';
import { AISource } from '../../types';

interface AISourceCardProps {
  sources: AISource[];
}

export const AISourceCard: React.FC<AISourceCardProps> = ({ sources }) => {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-2.5 pt-2.5 border-t border-[#3A332C]/80 space-y-1.5 text-left">
      <div className="flex items-center gap-1.5 text-[11px] font-sans font-medium text-[#D9B98D]">
        <Globe className="w-3.5 h-3.5" />
        <span>Fontes e Citações</span>
      </div>

      <div className="space-y-1">
        {sources.map((src, idx) => {
          let hostname = '';
          try {
            hostname = new URL(src.url).hostname.replace(/^www\./, '');
          } catch {
            hostname = 'Web Source';
          }

          return (
            <a
              key={idx}
              href={src.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2 rounded-xl bg-[#191715]/80 hover:bg-[#191715] border border-[#3A332C] transition-colors group"
            >
              <div className="min-w-0 pr-2">
                <p className="text-xs font-sans text-[#F1E2CB] truncate font-medium group-hover:text-[#D9B98D]">
                  [{idx + 1}] {src.title || hostname}
                </p>
                {src.snippet && (
                  <p className="text-[10px] font-sans text-[#A99D8E] line-clamp-1">
                    {src.snippet}
                  </p>
                )}
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-[#A99D8E] group-hover:text-[#D9B98D] flex-shrink-0" />
            </a>
          );
        })}
      </div>
    </div>
  );
};
