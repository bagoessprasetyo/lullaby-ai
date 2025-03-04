export type SubscriptionTier = 'free' | 'premium' | 'family';
export type SubscriptionStatus = 'active' | 'trialing' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'unpaid';
export type BillingPeriod = 'monthly' | 'annual';

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  description: string;
  price: number;
  period: BillingPeriod;
  features: string[];
  stripeProductId?: string; // Add this for Stripe integration
  stripePriceId?: string;   // Add this for Stripe integration
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
    long_stories: boolean;
    background_music: boolean;
    custom_voices: boolean;
    educational_themes: boolean;
    story_sharing: boolean;
    unlimited_storage: boolean;
    max_images: number;
  };
}

export interface StripeCustomer {
  id: string;
  email: string;
  name?: string;
  subscriptionId?: string;
  priceId?: string;
}