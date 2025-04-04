// components/story-creation/async-generator-enhanced.tsx
"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { StoryAudioPlayer } from "./story-audio-player";
import {
  CheckCircle2,
  Loader2,
  RefreshCw,
  RotateCcw,
  Volume2,
  XCircle,
  AlertTriangle,
  Upload,
  Sparkles,
  FileText
} from "lucide-react";
import { StoryFormData } from "@/app/dashboard/create/page";
import { cn } from "@/lib/utils";

// Enhanced interface that includes image analysis data
interface EnhancedStoryGeneratorProps {
  formData: StoryFormData;
  onReset: () => void;
  autoGenerate?: boolean; // Add optional prop to control automatic generation
  triggerGeneration?: number; // A number that changes to trigger story generation
}

export function EnhancedStoryGenerator({
  formData,
  onReset,
  autoGenerate = true, // Default to true for backward compatibility
  triggerGeneration = 0 // Default to 0
}: EnhancedStoryGeneratorProps) {
  const [status, setStatus] = useState<"pending" | "analyzing" | "generating" | "audio" | "completed" | "error">("pending");
  const [progress, setProgress] = useState(0);
  const [story, setStory] = useState<{
    id: string;
    title: string;
    content: string;
    audioUrl: string | null;
  } | null>(null);
  const [imageAnalysis, setImageAnalysis] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  // Generate story when component mounts, but only if autoGenerate is true
  useEffect(() => {
    console.log('[Story Generator] Component mounted, autoGenerate:', autoGenerate);
    if (autoGenerate) {
      generateStory();
    }
  }, [autoGenerate]);
  
  // Trigger story generation when triggerGeneration changes
  useEffect(() => {
    if (triggerGeneration > 0) {
      console.log('[Story Generator] Triggered generation externally:', triggerGeneration);
      generateStory();
    }
  }, [triggerGeneration]);

  // Function to convert File to base64
  const fileToBase64 = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Function to generate the story with our enhanced process - exported so it can be called manually
  // const generateStory = async () => {
  //   console.log('[Story Generator] Starting enhanced story generation process');
  //   try {
  //     // Initial state setup
  //     setStatus("analyzing");
  //     setProgress(10);
  //     setError(null);
  //     setErrorDetails(null);

  //     // Set correct status for uploading images
  //     setStatus("analyzing");
  //     console.log('[Story Generator] Preparing to upload images to Cloudinary');
      
  //     // Convert images to base64 for API upload
  //     console.log(`[Story Generator] Converting ${formData.images.length} images to base64`);
  //     const imagePromises = formData.images.map(file => fileToBase64(file));
  //     const images = await Promise.all(imagePromises);

  //     setProgress(25);
  //     console.log('[Story Generator] Images converted successfully, ready for upload');
      
  //     // Image upload will happen in the API call

  //     // Prepare request payload
  //     const payload = {
  //       images,
  //       characters: formData.characters,
  //       theme: formData.theme,
  //       duration: formData.duration,
  //       language: formData.language,
  //       backgroundMusic: formData.backgroundMusic,
  //       voice: formData.voice,
  //     };

  //     console.log('[Story Generator] Payload prepared:', {
  //       theme: payload.theme,
  //       language: payload.language,
  //       voice: payload.voice,
  //       imageCount: images.length,
  //       characterCount: payload.characters.length
  //     });

  //     // Start story generation
  //     setStatus("generating");
  //     setProgress(40);

  //     // Send API request to generate story
  //     console.log('[Story Generator] Sending request to enhanced story generation API');
  //     console.time('story-generation');
      
  //     const response = await fetch('/api/stories/generate', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify(payload),
  //     });
      
  //     console.timeEnd('story-generation');
  //     console.log(`[Story Generator] API response status: ${response.status}`);

  //     // Handle errors in API response
  //     if (!response.ok) {
  //       let errorResponse;
  //       try {
  //         errorResponse = await response.json();
  //         console.error('[Story Generator] API error response:', errorResponse);
  //       } catch (parseError) {
  //         console.error('[Story Generator] Failed to parse API error response:', parseError);
  //         errorResponse = { error: `Error ${response.status}` };
  //       }
        
  //       throw new Error(errorResponse.error || `Error: ${response.status}`);
  //     }

  //     // Process successful response
  //     const data = await response.json();
  //     console.log('[Story Generator] Story generation successful:', {
  //       storyId: data.storyId,
  //       title: data.title,
  //       contentLength: data.textContent?.length,
  //       hasAudio: !!data.audioUrl
  //     });

  //     if (!data.success) {
  //       throw new Error(data.error || 'Story generation failed');
  //     }

  //     setProgress(80);

  //     // Set the story data
  //     setStory({
  //       id: data.storyId,
  //       title: data.title,
  //       content: data.textContent,
  //       audioUrl: data.audioUrl || null
  //     });

  //     // If we have audio, we're done
  //     if (data.audioUrl) {
  //       setStatus("completed");
  //       setProgress(100);
  //       console.log('[Story Generator] Story complete with audio');
  //     } else {
  //       // Otherwise wait for audio generation
  //       setStatus("audio");
  //       console.log('[Story Generator] Waiting for audio generation');
        
  //       // Poll for audio every 5 seconds for up to 2 minutes
  //       let attempts = 0;
  //       const maxAttempts = 24; // 2 minutes at 5 second intervals
        
  //       const checkAudio = async () => {
  //         try {
  //           const audioResponse = await fetch(`/api/stories/${data.storyId}`);
  //           if (audioResponse.ok) {
  //             const storyData = await audioResponse.json();
              
  //             if (storyData.audioUrl) {
  //               // Audio is ready
  //               setStory(prev => prev ? { ...prev, audioUrl: storyData.audioUrl } : null);
  //               setStatus("completed");
  //               setProgress(100);
  //               console.log('[Story Generator] Audio generation completed');
  //               return true;
  //             }
  //           }
  //         } catch (e) {
  //           console.error('[Story Generator] Error checking audio status:', e);
  //         }
          
  //         attempts++;
  //         if (attempts >= maxAttempts) {
  //           console.log('[Story Generator] Audio generation timeout, marking as complete anyway');
  //           setStatus("completed"); 
  //           setProgress(100);
  //           return true;
  //         }
          
  //         // Calculate progress percentage (from 80% to 99%)
  //         const audioProgress = 80 + Math.min(19, (attempts / maxAttempts) * 19);
  //         setProgress(audioProgress);
          
  //         // Try again after delay
  //         setTimeout(checkAudio, 5000);
  //         return false;
  //       };
        
  //       // Start polling
  //       checkAudio();
  //     }
  //   } catch (err) {
  //     console.error('[Story Generator] Error in story generation process:', err);
  //     setError(err instanceof Error ? err.message : 'An unexpected error occurred');
  //     setStatus("error");
  //   }
  // };
  const generateStory = async () => {
    console.log('[Story Generator] Starting story generation process');
    try {
      // Initial state setup
      setStatus("analyzing");
      setProgress(10);
      setError(null);
      setErrorDetails(null);
      
      console.log('[Story Generator] Preparing to upload images');
      
      // Convert images to base64 for API upload
      console.log(`[Story Generator] Converting ${formData.images.length} images to base64`);
      const imagePromises = formData.images.map(file => fileToBase64(file));
      const images = await Promise.all(imagePromises);
      
      setProgress(25);
      console.log('[Story Generator] Images converted successfully, ready for upload');
      
      // Prepare request payload
      const payload = {
        images,
        characters: formData.characters,
        theme: formData.theme,
        duration: formData.duration, // Keep original string format
        language: formData.language,
        backgroundMusic: formData.backgroundMusic,
        voice: formData.voice,
      };
      
      console.log('[Story Generator] Payload prepared:', {
        theme: payload.theme,
        language: payload.language,
        voice: payload.voice,
        imageCount: images.length,
        characterCount: payload.characters.length
      });
      
      // Start story generation
      setStatus("generating");
      setProgress(40);
      
      // Send API request to generate story directly
      console.log('[Story Generator] Sending request to story generation API');
      console.time('story-generation');
      
      // Use a timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout
      
      try {
        const response = await fetch('/api/stories/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        console.timeEnd('story-generation');
        console.log(`[Story Generator] API response status: ${response.status}`);
        
        // Handle errors in API response
        if (!response.ok) {
          let errorResponse;
          try {
            errorResponse = await response.json();
            console.error('[Story Generator] API error response:', errorResponse);
          } catch (parseError) {
            console.error('[Story Generator] Failed to parse API error response:', parseError);
            errorResponse = { error: `Error ${response.status}` };
          }
          
          throw new Error(errorResponse.error || `Error: ${response.status}`);
        }
        
        // Process successful response
        const data = await response.json();
        console.log('[Story Generator] Story generation successful:', {
          storyId: data.storyId,
          title: data.title,
          contentLength: data.textContent?.length,
          hasAudio: !!data.audioUrl
        });
        
        if (!data.success) {
          throw new Error(data.error || 'Story generation failed');
        }
        
        setProgress(80);
        
        // Set the story data
        setStory({
          id: data.storyId,
          title: data.title || 'Your Story',
          content: data.textContent,
          audioUrl: data.audioUrl || null
        });
        
        // If we have audio, we're done
        if (data.audioUrl) {
          console.log('[Story Generator] Story complete with audio');
          setStatus("completed");
          setProgress(100);
        } else {
          // Otherwise wait for audio generation
          setStatus("audio");
          console.log('[Story Generator] Waiting for audio generation');
          
          // Poll for audio every 5 seconds
          let attempts = 0;
          const maxAttempts = 24; // 2 minutes at 5 second intervals
          
          const checkAudio = async () => {
            try {
              const audioResponse = await fetch(`/api/stories/${data.storyId}`);
              if (audioResponse.ok) {
                const storyData = await audioResponse.json();
                
                if (storyData.audioUrl) {
                  // Audio is ready
                  setStory(prev => prev ? { ...prev, audioUrl: storyData.audioUrl } : null);
                  setStatus("completed");
                  setProgress(100);
                  console.log('[Story Generator] Audio generation completed');
                  return true;
                }
              }
            } catch (e) {
              console.error('[Story Generator] Error checking audio status:', e);
            }
            
            attempts++;
            if (attempts >= maxAttempts) {
              console.log('[Story Generator] Audio generation timeout, marking as complete anyway');
              setStatus("completed"); 
              setProgress(100);
              return true;
            }
            
            // Calculate progress percentage (from 80% to 99%)
            const audioProgress = 80 + Math.min(19, (attempts / maxAttempts) * 19);
            setProgress(audioProgress);
            
            // Try again after delay
            setTimeout(checkAudio, 5000);
            return false;
          };
          
          // Start polling
          checkAudio();
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('Request timed out. Please try again.');
        }
        throw fetchError;
      }
    } catch (err) {
      console.error('[Story Generator] Error in story generation process:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setStatus("error");
    }
  };

  // Render different content based on status
  const renderContent = () => {
    switch (status) {
      case "pending":
        return (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-500 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Preparing your story</h3>
            <p className="text-gray-400">We're getting everything ready...</p>
          </div>
        );

      case "analyzing":
        return (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-500 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Uploading your images</h3>
            <p className="text-gray-400 mb-4">Processing and uploading your photos to create your story...</p>
            <Progress value={progress} className="w-full max-w-md" />
          </div>
        );

      case "generating":
        return (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-500 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Creating your story</h3>
            <p className="text-gray-400 mb-4">Weaving a magical tale from your photos...</p>
            <Progress value={progress} className="w-full max-w-md" />
          </div>
        );

      case "audio":
        return (
          <div className="p-6">
            {story && (
              <>
                <h2 className="text-xl font-bold text-white mb-2">{story.title}</h2>
                <div className="rounded-lg bg-gray-800/60 p-4 mb-4 max-h-[300px] overflow-y-auto">
                  <pre className="text-gray-300 whitespace-pre-wrap font-sans">
                    {story.content}
                  </pre>
                </div>
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <Volume2 className="h-5 w-5 text-indigo-400 mr-2" />
                    <h3 className="text-white font-medium">Generating Audio Narration</h3>
                  </div>
                  <div className="flex items-center bg-gray-800/60 p-3 rounded-lg">
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-500 mr-3" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-300">Processing audio narration...</p>
                      <p className="text-xs text-gray-400">This might take a minute for longer stories</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        );

      case "completed":
        return (
          <div className="p-6">
            {story && (
              <>
                <h2 className="text-xl font-bold text-white mb-2">{story.title}</h2>
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <Volume2 className="h-5 w-5 text-indigo-400 mr-2" />
                    <h3 className="text-white font-medium">Audio Narration</h3>
                  </div>
                  {story.audioUrl ? (
                    <StoryAudioPlayer audioUrl={story.audioUrl} />
                  ) : (
                    <div className="bg-amber-900/20 border border-amber-800 p-3 rounded-lg text-sm text-amber-300">
                      <div className="flex">
                        <AlertTriangle className="h-5 w-5 mr-2 text-amber-400" />
                        <p>Audio narration not available.</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <FileText className="h-5 w-5 text-indigo-400 mr-2" />
                    <h3 className="text-white font-medium">Story Text</h3>
                  </div>
                  <div className="rounded-lg bg-gray-800/60 p-4 max-h-[300px] overflow-y-auto">
                    <pre className="text-gray-300 whitespace-pre-wrap font-sans">
                      {story.content}
                    </pre>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-6">
                  <Button
                    variant="outline"
                    className="border-gray-700"
                    onClick={onReset}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Create Another Story
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      className="bg-indigo-600 hover:bg-indigo-700"
                      onClick={() => {
                        // Save to library would go here
                        alert('Story saved to library!');
                      }}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Save to Library
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        );

      case "error":
        return (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <XCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Something went wrong</h3>
            <p className="text-red-300 mb-3">{error || 'Unable to generate story'}</p>
            {errorDetails && (
              <p className="text-gray-400 text-sm mb-4 max-w-md">{errorDetails}</p>
            )}
            <Button
              variant="default"
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={generateStory}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button
              variant="ghost"
              className="mt-2"
              onClick={onReset}
            >
              Start Over
            </Button>
          </div>
        );
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-800 relative overflow-hidden">
      {/* Status Indicator */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800">
        <div
          className={cn(
            "h-full transition-all duration-500",
            status === "pending" ? "bg-indigo-600 w-[5%]" :
            status === "analyzing" ? "bg-purple-600" :
            status === "generating" ? "bg-indigo-600" :
            status === "audio" ? "bg-indigo-600 w-[90%]" :
            status === "completed" ? "bg-green-600 w-full" :
            "bg-red-600 w-full"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Status Steps - Simplified Flow */}
      <div className="flex justify-between px-6 pt-6 pb-2">
        <div className="flex flex-col items-center">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center border-2",
              status === "analyzing" ? "bg-indigo-900/50 border-indigo-500 text-indigo-300" :
              (status === "pending" || status === "generating" || status === "audio" || status === "completed") ? 
                "bg-indigo-900/50 border-indigo-500 text-indigo-300" : 
                "bg-gray-800 border-gray-700 text-gray-500"
            )}
          >
            {status === "analyzing" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
          </div>
          <span className="text-xs mt-1 text-gray-400">Upload</span>
        </div>

        <div className="flex-1 flex items-center justify-center mt-4">
          <div
            className={cn(
              "h-0.5 w-full",
              (status === "generating" || status === "audio" || status === "completed") ? 
                "bg-indigo-600" : "bg-gray-800"
            )}
          />
        </div>

        <div className="flex flex-col items-center">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center border-2",
              status === "generating" ? "bg-indigo-900/50 border-indigo-500 text-indigo-300" :
              (status === "audio" || status === "completed") ? 
                "bg-indigo-900/50 border-indigo-500 text-indigo-300" : 
                "bg-gray-800 border-gray-700 text-gray-500"
            )}
          >
            {status === "generating" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
          </div>
          <span className="text-xs mt-1 text-gray-400">Create</span>
        </div>

        <div className="flex-1 flex items-center justify-center mt-4">
          <div
            className={cn(
              "h-0.5 w-full",
              (status === "audio" || status === "completed") ? "bg-indigo-600" : "bg-gray-800"
            )}
          />
        </div>

        <div className="flex flex-col items-center">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center border-2",
              status === "audio" ? "bg-indigo-900/50 border-indigo-500 text-indigo-300" :
              status === "completed" ? (story?.audioUrl ? "bg-indigo-900/50 border-indigo-500 text-indigo-300" : "bg-amber-900/50 border-amber-500 text-amber-300") :
              "bg-gray-800 border-gray-700 text-gray-500"
            )}
          >
            {status === "audio" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </div>
          <span className="text-xs mt-1 text-gray-400">Narrate</span>
        </div>

        <div className="flex-1 flex items-center justify-center mt-4">
          <div
            className={cn(
              "h-0.5 w-full",
              status === "completed" ? "bg-indigo-600" : "bg-gray-800"
            )}
          />
        </div>

        <div className="flex flex-col items-center">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center border-2",
              status === "completed" ? "bg-indigo-900/50 border-indigo-500 text-indigo-300" : "bg-gray-800 border-gray-700 text-gray-500"
            )}
          >
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <span className="text-xs mt-1 text-gray-400">Complete</span>
        </div>
      </div>

      <Separator className="bg-gray-800 mb-0" />

      {renderContent()}
    </Card>
  );
}