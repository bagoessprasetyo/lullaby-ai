// app/api/stories/generate/webhook/route.ts
// Keep the existing imports from your current implementation
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
  console.log('[WEBHOOK] Story generation webhook request received');
  
  const session = await auth();
  
  if (!session?.user?.id) {
    console.log('[WEBHOOK] Unauthorized webhook request');
    return new NextResponse(
      JSON.stringify({ success: false, error: 'Unauthorized' }), 
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  console.log(`[WEBHOOK] Authenticated user: ${session.user.id}`);

  // Rate limit to 5 requests per minute
  try {
    console.log('[WEBHOOK] Checking webhook rate limit');
    const { success, limit, reset, remaining } = await rateLimiter.limit(session.user.id);
    console.log(`[WEBHOOK] Webhook rate limit status: ${success ? 'OK' : 'Exceeded'}, remaining: ${remaining}`);
    
    if (!success) {
      console.log('[WEBHOOK] Webhook rate limit exceeded');
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
    console.error('[WEBHOOK] Webhook rate limit error:', error);
    // Continue despite rate limiting error - better user experience
  }

  try {
    // Get the request body
    let body;
    try {
      const requestText = await req.text();
      console.log('[WEBHOOK] Request body length:', requestText.length);
      
      if (!requestText) {
        return NextResponse.json({ error: 'Empty request body' }, { status: 400 });
      }
      
      try {
        body = JSON.parse(requestText);
      } catch (parseError) {
        console.error('[WEBHOOK] Failed to parse webhook request body:', parseError);
        return NextResponse.json({ 
          error: 'Invalid JSON in request body',
          details: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
        }, { status: 400 });
      }
    } catch (error) {
      console.error('[WEBHOOK] Error reading webhook request body:', error);
      return NextResponse.json({ 
        error: 'Error reading request body',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 400 });
    }
    
    const { storyId, text, voiceId } = body;
    
    // Validate required parameters
    if (!storyId) {
      console.error('[WEBHOOK] Missing storyId');
      return NextResponse.json({ error: 'Missing storyId parameter' }, { status: 400 });
    }
    
    // Generate audio using ElevenLabs if both text and voiceId are provided
    if (text && voiceId) {
      console.log(`[WEBHOOK] Generating audio for story ${storyId} with voice ${voiceId}`);
      console.log(`[WEBHOOK] Text length: ${text.length} characters`);
      
      try {
        // Generate audio using ElevenLabs API
        const audioContent = await generateAudioWithElevenLabs(text, voiceId);
        
        // Upload to Cloudinary
        const uploadResult = await uploadAudioToCloudinaryImproved(audioContent, storyId);
        
        // Update the story in the database
        await updateStoryWithAudio(storyId, uploadResult.secure_url, uploadResult.duration);
        
        // Return success response
        return NextResponse.json({
          success: true,
          storyId,
          audioUrl: uploadResult.secure_url,
          duration: uploadResult.duration
        });
      } catch (error) {
        console.error('[WEBHOOK] Error generating or uploading audio:', error);
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to generate or upload audio',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
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
      console.error('[WEBHOOK] Error fetching story:', error);
      return NextResponse.json(
        { error: 'Story not found or access denied' }, 
        { status: 404 }
      );
    }
    
    // Generate audio using ElevenLabs
    const audioContent = await generateAudioWithElevenLabs(story.text_content, story.voice);
    
    if (!audioContent) {
      throw new Error('Failed to generate audio');
    }
    
    // Upload final audio to Cloudinary
    const audioUploadResult = await uploadAudioToCloudinaryImproved(audioContent, storyId);
    
    // Update the story in the database
    await updateStoryWithAudio(storyId, audioUploadResult.secure_url, audioUploadResult.duration);
    
    // Return success response
    return NextResponse.json({
      success: true,
      storyId,
      audioUrl: audioUploadResult.secure_url,
      duration: audioUploadResult.duration
    });
    
  } catch (error) {
    console.error('[WEBHOOK] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}

// Generate audio using ElevenLabs API
async function generateAudioWithElevenLabs(text, voiceId = 'default') {
  console.log(`[WEBHOOK] Generating audio with ElevenLabs for voice ${voiceId}`);
  
  try {
    // Check if ElevenLabs API key is available
    const elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;
    
    if (!elevenlabsApiKey) {
      console.error('[WEBHOOK] ELEVENLABS_API_KEY is not configured properly');
      throw new Error('ELEVENLABS_API_KEY is not configured properly');
    }
    
    // Map voice selection to ElevenLabs voice IDs
    const voiceMap = {
      default: '21m00Tcm4TlvDq8ikWAM', // Rachel
      female: '21m00Tcm4TlvDq8ikWAM',  // Rachel
      male: 'AZnzlk1XvdvUeBnXmlld',    // Sam
      child: 'XB0fDUnXU5powFXDhCwa',   // Elli
      storyteller: 'pNInz6obpgDQGcFmaJgB', // Daniel
    };
    
    // Check if voiceId is already a valid UUID
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isUuid = uuidPattern.test(voiceId);
    
    // Use the selected voice ID or map it if it's a voice type
    const finalVoiceId = isUuid ? voiceId : (voiceMap[voiceId] || voiceMap.default);
    
    console.log(`[WEBHOOK] Using ElevenLabs voice ID: ${finalVoiceId}`);
    console.log(`[WEBHOOK] Text length: ${text.length} characters`);
    
    // Truncate text if too long (ElevenLabs has limitations)
    const maxTextLength = 5000;
    let processedText = text;
    
    if (text.length > maxTextLength) {
      console.log(`[WEBHOOK] Text exceeds ${maxTextLength} characters, truncating`);
      // Find a natural break point like a paragraph end
      const truncated = text.substring(0, maxTextLength);
      const lastParagraph = truncated.lastIndexOf('\n\n');
      if (lastParagraph > maxTextLength * 0.7) {
        processedText = text.substring(0, lastParagraph + 2);
      } else {
        processedText = truncated;
      }
      console.log(`[WEBHOOK] Truncated text to ${processedText.length} characters`);
    }
    
    // Make the API call to ElevenLabs
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${finalVoiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': elevenlabsApiKey
      },
      body: JSON.stringify({
        text: processedText,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });
    
    // Improved error handling
    if (!response.ok) {
      let errorText = '';
      try {
        // Try to get the error details as JSON
        const errorData = await response.json();
        errorText = JSON.stringify(errorData);
      } catch (e) {
        // If not JSON, get as text
        try {
          errorText = await response.text();
        } catch (e2) {
          errorText = `Status ${response.status}`;
        }
      }
      
      throw new Error(`ElevenLabs API returned error: ${errorText}`);
    }
    
    // Get the audio content as ArrayBuffer
    const audioBuffer = await response.arrayBuffer();
    console.log(`[WEBHOOK] Received audio buffer of size: ${audioBuffer.byteLength} bytes`);
    
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');
    return `data:audio/mpeg;base64,${audioBase64}`;
  } catch (fetchError) {
    clearTimeout(timeoutId);
    
    if (fetchError.name === 'AbortError') {
      console.error('[WEBHOOK] ElevenLabs API request timed out after 120 seconds');
      throw new Error('Audio generation timed out');
    }
    
    console.error('[WEBHOOK] ElevenLabs API fetch error:', fetchError);
    throw new Error(`ElevenLabs API error: ${fetchError.message}`);
  }
}

// Improved Cloudinary upload function with better error handling
async function uploadAudioToCloudinaryImproved(audioDataUrl, storyId) {
  console.log(`[WEBHOOK] Uploading audio to Cloudinary for story ${storyId}`);
  
  try {
    // Validate the audio data URL
    if (!audioDataUrl) {
      throw new Error('No audio data provided');
    }
    
    if (!audioDataUrl.startsWith('data:audio/')) {
      if (audioDataUrl === 'USE_LOCAL_AUDIO_FILE') {
        console.log('[WEBHOOK] Using fallback URL for mock audio');
        return {
          secure_url: '/story.wav',
          duration: 30 // Default duration in seconds
        };
      }
      console.error('[WEBHOOK] Invalid audio data URL format');
      throw new Error('Invalid audio data URL format');
    }
    
    console.log('[WEBHOOK] Uploading audio to Cloudinary');
    console.time('cloudinary-upload');
    
    // Convert base64 to buffer if necessary
    let uploadData = audioDataUrl;
    if (audioDataUrl.includes('base64,')) {
      // It's already a data URL, we can use it directly
    } else {
      // It's raw base64, we need to add the prefix
      uploadData = `data:audio/mpeg;base64,${audioDataUrl}`;
    }
    
    // Set a timeout for the upload
    const uploadPromise = new Promise(async (resolve, reject) => {
      try {
        const result = await cloudinary.uploader.upload(uploadData, {
          resource_type: 'auto',
          folder: 'story-app-audio',
          public_id: `${storyId}-audio`,
          overwrite: true,
          timeout: 120000, // 120 second upload timeout
          format: 'mp3', // Force MP3 format
          audio: {
            codec: 'mp3', // Ensure MP3 encoding
          },
          notification_url: null, // Disable notifications
        });
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
    
    // Race the upload against a timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Cloudinary upload timed out')), 120000);
    });
    
    const uploadResult = await Promise.race([uploadPromise, timeoutPromise]);
    console.timeEnd('cloudinary-upload');
    
    console.log(`[WEBHOOK] Audio uploaded to Cloudinary: ${uploadResult.secure_url}`);
    console.log(`[WEBHOOK] Audio duration: ${uploadResult.duration || 'unknown'} seconds`);
    console.log(`[WEBHOOK] Audio format: ${uploadResult.format || 'unknown'}`);
    console.log(`[WEBHOOK] Audio size: ${uploadResult.bytes || 'unknown'} bytes`);
    
    // Validate upload result
    if (!uploadResult.secure_url) {
      throw new Error('Cloudinary did not return a secure URL');
    }
    
    return {
      secure_url: uploadResult.secure_url,
      duration: uploadResult.duration || 30, // Duration in seconds
      format: uploadResult.format || 'mp3',
      bytes: uploadResult.bytes || 0
    };
  } catch (error) {
    console.error('[WEBHOOK] Error uploading audio to Cloudinary:', error);
    throw error; // Propagate the error upward
  }
}

// Function to update the story with audio information
async function updateStoryWithAudio(storyId, audioUrl, duration) {
  console.log(`[WEBHOOK] Updating story ${storyId} with audio URL: ${audioUrl}`);
  
  try {
    const adminClient = getAdminClient();
    
    const { data, error } = await adminClient
      .from('stories')
      .update({
        audio_url: audioUrl,
        duration: duration,
        storage_path: `stories/${storyId}/audio.mp3`
      })
      .eq('id', storyId);
    
    if (error) {
      console.error('[WEBHOOK] Error updating story with audio URL:', error);
      throw new Error(`Failed to update story with audio URL: ${error.message}`);
    }
    
    console.log(`[WEBHOOK] Successfully updated story ${storyId} with audio information`);
    return true;
  } catch (error) {
    console.error('[WEBHOOK] Error in updateStoryWithAudio:', error);
    throw error; // Propagate the error upward
  }
}