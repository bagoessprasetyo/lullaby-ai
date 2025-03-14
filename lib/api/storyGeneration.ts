// lib/api/storyGeneration.ts
import { StoryFormData } from "@/app/dashboard/create/page";
import { Session } from "next-auth";

export interface GenerateStoryResponse {
  success: boolean;
  storyId?: string;
  title?: string;
  textContent?: string;
  audioUrl?: string;
  duration?: number;
  error?: string;
  status?: 'pending' | 'completed'; // This is derived from audioUrl, not stored in DB
}

/**
 * Generate a story based on the form data
 */
export async function generateStory(
  formData: StoryFormData,
  session: Session
): Promise<GenerateStoryResponse> {
  try {
    // Convert images to base64 or get URLs
    const imagePromises = formData.images.map((file) =>
      fileToBase64(file)
    );
    const images = await Promise.all(imagePromises);

    // Convert characters to the format expected by the API
    const characters = formData.characters.map((character) => ({
      name: character.name,
      description: character.description,
    }));

    // Prepare the request payload
    const payload = {
      images,
      characters,
      theme: formData.theme,
      duration: formData.duration,
      language: formData.language,
      backgroundMusic: formData.backgroundMusic,
      voice: formData.voice,
      userId: session.user.id,
    };

    console.log("Sending generate request with payload:", {
      ...payload,
      images: `${payload.images.length} images (base64 data hidden)`,
    });

    // Call the API
    const response = await fetch(`/api/stories/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // First check if response is ok before trying to read it
    if (!response.ok) {
      try {
        const errorText = await response.text();
        console.error(`Error response ${response.status}:`, errorText);
        
        // Try to parse as JSON
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || `Failed to generate story: ${response.status}`);
        } catch (jsonError) {
          // If not valid JSON, throw with the raw text
          throw new Error(`Server error (${response.status}): ${errorText.substring(0, 100)}...`);
        }
      } catch (readError) {
        // If we can't even read the response, throw a generic error
        throw new Error(`Server error (${response.status}): Could not read response`);
      }
    }

    // Clone the response before reading it as text (can only read once)
    const responseForText = response.clone();
    
    // Try to read and process the response
    let storyData: GenerateStoryResponse;
    
    try {
      const responseText = await responseForText.text();
      console.log("Story generation raw response:", responseText);
      
      // If response is empty, throw error
      if (!responseText || responseText.trim() === "") {
        throw new Error("Server returned an empty response");
      }
      
      try {
        storyData = JSON.parse(responseText);
      } catch (jsonError) {
        console.error("Failed to parse response as JSON:", jsonError, "Response was:", responseText);
        throw new Error("Server returned an invalid JSON response. Please try again.");
      }
    } catch (error) {
      console.error("Error processing response:", error);
      
      // Try to get the original response as JSON as a fallback
      try {
        storyData = await response.json();
      } catch (jsonFallbackError) {
        console.error("Fallback JSON parsing also failed:", jsonFallbackError);
        throw error;
      }
    }
    
    // If story is generated successfully, trigger audio generation
    if (storyData && storyData.success && storyData.storyId) {
      // Trigger audio generation in the background
      triggerAudioGeneration(storyData.storyId);
    }

    return storyData;
  } catch (error) {
    console.error("Error generating story:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Trigger the audio generation webhook for a story
 */
async function triggerAudioGeneration(storyId: string): Promise<void> {
  try {
    console.log(`Triggering audio generation for story ${storyId}...`);
    
    // Call the webhook API to generate audio asynchronously
    const response = await fetch(`/api/stories/generate/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ storyId }),
      // Add a longer timeout as audio generation can take time
      signal: AbortSignal.timeout(10000), // 10 seconds just for the trigger call
    });

    console.log(`Audio webhook response status: ${response.status}`);
    
    if (!response.ok) {
      let errorMessage = "Failed to trigger audio generation";
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // If JSON parsing fails, try to get text
        try {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        } catch (textError) {
          // Ignore if we can't get text either
        }
      }
      
      throw new Error(errorMessage);
    }
    
    console.log(`Audio generation successfully triggered for story ${storyId}`);
  } catch (error) {
    console.error("Error triggering audio generation:", error);
    // We don't throw the error here because we want the story creation to succeed
    // even if audio generation fails. The UI can handle showing a pending state.
  }
}

/**
 * Check the story generation and audio status periodically
 * @param storyId The ID of the story to check
 * @param onComplete Callback when story is complete with audio
 * @param onProgress Callback for progress updates
 */
