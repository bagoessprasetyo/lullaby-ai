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

    console.log(`[SUPABASE] Syncing user with OAuth ID: ${userData.id}`);

    // 1. First, check if user exists by oauth_id
    const { data: existingByOAuthId, error: oauthLookupError } = await supabase
      .from('profiles')
      .select('*')
      .eq('oauth_id', userData.id)
      .maybeSingle();

    if (oauthLookupError && oauthLookupError.code !== 'PGRST116') {
      console.error('[SUPABASE] OAuth ID lookup error:', oauthLookupError);
    }

    // 2. If not found by oauth_id, check by email as a fallback (for handling migrations or duplicates)
    let existingProfile = existingByOAuthId;
    if (!existingProfile && userData.email) {
      const { data: existingByEmail, error: emailLookupError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', userData.email)
        .maybeSingle();

      if (emailLookupError && emailLookupError.code !== 'PGRST116') {
        console.error('[SUPABASE] Email lookup error:', emailLookupError);
      }
      
      existingProfile = existingByEmail;
    }

    const now = new Date().toISOString();
    
    // 3. Update existing profile or create new one
    let profile;
    if (existingProfile) {
      console.log(`[SUPABASE] Found existing profile with ID: ${existingProfile.id}`);
      
      // Update existing profile
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          name: userData.name,
          email: userData.email,
          avatar_url: userData.image,
          oauth_id: userData.id, // Ensure oauth_id is always set
          last_login_at: now,
          updated_at: now
        })
        .eq('id', existingProfile.id)
        .select()
        .single();

      if (updateError) {
        console.error('[SUPABASE] Profile update error:', updateError);
        throw updateError;
      }
      
      profile = updatedProfile;
      console.log(`[SUPABASE] Updated profile for user: ${profile.id}`);
    } else {
      // Create new profile with a new UUID
      const newId = uuidv4();
      console.log(`[SUPABASE] Creating new profile with ID: ${newId}, OAuth ID: ${userData.id}`);
      
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: newId,
          oauth_id: userData.id,
          name: userData.name,
          email: userData.email,
          avatar_url: userData.image,
          subscription_tier: 'free',
          subscription_status: 'active',
          last_login_at: now,
          created_at: now,
          updated_at: now
        })
        .select()
        .single();

      if (insertError) {
        console.error('[SUPABASE] Profile creation error:', insertError);
        throw insertError;
      }
      
      profile = newProfile;
      console.log(`[SUPABASE] Created new profile with ID: ${profile.id}`);
    }

    return profile;
    
  } catch (error) {
    console.error('[SUPABASE] Error syncing user:', error);
    throw error;
  }
}