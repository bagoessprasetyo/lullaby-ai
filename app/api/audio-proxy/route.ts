// app/api/audio-proxy/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';

/**
 * This endpoint acts as a proxy for audio files, resolving CORS issues 
 * and ensuring correct content types
 */
export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get URL parameter
    const searchParams = req.nextUrl.searchParams;
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ success: false, error: 'Missing URL parameter' }, { status: 400 });
    }

    console.log(`[Audio Proxy] Fetching audio from: ${url}`);

    // Fetch the audio file
    const response = await fetch(url, {
      headers: {
        'Accept': 'audio/*',
      }
    });

    if (!response.ok) {
      console.error(`[Audio Proxy] Failed to fetch audio: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { success: false, error: `Failed to fetch audio: ${response.status}` }, 
        { status: response.status }
      );
    }

    // Get the content type
    const contentType = response.headers.get('content-type') || 'audio/mpeg';
    console.log(`[Audio Proxy] Content type: ${contentType}`);

    // Get the audio data
    const audioBuffer = await response.arrayBuffer();
    console.log(`[Audio Proxy] Received ${audioBuffer.byteLength} bytes of audio data`);

    // Return the audio with the correct content type
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'Access-Control-Allow-Origin': '*' // Allow cross-origin access
      }
    });
  } catch (error) {
    console.error('[Audio Proxy] Error fetching audio:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch audio' }, 
      { status: 500 }
    );
  }
}