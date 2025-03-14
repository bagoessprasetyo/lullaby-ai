// app/api/tts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';

export async function POST(req: NextRequest) {
  console.log('[TTS API] Text-to-speech request received');
  
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log('[TTS API] Unauthorized request - no valid session');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`[TTS API] Request from user: ${session.user.id}`);

    // Get ElevenLabs API key from environment variable
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      console.error('[TTS API] ELEVENLABS_API_KEY environment variable is not set');
      return NextResponse.json(
        { success: false, error: 'API key not configured on server' }, 
        { status: 500 }
      );
    }

    // Parse request body
    let requestData;
    try {
      requestData = await req.json();
      console.log(`[TTS API] Request data received: voiceId=${requestData.voiceId}, text length=${requestData.text?.length || 0}`);
    } catch (parseError) {
      console.error('[TTS API] Failed to parse request body:', parseError);
      return NextResponse.json(
        { success: false, error: 'Invalid request format' },
        { status: 400 }
      );
    }

    const { text, voiceId, modelId = 'eleven_monolingual_v1' } = requestData;

    // Validate required fields
    if (!text) {
      console.error('[TTS API] Missing text in request');
      return NextResponse.json(
        { success: false, error: 'Text is required' }, 
        { status: 400 }
      );
    }

    if (!voiceId) {
      console.error('[TTS API] Missing voiceId in request');
      return NextResponse.json(
        { success: false, error: 'Voice ID is required' }, 
        { status: 400 }
      );
    }

    console.log(`[TTS API] Converting text to speech with voice ${voiceId} using model ${modelId}`);
    console.log(`[TTS API] Text length: ${text.length} characters`);
    
    if (text.length > 5000) {
      console.log('[TTS API] Warning: Text is longer than 5000 characters, ElevenLabs may truncate it');
    }

    // Prepare the API request
    const apiUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
    const requestBody = JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      }
    });
    
    console.log(`[TTS API] Sending request to: ${apiUrl}`);
    console.log('[TTS API] Request body sample:', requestBody.substring(0, 100) + '...');

    // Call ElevenLabs API to generate speech
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey
        },
        body: requestBody,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      console.log(`[TTS API] ElevenLabs response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        let errorMessage = `ElevenLabs API error: ${response.status}`;
        
        try {
          // Try to parse the error response body
          const errorText = await response.text();
          console.error('[TTS API] ElevenLabs API detailed error:', errorText);
          
          try {
            // Try to parse as JSON if possible
            const errorJson = JSON.parse(errorText);
            if (errorJson.detail) {
              errorMessage = `ElevenLabs API error: ${errorJson.detail}`;
            }
          } catch (jsonError) {
            // Not JSON, use text as is
            errorMessage = `ElevenLabs API error: ${errorText.substring(0, 200)}`;
          }
        } catch (textError) {
          console.error('[TTS API] Could not read error response body:', textError);
        }
        
        return NextResponse.json(
          { success: false, error: errorMessage }, 
          { status: response.status }
        );
      }

      // Get audio data from response
      const audioBuffer = await response.arrayBuffer();
      console.log(`[TTS API] Successfully received audio buffer (${audioBuffer.byteLength} bytes)`);
      
      // If buffer size is too small, it might indicate an error
      if (audioBuffer.byteLength < 1000) {
        console.warn('[TTS API] Warning: Audio buffer is suspiciously small, might be invalid');
      }
      
      const audioBase64 = Buffer.from(audioBuffer).toString('base64');
      console.log('[TTS API] Successfully converted audio to base64');

      // Return audio data
      return NextResponse.json({ 
        success: true, 
        audioData: `data:audio/mpeg;base64,${audioBase64}`
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('[TTS API] Request timed out after 60 seconds');
        return NextResponse.json(
          { success: false, error: 'ElevenLabs request timed out after 60 seconds' },
          { status: 504 }
        );
      }
      
      console.error('[TTS API] Fetch error with ElevenLabs API:', fetchError);
      throw fetchError;
    }
  } catch (error) {
    console.error('[TTS API] Unhandled error in TTS generation:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate speech', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}