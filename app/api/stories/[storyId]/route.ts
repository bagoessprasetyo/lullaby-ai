// app/api/stories/[storyId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth.config";

export async function GET(
  req: NextRequest,
  { params }: { params: { storyId: string } }
) {
  try {
    // Get the storyId from the URL
    const { storyId } = params;

    if (!storyId) {
      return NextResponse.json({ error: 'Story ID is required' }, { status: 400 });
    }

    console.log(`[API] GET /api/stories/${storyId} - Retrieving story details`);

    // Get the authenticated user
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session?.user?.id) {
      console.error("[API] Unauthorized request to fetch story");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log(`[API] Authenticated user: ${userId}`);

    // Always use the admin client for server API routes
    const adminClient = getAdminClient();

    // Fetch the story
    const { data: story, error } = await adminClient
      .from('stories')
      .select('*')
      .eq('id', storyId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error("[API] Error fetching story:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!story) {
      console.error(`[API] Story not found: ${storyId} for user ${userId}`);
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    console.log(`[API] Story retrieved: ${story.id}`);

    // Determine status based on audio_url
    const status = story.audio_url ? 'completed' : 'pending';

    // Transform the data to match the expected format
    const response = {
      success: true,
      storyId: story.id,
      title: story.title,
      textContent: story.text_content,
      audioUrl: story.audio_url,
      duration: story.duration,
      status: status // Derive status from audio_url presence
    };

    // Return the story data with proper content type
    return new NextResponse(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error("[API] Exception in story retrieval API route:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}