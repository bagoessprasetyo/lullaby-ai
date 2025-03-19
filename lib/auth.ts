// lib/auth.ts
import { getAdminClient, createBrowserClient } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

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

    console.log('FIND OAUTHHHH ',data)
    
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
  try {
    const supabase = getSafeSupabaseClient();
    if (!supabase) return null;

    // 1. Check if user exists by oauth_id
    const { data: existingProfile, error: lookupError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userData.id)
      .maybeSingle();

    if (lookupError) {
      console.error('[SUPABASE] Profile lookup error:', lookupError);
      return null;
    }

    const now = new Date().toISOString();
    
    // 2. Update existing profile or create new one
    let profile;
    if (existingProfile) {
      // Update existing profile
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          name: userData.name,
          email: userData.email,
          avatar_url: userData.image,
          last_login_at: now,
          updated_at: now
        })
        .eq('id', existingProfile.id)
        .select()
        .single();

      if (updateError) throw updateError;
      profile = updatedProfile;
    } else {
      // Create new profile
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: uuidv4(),
          oauth_id: userData.id,
          name: userData.name,
          email: userData.email,
          avatar_url: userData.image,
          subscription_tier: 'free',
          subscription_status: 'active',
          last_login_at: now,
          updated_at: now
        })
        .select()
        .single();

      if (insertError) throw insertError;
      profile = newProfile;
    }

    console.log(`[SUPABASE] ${existingProfile ? 'Updated' : 'Created'} profile for OAuth ID: ${userData.id}`);
    return profile;
    
  } catch (error) {
    console.error('[SUPABASE] Error syncing user:', error);
    throw error;
  }
}