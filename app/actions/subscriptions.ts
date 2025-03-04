// app/actions/subscription.ts
"use server";

import { getAdminClient } from '@/lib/supabase';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

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

export async function getSubscriptionFeatures(): Promise<SubscriptionFeatures | null> {
  try {
    // Get session from server side
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log("No user session found");
      return null;
    }
    
    // Use the admin client since we're on the server
    const client = getAdminClient();
    
    // Query user profile from Supabase
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    console.log('User ID for profile query:', session.user.id);
    console.log('Query result:', data);
    
    if (error) {
      console.error("Database query error:", error);
      throw error;
    }
    
    if (!data) {
      console.log("No profile found for user ID:", session.user.id);
      return null;
    }
    
    // Get subscription tier from the database
    const subscription_tier = data.subscription_tier || 'free';
    
    // Define features based on subscription tier
    const features: SubscriptionFeatures = {
      success: true,
      subscription_tier,
      features: {
        long_stories: ['premium', 'family'].includes(subscription_tier),
        background_music: ['premium', 'family'].includes(subscription_tier),
        custom_voices: ['premium', 'family'].includes(subscription_tier),
        educational_themes: ['premium', 'family'].includes(subscription_tier),
        story_sharing: subscription_tier === 'family',
        unlimited_storage: ['premium', 'family'].includes(subscription_tier),
        max_images: ['premium', 'family'].includes(subscription_tier) ? 5 : 3
      }
    };
    console.log('Query FEATURES:', features);
    return features;
    
  } catch (err) {
    console.error("Error in getSubscriptionFeatures:", err);
    throw err;
  }
}