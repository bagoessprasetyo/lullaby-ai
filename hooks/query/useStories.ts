// hooks/query/useStories.ts - Enhanced version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from "next-auth/react";
import { 
  getStoryById,
  deleteStory,
  getFavoriteStories
} from '@/lib/services/story-service';
import { toggleFavoriteAction } from '@/app/actions/story-actions';

// Key factory for React Query cache
const storyKeys = {
  all: ['stories'] as const,
  recent: () => [...storyKeys.all, 'recent'] as const,
  count: () => [...storyKeys.all, 'count'] as const,
  lists: (filters?: any) => [...storyKeys.all, 'lists', filters] as const,
  detail: (storyId: string) => [...storyKeys.all, 'detail', storyId] as const,
  favorites: () => [...storyKeys.all, 'favorites'] as const,
};

// Hook to fetch recent stories with initial data support for SSR
export function useRecentStories(options: {
  limit?: number;
  initialData?: any[];
} = {}) {
  const { limit = 3, initialData } = options;
  
  return useQuery({
    queryKey: storyKeys.recent(),
    queryFn: async () => {
      console.log(`[Query] Fetching recent stories with limit ${limit} from API route`);
      try {
        const response = await fetch(`/api/stories?limit=${limit}`);
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        const data = await response.json();
        console.log(`[Query] Successfully fetched ${data.stories?.length || 0} recent stories from API`);
        return data.stories || [];
      } catch (error) {
        console.error(`[Query] Error fetching recent stories from API:`, error);
        throw error;
      }
    },
    initialData, // Use initial data if provided from SSR
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });
}

// Hook to fetch story count with initial data support
export function useStoryCount(options: {
  initialData?: number;
} = {}) {
  const { initialData } = options;
  
  return useQuery({
    queryKey: storyKeys.count(),
    queryFn: async () => {
      console.log(`[Query] Fetching story count from API route`);
      try {
        const response = await fetch(`/api/stories?limit=1`);
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        const data = await response.json();
        console.log(`[Query] Successfully fetched story count from API: ${data.count}`);
        return data.count || 0;
      } catch (error) {
        console.error(`[Query] Error fetching story count from API:`, error);
        throw error;
      }
    },
    initialData, // Use initial data if provided from SSR
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });
}

// Hook to fetch a single story by ID
export function useStory(storyId: string) {
  return useQuery({
    queryKey: storyKeys.detail(storyId),
    queryFn: () => getStoryById(storyId),
    enabled: !!storyId,
  });
}

// Enhanced mutation hook to toggle favorite status with optimistic updates
export function useToggleFavorite() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ storyId, isFavorite }: { storyId: string; isFavorite: boolean }) => {
      // Call server action directly instead of using client service
      try {
        console.log(`[TOGGLE] Calling toggleFavoriteAction for story ${storyId} to ${isFavorite}`);
        return await toggleFavoriteAction(storyId, isFavorite);
      } catch (error) {
        console.error('[TOGGLE] Error in toggleFavoriteAction:', error);
        throw error;
      }
    },
    
    // Add optimistic update to immediately update the UI
    onMutate: async ({ storyId, isFavorite }) => {
      console.log(`[QUERY] Optimistic update for story ${storyId}, setting is_favorite to ${isFavorite}`);
      
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: storyKeys.detail(storyId) });
      await queryClient.cancelQueries({ queryKey: storyKeys.recent() });
      await queryClient.cancelQueries({ queryKey: storyKeys.favorites() });
      
      // Snapshot the previous value
      const previousStory = queryClient.getQueryData(storyKeys.detail(storyId));
      const previousRecentStories = queryClient.getQueryData(storyKeys.recent());
      const previousFavorites = queryClient.getQueryData(storyKeys.favorites());
      
      // Optimistically update the story in cache - handle both property names
      queryClient.setQueryData(storyKeys.detail(storyId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          is_favorite: isFavorite,
          isFavorite: isFavorite
        };
      });
      
      // Update story in any list it appears in - handle both property names
      queryClient.setQueriesData({ queryKey: storyKeys.recent() }, (old: any) => {
        if (!old) return old;
        
        // If it's an array of stories
        if (Array.isArray(old)) {
          return old.map(story => 
            story.id === storyId ? { 
              ...story, 
              is_favorite: isFavorite, 
              isFavorite: isFavorite 
            } : story
          );
        }
        
        return old;
      });
      
      // Also update favorites list - handle both property names and add/remove as needed
      queryClient.setQueriesData({ queryKey: storyKeys.favorites() }, (old: any) => {
        if (!old) return old;
        
        if (Array.isArray(old)) {
          // If removing from favorites, filter it out
          if (!isFavorite) {
            console.log(`[QUERY] Removing story ${storyId} from favorites list (optimistic)`);
            return old.filter(story => story.id !== storyId);
          }
          
          // If adding to favorites and it's not already in the list
          if (!old.some(story => story.id === storyId)) {
            console.log(`[QUERY] Story ${storyId} not found in favorites, may need server refresh`);
            // We can't add it here as we don't have the full story data
            return old;
          }
          
          // If it's in the list, update it
          return old.map(story => 
            story.id === storyId ? { 
              ...story, 
              is_favorite: isFavorite, 
              isFavorite: isFavorite 
            } : story
          );
        }
        
        return old;
      });
      
      // Return previous values for rollback
      return { 
        previousStory, 
        previousRecentStories,
        previousFavorites
      };
    },
    
    // If error, roll back to the previous values
    onError: (err, { storyId }, context: any) => {
      console.error('[QUERY] Error toggling favorite:', err);
      
      // Restore story detail if available
      if (context?.previousStory) {
        queryClient.setQueryData(storyKeys.detail(storyId), context.previousStory);
      }
      
      // Restore recent stories list if available
      if (context?.previousRecentStories) {
        queryClient.setQueryData(storyKeys.recent(), context.previousRecentStories);
      }
      
      // Restore favorites list if available
      if (context?.previousFavorites) {
        queryClient.setQueryData(storyKeys.favorites(), context.previousFavorites);
      }
      
      // Also invalidate affected queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: storyKeys.all });
    },
    
    // On success
    onSuccess: (data, { storyId, isFavorite }) => {
      console.log(`[QUERY] Successfully toggled favorite for story ${storyId} to ${isFavorite}`, data);
      
      // Force refetch to ensure our lists are up to date
      queryClient.invalidateQueries({ queryKey: storyKeys.recent() });
      queryClient.invalidateQueries({ queryKey: storyKeys.favorites() });
      queryClient.invalidateQueries({ queryKey: storyKeys.detail(storyId) });
    },
    
    // Always refetch after error or success to ensure data consistency
    onSettled: () => {
      console.log('[QUERY] Favorite toggle settled, refreshing all story data');
      // Invalidate all story data to ensure everything is consistent
      queryClient.invalidateQueries({ queryKey: storyKeys.all });
    },
  });
}

