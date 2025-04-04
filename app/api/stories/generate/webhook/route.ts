// app/api/stories/generate/webhook/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { rateLimiter } from '@/lib/rate-limiter';
import { getAdminClient } from '@/lib/supabase';
import { v2 as cloudinary } from 'cloudinary';
import { generateStoryWithOpenAI } from "@/lib/openai";
import { generateStoryAudio } from "@/lib/elevenlabs";
import { uploadBase64Image, uploadAudioToCloudinary, configureCloudinary } from '@/lib/cloudinary';
import { mixAudioWithBackgroundMusic } from '@/lib/services/audio-mixer-service';

// Set maximum duration for this function
// Update this line at the top of your file
export const maxDuration = 60; // 60 seconds for Vercel Hobby plan
export const dynamic = 'force-dynamic';

// Update the webhook handler to use Next.js App Router format
export async function POST(req: Request) {
  console.log('[WEBHOOK] Story generation webhook request received');
  
  try {
    // Initialize Cloudinary at runtime
    configureCloudinary();
    
    // Authenticate user
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log('[WEBHOOK] Unauthorized webhook request');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log(`[WEBHOOK] Authenticated user: ${session.user.id}`);

    // Rate limit to 5 requests per minute
    try {
      console.log('[WEBHOOK] Checking webhook rate limit');
      const { success, limit, reset, remaining } = await rateLimiter.limit(session.user.id);
      console.log(`[WEBHOOK] Webhook rate limit status: ${success ? 'OK' : 'Exceeded'}, remaining: ${remaining}`);
      
      if (!success) {
        console.log('[WEBHOOK] Webhook rate limit exceeded');
        return NextResponse.json({ 
          success: false, 
          error: 'Rate limit exceeded', 
          remaining, 
          limit, 
          reset 
        }, { status: 429 });
      }
    } catch (error) {
      console.error('[WEBHOOK] Webhook rate limit error:', error);
      // Continue despite rate limiting error - better user experience
    }

    // Get the request body
    const body = await req.json();
    
    if (!body) {
      return NextResponse.json({ error: 'Empty request body' }, { status: 400 });
    }
    
    const { storyId, images, characters, theme, duration, language, backgroundMusic, voice, userId } = body;
    
    // Validate required parameters
    if (!storyId) {
      console.error('[WEBHOOK] Missing storyId');
      return NextResponse.json({ error: 'Missing storyId parameter' }, { status: 400 });
    }
    
    // Get the story from the database
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
      .single();
    
    if (error || !story) {
      console.error('[WEBHOOK] Error fetching story:', error);
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }
    
    console.log(`[WEBHOOK] Processing story ${storyId}`);
    
    // If images are provided, process and upload them
    let imageUrls: string[] = [];
    if (images && images.length > 0) {
      console.log(`[WEBHOOK] Processing ${images.length} images`);
      try {
        for (const imageData of images) {
          if (typeof imageData === 'string' && imageData.startsWith('data:')) {
            // Upload to Cloudinary
            const result = await uploadBase64Image(imageData);
            imageUrls.push(result.secure_url);
          }
        }
        console.log(`[WEBHOOK] Uploaded ${imageUrls.length} images`);
      } catch (uploadError) {
        console.error('[WEBHOOK] Error uploading images:', uploadError);
        // Continue even if some images fail
      }
    }
    
    // Analyze images and generate story content using OpenAI
    let storyContent = '';
    let storyTitle = '';
    
    try {
      console.log('[WEBHOOK] Generating story content with OpenAI');
      
      // Build the prompt for story generation (this would normally use your story-generation.ts methods)
      const prompt = `Generate a ${theme} story for children. Language: ${language}. 
                     Characters: ${JSON.stringify(characters || [])}. 
                     Theme: ${theme}. Duration: ${duration}.`;
      
      // Generate the story
      const generatedStory = await generateStoryWithOpenAI(prompt);
      storyContent = generatedStory.content;
      storyTitle = generatedStory.title;
      
      console.log(`[WEBHOOK] Story generated: "${storyTitle}" (${storyContent.length} chars)`);
      
      // Update the story in the database with the content
      const { error: updateError } = await adminClient
        .from('stories')
        .update({
          title: storyTitle,
          text_content: storyContent,
          status: 'content_ready'
        })
        .eq('id', storyId);
      
      if (updateError) {
        console.error('[WEBHOOK] Error updating story content:', updateError);
      }
    } catch (contentError) {
      console.error('[WEBHOOK] Error generating story content:', contentError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to generate story content' 
      }, { status: 500 });
    }
    
    // Generate audio using ElevenLabs
    try {
      console.log('[WEBHOOK] Generating audio narration with ElevenLabs');
      console.time('elevenlabs-tts');
      
      // Use the voice from the request or fall back to the one in the DB
      const voiceToUse = voice || story.voice || 'default';
      const languageToUse = language || story.language || 'english';
      
      // Generate the audio
      const { audioUrl, success } = await generateStoryAudio(storyContent, voiceToUse);
      
      if (!success || !audioUrl) {
        throw new Error('Failed to generate audio');
      }
      
      console.timeEnd('elevenlabs-tts');
      
      // Upload to Cloudinary
      console.log('[WEBHOOK] Uploading audio to Cloudinary');
      const uploadResult = await uploadAudioToCloudinary(audioUrl, storyId);
      
      // Mix with background music if available
      let finalAudioUrl = uploadResult.secure_url;
      
      if (backgroundMusic && await isSubscriber(userId || session.user.id)) {
        console.log(`[WEBHOOK] Mixing audio with background music: ${backgroundMusic}`);
        console.time('audio-mixing');
        try {
          // Mix audio with background music
          const mixResult = await mixAudioWithBackgroundMusic(
            finalAudioUrl,
            backgroundMusic,
            0.25 // Setting background music at 25% volume
          );
          
          if (mixResult && mixResult.mixedAudioUrl) {
            console.log(`[WEBHOOK] Audio mixed successfully: ${mixResult.mixedAudioUrl}`);
            // Update the audioUrl to the mixed version
            finalAudioUrl = mixResult.mixedAudioUrl;
          }
          console.timeEnd('audio-mixing');
        } catch (mixingError) {
          console.error('[WEBHOOK] Error mixing audio with background music:', mixingError);
          // Continue with unmixed audio if mixing fails
        }
      }
      
      // Update the story in the database with the audio URL
      const { error: audioUpdateError } = await adminClient
        .from('stories')
        .update({
          audio_url: finalAudioUrl,
          mixed_audio_url: finalAudioUrl,
          status: 'completed'
        })
        .eq('id', storyId);
      
      if (audioUpdateError) {
        console.error('[WEBHOOK] Error updating story with audio URL:', audioUpdateError);
      }
      
      // Return success response
      return NextResponse.json({
        success: true,
        storyId,
        audioUrl: finalAudioUrl,
        title: storyTitle,
        hasMixedAudio: backgroundMusic !== null
      });
    } catch (audioError) {
      console.error('[WEBHOOK] Error generating or processing audio:', audioError);
      
      // Still mark the story as complete, just without audio
      const { error: finalUpdateError } = await adminClient
        .from('stories')
        .update({
          status: 'completed_no_audio'
        })
        .eq('id', storyId);
      
      // Return success for the content at least
      return NextResponse.json({
        success: true,
        storyId,
        title: storyTitle,
        error: 'Audio generation failed, but story content is available',
        audioUrl: null
      });
    }
  } catch (error) {
    console.error('[WEBHOOK] Unhandled error in webhook route:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process webhook request', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// Helper function to check if a user is a premium subscriber
async function isSubscriber(userId: string): Promise<boolean> {
  try {
    const adminClient = getAdminClient();
    const { data, error } = await adminClient
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single();
    
    if (error || !data) {
      console.error('[WEBHOOK] Error checking subscription status:', error);
      return false;
    }
    
    return data.subscription_tier === 'premium' || data.subscription_tier === 'premium_plus';
  } catch (error) {
    console.error('[WEBHOOK] Exception checking subscription status:', error);
    return false;
  }
}

// Generate audio using ElevenLabs API
async function generateAudioWithElevenLabs(text: string, voiceId = 'default', language = 'english') {
  console.log(`[WEBHOOK] Generating audio with ElevenLabs for voice ${voiceId}`);
  
  try {
    // Check if ElevenLabs API key is available
    const elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;
    
    if (!elevenlabsApiKey) {
      console.error('[WEBHOOK] ELEVENLABS_API_KEY is not configured properly');
      throw new Error('ELEVENLABS_API_KEY is not configured properly');
    }
    
    // Map voice selection to ElevenLabs voice IDs
    const voiceMap: Record<string, string> = {
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
    
    // Optimize text processing - break into smaller chunks if needed
    const maxTextLength = 4000; // Reduced from 5000 for better reliability
    let processedText = text;
    
    if (text.length > maxTextLength) {
      console.log(`[WEBHOOK] Text exceeds ${maxTextLength} characters, optimizing`);
      // Find a natural break point like a paragraph end
      const truncated = text.substring(0, maxTextLength);
      const lastParagraph = truncated.lastIndexOf('\n\n');
      const lastSentence = Math.max(
        truncated.lastIndexOf('. '),
        truncated.lastIndexOf('! '),
        truncated.lastIndexOf('? ')
      );
      
      // Choose the best break point
      let breakPoint = maxTextLength;
      if (lastParagraph > maxTextLength * 0.7) {
        breakPoint = lastParagraph;
      } else if (lastSentence > maxTextLength * 0.5) {
        breakPoint = lastSentence + 1; // Include the period
      }
      
      processedText = text.substring(0, breakPoint);
      console.log(`[WEBHOOK] Optimized text to ${processedText.length} characters`);
    }

    // Map user language to ElevenLabs language code
    const languageCodeMap: Record<string, string> = {
      'english': 'en',
      'japanese': 'ja',
      'chinese': 'zh',
      'german': 'de',
      'hindi': 'hi',
      'french': 'fr',
      'korean': 'ko',
      'portuguese': 'pt',
      'italian': 'it',
      'spanish': 'es',
      'russian': 'ru',
      'indonesian': 'id',
      'dutch': 'nl',
      'turkish': 'tr',
      'filipino': 'fil',
      'polish': 'pl',
      'swedish': 'sv',
      'bulgarian': 'bg',
      'romanian': 'ro',
      'arabic': 'ar',
      'czech': 'cs',
      'greek': 'el',
      'finnish': 'fi',
      'croatian': 'hr',
      'malay': 'ms',
      'slovak': 'sk',
      'danish': 'da',
      'tamil': 'ta',
      'ukrainian': 'uk',
      'vietnamese': 'vi',
      'norwegian': 'no',
      'hungarian': 'hu'
    };
    
    // Get language code from map or use the language directly if it's already a code
    const languageCode = languageCodeMap[language.toLowerCase()] || language;
    console.log(`[WEBHOOK] Using language code: ${languageCode} for language: ${language}`);

    // Increase timeout to 3 minutes
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000);
    
    try {
      // Make the API call to ElevenLabs
      console.log('[WEBHOOK] Sending request to ElevenLabs API');
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${finalVoiceId}?output_format=mp3_44100_128`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': elevenlabsApiKey
        },
        body: JSON.stringify({
          text: processedText,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
          language_code: languageCode
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        // Try to get error details
        let errorMessage = `ElevenLabs API error: ${response.status}`;
        try {
          const errorText = await response.text();
          try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.detail) {
              errorMessage = `ElevenLabs API error: ${errorJson.detail}`;
            }
          } catch {
            // Not JSON, use text
            errorMessage = `ElevenLabs API error: ${errorText.substring(0, 100)}`;
          }
        } catch {}
        
        console.error(`[WEBHOOK] ${errorMessage}`);
        throw new Error(errorMessage);
      }
      
      // Get audio data from response
      const audioBuffer = await response.arrayBuffer();
      console.log(`[WEBHOOK] Successfully received audio buffer (${audioBuffer.byteLength} bytes)`);
      
      // If buffer size is too small, it might indicate an error
      if (audioBuffer.byteLength < 1000) {
        console.warn('[WEBHOOK] Warning: Audio buffer is suspiciously small, might be invalid');
        throw new Error('Generated audio file is too small to be valid');
      }
      
      const audioBase64 = Buffer.from(audioBuffer).toString('base64');
      return `data:audio/mpeg;base64,${audioBase64}`;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('[WEBHOOK] ElevenLabs API request timed out after 3 minutes');
        throw new Error('ElevenLabs API request timed out after 3 minutes');
      }
      
      console.error('[WEBHOOK] Error in ElevenLabs API call:', fetchError);
      throw fetchError;
    }
  } catch (error) {
    console.error('[WEBHOOK] Error generating audio:', error);
    throw error;
  }
}

// Improved Cloudinary upload function with better error handling
async function uploadAudioToCloudinaryImproved(audioDataUrl: string, storyId: any) {
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
    
    // Initialize Cloudinary inside the function to ensure it's ready
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
      api_key: process.env.CLOUDINARY_API_KEY || '',
      api_secret: process.env.CLOUDINARY_API_SECRET || '',
      secure: true
    });
    
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
            codec: 'mp3' // Ensure MP3 encoding
          }
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
    
    console.log(`[WEBHOOK] Audio uploaded to Cloudinary: ${(uploadResult as any).secure_url}`);
    console.log(`[WEBHOOK] Audio duration: ${(uploadResult as any).duration || 'unknown'} seconds`);
    console.log(`[WEBHOOK] Audio format: ${(uploadResult as any).format || 'unknown'}`);
    console.log(`[WEBHOOK] Audio size: ${(uploadResult as any).bytes || 'unknown'} bytes`);
    
    // Validate upload result
    if (!(uploadResult as any).secure_url) {
      throw new Error('Cloudinary did not return a secure URL');
    }
    
    return {
      secure_url: (uploadResult as any).secure_url,
      duration: (uploadResult as any).duration || 30, // Duration in seconds
      format: (uploadResult as any).format || 'mp3',
      bytes: (uploadResult as any).bytes || 0
    };
  } catch (error) {
    console.error('[WEBHOOK] Error uploading audio to Cloudinary:', error);
    throw error; // Propagate the error upward
  }
}
// async function isSubscriber(userId: string): Promise<boolean> {
//   try {
//     const adminClient = getAdminClient();
//     const { data, error } = await adminClient
//       .from('profiles')
//       .select('subscription_tier')
//       .eq('id', userId)
//       .single();
    
//     if (error || !data) {
//       console.error('[API] Error checking subscription status:', error);
//       return false;
//     }
    
//     return data.subscription_tier === 'premium' || data.subscription_tier === 'premium_plus';
//   } catch (error) {
//     console.error('[API] Exception checking subscription status:', error);
//     return false;
//   }
// }
// Function to update the story with audio information
async function updateStoryWithAudio(storyId: any, audioUrl: any, duration: any) {
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