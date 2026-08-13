import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
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
  saveAIMessage,
  deleteAIConversation,
  deriveConversationTitle,
} from '../services/artFlowAIService';

export function useArtFlowAI(initialIntent?: string) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string>(() => `conv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUserPrompt, setLastUserPrompt] = useState<{ text: string; intent?: string; projectId?: string } | null>(null);

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
      setError('Não foi possível carregar o histórico desta conversa.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Start fresh conversation
  const startNewConversation = useCallback(() => {
    const newId = `conv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setCurrentConversationId(newId);
    setMessages([]);
    setError(null);
  }, []);

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

      const isResearch = intent === 'research' || clean.toLowerCase().includes('pesquis') || clean.toLowerCase().includes('exposiç');
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
          projectId,
          history,
        });

        const assistantMsg = response.message;
        setMessages([...nextMessages, assistantMsg]);

        // Persist messages in background
        if (user) {
          const title = deriveConversationTitle(clean, intent || (initialIntent as any));
          saveAIMessage(user.uid, currentConversationId, userMsg, title);
          saveAIMessage(user.uid, currentConversationId, assistantMsg, title);
          refreshConversations();
        }
      } catch (err: any) {
        console.error('AI chat failed:', err);
        const code = err?.code || '';
        if (code === 'AI_RATE_LIMIT_EXCEEDED') {
          setError('Limite de mensagens atingido (30/hora). Aguarde alguns instantes.');
        } else {
          setError(err?.message || 'Não consegui responder agora.');
        }
      } finally {
        setIsLoading(false);
        setIsSearching(false);
      }
    },
    [messages, isLoading, currentConversationId, user, initialIntent, refreshConversations]
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
    sendMessage,
    startNewConversation,
    selectConversation,
    removeConversation,
    retry,
  };
}
