// services/story-service.ts
import { supabase } from '@/lib/supabase';

export type Story = {
  id: string;
  title: string;
  created_at: string;
  language: string;
  duration: number;
  is_favorite: boolean;
  theme: string;
  audio_url?: string;
  user_id: string;
  // Add other fields as needed
};


// Get all stories with filtering, sorting, and pagination
export async function getStoriesWithFilters(
  userId: string, 
  options: {
    filterLanguage?: string | null,
    isFavorite?: boolean | null,
    searchQuery?: string,
    sortBy?: string,
    page?: number,
    pageSize?: number
  } = {}
) {
  const {
    filterLanguage,
    isFavorite,
    searchQuery,
    sortBy = 'newest',
    page = 1,
    pageSize = 50
  } = options;
  
  let query = supabase
    .from('stories')
    .select('*, images!inner(*)', { count: 'exact' })
    .eq('user_id', userId);
  
  // Apply filters
  if (filterLanguage) {
    query = query.eq('language', filterLanguage);
  }
  
  if (isFavorite !== null && isFavorite !== undefined) {
    query = query.eq('is_favorite', isFavorite);
  }
  
  if (searchQuery && searchQuery.trim()) {
    query = query.ilike('title', `%${searchQuery}%`);
  }
  
  // Apply sorting
  switch (sortBy) {
    case 'newest':
      query = query.order('created_at', { ascending: false });
      break;
    case 'oldest':
      query = query.order('created_at', { ascending: true });
      break;
    case 'longest':
      query = query.order('duration', { ascending: false });
      break;
    case 'shortest':
      query = query.order('duration', { ascending: true });
      break;
    case 'title-asc':
      query = query.order('title', { ascending: true });
      break;
    case 'title-desc':
      query = query.order('title', { ascending: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }
  
  // Apply pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);
  
  const { data, error, count } = await query;
  
  if (error) {
    console.error("Error fetching stories:", error);
    return { stories: [], count: 0 };
  }
  
  return { 
    stories: data || [], 
    count: count || 0
  };
}

// Toggle favorite status
export async function toggleStoryFavorite(storyId: string, isFavorite: boolean) {
  const { data, error } = await supabase
    .from('stories')
    .update({ is_favorite: isFavorite })
    .eq('id', storyId)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating favorite status:", error);
    return null;
  }
  
  return data;
}

// Delete a story
export async function deleteStory(storyId: string) {
  // First delete associated images and other related data (handled by ON DELETE CASCADE)
  // Then delete the story
  const { error } = await supabase
    .from('stories')
    .delete()
    .eq('id', storyId);
  
  if (error) {
    console.error("Error deleting story:", error);
    return false;
  }
  
  return true;
}

export async function getRecentStories(userId: string, limit = 3) {
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  // console.log('Recent Story Result:', { data, error });
    
  if (error) {
    console.error("Error fetching recent stories:", error);
    return [];
  }
  
  return data || [];
}

export async function getStoryCount(userId: string) {
  const { count, error } = await supabase
    .from('stories')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
    
  if (error) {
    console.error("Error counting stories:", error);
    return 0;
  }
  
  return count || 0;
}

export async function getFavoriteStories(userId: string, limit = 3) {
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('user_id', userId)
    .eq('is_favorite', true)
    .order('created_at', { ascending: false })
    .limit(limit);
    
  if (error) {
    console.error("Error fetching favorite stories:", error);
    return [];
  }
  
  return data || [];
}