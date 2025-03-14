// hooks/useVoiceSelection.ts
import { useState, useEffect, useRef } from 'react';

interface Voice {
  voice_id: string;
  name: string;
  preview_url?: string;
  category?: string;
  description?: string;
  labels?: {
    accent?: string;
    description?: string;
    gender?: string;
    use_case?: string;
    [key: string]: string | undefined;
  };
}

interface UseVoiceSelectionResult {
  voices: Voice[];
  isLoading: boolean;
  error: string | null;
  selectedVoice: string | null;
  currentlyPlaying: string | null;
  setSelectedVoice: (voiceId: string) => void;
  playVoiceSample: (voiceId: string) => Promise<void>;
  stopPlayback: () => void;
}

export function useVoiceSelection(initialVoiceId?: string): UseVoiceSelectionResult {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(initialVoiceId || null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Fetch voices from API
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/voices');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch voices: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch voices');
        }
        
        setVoices(data.voices);
        
        // Auto-select first voice if none is selected
        if (!selectedVoice && data.voices.length > 0) {
          setSelectedVoice(data.voices[0].voice_id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error('Error fetching voices:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchVoices();
    
    // Clean up audio on unmount
    return () => {
      stopPlayback();
    };
  }, []);
  
  // Function to play voice sample
  const playVoiceSample = async (voiceId: string) => {
    try {
      // If already playing this voice, stop it
      if (currentlyPlaying === voiceId) {
        stopPlayback();
        return;
      }
      
      // Stop any currently playing audio
      stopPlayback();
      
      // Find the voice
      const voice = voices.find(v => v.voice_id === voiceId);
      if (!voice || !voice.preview_url) {
        throw new Error('Voice sample not available');
      }
      
      // Create and configure new audio element
      const audio = new Audio(voice.preview_url);
      
      // Set up event handlers
      audio.addEventListener('ended', () => {
        setCurrentlyPlaying(null);
      });
      
      audio.addEventListener('error', () => {
        setCurrentlyPlaying(null);
        setError('Error playing voice sample');
      });
      
      // Store reference for cleanup
      audioRef.current = audio;
      
      // Start playback
      setCurrentlyPlaying(voiceId);
      await audio.play();
    } catch (err) {
      setCurrentlyPlaying(null);
      console.error('Error playing voice sample:', err);
      setError(err instanceof Error ? err.message : 'Failed to play voice sample');
    }
  };
  
  // Function to stop playback
  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setCurrentlyPlaying(null);
  };
  
  return {
    voices,
    isLoading,
    error,
    selectedVoice,
    currentlyPlaying,
    setSelectedVoice,
    playVoiceSample,
    stopPlayback
  };
}