// Enhanced mutation hook for deleting a story
export function useDeleteStory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (storyId: string) => deleteStory(storyId),
    
    // Optimistically remove from all lists
    onMutate: async (storyId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: storyKeys.all });
      
      // Snapshot for rollback
      const previousLists = queryClient.getQueriesData({ queryKey: storyKeys.all });
      
      // Update recent stories cache
      queryClient.setQueriesData({ queryKey: storyKeys.recent() }, (old: any) => {
        if (!old || !Array.isArray(old)) return old;
        return old.filter((story: any) => story.id !== storyId);
      });
      
      // Update favorites cache
      queryClient.setQueriesData({ queryKey: storyKeys.favorites() }, (old: any) => {
        if (!old || !Array.isArray(old)) return old;
        return old.filter((story: any) => story.id !== storyId);
      });
      
      // Update count
      queryClient.setQueriesData({ queryKey: storyKeys.count() }, (old: any) => {
        if (typeof old !== 'number') return old;
        return Math.max(0, old - 1);
      });
      
      return { previousLists };
    },
    
    // Roll back on error
    onError: (err, storyId, context) => {
      console.error('Error deleting story:', err);
      if (context?.previousLists) {
        for (const [queryKey, value] of context.previousLists) {
          queryClient.setQueryData(queryKey, value);
        }
      }
    },
    
    // On success
    onSuccess: (_, storyId) => {
      // Remove the specific story from the cache
      queryClient.removeQueries({
        queryKey: storyKeys.detail(storyId)
      });
    },
    
    // Always refetch list data to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: storyKeys.recent()
      });
      queryClient.invalidateQueries({
        queryKey: storyKeys.count()
      });
      queryClient.invalidateQueries({
        queryKey: storyKeys.favorites()
      });
    },
  });
}

// Hook to fetch favorite stories
export function useFavoriteStories(options: {
  limit?: number;
  initialData?: any[];
} = {}) {
  const { limit = 4, initialData } = options;
  
  // Get the session to access user ID
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: storyKeys.favorites(),
    queryFn: async () => {
      // Check if session exists and has user ID
      if (!session?.user?.id) {
        console.error('No user ID available in useFavoriteStories');
        return [];
      }
      
      console.log(`[Query] Fetching favorite stories for user: ${session.user.id} with limit: ${limit}`);
      try {
        const data = await getFavoriteStories(session.user.id, limit);
        console.log(`[Query] Successfully fetched ${data.length} favorite stories`);
        return data;
      } catch (error) {
        console.error(`[Query] Error fetching favorite stories:`, error);
        throw error;
      }
    },
    initialData, // Use initial data if provided from SSR
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!session?.user?.id, // Only run if we have a user ID
  });
}