'use server';

import { revalidatePath } from 'next/cache';
import { getAdminClient, supabase } from '@/lib/supabase';
import { authOptions } from "@/auth.config";;
import { getServerSession } from "next-auth";
import { 
  lemonSqueezySetup,
  createCheckout,
  getSubscription,
} from "@lemonsqueezy/lemonsqueezy.js";
import { SubscriptionTier, BillingPeriod } from '@/types/subscription';

interface CheckoutOptions {
  custom_price?: number;
  enabled_variants?: number[];
  button_color?: string;
  discount_code?: string;
  expires_at?: string;
}

// Updated subscription plans with new tiers
const SUBSCRIPTION_PLANS = {
  premium: {
    monthly: {
      name: 'Premium Monthly',
      price: 7.99,
      variantId: process.env.LEMON_SQUEEZY_PREMIUM_MONTHLY_VARIANT_ID,
    },
    annual: {
      name: 'Premium Annual',
      price: 89.99,
      variantId: process.env.LEMON_SQUEEZY_PREMIUM_ANNUAL_VARIANT_ID,
    }
  },
  premium_plus: {
    monthly: {
      name: 'Premium+ Monthly',
      price: 14.99,
      variantId: process.env.LEMON_SQUEEZY_PREMIUM_PLUS_MONTHLY_VARIANT_ID,
    },
    annual: {
      name: 'Premium+ Annual',
      price: 149.99,
      variantId: process.env.LEMON_SQUEEZY_PREMIUM_PLUS_ANNUAL_VARIANT_ID,
    }
  }
};

// Initialize LemonSqueezy API configuration
lemonSqueezySetup({
  apiKey: process.env.LEMON_SQUEEZY_API_KEY!,
  onError: (error: any) => console.error("LemonSqueezy Error:", error),
});

/**
 * Create a LemonSqueezy Checkout URL for subscription
 */
export async function createCheckoutAction(
  planId: SubscriptionTier, 
  billingPeriod: BillingPeriod
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error('You must be logged in to perform this action');
  }
  
  try {
    // Validate plan ID - must be premium or premium_plus
    if (planId !== 'premium' && planId !== 'premium_plus') {
      throw new Error('Invalid subscription plan');
    }
    
    const plan = SUBSCRIPTION_PLANS[planId][billingPeriod];
    if (!plan?.variantId) {
      throw new Error('Invalid subscription plan');
    }

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    console.log('plan ', plan);
    // Latest checkout creation format
    const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json',
        'Authorization': `Bearer ${process.env.LEMON_SQUEEZY_API_KEY}`
      },
      body: JSON.stringify({
        data: {
          type: "checkouts",
          attributes: {
            custom_price: plan.price * 100, // Convert to cents
            product_options: {
              enabled_variants: [parseInt(plan.variantId, 10)]
            },
            checkout_options: {
              button_color: "#7047EB"
            },
            checkout_data: {
              custom: {
                user_id: session.user.id,
                plan_id: planId,
                billing_period: billingPeriod
              },
              email: session.user.email,
              name: session.user.name
            },
            expires_at: expiresAt,
            preview: process.env.NODE_ENV === 'development'
          },
          relationships: {
            store: {
              data: { type: "stores", id: process.env.LEMON_SQUEEZY_STORE_ID }
            },
            variant: {
              data: { type: "variants", id: plan.variantId }
            }
          }
        }
      })
    });

    const checkout = await response.json();
    console.log('checkout', checkout)
    if (!response.ok || !checkout?.data?.attributes?.url) {
      throw new Error(checkout?.error || 'Failed to create checkout URL');
    }

    return { 
      success: true, 
      url: checkout.data.attributes.url 
    };
  } catch (error) {
    console.error('Checkout error:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to create checkout'
    );
  }
}

/**
 * Get user's current subscription
 */
export async function getSubscriptionAction() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error('You must be logged in to perform this action');
  }
  
  try {
    // Get user profile with subscription info
    const client = typeof window === 'undefined' ? getAdminClient() : supabase;
    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('subscription_tier, subscription_status, subscription_expiry, lemonsqueezy_customer_id, lemonsqueezy_subscription_id')
      .eq('id', session.user.id)
      .single();
    
    if (profileError) {
      console.error('Error fetching profile:', profileError);
      throw new Error('Error fetching user profile');
    }
    
    // If user has a LemonSqueezy subscription ID, we could fetch the latest details
    if (profile.lemonsqueezy_subscription_id) {
      const { data: subscription, error } = await getSubscription(
        profile.lemonsqueezy_subscription_id
      );
      
      if (subscription?.data) {
        await client
          .from('profiles')
          .update({
            subscription_status: subscription.data.attributes.status,
            subscription_expiry: subscription.data.attributes.ends_at
          })
          .eq('id', session.user.id);
      }
    }
    
    return {
      tier: profile.subscription_tier || 'free',
      status: profile.subscription_status || 'inactive',
      expiryDate: profile.subscription_expiry ? new Date(profile.subscription_expiry) : null,
      isActive: ['active', 'trialing'].includes(profile.subscription_status || '')
    };
  } catch (error) {
    console.error('Error getting subscription:', error);
    throw new Error('Error getting subscription information');
  }
}

/**
 * Create customer portal URL for subscription management
 */
export async function updateSubscriptionAction() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error('You must be logged in to perform this action');
  }
  
  try {
    
    // Get user's LemonSqueezy customer ID and subscription ID
    const client = typeof window === 'undefined' ? getAdminClient() : supabase;
    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('lemonsqueezy_customer_id, lemonsqueezy_subscription_id')
      .eq('id', session.user.id)
      .single();
    
    if (profileError || !profile?.lemonsqueezy_subscription_id) {
      throw new Error('No active subscription found');
    }
    
    // Generate a customer portal URL using LemonSqueezy API
    // This is a placeholder - in a real implementation, you would call the LemonSqueezy API
    const portalUrl = `https://app.lemonsqueezy.com/my-orders/?subscription_id=${profile.lemonsqueezy_subscription_id}`;
    
    return {
      success: true,
      url: portalUrl
    };
  } catch (error) {
    console.error('Error creating customer portal URL:', error);
    throw new Error('Failed to create customer portal URL');
  }
}

/**
 * Cancel subscription by redirecting to customer portal
 */
export async function cancelSubscriptionAction() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error('You must be logged in to perform this action');
  }
  
  try {
    // Get user's LemonSqueezy customer ID and subscription ID
    const client = typeof window === 'undefined' ? getAdminClient() : supabase;
    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('lemonsqueezy_customer_id, lemonsqueezy_subscription_id')
      .eq('id', session.user.id)
      .single();
    
    if (profileError || !profile?.lemonsqueezy_subscription_id) {
      throw new Error('No active subscription found');
    }
    
    // Generate a customer portal URL with cancel intent using LemonSqueezy API
    // This is a placeholder - in a real implementation, you would call the LemonSqueezy API
    const cancelUrl = `https://app.lemonsqueezy.com/my-orders/?subscription_id=${profile.lemonsqueezy_subscription_id}&action=cancel`;
    
    return {
      success: true,
      url: cancelUrl
    };
  } catch (error) {
    console.error('Error creating cancellation URL:', error);
    throw new Error('Failed to create cancellation URL');
  }
}