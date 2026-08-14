import React, { useRef, useEffect, useState } from 'react';
import { Sparkles, RefreshCw, Folder, ChevronDown } from 'lucide-react';
import { AIMessage as AIMessageType, Project } from '../../types';
import { AIMessage } from './AIMessage';
import { AIComposer } from './AIComposer';
import { AIEmptyState } from './AIEmptyState';
import { AITypingIndicator } from './AITypingIndicator';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { listProjects } from '../../services/projectService';

interface AIChatProps {
  messages: AIMessageType[];
  isLoading: boolean;
  isSearching: boolean;
  error: string | null;
  initialComposerText?: string;
  onSendMessage: (text: string, intent?: 'chat' | 'create_palette' | 'research' | 'art_feedback', projectId?: string) => void;
  onRetry: () => void;
  onNewConversation: () => void;
}

export const AIChat: React.FC<AIChatProps> = ({
  messages,
  isLoading,
  isSearching,
  error,
  initialComposerText,
  onSendMessage,
  onRetry,
  onNewConversation,
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [composerText, setComposerText] = useState<string>(initialComposerText || '');

  useEffect(() => {
    if (initialComposerText) {
      setComposerText(initialComposerText);
    }
  }, [initialComposerText]);

  useEffect(() => {
    if (!user) return;
    listProjects(user.uid)
      .then((projs) => setUserProjects(projs))
      .catch((err) => console.warn('Failed loading projects for AI selector:', err));
  }, [user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isSearching]);

  const handleSend = (text: string) => {
    onSendMessage(text, undefined, selectedProjectId || undefined);
    setComposerText('');
  };

  const handleQuickAction = (
    prompt: string,
    _intent?: 'chat' | 'create_palette' | 'research' | 'art_feedback'
  ) => {
    setComposerText(prompt);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#191715] overflow-hidden relative text-left">
      {/* Context Project Selector Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#272320]/60 border-b border-[#332E2A] z-10">
        <div className="flex items-center gap-2 text-xs font-sans text-[#A99D8E]">
          <Folder className="w-3.5 h-3.5 text-[#D9B98D]" />
          <span>{t('ai.contextLabel')}:</span>
          <div className="relative inline-block">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="appearance-none bg-[#191715] border border-[#3A332C] rounded-lg px-2.5 py-1 pr-6 text-xs text-[#FDF8F0] focus:outline-none focus:border-[#D9B98D] cursor-pointer"
            >
              <option value="">{t('ai.noProjectContext')}</option>
              {userProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-[#A99D8E] absolute right-2 top-2 pointer-events-none" />
          </div>
        </div>

        <button
          type="button"
          onClick={onNewConversation}
          className="text-xs font-sans text-[#D9B98D] hover:text-[#E8DAC7] flex items-center gap-1 font-medium transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('ai.newChat')}</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3 sm:p-5 space-y-4">
        {messages.length === 0 ? (
          <AIEmptyState onSelectAction={handleQuickAction} />
        ) : (
          messages.map((msg) => <AIMessage key={msg.id} message={msg} />)
        )}

        {isLoading && <AITypingIndicator isSearching={isSearching} />}

        {error && (
          <div className="p-3.5 bg-red-950/40 border border-red-500/40 rounded-2xl text-red-200 text-xs font-sans flex items-center justify-between gap-3 max-w-[85%] animate-in fade-in">
            <span>{error}</span>
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-900/60 hover:bg-red-900 border border-red-400/40 rounded-xl text-[#FDF8F0] font-medium transition-colors flex-shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{t('common.retry')}</span>
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Composer */}
      <AIComposer
        value={composerText}
        onChange={setComposerText}
        onSendMessage={handleSend}
        isLoading={isLoading}
      />
    </div>
  );
};
