// auth.ts
import { cookies } from 'next/headers';
import { supabaseAdmin, createClient } from '@/lib/supabase';
import { AuthUser, UserProfile } from '@/types/user';
import { v5 as uuidv5 } from 'uuid';

// Define a UUID namespace (using a constant UUID)
const UUID_NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341';

/**
 * Gets the current user session on the server
 * - For server components and server actions
 */
export async function auth() {
  try {
    // Create a Supabase client using the stored cookies
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    // Get the session from Supabase
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      console.log('No active session found');
      return null;
    }
    
    // Find the user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (!profile) {
      return null;
    }
    
    return {
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name
      }
    };
  } catch (error) {
    console.error('Error in auth function:', error);
    return null;
  }
}

// Mock auth function for development if needed

export async function syncUserWithSupabase(user: AuthUser): Promise<UserProfile | null> {
  console.log('Syncing user to Supabase:', user.id);

  if (!user.id || !user.email) {
    console.error('Missing required user data for sync');
    return null;
  }

  try {
    // Convert the Google ID to a valid UUID using uuidv5
    const uuid = uuidv5(user.id, UUID_NAMESPACE);
    
    console.log('Converted ID to UUID:', uuid);

    // Use upsert to either insert or update the profile
    const { data, error } = await supabaseAdmin!
      .from('profiles')
      .upsert({
        id: uuid,
        oauth_id: user.id, // Store the original OAuth ID in a separate column
        email: user.email,
        name: user.name,
        avatar_url: user.image,
        last_login_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
      .select('*')
      .single();

    if (error) {
      console.error('Supabase profile sync error:', error);
      return null;
    }

    console.log('Profile synced successfully:', data?.id);
    return data as UserProfile;
  } catch (error) {
    console.error('Unexpected error during profile sync:', error);
    return null;
  }
}

// Utility function to find a user by their OAuth ID
export async function findUserByOAuthId(oauthId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabaseAdmin!
      .from('profiles')
      .select('*')
      .eq('oauth_id', oauthId)
      .single();

    if (error) {
      console.error('Error finding user by OAuth ID:', error);
      return null;
    }

    return data as UserProfile;
  } catch (error) {
    console.error('Unexpected error finding user:', error);
    return null;
  }
}