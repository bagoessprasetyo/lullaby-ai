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
  provider?: string;
  providerAccountId?: string;
}) {
  try {
    const supabase = getSafeSupabaseClient();
    if (!supabase) return null;
    
    // Store the original OAuth ID
    const oauthId = userData.id;
    
    // First, check if a profile already exists with this OAuth ID
    const { data: existingProfile, error: profileLookupError } = await supabase
      .from('profiles')
      .select('*')
      .eq('oauth_id', oauthId)
      .single();
    
    if (existingProfile) {
      console.log(`[SUPABASE] Found existing profile with OAuth ID ${oauthId}, using UUID: ${existingProfile.id}`);
      
      // Update the existing profile
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          name: userData.name,
          email: userData.email,
          avatar_url: userData.image,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingProfile.id)
        .select()
        .single();
      
      if (updateError) {
        console.error(`[SUPABASE] Error updating profile: ${updateError.message}`);
        return existingProfile;
      }
      
      return updatedProfile;
    }
    
    // No existing profile found, create a new one with a proper UUID
    const newUuid = uuidv4(); // Generate a proper UUID
    console.log(`[SUPABASE] Generated new UUID for OAuth ID ${oauthId}: ${newUuid}`);
    
    // Create new profile first
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: newUuid, // Use the generated UUID
        oauth_id: oauthId, // Store the original OAuth ID
        name: userData.name,
        email: userData.email,
        avatar_url: userData.image,
        subscription_tier: 'free',
        story_credits: 3,
        voice_credits: 3
      })
      .select()
      .single();
    
    if (insertError) {
      console.error(`[SUPABASE] Error creating profile: ${insertError.message}`);
      return null;
    }
    
    console.log(`[SUPABASE] Created new profile with ID: ${newProfile.id} for OAuth ID: ${oauthId}`);
    
    // For auth.users, use the proper auth API instead of direct table access
    if (userData.email) {
      try {
        // Use the admin client specifically for auth operations
        const adminClient = getAdminClient();
        
        // Check if user exists by email first - using the correct API parameters
        const { data: userList, error: userListError } = await adminClient.auth.admin.listUsers({
          page: 1,
          perPage: 1,
          // The filter needs to be applied differently
        });
        
        // Filter users by email manually since the API doesn't support direct filtering
        const existingUser = userList?.users?.find(user => user.email === userData.email);
        
        if (userListError) {
          console.error(`[SUPABASE] Error checking existing users: ${userListError.message}`);
        } else if (!existingUser) {
          // No existing user with this email, create one
          const { data: newUser, error: createUserError } = await adminClient.auth.admin.createUser({
            email: userData.email,
            email_confirm: true,
            user_metadata: {
              full_name: userData.name,
              avatar_url: userData.image,
              oauth_id: oauthId,
              provider: userData.provider
            }
          });
          
          if (createUserError) {
            console.error(`[SUPABASE] Error creating auth user: ${createUserError.message}`);
          } else {
            console.log(`[SUPABASE] Successfully created auth user with email: ${userData.email}`);
          }
        } else {
          console.log(`[SUPABASE] User with email ${userData.email} already exists in auth system`);
        }
      } catch (authError) {
        console.error(`[SUPABASE] Exception in auth operations: ${authError}`);
      }
    }
    
    return newProfile;
  } catch (error) {
    console.error('[SUPABASE] Unexpected error in syncUserWithSupabase:', error);
    return null;
  }
}