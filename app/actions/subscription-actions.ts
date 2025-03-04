'use server';

import { revalidatePath } from 'next/cache';
import { getAdminClient, supabase } from '@/lib/supabase';
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { 
  lemonSqueezySetup,
  createCheckout,
  getSubscription,
} from "@lemonsqueezy/lemonsqueezy.js";
import { SubscriptionTier, BillingPeriod } from '@/types/subscription';

// Define subscription plans with LemonSqueezy variant IDs
const SUBSCRIPTION_PLANS = {
  premium: {
    monthly: {
      name: 'Premium Monthly',
      price: 9.99,
      variantId: process.env.LEMON_SQUEEZY_PREMIUM_MONTHLY_VARIANT_ID,
    },
    annual: {
      name: 'Premium Annual',
      price: 99.99,
      variantId: process.env.LEMON_SQUEEZY_PREMIUM_ANNUAL_VARIANT_ID,
    }
  },
  family: {
    monthly: {
      name: 'Family Monthly',
      price: 14.99,
      variantId: process.env.LEMON_SQUEEZY_FAMILY_MONTHLY_VARIANT_ID,
    },
    annual: {
      name: 'Family Annual',
      price: 149.99,
      variantId: process.env.LEMON_SQUEEZY_FAMILY_ANNUAL_VARIANT_ID,
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
    const plan = planId in SUBSCRIPTION_PLANS ? SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS][billingPeriod] : undefined;
    if (!plan?.variantId) {
      throw new Error('Invalid subscription plan');
    }

    // Latest checkout creation format
    const checkoutData = {
      custom: {
        user_id: session.user.id,
        plan_id: planId,
        billing_period: billingPeriod
      },
      productOptions: {
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription?success=true`
      },
      checkoutOptions: {
        embed: false,
        media: false
      }
    };

    const { data: checkout, error } = await createCheckout(
      process.env.LEMON_SQUEEZY_STORE_ID!,
      plan.variantId,
      checkoutData
    );

    if (error) throw error;
    if (!checkout?.data.attributes.url) {
      throw new Error('Failed to create checkout URL');
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


/**
 * Cancel subscription by redirecting to customer portal
 */

/**
 * Update subscription by redirecting to customer portal
 */

// Fix type assertion in plan selection
// Remove unused placeholder function
// DELETE THIS:
function retrieveSubscription(arg0: { subscriptionId: any; }): { data: any; } | PromiseLike<{ data: any; }> {
  throw new Error('Function not implemented.');
}
