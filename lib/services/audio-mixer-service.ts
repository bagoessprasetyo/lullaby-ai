/**
 * Audio Mixer Service
 * Provides functions for mixing story narration with background music
 */

/**
 * Mix story audio with background music
 * @param storyAudioUrl The URL of the story narration audio
 * @param backgroundMusicId The ID of the background music to mix with
 * @param volumeRatio The volume ratio for the background music (0-1, default 0.3)
 * @returns Promise with the URL of the mixed audio
 */
export async function mixAudioWithBackgroundMusic(
  storyAudioUrl: string,
  backgroundMusicId: string,
  volumeRatio: number = 0.3
): Promise<{ mixedAudioUrl: string; duration: number }> {
  try {
    const response = await fetch('/api/audio-mixer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        storyAudioUrl,
        backgroundMusicId,
        volumeRatio,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to mix audio');
    }

    const data = await response.json();
    return {
      mixedAudioUrl: data.mixedAudioUrl,
      duration: data.duration,
    };
  } catch (error) {
    console.error('Error mixing audio:', error);
    throw error;
  }
}

/**
 * Store mixed audio reference in the story record
 * @param storyId The ID of the story to update
 * @param mixedAudioUrl The URL of the mixed audio
 * @param duration The duration of the mixed audio in seconds
 */
export async function updateStoryWithMixedAudio(
  storyId: string,
  mixedAudioUrl: string,
  duration: number
): Promise<void> {
  try {
    const response = await fetch(`/api/stories/${storyId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mixed_audio_url: mixedAudioUrl,
        mixed_audio_duration: duration,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update story with mixed audio');
    }
  } catch (error) {
    console.error('Error updating story with mixed audio:', error);
    throw error;
  }
}