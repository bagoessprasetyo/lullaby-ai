// types/subscription.ts
export type SubscriptionTier = 'free' | 'premium' | 'premium_plus';
export type SubscriptionStatus = 'active' | 'trialing' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'unpaid';
export type BillingPeriod = 'monthly' | 'annual';

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  description: string;
  price: number;
  period: BillingPeriod;
  features: string[];
}

export interface SubscriptionState {
  isProcessing: boolean;
  selectedPlan: SubscriptionTier;
  billingPeriod: BillingPeriod;
}

export interface SubscriptionFeatures {
  success: boolean;
  subscription_tier: string;
  features: {
    story_limit: number;
    long_stories: boolean;
    background_music: boolean;
    custom_voices: number;
    educational_themes: boolean;
    custom_characters: boolean;
    story_series: boolean;
    exclusive_themes: boolean;
    unlimited_storage: boolean;
    max_images: number;
  };
}