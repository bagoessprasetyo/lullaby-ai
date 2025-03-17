// components/story-playback/story-viewer.tsx
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  PlayCircle, 
  PauseCircle, 
  Heart, 
  Share, 
  Download, 
  ChevronLeft,
  ChevronRight,
  Trash2,
  Sparkles,
  AlertCircle,
  BookOpen,
  Bookmark,
  Settings,
  ListMusic,
  Volume2,
  VolumeX
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
import { recordPlayStartAction, updatePlayProgressAction, toggleFavoriteAction } from '@/app/actions/story-actions';
import useOptimisticUpdate from "@/hooks/useOptimisticUpdate";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { convertStoryToPaginatedFormat } from "@/lib/utils/story-pagination";

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
  const [playHistoryId, setPlayHistoryId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("read");
  const [volume, setVolume] = useState(100); // Full volume
  const [isMuted, setIsMuted] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [loadingAudio, setLoadingAudio] = useState(true);
  const [shouldResume, setShouldResume] = useState(false);
  
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
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const tabChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      // Record play start if not already recorded
      if (!playHistoryId) {
        (async () => {
          try {
            // Use the server action to bypass RLS 
            const result = await recordPlayStartAction(story.id);
            if (result?.id) {
              console.log("Play history created with ID:", result.id);
              setPlayHistoryId(result.id);
            }
          } catch (error) {
            console.error("Error recording play start:", error);
          }
        })();
      }
      
      recordInterval = setInterval(async () => {
        const progressPercentage = Math.round((currentTime / duration) * 100);
        
        // Update play progress with the recorded history ID
        if (playHistoryId) {
          try {
            // Use the server action to bypass RLS
            await updatePlayProgressAction(playHistoryId, progressPercentage);
            setPlayedTime(currentTime);
          } catch (error) {
            console.error("Error updating play progress:", error);
          }
        }
      }, 10000); // Record every 10 seconds
    }
    
    return () => {
      if (recordInterval) clearInterval(recordInterval);
    };
  }, [isPlaying, currentTime, duration, playHistoryId, story, session?.user?.id]);
  
  const togglePlayPause = async () => {
    // Check if audio element exists
    if (!audioRef.current) {
      console.error("Audio element not found");
      
      // Try to get the direct audio player that we know works
      const directAudioPlayer = document.querySelector('#direct-audio-player') as HTMLAudioElement;
      if (directAudioPlayer) {
        toast({
          title: "Using Alternative Player",
          description: "Using the direct audio player instead. Adjusting playback...",
          variant: "default"
        });
        
        // Store this player as our reference
        audioRef.current = directAudioPlayer;
      } else {
        toast({
          title: "Playback Error",
          description: "Audio element not found. Please try using the direct audio player below.",
          variant: "destructive"
        });
        return;
      }
    }
    
    try {
      if (isPlaying) {
        // Pause logic
        console.log("Pausing audio");
        audioRef.current.pause();
        
        // Record progress when paused
        if (playHistoryId && currentTime > 0) {
          const progressPercentage = Math.round((currentTime / duration) * 100);
          try {
            // Use the server action to bypass RLS
            await updatePlayProgressAction(playHistoryId, progressPercentage);
          } catch (error) {
            console.error("Error updating play progress on pause:", error);
          }
        }
      } else {
        // Play logic with special handling to ensure audio is audible
        console.log("Attempting to play audio");
        
        // Verify we have a valid source
        if (!audioRef.current.src || audioRef.current.src === window.location.href) {
          console.log("Audio source missing, setting to story audio URL");
          if (story.audio_url) {
            audioRef.current.src = story.audio_url;
            audioRef.current.load();
          } else {
            toast({
              title: "Audio Missing",
              description: "Story doesn't have audio. Please try using the direct player below.",
              variant: "destructive"
            });
            return;
          }
        }
        
        // Force unmute and set volume to audible level
        audioRef.current.muted = false;
        audioRef.current.volume = 1.0; // Start with full volume
        setIsMuted(false);
        
        // If we don't have a play history ID yet and we're starting playback, create one
        if (!playHistoryId && session?.user?.id) {
          try {
            // Use the server action to bypass RLS
            const result = await recordPlayStartAction(story.id);
            if (result?.id) {
              console.log("Successfully recorded play start with ID:", result.id);
              setPlayHistoryId(result.id);
            }
          } catch (error) {
            console.error("Error recording play start:", error);
          }
        }
        
        // Make sure we properly handle autoplay restrictions
        try {
          // Log the audio state before playing
          console.log("Audio before play:", {
            src: audioRef.current.src,
            muted: audioRef.current.muted,
            volume: audioRef.current.volume,
            paused: audioRef.current.paused,
            readyState: audioRef.current.readyState
          });
          
          // Try to play the audio element directly
          if (audioRef.current.readyState < 2) {
            audioRef.current.load();
            
            // Wait briefly for loading
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
          // Play the audio
          await audioRef.current.play();
          console.log("Audio playback started successfully");
          toast({
            title: "Playback Started",
            description: "Audio is now playing. Adjust volume as needed.",
            variant: "default"
          });
          
          // After successful play, adjust volume to user setting
          setTimeout(() => {
            if (audioRef.current) {
              audioRef.current.volume = Math.min(1.0, (volume / 100) * 1.5);
            }
          }, 500);
        } catch (error) {
          console.error("Error playing audio:", error);
          toast({
            title: "Playback Error",
            description: "Your browser blocked autoplay. Please try using the direct audio player below.",
            variant: "destructive"
          });
          // Return early without changing isPlaying state
          return;
        }
      }
      
      // Only update playing state if we succeeded
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error("Unexpected error in togglePlayPause:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try using the direct audio player below.",
        variant: "destructive"
      });
    }
  };
  
  const toggleFavorite = async () => {
    if (!session?.user?.id || !story) return;
    
    try {
      console.log(`[StoryViewer] Toggling favorite for story ${story.id}, current state: ${isFavorite}`);
      
      // Use our custom hook for optimistic UI update
      const result = await updateFavorite(!isFavorite, async () => {
        // Use the server action directly to avoid CORS issues
        try {
          const response = await toggleFavoriteAction(story.id, !isFavorite);
          console.log(`[StoryViewer] Server action response:`, response);
          
          if (!response.success) {
            throw new Error("Server action failed to update favorite status");
          }
        } catch (error) {
          console.error(`[StoryViewer] Error in toggleFavoriteAction:`, error);
          throw error;
        }
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
    } catch (error) {
      console.error(`[StoryViewer] Exception in toggleFavorite:`, error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
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
      
      // Update progress indicator even when in a different tab
      if (activeTab !== "listen") {
        const progressPercentage = (audioRef.current.currentTime / duration) * 100;
        // Could update a progress indicator here if wanted
      }
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
      // Mark as completed in history if we have a play history ID
      if (playHistoryId) {
        await updatePlayProgressAction(playHistoryId, 100, true);
        console.log("Play history marked as completed:", playHistoryId);
      } else {
        // If somehow we don't have a play history ID, create a new completed record
        const result = await recordPlayStartAction(story.id);
        if (result?.id) {
          await updatePlayProgressAction(result.id, 100, true);
        }
      }
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
  
  // Convert the story to the paginated format expected by StoryPlayer
  const storyPlayerData = useMemo(() => {
    // Use the pagination utility to properly break the story into pages
    const paginatedStory = convertStoryToPaginatedFormat(story, {
      maxWordsPerPage: 50,
      maxParagraphsPerPage: 2,
      preserveParagraphs: true,
      firstPageWithImage: true
    });
    
    if (!paginatedStory) return null;
    
    // Create the player data structure
    const playerData = {
      id: paginatedStory.id,
      title: paginatedStory.title,
      pages: paginatedStory.pages || [],
      theme: (paginatedStory.theme as any) || "adventure",
      language: paginatedStory.language || "english"
    };
    
    // Check if we have pre-mixed audio (narration + background music)
    if (paginatedStory.mixed_audio_url) {
      (playerData as any).mixedAudioUrl = paginatedStory.mixed_audio_url;
    }
    // Otherwise add background music if available
    else if (paginatedStory.background_music && paginatedStory.background_music.storage_path) {
      (playerData as any).backgroundMusicUrl = paginatedStory.background_music.storage_path;
    }
    
    return playerData;
  }, [story]);
  
  // Check if the story text is long enough to need pagination
  const isLongStory = useMemo(() => {
    const textLength = story.text_content?.length || 0;
    const paragraphCount = story.text_content?.split('\n\n').filter(p => p.trim() !== '').length || 0;
    
    return textLength > 2000 || paragraphCount > 5;
  }, [story]);
  
  // Initialize audio element
  useEffect(() => {
    // Debug the audio URL
    console.log("Original audio URL:", story.audio_url);
    
    // Wait a moment to let the direct player render
    const setupTimer = setTimeout(() => {
      // Try to get the direct player first which we know works
      const directPlayer = document.getElementById('direct-audio-player') as HTMLAudioElement;
      
      if (directPlayer) {
        console.log("Found direct audio player, using it as primary audio reference");
        
        // Store a reference to the direct player
        audioRef.current = directPlayer;
        
        // Set up our state based on the direct player
        if (directPlayer.readyState >= 1) {
          setDuration(directPlayer.duration);
          setAudioLoaded(true);
          console.log("Direct player already has metadata loaded");
        }
        
        // We don't need to add event listeners since the direct player already has them
      } else {
        // Fallback to creating a new audio element
        console.warn("Direct audio player not found, creating a new audio element");
        
        const audioElement = document.createElement('audio');
        
        // Use the story's actual audio URL if available
        if (story.audio_url) {
          audioElement.src = story.audio_url;
          console.log("Using story audio source:", story.audio_url);
        } else {
          // Fallback to a reliable test audio file only if no audio URL exists
          const fallbackAudioUrl = 'https://assets.coderrocketfuel.com/pomodoro-times-up.mp3';
          audioElement.src = fallbackAudioUrl;
          console.log("No story audio found, using fallback audio:", fallbackAudioUrl);
        }
        
        audioElement.crossOrigin = "anonymous"; // Add for CORS if needed
        audioElement.volume = 1.0; // Start with full volume to ensure we hear something
        audioElement.muted = false; // Make sure it's not muted
        audioElement.preload = 'auto';
        audioElement.style.display = 'none';
        
        // Add UI debugging feedback for audio loading
        console.log("Audio element created with properties:", {
          src: audioElement.src,
          volume: audioElement.volume,
          muted: audioElement.muted,
          preload: audioElement.preload,
          readyState: audioElement.readyState
        });
        
        // Place it in the DOM to ensure better compatibility
        document.body.appendChild(audioElement);
        
        // Store a reference
        audioRef.current = audioElement;
        
        // Add necessary event listeners
        audioElement.addEventListener('timeupdate', handleTimeUpdate);
        audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);
        audioElement.addEventListener('ended', handleEnded);
        audioElement.addEventListener('canplaythrough', () => {
          console.log("Audio can play through now");
          setAudioLoaded(true);
        });
        audioElement.addEventListener('playing', () => {
          console.log("Audio is now playing");
        });
        audioElement.addEventListener('error', (e) => {
          console.error("Error loading audio:", e, story.audio_url);
          setAudioError(true);
          setAudioLoaded(true);
          toast({
            title: "Audio Error",
            description: `Failed to load audio. Please try using the direct audio player below.`,
            variant: "destructive"
          });
        });
      }
    }, 500); // short delay to ensure the direct player has rendered
    
    // Cleanup function
    return () => {
      clearTimeout(setupTimer);
      
      if (audioRef.current) {
        // Only clean up if it's not the direct player
        const directPlayer = document.getElementById('direct-audio-player');
        if (audioRef.current !== directPlayer) {
          audioRef.current.pause();
          audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
          audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
          audioRef.current.removeEventListener('ended', handleEnded);
          audioRef.current.removeEventListener('canplaythrough', () => {});
          audioRef.current.removeEventListener('playing', () => {});
          audioRef.current.removeEventListener('error', () => {});
          document.body.removeChild(audioRef.current);
        }
        audioRef.current = null;
      }
    };
  }, [story.audio_url, toast]);
  
  // Handle tab changes
  useEffect(() => {
    console.log("Tab changed to:", activeTab);
    
    // When tab changes to 'listen', make sure our UI state is synchronized with the actual audio state
    if (activeTab === 'listen') {
      // If direct player exists, sync our state with it
      const directPlayer = document.getElementById('direct-audio-player') as HTMLAudioElement;
      if (directPlayer) {
        // Sync our state with the direct player
        if (directPlayer.paused !== !isPlaying) {
          setIsPlaying(!directPlayer.paused);
        }
        
        // Update our currentTime and duration from the direct player
        setCurrentTime(directPlayer.currentTime);
        if (directPlayer.duration && directPlayer.duration !== duration) {
          setDuration(directPlayer.duration);
        }
        
        // Make sure audioRef points to the direct player
        if (audioRef.current !== directPlayer) {
          audioRef.current = directPlayer;
        }
        
        setAudioLoaded(true);
      }
    }
    
    // When switching to another tab while audio is playing, we may need to pause
    if (activeTab !== 'listen' && isPlaying) {
      // Don't actually pause, just ensure our state tracks the direct player
      const directPlayer = document.getElementById('direct-audio-player') as HTMLAudioElement;
      if (directPlayer && !directPlayer.paused) {
        console.log("Audio still playing on direct player, keeping state in sync");
      }
    }
  }, [activeTab]);
  
  // Resume audio after tab switching if needed
  useEffect(() => {
    // Only needed if shouldResume flag is set (which happens when player needs to resume)
    if (!shouldResume) return;
    
    console.log("Attempting to resume audio after tab change");
    
    const resumeAudio = async () => {
      try {
        // First check if the direct player exists and is not playing but should be
        const directPlayer = document.getElementById('direct-audio-player') as HTMLAudioElement;
        if (directPlayer && directPlayer.paused && isPlaying) {
          console.log("Direct player found and should be playing - resuming");
          await directPlayer.play();
          
          // Make sure our audio ref points to the direct player
          if (audioRef.current !== directPlayer) {
            audioRef.current = directPlayer;
          }
        } 
        // Otherwise try the custom player
        else if (audioRef.current && audioRef.current.paused && isPlaying) {
          console.log("Custom player should be playing - resuming");
          await audioRef.current.play();
        }
      } catch (error) {
        console.error("Error resuming audio after tab change:", error);
      } finally {
        // Always reset the shouldResume flag to prevent infinite updates
        setShouldResume(false);
      }
    };
    
    resumeAudio();
    
    // Clean up any pending timeouts
    return () => {
      if (tabChangeTimeoutRef.current) {
        clearTimeout(tabChangeTimeoutRef.current);
      }
    };
  }, [shouldResume, isPlaying]);

  // Split story text into pages
  const pages = useMemo(() => {
    if (!story.text_content) return [];
    
    // Split by paragraphs
    const paragraphs = story.text_content.split('\n\n').filter(p => p.trim() !== '');
    
    // For very short stories, don't paginate
    if (paragraphs.length <= 3) {
      return [paragraphs.join('\n\n')];
    }
    
    const result = [];
    const PARAGRAPHS_PER_PAGE = 3;
    
    for (let i = 0; i < paragraphs.length; i += PARAGRAPHS_PER_PAGE) {
      result.push(paragraphs.slice(i, i + PARAGRAPHS_PER_PAGE).join('\n\n'));
    }
    
    return result;
  }, [story.text_content]);
  
  // Handle page navigation
  const nextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(prev => prev + 1);
      
      // Scroll to top of page when changing pages
      if (bookRef.current) {
        bookRef.current.scrollTop = 0;
      }
    }
  };
  
  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
      
      // Scroll to top of page when changing pages
      if (bookRef.current) {
        bookRef.current.scrollTop = 0;
      }
    }
  };
  
  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);
    
    if (audioRef.current) {
      // Setting to a higher value at first to ensure audio is audible
      audioRef.current.volume = Math.min(1.0, (newVolume / 100) * 1.5); 
      
      console.log("Volume changed to:", audioRef.current.volume);
    }
    
    // Unmute if volume is changed
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
      if (audioRef.current) {
        audioRef.current.muted = false;
      }
    }
  };
  
  // Toggle mute
  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div ref={containerRef} className="container max-w-5xl mx-auto px-4 py-8 animate-in fade-in-50 duration-500">
      {/* Back Button */}
      <Link href="/dashboard/library" className="inline-flex items-center text-gray-400 hover:text-white mb-6 group transition-all duration-300">
        <ChevronLeft className="h-4 w-4 mr-1 transition-transform group-hover:-translate-x-1" />
        <span className="relative overflow-hidden">
          <span className="inline-block transition-transform group-hover:-translate-y-full duration-300">Back to Library</span>
          <span className="inline-block absolute top-0 left-0 -translate-y-full transition-transform group-hover:translate-y-0 duration-300">Return to Collection</span>
        </span>
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
      
      {/* Enhanced Reading Experience Button */}
      <Card className="bg-gradient-to-r from-indigo-900/60 to-purple-900/60 border-gray-800 mb-8 p-6 relative overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-500">
        <div className="absolute inset-0 bg-[url('/backgrounds/sparkles.svg')] bg-repeat opacity-10 animate-pulse"></div>
        <div className="relative z-10 flex lg:flex-row flex-col items-center justify-between space-y-5 lg:space-y-0">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Immersive Reading Experience</h3>
            <p className="text-gray-300 max-w-md">
              {isLongStory 
                ? "This story has been automatically divided into pages for easier reading. Experience it with beautiful backgrounds and effects."
                : "Experience this story with background effects, smooth transitions, and enhanced audio controls."}
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
                    {isLongStory ? "Read Paginated Story" : "Start Immersive Mode"}
                  </>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-6xl p-0 bg-transparent border-0 h-[90vh] overflow-y-auto">
              {storyPlayerData && (
                <StoryPlayer 
                  story={storyPlayerData} 
                  onClose={() => document.getElementById('close-dialog-button')?.click()}
                  className="min-h-fit" 
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
                        src={`${image.storage_path}`}
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
      
      {/* Tabbed Reading Interface */}
      {/* Story Audio Player */}
      <Card className="mb-8 bg-gray-950 border-indigo-900/40 p-6">
        <h2 className="text-white text-xl font-semibold mb-4">Story Audio Player</h2>
        
        <div className="flex flex-col gap-5">
          <div className="p-4 bg-gradient-to-r from-indigo-950 to-purple-950 border border-indigo-800/50 rounded-lg shadow-inner">
            <p className="text-white font-medium mb-3">
              {story.title} - Direct Audio Playback:
            </p>
            
            {/* HTML5 audio element for the story audio - this player works */}
            <audio 
              id="direct-audio-player"
              src={story.audio_url || ''} 
              controls 
              controlsList="nodownload" 
              preload="auto"
              className="w-full"
              onLoadedMetadata={() => {
                console.log("Direct player loaded metadata with audio URL:", story.audio_url);
                // Use this opportunity to sync with our main audio state
                const directPlayer = document.getElementById('direct-audio-player') as HTMLAudioElement;
                if (directPlayer) {
                  setDuration(directPlayer.duration);
                  if (!audioRef.current) {
                    audioRef.current = directPlayer;
                    setAudioLoaded(true);
                  }
                }
              }}
              onPlay={() => {
                console.log("Direct player started playback");
                setIsPlaying(true);
                // Record play start if not already recorded
                if (session?.user?.id && !playHistoryId) {
                  recordPlayStartAction(story.id)
                    .then(result => {
                      if (result?.id) {
                        setPlayHistoryId(result.id);
                        
                        toast({
                          title: "Play History",
                          description: "Your listening progress is being recorded.",
                          variant: "default"
                        });
                      }
                    })
                    .catch(error => {
                      console.error("Error recording play start:", error);
                    });
                }
              }}
              onPause={() => {
                console.log("Direct player paused");
                setIsPlaying(false);
                
                // Record progress when paused
                if (playHistoryId) {
                  const directPlayer = document.getElementById('direct-audio-player') as HTMLAudioElement;
                  if (directPlayer) {
                    const currentTime = directPlayer.currentTime;
                    const duration = directPlayer.duration;
                    const progressPercentage = Math.round((currentTime / duration) * 100);
                    
                    updatePlayProgressAction(playHistoryId, progressPercentage)
                      .catch(error => {
                        console.error("Error updating play progress:", error);
                      });
                  }
                }
              }}
              onTimeUpdate={() => {
                const directPlayer = document.getElementById('direct-audio-player') as HTMLAudioElement;
                if (directPlayer) {
                  setCurrentTime(directPlayer.currentTime);
                }
              }}
              onEnded={() => {
                console.log("Direct player finished playback");
                setIsPlaying(false);
                
                // Record completion
                if (playHistoryId) {
                  updatePlayProgressAction(playHistoryId, 100, true)
                    .then(() => {
                      toast({
                        title: "Playback Complete",
                        description: "You've completed this story!",
                        variant: "default"
                      });
                    })
                    .catch(error => {
                      console.error("Error recording completion:", error);
                    });
                }
              }}
              onError={(e) => {
                console.error("Error in direct audio playback:", e);
                toast({
                  title: "Audio Error",
                  description: "Failed to load audio in direct player. Please check your connection.",
                  variant: "destructive"
                });
              }}
            />
            
            <div className="flex items-center gap-4 mt-4">
              <Button 
                variant="outline"
                className="bg-indigo-900/20 text-indigo-300 border-indigo-700/30 hover:bg-indigo-800/30"
                onClick={toggleFavorite}
                disabled={isUpdatingFavorite}
              >
                <Heart className="h-4 w-4 mr-2" fill={isFavorite ? "#ef4444" : "none"} />
                {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                {isUpdatingFavorite && (
                  <div className="h-3 w-3 ml-2 animate-spin rounded-full border border-current border-t-transparent"></div>
                )}
              </Button>
              
              <Button
                variant="outline"
                className="bg-purple-900/20 text-purple-300 border-purple-700/30 hover:bg-purple-800/30"
                onClick={downloadAudio}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Audio
              </Button>
            </div>
          </div>
          
          <div className="p-4 bg-black/30 rounded-lg border border-gray-800">
            <h3 className="text-white font-medium mb-2">Audio Not Working?</h3>
            <p className="text-gray-400 text-sm">
              If you can't hear the story audio, please check your system's audio settings:
            </p>
            <ul className="list-disc pl-5 text-gray-400 text-sm mt-2 space-y-1">
              <li>Ensure your device volume is turned up</li>
              <li>Check that your headphones or speakers are connected</li>
              <li>Verify your browser has permission to play audio</li>
              <li>Try using a different browser</li>
            </ul>
          </div>
        </div>
      </Card>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-8">
        <TabsList className="grid w-full grid-cols-3 bg-gray-900/70 backdrop-blur-md border border-gray-800 h-14 p-1 mb-6">
          <TabsTrigger 
            value="read" 
            className="flex items-center justify-center gap-2 data-[state=active]:bg-indigo-950/60"
          >
            <BookOpen className="h-4 w-4" />
            <span>Read</span>
            {isPlaying && <span className="ml-1 h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>}
          </TabsTrigger>
          <TabsTrigger 
            value="listen" 
            className="flex items-center justify-center gap-2 data-[state=active]:bg-indigo-950/60"
          >
            <ListMusic className="h-4 w-4" />
            <span>Listen</span>
            {isPlaying && <span className="ml-1 h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>}
          </TabsTrigger>
          <TabsTrigger 
            value="immersive" 
            className="flex items-center justify-center gap-2 data-[state=active]:bg-indigo-950/60"
            onClick={() => {
              // Automatically pause audio when switching to immersive mode
              // since it has its own audio player
              if (isPlaying && audioRef.current) {
                audioRef.current.pause();
                setIsPlaying(false);
              }
            }}
          >
            <Sparkles className="h-4 w-4" />
            <span>Immersive</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="read" className="mt-0">
          <Card className="relative bg-gradient-to-b from-gray-900 to-gray-950 border-gray-800 shadow-xl overflow-hidden">
            {/* Decorative Book Elements */}
            <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-indigo-900/40 border-b border-indigo-800/50"></div>
            <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-indigo-900/40 to-transparent"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full blur-3xl -z-0"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-600/5 rounded-full blur-3xl -z-0"></div>
            
            {/* Book navigation controls */}
            <div className="flex items-center justify-between mt-6 px-6 mb-2 relative z-10">
              <div className="flex items-center">
                <Badge className="bg-indigo-900/30 text-indigo-300 border border-indigo-800/50 shadow-sm">
                  {pages.length > 1 ? `Page ${currentPage + 1} of ${pages.length}` : "Single page"}
                </Badge>
              </div>
              
              {pages.length > 1 && (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={prevPage}
                    disabled={currentPage === 0}
                    className="h-8 w-8 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={nextPage}
                    disabled={currentPage >= pages.length - 1}
                    className="h-8 w-8 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-indigo-300 hover:text-indigo-200 flex gap-1.5"
                onClick={() => {
                  if (isPlaying) {
                    togglePlayPause();
                  } else {
                    setActiveTab("listen");
                    setTimeout(togglePlayPause, 500);
                  }
                }}
              >
                {isPlaying ? (
                  <>
                    <PauseCircle className="h-4 w-4" />
                    <span>Pause Narration</span>
                  </>
                ) : (
                  <>
                    <PlayCircle className="h-4 w-4" />
                    <span>Play Narration</span>
                  </>
                )}
              </Button>
            </div>
            
            {/* Main book content */}
            <ScrollArea 
              ref={bookRef}
              className="p-8 max-h-[600px] relative z-10 transition-all duration-500"
            >
              {!textLoaded ? (
                <div className="space-y-6">
                  {[...Array(5)].map((_, index) => (
                    <div key={index} className="animate-pulse">
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-5 w-11/12 mt-2" />
                      <Skeleton className="h-5 w-4/5 mt-2" />
                      {index === 0 && <Skeleton className="h-8 w-8 float-left mr-2 mt-1" />}
                    </div>
                  ))}
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`page-${currentPage}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="prose prose-invert max-w-none font-serif"
                  >
                    {pages[currentPage].split('\n\n').map((paragraph, index) => (
                      <motion.p 
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 * (index + 1) }}
                        className={`mb-6 text-gray-200 leading-relaxed text-lg ${
                          index === 0 && currentPage === 0 ? 'first-letter:text-4xl first-letter:font-bold first-letter:text-indigo-300 first-letter:mr-1 first-letter:float-left first-letter:leading-none' : ''
                        }`}
                      >
                        {paragraph}
                      </motion.p>
                    ))}
                    
                    {/* Page corner fold effect */}
                    <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-b from-gray-800/80 to-transparent" style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}></div>
                    
                    {/* Page number and decorative end */}
                    {currentPage === pages.length - 1 && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="mt-16 flex items-center justify-center"
                      >
                        <div className="border-t border-gray-800 w-16"></div>
                        <div className="mx-4 text-gray-600 font-serif italic text-sm">~ The End ~</div>
                        <div className="border-t border-gray-800 w-16"></div>
                      </motion.div>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}
            </ScrollArea>
            
            {/* Book footer with page navigation */}
            {pages.length > 1 && (
              <div className="px-6 py-3 border-t border-gray-800/40 flex justify-between items-center bg-black/10">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={prevPage}
                  disabled={currentPage === 0}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1 max-w-[200px] overflow-x-auto px-2 py-1">
                  {pages.length <= 10 ? (
                    // For 10 or fewer pages, show all page indicators
                    pages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentPage(index)}
                        className={`w-2 h-2 rounded-full transition-all flex-shrink-0 ${
                          currentPage === index 
                            ? "bg-indigo-500 w-4" 
                            : "bg-gray-700 hover:bg-gray-600"
                        }`}
                        aria-label={`Go to page ${index + 1}`}
                      />
                    ))
                  ) : (
                    // For more pages, show a smart pagination
                    <>
                      <button
                        onClick={() => setCurrentPage(0)}
                        className={`w-2 h-2 rounded-full transition-all flex-shrink-0 ${
                          currentPage === 0 ? "bg-indigo-500 w-4" : "bg-gray-700 hover:bg-gray-600"
                        }`}
                      />
                      
                      {/* Middle sections with ellipsis */}
                      {currentPage > 2 && <span className="text-gray-500">•••</span>}
                      
                      {/* Pages around current */}
                      {currentPage > 0 && currentPage < pages.length - 1 && (
                        <button
                          onClick={() => setCurrentPage(currentPage)}
                          className="w-4 h-2 rounded-full bg-indigo-500"
                        />
                      )}
                      
                      {currentPage < pages.length - 3 && <span className="text-gray-500">•••</span>}
                      
                      {/* Last page */}
                      <button
                        onClick={() => setCurrentPage(pages.length - 1)}
                        className={`w-2 h-2 rounded-full transition-all flex-shrink-0 ${
                          currentPage === pages.length - 1 ? "bg-indigo-500 w-4" : "bg-gray-700 hover:bg-gray-600"
                        }`}
                      />
                    </>
                  )}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={nextPage}
                  disabled={currentPage >= pages.length - 1}
                  className="text-gray-400 hover:text-gray-300"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </Card>
        </TabsContent>
        
        <TabsContent value="listen" className="mt-0">
          {/* Enhanced Audio player with animations */}
          <Card className="bg-gradient-to-b from-indigo-950/60 to-gray-900/80 border border-indigo-900/30 shadow-xl relative overflow-hidden">
            {/* Background animation effects */}
            <div className="absolute inset-0 bg-[url('/backgrounds/sparkles.svg')] opacity-5 bg-repeat"></div>
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl"></div>
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl"></div>
            
            {/* Display current image based on position */}
            {story.images && story.images.length > 0 && (
              <div className="aspect-video max-h-[400px] w-full overflow-hidden">
                {!imagesLoaded ? (
                  <div className="h-full w-full flex items-center justify-center bg-gray-900/80">
                    <div className="h-12 w-12 animate-spin rounded-full border-3 border-indigo-400 border-t-transparent" />
                  </div>
                ) : (
                  <img 
                    src={story.images[0].storage_path}
                    alt="Story illustration"
                    className="object-contain w-full h-full"
                  />
                )}
              </div>
            )}
            
            <div className="p-6 relative z-10">
              <div>
                {/* Visual audio wave effect */}
                <div className="flex justify-center items-end h-16 mb-4 gap-[2px] mx-auto max-w-lg">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-indigo-500/60"
                      initial={{ height: 4 }}
                      animate={{ 
                        height: (audioLoaded && isPlaying && !audioError) 
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
                    onClick={audioLoaded && !audioError ? handleSeek : undefined}
                  >
                    {!audioLoaded ? (
                      <div className="h-full w-full animate-pulse bg-gray-700/50 rounded-full"></div>
                    ) : (
                      <motion.div 
                        className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: `${(currentTime / duration) * 100}%` }}
                        transition={{ type: "spring", bounce: 0 }}
                      />
                    )}
                    
                    {/* Current position indicator */}
                    {audioLoaded && !audioError && (
                      <motion.div 
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-md cursor-grab active:cursor-grabbing"
                        style={{ left: `calc(${(currentTime / duration) * 100}% - 8px)` }}
                        initial={{ left: "0%" }}
                        animate={{ left: `calc(${(currentTime / duration) * 100}% - 8px)` }}
                        transition={{ type: "spring", bounce: 0 }}
                      />
                    )}
                  </div>
                </div>
                
                {/* Time display */}
                <div className="flex justify-between text-xs text-gray-400 mb-6">
                  <div>{!audioLoaded ? "--:--" : formatDuration(currentTime)}</div>
                  <div>{!audioLoaded ? "--:--" : formatDuration(duration)}</div>
                </div>
                
                {/* Player controls - Center aligned for mobile */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3 order-3 sm:order-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleMute}
                      className="text-gray-300 hover:text-white"
                      disabled={!audioLoaded || audioError}
                    >
                      {isMuted ? (
                        <VolumeX className="h-5 w-5" />
                      ) : (
                        <Volume2 className="h-5 w-5" />
                      )}
                    </Button>
                    
                    <div className="w-28 relative">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-full h-2 appearance-none rounded-full bg-gray-800 cursor-pointer"
                        disabled={!audioLoaded || audioError}
                        style={{
                          background: `linear-gradient(to right, rgb(79, 70, 229) 0%, rgb(79, 70, 229) ${volume}%, rgb(31, 41, 55) ${volume}%, rgb(31, 41, 55) 100%)`
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center gap-3 order-1 sm:order-2">
                    <motion.button 
                      whileTap={{ scale: 0.9 }}
                      whileHover={{ scale: 1.05 }}
                      className={`${isPlaying 
                        ? 'bg-gradient-to-br from-purple-600 to-indigo-700' 
                        : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                      } h-16 w-16 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-900/20`}
                      onClick={togglePlayPause}
                      disabled={!audioLoaded || audioError}
                    >
                      {!audioLoaded ? (
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : audioError ? (
                        <AlertCircle className="h-7 w-7 text-red-200" />
                      ) : isPlaying ? (
                        <PauseCircle className="h-7 w-7" />
                      ) : (
                        <PlayCircle className="h-7 w-7" />
                      )}
                      
                      {/* Pulse animation when playing */}
                      {isPlaying && !audioError && (
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
                  </div>
                  
                  <div className="flex items-center gap-2 order-2 sm:order-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex items-center gap-1.5 py-2 px-3 rounded-full text-sm ${
                        isFavorite 
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                          : 'bg-gray-800/40 text-gray-300 border border-gray-700'
                      }`}
                      onClick={toggleFavorite}
                      disabled={isUpdatingFavorite}
                    >
                      <Heart className="h-4 w-4" fill={isFavorite ? "#ef4444" : "none"} />
                      <span className="hidden sm:inline">
                        {isFavorite ? "Favorited" : "Add to Favorites"}
                      </span>
                      {isUpdatingFavorite && (
                        <div className="h-3 w-3 ml-1 animate-spin rounded-full border border-current border-t-transparent"></div>
                      )}
                    </motion.button>
                  </div>
                </div>
                
                {audioLoaded && !audioError && (
                  <div className="text-xs text-center text-gray-500 mt-5">
                    <p>Keyboard shortcuts: Space (play/pause), ← (rewind 10s), → (forward 10s), F (favorite), M (mute)</p>
                  </div>
                )}
                
                {/* No hidden audio element - we're using a persistent Audio object instead */}
                {/* The audio element is created and managed via useEffect */}
              </div>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="immersive" className="mt-0">
          <Card className="bg-gradient-to-r from-indigo-900/60 to-purple-900/60 border-gray-800 p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/backgrounds/sparkles.svg')] bg-repeat opacity-10 animate-pulse"></div>
            <div className="relative z-10 flex lg:flex-row flex-col items-center justify-between space-y-5 lg:space-y-0">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Fullscreen Immersive Experience</h3>
                <p className="text-gray-300 max-w-md">
                  Experience this story with beautiful backgrounds, animations, and enhanced controls in fullscreen mode.
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
                        Launch Immersive Mode
                      </>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-6xl p-0 bg-transparent border-0 h-[90vh] overflow-y-auto">
                  {storyPlayerData && (
                    <StoryPlayer 
                      story={storyPlayerData} 
                      onClose={() => document.getElementById('close-dialog-button')?.click()}
                      className="min-h-fit" 
                    />
                  )}
                  <button id="close-dialog-button" className="hidden" />
                </DialogContent>
              </Dialog>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
      
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