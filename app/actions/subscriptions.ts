// app/actions/subscriptions.ts
"use server";

import { getAdminClient } from '@/lib/supabase';
import { getServerSession } from 'next-auth/next';
import { authOptions } from "@/auth.config";;
import { SubscriptionFeatures } from '@/types/subscription';

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
        // Implement the new limits based on tier
        story_limit: subscription_tier === 'free' ? 5 : 
                    subscription_tier === 'premium' ? 30 : 
                    subscription_tier === 'premium_plus' ? 100 : 5,
        
        long_stories: subscription_tier !== 'free',
        
        background_music: subscription_tier !== 'free',
        
        custom_voices: subscription_tier === 'free' ? 0 : 
                       subscription_tier === 'premium' ? 2 : 
                       subscription_tier === 'premium_plus' ? 5 : 0,
        
        educational_themes: subscription_tier === 'premium_plus',
        
        custom_characters: subscription_tier === 'premium_plus',
        
        story_series: subscription_tier === 'premium_plus',
        
        exclusive_themes: subscription_tier === 'premium_plus',
        
        unlimited_storage: subscription_tier !== 'free',
        
        max_images: subscription_tier === 'free' ? 3 : 5
      }
    };
    
    return features;
    
  } catch (err) {
    console.error("Error in getSubscriptionFeatures:", err);
    throw err;
  }
}