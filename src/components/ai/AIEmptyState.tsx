import React from 'react';
import { Sparkles, Palette, Lightbulb, PenTool, Search, Layout, HelpCircle } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';

interface AIEmptyStateProps {
  onSelectAction: (prompt: string, intent?: 'chat' | 'create_palette' | 'research' | 'art_feedback') => void;
}

export const AIEmptyState: React.FC<AIEmptyStateProps> = ({ onSelectAction }) => {
  const { t } = useLanguage();

  const quickActions = [
    {
      label: t('ai.quickActions.createPalette'),
      icon: Palette,
      prompt: t('ai.prompts.createPalette'),
      intent: 'create_palette' as const,
    },
    {
      label: t('ai.quickActions.giveIdea'),
      icon: Lightbulb,
      prompt: t('ai.prompts.giveIdea'),
      intent: 'chat' as const,
    },
    {
      label: t('ai.quickActions.learnTechnique'),
      icon: PenTool,
      prompt: t('ai.prompts.learnTechnique'),
      intent: 'chat' as const,
    },
    {
      label: t('ai.quickActions.researchArt'),
      icon: Search,
      prompt: t('ai.prompts.researchArt'),
      intent: 'research' as const,
    },
    {
      label: t('ai.quickActions.improveComposition'),
      icon: Layout,
      prompt: t('ai.prompts.improveComposition'),
      intent: 'art_feedback' as const,
    },
    {
      label: t('ai.quickActions.colorTheory'),
      icon: HelpCircle,
      prompt: t('ai.prompts.colorTheory'),
      intent: 'chat' as const,
    },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 text-center space-y-5 my-auto max-w-[420px] mx-auto">
      {/* Icon & Title */}
      <div className="space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-[#272320] border border-[#433D37] text-[#D9B98D] flex items-center justify-center mx-auto shadow-md">
          <Sparkles className="w-6 h-6" />
        </div>

        <h3 className="font-display text-[24px] font-semibold text-[#FDF8F0] tracking-tight">
          ✦ ArtFlow AI
        </h3>
        <p className="text-xs font-sans text-[#A99D8E] leading-relaxed max-w-[320px] mx-auto">
          {t('ai.emptyDescription')}
        </p>
      </div>

      {/* Quick Action Chips Grid */}
      <div className="w-full grid grid-cols-2 gap-2 pt-2">
        {quickActions.map((act, idx) => {
          const Icon = act.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectAction(act.prompt, act.intent)}
              className="p-3 rounded-2xl bg-[#272320]/90 hover:bg-[#272320] border border-[#3A332C] hover:border-[#D9B98D]/60 text-left transition-all active:scale-95 shadow-sm group flex flex-col justify-between min-h-[72px] cursor-pointer"
            >
              <div className="flex items-center gap-2 text-xs font-sans text-[#FDF8F0] font-medium group-hover:text-[#D9B98D]">
                <Icon className="w-3.5 h-3.5 text-[#D9B98D] flex-shrink-0" />
                <span className="truncate">{act.label}</span>
              </div>
              <p className="text-[10px] font-sans text-[#7A7165] line-clamp-1 mt-1">
                {act.prompt}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
