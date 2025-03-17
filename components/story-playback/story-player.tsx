// components/story-playback/story-player.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
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
  FileText,
  Music,
  List
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BackgroundEffects } from "./background-effects";
import { formatDuration } from "@/lib/format-duration";

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
  mixedAudioUrl?: string; // URL to pre-mixed audio (narration + background music)
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
  const [viewMode, setViewMode] = useState<"story" | "text" | "outline">("story");
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [currentAudioTime, setCurrentAudioTime] = useState(0);
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  
  // Refs for audio elements
  const narratorAudioRef = useRef<HTMLAudioElement | null>(null);
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  const playerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  
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
    const handleClick = () => resetTimer();
    
    // Set up event listener
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("click", handleClick);
    resetTimer();
    
    return () => {
      clearTimeout(timeout);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("click", handleClick);
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
  
  // Set up audio
  useEffect(() => {
    // Check if there's a pre-mixed audio version (narration + background already mixed)
    if (story.mixedAudioUrl) {
      // Use pre-mixed audio if available
      if (!narratorAudioRef.current) {
        narratorAudioRef.current = new Audio(story.mixedAudioUrl);
        narratorAudioRef.current.volume = volume / 100;
        
        // Set up audio events
        narratorAudioRef.current.addEventListener('timeupdate', handleTimeUpdate);
        narratorAudioRef.current.addEventListener('loadedmetadata', handleMetadataLoaded);
        narratorAudioRef.current.addEventListener('ended', handleAudioEnded);
        narratorAudioRef.current.addEventListener('canplaythrough', () => {
          setIsAudioLoaded(true);
        });
        narratorAudioRef.current.addEventListener('error', (e) => {
          console.error('Audio error:', e);
        });
      } else {
        // If audio is different, update the source
        if (narratorAudioRef.current.src !== story.mixedAudioUrl) {
          narratorAudioRef.current.src = story.mixedAudioUrl;
          narratorAudioRef.current.load();
        }
      }
      
      // We don't need separate background music since it's already mixed
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause();
        backgroundMusicRef.current = null;
      }
    } else {
      // Handle separate narration and background music (legacy approach)
      let audioUrl = null;
      
      // First check if current page has audio
      if (story.pages[currentPage]?.audioUrl) {
        audioUrl = story.pages[currentPage].audioUrl;
      } 
      // Otherwise use the first page's audio for all pages
      else if (story.pages[0]?.audioUrl) {
        audioUrl = story.pages[0].audioUrl;
      }
      // If no page has audio, check if the story itself has an audio URL
      else if ((story as any).audio_url) {
        audioUrl = (story as any).audio_url;
      }
      
      if (audioUrl) {
        if (!narratorAudioRef.current) {
          narratorAudioRef.current = new Audio(audioUrl);
          narratorAudioRef.current.volume = volume / 100;
          
          // Set up audio events
          narratorAudioRef.current.addEventListener('timeupdate', handleTimeUpdate);
          narratorAudioRef.current.addEventListener('loadedmetadata', handleMetadataLoaded);
          narratorAudioRef.current.addEventListener('ended', handleAudioEnded);
          narratorAudioRef.current.addEventListener('canplaythrough', () => {
            setIsAudioLoaded(true);
          });
          narratorAudioRef.current.addEventListener('error', (e) => {
            console.error('Audio error:', e);
          });
        } else {
          // If audio is different, update the source
          if (narratorAudioRef.current.src !== audioUrl) {
            narratorAudioRef.current.src = audioUrl;
            narratorAudioRef.current.load();
          }
        }
      } else {
        console.warn("No audio URL found for this story or its pages");
      }
      
      // Set up background music if available
      if (story.backgroundMusicUrl && !backgroundMusicRef.current) {
        backgroundMusicRef.current = new Audio(story.backgroundMusicUrl);
        backgroundMusicRef.current.loop = true;
        backgroundMusicRef.current.volume = (volume / 100) * 0.3; // Lower volume for background music
      }
    }
    
    return () => {
      // Clean up
      if (narratorAudioRef.current) {
        narratorAudioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        narratorAudioRef.current.removeEventListener('loadedmetadata', handleMetadataLoaded);
        narratorAudioRef.current.removeEventListener('ended', handleAudioEnded);
        narratorAudioRef.current.pause();
      }
      
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause();
      }
    };
  }, [story, currentPage, volume]);
  
  // Handle metadata loaded for audio
  const handleMetadataLoaded = () => {
    if (narratorAudioRef.current) {
      setAudioDuration(narratorAudioRef.current.duration);
    }
  };
  
  // Handle timeupdate event for audio
  const handleTimeUpdate = () => {
    if (narratorAudioRef.current) {
      const current = narratorAudioRef.current.currentTime;
      const duration = narratorAudioRef.current.duration;
      
      setCurrentAudioTime(current);
      setAudioProgress((current / duration) * 100);
    }
  };
  
  // Handle audio ending
  const handleAudioEnded = () => {
    // Go to next page if not the last page
    if (currentPage < story.pages.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      setIsPlaying(false);
    }
  };
  
  // Handle playing/pausing story narration
  const togglePlayback = () => {
    if (isPlaying) {
      if (narratorAudioRef.current) {
        narratorAudioRef.current.pause();
      }
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause();
      }
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
  
  // Handle seeking in audio
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!narratorAudioRef.current || !audioDuration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const newPosition = (offsetX / rect.width) * audioDuration;
    
    narratorAudioRef.current.currentTime = newPosition;
    setCurrentAudioTime(newPosition);
  };
  
  // Go to next page
  const nextPage = () => {
    if (currentPage < story.pages.length - 1) {
      setCurrentPage(prev => prev + 1);
      
      // Reset audio position when changing pages if needed
      if (narratorAudioRef.current) {
        narratorAudioRef.current.currentTime = 0;
      }
      
      // Scroll content to top when changing page
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
    }
  };
  
  // Go to previous page
  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
      
      // Reset audio position when changing pages if needed
      if (narratorAudioRef.current) {
        narratorAudioRef.current.currentTime = 0;
      }
      
      // Scroll content to top when changing page
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
    }
  };

  // Go to a specific page
  const goToPage = (pageIndex: number) => {
    if (pageIndex >= 0 && pageIndex < story.pages.length) {
      setCurrentPage(pageIndex);
      
      // Reset audio position when changing pages if needed
      if (narratorAudioRef.current) {
        narratorAudioRef.current.currentTime = 0;
      }
      
      // Scroll content to top when changing page
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
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
        case "m":
          toggleMute();
          break;
      }
    };
    
    document.addEventListener("keydown", handleKeyDown);
    
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentPage, isPlaying]);
  
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
  const currentPageData = story.pages[currentPage] || { text: "", id: "empty" };
  
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
      <div className="relative z-10 flex-1 flex flex-col items-center p-4 overflow-hidden">
        <AnimatePresence mode="wait">
          {viewMode === "story" && (
            <motion.div
              key="story-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-4xl h-full flex flex-col"
            >
              {/* Page title and counter with progress bar */}
              <div className="mb-4 text-center">
                <h2 className="text-xl text-white font-bold">
                  {story.title}
                </h2>
                
                {/* Progress bar to show position in story */}
                <div className="w-full max-w-md mx-auto h-1 bg-gray-800 rounded-full mt-2 mb-1 overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 transition-all"
                    style={{ width: `${((currentPage + 1) / story.pages.length) * 100}%` }}
                  />
                </div>
                
                <div className="text-gray-300 text-sm flex items-center justify-center gap-2">
                  <span>Page {currentPage + 1} of {story.pages.length}</span>
                  
                  {/* Estimated reading time for current page */}
                  {currentPageData.text && (
                    <>
                      <span className="inline-block mx-1">•</span>
                      <span className="text-gray-400 text-xs">
                        ~{Math.ceil(currentPageData.text.split(/\s+/).length / 200)} min read
                      </span>
                    </>
                  )}
                </div>
              </div>
              
              {/* Scrollable content area */}
              <ScrollArea 
                ref={contentRef}
                className="flex-1 w-full px-4"
              >
                <div className="flex flex-col items-center py-2">
                  {/* Image (if available) */}
                  {currentPageData.imageUrl && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="w-full max-w-lg mb-6 rounded-lg overflow-hidden shadow-2xl"
                    >
                      <img 
                        src={currentPageData.imageUrl} 
                        alt={`Story illustration for page ${currentPage + 1}`}
                        className="w-full h-auto object-contain"
                      />
                    </motion.div>
                  )}
                  
                  {/* Text Content */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="w-full max-w-3xl p-6 bg-black/40 backdrop-blur-sm rounded-lg text-white"
                  >
                    <div className="prose prose-lg prose-invert max-w-none">
                      {currentPageData.text.split('\n\n').map((paragraph, idx) => {
                        // Skip empty paragraphs
                        if (!paragraph.trim()) return null;
                        
                        return (
                          <motion.p 
                            key={idx} 
                            initial={{ opacity: 0, y: 10 }} 
                            animate={{ 
                              opacity: 1, 
                              y: 0,
                              transition: { 
                                delay: 0.1 + (idx * 0.05),
                                duration: 0.4
                              }
                            }}
                            className="mb-5 leading-relaxed text-[1.05rem]"
                          >
                            {idx === 0 && currentPage === 0 ? (
                              // Special formatting for first paragraph of first page
                              <span className="first-letter:text-4xl first-letter:font-bold first-letter:mr-1 first-letter:float-left">
                                {paragraph}
                              </span>
                            ) : (
                              // For shorter paragraphs (like dialogue), style differently
                              paragraph.length < 100 ? (
                                <span className={paragraph.startsWith('"') || paragraph.startsWith('"') ? "text-indigo-200 italic" : ""}>
                                  {paragraph}
                                </span>
                              ) : (
                                paragraph
                              )
                            )}
                          </motion.p>
                        );
                      }).filter(Boolean)}
                      
                      {/* Add a subtle indication of page end */}
                      {currentPage < story.pages.length - 1 && (
                        <div className="text-center text-gray-400 text-sm mt-8 pt-4 border-t border-gray-700">
                          <span>Continue to next page</span>
                          <ChevronRight className="inline-block h-4 w-4 ml-1 animate-pulse" />
                        </div>
                      )}
                      
                      {/* Add a completion indicator on the last page */}
                      {currentPage === story.pages.length - 1 && (
                        <div className="text-center text-indigo-300 text-sm mt-8 pt-4 border-t border-gray-700">
                          <span>The End</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>
              </ScrollArea>
              
              {/* Page navigation */}
              <div className="mt-6 flex justify-between items-center w-full max-w-lg mx-auto">
                <Button
                  variant="outline"
                  onClick={prevPage}
                  disabled={currentPage === 0}
                  className="bg-black/30 border-white/20 text-white hover:bg-black/50 disabled:opacity-50"
                >
                  <ChevronLeft className="h-5 w-5 mr-2" />
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1 max-w-[200px] overflow-x-auto px-2 py-1">
                  {/* Use a smart pagination indicator that scales to many pages */}
                  {story.pages.length <= 10 ? (
                    // For 10 or fewer pages, show all page indicators
                    story.pages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToPage(index)}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all flex-shrink-0",
                          currentPage === index 
                            ? "bg-white w-4" 
                            : "bg-white/40 hover:bg-white/60"
                        )}
                        aria-label={`Go to page ${index + 1}`}
                      />
                    ))
                  ) : (
                    // For more than 10 pages, show a smarter pagination control
                    <>
                      {/* First page */}
                      <button
                        onClick={() => goToPage(0)}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all flex-shrink-0",
                          currentPage === 0 
                            ? "bg-white w-4" 
                            : "bg-white/40 hover:bg-white/60"
                        )}
                        aria-label="Go to page 1"
                      />
                      
                      {/* Show ellipsis if not near the start */}
                      {currentPage > 2 && (
                        <span className="text-white/60 text-xs mx-1">•••</span>
                      )}
                      
                      {/* Pages around current page */}
                      {Array.from({length: 5}, (_, i) => {
                        // Show 2 pages before and 2 pages after current page
                        const pageIndex = Math.max(1, Math.min(currentPage - 2 + i, story.pages.length - 2));
                        // Skip if this would create duplicates with first/last page
                        if (pageIndex <= 0 || pageIndex >= story.pages.length - 1) return null;
                        // Skip if outside the range we want to show around current page
                        if (currentPage > 2 && (pageIndex < currentPage - 2 || pageIndex > currentPage + 2)) return null;
                        
                        return (
                          <button
                            key={pageIndex}
                            onClick={() => goToPage(pageIndex)}
                            className={cn(
                              "w-2 h-2 rounded-full transition-all flex-shrink-0",
                              currentPage === pageIndex 
                                ? "bg-white w-4" 
                                : "bg-white/40 hover:bg-white/60"
                            )}
                            aria-label={`Go to page ${pageIndex + 1}`}
                          />
                        );
                      }).filter(Boolean)}
                      
                      {/* Show ellipsis if not near the end */}
                      {currentPage < story.pages.length - 3 && (
                        <span className="text-white/60 text-xs mx-1">•••</span>
                      )}
                      
                      {/* Last page */}
                      <button
                        onClick={() => goToPage(story.pages.length - 1)}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all flex-shrink-0",
                          currentPage === story.pages.length - 1 
                            ? "bg-white w-4" 
                            : "bg-white/40 hover:bg-white/60"
                        )}
                        aria-label={`Go to page ${story.pages.length}`}
                      />
                    </>
                  )}
                </div>
                
                <Button
                  variant="outline"
                  onClick={nextPage}
                  disabled={currentPage === story.pages.length - 1}
                  className="bg-black/30 border-white/20 text-white hover:bg-black/50 disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}
          
          {viewMode === "text" && (
            <motion.div
              key="text-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-4xl h-full flex flex-col"
            >
              <ScrollArea className="flex-1 w-full">
                <div className="p-6 bg-black/40 backdrop-blur-sm rounded-lg text-white max-w-3xl mx-auto">
                  <h2 className="text-2xl font-bold mb-6">{story.title}</h2>
                  
                  {story.pages.map((page, index) => (
                    <div 
                      key={page.id} 
                      className={cn(
                        "mb-8 pb-6 border-b border-gray-700",
                        index === currentPage && "bg-white/10 p-4 rounded-md -mx-4"
                      )}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-300">Page {index + 1}</h3>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => goToPage(index)}
                          className="text-gray-300 hover:text-white text-xs"
                        >
                          Go to page
                        </Button>
                      </div>
                      
                      {page.imageUrl && (
                        <div className="mb-4 rounded-md overflow-hidden max-w-sm mx-auto">
                          <img 
                            src={page.imageUrl} 
                            alt={`Illustration for page ${index + 1}`} 
                            className="w-full h-auto object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="prose prose-invert max-w-none">
                        {page.text.split('\n\n').map((paragraph, pidx) => (
                          <p key={`${index}-p-${pidx}`} className="mb-3">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </motion.div>
          )}
          
          {viewMode === "outline" && (
            <motion.div
              key="outline-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-4xl h-full"
            >
              <div className="p-6 bg-black/40 backdrop-blur-sm rounded-lg text-white max-w-3xl mx-auto">
                <h2 className="text-2xl font-bold mb-6">{story.title}</h2>
                <p className="text-gray-300 mb-8">This story has {story.pages.length} pages.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {story.pages.map((page, index) => (
                    <div 
                      key={`outline-${index}`} 
                      className={cn(
                        "p-4 border border-gray-800 rounded-lg cursor-pointer transition-all hover:bg-white/10",
                        index === currentPage && "ring-2 ring-indigo-500 bg-indigo-900/20"
                      )}
                      onClick={() => goToPage(index)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-white">Page {index + 1}</h3>
                        {page.imageUrl && (
                          <div className="w-3 h-3 rounded-full bg-indigo-500" title="Has image" />
                        )}
                      </div>
                      
                      <p className="text-gray-400 text-sm line-clamp-3">
                        {page.text.substring(0, 100)}...
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
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
                  variant={viewMode === "outline" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("outline")}
                  className="text-white hover:bg-black/30"
                  title="View story outline"
                >
                  <List className="h-4 w-4" />
                </Button>
                
                <Button
                  variant={viewMode === "story" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("story")}
                  className="text-white hover:bg-black/30"
                  title="Story view with pages"
                >
                  <BookOpen className="h-4 w-4" />
                </Button>
                
                <Button
                  variant={viewMode === "text" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("text")}
                  className="text-white hover:bg-black/30"
                  title="Full text view"
                >
                  <FileText className="h-4 w-4" />
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
              {/* Audio Controls */}
              {(currentPageData.audioUrl || story.pages[0]?.audioUrl) && (
                <div className="flex flex-col gap-2 mb-4 max-w-3xl mx-auto w-full">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={togglePlayback}
                      className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20"
                      disabled={!isAudioLoaded}
                    >
                      {!isAudioLoaded ? (
                        <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      ) : isPlaying ? (
                        <Pause className="h-5 w-5" />
                      ) : (
                        <Play className="h-5 w-5" />
                      )}
                    </Button>
                    
                    <div className="flex-1 space-y-1">
                      <div 
                        className="h-2 bg-gray-700 rounded-full overflow-hidden cursor-pointer"
                        onClick={handleSeek}
                      >
                        <div 
                          className="h-full bg-indigo-500"
                          style={{ width: `${audioProgress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>{formatDuration(currentAudioTime)}</span>
                        <span>{formatDuration(audioDuration)}</span>
                      </div>
                    </div>
                    
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
                    
                    <div className="w-24 hidden md:block">
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
                </div>
              )}
              
              {/* Navigation Controls */}
              <div className="flex justify-between items-center max-w-md mx-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevPage}
                  disabled={currentPage === 0}
                  className="border-white/20 bg-black/30 text-white hover:bg-black/50 disabled:opacity-50"
                >
                  <SkipBack className="h-4 w-4 mr-1 md:mr-2" />
                  <span className="hidden md:inline">Previous</span>
                </Button>
                
                <div className="text-white text-sm">
                  {currentPage + 1} / {story.pages.length}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextPage}
                  disabled={currentPage === story.pages.length - 1}
                  className="border-white/20 bg-black/30 text-white hover:bg-black/50 disabled:opacity-50"
                >
                  <span className="hidden md:inline">Next</span>
                  <SkipForward className="h-4 w-4 ml-1 md:ml-2" />
                </Button>
              </div>
              
              {/* Keyboard shortcuts help */}
              <div className="text-xs text-gray-500 text-center mt-2">
                <p>Keyboard shortcuts: Space (play/pause), ← (previous page), → (next page), F (fullscreen), M (mute)</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}