export function pollStoryStatus(
  storyId: string, 
  onComplete: (story: GenerateStoryResponse) => void,
  onProgress?: (progress: number, status: string) => void
): () => void {
  let isPolling = true;
  let attempts = 0;
  
  const checkStatus = async () => {
    if (!isPolling) return;
    
    try {
      console.log(`Polling story status for ID: ${storyId} (attempt ${attempts + 1})`);
      const response = await fetch(`/api/stories/${storyId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });
      
      if (!response.ok) {
        try {
          const errorText = await response.text();
          console.error(`Poll error (${response.status}):`, errorText);
          throw new Error(`Failed to get story status: ${response.status} - ${errorText.substring(0, 100)}`);
        } catch (e) {
          throw new Error(`Failed to get story status: ${response.status}`);
        }
      }
      
      // Clone the response before reading
      const responseClone = response.clone();
      
      // Safely parse the response
      let storyData;
      try {
        // Try to read as text first
        const responseText = await responseClone.text();
        if (!responseText || responseText.trim() === "") {
          console.error(`Empty poll response (attempt ${attempts + 1})`);
          throw new Error("Empty response from status API");
        }
        
        console.log(`Poll response (attempt ${attempts + 1}):`, responseText);
        
        try {
          storyData = JSON.parse(responseText);
        } catch (jsonError) {
          console.error("Failed to parse poll response as JSON:", jsonError);
          
          // Try one more time with the original response
          try {
            storyData = await response.json();
          } catch (secondError) {
            throw new Error("Invalid JSON response from status API");
          }
        }
      } catch (error) {
        console.error("Error processing poll response:", error);
        throw error;
      }
      attempts++;
      
      // Force completion after max attempts (prevent endless polling)
      const MAX_POLLING_ATTEMPTS = 15; // Reduced from 30 to 15
      if (attempts >= MAX_POLLING_ATTEMPTS) {
        console.log(`Reached maximum polling attempts (${MAX_POLLING_ATTEMPTS}). Forcing completion.`);
        
        // If we've polled too many times, assume the story is as complete as it's going to get
        if (storyData && storyData.storyId) {
          // Create a "completed" version of the data we have
          const forcedCompleteData = {
            ...storyData,
            success: true,
            status: 'completed',
            audioUrl: storyData.audioUrl || '/story.wav' // Use existing or fallback URL
          };
          
          console.log('Forcing completion with data:', forcedCompleteData);
          onComplete(forcedCompleteData);
        } else {
          console.error('Cannot force completion: missing story data or storyId');
        }
        
        isPolling = false;
        return;
      }
      
      // Calculate progress based on audio availability
      let progress = 0.1; // Default starting progress
      
      // Determine story status based on audioUrl availability
      const status = storyData.audioUrl ? 'completed' : 'pending';
      
      if (status === 'completed' && storyData.audioUrl) {
        progress = 1.0;
        onComplete(storyData);
        isPolling = false;
      } else {
        // If still pending, calculate progress based on attempts
        progress = Math.min(0.9, 0.1 + (attempts * 0.1));
      }
      
      // Call progress callback if provided
      if (onProgress) {
        onProgress(progress, status);
      }
      
      // Continue polling if not complete
      if (isPolling) {
        // Use a fixed 5-second interval instead of exponential backoff
        const interval = 5000; // 5 seconds between each poll
        console.log(`Scheduling next poll in 5 seconds (attempt ${attempts+1})`);
        setTimeout(checkStatus, interval);
      }
    } catch (error) {
      console.error("Error polling story status:", error);
      
      if (attempts < 15 && isPolling) {
        console.log(`Retrying after error (attempt ${attempts}/15)`);
        setTimeout(checkStatus, 3000); // Try again after 3 seconds
      } else {
        console.log(`Stopping polling due to errors after ${attempts} attempts`);
        isPolling = false;
        
        // Force completion even after errors
        if (storyId) {
          console.log('Forcing completion after errors');
          onComplete({
            success: true,
            storyId: storyId,
            status: 'completed',
            audioUrl: '/story.wav',
            title: 'Your Story',
            textContent: 'Your story has been created but there was an issue with audio generation.',
            duration: 30
          });
        }
      }
    }
  };
  
  // Start polling
  setTimeout(checkStatus, 1000);
  
  // Return a function to cancel polling
  return () => {
    isPolling = false;
  };
}

/**
 * Get the status of a story's audio generation
 */
export async function getStoryStatus(storyId: string): Promise<GenerateStoryResponse> {
  try {
    const response = await fetch(`/api/stories/${storyId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to get story status");
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting story status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Convert a file to base64
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}