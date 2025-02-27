"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { DashboardNavbar } from "@/components/dashboard/navbar";
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

// Mocked story data - in a real app, this would come from an API
const mockStory = {
  id: "story-1",
  title: "Emma's Magical Forest Adventure",
  createdAt: new Date("2023-12-15"),
  duration: 180, // seconds
  coverImage: "https://images.unsplash.com/photo-1739361133037-77be66a4ea6a?q=80&w=2942&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  audioUrl: "/story.wav", // This would be a real audio file path in production
  isFavorite: false,
  language: "english",
  theme: "adventure",
  backgroundMusic: "calming",
  characters: [
    { name: "Emma", description: "A curious and brave 8-year-old girl" },
    { name: "Max", description: "Emma's loyal pet dog who can understand her" }
  ],
  images: [
    "https://plus.unsplash.com/premium_photo-1667055670093-8f854237e146?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8Zm9yZXN0JTJDJTIwZ2lybHxlbnwwfHwwfHx8MA%3D%3D",
    "https://plus.unsplash.com/premium_photo-1666264407389-d9a4a5c524ea?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1528184039930-bd03972bd974?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
  ],
  content: `
    Once upon a time, in a lush green forest that sparkled with morning dew, lived a curious girl named Emma. 
    Emma loved exploring with her loyal dog Max, who followed her everywhere she went.
    
    One sunny morning, Emma noticed a trail of glowing mushrooms she had never seen before. 
    "Look Max!" she whispered excitedly. "Let's follow them and see where they lead."
    
    Max wagged his tail and barked softly, as if agreeing to the adventure. Together, they followed the 
    magical mushroom path deeper into the forest. The trees grew taller, and the sunlight filtered through 
    the leaves in golden beams.
    
    As they walked, they heard the gentle babbling of a stream. When they reached it, Emma gasped in wonder. 
    The stream wasn't filled with water, but with liquid starlight that glowed and sparkled.
    
    "This is amazing!" Emma said, watching as Max cautiously sniffed at the shimmering stream.
    
    Suddenly, the forest fell quiet. A gentle breeze rustled the leaves, carrying whispers that sounded like 
    the forest was speaking. Emma closed her eyes and listened carefully.
    
    "Thank you for visiting our special place," the whispers seemed to say. "Kind children who respect nature 
    are always welcome here."
    
    Emma smiled and whispered back, "Thank you for showing us your magic."
    
    As the sun began to set, Emma and Max followed the mushroom path back home, their hearts full of wonder 
    and magic. They knew they would return to visit their new forest friends again soon.
    
    And as Emma drifted off to sleep that night, she could still hear the gentle whispers of the forest in her dreams, 
    promising more adventures to come.
  `
};

interface StoryDetailPageProps {
  params: { storyId: string };
}

export default function StoryDetailPage({ params }: StoryDetailPageProps) {
  // In a real app, we would fetch the story data using the storyId
  const storyId = params.storyId;
  const router = useRouter();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isFavorite, setIsFavorite] = useState(mockStory.isFavorite);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Simulate loading the audio file
  useEffect(() => {
    if (typeof Audio !== 'undefined') {
      audioRef.current = new Audio(mockStory.audioUrl);
      
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('ended', handleAudioEnded);
      
      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
          audioRef.current.removeEventListener('ended', handleAudioEnded);
          audioRef.current.pause();
        }
      };
    }
  }, []);
  
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration || mockStory.duration;
      const progressPercent = (current / duration) * 100;
      
      setCurrentTime(current);
      setProgress(progressPercent);
      
      // Update active image based on progress
      // This is a simple implementation - in a real app, you might have 
      // timestamps for each image to know exactly when to switch
      const imageIndex = Math.min(
        Math.floor((progressPercent / 100) * mockStory.images.length),
        mockStory.images.length - 1
      );
      setActiveImageIndex(imageIndex);
    }
  };
  
  const handleAudioEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setActiveImageIndex(0);
  };
  
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const handleSeek = (value: number) => {
    if (audioRef.current) {
      const seekTime = (value / 100) * (audioRef.current.duration || mockStory.duration);
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
        audioRef.current.duration || mockStory.duration,
        audioRef.current.currentTime + 10
      );
    }
  };
  
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // In a real app, you would save this to the database
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
      french: "French 🇫🇷",
      japanese: "Japanese 🇯🇵",
      indonesian: "Indonesian 🇮🇩"
    };
    return languages[langCode] || langCode;
  };

  return (
    <>
      <DashboardNavbar />
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
              <h1 className="text-3xl font-bold text-white mb-2">{mockStory.title}</h1>
              <p className="text-gray-400">
                Created on {formatDateForDisplay(mockStory.createdAt)}
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className={`border-gray-700 ${isFavorite ? 'text-red-500' : 'text-gray-400'}`}
                onClick={toggleFavorite}
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
              {getLanguageDisplay(mockStory.language)}
            </Badge>
            <Badge className="bg-green-900/50 text-green-300">
              <BookOpen className="mr-1 h-3 w-3" />
              {mockStory.theme}
            </Badge>
            <Badge className="bg-purple-900/50 text-purple-300">
              <Music className="mr-1 h-3 w-3" />
              {mockStory.backgroundMusic}
            </Badge>
            <Badge className="bg-amber-900/50 text-amber-300">
              <Users className="mr-1 h-3 w-3" />
              {mockStory.characters.length} characters
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
                  src={mockStory.images[activeImageIndex]}
                  alt={`Story image ${activeImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Thumbnail navigator */}
              <CardFooter className="flex justify-center p-4 gap-2">
                {mockStory.images.map((image, index) => (
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
                  {mockStory.content.split('\n\n').map((paragraph, index) => (
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
                  {formatDuration(currentTime)} / {formatDuration(mockStory.duration)}
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
              {mockStory.characters.map((character, index) => (
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
    </>
  );
}