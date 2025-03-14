// lib/utils/story-utils.ts

import { Story } from '@/types/story';
import { PlayHistoryEntry } from '@/lib/services/history-service';

/**
 * Converts a PlayHistoryEntry to a Story object with default values for required fields
 */
export function historyEntryToStory(
  historyEntry: PlayHistoryEntry, 
  userId: string = 'anonymous'
): Story {
  // Safely handle date conversion
  let createdAtIso: string;
  try {
    // Check if playedAt exists and is valid
    createdAtIso = historyEntry.playedAt ? 
      new Date(historyEntry.playedAt).toISOString() : 
      new Date().toISOString();
  } catch (error) {
    // Fallback to current date if conversion fails
    console.warn(`Invalid date format for playedAt: ${historyEntry.playedAt}`);
    createdAtIso = new Date().toISOString();
  }

  return {
    id: historyEntry.storyId,
    user_id: userId,
    title: historyEntry.storyTitle,
    text_content: null,
    language: 'en', // Default to English
    duration: historyEntry.duration || null,
    audio_url: null,
    theme: 'bedtime', // Default to bedtime theme
    created_at: createdAtIso,
    is_favorite: false,
    play_count: 1,
    background_music_id: null,
    voice_profile_id: null,
    storage_path: null,
    coverImage: historyEntry.coverImage,
    // Optional UI properties
    thumbnail: historyEntry.coverImage,
    createdAt: historyEntry.playedAt ? new Date(historyEntry.playedAt) : new Date()
  };
}

/**
 * Converts an array of PlayHistoryEntry to an array of Story objects
 */
export function historyEntriesToStories(historyEntries: any[]): Story[] {
  console.log('Converting history entries to stories:', historyEntries);
  
  return historyEntries.map(entry => {
    // Make sure story_id is properly mapped to id
    const story: Story = {
        id: entry.story_id || entry.id, // Use story_id from history or fallback to entry id
        title: entry.title || entry.story_title || 'Untitled Story',
        text_content: null,
        language: 'en', // Default to English
        duration: entry.duration || null,
        audio_url: null,
        theme: 'bedtime', // Default to bedtime theme
        created_at: entry.created_at || new Date().toISOString(),
        user_id: '',
        is_favorite: false,
        play_count: 0,
        background_music_id: null,
        voice_profile_id: null,
        storage_path: null
    };
    
    console.log('Converted story:', story);
    return story;
  });
}