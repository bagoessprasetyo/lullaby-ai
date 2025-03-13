// hooks/usePrefetchData.ts
'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { getStoryById } from '@/lib/services/story-service';
import { getSubscriptionFeatures } from '@/app/actions/subscriptions';

// Key factories from existing queries
const storyKeys = {
  all: ['stories'] as const,
  recent: () => [...storyKeys.all, 'recent'] as const,
  detail: (storyId: string) => [...storyKeys.all, 'detail', storyId] as const,
};

const subscriptionKeys = {
  all: ['subscription'] as const,
  features: () => [...subscriptionKeys.all, 'features'] as const,
};

/**
 * Prefetch a story's data when we anticipate the user might navigate to it
 * Perfect for hover intentions or when a story appears in a list
 */
export function usePrefetchStory(storyId: string | null) {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (storyId) {
      queryClient.prefetchQuery({
        queryKey: storyKeys.detail(storyId),
        queryFn: () => getStoryById(storyId),
        staleTime: 5 * 60 * 1000 // 5 minutes
      });
    }
  }, [storyId, queryClient]);
}

/**
 * Prefetch essential application data on app initialization
 * This improves the perceived performance of the app
 */
export function usePrefetchCriticalData() {
  const queryClient = useQueryClient();
  const { status } = useSession();
  
  useEffect(() => {
    if (status === 'authenticated') {
      // Prefetch subscription data
      queryClient.prefetchQuery({
        queryKey: subscriptionKeys.features(),
        queryFn: () => getSubscriptionFeatures(),
        staleTime: 15 * 60 * 1000 // 15 minutes
      });
      
      // Prefetch recent stories
      queryClient.prefetchQuery({
        queryKey: storyKeys.recent(),
        queryFn: async () => {
          const response = await fetch(`/api/stories?limit=3`);
          if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
          }
          const data = await response.json();
          return data.stories || [];
        },
        staleTime: 1 * 60 * 1000 // 1 minute
      });
    }
  }, [status, queryClient]);
}

/**
 * Hook to use in layoutss for preloading likely-needed data
 */
export function useGlobalPrefetching() {
  // Use the prefetch hook
  usePrefetchCriticalData();
  
  // This hook doesn't return anything
  return null;
}