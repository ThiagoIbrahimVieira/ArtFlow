export type ProjectStatus = 'Sketching' | 'In Progress' | 'Review' | 'Completed';

export interface Project {
  id: string;
  title: string;
  category: string;
  status: ProjectStatus;
  progress: number;
  imageUrl: string;
}

export interface Reference {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  isBookmarked: boolean;
}

export type PaletteCategory = 'Warm' | 'Moody' | 'Vintage' | 'Cool';

export interface Palette {
  id: string;
  name: string;
  category: PaletteCategory;
  colors: string[];
  isSaved: boolean;
  description?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: 'flame' | 'star';
}

export interface Activity {
  id: string;
  title: string;
  targetName: string;
  time: string;
  thumbnail: string;
  type: 'project' | 'reference' | 'palette';
}

export interface UserProfile {
  name: string;
  username: string;
  bio: string;
  avatarUrl: string;
  projectsCount: number;
  referencesCount: number;
  palettesCount: number;
}
