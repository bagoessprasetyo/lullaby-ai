// app/api/stories/favorite/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { getAdminClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const { storyId, isFavorite } = await request.json();
    
    if (!storyId) {
      return NextResponse.json({ error: 'Story ID is required' }, { status: 400 });
    }
    
    console.log(`[API] Toggling favorite for story ${storyId} to ${isFavorite} for user ${session.user.id}`);
    
    // Get admin client to bypass RLS
    const client = getAdminClient();
    
    // Check if user owns the story
    const { data: story, error: storyError } = await client
      .from('stories')
      .select('user_id, title')
      .eq('id', storyId)
      .single();
    
    if (storyError || !story) {
      console.error('[API] Story not found:', storyError);
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }
    
    if (story.user_id !== session.user.id) {
      console.error(`[API] Permission error: Story user_id ${story.user_id} doesn't match session user_id ${session.user.id}`);
      return NextResponse.json({ error: 'You do not have permission to modify this story' }, { status: 403 });
    }
    
    // Update favorite status
    const { data, error } = await client
      .from('stories')
      .update({ is_favorite: isFavorite })
      .eq('id', storyId)
      .select()
      .single();
    
    if (error) {
      console.error('[API] Error updating favorite status:', error);
      return NextResponse.json({ error: 'Failed to update favorite status' }, { status: 500 });
    }
    
    // Revalidate affected paths
    revalidatePath('/dashboard/library');
    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/stories/${storyId}`);
    
    console.log(`[API] Successfully toggled favorite for story "${story.title}" (${storyId}) to ${isFavorite}`);
    
    return NextResponse.json({
      success: true,
      storyId,
      isFavorite,
      story: data
    });
  } catch (error) {
    console.error('[API] Unexpected error in favorite API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}