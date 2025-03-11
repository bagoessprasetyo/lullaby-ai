// components/story-creation/live-preview.tsx
"use client";

import { useState, useEffect } from "react";
import { StoryFormData } from "@/app/dashboard/create/page";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, RefreshCw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface LivePreviewProps {
  formData: StoryFormData;
  className?: string;
  refreshPreview?: () => void;
}

export function LivePreview({ formData, className, refreshPreview }: LivePreviewProps) {
  const [preview, setPreview] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFullPreview, setShowFullPreview] = useState(false);

  // Generate a preview whenever formData changes
  useEffect(() => {
    generatePreview();
  }, [
    formData.theme,
    formData.characters,
    formData.duration
  ]);

  const generatePreview = async () => {
    // Don't generate a preview if there are no images or characters
    if (formData.images.length === 0 || !formData.characters[0]?.name) {
      setPreview("");
      return;
    }

    setIsGenerating(true);

    try {
      // In a real implementation, you would call an API here
      // For now, we'll generate a simple placeholder based on the form data
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API call

      // Get character names
      const characterNames = formData.characters
        .filter(c => c.name.trim() !== "")
        .map(c => c.name);

      // Generate a preview based on theme and characters
      let previewText = "";
      const mainCharacter = characterNames[0] || "the child";
      
      switch (formData.theme) {
        case "adventure":
          previewText = `Once upon a time, ${mainCharacter} embarked on an exciting journey through a magical forest. `;
          if (characterNames.length > 1) {
            previewText += `Accompanied by ${characterNames.slice(1).join(" and ")}, they discovered a hidden treasure map tucked beneath an ancient oak tree. `;
          }
          previewText += `"Look what I found!" exclaimed ${mainCharacter} with eyes wide with wonder. The map glowed with mysterious symbols, promising the adventure of a lifetime...`;
          break;
          
        case "fantasy":
          previewText = `In a realm of magic and wonder, ${mainCharacter} discovered a mysterious glowing pendant. `;
          if (characterNames.length > 1) {
            previewText += `${characterNames.slice(1).join(" and ")} watched in amazement as the pendant floated through the air. `;
          }
          previewText += `"It's responding to my touch," whispered ${mainCharacter}. Suddenly, the pendant cast a rainbow of light across the room, revealing a doorway to an enchanted world...`;
          break;
          
        case "bedtime":
          previewText = `As the evening stars began to twinkle, ${mainCharacter} got ready for bed. `;
          if (characterNames.length > 1) {
            previewText += `${characterNames.slice(1).join(" and ")} came to say goodnight. `;
          }
          previewText += `"Can you tell me a story?" asked ${mainCharacter} with a sleepy smile. The room filled with warm, gentle light as dreams began to take shape. Tonight's dreams would be filled with wonder and joy...`;
          break;
          
        case "educational":
          previewText = `${mainCharacter} was always curious about how things worked. `;
          if (characterNames.length > 1) {
            previewText += `Together with ${characterNames.slice(1).join(" and ")}, they set up a simple science experiment. `;
          }
          previewText += `"Do you know why leaves change color in autumn?" ${mainCharacter} asked. It was time for a fascinating discovery about the natural world. With magnifying glass in hand, they began to explore...`;
          break;
          
        case "customized":
          previewText = `This is a fully personalized story featuring ${mainCharacter}`;
          if (characterNames.length > 1) {
            previewText += ` and friends ${characterNames.slice(1).join(" and ")}`;
          }
          previewText += `. The story will be uniquely crafted from your images and preferences, creating a one-of-a-kind adventure that captures special memories and brings them to life...`;
          break;
          
        default:
          previewText = `${mainCharacter}'s story is beginning to take shape. Based on your photos and preferences, we'll create a unique adventure that brings your memories to life in a magical way...`;
      }
      
      // Add more detail for longer stories
      if (formData.duration === "medium" || formData.duration === "long") {
        previewText += `\n\nThe story continues with more twists and turns, character development, and vivid descriptions. `;
        
        if (formData.duration === "long") {
          previewText += `This premium length story will include multiple chapters and a rich, immersive narrative perfect for longer bedtime reading sessions.`;
        }
      }

      setPreview(previewText);
    } catch (error) {
      console.error("Error generating preview:", error);
      setPreview("Unable to generate preview at this time.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!preview) {
    return null;
  }

  return (
    <Card className={cn("bg-gray-800/60 border-gray-700 overflow-hidden", className)}>
      <div className="p-4 bg-indigo-900/20 border-b border-indigo-800/50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-indigo-300" />
          <h3 className="font-medium text-white">Story Preview</h3>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => {
            if (refreshPreview) {
              refreshPreview();
            } else {
              generatePreview();
            }
          }}
          className="h-8 text-gray-300 hover:text-white"
          disabled={isGenerating}
        >
          <RefreshCw className={cn("h-3.5 w-3.5 mr-1", isGenerating && "animate-spin")} />
          Refresh
        </Button>
      </div>
      
      <div className="p-5 relative">
        {isGenerating ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full bg-gray-700" />
            <Skeleton className="h-4 w-11/12 bg-gray-700" />
            <Skeleton className="h-4 w-10/12 bg-gray-700" />
            <Skeleton className="h-4 w-9/12 bg-gray-700" />
          </div>
        ) : (
          <>
            <div className={cn(
              "prose prose-sm prose-invert max-w-none",
              !showFullPreview && preview.length > 300 && "line-clamp-4"
            )}>
              <p className="text-gray-300 leading-relaxed first-letter:text-2xl first-letter:font-serif first-letter:text-indigo-300">
                {preview}
              </p>
            </div>
            
            {preview.length > 300 && (
              <Button
                variant="link"
                onClick={() => setShowFullPreview(!showFullPreview)}
                className="text-indigo-400 hover:text-indigo-300 p-0 h-auto mt-2"
              >
                {showFullPreview ? "Show less" : "Read more..."}
              </Button>
            )}
            
            <div className="absolute top-3 right-3 opacity-20">
              <Sparkles className="h-16 w-16 text-indigo-300" />
            </div>
          </>
        )}
      </div>
      
      <div className="p-3 bg-gray-800/80 text-center border-t border-gray-700 text-xs text-gray-400">
        This is a preview generated from your selections. The final story will be professionally crafted.
      </div>
    </Card>
  );
}