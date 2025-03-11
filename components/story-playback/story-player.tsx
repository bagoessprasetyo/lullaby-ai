// components/story-playback/story-player.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  X,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BackgroundEffects } from "./background-effects";

// Types for story data
interface StoryPage {
  id: string;
  text: string;
  imageUrl?: string;
  audioUrl?: string; // URL to audio file for this page
}

interface StoryData {
  id: string;
  title: string;
  pages: StoryPage[];
  backgroundMusicUrl?: string;
  theme: "adventure" | "fantasy" | "bedtime" | "educational" | "customized";
  language: string;
}

interface StoryPlayerProps {
  story: StoryData;
  onClose?: () => void;
  className?: string;
}

export function StoryPlayer({ story, onClose, className }: StoryPlayerProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [viewMode, setViewMode] = useState<"story" | "text">("story");
  
  // Refs for audio elements
  const narratorAudioRef = useRef<HTMLAudioElement | null>(null);
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  const playerRef = useRef<HTMLDivElement | null>(null);
  
  // Auto-hide controls after inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const resetTimer = () => {
      clearTimeout(timeout);
      setShowControls(true);
      
      // Hide controls after 3 seconds of inactivity
      timeout = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    };
    
    // Show controls when user moves mouse
    const handleMouseMove = () => resetTimer();
    
    // Set up event listener
    document.addEventListener("mousemove", handleMouseMove);
    resetTimer();
    
    return () => {
      clearTimeout(timeout);
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [isPlaying]);
  
  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!playerRef.current) return;
    
    if (!document.fullscreenElement) {
      playerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };
  
  // Update fullscreen state based on fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);
  
  // Handle playing/pausing story narration
  const togglePlayback = () => {
    if (isPlaying) {
      narratorAudioRef.current?.pause();
      backgroundMusicRef.current?.pause();
    } else {
      // Start or resume playback
      if (narratorAudioRef.current) {
        narratorAudioRef.current.play().catch(error => {
          console.error("Error playing audio:", error);
        });
      }
      
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.play().catch(error => {
          console.error("Error playing background music:", error);
        });
      }
    }
    
    setIsPlaying(!isPlaying);
  };
  
  // Handle volume change
  const handleVolumeChange = (newVolume: number[]) => {
    const vol = newVolume[0];
    setVolume(vol);
    
    if (narratorAudioRef.current) {
      narratorAudioRef.current.volume = vol / 100;
    }
    
    if (backgroundMusicRef.current) {
      // Set background music slightly quieter than narration
      backgroundMusicRef.current.volume = (vol / 100) * 0.3;
    }
    
    // Unmute if volume is changed manually
    if (vol > 0 && isMuted) {
      setIsMuted(false);
    }
  };
  
  // Toggle mute
  const toggleMute = () => {
    if (narratorAudioRef.current) {
      narratorAudioRef.current.muted = !isMuted;
    }
    
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.muted = !isMuted;
    }
    
    setIsMuted(!isMuted);
  };
  
  // Go to next page
  const nextPage = () => {
    if (currentPage < story.pages.length - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };
  
  // Go to previous page
  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowRight":
          nextPage();
          break;
        case "ArrowLeft":
          prevPage();
          break;
        case " ": // Space key
          togglePlayback();
          event.preventDefault();
          break;
        case "f":
          toggleFullscreen();
          break;
        case "Escape":
          if (onClose) onClose();
          break;
      }
    };
    
    document.addEventListener("keydown", handleKeyDown);
    
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentPage, isPlaying]);
  
  // Set up audio for current page
  useEffect(() => {
    const currentPageData = story.pages[currentPage];
    
    if (narratorAudioRef.current) {
      narratorAudioRef.current.pause();
      
      if (currentPageData.audioUrl) {
        narratorAudioRef.current.src = currentPageData.audioUrl;
        narratorAudioRef.current.load();
        
        if (isPlaying) {
          narratorAudioRef.current.play().catch(error => {
            console.error("Error playing audio:", error);
          });
        }
      }
    }
    
    // Set up background music (only once)
    if (story.backgroundMusicUrl && backgroundMusicRef.current && currentPage === 0) {
      backgroundMusicRef.current.src = story.backgroundMusicUrl;
      backgroundMusicRef.current.loop = true;
      backgroundMusicRef.current.volume = (volume / 100) * 0.3; // Lower volume for background music
      backgroundMusicRef.current.load();
      
      if (isPlaying) {
        backgroundMusicRef.current.play().catch(error => {
          console.error("Error playing background music:", error);
        });
      }
    }
  }, [currentPage, story, isPlaying, volume]);
  
  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (narratorAudioRef.current) {
        narratorAudioRef.current.pause();
      }
      
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause();
      }
    };
  }, []);
  
  // Get background effect based on theme
  const getBackgroundTheme = () => {
    switch (story.theme) {
      case "adventure":
        return "adventure";
      case "fantasy":
        return "fantasy";
      case "bedtime":
        return "night";
      case "educational":
        return "school";
      default:
        return "default";
    }
  };
  
  // Current page data
  const currentPageData = story.pages[currentPage];
  
  return (
    <div 
      ref={playerRef}
      className={cn(
        "relative flex flex-col w-full h-full min-h-[500px] bg-gray-950 overflow-hidden",
        isFullscreen ? "fixed inset-0 z-50" : "rounded-lg",
        className
      )}
      onMouseMove={() => setShowControls(true)}
    >
      {/* Background Effects */}
      <BackgroundEffects theme={getBackgroundTheme()} />
      
      {/* Story Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4">
        <AnimatePresence mode="wait">
          {viewMode === "story" ? (
            <motion.div
              key="story-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-3xl flex flex-col items-center"
            >
              {/* Image */}
              {currentPageData.imageUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="w-full max-w-xl mb-6 rounded-lg overflow-hidden shadow-xl"
                >
                  <img 
                    src={currentPageData.imageUrl} 
                    alt={`Story illustration ${currentPage + 1}`}
                    className="w-full h-auto object-cover"
                  />
                </motion.div>
              )}
              
              {/* Text */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="w-full p-6 bg-black/40 backdrop-blur-sm rounded-lg text-white"
              >
                <p className="text-lg leading-relaxed font-serif first-letter:text-3xl first-letter:font-bold first-letter:mr-1">
                  {currentPageData.text}
                </p>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="text-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-3xl"
            >
              <ScrollArea className="h-[60vh] w-full">
                <div className="p-6 bg-black/40 backdrop-blur-sm rounded-lg text-white">
                  <h2 className="text-2xl font-bold mb-4">{story.title}</h2>
                  {story.pages.map((page, index) => (
                    <div 
                      key={page.id} 
                      className={cn(
                        "mb-8 pb-4 border-b border-gray-800",
                        index === currentPage && "bg-indigo-900/20 p-3 rounded-md -mx-3"
                      )}
                    >
                      <p className="text-lg leading-relaxed font-serif">
                        {page.text}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Audio Elements (hidden) */}
      <audio ref={narratorAudioRef}>
        <source src={currentPageData.audioUrl} type="audio/mp3" />
        Your browser does not support the audio element.
      </audio>
      
      <audio ref={backgroundMusicRef} loop>
        <source src={story.backgroundMusicUrl} type="audio/mp3" />
        Your browser does not support the audio element.
      </audio>
      
      {/* Controls */}
      <AnimatePresence>
        {showControls && (
          <>
            {/* Top Controls */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/70 to-transparent"
            >
              <div className="flex items-center">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={onClose}
                  className="text-white hover:bg-black/30"
                >
                  <X className="h-5 w-5" />
                </Button>
                <h2 className="ml-2 text-xl font-semibold text-white truncate">
                  {story.title}
                </h2>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode(viewMode === "story" ? "text" : "story")}
                  className="text-white hover:bg-black/30"
                  title={viewMode === "story" ? "View full text" : "Return to story view"}
                >
                  <BookOpen className="h-5 w-5" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-white hover:bg-black/30"
                  title="Settings"
                >
                  <Settings className="h-5 w-5" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullscreen}
                  className="text-white hover:bg-black/30"
                  title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                  {isFullscreen ? (
                    <Minimize className="h-5 w-5" />
                  ) : (
                    <Maximize className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </motion.div>
            
            {/* Bottom Controls */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/70 to-transparent"
            >
              <div className="flex flex-col gap-2">
                {/* Progress/Navigation */}
                <div className="flex items-center justify-between w-full mb-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={prevPage}
                    disabled={currentPage === 0}
                    className="text-white hover:bg-black/30 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  
                  <div className="text-center text-white text-sm">
                    Page {currentPage + 1} of {story.pages.length}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={nextPage}
                    disabled={currentPage === story.pages.length - 1}
                    className="text-white hover:bg-black/30 disabled:opacity-50"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
                
                {/* Playback Controls */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={togglePlayback}
                      className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20"
                    >
                      {isPlaying ? (
                        <Pause className="h-5 w-5" />
                      ) : (
                        <Play className="h-5 w-5" />
                      )}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleMute}
                      className="text-white hover:bg-black/30"
                    >
                      {isMuted ? (
                        <VolumeX className="h-5 w-5" />
                      ) : (
                        <Volume2 className="h-5 w-5" />
                      )}
                    </Button>
                    
                    <div className="w-24 md:w-32">
                      <Slider
                        value={[volume]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={handleVolumeChange}
                        className="cursor-pointer"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevPage}
                      disabled={currentPage === 0}
                      className="h-8 px-2 border-white/20 bg-black/30 text-white hover:bg-black/50 disabled:opacity-50"
                    >
                      <SkipBack className="h-4 w-4" />
                      <span className="ml-1 hidden md:inline">Previous</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={nextPage}
                      disabled={currentPage === story.pages.length - 1}
                      className="h-8 px-2 border-white/20 bg-black/30 text-white hover:bg-black/50 disabled:opacity-50"
                    >
                      <span className="mr-1 hidden md:inline">Next</span>
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}