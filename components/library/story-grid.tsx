/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import { StoryCard } from "@/components/library/story-card";
import { toggleFavoriteAction, deleteStoryAction } from "@/app/actions/story-actions";
import { Story } from "@/types/story";
import { useToast } from "@/components/ui/use-toast";

interface StoryGridProps {
  stories: Story[];
}

export function StoryGrid({ stories }: StoryGridProps) {
  const { toast } = useToast();
  const [optimisticStories, setOptimisticStories] = useState<Story[]>(stories);

  const handleToggleFavorite = async (storyId: string, currentFavorite: boolean) => {
    console.log(`Toggling favorite for story ${storyId} from ${currentFavorite} to ${!currentFavorite}`);
    
    // Optimistic update
    setOptimisticStories((prev) =>
      prev.map((story) =>
        story.id === storyId
          ? { ...story, isFavorite: !currentFavorite, is_favorite: !currentFavorite }
          : story
      )
    );

    try {
      const result = await toggleFavoriteAction(storyId, !currentFavorite);
      console.log(`Toggle favorite action result:`, result);
      
      toast({
        title: currentFavorite ? "Removed from favorites" : "Added to favorites",
        description: currentFavorite ? "Story removed from your favorites" : "Story added to your favorites",
      });
    } catch (error) {
      console.error("Error toggling favorite:", error);
      
      // Revert optimistic update on error
      setOptimisticStories((prev) =>
        prev.map((story) =>
          story.id === storyId
            ? { ...story, isFavorite: currentFavorite, is_favorite: currentFavorite }
            : story
        )
      );
      
      toast({
        title: "Failed to update favorite status",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    if (window.confirm("Are you sure you want to delete this story? This action cannot be undone.")) {
      // Optimistic update
      setOptimisticStories((prev) => prev.filter((story) => story.id !== storyId));

      try {
        await deleteStoryAction(storyId);
        
        toast({
          title: "Story deleted",
          description: "Your story has been deleted successfully.",
        });
      } catch (error) {
        // If deletion fails, fetch the current stories again
        window.location.reload();
        
        toast({
          title: "Failed to delete story",
          description: "Please try again later.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {optimisticStories.map((story) => (
        <StoryCard
          key={story.id}
          story={story}
          onToggleFavorite={() => handleToggleFavorite(story.id, story.isFavorite ?? false)}
          onDelete={() => handleDeleteStory(story.id)}
        />
      ))}
    </div>
  );
}