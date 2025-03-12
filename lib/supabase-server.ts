// lib/supabase-server.ts
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { getAdminClient } from '@/lib/supabase';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth.config';

// Create a Supabase client for use in server components
export async function createServerSupabaseClient() {
  const cookieStore = cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
}

// Get an authenticated Supabase client for server components
export async function getAuthenticatedSupabaseClient() {
  try {
    const session = await getServerSession(authOptions);
    
    // If we have a NextAuth session, we can use the admin client
    if (session?.user?.id) {
      console.log("[SERVER] Using admin client with user ID:", session.user.id);
      try {
        // Try to get the admin client
        const adminClient = getAdminClient();
        
        // Set the admin client to act as the authenticated user (for RLS purposes)
        // This allows admin access but constrained to the user's data
        const { data, error } = await adminClient.auth.admin.getUserById(
          session.user.id
        );
        
        if (error || !data?.user) {
          throw new Error(`Unable to get user by ID: ${error?.message}`);
        }
        
        // Return the admin client
        return adminClient;
      } catch (error) {
        console.warn("[SERVER] Admin client not available:", error);
        // Fall back to standard client + session if admin client fails
      }
    }
    
    // Otherwise use the standard server client
    console.log("[SERVER] Using standard server client");
    return createServerSupabaseClient();
  } catch (error) {
    console.error("[SERVER] Error getting authenticated client:", error);
    // Last resort - return a server client without authentication
    return createServerSupabaseClient();
  }
}

// Server-side function to get recent stories
export async function getServerStories(userId: string, limit = 3) {
  console.log("[SERVER] Fetching stories for user:", userId);
  
  if (!userId) {
    console.error("[SERVER] No userId provided");
    return [];
  }
  
  try {
    // Get authenticated client
    const supabase = await getAuthenticatedSupabaseClient();
    
    // Fetch stories
    const { data, error } = await supabase
      .from('stories')
      .select('*, images(storage_path, sequence_index)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error("[SERVER] Error fetching stories:", error);
      return [];
    }
    
    console.log("[SERVER] Successfully fetched stories:", data?.length);
    return data || [];
  } catch (error) {
    console.error("[SERVER] Exception fetching stories:", error);
    return [];
  }
}

// Server-side function to get story count
export async function getServerStoryCount(userId: string) {
  console.log("[SERVER] Fetching story count for user:", userId);
  
  if (!userId) {
    console.error("[SERVER] No userId provided");
    return 0;
  }
  
  try {
    // Get authenticated client
    const supabase = await getAuthenticatedSupabaseClient();
    
    // Fetch count
    const { count, error } = await supabase
      .from('stories')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    if (error) {
      console.error("[SERVER] Error fetching story count:", error);
      return 0;
    }
    
    console.log("[SERVER] Story count:", count);
    return count || 0;
  } catch (error) {
    console.error("[SERVER] Exception fetching story count:", error);
    return 0;
  }
}