import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles, History } from 'lucide-react';
import { AppHeader } from '../components/AppHeader';
import { BottomNavigation } from '../components/BottomNavigation';
import { AIChat } from '../components/ai/AIChat';
import { AIConversationList } from '../components/ai/AIConversationList';
import { NewChatModal } from '../components/ai/NewChatModal';
import { useArtFlowAI } from '../hooks/useArtFlowAI';
import { useLanguage } from '../hooks/useLanguage';

export const ArtFlowAIPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const rawIntent = searchParams.get('intent');
  const normalizedIntent = rawIntent === 'create-palette' || rawIntent === 'create_palette' ? 'create_palette' : undefined;

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const {
    messages,
    conversations,
    currentConversationId,
    isLoading,
    isSearching,
    error,
    isNewChatModalOpen,
    setIsNewChatModalOpen,
    sendMessage,
    startNewConversation,
    createConversationWithTitle,
    selectConversation,
    removeConversation,
    retry,
  } = useArtFlowAI(normalizedIntent);

  // If redirected with intent=create_palette, start fresh conversation with prompt guide
  useEffect(() => {
    if (normalizedIntent === 'create_palette' && messages.length === 0) {
      // Intent detected - ready for user input
    }
  }, [normalizedIntent, messages.length]);

  return (
    <div className="min-h-screen bg-[#191715] text-[#F1E2CB] max-w-[440px] md:max-w-[800px] mx-auto relative flex flex-col pb-20 md:pb-0 h-screen overflow-hidden text-left">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#191715] border-b border-[#332E2A] z-20 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
            aria-label={t('ai.conversations')}
            title={t('ai.conversations')}
            className="p-1.5 rounded-xl bg-[#272320] border border-[#3A332C] text-[#A99D8E] hover:text-[#FDF8F0] md:hidden cursor-pointer"
          >
            <History className="w-4 h-4 text-[#D9B98D]" />
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#D9B98D]" />
            <h1 className="font-display text-[22px] font-semibold text-[#FDF8F0] leading-tight">
              ArtFlow AI
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={startNewConversation}
          className="px-3.5 py-1.5 rounded-full bg-[#272320] hover:bg-[#332E2A] border border-[#3A332C] text-xs font-sans text-[#D9B98D] font-medium transition-colors cursor-pointer"
        >
          {t('ai.newChat')}
        </button>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 h-full flex-shrink-0">
          <AIConversationList
            conversations={conversations}
            activeId={currentConversationId}
            onSelectConversation={selectConversation}
            onNewConversation={startNewConversation}
            onDeleteConversation={removeConversation}
          />
        </aside>

        {/* Mobile Drawer */}
        {isMobileDrawerOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setIsMobileDrawerOpen(false)}
            />
            <div className="relative w-4/5 max-w-[300px] h-full bg-[#191715] z-10 shadow-2xl">
              <AIConversationList
                conversations={conversations}
                activeId={currentConversationId}
                onSelectConversation={selectConversation}
                onNewConversation={startNewConversation}
                onDeleteConversation={removeConversation}
                onCloseMobileDrawer={() => setIsMobileDrawerOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Chat Main Area */}
        <main className="flex-1 h-full flex flex-col min-w-0">
          {normalizedIntent === 'create_palette' && messages.length === 0 && (
            <div className="p-3 bg-[#3D2918] border-b border-[#513E2C] text-xs font-sans text-[#FDF8F0] flex items-center justify-between">
              <span>🎨 {t('palettes.generateWithAI')}</span>
            </div>
          )}

          <AIChat
            messages={messages}
            isLoading={isLoading}
            isSearching={isSearching}
            error={error}
            initialComposerText={normalizedIntent === 'create_palette' && messages.length === 0 ? t('ai.prompts.createPalette') : undefined}
            onSendMessage={sendMessage}
            onRetry={retry}
            onNewConversation={startNewConversation}
          />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden">
        <BottomNavigation />
      </div>

      {/* New Chat Name Prompt Modal */}
      <NewChatModal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        onCreate={createConversationWithTitle}
      />
    </div>
  );
};
