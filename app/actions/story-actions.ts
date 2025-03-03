'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { auth } from '@/auth';
// import { auth } from '@/lib/auth';

/**
 * Toggle the favorite status of a story
 */
export async function toggleFavoriteAction(storyId: string, isFavorite: boolean) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error('You must be logged in to perform this action');
  }
  
  // Check if user owns the story
  const { data: story, error: storyError } = await supabase
    .from('stories')
    .select('user_id')
    .eq('id', storyId)
    .single();
  
  if (storyError || !story) {
    throw new Error('Story not found');
  }
  
  if (story.user_id !== session.user.id) {
    throw new Error('You do not have permission to modify this story');
  }
  
  // Update favorite status
  const { error } = await supabase
    .from('stories')
    .update({ is_favorite: isFavorite })
    .eq('id', storyId);
  
  if (error) {
    console.error('Error updating favorite status:', error);
    throw new Error('Failed to update favorite status');
  }
  
  // Revalidate the library page to reflect changes
  revalidatePath('/dashboard/library');
  
  return { success: true };
}

/**
 * Delete a story
 */
export async function deleteStoryAction(storyId: string) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error('You must be logged in to perform this action');
  }
  
  // Check if user owns the story
  const { data: story, error: storyError } = await supabase
    .from('stories')
    .select('user_id')
    .eq('id', storyId)
    .single();
  
  if (storyError || !story) {
    throw new Error('Story not found');
  }
  
  if (story.user_id !== session.user.id) {
    throw new Error('You do not have permission to delete this story');
  }
  
  // Delete the story (cascade will handle related records)
  const { error } = await supabase
    .from('stories')
    .delete()
    .eq('id', storyId);
  
  if (error) {
    console.error('Error deleting story:', error);
    throw new Error('Failed to delete story');
  }
  
  // Revalidate the library page to reflect changes
  revalidatePath('/dashboard/library');
  
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
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error('You must be logged in to perform this action');
  }
  
  // Insert new story
  const { data, error } = await supabase
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