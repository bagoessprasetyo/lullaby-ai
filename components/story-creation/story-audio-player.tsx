"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  RefreshCw,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StoryAudioPlayerProps {
  audioUrl: string;
  onEnded?: () => void;
  className?: string;
}

export function StoryAudioPlayer({ 
  audioUrl, 
  onEnded,
  className 
}: StoryAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Process the audio URL if it's from Cloudinary
  const processedAudioUrl = useMemo(() => {
    // Log for debugging
    console.log(`[Audio Player] Original audio URL: ${audioUrl}`);
    
    if (!audioUrl) return '';
    
    // If it's a data URL, use it directly
    if (audioUrl.startsWith('data:')) {
      console.log('[Audio Player] Using data URL directly');
      return audioUrl;
    }
    
    // If it's a Cloudinary URL, use our proxy
    if (audioUrl.includes('cloudinary.com')) {
      const proxyUrl = `/api/audio-proxy?url=${encodeURIComponent(audioUrl)}`;
      console.log(`[Audio Player] Using proxy URL: ${proxyUrl}`);
      return proxyUrl;
    }
    
    // Otherwise use the URL directly
    return audioUrl;
  }, [audioUrl, loadAttempt]);
  
  // Reset error and loading state when URL changes or retry is attempted
  useEffect(() => {
    setError(null);
    setErrorDetails(null);
    setIsLoading(true);
  }, [processedAudioUrl, loadAttempt]);
  
  // Initialize audio element
  useEffect(() => {
    if (!processedAudioUrl) return;
    
    console.log(`[Audio Player] Loading audio from: ${processedAudioUrl}`);
    
    // Create a new audio element
    const audio = new Audio(processedAudioUrl);
    audioRef.current = audio;
    
    // Set up event listeners
    const handleLoadedMetadata = () => {
      console.log(`[Audio Player] Audio loaded, duration: ${audio.duration}s`);
      setDuration(audio.duration);
      setIsLoading(false);
    };
    
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    
    const handleEnded = () => {
      console.log('[Audio Player] Audio playback ended');
      setIsPlaying(false);
      setCurrentTime(0);
      if (onEnded) onEnded();
    };
    
    const handleError = (e: Event) => {
      const audioElement = e.target as HTMLAudioElement;
      console.error('[Audio Player] Audio load error:', e);
      console.error('[Audio Player] Media error code:', audioElement.error?.code);
      console.error('[Audio Player] Media error message:', audioElement.error?.message);
      
      setError(`Audio loading failed (${audioElement.error?.code || 'unknown'})`);
      
      // Set detailed error message based on error code
      switch (audioElement.error?.code) {
        case 1: // MEDIA_ERR_ABORTED
          setErrorDetails('Media playback was aborted.');
          break;
        case 2: // MEDIA_ERR_NETWORK
          setErrorDetails('A network error occurred. Try again or check your connection.');
          break;
        case 3: // MEDIA_ERR_DECODE
          setErrorDetails('Media decoding error. The audio format may not be supported.');
          break;
        case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
          setErrorDetails('Audio format or MIME type is not supported by your browser.');
          break;
        default:
          setErrorDetails(`Media error: ${audioElement.error?.message || 'Unknown error'}`);
      }
      
      setIsLoading(false);
    };
    
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    
    // Set volume
    audio.volume = volume;
    
    // Some browsers need to preload audio
    audio.preload = 'auto';
    
    // Clean up
    return () => {
      console.log('[Audio Player] Cleaning up audio element');
      audio.pause();
      
      // Remove event listeners
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      
      // Clear source and release resources
      audio.src = '';
      audio.load();
    };
  }, [processedAudioUrl, onEnded, volume]);
  
  // Handle play/pause
  const togglePlayPause = () => {
    if (!audioRef.current) return;
    
    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(err => {
          console.error('[Audio Player] Play error:', err);
          setError(`Playback failed: ${err.message}`);
        });
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('[Audio Player] Toggle play/pause error:', err);
      setError(`Playback control failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };
  
  // Format time in MM:SS
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  // Skip forward/backward by 10 seconds
  const skipForward = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, duration);
  };
  
  const skipBackward = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
  };
  
  // Handle time slider change
  const handleTimeChange = (value: number[]) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = value[0];
    setCurrentTime(value[0]);
  };
  
  // Handle volume slider change
  const handleVolumeChange = (value: number[]) => {
    if (!audioRef.current) return;
    const newVolume = value[0];
    setVolume(newVolume);
    audioRef.current.volume = newVolume;
    
    if (newVolume === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };
  
  // Toggle mute
  const toggleMute = () => {
    if (!audioRef.current) return;
    
    if (isMuted) {
      audioRef.current.volume = volume;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };
  
  // Retry loading the audio
  const handleRetry = () => {
    console.log('[Audio Player] Retrying audio load');
    setLoadAttempt(prev => prev + 1);
  };
  
  // Show loading state if isLoading is true
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center h-16 bg-gray-800/60 rounded-lg", className)}>
        <div className="animate-pulse flex items-center space-x-2">
          <div className="h-3 w-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="h-3 w-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="h-3 w-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    );
  }
  
  // Show error state if there's an error
  if (error) {
    return (
      <div className={cn("bg-red-900/20 border border-red-800 rounded-lg p-3", className)}>
        <div className="flex items-center gap-2 text-red-300 mb-1">
          <AlertTriangle className="h-4 w-4" />
          <p className="text-sm font-medium">{error}</p>
        </div>
        {errorDetails && (
          <p className="text-xs text-red-300/80 ml-6 mb-2">{errorDetails}</p>
        )}
        <div className="flex justify-end">
          <Button 
            variant="outline"
            size="sm"
            onClick={handleRetry}
            className="bg-red-900/30 border-red-800 hover:bg-red-900/50 text-red-300"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Retry
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={cn("p-3 bg-gray-800/60 rounded-lg", className)}>
      {/* Time display and slider */}
      <div className="flex items-center mb-3">
        <span className="text-xs text-gray-400 w-12">{formatTime(currentTime)}</span>
        <Slider
          value={[currentTime]}
          min={0}
          max={duration}
          step={0.1}
          onValueChange={handleTimeChange}
          className="mx-2 flex-1"
        />
        <span className="text-xs text-gray-400 w-12 text-right">{formatTime(duration)}</span>
      </div>
      
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700" 
            onClick={skipBackward}
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="default" 
            size="icon"
            className="h-10 w-10 rounded-full bg-indigo-600 hover:bg-indigo-700" 
            onClick={togglePlayPause}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700" 
            onClick={skipForward}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700" 
            onClick={toggleMute}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          
          <Slider
            value={[isMuted ? 0 : volume]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
            className="w-20"
          />
        </div>
      </div>
    </div>
  );
}