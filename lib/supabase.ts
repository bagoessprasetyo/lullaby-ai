// lib/supabase.ts
import { createClient as createClientBase } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Get Supabase URL and anon key from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Types for your database
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string | null;
          email: string | null;
          avatar_url: string | null;
          oauth_id: string | null;
          created_at: string;
          last_login_at: string | null;
          subscription_tier: string | null;
          story_credits: number | null;
          voice_credits: number | null;
          // Add other fields as needed
        };
        Insert: {
          id?: string;
          name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          oauth_id?: string | null;
          created_at?: string;
          last_login_at?: string | null;
          subscription_tier?: string | null;
          story_credits?: number | null;
          voice_credits?: number | null;
          // Add other fields as needed
        };
        Update: {
          id?: string;
          name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          oauth_id?: string | null;
          created_at?: string;
          last_login_at?: string | null;
          subscription_tier?: string | null;
          story_credits?: number | null;
          voice_credits?: number | null;
          // Add other fields as needed
        };
      };
      // Add other tables as needed
    };
    // Add other schema elements as needed
  };
};

/**
 * Create a Supabase client configured for use with cookies (server components)
 */
export function createClient(cookieStore: ReturnType<typeof cookies>) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClientBase<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: false,
        detectSessionInUrl: false,
      },
      // Use global fetch with cookie forwarding for server components
      global: {
        fetch: async (url, options) => {
          // Get auth cookie from the cookie store
          const supabaseAuthCookie = (await cookieStore).get('sb-auth-token');

          // Set the auth cookie in the request if it exists
          if (supabaseAuthCookie) {
            options = {
              ...options,
              headers: {
                ...(options?.headers || {}),
                Cookie: `sb-auth-token=${supabaseAuthCookie.value}`
              }
            };
          }

          return fetch(url, options);
        }
      }
    }
  );
}

/**
 * Create a client-side Supabase client
 */
export function createBrowserClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClientBase<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        detectSessionInUrl: true
      }
    }
  );
}

/**
 * Create a Supabase admin client with service role for server-side operations
 */
export function getAdminClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase admin environment variables');
  }
  
  return createClientBase<Database>(
    supabaseUrl,
    supabaseServiceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

// Export a browser client as the default supabase instance
export const supabase = createBrowserClient();