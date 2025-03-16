"use client";

import { useRouter } from "next/navigation";
import { useToggleFavorite } from "@/hooks/query/useStories";
import { motion } from "framer-motion";
import { FormattedDuration } from "@/components/formatted-date";
import { ClientDate } from "@/components/client-date";
import { Button } from "@/components/ui/button";
import { StoryThumbnail } from "@/components/story/story-thumbnail";
import { Play, Heart, Book } from "lucide-react";
import { Story } from "@/types/story";

interface StoriesGridProps {
  stories: Story[];
  className?: string;
  onStoryClick?: (story: Story) => void;
  showEmptyState?: boolean;
  emptyStateMessage?: string;
}

// Helper to capitalize first letter
const capitalizeFirst = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Helper to get theme color
const getThemeColor = (theme: string) => {
  switch (theme) {
    case 'adventure': return 'border-blue-600/30';
    case 'fantasy': return 'border-purple-600/30';
    case 'bedtime': return 'border-indigo-600/30';
    case 'educational': return 'border-green-600/30';
    default: return 'border-gray-700';
  }
};

export function StoriesGrid({
  stories,
  className = "",
  onStoryClick,
  showEmptyState = true,
  emptyStateMessage = "Create your first story to get started"
}: StoriesGridProps) {
  const router = useRouter();
  const toggleFavorite = useToggleFavorite();

  // Empty state
  if (showEmptyState && (!stories || stories.length === 0)) {
    return (
      <div className="text-center py-10 bg-gray-900/50 rounded-xl border border-gray-800">
        <Book className="h-10 w-10 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">No stories found</h3>
        <p className="text-gray-400 mb-6">{emptyStateMessage}</p>
        <Button onClick={() => router.push("/dashboard/create")}>
          <Play className="mr-2 h-4 w-4" />
          Create Story
        </Button>
      </div>
    );
  }

  const handleStoryClick = (story: Story) => {
    if (onStoryClick) {
      onStoryClick(story);
    } else {
      router.push(`/dashboard/stories/${story.id}`);
    }
  };

  const handleFavoriteToggle = (e: React.MouseEvent, story: Story) => {
    e.stopPropagation();
    
    // Log useful information for debugging
    console.log("Toggling favorite for story:", {
      id: story.id,
      title: story.title,
      current_is_favorite: story.is_favorite
    });
    
    // Ensure we have a valid story ID
    if (!story.id) {
      console.error("Cannot toggle favorite: Missing story ID");
      return;
    }
    
    // Call the mutation with proper parameters
    toggleFavorite.mutate({ 
      storyId: story.id, 
      isFavorite: !story.is_favorite 
    }, {
      // Add onSuccess callback to provide feedback
      onSuccess: (data) => {
        console.log("Successfully toggled favorite status:", {
          story: story.title,
          newStatus: !story.is_favorite
        });
      },
      // Add onError callback to help diagnose issues
      onError: (error) => {
        console.error("Error toggling favorite status:", error);
      }
    });
  };

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 ${className}`}>
      {stories.map((story) => (
        <motion.div
          key={story.id}
          className={`bg-gray-900/80 rounded-xl p-5 border ${getThemeColor(story.theme || 'other')} hover:border-gray-600 cursor-pointer transition-all relative overflow-hidden group`}
          onClick={() => handleStoryClick(story)}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute inset-0 opacity-10 group-hover:opacity-15 transition-opacity">
            <StoryThumbnail 
              story={story}
              showTitle={false}
              aspectRatio="landscape"
            />
          </div>
          
          <div className="relative z-10">
            <h3 className="text-lg font-semibold text-white mb-2">
              {story.title}
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded">
                {story.language === 'en' ? 'English' : 
                 story.language === 'fr' ? 'French' : 
                 story.language === 'ja' ? 'Japanese' : 
                 story.language === 'id' ? 'Indonesian' : story.language}
              </span>
              {story.duration && (
                <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded">
                  <FormattedDuration seconds={story.duration} />
                </span>
              )}
              {story.theme && (
                <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded">
                  {capitalizeFirst(story.theme)}
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Created on <ClientDate date={story.created_at} format="short" />
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="border-gray-700 hover:bg-gray-800"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/dashboard/stories/${story.id}?autoplay=true`);
                }}
              >
                <Play className="h-3.5 w-3.5 mr-1.5" />
                Listen
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-pink-400"
                onClick={(e) => handleFavoriteToggle(e, story)}
              >
                <Heart className={story.is_favorite ? "h-3.5 w-3.5 fill-pink-500 text-pink-500" : "h-3.5 w-3.5"} />
              </Button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}