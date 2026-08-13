import React from 'react';
import { Sparkles, Palette, Lightbulb, PenTool, Search, Layout, HelpCircle } from 'lucide-react';

interface AIEmptyStateProps {
  onSelectAction: (prompt: string, intent?: 'chat' | 'create_palette' | 'research' | 'art_feedback') => void;
}

interface QuickAction {
  label: string;
  icon: React.ElementType;
  prompt: string;
  intent?: 'chat' | 'create_palette' | 'research' | 'art_feedback';
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: 'Criar uma paleta',
    icon: Palette,
    prompt: 'Quero criar uma paleta de cores para uma nova arte. Pode me ajudar com sugestões?',
    intent: 'create_palette',
  },
  {
    label: 'Me dê uma ideia',
    icon: Lightbulb,
    prompt: 'Estou sem ideias para desenhar. Pode me ajudar a desenvolver um conceito envolvente?',
    intent: 'chat',
  },
  {
    label: 'Aprender uma técnica',
    icon: PenTool,
    prompt: 'Quero aprender técnicas para melhorar minha pintura digital e iluminação.',
    intent: 'chat',
  },
  {
    label: 'Pesquisar sobre arte',
    icon: Search,
    prompt: 'Quero pesquisar sobre referências de movimentos artísticos e técnicas clássicas.',
    intent: 'research',
  },
  {
    label: 'Melhorar composição',
    icon: Layout,
    prompt: 'Quais são as melhores regras e guias de composição para direcionar o foco visual numa ilustração?',
    intent: 'art_feedback',
  },
  {
    label: 'Teoria das cores',
    icon: HelpCircle,
    prompt: 'Pode me explicar como escolher valores tonais e aplicar harmonia complementar dividida?',
    intent: 'chat',
  },
];

export const AIEmptyState: React.FC<AIEmptyStateProps> = ({ onSelectAction }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 text-center space-y-5 my-auto max-w-[420px] mx-auto">
      {/* Icon & Title */}
      <div className="space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-[#272320] border border-[#433D37] text-[#D9B98D] flex items-center justify-center mx-auto shadow-md">
          <Sparkles className="w-6 h-6" />
        </div>

        <h3 className="font-serif text-[24px] font-normal text-[#F1E2CB] tracking-tight">
          ✦ ArtFlow AI
        </h3>
        <p className="text-xs font-sans text-[#A99D8E] leading-relaxed max-w-[320px] mx-auto">
          Seu parceiro criativo para arte. Posso ajudar você a desenvolver ideias,
          explorar estilos, estudar técnicas e criar.
        </p>
      </div>

      {/* Quick Action Chips Grid */}
      <div className="w-full grid grid-cols-2 gap-2 pt-2">
        {QUICK_ACTIONS.map((act, idx) => {
          const Icon = act.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectAction(act.prompt, act.intent)}
              className="p-3 rounded-2xl bg-[#272320]/90 hover:bg-[#272320] border border-[#3A332C] hover:border-[#D9B98D]/60 text-left transition-all active:scale-95 shadow-sm group flex flex-col justify-between min-h-[72px]"
            >
              <div className="flex items-center gap-2 text-xs font-sans text-[#F1E2CB] font-medium group-hover:text-[#D9B98D]">
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
