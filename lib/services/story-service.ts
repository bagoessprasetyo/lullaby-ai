// services/story-service.ts
import { getAdminClient, supabase } from '@/lib/supabase';

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
// export async function getStoriesWithFilters(
// userId: string, options: {
//     filterLanguage?: string | null;
//     isFavorite?: boolean | null;
//     searchQuery?: string;
//     sortBy?: string;
//     page?: number;
//     pageSize?: number;
// } = {}, p0: { cache: string; }) {
//   const {
//     filterLanguage,
//     isFavorite,
//     searchQuery,
//     sortBy = 'newest',
//     page = 1,
//     pageSize = 50
//   } = options;

//   const client = typeof window === 'undefined' ? getAdminClient() : supabase;
  
//   let query = client
//     .from('stories')
//     .select('*, images!inner(*)', { count: 'exact' })
//     .eq('user_id', userId);
  
  
//   // Apply filters
//   if (filterLanguage) {
//     query = query.eq('language', filterLanguage);
//   }
  
//   if (isFavorite !== null && isFavorite !== undefined) {
//     query = query.eq('is_favorite', isFavorite);
//   }
  
//   if (searchQuery && searchQuery.trim()) {
//     query = query.ilike('title', `%${searchQuery}%`);
//   }
  
//   // Apply sorting
//   switch (sortBy) {
//     case 'newest':
//       query = query.order('created_at', { ascending: false });
//       break;
//     case 'oldest':
//       query = query.order('created_at', { ascending: true });
//       break;
//     case 'longest':
//       query = query.order('duration', { ascending: false });
//       break;
//     case 'shortest':
//       query = query.order('duration', { ascending: true });
//       break;
//     case 'title-asc':
//       query = query.order('title', { ascending: true });
//       break;
//     case 'title-desc':
//       query = query.order('title', { ascending: false });
//       break;
//     default:
//       query = query.order('created_at', { ascending: false });
//   }
  
//   // Apply pagination
//   const from = (page - 1) * pageSize;
//   const to = from + pageSize - 1;
//   query = query.range(from, to);
  
//   const { data, error, count } = await query;

//   console.log('storieeesss ',data);
  
//   if (error) {
//     console.error("Error fetching stories:", error);
//     return { stories: [], count: 0 };
//   }
  
//   return { 
//     stories: data || [], 
//     count: count || 0
//   };
// }

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
  
  // Log search parameters for debugging
  console.log('Fetching stories with params:', {
    userId, filterLanguage, isFavorite, searchQuery, sortBy
  });

  const client = typeof window === 'undefined' ? getAdminClient() : supabase;
  
  let query = client
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
    query = query.ilike('title', `%${searchQuery.trim()}%`);
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

export function normalizeUserId(userId: string | number | undefined): string {
  if (!userId) {
    throw new Error('Missing user ID');
  }
  
  // Convert to string if it's a number
  const idString = String(userId);
  
  // Check if it's a valid UUID format
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idString);
  
  if (!isUUID) {
    console.warn(`User ID "${idString}" is not in UUID format`);
  }
  
  return idString;
}
export async function getRecentStories(userId: string, limit = 3) {
  console.log("[SERVER] Fetching stories for user:", userId);
  
  if (!userId) {
    console.error("[SERVER] No userId provided");
    return [];
  }

  try {
    // Use the admin client for server-side operations (bypasses RLS)
    // Only do this for server components - check if we're on the server
    const client = typeof window === 'undefined' ? getAdminClient() : supabase;
    
    // Direct query with logging
    const { data, error } = await client
      .from('stories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    console.log("[SERVER] Stories query result:", { 
      userId,
      success: !error, 
      count: data?.length,
      first: data?.[0]?.title
    });
    
    if (error) {
      console.error("[SERVER] Error fetching recent stories:", error.message, error.details);
      return [];
    }
    
    return data || [];
  } catch (e) {
    console.error("[SERVER] Exception in getRecentStories:", e);
    return [];
  }
}
// export async function getRecentStories(userId: string, limit = 3) {
//   console.log("[SERVER] Fetching stories for user:", userId);
//   console.log("[SERVER] Normalize user id :", normalizeUserId(userId));
  
//   const normalizedId = normalizeUserId(userId);

//   if (!userId) {
//     console.error("[SERVER] No userId provided");
//     return [];
//   }

//   try {
//     // Direct query with logging
//     const { data, error } = await supabase
//       .from('stories')
//       .select('*')
//       .eq('user_id', normalizedId)
//       .order('created_at', { ascending: false })
//       .limit(limit);
    
//     // Detailed logging for debugging
//     console.log("[SERVER] Stories query result:", { 
//       userId,
//       success: !error, 
//       count: data?.length,
//       data: data?.map(d => ({ id: d.id, title: d.title })) // Log just essential info
//     });
    
//     if (error) {
//       console.error("[SERVER] Error fetching recent stories:", error.message, error.details);
//       return [];
//     }
    
