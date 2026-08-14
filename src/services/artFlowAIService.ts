import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import {
  AIConversation,
  AIMessage,
  ArtFlowAIChatRequest,
  ArtFlowAIChatResponse,
} from '../types';

export function deriveConversationTitle(prompt: string, intent?: string): string {
  if (intent === 'create_palette') {
    const clean = prompt.replace(/^queria\s+uma\s+paleta\s+(de\s+|para\s+)?/i, '').trim();
    if (clean.length > 3 && clean.length < 35) {
      return `Paleta: ${clean.charAt(0).toUpperCase() + clean.slice(1)}`;
    }
    return 'Nova Paleta';
  }

  const clean = prompt
    .replace(/^(quero|queria|gostaria|pode|me ajuda|como|qual|o que é|ajuda)\s+/i, '')
    .trim();

  const words = clean.split(/\s+/).slice(0, 5).join(' ');
  if (!words) return 'Conversa Artística';

  const capped = words.charAt(0).toUpperCase() + words.slice(1);
  return capped.length > 35 ? `${capped.slice(0, 32)}...` : capped;
}

export async function sendArtFlowAIMessage(
  req: ArtFlowAIChatRequest
): Promise<ArtFlowAIChatResponse> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('AUTH_REQUIRED');
  }

  const idToken = await currentUser.getIdToken(true);

  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      conversationId: req.conversationId,
      message: req.message,
      intent: req.intent,
      preferredLanguage: req.preferredLanguage,
      projectId: req.projectId,
      history: req.history,
    }),
  });

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('Serviço ArtFlow AI indisponível.');
  }

  const json = await res.json();
  if (!res.ok || json.error) {
    const errorMsg = json.error?.message || 'Falha ao conversar com o ArtFlow AI.';
    const err = new Error(errorMsg);
    (err as any).code = json.error?.code;
    throw err;
  }

  const data = json.data;
  return {
    message: {
      ...data.message,
      createdAt: data.message?.createdAt ? new Date(data.message.createdAt) : new Date(),
    },
    palette: data.palette,
    sources: data.sources,
    conversationId: req.conversationId,
  };
}

export async function listAIConversations(uid: string): Promise<AIConversation[]> {
  try {
    const colRef = collection(db, 'users', uid, 'aiConversations');
    const q = query(colRef, orderBy('updatedAt', 'desc'), limit(20));
    const snap = await getDocs(q);

    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        title: data.title || 'Conversa Artística',
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
        lastMessagePreview: data.lastMessagePreview || '',
      };
    });
  } catch (err) {
    console.warn('Failed to list AI conversations:', err);
    return [];
  }
}

export async function getConversationMessages(
  uid: string,
  conversationId: string
): Promise<AIMessage[]> {
  try {
    const messagesRef = collection(db, 'users', uid, 'aiConversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(50));
    const snap = await getDocs(q);

    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        role: data.role || 'user',
        content: data.content || '',
        type: data.type || 'text',
        palette: data.palette || undefined,
        sources: data.sources || undefined,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
      };
    });
  } catch (err) {
    console.warn('Failed to get conversation messages:', err);
    return [];
  }
}

export async function saveAIMessage(
  uid: string,
  conversationId: string,
  message: AIMessage,
  conversationTitle?: string
): Promise<void> {
  try {
    const convRef = doc(db, 'users', uid, 'aiConversations', conversationId);
    const convSnap = await getDoc(convRef);

    const preview = message.content.slice(0, 80);

    if (!convSnap.exists()) {
      await setDoc(convRef, {
        title: conversationTitle || deriveConversationTitle(message.content, message.palette ? 'create_palette' : undefined),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessagePreview: preview,
      });
    } else {
      await updateDoc(convRef, {
        updatedAt: serverTimestamp(),
        lastMessagePreview: preview,
      });
    }

    const msgRef = doc(db, 'users', uid, 'aiConversations', conversationId, 'messages', message.id);
    const msgData: Record<string, any> = {
      role: message.role,
      content: message.content,
      type: message.type || 'text',
      createdAt: serverTimestamp(),
    };

    if (message.palette) msgData.palette = message.palette;
    if (message.sources) msgData.sources = message.sources;

    await setDoc(msgRef, msgData);
  } catch (err) {
    console.warn('Failed to persist AI message in Firestore:', err);
  }
}

export async function deleteAIConversation(uid: string, conversationId: string): Promise<void> {
  const convRef = doc(db, 'users', uid, 'aiConversations', conversationId);
  await deleteDoc(convRef);
}
