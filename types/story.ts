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
  images?: StoryImage[];
  characters?: StoryCharacter[];
  tags?: StoryTag[];
}

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