export type ProjectStatus = 'idea' | 'sketching' | 'in_progress' | 'review' | 'completed' | 'Sketching' | 'In Progress' | 'Review' | 'Completed';

export interface Project {
  id: string;
  title: string;
  category: string;
  description?: string;
  status: ProjectStatus;
  progress: number;
  imageUrl: string;
  imagePath?: string | null;
  thumbnailUrl?: string | null;
  deadline?: string | Date | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Reference {
  id: string;
  title: string;
  imageUrl: string;
  source?: 'manual' | 'deviantart';
  sourceUrl?: string | null;
  artistName?: string | null;
  artistProfileUrl?: string | null;
  description?: string | null;
  category: string;
  tags?: string[];
  isBookmarked: boolean;
  bookmarked?: boolean;
  deviantArtId?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export type PaletteCategory = 'Warm' | 'Moody' | 'Vintage' | 'Cool' | 'Earthy' | 'Pastel' | 'Neon' | 'Monochromatic' | 'Retro' | string;

export interface PaletteColor {
  hex: string;
  name: string;
  role: string;
}

export interface Palette {
  id: string;
  name: string;
  category: PaletteCategory;
  colors: string[] | PaletteColor[];
  isSaved: boolean;
  description?: string;
  mood?: string;
  harmony?: string;
  usageTips?: string[];
  contrastNotes?: string[];
  generatedBy?: 'manual' | 'gemini';
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: 'flame' | 'star';
  progress?: number;
  maxProgress?: number;
  unlocked?: boolean;
}

export interface Activity {
  id: string;
  title: string;
  targetName: string;
  time: string;
  thumbnail: string;
  type: 'project' | 'reference' | 'palette';
  rawDate?: Date;
}

export interface UserProfile {
  uid?: string;
  displayName: string;
  name?: string; // Backwards compatibility for UI
  email: string;
  username: string;
  avatarUrl: string | null;
  bio: string;
  projectsCount?: number;
  referencesCount?: number;
  palettesCount?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface ColorMuseRequest {
  medium: string;
  subject: string;
  mood: string;
  baseColor?: string;
  colorCount: number;
}

export interface ColorMuseResponse {
  paletteName: string;
  description: string;
  harmony: string;
  colors: PaletteColor[];
  usageTips: string[];
  contrastNotes: string[];
}

export interface DeviantArtArtwork {
  id: string;
  title: string;
  artist: string;
  artistProfileUrl: string | null;
  thumbnailUrl: string;
  sourceUrl: string;
  category: string | null;
  description?: string | null;
  tags?: string[];
  publishedTime?: string | null;
  width: number | null;
  height: number | null;
}

export interface DeviantArtInspirationResponse {
  items: DeviantArtArtwork[];
  nextOffset: number | null;
}

export interface ArtProvider {
  getDailyInspirations(): Promise<DeviantArtArtwork[]>;
  searchArtworks(query: string, category?: string): Promise<DeviantArtArtwork[]>;
}

// ==========================================
// ArtFlow AI Types
// ==========================================

export type AIMessageRole = 'user' | 'assistant';

export type AIMessageType = 'text' | 'palette' | 'research' | 'error';

export interface AISource {
  title: string;
  url: string;
  snippet?: string;
}

export interface AIPaletteData {
  paletteName: string;
  description: string;
  harmony: string;
  colors: PaletteColor[];
  usageTips: string[];
  contrastNotes?: string[];
}

export interface AIMessage {
  id: string;
  role: AIMessageRole;
  content: string;
  createdAt: Date;
  type?: AIMessageType;
  palette?: AIPaletteData;
  sources?: AISource[];
  data?: any;
}

export interface AIConversation {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessagePreview?: string;
}

export interface ArtFlowAIChatRequest {
  conversationId?: string;
  message: string;
  intent?: 'chat' | 'create_palette' | 'research' | 'art_feedback';
  projectId?: string;
  history?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface ArtFlowAIChatResponse {
  message: AIMessage;
  palette?: AIPaletteData;
  sources?: AISource[];
  conversationId?: string;
  title?: string;
}

// ==========================================
// Generic API Responses
// ==========================================

export interface ApiSuccess<T> {
  data: T;
  error: null;
}

export interface ApiError {
  data: null;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
