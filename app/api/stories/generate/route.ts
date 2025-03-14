// app/api/stories/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { getAdminClient } from '@/lib/supabase';
import { rateLimiter } from '@/lib/rate-limiter';
import { analyzeImagesWithOpenAI, generateStoryWithOpenAI, generateTitleForStory } from '@/lib/openai';
import { buildEnhancedStoryPrompt } from '@/lib/story-generation';

// Move Cloudinary configuration to runtime
const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
};

// Duration lengths in words
const DURATION_LENGTHS = {
  short: 300, // ~2 minutes
  medium: 600, // ~4 minutes
  long: 900,  // ~6 minutes
};

// Add this GET handler at the top of your file
export async function GET() {
  // This is just a placeholder to make Vercel's build process happy
  // It will never be called in production, only during build
  return new Response(JSON.stringify({ message: "This endpoint only accepts POST requests" }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Your existing POST handler remains unchanged
export async function POST(req: NextRequest) {
  try {
    // Configure Cloudinary at runtime instead of during build
    configureCloudinary();
    
    console.log('[API] Story generation request received');
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log('[API] Unauthorized request');
      return new NextResponse(
        JSON.stringify({ success: false, error: 'Unauthorized' }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const userId = session.user.id;
    console.log(`[API] Authenticated user: ${userId}`);
    
    // Apply rate limiting
    try {
      console.log('[API] Checking rate limit...');
      const { success, limit, reset, remaining } = await rateLimiter.limit(userId);
      
      console.log(`[API] Rate limit status: ${success ? 'OK' : 'Exceeded'}, remaining: ${remaining}, limit: ${limit}, reset: ${reset}`);
      
      if (!success) {
        console.log('[API] Rate limit exceeded');
        return new NextResponse(
          JSON.stringify({ 
            success: false, 
            error: 'Rate limit exceeded. You can generate up to 5 stories per minute. Please wait before creating more.',
            remaining,
            limit,
            reset
          }), 
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } catch (rateLimitError) {
      console.error('[API] Rate limit check error:', rateLimitError);
      // Continue even if rate limiting fails - better user experience than blocking due to rate limiter errors
    }
    
    // Parse request body
    let body;
    try {
      const rawBody = await req.text();
      console.log(`[API] Request body size: ${rawBody.length} characters`);
      
      try {
        body = JSON.parse(rawBody);
      } catch (parseError) {
        console.error('[API] Failed to parse request body:', parseError);
        return new NextResponse(
          JSON.stringify({ 
            success: false, 
            error: 'Invalid JSON in request body' 
          }), 
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } catch (bodyError) {
      console.error('[API] Error reading request body:', bodyError);
      return new NextResponse(
        JSON.stringify({ 
          success: false, 
          error: 'Error reading request body' 
        }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
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
    if (!theme || !duration || !language || !voice) {
      console.log('[API] Missing required fields');
      return new NextResponse(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields' 
        }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`[API] Generating story with theme: ${theme}, language: ${language}, duration: ${duration}, voice: ${voice}`);
    
    // Generate a unique ID for the story
    const storyId = uuidv4();
    console.log(`[API] Generated story ID: ${storyId}`);
    
    // Upload images to Cloudinary if provided
    const imageUrls = [];
    
    if (images && images.length > 0) {
      console.log(`[API] Uploading ${images.length} images to Cloudinary`);
      try {
        for (let i = 0; i < images.length; i++) {
          const imageData = images[i];
          
          // Skip invalid images
          if (!imageData || typeof imageData !== 'string' || !imageData.startsWith('data:')) {
            console.warn(`[API] Skipping invalid image at index ${i}`);
            continue;
          }
          
          try {
            const uploadResult: { secure_url: string } = await cloudinary.uploader.upload(imageData, {
              folder: 'story-app-stories',
              public_id: `${storyId}-${imageUrls.length + 1}`
            });
            
            imageUrls.push(uploadResult.secure_url);
            console.log(`[API] Successfully uploaded image ${imageUrls.length}`);
          } catch (singleUploadError) {
            console.error(`[API] Error uploading image ${i+1}:`, singleUploadError);
            // Continue with other images even if one fails
          }
        }
        
        console.log(`[API] Successfully uploaded ${imageUrls.length} images`);
        
        // If no images were successfully uploaded, use placeholder URLs
        if (imageUrls.length === 0) {
          console.log('[API] No images were successfully uploaded, using placeholder');
          imageUrls.push('https://placehold.co/600x400?text=Story+Image');
        }
      } catch (uploadError) {
        console.error('[API] Error in image upload process:', uploadError);
        // Don't fail the whole request, just proceed with a placeholder image
        imageUrls.push('https://placehold.co/600x400?text=Story+Image');
      }
    } else {
      // If no images were provided, use a placeholder
      console.log('[API] No images provided, using placeholder');
      imageUrls.push('https://placehold.co/600x400?text=Story+Image');
    }
    
    // Analyze images with OpenAI Vision API
    let imageAnalysis = null;
    if (imageUrls.length > 0) {
      console.log('[API] Analyzing images with OpenAI Vision API');
      try {
        // Call the enhanced image analysis
        imageAnalysis = await analyzeImagesWithOpenAI(imageUrls);
        console.log('[API] Image analysis complete:', imageAnalysis.length, 'results');
      } catch (analysisError) {
        console.error('[API] Error analyzing images:', analysisError);
        // Continue even if analysis fails - we'll generate without analysis
        console.log('[API] Continuing without image analysis');
      }
    }
    
    // Generate story using OpenAI with enhanced prompt
    console.log('[API] Generating story content');
    let storyData;
    try {
      // Create enhanced prompt
      const prompt = buildEnhancedStoryPrompt({
        imageAnalysis,
        characters,
        theme,
        duration,
        language
      });
      
      console.log('[API] Enhanced prompt created, length:', prompt.length);
      
      // Use OpenAI to generate the story
      if (process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY) {
        console.log('[API] Using AI for story generation');
        storyData = await generateStoryWithOpenAI(prompt);
        
        // If there's a title but it's in English for a non-English story,
        // or we couldn't extract a title from the content, generate a dedicated title
        const needsNewTitle = 
          // No title was generated
          (storyData.title === "Bedtime Adventure" || !storyData.title) || 
          // Story language isn't English but title contains only English characters
          (language.toLowerCase() !== 'english' && /^[a-zA-Z0-9\s.,!?'\-"]+$/.test(storyData.title));
          
        if (needsNewTitle) {
          console.log('[API] Generating dedicated title in correct language:', language);
          try {
            // Generate a dedicated title in the correct language
            const newTitle = await generateTitleForStory(storyData.content, language.toLowerCase());
            storyData.title = newTitle;
            console.log('[API] New title generated:', newTitle);
          } catch (titleError) {
            console.error('[API] Error generating title:', titleError);
            // Keep original title if title generation fails
          }
        }
      } else {
        console.log('[API] AI API key not configured, using fallback generation');
        // We need a fallback here when AI isn't available
        storyData = {
          title: `The ${theme.charAt(0).toUpperCase() + theme.slice(1)} Adventure`,
          content: `Once upon a time, there was a wonderful ${theme} adventure waiting to happen.
          
A child named ${characters?.[0]?.name || 'Alex'} discovered something magical.

It was a day filled with wonder and joy. The sun shined brightly, and birds sang beautiful songs.

After exploring and learning many new things, it was time to go home and rest.

And they all lived happily ever after.`
        };
      }
      
      console.log('[API] Story generation complete, title:', storyData.title);
    } catch (generationError) {
      console.error('[API] Error generating story:', generationError);
      return new NextResponse(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to generate story content'
        }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Generate audio using ElevenLabs
    let audioUrl = null;
    try {
      console.log('[API] Generating audio narration with ElevenLabs');
      console.time('elevenlabs-tts');
      
      // Call ElevenLabs API
      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) {
        throw new Error('ELEVENLABS_API_KEY is not configured');
      }
      
      // Limit text length to avoid issues with ElevenLabs API
      let textToProcess = storyData.content;
      if (textToProcess.length > 5000) {
        console.log('[API] Text exceeds 5000 characters, truncating to the nearest paragraph break');
        // Get first 5000 characters, but make sure we end at a paragraph
        const firstPart = textToProcess.substring(0, 5000);
        const lastParagraphEnd = firstPart.lastIndexOf('\n\n');
        if (lastParagraphEnd > 2000) {
          textToProcess = textToProcess.substring(0, lastParagraphEnd + 2);
          console.log(`[API] Text truncated to ${textToProcess.length} characters`);
        }
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
      console.log(`[API] Using language code: ${languageCode} for language: ${language}`);
      
      // Call ElevenLabs API
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey
        },
        body: JSON.stringify({
          text: textToProcess,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
          language_code: languageCode
        })
      });
      
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
        
        throw new Error(errorMessage);
      }
      
      // Upload audio to Cloudinary
      const audioBuffer = await response.arrayBuffer();
      console.log(`[API] Successfully received audio (${audioBuffer.byteLength} bytes)`);
      
      const audioBase64 = `data:audio/mpeg;base64,${Buffer.from(audioBuffer).toString('base64')}`;
      
      const uploadResult = await cloudinary.uploader.upload(audioBase64, {
        resource_type: 'auto',
        folder: 'story-app-audio',
        public_id: `${storyId}-audio`,
        overwrite: true
      });
      
      audioUrl = uploadResult.secure_url;
      console.log(`[API] Audio uploaded to Cloudinary: ${audioUrl}`);
      console.timeEnd('elevenlabs-tts');
      
    } catch (audioError) {
      console.error('[API] Error generating or uploading audio:', audioError);
      // Continue without audio, but log the error
      // The client will handle missing audio gracefully
    }
    
    // Store story in database
    console.log('[API] Storing story in database');
    try {
      const adminClient = getAdminClient();
      
      // If backgroundMusic is provided but not a valid UUID, look it up by category
      let backgroundMusicId = null;
      if (backgroundMusic) {
        // Check if it's already a valid UUID
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (uuidPattern.test(backgroundMusic)) {
          // It's already a UUID, use it directly
          backgroundMusicId = backgroundMusic;
        } else {
          // It's a category name, look up the first matching track
          console.log(`[API] Looking up background music by category: ${backgroundMusic}`);
          try {
            const { data: musicData, error: musicError } = await adminClient
              .from('background_music')
              .select('id')
              .eq('category', backgroundMusic)
              .limit(1)
              .single();
            
            if (musicError || !musicData) {
              console.error('[API] Error finding background music:', musicError);
            } else {
              backgroundMusicId = musicData.id;
              console.log(`[API] Found background music ID: ${backgroundMusicId}`);
            }
          } catch (musicLookupError) {
            console.error('[API] Exception finding background music:', musicLookupError);
          }
        }
      }
      
      // Convert duration string to seconds
      let durationSeconds = 300; // Default to 5 minutes (300 seconds)
      if (duration && typeof duration === 'string') {
        if (duration in DURATION_LENGTHS) {
          durationSeconds = DURATION_LENGTHS[duration as keyof typeof DURATION_LENGTHS];
          console.log(`[API] Converted duration "${duration}" to ${durationSeconds} seconds`);
        } else {
          // Try parsing as an integer directly
          const parsedDuration = parseInt(duration, 10);
          if (!isNaN(parsedDuration)) {
            durationSeconds = parsedDuration;
            console.log(`[API] Using numeric duration: ${durationSeconds} seconds`);
          } else {
            console.warn(`[API] Unknown duration value: ${duration}, using default of ${durationSeconds} seconds`);
          }
        }
      }
      
      // First, create the story record
      const { data: story, error } = await adminClient
        .from('stories')
        .insert({
          id: storyId,
          user_id: userId,
          title: storyData.title,
          text_content: storyData.content,
          theme,
          duration: durationSeconds, // Using the converted integer value
          language,
          audio_url: audioUrl, // Save the actual audio URL
          background_music_id: backgroundMusicId, // Using the resolved UUID or null
          voice_profile_id: null, // Default to system voice
          storage_path: audioUrl ? `story-app-audio/${storyId}-audio` : null
        })
        .select()
        .single();
        
      if (error) {
        console.error('[API] Error storing story in database:', error);
        return new NextResponse(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to store story in database' 
          }), 
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // Then, store images in the images table
      if (imageUrls.length > 0) {
        console.log('[API] Storing image records');
        
        const imageRecords = imageUrls.map((url, index) => ({
          story_id: storyId,
          user_id: userId,
          storage_path: url,
          sequence_index: index + 1,
          analysis_result: imageAnalysis && imageAnalysis[index] ? imageAnalysis[index] : null
        }));
        
        const { error: imagesError } = await adminClient
          .from('images')
          .insert(imageRecords);
          
        if (imagesError) {
          console.error('[API] Error storing image records:', imagesError);
          // Continue despite image storage error - the story was created successfully
        }
      }
      
      // Store character data
      if (characters && characters.length > 0) {
        console.log('[API] Storing character records');
        
        const characterRecords = characters.map((char: { name: any; description: any; }) => ({
          story_id: storyId,
          name: char.name,
          description: char.description || ''
        }));
        
        const { error: charactersError } = await adminClient
          .from('characters')
          .insert(characterRecords);
          
        if (charactersError) {
          console.error('[API] Error storing character records:', charactersError);
          // Continue despite character storage error - the story was created successfully
        }
      }
      
      console.log(`[API] Story stored in database with ID: ${story.id}`);
      
      // Return success response
      const response = {
        success: true,
        storyId: story.id,
        title: storyData.title,
        textContent: storyData.content,
        audioUrl: audioUrl, // Return the real audio URL
        duration: durationSeconds,
      };
      
      console.log('[API] Story generation successful, returning response');
      return new NextResponse(
        JSON.stringify(response), 
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (dbError) {
      console.error('[API] Error in database operations:', dbError);
      return new NextResponse(
        JSON.stringify({ 
          success: false, 
          error: 'Database error during story creation' 
        }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('[API] Unhandled error in story generation route:', error);
    return new NextResponse(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to generate story', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}