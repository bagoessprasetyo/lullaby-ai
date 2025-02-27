export type SubscriptionTier = 'free' | 'premium' | 'family';
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled';
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