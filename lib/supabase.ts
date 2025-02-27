import { createClient } from '@supabase/supabase-js';

// Check if environment variables are defined
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// For client-side and server-components with limited permissions
export const supabase = createClient(
  supabaseUrl || '', 
  supabaseAnonKey || ''
);

// For server operations requiring elevated privileges (server-side only)
export const supabaseAdmin = typeof window === 'undefined' && supabaseServiceKey
  ? createClient(supabaseUrl || '', supabaseServiceKey)
  : null;

// Helper function to get admin client on server side only
export function getAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error('Admin client can only be used on the server');
  }
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables for admin client');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Log initialization status but not the actual keys
console.log('Supabase clients initialized:', {
  hasUrl: !!supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  hasServiceKey: typeof window === 'undefined' && !!supabaseServiceKey
});