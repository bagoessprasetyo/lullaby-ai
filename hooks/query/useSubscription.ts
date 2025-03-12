// hooks/query/useSubscription.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { getSubscriptionFeatures } from '@/app/actions/subscriptions';
import { useSession } from 'next-auth/react';

// Keys for React Query cache
const subscriptionKeys = {
  all: ['subscription'] as const,
  features: () => [...subscriptionKeys.all, 'features'] as const,
};

export function useSubscriptionFeatures() {
  const { data: session, status } = useSession();
  
  return useQuery({
    queryKey: subscriptionKeys.features(),
    queryFn: () => getSubscriptionFeatures(),
    enabled: status === 'authenticated',
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Don't refetch on window focus for subscription data to avoid flickering
    refetchOnWindowFocus: false,
  });
}

// Hook to check if user can access a feature
export function useFeatureAccess(featureName?: string) {
  const { data, isLoading, error } = useSubscriptionFeatures();
  
  const canAccess = !isLoading && !error && data?.features && 
    featureName ? Object.prototype.hasOwnProperty.call(data.features, featureName) && !!data.features[featureName as keyof typeof data.features] : false;
  
  const tier = data?.subscription_tier || 'free';
  
  // Determine which tier is required for this feature
  const requiredTier = featureName ? getRequiredTierForFeature(featureName) : null;
  
  return {
    canAccess,
    tier,
    requiredTier,
    isLoading,
    error
  };
}

// Helper function to determine which tier is required for a feature
function getRequiredTierForFeature(feature: string): 'premium' | 'premium_plus' | null {
  // Map features to their required tier
  const featureToTierMap: Record<string, 'premium' | 'premium_plus'> = {
    long_stories: 'premium',
    background_music: 'premium',
    custom_voices: 'premium',
    unlimited_storage: 'premium',
    educational_themes: 'premium_plus',
    custom_characters: 'premium_plus',
    story_series: 'premium_plus',
    exclusive_themes: 'premium_plus'
  };
  
  return featureToTierMap[feature] || null;
}