// hooks/query/useStories.ts
'use client';

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

// Hook to fetch recent stories using the API route
export function useRecentStories(limit = 3) {
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
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to fetch story count using the API route
export function useStoryCount() {
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
    staleTime: 5 * 60 * 1000, // 5 minutes
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

// Hook to fetch favorite stories
export function useFavoriteStories(limit = '3') {
  return useQuery({
    queryKey: storyKeys.favorites(),
    queryFn: () => getFavoriteStories(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Mutation hook to toggle favorite status
export function useToggleFavorite() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ storyId, isFavorite }: { storyId: string; isFavorite: boolean }) => 
      toggleStoryFavorite(storyId, isFavorite),
    onSuccess: (data, { storyId }) => {
      // First, invalidate the specific story detail
      queryClient.invalidateQueries({
        queryKey: storyKeys.detail(storyId)
      });
      
      // Then invalidate all story queries
      queryClient.invalidateQueries({
        queryKey: storyKeys.all
      });
    },
  });
}

// Mutation hook to delete a story
export function useDeleteStory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (storyId: string) => deleteStory(storyId),
    onSuccess: (_, storyId) => {
      // Invalidate all story queries
      queryClient.invalidateQueries({
        queryKey: storyKeys.all
      });
      
      // Remove the specific story from the cache
      queryClient.removeQueries({
        queryKey: storyKeys.detail(storyId)
      });
    },
  });
}