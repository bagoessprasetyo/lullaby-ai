// components/story-creation/async-generator.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  AlertCircle, 
  Check, 
  Sparkles, 
  Loader2,
  Image as ImageIcon,
  BookOpen,
  Mic,
  Music,
  RefreshCw
} from "lucide-react";
import { StoryFormData } from "@/app/dashboard/create/page";
import { createApiServices } from "@/lib/api/apiService";
import { generateStory, pollStoryStatus } from "@/lib/api/storyGeneration";
import { useToast } from "@/components/ui/use-toast";
import { useUpgradeModal } from "@/hooks/useUpgradeModal";
import { rateLimiter } from "@/lib/rate-limiter";
import { GenerateStoryResponse } from "@/lib/api/storyGeneration";

interface AsyncGeneratorProps {
  formData: StoryFormData;
  onReset: () => void;
}

export function AsyncStoryGenerator({ formData, onReset }: AsyncGeneratorProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const { openModal } = useUpgradeModal();
  
  // State for generation process
  const [storyId, setStoryId] = useState<string | null>(null);
  const [status, setStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');
  const [progress, setProgress] = useState(0);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [overallTimeout, setOverallTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Start generation when component mounts
  useEffect(() => {
    let isMounted = true;
    const runGeneration = async () => {
      if (isMounted) {
        await startGeneration();
        
        // Set an overall timeout for the entire generation process (3 minutes)
        const timeout = setTimeout(() => {
          if (isMounted && status !== 'completed') {
            console.log('Generation timed out after 3 minutes');
            
            // If we have a storyId but generation is taking too long, redirect to story anyway
            if (storyId) {
              console.log(`Timing out, but we have a storyId (${storyId}). Redirecting...`);
              toast({
                title: "Story partially ready",
                description: "Your story may not have audio yet, but you can view the text. Audio may be added shortly.",
                variant: "default"
              });
              router.push(`/dashboard/stories/${storyId}`);
            } else {
              setGenerationError("Story generation is taking longer than expected. Please try again.");
              setStatus('failed');
            }
          }
        }, 3 * 60 * 1000); // 3 minutes
        
        setOverallTimeout(timeout);
      }
    };
    
    runGeneration();
    
    return () => {
      isMounted = false;
      
      // Clear the timeout when unmounting
      if (overallTimeout) {
        clearTimeout(overallTimeout);
      }
    };
  }, []); 
  
  // Poll for story status when we have a storyId
  useEffect(() => {
    if (!storyId) return;
    
    // Start polling for status
    const stopPolling = pollStoryStatus(
      storyId,
      (storyData) => {
        // Handle completion
        if (storyData.success && storyData.audioUrl) {
          setStatus('completed');
          setProgress(1.0);
          
          // Navigate to story page after a brief delay
          setTimeout(() => {
            router.push(`/dashboard/stories/${storyId}`);
          }, 1000);
        }
      },
      (progressValue, statusValue) => {
        // Handle progress updates
        setProgress(progressValue);
        setStatus(statusValue as any);
      }
    );
    
    // Clean up polling when unmounted
    return () => {
      stopPolling();
    };
  }, [storyId, router]);

  // Start story generation
  const startGeneration = useCallback(async () => {
    try {
      setIsStarting(true);
      setStoryId(null);
      setGenerationError(null);
      setStatus('pending');
      setProgress(0.05);

      // Skip the rate limiter check in the client, let the server handle it
      /*
      // This was causing the issue - we'll handle rate limiting on the server side only
      try {
        const { success } = await rateLimiter.limit(session?.user?.id || 'anonymous');
        if (!success) {
          throw new Error('You can generate up to 5 stories per minute. Please wait before creating more.');
        }
      } catch (rateLimitError) {
        console.error("Rate limit error:", rateLimitError);
        const message = rateLimitError instanceof Error ? rateLimitError.message : "Rate limit exceeded";
        if (message.includes('5 stories per minute')) {
          setGenerationError(message);
          openModal('story-generation');
        } else {
          setGenerationError(message);
        }
        setStatus('failed');
        setIsStarting(false);
        return;
      }
      */
      
      try {
        // Make a direct fetch request instead of using the helper function
        console.log("Preparing story generation request...");
        
        // Convert images to base64
        const imagePromises = formData.images.map(file => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        });
        
        const images = await Promise.all(imagePromises);
        console.log(`Processed ${images.length} images for upload`);
        
        // Convert characters to the format expected by the API
        const characters = formData.characters.map(character => ({
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
          userId: session?.user?.id || 'anonymous',
        };
        
        console.log("Sending direct fetch request to generate story...");
        
        // Log the request with placeholders (don't log the actual image data)
        console.log("Sending request with payload:", {
          ...payload,
          images: images.map((_, i) => `[Image ${i+1}]`)
        });
        
        // Make the API request with actual image data
        const response = await fetch('/api/stories/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Server error (${response.status}):`, errorText);
          
          // Try to parse error JSON if possible
          try {
            const errorJson = JSON.parse(errorText);
            if (response.status === 429) {
              // Handle rate limiting specifically
              setGenerationError('You can generate up to 5 stories per minute. Please wait before creating more.');
              openModal('story-generation');
              setStatus('failed');
              setIsStarting(false);
              return; // Early return, don't proceed
            } else {
              throw new Error(errorJson.error || `Server error: ${response.status}`);
            }
          } catch (parseError) {
            // If error response is not valid JSON
            console.error("Failed to parse error response:", parseError);
            throw new Error(`Server returned status ${response.status}: ${errorText.substring(0, 100)}`);
          }
        }
        
        // Get response as text first to log it
        const responseText = await response.text();
        console.log("Raw API response:", responseText);
        
        // Parse the response manually
        let jsonResponse;
        try {
          jsonResponse = JSON.parse(responseText);
        } catch (parseError) {
          console.error("Failed to parse response as JSON:", parseError);
          throw new Error("The server returned an invalid response format. Please try again.");
        }
        
        if (jsonResponse.success && jsonResponse.storyId) {
          setStoryId(jsonResponse.storyId);
          setStatus('processing');
          setProgress(0.3);
          console.log(`Successfully started story generation with ID: ${jsonResponse.storyId}`);
        } else {
          throw new Error(jsonResponse.error || "Failed to start generation");
        }
      } catch (apiError) {
        console.error("API error during story generation:", apiError);
        
        // Check for specific error types
        const errorMessage = apiError instanceof Error ? apiError.message : "Unknown error";
        if (errorMessage.includes('JSON.parse') || errorMessage.includes('invalid JSON') || 
            errorMessage.includes('invalid response format')) {
          setGenerationError("The server returned an invalid response. This is often caused by temporary issues with the AI service. Please try again.");
        } else {
          setGenerationError(errorMessage);
        }
        setStatus('failed');
      }
    } catch (error) {
      console.error("Error starting generation:", error);
      const message = error instanceof Error ? error.message : "Failed to start story generation";
      setGenerationError(message);
      setStatus('failed');
    } finally {
      setIsStarting(false);
    }
  }, [session, formData, openModal, router]);
  
  // Get current step description
  const getStepDescription = () => {
    if (status === 'pending') return "Preparing to create your story...";
    if (status === 'failed') return "Story generation failed.";
    
    // If we've been waiting a long time, show a different message
    if (progress > 0.85 && !storyId) {
      return "Almost there! Finalizing your story...";
    }
    
    if (progress < 0.2) return "Analyzing your images...";
    if (progress < 0.4) return "Crafting your story...";
    if (progress < 0.6) return "Creating character dialog...";
    if (progress < 0.8) return "Converting story to speech...";
    if (progress < 0.9) return "Adding background music...";
    return "Finalizing your story...";
  };
  
  // Get step icon
  const getStepIcon = () => {
    if (status === 'failed') return <AlertCircle className="h-5 w-5 text-red-500" />;
    if (status === 'completed') return <Check className="h-5 w-5 text-green-500" />;
    
    if (progress < 0.2) return <ImageIcon className="h-5 w-5 text-blue-500" />;
    if (progress < 0.4) return <BookOpen className="h-5 w-5 text-indigo-500" />;
    if (progress < 0.6) return <BookOpen className="h-5 w-5 text-violet-500" />;
    if (progress < 0.8) return <Mic className="h-5 w-5 text-purple-500" />;
    if (progress < 0.9) return <Music className="h-5 w-5 text-pink-500" />;
    return <Sparkles className="h-5 w-5 text-amber-500" />;
  };
  
  return (
    <div className="space-y-8 py-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-3">Creating Your Story</h3>
        <p className="text-gray-400 mb-1">
          {getStepDescription()}
        </p>
        
        {progress > 0 && progress < 1 && status === 'processing' && (
          <p className="text-xs text-indigo-400 mt-1">
            <RefreshCw className="h-3 w-3 inline-block mr-1 animate-spin" />
            Processing your story...
          </p>
        )}
      </div>
      
      {/* Progress visualization */}
      <div className="max-w-md mx-auto">
        <div className="relative pt-4 pb-2">
          <Progress 
            value={progress * 100} 
            className="h-3 bg-gray-800"
          />
          <div 
            className="absolute flex items-center justify-center rounded-full bg-indigo-600 p-2 -top-2 transition-all"
            style={{ 
              left: `calc(${Math.max(2, Math.min(98, progress * 100))}% - 16px)`,
              display: status === 'completed' ? 'none' : 'flex' 
            }}
          >
            {getStepIcon()}
          </div>
        </div>
        
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Analyzing</span>
          <span>Creating</span>
          <span>Finalizing</span>
        </div>
      </div>
      
      {/* Error message */}
      {generationError && (
        <Alert variant="destructive" className="max-w-md mx-auto bg-red-900/20 border-red-800">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-300">
            {generationError}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Action buttons */}
      <div className="flex justify-center gap-3 mt-8">
        {status === 'failed' ? (
          <>
            <Button 
              variant="outline" 
              className="border-gray-800"
              onClick={onReset}
            >
              Change Settings
            </Button>
            <Button 
              onClick={startGeneration}
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={isStarting}
            >
              {isStarting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Restarting...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </>
              )}
            </Button>
          </>
        ) : (
          <Button 
            variant="outline" 
            className="border-gray-800"
            onClick={onReset}
            disabled={status === 'completed'}
          >
            Cancel
          </Button>
        )}
      </div>
      
      {/* Generation details (can be expanded for debugging) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 text-xs text-gray-500 max-w-md mx-auto">
          <p>Story ID: {storyId || 'Not started'}</p>
          <p>Status: {status}</p>
          <p>Progress: {Math.round(progress * 100)}%</p>
        </div>
      )}
    </div>
  );
}