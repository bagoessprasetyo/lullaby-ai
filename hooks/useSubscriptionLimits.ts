"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSubscription } from '@/hooks/useSubscription';
import { getStoryCount } from '@/lib/services/story-service';

export function useSubscriptionLimits() {
  const { data: session } = useSession();
  const { features, isLoading: isLoadingSubscription } = useSubscription();
  const [storyCount, setStoryCount] = useState<number | null>(null);
  const [isLoadingCounts, setIsLoadingCounts] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const fetchCounts = async () => {
      if (!session?.user?.id) return;
      
      try {
        setIsLoadingCounts(true);
        const count = await getStoryCount(session.user.id);
        // Ensure count is a number before setting state
        setStoryCount(typeof count === 'number' ? count : 0);
        setError(null);
      } catch (err) {
        console.error("Error fetching story count:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoadingCounts(false);
      }
    };
    
    fetchCounts();
  }, [session?.user?.id]);
  
  // Get the current month's story limit
  const storyLimit = features?.features.story_limit || 5; // Default to free tier
  
  // Calculate how many stories the user can still create this month
  const remainingStories = storyLimit - (storyCount || 0);
  
  // Check if user has reached their monthly limit
  const hasReachedStoryLimit = remainingStories <= 0;
  
  // Helper function to check if user can access a premium feature
  const canAccessFeature = (feature: keyof NonNullable<typeof features>['features']) => {
    if (!features) return false;
    
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
    isLoading: isLoadingSubscription || isLoadingCounts,
    error,
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