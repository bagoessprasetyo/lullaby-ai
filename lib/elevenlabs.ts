// lib/elevenlabs.ts

/**
 * Generate audio from text using ElevenLabs TTS API
 * This version includes enhanced error handling and debugging
 */
export async function generateStoryAudio(storyText: string, voiceId: string) {
    console.log('[TTS] Starting audio generation process');
    console.log(`[TTS] Voice ID: ${voiceId}`);
    console.log(`[TTS] Text length: ${storyText.length} characters`);
    
    try {
      // Split long text into paragraphs if it's very long (ElevenLabs has limitations)
      let textToProcess = storyText;
      if (storyText.length > 5000) {
        console.log('[TTS] Text exceeds 5000 characters, truncating to the nearest paragraph break');
        // Get first 5000 characters, but make sure we end at a paragraph
        const firstPart = storyText.substring(0, 5000);
        const lastParagraphEnd = firstPart.lastIndexOf('\n\n');
        if (lastParagraphEnd > 2000) {
          textToProcess = storyText.substring(0, lastParagraphEnd + 2);
          console.log(`[TTS] Text truncated to ${textToProcess.length} characters`);
        }
      }
  
      console.log('[TTS] Sending request to TTS API endpoint');
      // Use a unique label for each call by adding a timestamp
      const timeLabel = `tts-api-call-${Date.now()}`;
      console.time(timeLabel);
      
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: textToProcess,
          voiceId: voiceId
        })
      });
      
      console.timeEnd(timeLabel);
      console.log(`[TTS] Response status: ${response.status} ${response.statusText}`);
  
      // First try to get the response as text for debugging
      const responseClone = response.clone();
      let responseText;
      try {
        responseText = await responseClone.text();
        console.log(`[TTS] Response preview: ${responseText.substring(0, 150)}...`);
      } catch (textError) {
        console.error('[TTS] Could not read response as text:', textError);
      }
  
      if (!response.ok) {
        console.error('[TTS] API returned error status:', response.status);
        
        // Parse the error response
        let errorMessage;
        try {
          const errorData = JSON.parse(responseText || '{}');
          errorMessage = errorData.error || `Failed to generate audio: ${response.status}`;
          console.error('[TTS] Error details:', errorData);
        } catch (parseError) {
          errorMessage = `Failed to generate audio: ${response.status} - ${responseText?.substring(0, 100) || 'No details'}`;
          console.error('[TTS] Error parsing response:', parseError);
        }
        
        throw new Error(errorMessage);
      }
  
      // Parse the JSON response
      let data;
      try {
        data = await response.json();
        console.log('[TTS] Successfully parsed response JSON');
      } catch (jsonError) {
        console.error('[TTS] Failed to parse response as JSON:', jsonError);
        throw new Error('Failed to parse audio response');
      }
      
      if (!data.success) {
        console.error('[TTS] API returned success: false', data.error);
        throw new Error(data.error || 'Failed to generate audio');
      }
      
      if (!data.audioData) {
        console.error('[TTS] API response missing audioData field');
        throw new Error('No audio data returned from API');
      }
      
      // Verify the format of the audio data
      if (!data.audioData.startsWith('data:audio/')) {
        console.error('[TTS] Audio data has invalid format:', data.audioData.substring(0, 30));
        throw new Error('Invalid audio data format received');
      }
      
      const audioDataSize = data.audioData.length;
      console.log(`[TTS] Audio generation successful, received ${audioDataSize} bytes of data`);
      
      // Validate audio data
      if (audioDataSize < 1000) {
        console.warn('[TTS] Warning: Audio data is suspiciously small, might be invalid');
      }
      
      return data.audioData;
    } catch (error) {
      console.error('[TTS] Error generating story audio:', error);
      throw error; // Propagate the error upward
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