// app/api/images/blur-placeholder/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPlaiceholder } from 'plaiceholder';

// This API route generates blur placeholders for images
// This moves the computation to the server rather than the client
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  
  if (!url) {
    return NextResponse.json(
      { error: 'Missing URL parameter' },
      { status: 400 }
    );
  }
  
  try {
    // Fetch the image
    const response = await fetch(url);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch image' },
        { status: response.status }
      );
    }
    
    const buffer = await response.arrayBuffer();
    
    // Generate the blur placeholder
    const { base64 } = await getPlaiceholder(Buffer.from(buffer));
    
    // Cache the response for 1 week (604800 seconds)
    // This avoids regenerating placeholders for the same images
    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=604800, immutable');
    
    // Return the blur data URL
    return NextResponse.json(
      { blurDataUrl: base64 },
      { 
        status: 200,
        headers
      }
    );
  } catch (error) {
    console.error('Error generating blur placeholder:', error);
    return NextResponse.json(
      { error: 'Failed to generate blur placeholder' },
      { status: 500 }
    );
  }
}