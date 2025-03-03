"use client";

import { useState } from "react";
import { StoryListItem } from "@/components/library/story-list-item";
import { Story } from "@/types/story";
import { useToast } from "@/components/ui/use-toast";
import { deleteStoryAction, toggleFavoriteAction } from "@/app/actions/story-actions";

interface StoryListProps {
  stories: Story[];
}

export function StoryList({ stories }: StoryListProps) {
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
    <div className="flex flex-col gap-3">
      {optimisticStories.map((story) => (
        <StoryListItem
          key={story.id}
          story={story}
          onToggleFavorite={() => handleToggleFavorite(story.id, story.isFavorite)}
          onDelete={() => handleDeleteStory(story.id)}
        />
      ))}
    </div>
  );
}