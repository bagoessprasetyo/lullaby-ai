// lib/auth.ts
import { getAdminClient, createBrowserClient } from '@/lib/supabase';

// Safely create Supabase client with environment validation
export function getSafeSupabaseClient() {
  try {
    // Use admin client for server operations, browser client for client-side
    if (typeof window === 'undefined') {
      return getAdminClient();
    } else {
      return createBrowserClient();
    }
  } catch (error) {
    console.error("Error creating Supabase client:", error);
    return null;
  }
}

// Example for findUserByOAuthId function with safe Supabase client
export async function findUserByOAuthId(oauthId: string) {
  const supabase = getSafeSupabaseClient();
  if (!supabase) {
    console.warn("Supabase client not available, skipping user lookup");
    return null;
  }
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('oauth_id', oauthId)
    .single();
    
  if (error) {
    if (error.code !== 'PGRST116') { // 'PGRST116' is Postgres' "no rows returned" error
      console.error("Error finding user by OAuth ID:", error);
    }
    return null;
  }
  
  return data;
}

// Example for syncUserWithSupabase function with safe Supabase client
export async function syncUserWithSupabase(userData: {
  id: string;
  name: string;
  email: string;
  image: string;
}) {
  const supabase = getSafeSupabaseClient();
  if (!supabase) {
    console.warn("Supabase client not available, skipping user sync");
    return null;
  }
  
  // Check if user exists
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('oauth_id', userData.id)
    .maybeSingle();
    
  if (existingUser) {
    // Update existing user
    const { data, error } = await supabase
      .from('profiles')
      .update({
        name: userData.name,
        email: userData.email,
        avatar_url: userData.image,
        last_login_at: new Date().toISOString()
      })
      .eq('oauth_id', userData.id)
      .select()
      .single();
      
    if (error) {
      console.error("Error updating user:", error);
      return null;
    }
    
    return data;
  } else {
    // Create new user
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        oauth_id: userData.id,
        name: userData.name,
        email: userData.email,
        avatar_url: userData.image,
        created_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
        subscription_tier: 'free',
        story_credits: 3, // Default starter credits
        voice_credits: 1  // Default starter credits
      })
      .select()
      .single();
      
    if (error) {
      console.error("Error creating user:", error);
      return null;
    }
    
    return data;
  }
}