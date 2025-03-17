// types/story.ts

export interface StoryImage {
  id: string;
  storage_path: string;
  sequence_index?: number;
  upload_date?: string;
}

export interface StoryPage {
  id: string;
  text: string;
  imageUrl?: string;
  audioUrl?: string;
}

export interface StorySummary {
  id: string;
  title: string;
  theme: string;
  language: string;
  duration?: number;
  created_at: string;
  cover_image?: string;
}

export interface Story {
  id: string;
  user_id: string;
  title: string;
  text_content: string | null;
  language: string;
  duration: number | null;
  audio_url: string | null;
  mixed_audio_url?: string | null; // URL to the pre-mixed audio (narration + background music)
  theme: string;
  created_at: string;
  is_favorite: boolean;
  play_count: number;
  background_music_id: string | null;
  voice_profile_id: string | null;
  storage_path: string | null;
  // UI specific properties
  coverImage?: string;
  thumbnail?: string;
  createdAt?: Date;
  isFavorite?: boolean;
  backgroundMusic?: string;
  characters?: any[];
  tags?: string[];
  images?: StoryImage[];
  // Enhanced functionality
  pages?: StoryPage[];
  hasMixedAudio?: boolean; // Flag indicating if audio has been mixed with background music
}

export interface StoryWithPagination extends Story {
  pages: StoryPage[];
}

export interface BackgroundMusic {
  id: string;
  name: string;
  url: string;
  category: string;
  duration: number;
}

export interface Character {
  id: string;
  name: string;
  description: string;
}

export interface StoryCreationOptions {
  title: string;
  theme: string;
  language: string;
  duration: string;
  characters: { name: string; description: string }[];
  images: File[];
  voice: string;
  backgroundMusic?: string;
}

export interface StoryPlayerOptions {
  showSettings?: boolean;
  autoPlay?: boolean;
  showTranscript?: boolean;
  loop?: boolean;
  volume?: number;
  speed?: number;
  theme?: "light" | "dark";
}