// hooks/query/useStories.ts - Enhanced version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getStoryById,
  toggleStoryFavorite,
  deleteStory,
  getFavoriteStories
} from '@/lib/services/story-service';

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
    mutationFn: ({ storyId, isFavorite }: { storyId: string; isFavorite: boolean }) => 
      toggleStoryFavorite(storyId, isFavorite),
    
    // Add optimistic update to immediately update the UI
    onMutate: async ({ storyId, isFavorite }) => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: storyKeys.detail(storyId) });
      
      // Snapshot the previous value
      const previousStory = queryClient.getQueryData(storyKeys.detail(storyId));
      
      // Optimistically update the story in cache
      queryClient.setQueryData(storyKeys.detail(storyId), (old: any) => ({
        ...old,
        is_favorite: isFavorite
      }));
      
      // Also update the story in any list it appears in
      queryClient.setQueriesData({ queryKey: storyKeys.recent() }, (old: any) => {
        if (!old) return old;
        
        // If it's an array of stories
        if (Array.isArray(old)) {
          return old.map(story => 
            story.id === storyId ? { ...story, is_favorite: isFavorite } : story
          );
        }
        
        return old;
      });
      
      // Also update favorites list
      queryClient.setQueriesData({ queryKey: storyKeys.favorites() }, (old: any) => {
        if (!old) return old;
        
        if (Array.isArray(old)) {
          // If removing from favorites, filter it out
          if (!isFavorite) {
            return old.filter(story => story.id !== storyId);
          }
          // If adding to favorites, it might not be in the list yet
          return old.map(story => 
            story.id === storyId ? { ...story, is_favorite: isFavorite } : story
          );
        }
        
        return old;
      });
      
      // Return the snapshot for rollback if needed
      return { previousStory };
    },
    
    // If error, roll back to the previous value
    onError: (err, { storyId }, context) => {
      console.error('Error toggling favorite:', err);
      if (context?.previousStory) {
        queryClient.setQueryData(storyKeys.detail(storyId), context.previousStory);
      }
      // Also roll back any list updates
      queryClient.invalidateQueries({ queryKey: storyKeys.all });
    },
    
    // Always refetch after error or success to ensure data consistency
    onSettled: (data, error, { storyId }) => {
      queryClient.invalidateQueries({ queryKey: storyKeys.detail(storyId) });
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
export function useFavoriteStories(limit = '3') {
  return useQuery({
    queryKey: storyKeys.favorites(),
    queryFn: () => getFavoriteStories(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}