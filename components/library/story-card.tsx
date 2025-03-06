"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Play,
  MoreVertical,
  Edit,
  Trash2,
  Share,
  Download,
  BookMarked,
  BookOpen,
  Globe,
  Clock,
} from "lucide-react";
// import { Story } from "@/app/dashboard/library/page";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/format-duration";
import { Story } from "@/types/story";

interface StoryCardProps {
  story: Story;
  onToggleFavorite: () => void;
  onDelete: () => void;
}

export function StoryCard({ story, onToggleFavorite, onDelete }: StoryCardProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  
  const getLanguageName = (code: string) => {
    switch (code) {
      case "english":
        return "English";
      case "french":
        return "French";
      case "japanese":
        return "Japanese";
      case "indonesian":
        return "Indonesian";
      default:
        return code;
    }
  };
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };
  
  return (
    <Card
      className="bg-gray-900 border-gray-800 overflow-hidden transition-all"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-[4/3]">
        <img
          src={story.coverImage}
          alt={story.title}
          className="w-full h-full object-cover"
        />
        
        {/* Duration Badge */}
        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1 text-xs text-white flex items-center gap-1">
          <Clock className="h-3 w-3 text-gray-300" />
          {formatDuration(story.duration || 0)}
        </div>
        
        {/* Language Badge */}
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1 text-xs text-white flex items-center gap-1">
          <Globe className="h-3 w-3 text-gray-300" />
          {getLanguageName(story.language)}
        </div>
        
        {/* Favorite Badge */}
        {story.isFavorite && (
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-full p-1.5">
            <BookMarked className="h-3.5 w-3.5 text-amber-400" />
          </div>
        )}
        
        {/* Hover Overlay */}
        <div 
          className={cn(
            "absolute inset-0 bg-black/70 flex items-center justify-center transition-opacity",
            isHovered ? "opacity-100" : "opacity-0"
          )}
        >
          <Button 
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={() => router.push(`/dashboard/stories/${story.id}`)}
          >
            <Play className="h-4 w-4 mr-2" />
            Play Story
          </Button>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <h3 
            className="font-semibold text-white text-base line-clamp-1 cursor-pointer hover:text-indigo-400 transition-colors"
            onClick={() => router.push(`/dashboard/stories/${story.id}`)}
          >
            {story.title}
          </h3>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-900 border-gray-800">
              <DropdownMenuItem className="cursor-pointer" onClick={onToggleFavorite}>
                {story.isFavorite ? (
                  <>
                    <BookOpen className="h-4 w-4 mr-2" />
                    <span>Remove from Favorites</span>
                  </>
                ) : (
                  <>
                    <BookMarked className="h-4 w-4 mr-2" />
                    <span>Add to Favorites</span>
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer" 
                onClick={() => router.push(`/dashboard/stories/${story.id}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                <span>Edit Story</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Share className="h-4 w-4 mr-2" />
                <span>Share Story</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Download className="h-4 w-4 mr-2" />
                <span>Download</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer text-red-400 focus:text-red-400" 
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                <span>Delete Story</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
          <span>Created {formatDate(story.createdAt ?? new Date())}</span>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <div className="flex flex-wrap gap-1.5">
          {story?.tags?.map((tag, index) => (
            <Badge 
              key={index} 
              variant="outline" 
              className="bg-gray-800/50 border-gray-700 hover:bg-gray-800 text-xs"
            >
              {tag}
            </Badge>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
}