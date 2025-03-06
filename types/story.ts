// types/story.ts
export interface Story {
  id: string;
  user_id: string;
  title: string;
  text_content: string | null;
  language: string;
  duration: number | null;
  audio_url: string | null;
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
}

// types/story.ts

// export interface Story {
//   id: string;
//   title: string;
//   coverImage: string;
//   thumbnail: string;
//   duration: number;
//   language: string;
//   createdAt: Date;
//   isFavorite: boolean;
//   backgroundMusic?: string;
//   characters: string[];
//   tags: string[];
// }

export interface DBStory {
  id: string;
  user_id: string;
  title: string;
  text_content?: string;
  language: string;
  duration?: number;
  audio_url?: string;
  theme?: string;
  created_at: string;
  is_favorite: boolean;
  play_count?: number;
  background_music_id?: string;
  voice_profile_id?: string;
  storage_path?: string;
  images?: {
    id: string;
    story_id: string;
    user_id: string;
    storage_path: string;
    upload_date: string;
    analysis_result?: any;
    sequence_index: number;
  }[];
}

export type CreateStoryInput = {
  title: string;
  language: string;
  theme?: string;
};

export type UpdateStoryInput = {
  title?: string;
  text_content?: string;
  language?: string;
  theme?: string;
};

export interface StoryImage {
  id: string;
  story_id: string;
  user_id: string;
  storage_path: string;
  upload_date: string;
  analysis_result?: any;
  sequence_index: number;
}

export interface StoryCharacter {
  id: string;
  story_id: string;
  name: string;
  description: string | null;
}

export interface StoryTag {
  id: string;
  story_id: string;
  tag: string;
}