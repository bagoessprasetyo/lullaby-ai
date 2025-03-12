"use client";

import { useSession } from 'next-auth/react';
import { useSubscriptionFeatures } from '@/hooks/query/useSubscription';
import { useStoryCount } from '@/hooks/query/useStories';

export function useSubscriptionLimits() {
  const { data: session } = useSession();
  
  // Use React Query hooks
  const { 
    data: features,
    isLoading: isLoadingSubscription,
    error: subscriptionError
  } = useSubscriptionFeatures();
  
  const {
    data: storyCount = 0,
    isLoading: isLoadingCount,
    error: countError
  } = useStoryCount();
  
  // Get the current month's story limit
  const storyLimit = features?.features?.story_limit || 5; // Default to free tier
  
  // Calculate how many stories the user can still create this month
const remainingStories = Number(storyLimit) - Number(storyCount);
  
  // Check if user has reached their monthly limit
  const hasReachedStoryLimit = remainingStories <= 0;
  
  // Helper function to check if user can access a feature
  const canAccessFeature = (feature: keyof NonNullable<typeof features>['features']) => {
    if (!features?.features) return false;
    
    const featureValue = features.features[feature];
    
    if (typeof featureValue === 'boolean') {
      return featureValue;
    } else if (typeof featureValue === 'number') {
      return featureValue > 0;
    }
    
    return false;
  };
  
  // Helper function to check which tier is required for a feature
  const requiredTierForFeature = (feature: keyof NonNullable<typeof features>['features']): 'premium' | 'premium_plus' => {
    // Map features to their required tier
    const featureToTierMap: Record<string, 'premium' | 'premium_plus'> = {
      long_stories: 'premium',
      background_music: 'premium',
      custom_voices: 'premium', // Base level in premium
      unlimited_storage: 'premium',
      educational_themes: 'premium_plus',
      custom_characters: 'premium_plus',
      story_series: 'premium_plus',
      exclusive_themes: 'premium_plus'
    };
    
    return featureToTierMap[feature] || 'premium';
  };
  
  return {
    isLoading: isLoadingSubscription || isLoadingCount,
    error: subscriptionError || countError,
    storyLimit,
    storyCount,
    remainingStories,
    hasReachedStoryLimit,
    canAccessFeature,
    requiredTierForFeature,
    features: features?.features,
    tier: features?.subscription_tier
  };
}