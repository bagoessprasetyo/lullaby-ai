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
  
  if (!historyEntries || !Array.isArray(historyEntries) || historyEntries.length === 0) {
    console.warn('No valid history entries to convert to stories');
    return [];
  }
  
  return historyEntries.map(entry => {
    if (!entry) {
      console.warn('Skipping null or undefined entry in historyEntriesToStories');
      return null;
    }
    
    // Extract story data from nested structure if available
    const storyData = entry.story || {};
    
    // Make sure story_id is properly mapped to id
    const story: Story = {
        id: entry.story_id || entry.id || storyData.id || 'unknown-id', // Use story_id from history or fallback to entry id
        title: storyData.title || entry.title || entry.storyTitle || 'Untitled Story',
        text_content: storyData.text_content || null,
        language: storyData.language || entry.language || 'en', // Default to English
        duration: storyData.duration || entry.duration || null,
        audio_url: storyData.audio_url || entry.audio_url || null,
        theme: storyData.theme || entry.theme || 'bedtime', // Default to bedtime theme
        created_at: storyData.created_at || entry.created_at || entry.playedAt || new Date().toISOString(),
        user_id: storyData.user_id || entry.user_id || '',
        is_favorite: storyData.is_favorite || entry.is_favorite || false,
        play_count: storyData.play_count || entry.play_count || 0,
        background_music_id: storyData.background_music_id || null,
        voice_profile_id: storyData.voice_profile_id || null,
        storage_path: storyData.storage_path || null,
        // Add image properties
        coverImage: storyData.coverImage || entry.coverImage || entry.cover_image || null,
        thumbnail: storyData.thumbnail || entry.thumbnail || entry.coverImage || entry.cover_image || null,
        images: storyData.images || entry.images || []
    };
    
    // Add image data if it exists in a nested format
    if (entry.story && entry.story.images && Array.isArray(entry.story.images)) {
      story.images = entry.story.images.map((img: any) => ({
        id: img.id || `img-${Math.random().toString(36).substring(2, 9)}`,
        storage_path: img.storage_path,
        sequence_index: img.sequence_index || 0
      }));
    }
    
    // If we have a cover_image but no images array, create one
    if ((entry.cover_image || entry.coverImage) && (!story.images || !Array.isArray(story.images) || story.images.length === 0)) {
      const imagePath = entry.cover_image || entry.coverImage;
      story.images = [{
        id: `img-${story.id}-${Math.random().toString(36).substring(2, 9)}`,
        storage_path: imagePath,
        sequence_index: 0
      }];
    }
    
    console.log('Converted story:', story);
    return story;
  }).filter(Boolean); // Remove any null entries
}