'use server';

import { revalidatePath } from 'next/cache';
import { getAdminClient, supabase } from '@/lib/supabase';
import { auth } from '@/auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
// import { auth } from '@/lib/auth';

/**
 * Toggle the favorite status of a story
 */
export async function toggleFavoriteAction(storyId: string, isFavorite: boolean) {
  // Server actions always run on the server, so we'll use the admin client
  // to bypass CORS issues and ensure we have permissions to update
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error('You must be logged in to perform this action');
  }

  console.log(`[SERVER] Toggling favorite for story ${storyId} to ${isFavorite} for user ${session.user.id}`);
  
  // Always use the admin client for server actions to avoid CORS issues
  const client = getAdminClient();
  
  // Check if user owns the story
  const { data: story, error: storyError } = await client
    .from('stories')
    .select('user_id')
    .eq('id', storyId)
    .single();
  
  if (storyError || !story) {
    console.error(`[SERVER] Story not found:`, storyError);
    throw new Error('Story not found');
  }
  
  if (story.user_id !== session.user.id) {
    console.error(`[SERVER] Permission error: Story user_id ${story.user_id} doesn't match session user_id ${session.user.id}`);
    throw new Error('You do not have permission to modify this story');
  }

  // Update favorite status
  const { error } = await client
    .from('stories')
    .update({ is_favorite: isFavorite })
    .eq('id', storyId);
  
  if (error) {
    console.error('Error updating favorite status:', error);
    throw new Error('Failed to update favorite status');
  }
  
  // Get the updated story data to return
  const { data: updatedStory, error: fetchError } = await client
    .from('stories')
    .select('*')
    .eq('id', storyId)
    .single();
    
  if (fetchError) {
    console.error('[SERVER] Error fetching updated story:', fetchError);
  }
  
  // Revalidate all affected paths to reflect changes everywhere
  revalidatePath('/dashboard/library');
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/stories');
  revalidatePath(`/dashboard/stories/${storyId}`);
  
  console.log(`[SERVER] Successfully toggled favorite status for story ${storyId} to ${isFavorite}`);
  return { 
    success: true, 
    isFavorite,
    story: updatedStory || null
  };
}

/**
 * Record a new play history entry (server action to bypass RLS)
 */
export async function recordPlayStartAction(storyId: string) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error('You must be logged in to perform this action');
  }
  
  // Always use admin client for server actions
  const client = typeof window === 'undefined' ? getAdminClient() : supabase;
  
  try {
    // Insert new play history record
    const { data, error } = await client
      .from('play_history')
      .insert({
        user_id: session.user.id,
        story_id: storyId,
        played_at: new Date().toISOString(),
        completed: false,
        progress_percentage: 0
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error recording play start:", error);
      throw new Error('Failed to record play history');
    }
    
    // Increment play count on the story
    await client
      .from('stories')
      .update({ play_count: client.rpc('increment') })
      .eq('id', storyId);
    
    return data;
  } catch (error) {
    console.error("Unexpected error in recordPlayStartAction:", error);
    throw error;
  }
}

/**
 * Update play progress (server action to bypass RLS)
 */
export async function updatePlayProgressAction(
  playId: string,
  progressPercentage: number,
  completed: boolean = false
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error('You must be logged in to perform this action');
  }
  
  // Always use admin client for server actions
  const client = typeof window === 'undefined' ? getAdminClient() : supabase;
  
  try {
    // First verify that this play history entry belongs to the current user
    const { data: playHistory, error: verifyError } = await client
      .from('play_history')
      .select('user_id')
      .eq('id', playId)
      .single();
    
    if (verifyError || !playHistory) {
      console.error("Play history not found:", verifyError);
      throw new Error('Play history not found');
    }
    
    if (playHistory.user_id !== session.user.id) {
      throw new Error('You do not have permission to update this play history');
    }
    
    // Update the play progress
    const { data, error } = await client
      .from('play_history')
      .update({
        progress_percentage: progressPercentage,
        completed: completed
      })
      .eq('id', playId)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating play progress:", error);
      throw new Error('Failed to update play progress');
    }
    
    return data;
  } catch (error) {
    console.error("Unexpected error in updatePlayProgressAction:", error);
    throw error;
  }
}

/**
 * Delete a story
 */
export async function deleteStoryAction(storyId: string) {
  // Server actions always run on the server, so we'll use the admin client
  // to bypass CORS issues and ensure we have permissions to update
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error('You must be logged in to perform this action');
  }
  
  console.log(`[SERVER] Deleting story ${storyId} for user ${session.user.id}`);
  
  // Always use the admin client for server actions to avoid CORS issues
  const client = typeof window === 'undefined' ? getAdminClient() : supabase;
  
  // Check if user owns the story
  const { data: story, error: storyError } = await client
    .from('stories')
    .select('user_id')
    .eq('id', storyId)
    .single();
  
  if (storyError || !story) {
    console.error(`[SERVER] Story not found:`, storyError);
    throw new Error('Story not found');
  }
  
  if (story.user_id !== session.user.id) {
    console.error(`[SERVER] Permission error: Story user_id ${story.user_id} doesn't match session user_id ${session.user.id}`);
    throw new Error('You do not have permission to delete this story');
  }
  
  // Delete the story (cascade will handle related records)
  const { error } = await client
    .from('stories')
    .delete()
    .eq('id', storyId);
  
  if (error) {
    console.error('Error deleting story:', error);
    throw new Error('Failed to delete story');
  }
  
  // Revalidate all affected paths to reflect changes everywhere
  revalidatePath('/dashboard/library');
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/stories');
  
  console.log(`[SERVER] Successfully deleted story ${storyId}`);
  return { success: true };
}

/**
 * Create a new story
 */
export async function createStoryAction(storyData: {
  title: string;
  language: string;
  theme?: string;
}) {
  // Server actions always run on the server, so we'll use the admin client
  // to bypass CORS issues and ensure we have permissions to update
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error('You must be logged in to perform this action');
  }
  
  console.log(`[SERVER] Creating new story "${storyData.title}" for user ${session.user.id}`);
  
  // Always use the admin client for server actions to avoid CORS issues
  const client = typeof window === 'undefined' ? getAdminClient() : supabase;
  
  // Insert new story
  const { data, error } = await client
    .from('stories')
    .insert({
      user_id: session.user.id,
      title: storyData.title,
      language: storyData.language,
      theme: storyData.theme || 'adventure'
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating story:', error);
    throw new Error('Failed to create story');
  }
  
  // Revalidate the library page to reflect changes
  revalidatePath('/dashboard/library');
  
  return data;
}