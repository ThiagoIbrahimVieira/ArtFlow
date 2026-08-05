import { Project, Reference, Palette, UserProfile, Achievement, Activity } from '../types';

// High quality curated artwork photos matching the screenshots
export const HERO_ARTWORK_URL = "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=800&auto=format&fit=crop"; // Classical oil portrait woman warm leaves
export const MARBLE_STUDY_URL = "https://images.unsplash.com/photo-1561214115-f2f134cc4912?q=80&w=800&auto=format&fit=crop"; // Classical marble bust sculpture
export const FOREST_MOOD_URL = "https://images.unsplash.com/photo-1511497584788-8767611136f6?q=80&w=800&auto=format&fit=crop"; // Misty green sunlit forest stream
export const HERO_POSE_URL = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop"; // Warrior knight dramatically lit
export const WARM_LIGHTING_URL = "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800&auto=format&fit=crop"; // Warm golden room lighting interior
export const CASTLE_LANDSCAPE_URL = "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop"; // Ancient fantasy castle sunset landscape
export const OIL_PORTRAIT_URL = "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=800&auto=format&fit=crop"; // Oil painting portrait
export const TEMPLE_RUINS_URL = "https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=800&auto=format&fit=crop"; // Atmospheric temple environment
export const KNIGHT_PORTRAIT_URL = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop"; // Male portrait armor style

export const MOCK_USER: UserProfile = {
  displayName: "Elena Mora",
  name: "Elena Mora",
  email: "elena@artflow.app",
  username: "@elenastudio",
  bio: "Illustrator & concept artist",
  avatarUrl: HERO_ARTWORK_URL,
  projectsCount: 12,
  referencesCount: 84,
  palettesCount: 21,
};

export const MOCK_PROJECTS: Project[] = [
  {
    id: "proj-1",
    title: "Knight Portrait",
    category: "Digital Painting",
    status: "Sketching",
    progress: 25,
    imageUrl: KNIGHT_PORTRAIT_URL,
  },
  {
    id: "proj-2",
    title: "Temple Environment",
    category: "Environment Design",
    status: "In Progress",
    progress: 68,
    imageUrl: TEMPLE_RUINS_URL,
  },
  {
    id: "proj-3",
    title: "Autumn Cover",
    category: "Illustration",
    status: "Review",
    progress: 90,
    imageUrl: HERO_ARTWORK_URL,
  },
  {
    id: "proj-4",
    title: "Knights of Eldoria",
    category: "Digital Painting",
    status: "In Progress",
    progress: 64,
    imageUrl: CASTLE_LANDSCAPE_URL,
  },
  {
    id: "proj-5",
    title: "Portrait Study",
    category: "Oil Painting",
    status: "Sketching",
    progress: 38,
    imageUrl: OIL_PORTRAIT_URL,
  }
];

export const MOCK_REFERENCES: Reference[] = [
  {
    id: "ref-1",
    title: "Marble Study",
    category: "Characters",
    imageUrl: MARBLE_STUDY_URL,
    isBookmarked: true,
  },
  {
    id: "ref-2",
    title: "Forest Mood",
    category: "Landscapes",
    imageUrl: FOREST_MOOD_URL,
    isBookmarked: true,
  },
  {
    id: "ref-3",
    title: "Hero Pose",
    category: "Poses",
    imageUrl: HERO_POSE_URL,
    isBookmarked: true,
  },
  {
    id: "ref-4",
    title: "Warm Lighting",
    category: "Color",
    imageUrl: WARM_LIGHTING_URL,
    isBookmarked: true,
  },
  {
    id: "ref-5",
    title: "Autumn Portrait",
    category: "Characters",
    imageUrl: HERO_ARTWORK_URL,
    isBookmarked: true,
  },
  {
    id: "ref-6",
    title: "Eldoria Citadel",
    category: "Landscapes",
    imageUrl: CASTLE_LANDSCAPE_URL,
    isBookmarked: true,
  }
];

export const MOCK_PALETTES: Palette[] = [
  {
    id: "pal-day",
    name: "Palette of the Day",
    category: "Warm",
    colors: ["#3D2314", "#B85028", "#D48E28", "#D9B98D", "#EEDCC6"],
    isSaved: false,
    description: "Inspired by autumn light and golden afternoons.",
  },
  {
    id: "pal-1",
    name: "Golden Dust",
    category: "Warm",
    colors: ["#3B2613", "#B87328", "#DA9831", "#E5C590", "#F3E4C8"],
    isSaved: true,
  },
  {
    id: "pal-2",
    name: "Velvet Forest",
    category: "Moody",
    colors: ["#233526", "#4C5938", "#828B72", "#47585F", "#D2C8B8"],
    isSaved: true,
  },
  {
    id: "pal-3",
    name: "Rose Ash",
    category: "Vintage",
    colors: ["#5E423B", "#A16259", "#A58B82", "#BDB0A7", "#E9DFD8"],
    isSaved: false,
  },
  {
    id: "pal-4",
    name: "Moon Clay",
    category: "Moody",
    colors: ["#2C3B47", "#5C6B75", "#888077", "#C7BFB5", "#ECE5DD"],
    isSaved: true,
  }
];

export const MOCK_ACHIEVEMENTS: Achievement[] = [
  {
    id: "ach-1",
    title: "7 Day Streak",
    description: "Keep creating!",
    icon: "flame",
  },
  {
    id: "ach-2",
    title: "10 Finished Works",
    description: "Milestone reached",
    icon: "star",
  },
];

export const MOCK_ACTIVITIES: Activity[] = [
  {
    id: "act-1",
    title: "Added a new project",
    targetName: "Knights of Eldoria",
    time: "2h ago",
    thumbnail: CASTLE_LANDSCAPE_URL,
    type: "project",
  },
  {
    id: "act-2",
    title: "Added a new reference",
    targetName: "Portrait Study",
    time: "Yesterday",
    thumbnail: OIL_PORTRAIT_URL,
    type: "reference",
  },
  {
    id: "act-3",
    title: "Created a new palette",
    targetName: "Autumn Light",
    time: "2 days ago",
    thumbnail: "palette", // renders color blocks preview
    type: "palette",
  },
];
