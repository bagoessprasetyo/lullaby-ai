// app/api/debug/supabase/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  // Optional: Add some basic auth to protect this endpoint
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.DEBUG_SECRET_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Create Supabase client with the production credentials
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        error: 'Missing Supabase credentials',
        variables: {
          urlDefined: !!supabaseUrl,
          keyDefined: !!supabaseKey,
          serviceKeyDefined: !!serviceRoleKey
        }
      }, { status: 500 });
    }

    // Create a client with the anon key
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Attempt a simple query
    const { data: healthCheck, error: healthError } = await supabase
      .from('profiles')
      .select('count(*)')
      .limit(1);

    // Try an auth check - Just to verify auth system is working
    const { data: authData, error: authError } = await supabase.auth.getSession();

    return NextResponse.json({
      connection: 'success',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      supabaseUrl: supabaseUrl.substring(0, 20) + '...',
      healthCheck: {
        success: !healthError,
        data: healthCheck,
        error: healthError ? healthError.message : null
      },
      authSystem: {
        success: !authError,
        error: authError ? authError.message : null
      }
    });
  } catch (error) {
    return NextResponse.json({
      connection: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : null
    }, { status: 500 });
  }
}