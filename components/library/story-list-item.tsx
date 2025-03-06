/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

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
  CalendarDays,
} from "lucide-react";

import { formatDuration } from "@/lib/format-duration";
import { ReactElement, JSXElementConstructor, ReactNode, ReactPortal, Key } from "react";
import { Story } from "@/types/story";

interface StoryListItemProps {
  story: Story;
  onToggleFavorite: () => void;
  onDelete: () => void;
}

export function StoryListItem({ story, onToggleFavorite, onDelete }: StoryListItemProps) {
  const router = useRouter();
  
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
    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-700 transition-colors">
      <div className="flex-shrink-0 relative">
        <div className="w-full md:w-20 h-20 overflow-hidden rounded-md">
          <img
            src={story.thumbnail}
            alt={story.title}
            className="w-full h-full object-cover"
          />
        </div>
        {story.isFavorite && (
          <div className="absolute top-1 right-1 bg-black/60 backdrop-blur-sm rounded-full p-1">
            <BookMarked className="h-3 w-3 text-amber-400" />
          </div>
        )}
      </div>
      
      <div className="flex-grow min-w-0">
        <div className="flex justify-between items-start">
          <h3 
            className="font-semibold text-white text-base cursor-pointer hover:text-indigo-400 transition-colors truncate"
            onClick={() => router.push(`/dashboard/stories/${story.id}`)}
          >
            {story.title}
          </h3>
        </div>
        
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
          <div className="flex items-center text-xs text-gray-400">
            <Clock className="h-3 w-3 mr-1" />
            {formatDuration(story.duration || 0)}
          </div>
          
          <div className="flex items-center text-xs text-gray-400">
            <Globe className="h-3 w-3 mr-1" />
            {getLanguageName(story.language)}
          </div>
          
          <div className="flex items-center text-xs text-gray-400">
            <CalendarDays className="h-3 w-3 mr-1" />
            {formatDate(story.createdAt || new Date)}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1.5 mt-2">
          {story?.tags?.map((tag: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined, index: Key | null | undefined) => (
            <Badge 
              key={index} 
              variant="outline" 
              className="bg-gray-800/50 border-gray-700 hover:bg-gray-800 text-xs"
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>
      
      <div className="flex gap-2 mt-3 md:mt-0 w-full md:w-auto">
        <Button 
          className="bg-indigo-600 hover:bg-indigo-700 flex-1 md:flex-auto"
          size="sm"
          onClick={() => router.push(`/dashboard/stories/${story.id}`)}
        >
          <Play className="h-3.5 w-3.5 mr-1.5" />
          Play
        </Button>
        
        <Button 
          variant="outline" 
          className="border-gray-700 flex-1 md:flex-auto"
          size="sm"
          onClick={() => router.push(`/dashboard/stories/${story.id}/edit`)}
        >
          <Edit className="h-3.5 w-3.5 mr-1.5" />
          Edit
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="border-gray-700 h-8 w-8" size="icon">
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
    </div>
  );
}