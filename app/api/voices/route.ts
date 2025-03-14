// app/api/voices/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth.config";

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get ElevenLabs API key from environment variable
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      console.error('ELEVENLABS_API_KEY environment variable is not set');
      return NextResponse.json(
        { success: false, error: 'API key not configured' }, 
        { status: 500 }
      );
    }

    // Fetch voices from ElevenLabs API
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'Accept': 'application/json',
        'xi-api-key': apiKey
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      return NextResponse.json(
        { success: false, error: `ElevenLabs API error: ${response.status}` }, 
        { status: response.status }
      );
    }

    const data = await response.json();

    // Return the voices data
    return NextResponse.json({ 
      success: true, 
      voices: data.voices 
    });
  } catch (error) {
    console.error('Error fetching voices:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch voices' }, 
      { status: 500 }
    );
  }
}