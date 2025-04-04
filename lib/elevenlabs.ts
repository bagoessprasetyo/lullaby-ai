// lib/elevenlabs.ts

/**
 * Generate audio from text using ElevenLabs TTS API
 * This version includes enhanced error handling and debugging
 */
export async function generateStoryAudio(storyText: string, voiceId: string, language: string = 'english') {
    console.log('[TTS] Starting audio generation process');
    console.log(`[TTS] Voice ID: ${voiceId}`);
    console.log(`[TTS] Text length: ${storyText.length} characters`);
    console.log(`[TTS] Language: ${language}`);
    
    try {
      // Split long text into paragraphs if it's very long (ElevenLabs has limitations)
      let textToProcess = storyText;
      if (storyText.length > 5000) {
        console.log('[TTS] Text exceeds 5000 characters, truncating to the nearest paragraph break');
        // Get first 5000 characters, but make sure we end at a paragraph
        const firstPart = storyText.substring(0, 5000);
        const lastParagraphBreak = firstPart.lastIndexOf('\n\n');
        if (lastParagraphBreak > 0) {
          textToProcess = storyText.substring(0, lastParagraphBreak);
        } else {
          // If no paragraph break, try to find a sentence break
          const lastSentenceBreak = Math.max(
            firstPart.lastIndexOf('. '),
            firstPart.lastIndexOf('! '),
            firstPart.lastIndexOf('? ')
          );
          if (lastSentenceBreak > 0) {
            textToProcess = storyText.substring(0, lastSentenceBreak + 1);
          } else {
            textToProcess = firstPart;
          }
        }
        console.log(`[TTS] Truncated text to ${textToProcess.length} characters`);
      }
      
      // Make a direct call to ElevenLabs API instead of using the /api/tts endpoint
      const elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;
      
      if (!elevenlabsApiKey) {
        console.error('[TTS] ELEVENLABS_API_KEY is not configured properly');
        throw new Error('ELEVENLABS_API_KEY is not configured properly');
      }
      
      // Map voice selection to ElevenLabs voice IDs
      const voiceMap: Record<string, string> = {
        default: '21m00Tcm4TlvDq8ikWAM', // Rachel
        female: '21m00Tcm4TlvDq8ikWAM',  // Rachel
        male: 'AZnzlk1XvdvUeBnXmlld',    // Sam
        child: 'XB0fDUnXU5powFXDhCwa',   // Elli
        storyteller: 'pNInz6obpgDQGcFmaJgB', // Daniel
        custom: voiceId // Use the provided ID directly
      };
      
      // Determine which voice ID to use
      const finalVoiceId = voiceMap[voiceId] || voiceId;
      
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
      console.log(`[TTS] Using language code: ${languageCode} for language: ${language}`);
      
      console.log(`[TTS] Using ElevenLabs voice ID: ${finalVoiceId}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minute timeout
      
      // Make the API call to ElevenLabs
      console.log('[TTS] Sending request to ElevenLabs API');
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${finalVoiceId}?output_format=mp3_44100_128`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': elevenlabsApiKey
        },
        body: JSON.stringify({
          text: textToProcess,
          model_id: 'eleven_turbo_v2_5', // Updated to use newer model
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          },
          language_code: languageCode
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId); // Clear the timeout if the request completes before it's reached
      
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
      console.log(`[TTS] Received audio buffer of size: ${audioBuffer.byteLength} bytes`);
      
      // If buffer size is too small, it might indicate an error
      if (audioBuffer.byteLength < 1000) {
        console.warn('[TTS] Warning: Audio buffer is suspiciously small, might be invalid');
        throw new Error('Generated audio file is too small to be valid');
      }
      
      const audioBase64 = Buffer.from(audioBuffer).toString('base64');
      const audioUrl = `data:audio/mpeg;base64,${audioBase64}`;
      
      return { 
        audioUrl, 
        success: true 
      };
    } catch (error) {
      console.error('[TTS] Error generating audio:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('[TTS] ElevenLabs API request timed out after 3 minutes');
      }
      throw error;
    }
}
  
/**
 * Play a voice sample from ElevenLabs
 */
export async function playVoiceSample(voiceId: string, previewUrl?: string) {
  console.log(`[TTS] Playing voice sample for voice ID: ${voiceId}`);
  
  try {
    // If we have a preview URL, use that directly
    if (previewUrl) {
      console.log(`[TTS] Using provided preview URL: ${previewUrl}`);
      const audio = new Audio(previewUrl);
      
      // Add error handling for preview playback
      audio.onerror = (e) => {
        console.error('[TTS] Error playing voice preview:', e);
      };
      
      await audio.play();
      return audio;
    }
    
    // Otherwise, fetch voice details to get the preview URL
    console.log(`[TTS] Fetching voice details for voice ID: ${voiceId}`);
    const response = await fetch(`/api/voices?id=${voiceId}`);
    
    if (!response.ok) {
      console.error(`[TTS] Failed to fetch voice details: ${response.status}`);
      throw new Error(`Failed to fetch voice details: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success || !data.voice) {
      console.error('[TTS] Voice details API returned error or missing voice data');
      throw new Error('Failed to get voice details');
    }
    
    const voice = data.voice;
    
    if (!voice.preview_url) {
      console.error('[TTS] No preview URL available for this voice');
      throw new Error('No preview available for this voice');
    }
    
    console.log(`[TTS] Playing preview from URL: ${voice.preview_url}`);
    const audio = new Audio(voice.preview_url);
    
    // Add error handling for preview playback
    audio.onerror = (e) => {
      console.error('[TTS] Error playing voice preview:', e);
    };
    
    await audio.play();
    return audio;
  } catch (error) {
    console.error('[TTS] Error playing voice sample:', error);
    throw error;
  }
}