"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Play, Clock, BookMarked } from "lucide-react";
import { Story } from "@/app/dashboard/library/page";
import { formatDuration } from "@/lib/format-duration";

interface RecentStoriesProps {
  stories: Story[];
}

export function RecentStories({ stories }: RecentStoriesProps) {
  const router = useRouter();
  
  // Take the first 3 stories for the recent view
  const recentStories = stories.slice(0, 3);
  
  return (
    <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {recentStories.map((story) => (
          <div 
            key={story.id}
            className="flex items-center gap-4 cursor-pointer"
            onClick={() => router.push(`/dashboard/stories/${story.id}`)}
          >
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-lg overflow-hidden">
                <img 
                  src={story.thumbnail} 
                  alt={story.title}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Duration Badge */}
              <div className="absolute -bottom-1 -right-1 bg-black/70 rounded-full px-1.5 py-0.5 text-[10px] text-white flex items-center gap-0.5">
                <Clock className="h-2.5 w-2.5" />
                {formatDuration(story.duration)}
              </div>
              
              {/* Favorite Badge */}
              {story.isFavorite && (
                <div className="absolute -top-1 -right-1 bg-black/70 rounded-full p-1">
                  <BookMarked className="h-2.5 w-2.5 text-amber-400" />
                </div>
              )}
            </div>
            
            <div className="flex-grow min-w-0">
              <h4 className="font-medium text-white text-sm truncate">
                {story.title}
              </h4>
              <p className="text-xs text-gray-400 truncate">
                Last played a few days ago
              </p>
              
              <Button
                variant="ghost" 
                size="sm" 
                className="mt-1 h-8 px-2.5 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/20 p-0"
              >
                <Play className="h-3 w-3 mr-1" />
                <span className="text-xs">Play Now</span>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}