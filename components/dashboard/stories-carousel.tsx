// components/dashboard/stories-carousel.tsx
"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Story } from "@/types/story";
import { getStoryImageUrl } from "@/lib/image-utils";
import { FormattedDuration } from "@/components/formatted-date";
import { useFavoriteStories } from "@/hooks/query/useStories"; // Assuming you have this hook
import { useToggleFavorite } from "@/hooks/query/useStories"; // Assuming you have this hook

interface StoriesCarouselProps {
  stories: Story[];
  title?: string;
  onStoryClick?: (story: Story) => void;
  showControls?: boolean;
  className?: string;
}

export function StoriesCarousel({
  stories,
  title,
  onStoryClick,
  showControls = true,
  className = "",
}: StoriesCarouselProps) {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  
  // For favorite toggling
  const toggleFavorite = useToggleFavorite();
  
  // Debug logging for stories
  useEffect(() => {
    console.log('Stories carousel received stories:', stories.length);
    // Log just first 2 stories for debugging
    if (stories.length > 0) {
      console.log('First story in carousel:', {
        id: stories[0].id,
        title: stories[0].title,
        is_favorite: stories[0].is_favorite,
        isFavorite: stories[0].isFavorite
      });
    }
  }, [stories]);

  // Empty state
  if (!stories || stories.length === 0) {
    return (
      <div className="text-center py-6 bg-gray-900/30 rounded-xl">
        <p className="text-gray-400">No stories available</p>
      </div>
    );
  }

  // Helper function to scroll the carousel
  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollAmount = container.clientWidth * 0.8;
    
    if (direction === "left") {
      container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // Check scroll position to determine arrow visibility
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const isAtStart = container.scrollLeft === 0;
    const isAtEnd = 
      container.scrollLeft + container.clientWidth >= 
      container.scrollWidth - 10; // 10px threshold
    
    setShowLeftArrow(!isAtStart);
    setShowRightArrow(!isAtEnd);
  };

  // Handle story click
  const handleStoryClick = (story: Story) => {
    if (onStoryClick) {
      onStoryClick(story);
    } else {
      router.push(`/dashboard/stories/${story.id}`);
    }
  };

  // Handle play button click
  const handlePlayClick = (e: React.MouseEvent, story: Story) => {
    e.stopPropagation();
    console.log('Play story:', story); // Add this to debug
    
    if (!story.id) {
      console.error('Story ID is undefined:', story);
      return; // Prevent navigation with undefined ID
    }
    
    router.push(`/dashboard/stories/${story.id}?autoplay=true`);
  };

  // Handle favorite button click
  const handleFavoriteClick = (e: React.MouseEvent, story: Story) => {
    e.stopPropagation();
    
    // Determine the current favorite status, check both properties
    const currentFavoriteStatus = story.is_favorite || story.isFavorite || false;
    const newFavoriteStatus = !currentFavoriteStatus;
    
    // Log useful information for debugging
    console.log("Toggling favorite for story in carousel:", {
      id: story.id,
      title: story.title,
      currentStatus: currentFavoriteStatus,
      newStatus: newFavoriteStatus
    });
    
    // Ensure we have a valid story ID
    if (!story.id) {
      console.error("Cannot toggle favorite: Missing story ID in carousel");
      return;
    }
    
    // Call the mutation with proper parameters
    toggleFavorite.mutate({ 
      storyId: story.id, 
      isFavorite: newFavoriteStatus
    }, {
      // Add onSuccess callback to provide feedback
      onSuccess: (data) => {
        console.log("Successfully toggled favorite status in carousel:", {
          story: story.title,
          newStatus: newFavoriteStatus,
          response: data
        });
      },
      // Add onError callback to help diagnose issues
      onError: (error) => {
        console.error("Error toggling favorite status in carousel:", error);
      }
    });
  };

  // Helper function to get theme color
  const getThemeColor = (theme: string) => {
    switch (theme) {
      case 'adventure': return 'border-blue-600/30';
      case 'fantasy': return 'border-purple-600/30';
      case 'bedtime': return 'border-indigo-600/30';
      case 'educational': return 'border-green-600/30';
      default: return 'border-gray-700';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {title && (
        <h3 className="text-lg font-medium text-white mb-3">{title}</h3>
      )}
      
      <div className="relative group">
        {/* Left scroll arrow */}
        {showControls && showLeftArrow && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-gray-900/80 hover:bg-gray-800 p-1.5 rounded-full border border-gray-700 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        
        {/* Right scroll arrow */}
        {showControls && showRightArrow && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-gray-900/80 hover:bg-gray-800 p-1.5 rounded-full border border-gray-700 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
        
        {/* Carousel container */}
        <div
          ref={scrollContainerRef}
          className="flex space-x-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide"
          onScroll={handleScroll}
        >
          {stories.map((story) => (
            <motion.div
              key={story.id}
              className={`flex-shrink-0 w-64 bg-gray-900/80 rounded-xl border ${getThemeColor(story.theme || 'other')} hover:border-gray-600 cursor-pointer transition-all overflow-hidden`}
              onClick={() => handleStoryClick(story)}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="h-36 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-60 z-10" />
                
                {/* Story thumbnail */}
                <Image 
                    src={
                      (() => {
                        // Determine image path
                        let imagePath = null;
                        if (story.coverImage) {
                          imagePath = story.coverImage;
                        } 
                        else if (story.images && story.images.length > 0 && story.images[0].storage_path) {
                          imagePath = story.images[0].storage_path;
                        } 
                        else if (story.thumbnail) {
                          imagePath = story.thumbnail;
                        }
                        
                        console.log(`Processing image for story ${story.id}:`, imagePath);
                        // Use our shared utility function
                        return getStoryImageUrl(imagePath, story.theme || 'adventure');
                      })()
                    } 
                    alt={story.title}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      console.error(`Failed to load image for story: ${story.id}`);
                      // Try to use a fallback theme image
                      e.currentTarget.src = `/images/theme-${story.theme || 'adventure'}.jpg`;
                    }}
                />
                
                {/* Favorite indicator */}
                <button
                  className="absolute top-2 right-2 z-20 bg-black/60 rounded-full p-1.5 transition-colors hover:bg-black/80"
                  onClick={(e) => handleFavoriteClick(e, story)}
                >
                  <Heart className={`h-4 w-4 ${(story.is_favorite || story.isFavorite) ? 'text-pink-500 fill-pink-500' : 'text-white'}`} />
                </button>
                
                {/* Duration indicator */}
                {story.duration && (
                  <div className="absolute bottom-2 right-2 z-20 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                    <FormattedDuration seconds={story.duration} />
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h4 className="text-sm font-medium text-white mb-1 truncate">{story.title}</h4>
                <p className="text-xs text-gray-400 mb-3 truncate">
                  {story.theme && story.theme.charAt(0).toUpperCase() + story.theme.slice(1)} story • {new Date(story.created_at).toLocaleDateString()}
                </p>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full border-gray-700 hover:bg-gray-800 h-8"
                  onClick={(e) => handlePlayClick(e, story)}
                >
                  <Play className="h-3 w-3 mr-1" />
                  Play
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}