import { supabase } from '@/lib/supabase';

export async function debugSupabase(userId: string) {
    console.log('[DEBUG] Checking Supabase connection...');
    
    const connectionStatus = await checkSupabaseConnection();
    console.log('[DEBUG] Supabase connection:', connectionStatus);
    
    // Try a direct query for this specific user
    try {
      const { data, error, count } = await supabase
        .from('stories')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .limit(5);
      
      console.log('[DEBUG] Direct query result:', {
        success: !error,
        count,
        error: error?.message,
        data: data?.map(d => ({ id: d.id, title: d.title }))
      });
      
      return { data, count, error: error?.message };
    } catch (e) {
      console.error('[DEBUG] Query exception:', e);
      return { error: e instanceof Error ? e.message : 'Unknown error' };
    }
}

export async function checkSupabaseConnection() {
  try {
    // Test the connection with a simple query
    const { data, error } = await supabase.from('stories').select('count()', { count: 'exact', head: true });
    
    // Return connection details
    return {
      connected: !error,
      error: error ? error.message : null,
      authStatus: await supabase.auth.getSession() ? 'session-exists' : 'no-session',
      url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...' // Don't log full URL
    };
  } catch (e) {
    return {
      connected: false,
      error: e instanceof Error ? e.message : 'Unknown error',
      authStatus: 'error-checking'
    };
  }
}