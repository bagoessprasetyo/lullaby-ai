import { NextRequest, NextResponse } from 'next/server';
import { getBackgroundMusic, getBackgroundMusicById } from '@/lib/services/background-music-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';

// GET endpoint to fetch all background music tracks
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ success: false, error: 'Unauthorized' }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if we're looking for a specific track
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    let data;
    if (id) {
      // Fetch a specific track by ID
      data = await getBackgroundMusicById(id);
      
      if (!data) {
        return new NextResponse(
          JSON.stringify({ success: false, error: 'Background music track not found' }), 
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Fetch all tracks
      data = await getBackgroundMusic();
    }
    
    // Return background music data
    return new NextResponse(
      JSON.stringify({ success: true, data }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching background music:', error);
    return new NextResponse(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to fetch background music', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}