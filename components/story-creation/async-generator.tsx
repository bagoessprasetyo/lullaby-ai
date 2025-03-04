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
import { useStoryGenerationStatus } from "@/hooks/useWebSocket";
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
  const [requestId, setRequestId] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  
  // Get generation status from WebSocket hook
  const { 
    status,
    progress,
    result,
    error,
    isConnected
  } = useStoryGenerationStatus(requestId);
  
  // Services
  const apiServices = createApiServices(session);
  
  // Start generation when component mounts
//   useEffect(() => {
//     startGeneration();
//   }, []);
    useEffect(() => {
        let isMounted = true;
        const runGeneration = async () => {
        if (isMounted) {
            await startGeneration();
        }
        };
        
        runGeneration();
        
        return () => {
        isMounted = false;
        };
    }, []); // Remove dependency on startGeneration to avoid circular reference
  
  // Watch for result changes
  useEffect(() => {
    if (result && status === 'completed') {
      // Navigate to the new story page
      router.push(`/dashboard/stories/${result.storyId}`);
    }
  }, [result, status, router]);
  
  // Watch for errors
  useEffect(() => {
    if (error || status === 'failed') {
      setGenerationError(error || "Story generation failed. Please try again.");
    }
  }, [error, status]);
  
  // Display connected/disconnected toast
  useEffect(() => {
    if (!isConnected && requestId) {
      toast({
        title: "Connection Lost",
        description: "Real-time updates disconnected. Status will refresh periodically.",
        variant: "destructive"
      });
    }
  }, [isConnected, requestId, toast]);
  
  // Start story generation
  // const { openModal } = useUpgradeModal();

  // Modified startGeneration function
  const startGeneration = useCallback(async () => {
    try {
      setIsStarting(true);
      setRequestId(null);
      setGenerationError(null);

      // Check rate limit
      const { success } = await rateLimiter.limit(session?.user?.id || 'anonymous');
      if (!success) {
        throw new Error('You can generate up to 5 stories per minute. Please wait before creating more.');
      }

      // Get current URL for callback
      const origin = window.location.origin;
      const callbackUrl = `${origin}/api/webhooks/story-completed`;
      
      // Call API to start async generation
      const response = await apiServices.story.generateStoryAsync(formData, callbackUrl) as GenerateStoryResponse & { requestId?: string };
      
      if (response.success && response.requestId) {
        setRequestId(response.requestId);
      } else {
        throw new Error(response.error || "Failed to start generation");
      }
    } catch (error) {
      console.error("Error starting generation:", error);
      const message = error instanceof Error ? error.message : "Failed to start story generation";
      
      if (message.includes('You can generate up to 5 stories per minute')) {
        setGenerationError(message);
        openModal('story-generation');
      } else {
        setGenerationError(message);
      }
    } finally {
      setIsStarting(false);
    }
  }, [session?.user?.id, apiServices.story, formData, openModal]);
  
  // Get current step description
  const getStepDescription = () => {
    if (status === 'pending') return "Preparing to create your story...";
    if (status === 'failed') return "Story generation failed.";
    
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
        
        {!isConnected && requestId && (
          <p className="text-xs text-amber-400 mt-1">
            <RefreshCw className="h-3 w-3 inline-block mr-1 animate-spin" />
            Connection lost. Updates may be delayed.
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
          <p>Request ID: {requestId || 'Not started'}</p>
          <p>Status: {status}</p>
          <p>Progress: {Math.round(progress * 100)}%</p>
          <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
        </div>
      )}
    </div>
  );
}