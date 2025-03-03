"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Share2,
  Download,
  BookOpen,
  Edit,
  Languages,
  Music,
  Users,
  Heart,
  MoreHorizontal,
  ArrowLeft
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDuration } from "@/lib/format-duration";
import { toggleStoryFavorite } from "@/lib/services/story-service";
import { recordPlayStart, updatePlayProgress } from "@/lib/services/history-service";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

// Define the story data type
export type StoryData = {
  id: string;
  title: string;
  createdAt: Date;
  duration: number;
  coverImage: string;
  audioUrl: string;
  isFavorite: boolean;
  language: string;
  theme: string;
  backgroundMusic: string;
  characters: Array<{ name: string; description: string }>;
  images: string[];
  content: string;
};

export function StoryDetail({ 
  storyId, 
  initialStoryData 
}: { 
  storyId: string;
  initialStoryData: StoryData;
}) {
  const router = useRouter();
  const { userId } = useAuth();
  
  const [storyData, setStoryData] = useState<StoryData>(initialStoryData);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isFavorite, setIsFavorite] = useState(initialStoryData.isFavorite);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [playHistoryId, setPlayHistoryId] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Initialize audio element
  useEffect(() => {
    // Safety check for browser environment
    if (typeof window === 'undefined') return;
    
    try {
      if (typeof Audio !== 'undefined' && storyData.audioUrl) {
        // Create new audio element
        audioRef.current = new Audio(storyData.audioUrl);
        
        // Add event listeners
        audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.addEventListener('ended', handleAudioEnded);
        
        // Handle potential audio loading errors
        audioRef.current.addEventListener('error', (e) => {
          console.error('Audio element error:', e);
          toast.error("Error loading audio file");
        });
        
        // Preload audio
        audioRef.current.preload = "metadata";
      }
    } catch (error) {
      console.error("Error initializing audio:", error);
    }
    
    // Cleanup function
    return () => {
      if (audioRef.current) {
        try {
          audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
          audioRef.current.removeEventListener('ended', handleAudioEnded);
          audioRef.current.removeEventListener('error', () => {});
          audioRef.current.pause();
          audioRef.current.src = "";
        } catch (error) {
          console.error("Error cleaning up audio:", error);
        }
      }
    };
  }, [storyData.audioUrl]);
  
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration || storyData.duration;
      const progressPercent = (current / duration) * 100;
      
      setCurrentTime(current);
      setProgress(progressPercent);
      
      // Update active image based on progress
      const imageIndex = Math.min(
        Math.floor((progressPercent / 100) * storyData.images.length),
        storyData.images.length - 1
      );
      setActiveImageIndex(imageIndex);
      
      // Update play progress in Supabase if we have a play history ID
      // Only update every 10 seconds to avoid too many requests
      if (playHistoryId && current % 10 < 1) {
        const isCompleted = current >= duration * 0.9; // Consider complete at 90%
        updatePlayProgress(playHistoryId, progressPercent, isCompleted).catch(err => {
          console.error("Error updating play progress:", err);
        });
      }
    }
  };
  
  const handleAudioEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setActiveImageIndex(0);
    
    // Mark as completed in history if we have a play history ID
    if (playHistoryId) {
      updatePlayProgress(playHistoryId, 100, true).catch(err => {
        console.error("Error updating play completion:", err);
      });
    }
  };
  
  const togglePlayPause = async () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        try {
          // Record play start in history if starting from beginning
          if (currentTime < 1 && !playHistoryId && userId) {
            const historyEntry = await recordPlayStart(userId, storyId);
            if (historyEntry) {
              setPlayHistoryId(historyEntry.id);
            }
          }
          
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (error) {
          console.error("Error playing audio:", error);
          toast.error("Unable to play audio. Please try again.");
        }
      }
    } else {
      toast.error("Audio not available for this story.");
    }
  };
  
  const handleSeek = (value: number) => {
    if (audioRef.current) {
      const seekTime = (value / 100) * (audioRef.current.duration || storyData.duration);
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
      setProgress(value);
    }
  };
  
  const handleSkipBack = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
    }
  };
  
  const handleSkipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(
        audioRef.current.duration || storyData.duration,
        audioRef.current.currentTime + 10
      );
    }
  };
  
  const handleToggleFavorite = async () => {
    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);
    
    // Update in Supabase
    try {
      const updated = await toggleStoryFavorite(storyId, newFavoriteState);
      if (!updated) {
        // Revert if failed
        setIsFavorite(isFavorite);
        toast.error("Failed to update favorite status.");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      // Revert if failed
      setIsFavorite(isFavorite);
      toast.error("Failed to update favorite status.");
    }
  };
  
  const formatDateForDisplay = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };
  
  const getLanguageDisplay = (langCode: string) => {
    const languages: Record<string, string> = {
      english: "English 🇺🇸",
      en: "English 🇺🇸",
      french: "French 🇫🇷",
      fr: "French 🇫🇷",
      japanese: "Japanese 🇯🇵",
      ja: "Japanese 🇯🇵",
      indonesian: "Indonesian 🇮🇩",
      id: "Indonesian 🇮🇩"
    };
    return languages[langCode] || langCode;
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      {/* Back button */}
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => router.back()}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Library
      </Button>
      
      {/* Story Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{storyData.title}</h1>
            <p className="text-gray-400">
              Created on {formatDateForDisplay(storyData.createdAt)}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className={`border-gray-700 ${isFavorite ? 'text-red-500' : 'text-gray-400'}`}
              onClick={handleToggleFavorite}
            >
              <Heart className="h-5 w-5" fill={isFavorite ? "#ef4444" : "none"} />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="border-gray-700">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800">
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => router.push(`/dashboard/stories/${storyId}/edit`)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Story
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Story
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Download className="mr-2 h-4 w-4" />
                  Download Story
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Tags and metadata */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge className="bg-indigo-900/50 text-indigo-300">
            <Languages className="mr-1 h-3 w-3" />
            {getLanguageDisplay(storyData.language)}
          </Badge>
          <Badge className="bg-green-900/50 text-green-300">
            <BookOpen className="mr-1 h-3 w-3" />
            {storyData.theme}
          </Badge>
          <Badge className="bg-purple-900/50 text-purple-300">
            <Music className="mr-1 h-3 w-3" />
            {storyData.backgroundMusic}
          </Badge>
          <Badge className="bg-amber-900/50 text-amber-300">
            <Users className="mr-1 h-3 w-3" />
            {storyData.characters.length} characters
          </Badge>
        </div>
      </div>
      
      {/* Main content area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Story image carousel */}
        <div className="md:col-span-1">
          <Card className="bg-gray-900 border-gray-800 overflow-hidden">
            <div className="aspect-square relative">
              <img
                src={storyData.images[activeImageIndex] || storyData.coverImage}
                alt={`Story image ${activeImageIndex + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Thumbnail navigator */}
            <CardFooter className="flex justify-center p-4 gap-2">
              {storyData.images.map((image, index) => (
                <button
                  key={index}
                  className={`w-3 h-3 rounded-full ${
                    index === activeImageIndex 
                      ? 'bg-indigo-500' 
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  onClick={() => setActiveImageIndex(index)}
                />
              ))}
            </CardFooter>
          </Card>
        </div>
        
        {/* Story text */}
        <div className="md:col-span-2">
          <Card className="bg-gray-900 border-gray-800 h-full">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="mr-2 h-5 w-5 text-indigo-400" />
                Story
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none">
                {storyData.content.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="mb-4 text-gray-300 leading-relaxed">
                    {paragraph.trim()}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Audio player */}
      <Card className="bg-gray-900 border-gray-800 mb-6">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Progress bar */}
            <div 
              className="w-full h-2 bg-gray-800 rounded-full cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickPosition = e.clientX - rect.left;
                const clickPercent = (clickPosition / rect.width) * 100;
                handleSeek(clickPercent);
              }}
            >
              <div 
                className="h-full bg-indigo-500 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            
            {/* Time display and controls */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                {formatDuration(currentTime)} / {formatDuration(storyData.duration)}
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="border-gray-700 h-10 w-10"
                  onClick={handleSkipBack}
                >
                  <SkipBack className="h-5 w-5" />
                </Button>
                
                <Button 
                  className="bg-indigo-600 hover:bg-indigo-700 h-12 w-12 rounded-full"
                  size="icon"
                  onClick={togglePlayPause}
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5 ml-1" />
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="border-gray-700 h-10 w-10"
                  onClick={handleSkipForward}
                >
                  <SkipForward className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-gray-400" />
                <div className="w-24 h-2 bg-gray-800 rounded-full">
                  <div className="w-3/4 h-full bg-gray-600 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Character information */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5 text-indigo-400" />
            Characters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {storyData.characters.map((character, index) => (
              <div 
                key={index}
                className="bg-gray-800/50 border border-gray-700 rounded-lg p-4"
              >
                <h3 className="text-white font-medium mb-1">{character.name}</h3>
                {character.description && (
                  <p className="text-sm text-gray-400">{character.description}</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}