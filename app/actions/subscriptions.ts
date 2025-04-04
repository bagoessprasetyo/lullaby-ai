// app/actions/subscriptions.ts
// Updated getSubscriptionFeatures to limit free tier to one story

"use server";

import { getAdminClient } from '@/lib/supabase';
import { getServerSession } from 'next-auth/next';
import { authOptions } from "@/auth.config";
import { SubscriptionFeatures } from '@/types/subscription';
import { Redis } from '@upstash/redis';

export async function getSubscriptionFeatures(): Promise<SubscriptionFeatures | null> {
  try {
    // Get session from server side
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log("No user session found");
      return null;
    }
    
    // Check Redis cache first
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL?.startsWith('https://')
        ? process.env.UPSTASH_REDIS_REST_URL
        : `https://${process.env.UPSTASH_REDIS_REST_URL}`,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    
    const cacheKey = `subscription:features:${session.user.id}`;
    const cachedData = await redis.get(cacheKey);
    
    if (cachedData) {
      return JSON.parse(cachedData as string);
    }
    
    // Use the admin client since we're on the server
    const client = getAdminClient();
    
    // Query user profile from Supabase
    const { data: profileData, error: profileError } = await client
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (profileError) {
      console.error("Database query error:", profileError);
      throw profileError;
    }
    
    if (!profileData) {
      console.log("No profile found for user ID:", session.user.id);
      return null;
    }
    
    // Get subscription tier from the database
    const subscription_tier = profileData.subscription_tier || 'free';
    
    // Check if this is the user's first story (for free tier)
    const { data: storyCount, error: storyError } = await client
      .from('stories')
      .select('count', { count: 'exact', head: true })
      .eq('user_id', session.user.id);
      
    if (storyError) {
      console.error("Error counting user stories:", storyError);
    }
    
    // Free tier gets one free story, after that they need to upgrade
    const hasUsedFreeStory = (Array.isArray(storyCount) ? storyCount[0]?.count || 0 : storyCount || 0) >= 1;
    const storyLimit = subscription_tier === 'free' 
      ? (hasUsedFreeStory ? 0 : 1) // If they've already created a story, limit is 0
      : subscription_tier === 'premium' ? 10
      : subscription_tier === 'premium_plus' ? 25 
      : 1; // Fallback to 1
    
    // Define features based on subscription tier
    const features: SubscriptionFeatures = {
      success: true,
      subscription_tier,
      features: {
        // Updated limits based on tier
        story_limit: storyLimit,
        
        long_stories: subscription_tier !== 'free',
        
        background_music: subscription_tier !== 'free',
        
        custom_voices: subscription_tier === 'free' ? 0 : 
                       subscription_tier === 'premium' ? 1 : 
                       subscription_tier === 'premium_plus' ? 3 : 0,
        
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