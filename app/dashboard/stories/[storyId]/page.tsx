// app/dashboard/stories/[id]/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { DashboardNavbar } from "@/components/dashboard/navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  PlayCircle, 
  PauseCircle, 
  Heart, 
  Share, 
  Download, 
  ChevronLeft,
  Trash2,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { formatDuration } from "@/lib/format-duration";
import { Story } from "@/types/story";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { StoryPlayer } from "@/components/story-playback/story-player";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase, getAdminClient } from "@/lib/supabase";

export default function StoryPage() {
  const { id } = useParams() as { id: string };
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  
  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playedTime, setPlayedTime] = useState(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Record play progress every 10 seconds
  useEffect(() => {
    let recordInterval: NodeJS.Timeout;
    
    if (isPlaying && story && session?.user?.id) {
      recordInterval = setInterval(async () => {
        const progressPercentage = Math.round((currentTime / duration) * 100);
        
        // Only record if significant progress has been made
        if (currentTime - playedTime > 10) {
          try {
            // Use Supabase to record play progress
            const client = typeof window === 'undefined' ? getAdminClient() : supabase;
            
            await client
              .from('play_history')
              .insert({
                user_id: session.user.id,
                story_id: id,
                played_at: new Date().toISOString(),
                completed: false,
                progress_percentage: progressPercentage
              });
              
            setPlayedTime(currentTime);
          } catch (error) {
            console.error("Error recording play progress:", error);
          }
        }
      }, 10000); // Record every 10 seconds
    }
    
    return () => {
      if (recordInterval) clearInterval(recordInterval);
    };
  }, [isPlaying, currentTime, duration, playedTime, id, story, session?.user?.id]);
  
  // Fetch story data directly from Supabase
  useEffect(() => {
    const fetchStory = async () => {
      if (!session?.user?.id) return;
      
      try {
        setIsLoading(true);
        setLoadError(null);
        
        // Use Supabase client to fetch story data
        const client = typeof window === 'undefined' ? getAdminClient() : supabase;
        
        // Fetch the story with related data
        const { data, error } = await client
          .from('stories')
          .select(`
            *,
            images(id, storage_path, sequence_index),
            characters(id, name, description),
            background_music:background_music_id(
              id, 
              name, 
              storage_path, 
              category
            )
          `)
          .eq('id', id)
          .eq('user_id', session.user.id)
          .single();
        
        if (error) {
          console.error("Error fetching story:", error);
          setLoadError("Failed to load story. Please try again later.");
          return;
        }
        
        if (!data) {
          setLoadError("Story not found");
          return;
        }
        
        // Sort images by sequence_index if available
        if (data.images && Array.isArray(data.images)) {
          data.images.sort((a: any, b: any) => 
            (a.sequence_index || 0) - (b.sequence_index || 0)
          );
        }
        
        // Convert Supabase data to Story type
        const storyData: Story = {
          ...data,
          is_favorite: data.is_favorite || false,
        };
        
        setStory(storyData);
        setIsFavorite(storyData.is_favorite);
      } catch (error) {
        console.error("Error in fetchStory:", error);
        setLoadError("An unexpected error occurred. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStory();
  }, [id, session]);
  
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(error => {
          console.error("Error playing audio:", error);
          toast({
            title: "Playback Error",
            description: "Failed to play audio. Please try again.",
            variant: "destructive"
          });
        });
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const toggleFavorite = async () => {
    if (!session?.user?.id || !story) return;
    
    try {
      // Use Supabase to toggle favorite status
      const client = typeof window === 'undefined' ? getAdminClient() : supabase;
      
      const { data, error } = await client
        .from('stories')
        .update({ is_favorite: !isFavorite })
        .eq('id', id)
        .eq('user_id', session.user.id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      setIsFavorite(!isFavorite);
      
      toast({
        title: !isFavorite ? "Added to Favorites" : "Removed from Favorites",
        description: !isFavorite 
          ? "Story has been added to your favorites" 
          : "Story has been removed from your favorites",
        variant: "default"
      });
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast({
        title: "Error",
        description: "Failed to update favorite status. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };
  
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };
  
  const handleEnded = async () => {
    setIsPlaying(false);
    setCurrentTime(0);
    
    if (!session?.user?.id) return;
    
    try {
      // Record completed play using Supabase
      const client = typeof window === 'undefined' ? getAdminClient() : supabase;
      
      await client
        .from('play_history')
        .insert({
          user_id: session.user.id,
          story_id: id,
          played_at: new Date().toISOString(),
          completed: true,
          progress_percentage: 100
        });
    } catch (error) {
      console.error("Error recording completed play:", error);
    }
  };
  
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current && duration > 0) {
      const progressBar = e.currentTarget;
      const bounds = progressBar.getBoundingClientRect();
      const x = e.clientX - bounds.left;
      const width = bounds.width;
      const seekTime = (x / width) * duration;
      
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };
  
  const handleDeleteStory = async () => {
    if (!session?.user?.id) return;
    
    try {
      setIsDeleting(true);
      
      // Use Supabase to delete the story
      const client = typeof window === 'undefined' ? getAdminClient() : supabase;
      
      const { error } = await client
        .from('stories')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Story Deleted",
        description: "The story has been permanently deleted",
        variant: "default"
      });
      
      // Redirect to stories list
      router.push("/dashboard/library");
    } catch (error) {
      console.error("Error deleting story:", error);
      toast({
        title: "Error",
        description: "Failed to delete story. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };
  
  const handleShare = async () => {
    if (!story) return;
    
    try {
      // Copy URL to clipboard
      await navigator.clipboard.writeText(window.location.href);
      
      toast({
        title: "Link Copied",
        description: "Story link copied to clipboard",
        variant: "default"
      });
    } catch (error) {
      console.error("Error sharing story:", error);
      toast({
        title: "Error",
        description: "Failed to copy link. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const downloadAudio = () => {
    if (!story?.audio_url) return;
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = story.audio_url;
    link.download = `${story.title.replace(/\s+/g, '_')}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Convert the story to the format expected by StoryPlayer
  // Find this function in your code and replace it with this version:
// In your StoryPage component, replace the convertToStoryPlayerFormat function with this:
const convertToStoryPlayerFormat = () => {
  if (!story) return null;
  
  // Convert images to pages with text content
  const storyText = story.text_content || '';
  const paragraphs = storyText.split('\n\n').filter(p => p.trim() !== '');
  
  // Create pages by pairing images with paragraphs of text
  const pages = [];
  const images = story.images || [];
  
  // If there are more paragraphs than images, we'll spread them out
  const textPerImage = Math.max(1, Math.ceil(paragraphs.length / Math.max(1, images.length)));
  
  for (let i = 0; i < images.length; i++) {
    const startIdx = i * textPerImage;
    const endIdx = Math.min(startIdx + textPerImage, paragraphs.length);
    const pageText = paragraphs.slice(startIdx, endIdx).join('\n\n');
    
    pages.push({
      id: `page-${i + 1}`,
      text: pageText || "Enjoy this moment in the story...",
      imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${images[i].storage_path}`,
      audioUrl: story.audio_url || undefined
    });
  }
  
  // If there are paragraphs left over, add them to the last page
  if (paragraphs.length > images.length * textPerImage && pages.length > 0) {
    const remainingText = paragraphs.slice(images.length * textPerImage).join('\n\n');
    pages[pages.length - 1].text += '\n\n' + remainingText;
  }
  
  // If there are no images, create pages from text only
  if (pages.length === 0 && paragraphs.length > 0) {
    const pageSize = 3; // Number of paragraphs per page
    for (let i = 0; i < paragraphs.length; i += pageSize) {
      pages.push({
        id: `page-${i / pageSize + 1}`,
        text: paragraphs.slice(i, i + pageSize).join('\n\n'),
        audioUrl: story.audio_url || undefined
      });
    }
  }
  
  // Create the base storyPlayerData without potentially problematic properties
  const storyPlayerData: any = {
    id: story.id,
    title: story.title,
    pages,
    theme: (story.theme as any) || "adventure",
    language: story.language || "english"
  };
  
  // Only add backgroundMusicUrl if we have valid data
  // @ts-ignore - accessing the joined background_music data from Supabase
  if (story.background_music && story.background_music.storage_path) {
    // @ts-ignore
    storyPlayerData.backgroundMusicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${story.background_music.storage_path}`;
  }
  
  return storyPlayerData;
};
  
  if (isLoading) {
    return (
      <>
        <DashboardNavbar />
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        </div>
      </>
    );
  }
  
  if (loadError || !story) {
    return (
      <>
        <DashboardNavbar />
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Story Not Found</h1>
            <p className="text-gray-400 mb-6">
              {loadError || "The story you're looking for doesn't exist or you don't have permission to view it."}
            </p>
            <Link href="/dashboard/stories">
              <Button>Back to Stories</Button>
            </Link>
          </div>
        </div>
      </>
    );
  }
  
  const storyPlayerData = convertToStoryPlayerFormat();
  
  return (
    <>
      <DashboardNavbar />
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link href="/dashboard/stories" className="inline-flex items-center text-gray-400 hover:text-white mb-6">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Stories
        </Link>
        
        {/* Story Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-white">{story.title}</h1>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-500 hover:text-red-500 hover:bg-red-900/20"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-3 text-gray-400">
            <span>{new Date(story.created_at).toLocaleDateString()}</span>
            <span>•</span>
            <span>{formatDuration(story.duration || 0)}</span>
            <span>•</span>
            <Badge className="bg-indigo-900/60 text-indigo-300 hover:bg-indigo-900/60">
              {story.theme.charAt(0).toUpperCase() + story.theme.slice(1)}
            </Badge>
            <span>•</span>
            <Badge variant="outline" className="border-gray-700 text-gray-400">
              {story.language.toUpperCase()}
            </Badge>
          </div>
        </div>
        
        {/* Enhanced Reading Experience - New Button */}
        <Card className="bg-gradient-to-r from-indigo-900/60 to-purple-900/60 border-gray-800 mb-8 p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/backgrounds/sparkles.svg')] bg-repeat opacity-10 animate-pulse"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Immersive Reading Experience</h3>
              <p className="text-gray-300 max-w-md">
                Experience this story with background effects, smooth transitions, and enhanced audio controls.
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Start Immersive Mode
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-6xl p-0 bg-transparent border-0">
                {storyPlayerData && (
                  <StoryPlayer 
                    story={storyPlayerData} 
                    onClose={() => document.getElementById('close-dialog-button')?.click()}
                  />
                )}
                <button id="close-dialog-button" className="hidden" />
              </DialogContent>
            </Dialog>
          </div>
        </Card>
        
        {/* Story Images */}
        {story.images && story.images.length > 0 && (
          <Card className="bg-gray-900 border-gray-800 mb-8 p-6">
            <Carousel className="w-full">
              <CarouselContent>
                {story.images.map((image, index) => (
                  <CarouselItem key={image.id || index} className="flex justify-center">
                    <div className="relative aspect-video max-h-[400px] overflow-hidden rounded-md">
                      <img 
                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${image.storage_path}`}
                        alt={`Story image ${index + 1}`}
                        className="object-contain w-full h-full"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
            </Carousel>
            <div className="text-center text-xs text-gray-500 mt-3">
              {story.images.length} {story.images.length === 1 ? 'image' : 'images'} • 
              Swipe or use arrows to navigate
            </div>
          </Card>
        )}
        
        {/* Audio Player */}
        <Card className="bg-gray-900 border-gray-800 mb-8 p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/20"
                onClick={togglePlayPause}
              >
                {isPlaying ? (
                  <PauseCircle className="h-10 w-10" />
                ) : (
                  <PlayCircle className="h-10 w-10" />
                )}
              </Button>
              
              <div className="flex-1 mx-4">
                <div 
                  className="h-2 bg-gray-800 rounded-full overflow-hidden cursor-pointer"
                  onClick={handleSeek}
                >
                  <div 
                    className="h-full bg-indigo-500"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-400">
                  <span>{formatDuration(currentTime)}</span>
                  <span>{formatDuration(duration)}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-10 w-10 ${isFavorite ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-gray-300'}`}
                  onClick={toggleFavorite}
                >
                  <Heart className="h-5 w-5" fill={isFavorite ? "currentColor" : "none"} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-gray-400 hover:text-gray-300"
                  onClick={handleShare}
                >
                  <Share className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-gray-400 hover:text-gray-300"
                  onClick={downloadAudio}
                >
                  <Download className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {/* Hidden audio element */}
            <audio
              ref={audioRef}
              src={story.audio_url || ''}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={handleEnded}
              onError={() => {
                toast({
                  title: "Audio Error",
                  description: "Failed to load audio. Please try again later.",
                  variant: "destructive"
                });
              }}
              className="hidden"
              preload="metadata"
            />
          </div>
        </Card>
        
        {/* Story Details */}
        {story.characters && story.characters.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Characters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {story.characters.map((character, index) => (
                <Card key={index} className="bg-gray-800/50 border-gray-800 p-4">
                  <h4 className="font-medium text-indigo-300">{character.name}</h4>
                  {character.description && (
                    <p className="text-sm text-gray-400 mt-1">{character.description}</p>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {/* Story Text */}
        <Card className="bg-gray-900 border-gray-800 p-6">
          <div className="prose prose-invert max-w-none">
            {story.text_content?.split('\n\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </Card>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this story?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the story and all associated audio, images, and data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStory}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Deleting...
                </>
              ) : (
                "Delete Story"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}