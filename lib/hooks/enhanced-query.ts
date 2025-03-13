// lib/hooks/enhanced-query.ts
import { 
    useQuery, 
    useMutation, 
    useQueryClient, 
    QueryClient,
    UseMutationOptions,
    UseQueryOptions  
  } from '@tanstack/react-query';
  import { useSession } from 'next-auth/react';
  import { toast } from 'sonner'; // Assuming you're using a toast library like sonner
  
  // ----------------------
  // Enhanced Story Queries
  // ----------------------
  
  const storyKeys = {
    all: ['stories'] as const,
    lists: (filters?: any) => [...storyKeys.all, 'lists', filters] as const,
    list: (filters: Record<string, any>) => [...storyKeys.lists(filters), 'list'] as const,
    details: () => [...storyKeys.all, 'detail'] as const,
    detail: (id: string) => [...storyKeys.details(), id] as const,
    favorites: () => [...storyKeys.all, 'favorites'] as const,
  };
  
  type StoryData = {
    id: string;
    title: string;
    // Add other story fields
  };
  
  // Utility function to handle API errors consistently
  function handleApiError(error: unknown): string {
    console.error('API Error:', error);
    if (error instanceof Error) {
      return error.message;
    }
    return 'An unknown error occurred';
  }
  
  /**
   * Enhanced hook for fetching a story with better caching and prefetching
   */
  export function useEnhancedStory(storyId: string, 
    options: UseQueryOptions<StoryData, Error, StoryData, any> = {
        queryKey: undefined
    }) {
    
    const { data: session } = useSession();
    
    return useQuery({
      ...options,
      // queryKey is already specified in options parameter
      queryFn: async () => {
        const response = await fetch(`/api/stories/${storyId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch story: ${response.statusText}`);
        }
        return response.json();
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      enabled: !!session && !!storyId,
      ...options
    });
  }
  
  /**
   * Enhanced hook for toggling story favorite status with optimistic updates
   */
  export function useEnhancedToggleFavorite() {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: async ({ 
        storyId, 
        isFavorite 
      }: { 
        storyId: string; 
        isFavorite: boolean
      }) => {
        const response = await fetch(`/api/stories/${storyId}/favorite`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ isFavorite }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to update favorite status: ${response.statusText}`);
        }
        
        return response.json();
      },
      
      // Optimistic update
      onMutate: async ({ storyId, isFavorite }) => {
        // Cancel any outgoing refetches to avoid overwriting our optimistic update
        await queryClient.cancelQueries({ queryKey: storyKeys.detail(storyId) });
        
        // Snapshot the previous value
        const previousStory = queryClient.getQueryData(storyKeys.detail(storyId));
        
        // Optimistically update to the new value
        queryClient.setQueryData(storyKeys.detail(storyId), (old: any) => {
          return old ? { ...old, is_favorite: isFavorite } : old;
        });
        
        // Also update in any lists that contain this story
        queryClient.setQueriesData({ queryKey: storyKeys.lists() }, (old: any) => {
          if (!old) return old;
          
          // Handle if old is an array (like in getStories response)
          if (Array.isArray(old)) {
            return old.map(story => 
              story.id === storyId 
                ? { ...story, is_favorite: isFavorite } 
                : story
            );
          }
          
          // Handle if old is an object with a stories array (common pattern)
          if (old.stories && Array.isArray(old.stories)) {
            return {
              ...old,
              stories: old.stories.map((story: any) => 
                story.id === storyId 
                  ? { ...story, is_favorite: isFavorite } 
                  : story
              )
            };
          }
          
          return old;
        });
        
        // Return a context object with the snapshotted value
        return { previousStory };
      },
      
      // If the mutation fails, use the context returned from onMutate to roll back
      onError: (err, { storyId }, context) => {
        if (context?.previousStory) {
          queryClient.setQueryData(storyKeys.detail(storyId), context.previousStory);
        }
        toast.error(`Failed to update favorite status: ${handleApiError(err)}`);
      },
      
      // Always refetch after error or success:
      onSettled: (_, __, { storyId }) => {
        // Invalidate related queries to ensure data consistency
        queryClient.invalidateQueries({ queryKey: storyKeys.detail(storyId) });
        queryClient.invalidateQueries({ queryKey: storyKeys.favorites() });
      },
    });
  }
  
  /**
   * Enhanced hook for deleting a story with optimistic updates
   */
  export function useEnhancedDeleteStory() {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: async (storyId: string) => {
        const response = await fetch(`/api/stories/${storyId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error(`Failed to delete story: ${response.statusText}`);
        }
        
        return response.json();
      },
      
      onSuccess: (_, storyId) => {
        // Remove the story from the cache
        queryClient.removeQueries({ queryKey: storyKeys.detail(storyId) });
        
        // Update all story lists to remove this story
        queryClient.setQueriesData({ queryKey: storyKeys.lists() }, (old: any) => {
          if (!old) return old;
          
          // Handle if old is an array
          if (Array.isArray(old)) {
            return old.filter(story => story.id !== storyId);
          }
          
          // Handle if old is an object with a stories array
          if (old.stories && Array.isArray(old.stories)) {
            return {
              ...old,
              stories: old.stories.filter((story: any) => story.id !== storyId),
              // If there's a count field, decrement it
              ...(old.count !== undefined ? { count: old.count - 1 } : {})
            };
          }
          
          return old;
        });
        
        toast.success("Story deleted successfully");
      },
      
      onError: (err) => {
        toast.error(`Failed to delete story: ${handleApiError(err)}`);
      },
      
      onSettled: () => {
        // Invalidate all story lists to ensure data consistency
        queryClient.invalidateQueries({ queryKey: storyKeys.lists() });
      }
    });
  }
  
  // Function to prefetch a story (useful for preloading story details before navigation)
  export function prefetchStory(queryClient: QueryClient, storyId: string) {
    return queryClient.prefetchQuery({
      queryKey: storyKeys.detail(storyId),
      queryFn: async () => {
        const response = await fetch(`/api/stories/${storyId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch story: ${response.statusText}`);
        }
        return response.json();
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  }
  
  // ----------------------
  // Enhanced Subscription Queries
  // ----------------------
  
  const subscriptionKeys = {
    all: ['subscription'] as const,
    features: () => [...subscriptionKeys.all, 'features'] as const,
    limits: () => [...subscriptionKeys.all, 'limits'] as const,
  };
  
  /**
   * Enhanced hook for subscription features with better caching and error handling
   */
  export function useEnhancedSubscriptionFeatures() {
    const { data: session, status } = useSession();
    
    return useQuery({
      queryKey: subscriptionKeys.features(),
      queryFn: async () => {
        const response = await fetch('/api/user/subscription');
        if (!response.ok) {
          throw new Error(`Failed to fetch subscription features: ${response.statusText}`);
        }
        return response.json();
      },
      staleTime: 10 * 60 * 1000, // 10 minutes - subscription data doesn't change often
      gcTime: 60 * 60 * 1000, // 1 hour
      enabled: status === 'authenticated',
      // Retry 3 times with exponential backoff for subscription data
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Don't refetch on window focus for subscription data
      refetchOnWindowFocus: false,
    });
  }
  
  // ----------------------
  // Global Query Configuration
  // ----------------------
  
  /**
   * Configure the QueryClient with better defaults
   */
  export function getQueryClientConfig() {
    return {
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000, // 1 minute default
          gcTime: 5 * 60 * 1000, // 5 minutes default
          retry: 1,
          retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
          refetchOnWindowFocus: true,
        },
        mutations: {
          // Global onError handler for mutations
          onError: (err: unknown) => {
            console.error('Mutation error:', err);
            // Let individual mutations handle their own errors
          }
        }
      }
    };
  }