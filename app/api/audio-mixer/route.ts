import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { getBackgroundMusicById } from '@/lib/services/background-music-service';

// We need to add this GET handler for build time
export async function GET() {
  return new NextResponse(
    JSON.stringify({ message: "This endpoint only accepts POST requests" }),
    { status: 405, headers: { 'Content-Type': 'application/json' } }
  );
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ success: false, error: 'Unauthorized' }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get request body
    const body = await req.json();
    const { storyAudioUrl, backgroundMusicId, volumeRatio = 0.3 } = body;

    if (!storyAudioUrl) {
      return new NextResponse(
        JSON.stringify({ success: false, error: 'Story audio URL is required' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!backgroundMusicId) {
      return new NextResponse(
        JSON.stringify({ success: false, error: 'Background music ID is required' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get background music details from database
    const backgroundMusic = await getBackgroundMusicById(backgroundMusicId);
    if (!backgroundMusic) {
      return new NextResponse(
        JSON.stringify({ success: false, error: 'Background music not found' }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // For production deployment, we will use a third-party service for audio mixing
    // This is a simplified implementation that just returns the original audio URL
    // In a real implementation, you would integrate with a service like AWS Media Convert or similar
    
    // This is a placeholder for the actual implementation
    return new NextResponse(
      JSON.stringify({ 
        success: true, 
        mixedAudioUrl: storyAudioUrl, // Just return the original audio for now
        duration: 180 // Placeholder duration
      }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error mixing audio:', error);
    return new NextResponse(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to mix audio', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}