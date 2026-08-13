import { z } from 'zod';

export const ChatHistoryItemSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().max(8000),
});

export const ChatRequestSchema = z.object({
  conversationId: z.string().max(128).optional(),
  message: z.string().trim().min(1, { message: 'Message cannot be empty.' }).max(4000, { message: 'Message cannot exceed 4000 characters.' }),
  intent: z.enum(['chat', 'create_palette', 'research', 'art_feedback']).optional(),
  projectId: z.string().max(128).optional(),
  history: z.array(ChatHistoryItemSchema).max(30).optional(),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export const ArtFlowAIChatRequestSchema = ChatRequestSchema;

export const PaletteToolInputSchema = z.object({
  description: z.string().min(1).max(500),
  colorCount: z.number().int().min(3).max(8).default(5),
  baseColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, { message: 'Invalid hex format' }).optional(),
});

export type PaletteToolInput = z.infer<typeof PaletteToolInputSchema>;

export const PaletteColorSchema = z.object({
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, { message: 'Invalid hex code format' }),
  name: z.string().min(1).max(60),
  role: z.string().min(1).max(80),
});

export const PaletteToolOutputSchema = z.object({
  paletteName: z.string().min(1).max(80),
  description: z.string().min(1).max(300),
  harmony: z.string().min(1).max(60),
  colors: z.array(PaletteColorSchema).min(3).max(8),
  usageTips: z.array(z.string()).min(1),
  contrastNotes: z.array(z.string()).optional(),
});

export type PaletteToolOutput = z.infer<typeof PaletteToolOutputSchema>;
export const CreatePaletteToolSchema = PaletteToolOutputSchema;
