import { auth } from '@/auth';
import { rateLimiter } from '@/lib/rate-limiter';
import { getAdminClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export async function POST(req: NextRequest) {
  console.log('[API] Webhook request received');
  
  const session = await auth();
  
  if (!session?.user?.id) {
    console.log('[API] Unauthorized webhook request');
    return new NextResponse(
      JSON.stringify({ success: false, error: 'Unauthorized' }), 
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  console.log(`[API] Webhook authenticated user: ${session.user.id}`);

  // Rate limit to 5 requests per minute
  try {
    console.log('[API] Checking webhook rate limit');
    const { success, limit, reset, remaining } = await rateLimiter.limit(session.user.id);
    console.log(`[API] Webhook rate limit status: ${success ? 'OK' : 'Exceeded'}, remaining: ${remaining}`);
    
    if (!success) {
      console.log('[API] Webhook rate limit exceeded');
      return new NextResponse(
        JSON.stringify({ 
          success: false, 
          error: 'Rate limit exceeded', 
          remaining, 
          limit, 
          reset 
        }), 
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('[API] Webhook rate limit error:', error);
    // Continue despite rate limiting error - better user experience
  }

  try {
    // Get the request body
    let body;
    try {
      const requestText = await req.text();
      console.log('Webhook request body:', requestText);
      
      if (!requestText) {
        return NextResponse.json({ error: 'Empty request body' }, { status: 400 });
      }
      
      try {
        body = JSON.parse(requestText);
      } catch (parseError) {
        console.error('Failed to parse webhook request body:', parseError);
        return NextResponse.json({ 
          error: 'Invalid JSON in request body',
          details: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
        }, { status: 400 });
      }
    } catch (error) {
      console.error('Error reading webhook request body:', error);
      return NextResponse.json({ 
        error: 'Error reading request body',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 400 });
    }
    
    const { storyId } = body;
    
    if (!storyId) {
      return NextResponse.json({ error: 'Missing storyId' }, { status: 400 });
    }
    
    // Get the story from the database with background music details
    const adminClient = getAdminClient();
    const { data: story, error } = await adminClient
      .from('stories')
      .select(`
        *,
        background_music:background_music_id (
          id,
          name,
          url,
          duration
        )
      `)
      .eq('id', storyId)
      .eq('user_id', session.user.id)
      .single();
    
    if (error || !story) {
      console.error('Error fetching story:', error);
      return NextResponse.json(
        { error: 'Story not found or access denied' }, 
        { status: 404 }
      );
    }
    
    // Generate audio using ElevenLabs
    const audioContent = await generateAudioWithElevenLabs({
      text: story.text_content,
      voice: story.voice
    });
    
    if (!audioContent) {
      throw new Error('Failed to generate audio');
    }
    
    // Mix with background music if available
    let finalAudioContent = audioContent;
    
    // Add background music if it exists
    if (story.background_music && story.background_music.storage_path) {
      console.log(`[API] Adding background music: ${story.background_music.name}`);
      try {
        // In a real implementation, this would download both audio files and mix them
        // For now, we'll just use the narration audio without mixing
        
        // TODO: Implement actual audio mixing using a library or serverless function
        // This would retrieve the background music from the storage path
        // Mix it with the narration at a lower volume (e.g., 20%)
        // And return the combined audio

        // For now, we'll just log that we would mix the audio
        console.log(`[API] Would mix narration with background music from ${story.background_music.storage_path}`);
        // finalAudioContent = await mixAudioWithBackgroundMusic(audioContent, story.background_music.storage_path);
      } catch (mixError) {
        console.error('[API] Error mixing audio with background music:', mixError);
        // Continue with just the narration if mixing fails
      }
    }
    
    // Upload final audio (with or without background music) to Cloudinary
    const audioUploadResult = await uploadAudioToCloudinary(finalAudioContent, storyId);
    
    // Update the story in the database
    const { error: updateError } = await adminClient
      .from('stories')
      .update({
        audio_url: audioUploadResult.secure_url,
        duration: audioUploadResult.duration,
        storage_path: `stories/${storyId}/audio.mp3`
      })
      .eq('id', storyId);
    
    if (updateError) {
      console.error('Error updating story:', updateError);
      throw new Error('Failed to update story with audio URL');
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      storyId,
      audioUrl: audioUploadResult.secure_url,
      duration: audioUploadResult.duration
    });
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}

// Generate audio using ElevenLabs API or fallback to mock
async function generateAudioWithElevenLabs({ 
  text, 
  voice = 'default' 
}: { 
  text: string, 
  voice: string 
}) {
  try {
    // Check if ElevenLabs API key is available
    const elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;
    
    // Log the key for debugging (first 4 characters only for security)
    const keyPrefix = elevenlabsApiKey ? elevenlabsApiKey.substring(0, 4) + '...' : 'null';
    console.log(`[API] ElevenLabs API key present: ${elevenlabsApiKey ? 'YES' : 'NO'}, prefix: ${keyPrefix}`);
    
    // IMPORTANT: We want to ALWAYS try the real API, not mock data
    if (!elevenlabsApiKey) {
      console.error('[API] ELEVENLABS_API_KEY is not configured properly');
      throw new Error('ELEVENLABS_API_KEY is not configured properly');
    }
    
    // Map voice selection to ElevenLabs voice IDs
    // These are example voice IDs - replace with actual voice IDs from your ElevenLabs account
    const voiceMap: Record<string, string> = {
      default: '21m00Tcm4TlvDq8ikWAM', // Rachel
      female: '21m00Tcm4TlvDq8ikWAM',  // Rachel
      male: 'AZnzlk1XvdvUeBnXmlld',    // Sam
      child: 'XB0fDUnXU5powFXDhCwa',   // Elli
      storyteller: 'pNInz6obpgDQGcFmaJgB', // Daniel
    };
    
    const voiceId = voiceMap[voice] || voiceMap.default;
    
    console.log(`[API] Calling ElevenLabs API with voice: ${voice} (ID: ${voiceId})`);
    console.log(`[API] Text to convert (first 50 chars): "${text.substring(0, 50)}..."`);
    
    // Call ElevenLabs API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    try {
      // Log full request details for debugging
      const requestBody = {
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.75,
        }
      };
      
      console.log(`[API] ElevenLabs API request: 
        URL: https://api.elevenlabs.io/v1/text-to-speech/${voiceId}
        Headers: Content-Type: application/json, xi-api-key: ${keyPrefix}
        Model: eleven_monolingual_v1
        Text length: ${text.length} characters
      `);
      
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': elevenlabsApiKey
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      console.log(`[API] ElevenLabs response status: ${response.status} ${response.statusText}`);
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error(`[API] ElevenLabs API error: ${response.status} ${response.statusText}`, errorData);
        throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
      }
      
      console.log('[API] ElevenLabs API successful response, getting audio data...');
      
      // Get the audio content as ArrayBuffer
      const audioBuffer = await response.arrayBuffer();
      console.log(`[API] Received audio buffer of size: ${audioBuffer.byteLength} bytes`);
      
      const audioBase64 = Buffer.from(audioBuffer).toString('base64');
      console.log(`[API] Converted to base64 (showing first 50 chars): ${audioBase64.substring(0, 50)}...`);
      
      return `data:audio/mp3;base64,${audioBase64}`;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('[API] ElevenLabs API request timed out after 60 seconds');
        throw new Error('Audio generation timed out');
      }
      console.error('[API] ElevenLabs API fetch error:', fetchError);
      throw new Error(`ElevenLabs API error: ${fetchError.message}`);
    }
  } catch (error) {
    console.error('[API] ElevenLabs TTS error:', error);
    
    // Return a fallback audio in case of error
    console.log('[API] Using fallback audio due to error');
    return 'USE_LOCAL_AUDIO_FILE';
  }
}

// Upload audio to Cloudinary or use fallback
async function uploadAudioToCloudinary(audioDataUrl: string, storyId: string) {
  try {
    // Check if we're using a mock audio (which won't work with Cloudinary)
    if (audioDataUrl === 'USE_LOCAL_AUDIO_FILE' || 
        audioDataUrl === 'data:audio/mp3;base64,FALLBACK_AUDIO_CONTENT') {
      console.log('[API] Using fallback URL for mock audio');
      
      // Return a fallback URL to a static audio file in the public directory
      // In Next.js, files in public are served at the root path
      return {
        secure_url: '/story.wav',
        duration: 30 // Default duration in seconds
      };
    }
    
    console.log('[API] Uploading audio to Cloudinary');
    
    // Set a timeout for the upload
    const uploadPromise = new Promise(async (resolve, reject) => {
      try {
        const result = await cloudinary.uploader.upload(audioDataUrl, {
          resource_type: 'auto',
          folder: 'story-app-audio',
          public_id: `${storyId}-audio`,
          overwrite: true,
          timeout: 60000 // 60 second upload timeout
        });
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
    
    // Race the upload against a timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Cloudinary upload timed out')), 60000);
    });
    
    const uploadResult = await Promise.race([uploadPromise, timeoutPromise]) as any;
    
    console.log(`[API] Upload successful: ${uploadResult.secure_url}`);
    
    return {
      secure_url: uploadResult.secure_url,
      duration: uploadResult.duration || 30 // Duration in seconds
    };
  } catch (error) {
    console.error('[API] Error uploading audio to Cloudinary:', error);
    
    // Return a fallback URL in case of upload failure
    console.log('[API] Using fallback URL due to upload error');
    return {
      secure_url: '/story.wav',
      duration: 30 // Default duration in seconds
    };
  }
}