import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth.config";
import { getAdminClient } from '@/lib/supabase';
import { v4 as uuidv4 } from "uuid";

export const maxDuration = 60; // Set max duration to 60 seconds for this function

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Get request body
    const body = await req.json();
    const { 
      images, 
      characters, 
      theme, 
      duration, 
      language, 
      backgroundMusic, 
      voice 
    } = body;

    // Validate required fields
    if (!images || !images.length) {
      return NextResponse.json(
        { success: false, error: 'At least one image is required' }, 
        { status: 400 }
      );
    }

    // Generate a unique ID for the story
    const storyId = uuidv4();
    
    // Create a new story record in the database with pending status
    const adminClient = getAdminClient();
    const { error: insertError } = await adminClient
      .from('stories')
      .insert({
        id: storyId,
        user_id: session.user.id,
        title: 'Generating...',
        content: '',
        status: 'pending',
        theme: theme || null,
        language: language || 'en',
        duration: duration || 'short',
        image_count: images.length,
      });

    if (insertError) {
      console.error('Error creating story record:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to initialize story generation' }, 
        { status: 500 }
      );
    }

    // Trigger the actual generation process in the background
    // This runs the webhook without waiting for it to complete
    fetch(`${req.nextUrl.origin}/api/stories/generate/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        storyId,
        images,
        characters,
        theme,
        duration,
        language,
        backgroundMusic,
        voice,
        userId: session.user.id,
      }),
    }).catch(err => {
      console.error('Error triggering background process:', err);
      // We don't wait for this to complete
    });

    // Return immediately with the story ID
    return NextResponse.json({
      success: true,
      storyId,
      status: 'pending',
      message: 'Story generation started'
    });
  } catch (error) {
    console.error('Error in story generation initialization:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      }, 
      { status: 500 }
    );
  }
}