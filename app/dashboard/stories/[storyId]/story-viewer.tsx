"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
  Sparkles,
  AlertCircle
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
import { getAdminClient, supabase } from '@/lib/supabase';
import useOptimisticUpdate from "@/hooks/useOptimisticUpdate";
import { Skeleton } from "@/components/ui/skeleton";

interface StoryViewerProps {
  initialStory: Story;
}

export default function StoryViewer({ initialStory }: StoryViewerProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  
  const [story] = useState<Story>(initialStory);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playedTime, setPlayedTime] = useState(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Loading states for progressive loading
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [textLoaded, setTextLoaded] = useState(false);
  const [headerLoaded, setHeaderLoaded] = useState(false);
  const [imageLoadingProgress, setImageLoadingProgress] = useState(0);
  
  // Use our custom hook for optimistic updates
  const [isFavorite, updateFavorite, isUpdatingFavorite] = useOptimisticUpdate(initialStory.is_favorite);
  const [isDeleting, updateDeleting, isDeletingPending] = useOptimisticUpdate(false);
  const [audioError, setAudioError] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  const audioRef = useRef<HTMLAudioElement>(null);
  
  
  // Add timeout mechanism for loading states
  useEffect(() => {
    // Set a timeout to force audioLoaded to true after 8 seconds
    const audioTimeout = setTimeout(() => {
      if (!audioLoaded) {
        console.log("Audio loading timed out - forcing loaded state");
        setAudioLoaded(true);
      }
    }, 8000);
    
    // Set a timeout to force imagesLoaded to true after 10 seconds
    const imagesTimeout = setTimeout(() => {
      if (!imagesLoaded) {
        console.log("Images loading timed out - forcing loaded state");
        setImagesLoaded(true);
        setImageLoadingProgress(100);
      }
    }, 10000);
    
    // Set a timeout to force textLoaded to true after 5 seconds
    const textTimeout = setTimeout(() => {
      if (!textLoaded) {
        console.log("Text loading timed out - forcing loaded state");
        setTextLoaded(true);
      }
    }, 5000);
    
    return () => {
      clearTimeout(audioTimeout);
      clearTimeout(imagesTimeout);
      clearTimeout(textTimeout);
    };
  }, [audioLoaded, imagesLoaded, textLoaded]);
  
  // Simulate progressive loading
  useEffect(() => {
    // Start header loading immediately
    setHeaderLoaded(true);
    
    // Load images progressively
    const imageProgressInterval = setInterval(() => {
      setImageLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(imageProgressInterval);
          setImagesLoaded(true);
          return 100;
        }
        return prev + 10;
      });
    }, 100);
    
    // Simulate text content loading
    const textTimer = setTimeout(() => {
      setTextLoaded(true);
    }, 600);
    
    return () => {
      clearInterval(imageProgressInterval);
      clearTimeout(textTimer);
    };
  }, []);
  
  // Record play progress every 10 seconds
  useEffect(() => {
    let recordInterval: NodeJS.Timeout;
    
    if (isPlaying && story && session?.user?.id) {
      recordInterval = setInterval(async () => {
        const progressPercentage = Math.round((currentTime / duration) * 100);
        
        // Only record if significant progress has been made
        if (currentTime - playedTime > 10) {
          try {
            const client = typeof window === 'undefined' ? getAdminClient() : supabase;
            // Use Supabase to record play progress
            await client
              .from('play_history')
              .insert({
                user_id: session.user.id,
                story_id: story.id,
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
  }, [isPlaying, currentTime, duration, playedTime, story, session?.user?.id]);
  
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
    const client = typeof window === 'undefined' ? getAdminClient() : supabase;
    // Use our custom hook for optimistic update
    const result = await updateFavorite(!isFavorite, async () => {
      const { error } = await client
        .from('stories')
        .update({ is_favorite: !isFavorite })
        .eq('id', story.id)
        .eq('user_id', session.user.id);
      
      if (error) throw error;
    });
    
    // Show appropriate toast based on result
    if (result.success) {
      toast({
        title: isFavorite ? "Removed from Favorites" : "Added to Favorites",
        description: isFavorite 
          ? "Story has been removed from your favorites" 
          : "Story has been added to your favorites",
        variant: "default"
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update favorite status. Please try again.",
        variant: "destructive"
      });
    }
  };

    // Add keyboard shortcut handling
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Only handle shortcuts if audio is loaded
        if (!audioLoaded || audioError) return;
        
        switch (e.key) {
          case ' ': // Space bar for play/pause
            e.preventDefault(); // Prevent page scrolling
            togglePlayPause();
            break;
          case 'ArrowLeft': // Left arrow for rewind 10 seconds
            if (audioRef.current) {
              const newTime = Math.max(0, currentTime - 10);
              audioRef.current.currentTime = newTime;
              setCurrentTime(newTime);
            }
            break;
          case 'ArrowRight': // Right arrow for forward 10 seconds
            if (audioRef.current && duration) {
              const newTime = Math.min(duration, currentTime + 10);
              audioRef.current.currentTime = newTime;
              setCurrentTime(newTime);
            }
            break;
          case 'f': // 'f' key for favorite toggle
            if (!isUpdatingFavorite) {
              toggleFavorite();
            }
            break;
          case 'm': // 'm' key for mute/unmute
            if (audioRef.current) {
              audioRef.current.muted = !audioRef.current.muted;
            }
            break;
        }
      };
      
      // Add event listener
      window.addEventListener('keydown', handleKeyDown);
      
      // Clean up
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }, [audioLoaded, audioError, currentTime, duration, isUpdatingFavorite, togglePlayPause, toggleFavorite]);
  
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };
  
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setAudioLoaded(true);
    }
  };
  
  const handleEnded = async () => {
    setIsPlaying(false);
    setCurrentTime(0);
    
    if (!session?.user?.id) return;
    
    try {
      const client = typeof window === 'undefined' ? getAdminClient() : supabase;
      // Record completed play using Supabase
      await client
        .from('play_history')
        .insert({
          user_id: session.user.id,
          story_id: story.id,
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
    
    // Close the dialog immediately for better UX
    setIsDeleteDialogOpen(false);
    
    // Show optimistic feedback
    toast({
      title: "Deleting Story...",
      description: "Your story is being deleted",
    });
    const client = typeof window === 'undefined' ? getAdminClient() : supabase;
    // Use our custom hook for optimistic update
    const result = await updateDeleting(true, async () => {
      const { error } = await client
        .from('stories')
        .delete()
        .eq('id', story.id)
        .eq('user_id', session.user.id);
      
      if (error) throw error;
    });
    
    if (result.success) {
      toast({
        title: "Story Deleted",
        description: "The story has been permanently deleted",
        variant: "default"
      });
      
      // Redirect to library
      router.push("/dashboard/library");
    } else {
      toast({
        title: "Error",
        description: "Failed to delete story. Please try again.",
        variant: "destructive"
      });
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
  
  // Use memoization to prevent unnecessary recalculations
  const storyPlayerData = useMemo(() => convertToStoryPlayerFormat(), [story]);
  
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 animate-in fade-in-50 duration-500">
      {/* Back Button */}
      <Link href="/dashboard/library" className="inline-flex items-center text-gray-400 hover:text-white mb-6">
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Library
      </Link>
      
      {/* Story Header with Loading State */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {!headerLoaded ? (
            <Skeleton className="h-9 w-3/4" />
          ) : (
            <h1 className="text-3xl font-bold text-white animate-in fade-in-50 slide-in-from-left-5 duration-500">{story.title}</h1>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-500 hover:text-red-500 hover:bg-red-900/20 transition-opacity duration-500"
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={isDeletingPending || !headerLoaded}
            style={{ opacity: headerLoaded ? 1 : 0 }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-3 text-gray-400">
          {!headerLoaded ? (
            <>
              <Skeleton className="h-4 w-24" />
              <div className="w-1 h-1 rounded-full bg-gray-800" />
              <Skeleton className="h-4 w-16" />
              <div className="w-1 h-1 rounded-full bg-gray-800" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <div className="w-1 h-1 rounded-full bg-gray-800" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </>
          ) : (
            <>
              <span className="animate-in fade-in duration-300 delay-100">{new Date(story.created_at).toLocaleDateString()}</span>
              <span className="animate-in fade-in duration-300 delay-100">•</span>
              <span className="animate-in fade-in duration-300 delay-150">{formatDuration(story.duration || 0)}</span>
              <span className="animate-in fade-in duration-300 delay-150">•</span>
              <Badge className="bg-indigo-900/60 text-indigo-300 hover:bg-indigo-900/60 animate-in fade-in duration-300 delay-200">
                {story.theme.charAt(0).toUpperCase() + story.theme.slice(1)}
              </Badge>
              <span className="animate-in fade-in duration-300 delay-200">•</span>
              <Badge variant="outline" className="border-gray-700 text-gray-400 animate-in fade-in duration-300 delay-250">
                {story.language.toUpperCase()}
              </Badge>
            </>
          )}
        </div>
      </div>
      
      {/* Enhanced Reading Experience - New Button */}
      <Card className="bg-gradient-to-r from-indigo-900/60 to-purple-900/60 border-gray-800 mb-8 p-6 relative overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-500">
        <div className="absolute inset-0 bg-[url('/backgrounds/sparkles.svg')] bg-repeat opacity-10 animate-pulse"></div>
        <div className="relative z-10 flex lg:flex-row flex-col items-center justify-between space-y-5 lg:space-y-0">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Immersive Reading Experience</h3>
            <p className="text-gray-300 max-w-md">
              Experience this story with background effects, smooth transitions, and enhanced audio controls.
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                className="bg-gradient-to-r text-white from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                disabled={!imagesLoaded || !audioLoaded}
              >
                {(!imagesLoaded || !audioLoaded) ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Loading... {Math.round(imageLoadingProgress)}%
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 text-white" />
                    Start Immersive Mode
                  </>
                )}
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
      
      {/* Story Images with Loading State */}
      {story.images && story.images.length > 0 && (
        <Card className="bg-gray-900 border-gray-800 mb-8 p-6 animate-in fade-in slide-in-from-bottom-5 duration-500 delay-150">
          <div className="relative">
            {!imagesLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                <div className="h-10 w-10 mb-2 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
                <div className="text-sm text-gray-400">Loading images ({Math.round(imageLoadingProgress)}%)</div>
                <div className="w-48 h-2 bg-gray-800 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-300"
                    style={{ width: `${imageLoadingProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
            <Carousel className="w-full">
              <CarouselContent>
                {story.images.map((image, index) => (
                  <CarouselItem key={image.id || index} className="flex justify-center">
                    <div className="relative aspect-video max-h-[400px] overflow-hidden rounded-md">
                      {!imagesLoaded ? (
                        <Skeleton className="w-full h-full absolute inset-0" />
                      ) : null}
                      <img 
                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${image.storage_path}`}
                        alt={`Story image ${index + 1}`}
                        className={`object-contain w-full h-full transition-opacity duration-500 ${imagesLoaded ? 'opacity-100' : 'opacity-0'}`}
                        onLoad={() => {
                          if (index === 0) {
                            // Simulate gradual loading for the first image
                            const timer = setTimeout(() => {
                              setImagesLoaded(true);
                              clearTimeout(timer);
                            }, 300);
                          }
                        }}
                        onError={() => {
                          console.error(`Error loading image ${index}:`, image.storage_path);
                          // Mark this specific image as having an error
                          setImageErrors(prev => ({ ...prev, [index]: true }));
                          // If this is the first image, ensure we still set imagesLoaded to true
                          if (index === 0) {
                            setImagesLoaded(true);
                          }
                          // Show a toast only for the first error to avoid spamming
                          if (Object.keys(imageErrors).length === 0) {
                            toast({
                              title: "Image Loading Error",
                              description: "Some images couldn't be loaded. You can still enjoy the story.",
                              variant: "destructive"
                            });
                          }
                        }}
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className={`left-2 transition-opacity duration-300 ${!imagesLoaded ? 'opacity-0' : 'opacity-100'}`} />
              <CarouselNext className={`right-2 transition-opacity duration-300 ${!imagesLoaded ? 'opacity-0' : 'opacity-100'}`} />
            </Carousel>
          </div>
          <div className="text-center text-xs text-gray-500 mt-3">
            {story.images.length} {story.images.length === 1 ? 'image' : 'images'} • 
            Swipe or use arrows to navigate
          </div>
        </Card>
      )}
      
      {/* Audio Player with Loading State */}
      <Card className="bg-gray-900 border-gray-800 mb-8 p-6 animate-in fade-in slide-in-from-bottom-5 duration-500 delay-200">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/20"
              onClick={togglePlayPause}
              disabled={!audioLoaded || audioError}
            >
              {!audioLoaded ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
              ) : audioError ? (
                <AlertCircle className="h-10 w-10 text-red-500" />
              ) : isPlaying ? (
                <PauseCircle className="h-10 w-10" />
              ) : (
                <PlayCircle className="h-10 w-10" />
              )}
            </Button>
            
            <div className="flex-1 mx-4">
              <div 
                className="h-2 bg-gray-800 rounded-full overflow-hidden cursor-pointer"
                onClick={audioLoaded ? handleSeek : undefined}
              >
                {!audioLoaded ? (
                  <div className="h-full w-full animate-pulse bg-gray-700 rounded-full"></div>
                ) : (
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-300"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                )}
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-400">
                <span>{!audioLoaded ? "--:--" : formatDuration(currentTime)}</span>
                <span>{!audioLoaded ? "--:--" : formatDuration(duration)}</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className={`h-10 w-10 ${
                  isFavorite ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-gray-300'
                } relative`}
                onClick={toggleFavorite}
                disabled={isUpdatingFavorite || !audioLoaded}
              >
                <Heart className="h-5 w-5" fill={isFavorite ? "currentColor" : "none"} />
                {isUpdatingFavorite && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
                    <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent"></div>
                  </span>
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-gray-400 hover:text-gray-300"
                onClick={handleShare}
                disabled={!audioLoaded}
              >
                <Share className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-gray-400 hover:text-gray-300"
                onClick={downloadAudio}
                disabled={!audioLoaded}
              >
                <Download className="h-5 w-5" />
              </Button>
            </div>
          </div>
          {audioLoaded && !audioError && (
            <div className="text-xs text-gray-500 mt-2">
              <p>Keyboard shortcuts: Space (play/pause), ← (rewind 10s), → (forward 10s), F (favorite), M (mute)</p>
            </div>
          )}
          {/* Hidden audio element */}
          <audio
            ref={audioRef}
            src={story.audio_url || ''}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
            onError={() => {
              console.error("Error loading audio:", story.audio_url);
              setAudioError(true);
              toast({
                title: "Audio Error",
                description: "Failed to load audio. You can still read the story, but audio playback won't be available.",
                variant: "destructive"
              });
              // Set audio as loaded but with an error state
              setAudioLoaded(true);
            }}
            className="hidden"
            preload="metadata"
          />
        </div>
      </Card>
      
      {/* Characters with Loading State */}
      {story.characters && story.characters.length > 0 && (
        <div className="mb-6 animate-in fade-in slide-in-from-bottom-5 duration-500 delay-250">
          <h3 className="text-lg font-semibold text-white mb-3">Characters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {story.characters.map((character, index) => (
              <Card 
                key={index} 
                className={`bg-gray-800/50 border-gray-800 p-4 transition-all duration-500 ${
                  textLoaded 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-40 translate-y-2'
                }`}
                style={{ 
                  transitionDelay: `${150 + (index * 50)}ms`
                }}
              >
                {!textLoaded ? (
                  <>
                    <Skeleton className="h-5 w-1/3 mb-2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3 mt-1" />
                  </>
                ) : (
                  <>
                    <h4 className="font-medium text-indigo-300">{character.name}</h4>
                    {character.description && (
                      <p className="text-sm text-gray-400 mt-1">{character.description}</p>
                    )}
                  </>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {/* Story Text with Loading State */}
      <Card className="bg-gray-900 border-gray-800 p-6 animate-in fade-in slide-in-from-bottom-5 duration-500 delay-300">
        <div className="prose prose-invert max-w-none">
          {!textLoaded ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-11/12 mt-1" />
                  <Skeleton className="h-4 w-4/5 mt-1" />
                </div>
              ))}
            </div>
          ) : (
            story.text_content?.split('\n\n').map((paragraph, index) => (
              <p 
                key={index} 
                className="transition-all duration-700"
                style={{ 
                  opacity: textLoaded ? 1 : 0,
                  transform: textLoaded ? 'translateY(0)' : 'translateY(10px)',
                  transitionDelay: `${300 + (index * 50)}ms`
                }}
              >
                {paragraph}
              </p>
            ))
          )}
        </div>
      </Card>
      
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
    </div>
  );
}
