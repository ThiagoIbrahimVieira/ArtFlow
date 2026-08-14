import { GoogleGenAI } from '@google/genai';
import { Firestore } from 'firebase-admin/firestore';
import { ARTFLOW_SYSTEM_PROMPT } from './artFlowSystemPrompt';
import { createPaletteDeclaration } from './tools';
import { validateAndFormatPalette } from './paletteTool';
import { AIPaletteData, AISource, AIMessage } from '../../../src/types';

export interface ChatServiceInput {
  uid: string;
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  intent?: 'chat' | 'create_palette' | 'research' | 'art_feedback';
  projectId?: string;
  db: Firestore | null;
}

export interface ChatServiceOutput {
  message: AIMessage;
  palette?: AIPaletteData;
  sources?: AISource[];
}

export async function processArtFlowAIChat(input: ChatServiceInput): Promise<ChatServiceOutput> {
  const apiKey = process.env.GEMINI_API_KEY?.replace(/^["']|["']$/g, '').trim();
  if (!apiKey) {
    throw new Error('CONFIG_ERROR');
  }

  const rawModel = process.env.GEMINI_MODEL?.replace(/^["']|["']$/g, '').trim();
  const modelName = rawModel && !['gemini-2.5-flash', 'gemini-3.6-flash', 'gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest'].includes(rawModel) ? rawModel : 'gemini-3.5-flash-lite';

  const ai = new GoogleGenAI({ apiKey });

  // 1. Fetch user project context if projectId is provided
  let projectContextPrompt = '';
  if (input.projectId && input.db) {
    try {
      const projDoc = await input.db
        .collection('users')
        .doc(input.uid)
        .collection('projects')
        .doc(input.projectId)
        .get();

      if (projDoc.exists) {
        const projData = projDoc.data() || {};
        projectContextPrompt = `\n[Contexto do Projeto Ativo do Usuário]:
- Título: ${projData.title || 'Sem título'}
- Categoria: ${projData.category || 'Geral'}
- Descrição: ${projData.description || 'Nenhuma'}
- Progresso Atual: ${projData.progress ?? 0}%
- Status: ${projData.status || 'Em andamento'}\n`;
      }
    } catch (err) {
      console.warn('Failed to load project context for AI:', err);
    }
  }

  // 2. Build multi-turn contents
  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  if (Array.isArray(input.history)) {
    for (const h of input.history) {
      contents.push({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }],
      });
    }
  }

  let finalUserPrompt = input.message;
  if (projectContextPrompt) {
    finalUserPrompt = `${projectContextPrompt}\nMensagem do Artista: ${input.message}`;
  }

  if (input.intent === 'create_palette' && !input.message.toLowerCase().includes('paleta')) {
    finalUserPrompt = `[Intenção: Criar Paleta de Cores]\n${finalUserPrompt}`;
  }

  contents.push({
    role: 'user',
    parts: [{ text: finalUserPrompt }],
  });

  // 3. Configure Gemini call with tools
  const toolsConfig: any[] = [
    { functionDeclarations: [createPaletteDeclaration] },
  ];

  // Enable Google Search Grounding when relevant or available
  const isResearchIntent = input.intent === 'research' || input.message.toLowerCase().includes('pesquis') || input.message.toLowerCase().includes('exposiç') || input.message.toLowerCase().includes('museu') || input.message.toLowerCase().includes('atual');
  if (isResearchIntent) {
    toolsConfig.push({ googleSearch: {} });
  }

  let response: any;
  try {
    response = await ai.models.generateContent({
      model: modelName,
      contents,
      config: {
        systemInstruction: ARTFLOW_SYSTEM_PROMPT,
        tools: toolsConfig,
        temperature: 0.7,
      },
    });
  } catch (error: any) {
    console.error('[GEMINI_CHAT_ERROR]', error?.message || error);
    const errLower = (error?.message || '').toLowerCase();

    if (errLower.includes('api_key_invalid') || errLower.includes('key not valid') || errLower.includes('401') || errLower.includes('403')) {
      throw new Error('GEMINI_AUTH_ERROR');
    }
    if (errLower.includes('quota') || errLower.includes('resource_exhausted') || errLower.includes('429')) {
      throw new Error('GEMINI_RATE_LIMIT_EXCEEDED');
    }
    if (errLower.includes('not found') || errLower.includes('404')) {
      throw new Error('GEMINI_MODEL_NOT_FOUND');
    }
    throw new Error('GEMINI_UPSTREAM_ERROR');
  }

  // 4. Extract generated text and candidate metadata
  const candidate = response?.candidates?.[0];
  let responseText = response?.text || '';

  let generatedPalette: AIPaletteData | undefined;
  const extractedSources: AISource[] = [];

  // Check for tool function calls
  const functionCalls = response?.functionCalls || candidate?.content?.parts?.filter((p: any) => p.functionCall).map((p: any) => p.functionCall);

  if (Array.isArray(functionCalls) && functionCalls.length > 0) {
    for (const fc of functionCalls) {
      if (fc.name === 'create_palette' && fc.args) {
        try {
          generatedPalette = validateAndFormatPalette(fc.args);
        } catch (valErr) {
          console.warn('Failed to parse palette function call args:', valErr);
        }
      }
    }
  }

  // Check for search grounding metadata
  const groundingMeta = candidate?.groundingMetadata;
  if (groundingMeta && Array.isArray(groundingMeta.groundingChunks)) {
    for (const chunk of groundingMeta.groundingChunks) {
      if (chunk.web?.uri) {
        extractedSources.push({
          title: chunk.web.title || new URL(chunk.web.uri).hostname,
          url: chunk.web.uri,
          snippet: chunk.web.snippet || undefined,
        });
      }
    }
  }

  // If text is empty but a palette was generated, provide an expressive intro
  if (!responseText && generatedPalette) {
    responseText = `Aqui está uma paleta estruturada para "${generatedPalette.paletteName}". Harmonia ${generatedPalette.harmony}: ${generatedPalette.description}`;
  } else if (!responseText) {
    responseText = 'Como posso ajudar no seu processo criativo hoje?';
  }

  const messageType = generatedPalette ? 'palette' : extractedSources.length > 0 ? 'research' : 'text';

  const finalMessage: AIMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    role: 'assistant',
    content: responseText,
    type: messageType,
    palette: generatedPalette,
    sources: extractedSources.length > 0 ? extractedSources : undefined,
    createdAt: new Date(),
  };

  return {
    message: finalMessage,
    palette: generatedPalette,
    sources: extractedSources.length > 0 ? extractedSources : undefined,
  };
}
