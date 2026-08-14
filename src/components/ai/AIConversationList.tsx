import React, { useState } from 'react';
import { Plus, MessageSquare, Trash2, X, History } from 'lucide-react';
import { AIConversation } from '../../types';
import { useLanguage } from '../../hooks/useLanguage';

interface AIConversationListProps {
  conversations: AIConversation[];
  activeId: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onCloseMobileDrawer?: () => void;
}

export const AIConversationList: React.FC<AIConversationListProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onCloseMobileDrawer,
}) => {
  const { t, language } = useLanguage();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const formatRelativeDate = (date: Date): string => {
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) return t('ai.today');

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) return t('ai.yesterday');

    return date.toLocaleDateString(language === 'pt-BR' ? 'pt-BR' : 'en-US', {
      day: 'numeric',
      month: 'short',
    });
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  const confirmDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteConversation(id);
    setDeleteConfirmId(null);
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmId(null);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#191715] md:border-r border-[#332E2A] text-[#F1E2CB] select-none text-left">
      {/* Header & New Chat Button */}
      <div className="p-4 border-b border-[#332E2A] space-y-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#D9B98D]" />
            <span className="text-xs font-sans font-semibold text-[#FDF8F0] tracking-wide uppercase">
              {t('ai.conversations')}
            </span>
          </div>
          {onCloseMobileDrawer && (
            <button
              onClick={onCloseMobileDrawer}
              aria-label={t('common.close')}
              className="p-1 rounded-lg text-[#A99D8E] hover:text-[#FDF8F0] hover:bg-[#272320] transition-colors md:hidden cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            onNewConversation();
            if (onCloseMobileDrawer) onCloseMobileDrawer();
          }}
          className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-[#2B241F] to-[#241F1C] hover:from-[#382F28] hover:to-[#2D2622] border border-[#433D37] text-xs font-sans font-medium text-[#FDF8F0] flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#D9B98D]" />
          <span>{t('ai.newConversation')}</span>
        </button>
      </div>

      {/* Conversation Items List */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-2.5 space-y-1.5 min-h-0">
        {conversations.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-2">
            <div className="w-10 h-10 mx-auto rounded-full bg-[#272320] border border-[#3A332C] flex items-center justify-center text-[#7A7165]">
              <MessageSquare className="w-5 h-5" />
            </div>
            <p className="text-xs font-sans font-medium text-[#D8C7B5]">
              {t('ai.noConversations')}
            </p>
            <p className="text-[11px] font-sans text-[#7A7165] leading-relaxed max-w-[200px] mx-auto">
              {language === 'pt-BR'
                ? 'Comece uma nova conversa com a ArtFlow AI.'
                : 'Start a new conversation with ArtFlow AI.'}
            </p>
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = conv.id === activeId;
            const isConfirming = deleteConfirmId === conv.id;

            return (
              <div
                key={conv.id}
                onClick={() => {
                  onSelectConversation(conv.id);
                  if (onCloseMobileDrawer) onCloseMobileDrawer();
                }}
                className={`w-full p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all border ${
                  isActive
                    ? 'bg-[#29221B] border-[#D9B98D]/40 text-[#FDF8F0] shadow-sm'
                    : 'bg-[#1D1917]/50 border-transparent hover:bg-[#272320]/70 text-[#A99D8E] hover:text-[#FDF8F0]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                  <div className="relative flex-shrink-0">
                    <MessageSquare
                      className={`w-4 h-4 ${
                        isActive ? 'text-[#D9B98D]' : 'text-[#7A7165]'
                      }`}
                    />
                    {isActive && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#D9B98D]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <p className="text-xs font-sans font-medium truncate">
                        {conv.title}
                      </p>
                      <span className="text-[10px] font-sans text-[#7A7165] flex-shrink-0">
                        {formatRelativeDate(conv.updatedAt || conv.createdAt)}
                      </span>
                    </div>
                    {conv.lastMessagePreview && (
                      <p className="text-[11px] font-sans text-[#7A7165] truncate mt-0.5">
                        {conv.lastMessagePreview}
                      </p>
                    )}
                  </div>
                </div>

                {/* Delete / Confirm Action */}
                {isConfirming ? (
                  <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => confirmDelete(conv.id, e)}
                      className="px-2 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white text-[10px] font-sans font-medium transition-colors cursor-pointer shadow-xs"
                    >
                      {t('ai.delete')}
                    </button>
                    <button
                      type="button"
                      onClick={cancelDelete}
                      className="px-1.5 py-1 rounded-md bg-[#272320] text-[#A99D8E] hover:text-[#FDF8F0] text-[10px] font-sans transition-colors cursor-pointer"
                    >
                      {t('ai.cancel')}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => handleDelete(conv.id, e)}
                    aria-label={t('ai.deleteConversation')}
                    className="p-1.5 rounded-lg text-[#7A7165] hover:text-red-400 hover:bg-[#272320] opacity-70 md:opacity-0 md:group-hover:opacity-100 transition-all cursor-pointer flex-shrink-0"
                    title={t('ai.deleteConversation')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
