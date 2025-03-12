// app/api/stories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth.config";

export async function GET(req: NextRequest) {
  // Get the query parameters
  const searchParams = req.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '3');
  
  // Get the authenticated user
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userId = session.user.id;
  console.log("[API] Fetching stories for user:", userId, "with limit:", limit);
  
  try {
    // Always use the admin client for server API routes
    const adminClient = getAdminClient();
    
    // Fetch the stories
    const { data, error } = await adminClient
      .from('stories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error("[API] Error fetching stories:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Get story count
    const { count, error: countError } = await adminClient
      .from('stories')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    if (countError) {
      console.error("[API] Error fetching story count:", countError);
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }
    
    console.log("[API] Successfully fetched stories:", {
      count: data?.length || 0,
      totalCount: count || 0
    });
    
    // Return the data
    return NextResponse.json({ 
      stories: data || [], 
      count: count || 0 
    });
  } catch (error) {
    console.error("[API] Exception in API route:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}