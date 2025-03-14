import { useState, useEffect } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Play, Pause, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Define types for the voice object
interface VoiceLabel {
  accent?: string;
  description?: string;
  use_case?: string;
}

interface Voice {
  voice_id: string;
  name: string;
  category?: string;
  description?: string;
  preview_url?: string;
  labels?: VoiceLabel;
}

// Define props interface
interface ElevenLabsVoiceSelectorProps {
  selectedVoice: string | null;
  onVoiceChange: (voiceId: string) => void;
  error?: string | null;
}

/**
 * Component to fetch and display voices from ElevenLabs API
 */
export function ElevenLabsVoiceSelector({ 
  selectedVoice, 
  onVoiceChange, 
  error 
}: ElevenLabsVoiceSelectorProps) {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

  // Fetch voices from ElevenLabs API
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        setIsLoading(true);
        // Make API request to your backend proxy endpoint
        const response = await fetch('/api/voices');
        console.log('voices ', response)
        if (!response.ok) {
          throw new Error(`Failed to fetch voices: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success === false) {
          throw new Error(data.error || 'Failed to fetch voices');
        }
        
        // Filter voices to include only those with appropriate labels
        const filteredVoices = data.voices.filter((voice: Voice) => {
          // Include voices marked as professional or that have specific kid-friendly labels
          return voice.category === 'professional' || 
                 (voice.labels && (
                   voice.labels.accent === 'American' || 
                   voice.labels.description === 'storyteller' ||
                   voice.labels.use_case === 'storytelling'
                 ));
        });
        
        setVoices(filteredVoices);
        
        // Auto-select first voice if none is selected
        if (!selectedVoice && filteredVoices.length > 0) {
          onVoiceChange(filteredVoices[0].voice_id);
        }
      } catch (err) {
        console.error('Error fetching voices:', err);
        setApiError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVoices();
    
    // Cleanup function to stop any playing audio
    return () => {
      if (audioRef) {
        audioRef.pause();
        audioRef.src = '';
      }
    };
  }, [selectedVoice, onVoiceChange]);

  // Function to play voice sample
  const playVoiceSample = async (voiceId: string) => {
    try {
      // If already playing, stop it
      if (currentlyPlaying === voiceId) {
        if (audioRef) {
          audioRef.pause();
          audioRef.src = '';
        }
        setCurrentlyPlaying(null);
        return;
      }
      
      // Stop any currently playing audio
      if (audioRef) {
        audioRef.pause();
        audioRef.src = '';
      }
      
      // Find voice to get preview URL
      const voice = voices.find(v => v.voice_id === voiceId);
      if (!voice || !voice.preview_url) {
        throw new Error('Voice sample not available');
      }
      
      // Create new audio element
      const audio = new Audio(voice.preview_url);
      setAudioRef(audio);
      
      // Set up event listeners
      audio.addEventListener('ended', () => {
        setCurrentlyPlaying(null);
      });
      
      audio.addEventListener('error', (e) => {
        console.error('Audio playback error:', e);
        setCurrentlyPlaying(null);
      });
      
      // Play the audio
      setCurrentlyPlaying(voiceId);
      await audio.play();
    } catch (err) {
      console.error('Error playing voice sample:', err);
      setCurrentlyPlaying(null);
    }
  };

  // Handle voice selection
  const handleVoiceChange = (voiceId: string) => {
    onVoiceChange(voiceId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <span className="ml-2 text-gray-400">Loading voices...</span>
      </div>
    );
  }

  if (apiError) {
    return (
      <Alert className="bg-red-900/20 border-red-800">
        <AlertCircle className="h-4 w-4 text-red-400" />
        <AlertDescription className="text-red-300">
          Error loading voices: {apiError}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <RadioGroup 
        value={selectedVoice || ''} 
        onValueChange={handleVoiceChange}
        className="space-y-3"
      >
        {voices.length === 0 ? (
          <div className="text-gray-400 p-4 text-center border border-gray-700 rounded-lg">
            No voices available. Please try again later.
          </div>
        ) : (
          voices.map((voice) => (
            <div 
              key={voice.voice_id} 
              className={cn(
                "flex items-center space-x-2 p-3 border rounded-lg",
                selectedVoice === voice.voice_id 
                  ? "bg-indigo-900/20 border-indigo-800" 
                  : "bg-gray-800/50 border-gray-700 hover:bg-gray-800"
              )}
            >
              <RadioGroupItem 
                value={voice.voice_id} 
                id={voice.voice_id} 
                className="mt-0"
              />
              
              <div className="flex-1">
                <Label 
                  htmlFor={voice.voice_id} 
                  className="font-medium cursor-pointer flex items-center"
                >
                  <span>{voice.name}</span>
                  {voice.labels && (
                    <span className="ml-2 text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
                      {voice.labels.accent || voice.labels.description || ''}
                    </span>
                  )}
                </Label>
                
                <p className="text-sm text-gray-400">
                  {voice.labels?.description || voice.description || "Professional voice for narration"}
                </p>
              </div>
              
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8",
                  currentlyPlaying === voice.voice_id ? "text-indigo-400" : "text-gray-400"
                )}
                onClick={(e) => {
                  e.preventDefault();
                  playVoiceSample(voice.voice_id);
                }}
              >
                {currentlyPlaying === voice.voice_id ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            </div>
          ))
        )}
      </RadioGroup>
      
      {/* Error message */}
      {error && (
        <Alert variant="destructive" className="bg-red-900/20 border-red-800">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-300">
            {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}