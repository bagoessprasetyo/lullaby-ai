// lib/supabase.ts
import { createClient as createClientBase } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Check if environment variables are defined
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// For client-side with limited permissions
export const supabase = createClientBase(
  supabaseUrl || '', 
  supabaseAnonKey || ''
);

// For server operations requiring elevated privileges (server-side only)
export const supabaseAdmin = typeof window === 'undefined' && supabaseServiceKey
  ? createClientBase(supabaseUrl || '', supabaseServiceKey)
  : null;

// Helper function to create a client with cookies for server components
export function createClient(cookieStore: ReturnType<typeof cookies>) {
  return createClientBase(
    supabaseUrl || '',
    supabaseAnonKey || '',
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

// Helper function to get admin client on server side only
export function getAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error('Admin client can only be used on the server');
  }
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables for admin client');
  }
  
  return createClientBase(supabaseUrl, supabaseServiceKey);
}

// Log initialization status but not the actual keys
console.log('Supabase clients initialized:', {
  hasUrl: !!supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  hasServiceKey: typeof window === 'undefined' && !!supabaseServiceKey
});