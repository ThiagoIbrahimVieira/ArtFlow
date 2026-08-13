import React, { useState } from 'react';
import { Plus, MessageSquare, Trash2, X } from 'lucide-react';
import { AIConversation } from '../../types';

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
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  const confirmDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteConversation(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#191715] border-r border-[#332E2A] text-[#F1E2CB] select-none text-left">
      {/* Header & New Chat Button */}
      <div className="p-3.5 border-b border-[#332E2A] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-sans font-medium text-[#A99D8E] uppercase tracking-wider">
            Conversas
          </span>
          {onCloseMobileDrawer && (
            <button
              onClick={onCloseMobileDrawer}
              aria-label="Close drawer"
              className="p-1 text-[#A99D8E] hover:text-[#F1E2CB] md:hidden"
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
          className="w-full py-2.5 px-3.5 rounded-xl bg-[#272320] hover:bg-[#332E2A] border border-[#3A332C] text-xs font-sans font-medium text-[#F1E2CB] flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4 text-[#D9B98D]" />
          <span>+ Nova conversa</span>
        </button>
      </div>

      {/* Conversation Items List */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-1">
        {conversations.length === 0 ? (
          <div className="py-8 text-center text-xs font-sans text-[#7A7165] px-3">
            Nenhuma conversa anterior. Inicie uma nova acima!
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
                className={`w-full p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-all group ${
                  isActive
                    ? 'bg-[#272320] border border-[#D9B98D]/40 text-[#F1E2CB]'
                    : 'hover:bg-[#272320]/60 text-[#A99D8E] hover:text-[#F1E2CB]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                  <MessageSquare
                    className={`w-4 h-4 flex-shrink-0 ${
                      isActive ? 'text-[#D9B98D]' : 'text-[#7A7165]'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-sans font-medium truncate">
                      {conv.title}
                    </p>
                    {conv.lastMessagePreview && (
                      <p className="text-[10px] font-sans text-[#7A7165] truncate">
                        {conv.lastMessagePreview}
                      </p>
                    )}
                  </div>
                </div>

                {/* Delete / Confirm Action */}
                {isConfirming ? (
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => confirmDelete(conv.id, e)}
                      className="px-2 py-0.5 rounded-md bg-red-600/90 text-white text-[10px] font-medium"
                    >
                      Excluir
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(null);
                      }}
                      className="p-0.5 text-[#A99D8E] hover:text-[#F1E2CB]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => handleDelete(conv.id, e)}
                    aria-label="Delete conversation"
                    className="p-1 rounded-lg text-[#7A7165] hover:text-red-400 hover:bg-[#191715] opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Excluir conversa"
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
