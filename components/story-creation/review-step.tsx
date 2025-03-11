// components/story-creation/review-step.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { createApiServices } from "@/lib/api/apiService";
import { LivePreview } from "./live-preview";
import {
  ImageIcon,
  Users,
  Clock,
  MusicIcon,
  Globe,
  Sparkles,
  PencilIcon,
  Lock,
  AlertCircle
} from "lucide-react";
import { StoryFormData } from "@/app/dashboard/create/page";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ReviewStepProps {
  formData: StoryFormData;
  updateFormData: (field: keyof StoryFormData, value: any) => void;
  isSubscriber: boolean;
  onGenerateStory: () => void;
}

export function ReviewStep({ 
  formData, 
  updateFormData,
  isSubscriber,
  onGenerateStory
}: ReviewStepProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState(0); // Used to force re-generation of preview
  
  // Mapping for display purposes
  const durationMap = {
    short: "1 minute",
    medium: "3 minutes",
    long: "5+ minutes"
  };
  
  const languageMap: { [key: string]: string } = {
    english: "English 🇺🇸",
    french: "French 🇫🇷",
    japanese: "Japanese 🇯🇵",
    indonesian: "Indonesian 🇮🇩"
  };
  
  const musicMap: { [key: string]: string } = {
    calming: "Calming",
    soft: "Soft",
    peaceful: "Peaceful",
    soothing: "Soothing",
    magical: "Magical"
  };

  const refreshPreview = () => {
    setPreviewKey(prev => prev + 1);
  };

  const handleGenerateStory = async () => {
    // Reset error state
    setGenerationError(null);
    
    // Begin generation process
    updateFormData("isGenerating", true);
    
    try {
      if (!session) {
        throw new Error("You must be logged in to generate a story");
      }
      
      // Call onGenerateStory to trigger generation in parent component
      onGenerateStory();
      
    } catch (error) {
      console.error("Story generation error:", error);
      updateFormData("isGenerating", false);
      setGenerationError(error instanceof Error ? error.message : "An unknown error occurred");
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-2">Review Your Story</h3>
        <p className="text-gray-400">
          Review your story details before generating
        </p>
      </div>
      
      {/* Error Alert */}
      {generationError && (
        <Alert variant="destructive" className="bg-red-900/20 border-red-800">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-300">
            {generationError}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: Story details */}
        <div className="md:col-span-2">
          <Card className="bg-gray-900 border-gray-800 p-5 space-y-5">
            {/* Photos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-900/40 rounded-full p-1">
                    <ImageIcon className="h-4 w-4 text-blue-400" />
                  </div>
                  <h4 className="font-medium text-white">Photos</h4>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-400 h-8"
                  onClick={() => router.push("/dashboard/create")}
                >
                  <PencilIcon className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {formData.images.map((image, index) => (
                  <div 
                    key={index}
                    className="relative aspect-square rounded-md overflow-hidden border border-gray-800"
                  >
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Story image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
            
            <Separator className="bg-gray-800" />
            
            {/* Characters */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-indigo-900/40 rounded-full p-1">
                    <Users className="h-4 w-4 text-indigo-400" />
                  </div>
                  <h4 className="font-medium text-white">Characters</h4>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-400 h-8"
                  onClick={() => router.push("/dashboard/create?step=1")}
                >
                  <PencilIcon className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              </div>
              <div className="space-y-2">
                {formData.characters.map((character, index) => (
                  <div key={index} className="bg-gray-800/50 rounded-md p-2.5">
                    <div className="text-sm text-white font-medium">
                      {character.name || `Character ${index + 1}`}
                    </div>
                    {character.description && (
                      <div className="text-xs text-gray-400 mt-1">
                        {character.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <Separator className="bg-gray-800" />
            
            {/* Story Settings */}
            <div className="space-y-4">
              <h4 className="font-medium text-white">Story Settings</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Duration */}
                <div className="bg-gray-800/50 rounded-md p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-300">Duration</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-base text-white font-medium">
                      {durationMap[formData.duration]}
                    </div>
                    {formData.duration === "long" && !isSubscriber && (
                      <Badge className="bg-amber-900/60 text-amber-300">
                        <Lock className="h-3 w-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Background Music */}
                <div className="bg-gray-800/50 rounded-md p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <MusicIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-300">Background Music</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-base text-white font-medium">
                      {isSubscriber ? musicMap[formData.backgroundMusic] : "None"}
                    </div>
                    {!isSubscriber && (
                      <Badge className="bg-amber-900/60 text-amber-300">
                        <Lock className="h-3 w-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Language */}
                <div className="bg-gray-800/50 rounded-md p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Globe className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-300">Language</span>
                  </div>
                  <div className="text-base text-white font-medium">
                    {languageMap[formData.language]}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Right column: Live preview */}
        <div className="md:col-span-1">
          <LivePreview 
            key={previewKey}
            formData={formData} 
            className="sticky top-4" 
            refreshPreview={refreshPreview} 
          />
        </div>
      </div>
      
      {/* Generate Button */}
      <div className="flex flex-col items-center justify-center pt-4">
        <Button 
          onClick={handleGenerateStory}
          disabled={formData.isGenerating}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 w-full md:w-auto md:min-w-[200px] h-12"
          size="lg"
        >
          {formData.isGenerating ? (
            <>
              <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Creating Your Story...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Generate Story
            </>
          )}
        </Button>
        
        {!formData.isGenerating && (
          <p className="text-sm text-gray-400 mt-3">
            Your story will be created in approximately 30 seconds
          </p>
        )}
      </div>
    </div>
  );
}