//     return data || [];
//   } catch (e) {
//     console.error("[SERVER] Exception in getRecentStories:", e);
//     return [];
//   }
// }
// export async function getRecentStories(userId: string, limit = 3) {
//   console.log("Fetching stories for user:", userId); // Log the userId to verify
  
//   if (!userId) {
//     console.error("No userId provided");
//     return [];
//   }

//   try {
//     // First, check if the user exists to confirm the ID is valid
//     const { data: userExists, error: userError } = await supabase
//       .from('profiles')
//       .select('id')
//       .eq('id', userId);
    
//     if (userError || !userExists) {
//       console.error("User validation error:", userError);
//       console.log("User exists check:", userExists);
//     }

//     // Now query for stories
//     const { data, error } = await supabase
//       .from('stories')
//       .select('*')
//       .eq('user_id', userId)
//       .order('created_at', { ascending: false })
//       .limit(limit);

//       console.log("Fetching stories for user 2:", userId);

//       console.log('Recent Story Result:', { data, error, count: data?.length });
    
//     if (error) {
//       console.error("Error fetching recent stories:", error);
//       return [];
//     }
    
//     if (!data || data.length === 0) {
//       console.log("No stories found for user:", userId);
//     }
    
//     return data || [];
//   } catch (e) {
//     console.error("Exception in getRecentStories:", e);
//     return [];
//   }
// }

export async function getStoryCount(userId: string) {

  if (!userId) {
    console.error("[SERVER] No userId provided");
    return [];
  }

  try {
    // Use the admin client for server-side operations (bypasses RLS)
    // Only do this for server components - check if we're on the server
    const client = typeof window === 'undefined' ? getAdminClient() : supabase;
    
    // Direct query with logging
    const { count, error } = await client
    .from('stories')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
    
    console.log("[SERVER] Stories query count result:", { 
      userId,
      success: !error, 
      count: count,
    });
    
    if (error) {
      console.error("[SERVER] Error fetching recent stories:", error.message, error.details);
      return [];
    }
    
    return count || 0;
  } catch (e) {
    console.error("[SERVER] Exception in getRecentStories:", e);
    return 0;
  }
}

// Add this to your existing story-service.ts
export async function getStoryById(storyId: string) {
  if (!storyId) {
    console.error("[SERVER] No storyId provided");
    return null;
  }

  console.log(`[SERVER] Attempting to fetch story with ID: ${storyId}`);

  try {
    // Use the admin client for server-side operations (bypasses RLS)
    // Only do this for server components
    let client;
    try {
      client = typeof window === 'undefined' ? getAdminClient() : supabase;
      console.log(`[SERVER] Using ${typeof window === 'undefined' ? 'admin' : 'regular'} Supabase client`);
    } catch (error) {
      console.error("[SERVER] Error getting Supabase client:", error);
      // Fallback to regular client if admin client fails
      client = supabase;
      console.log(`[SERVER] Falling back to regular Supabase client`);
    }
    
    // First check if the story exists
    const { data: storyExists, error: existsError } = await client
      .from('stories')
      .select('id')
      .eq('id', storyId)
      .maybeSingle();
      
    if (existsError) {
      console.error(`[SERVER] Error checking if story exists: ${existsError.message}`, existsError);
      return null;
    }
    
    if (!storyExists) {
      console.error(`[SERVER] Story with ID ${storyId} does not exist in the database`);
      return null;
    }
    
    console.log(`[SERVER] Story with ID ${storyId} found, fetching details...`);
    
    // Fetch the story with related data
    const { data, error } = await client
      .from('stories')
      .select(`
        *,
        images(id, storage_path, sequence_index),
        characters(id, name, description),
        background_music:background_music_id(
          id, 
          name, 
          storage_path, 
          category
        )
      `)
      .eq('id', storyId)
      .single();
    
    if (error) {
      console.error(`[SERVER] Error fetching story details: ${error.message}`, error);
      return null;
    }
    
    if (!data) {
      console.error(`[SERVER] No data returned for story ID: ${storyId}`);
      return null;
    }
    
    console.log(`[SERVER] Successfully fetched story with title: ${data.title}`);
    console.log(`[SERVER] Images count: ${data.images?.length || 0}`);
    console.log(`[SERVER] Characters count: ${data.characters?.length || 0}`);
    
    // Sort images by sequence_index if available
    if (data.images && Array.isArray(data.images)) {
      data.images.sort((a: any, b: any) => 
        (a.sequence_index || 0) - (b.sequence_index || 0)
      );
    } else {
      // Ensure images is always an array
      data.images = [];
    }
    
    // Ensure characters is always an array
    if (!data.characters || !Array.isArray(data.characters)) {
      data.characters = [];
    }
    
    return data;
  } catch (e) {
    console.error(`[SERVER] Exception in getStoryById for ID ${storyId}:`, e);
    return null;
  }
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