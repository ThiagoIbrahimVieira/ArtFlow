import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useLanguage } from './useLanguage';
import {
  AIConversation,
  AIMessage,
  AIPaletteData,
  AISource,
} from '../types';
import {
  sendArtFlowAIMessage,
  listAIConversations,
  getConversationMessages,
  saveAIConversationTurn,
  saveAIMessage,
  createAIConversation,
  deleteAIConversation,
  deriveConversationTitle,
} from '../services/artFlowAIService';

export function useArtFlowAI(initialIntent?: string) {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string>(() => `conv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUserPrompt, setLastUserPrompt] = useState<{ text: string; intent?: string; projectId?: string } | null>(null);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);

  // Load conversations on mount / user change
  const refreshConversations = useCallback(async () => {
    if (!user) return;
    try {
      const list = await listAIConversations(user.uid);
      setConversations(list);
    } catch (err) {
      console.warn('Failed to load conversations:', err);
    }
  }, [user]);

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  // Load active conversation messages
  const selectConversation = useCallback(async (convId: string) => {
    if (!user) return;
    setCurrentConversationId(convId);
    setError(null);
    setIsLoading(true);
    try {
      const msgs = await getConversationMessages(user.uid, convId);
      setMessages(msgs);
    } catch (err) {
      console.error('Failed to load conversation:', err);
      setError(t('errors.firestoreError'));
    } finally {
      setIsLoading(false);
    }
  }, [user, t]);

  // Start fresh conversation
  const startNewConversation = useCallback(() => {
    setIsNewChatModalOpen(true);
  }, []);

  const createConversationWithTitle = useCallback(async (title: string) => {
    const finalTitle = title.trim() || 'Chat';
    if (!user) {
      const newId = `conv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      setCurrentConversationId(newId);
      setMessages([]);
      setError(null);
      setIsNewChatModalOpen(false);
      return;
    }

    try {
      const newConv = await createAIConversation(user.uid, finalTitle);
      setConversations((prev) => [newConv, ...prev.filter((c) => c.id !== newConv.id)]);
      setCurrentConversationId(newConv.id);
      setMessages([]);
      setError(null);
      setIsNewChatModalOpen(false);
    } catch (err) {
      console.error('Failed to create new conversation:', err);
      const fallbackId = `conv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      setCurrentConversationId(fallbackId);
      setMessages([]);
      setIsNewChatModalOpen(false);
    }
  }, [user]);

  // Remove conversation
  const removeConversation = useCallback(async (convId: string) => {
    if (!user) return;
    try {
      await deleteAIConversation(user.uid, convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (currentConversationId === convId) {
        startNewConversation();
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  }, [user, currentConversationId, startNewConversation]);

  // Send message
  const sendMessage = useCallback(
    async (text: string, intent?: 'chat' | 'create_palette' | 'research' | 'art_feedback', projectId?: string) => {
      const clean = text.trim();
      if (!clean || isLoading) return;

      setError(null);
      setLastUserPrompt({ text: clean, intent, projectId });

      const userMsg: AIMessage = {
        id: `msg_u_${Date.now()}`,
        role: 'user',
        content: clean,
        createdAt: new Date(),
      };

      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      setIsLoading(true);

      const isResearch = intent === 'research' || clean.toLowerCase().includes('pesquis') || clean.toLowerCase().includes('research') || clean.toLowerCase().includes('exposiç');
      if (isResearch) setIsSearching(true);

      try {
        // Build history from previous messages (max last 10 turns)
        const history = messages.slice(-10).map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const response = await sendArtFlowAIMessage({
          conversationId: currentConversationId,
          message: clean,
          intent: intent || (initialIntent as any),
          preferredLanguage: language,
          projectId,
          history,
        });

        const assistantMsg = response.message;
        setMessages([...nextMessages, assistantMsg]);

        // Persist messages in Firestore and refresh conversation list
        if (user) {
          const existingConv = conversations.find((c) => c.id === currentConversationId);
          const title = existingConv?.title || deriveConversationTitle(clean, intent || (initialIntent as any));
          await saveAIConversationTurn(user.uid, currentConversationId, userMsg, assistantMsg, title);
          await refreshConversations();
        }
      } catch (err: any) {
        console.error('AI chat failed:', err);
        const code = err?.code || '';
        if (code === 'AI_RATE_LIMIT_EXCEEDED') {
          setError(t('errors.aiRateLimit'));
        } else {
          setError(err?.message || t('errors.aiUnavailable'));
        }
      } finally {
        setIsLoading(false);
        setIsSearching(false);
      }
    },
    [messages, isLoading, currentConversationId, conversations, user, initialIntent, language, t, refreshConversations]
  );

  const retry = useCallback(() => {
    if (lastUserPrompt) {
      sendMessage(lastUserPrompt.text, lastUserPrompt.intent as any, lastUserPrompt.projectId);
    }
  }, [lastUserPrompt, sendMessage]);

  return {
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
  };
}
