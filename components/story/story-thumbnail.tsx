// components/story/story-thumbnail.tsx
"use client";

import { useState } from 'react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { cn } from '@/lib/utils';
import { getResponsiveSizes, getStoryImageUrl } from '@/lib/image-utils';
import { Story } from '@/types/story';

interface StoryThumbnailProps {
  story: Story;
  className?: string;
  priority?: boolean;
  onClick?: () => void;
  showTitle?: boolean;
  aspectRatio?: 'square' | 'portrait' | 'landscape';
}

export function StoryThumbnail({ 
  story, 
  className,
  priority = false,
  onClick,
  showTitle = true,
  aspectRatio = 'portrait'
}: StoryThumbnailProps) {
  const [imageError, setImageError] = useState(false);
  
  // Get image path from story
  let imagePath = null;
  
  if (!imageError) {
    // Try different image sources in priority order
    if (story.coverImage) {
      imagePath = story.coverImage;
    } 
    else if (story.images && story.images.length > 0 && story.images[0].storage_path) {
      imagePath = story.images[0].storage_path;
    } 
    else if (story.thumbnail) {
      imagePath = story.thumbnail;
    }
  }
  
  // Use the utility function to get standardized URL
  const coverImageUrl = getStoryImageUrl(imagePath, story.theme || 'adventure');
  
  console.log("Story thumbnail image URL:", coverImageUrl);
  
  // Determine aspect ratio class
  const aspectClasses = {
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]'
  };
  
  return (
    <div 
      className={cn(
        "relative rounded-lg overflow-hidden bg-gray-800",
        aspectClasses[aspectRatio],
        onClick && "cursor-pointer transition-transform hover:scale-[1.02]",
        className
      )}
      onClick={onClick}
    >
      <OptimizedImage
        src={coverImageUrl}
        alt={story.title}
        className="w-full h-full"
        objectFit="cover"
        priority={priority}
        sizes={getResponsiveSizes()}
        onError={() => setImageError(true)}
      />
      
      {/* Gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      
      {/* Story title */}
      {showTitle && (
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-white font-medium line-clamp-2">
            {story.title}
          </h3>
          
          {/* Optional metadata like language or duration */}
          <div className="flex items-center gap-1 mt-1">
            {story.language && (
              <span className="text-xs text-gray-300 bg-black/40 px-1.5 py-0.5 rounded">
                {story.language === 'en' ? 'English' : 
                 story.language === 'fr' ? 'French' : 
                 story.language === 'ja' ? 'Japanese' : 
                 story.language === 'id' ? 'Indonesian' : story.language}
              </span>
            )}
            
            {story.duration && (
              <span className="text-xs text-gray-300 bg-black/40 px-1.5 py-0.5 rounded">
                {Math.floor(story.duration / 60)}m
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}