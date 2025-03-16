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
import { motion } from "framer-motion";
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
  ArrowLeft,
  Check
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDuration } from "@/lib/format-duration";
import { toggleFavoriteAction } from "@/app/actions/story-actions";
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
    // Optimistic update UI
    setIsFavorite(newFavoriteState);
    
    try {
      console.log(`[StoryDetail] Toggling favorite for story ${storyId}, current state: ${isFavorite}`);
      
      // Use the server action directly to avoid CORS issues
      const response = await toggleFavoriteAction(storyId, newFavoriteState);
      console.log(`[StoryDetail] Server action response:`, response);
      
      if (!response.success) {
        // Revert state if operation was not successful
        setIsFavorite(isFavorite);
        toast.error("Failed to update favorite status.");
      } else {
        // Show success toast
        toast.success(newFavoriteState ? "Added to favorites" : "Removed from favorites");
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
        
        {/* Story text - Book-like UI */}
        <div className="md:col-span-2">
          <Card className="bg-gradient-to-b from-gray-900 to-gray-950 border-gray-800 h-full relative overflow-hidden shadow-xl">
            {/* Decorative Book Elements */}
            <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-indigo-900/40 border-b border-indigo-800/50"></div>
            <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-indigo-900/40 to-transparent"></div>
            
            <CardHeader className="relative z-10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full blur-3xl -z-10"></div>
              <CardTitle className="flex items-center text-2xl font-serif">
                <BookOpen className="mr-3 h-5 w-5 text-indigo-400" />
                <span className="text-indigo-100 drop-shadow-sm">Story</span>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="relative z-10 p-8">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="prose prose-invert max-w-none font-serif"
              >
                {storyData.content.split('\n\n').map((paragraph, index) => (
                  <motion.p 
                    key={index} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 * (index + 1) }}
                    className="mb-6 text-gray-200 leading-relaxed text-lg first-letter:text-3xl first-letter:font-bold first-letter:text-indigo-300 first-letter:mr-1 first-letter:float-left"
                  >
                    {paragraph.trim()}
                  </motion.p>
                ))}
              </motion.div>
              
              {/* Decorative elements */}
              <div className="absolute bottom-4 right-4 text-gray-700 font-serif italic text-sm">~ The End ~</div>
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-blue-600/5 rounded-full blur-3xl -z-10"></div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Enhanced Audio player with animations */}
      <Card className="bg-gradient-to-b from-indigo-950/60 to-gray-900 border-indigo-900/30 shadow-xl mb-8 relative overflow-hidden">
        {/* Background animation effects */}
        <div className="absolute inset-0 bg-[url('/backgrounds/sparkles.svg')] opacity-5 bg-repeat"></div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl"></div>
        
        <CardContent className="p-6 relative z-10">
          <div>
            {/* Visual audio wave effect */}
            <div className="flex justify-center items-end h-16 mb-4 gap-[2px] mx-auto max-w-lg">
              {Array.from({ length: 40 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-indigo-500/60"
                  initial={{ height: 4 }}
                  animate={{ 
                    height: isPlaying 
                      ? Math.max(6, Math.min(40, 
                          8 + 10 * Math.sin((i * 0.5) + Date.now() / (300 + i * 20))
                        )) 
                      : 4 
                  }}
                  transition={{ 
                    duration: 0.1,
                    repeat: Infinity,
                    repeatType: "mirror"
                  }}
                />
              ))}
            </div>
            
            {/* Interactive Progress bar */}
            <div className="relative w-full h-3 mb-3">
              <div 
                className="absolute inset-0 bg-gray-800/80 rounded-full cursor-pointer overflow-hidden backdrop-blur-sm"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickPosition = e.clientX - rect.left;
                  const clickPercent = (clickPosition / rect.width) * 100;
                  handleSeek(clickPercent);
                }}
              >
                <motion.div 
                  className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full"
                  style={{ width: `${progress}%` }}
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ type: "spring", bounce: 0 }}
                />
                
                {/* Current position indicator */}
                <motion.div 
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-md cursor-grab active:cursor-grabbing"
                  style={{ left: `calc(${progress}% - 8px)` }}
                  initial={{ left: "0%" }}
                  animate={{ left: `calc(${progress}% - 8px)` }}
                  transition={{ type: "spring", bounce: 0 }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0}
                  dragMomentum={false}
                  onDrag={(e, info) => {
                    const parentWidth = (e.target as HTMLElement).parentElement?.offsetWidth || 0;
                    const newPercent = Math.max(0, Math.min(100, (info.point.x / parentWidth) * 100));
                    handleSeek(newPercent);
                  }}
                />
              </div>
            </div>
            
            {/* Time display */}
            <div className="flex justify-between text-xs text-gray-400 mb-6">
              <div>{formatDuration(currentTime)}</div>
              <div>{formatDuration(storyData.duration)}</div>
            </div>
            
            {/* Player controls - Center aligned for mobile */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 order-2 sm:order-1">
                <Volume2 className="h-5 w-5 text-indigo-300" />
                <div className="w-24 h-2 bg-gray-800/80 rounded-full overflow-hidden">
                  <div className="w-3/4 h-full bg-indigo-600/70 rounded-full"></div>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-3 order-1 sm:order-2">
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  className="bg-gray-800/60 backdrop-blur-sm h-12 w-12 rounded-full flex items-center justify-center text-indigo-300 border border-indigo-900/50"
                  onClick={handleSkipBack}
                >
                  <SkipBack className="h-5 w-5" />
                </motion.button>
                
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  className={`${isPlaying 
                    ? 'bg-gradient-to-br from-purple-600 to-indigo-700' 
                    : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                  } h-16 w-16 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-900/20`}
                  onClick={togglePlayPause}
                >
                  {isPlaying ? (
                    <Pause className="h-7 w-7" />
                  ) : (
                    <Play className="h-7 w-7 ml-1" />
                  )}
                  
                  {/* Pulse animation when playing */}
                  {isPlaying && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-indigo-500"
                      animate={{
                        opacity: [1, 0],
                        scale: [1, 1.4]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeOut"
                      }}
                      style={{ zIndex: -1 }}
                    />
                  )}
                </motion.button>
                
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  className="bg-gray-800/60 backdrop-blur-sm h-12 w-12 rounded-full flex items-center justify-center text-indigo-300 border border-indigo-900/50"
                  onClick={handleSkipForward}
                >
                  <SkipForward className="h-5 w-5" />
                </motion.button>
              </div>
              
              <div className="order-3 sm:order-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-1.5 py-2 px-3 rounded-full text-sm ${
                    isFavorite 
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                      : 'bg-gray-800/40 text-gray-300 border border-gray-700'
                  }`}
                  onClick={handleToggleFavorite}
                >
                  <Heart className="h-4 w-4" fill={isFavorite ? "#ef4444" : "none"} />
                  <span className="hidden sm:inline">
                    {isFavorite ? "Favorited" : "Add to Favorites"}
                  </span>
                </motion.button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Character information - Enhanced with animations */}
      <Card className="bg-gradient-to-b from-gray-900 to-gray-950 border-gray-800 shadow-lg relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-purple-600/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-600/5 rounded-full blur-3xl"></div>
        
        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center text-2xl">
            <Users className="mr-3 h-6 w-6 text-indigo-400" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-purple-300">
              Characters
            </span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="relative z-10">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {storyData.characters.map((character, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
                whileHover={{ scale: 1.02, y: -2 }}
                className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm border border-indigo-900/30 rounded-xl p-5 shadow-md relative overflow-hidden"
              >
                {/* Character sparkle effect in corner */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/10 rounded-full blur-xl -z-10"></div>
                
                <div className="flex items-start gap-3">
                  {/* Character icon/avatar */}
                  <div className="bg-indigo-900/40 text-indigo-300 rounded-full h-10 w-10 flex items-center justify-center flex-shrink-0 border border-indigo-700/40">
                    {character.name.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-white mb-1.5">{character.name}</h3>
                    {character.description ? (
                      <p className="text-sm text-gray-300 italic leading-relaxed">
                        "{character.description}"
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400">Main character in the story</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
}