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
    // Optimistic update
    setOptimisticStories((prev) =>
      prev.map((story) =>
        story.id === storyId
          ? { ...story, isFavorite: !currentFavorite }
          : story
      )
    );

    try {
      await toggleFavoriteAction(storyId, !currentFavorite);
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticStories((prev) =>
        prev.map((story) =>
          story.id === storyId
            ? { ...story, isFavorite: currentFavorite }
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
          onToggleFavorite={() => handleToggleFavorite(story.id, story.isFavorite)}
          onDelete={() => handleDeleteStory(story.id)}
        />
      ))}
    </div>
  );
}