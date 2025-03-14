"use client";

import { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  MusicIcon,
  Pause,
  Play,
  Lock,
  Volume2,
  Wind,
  Waves,
  CloudRain,
  Star,
  Loader2
} from "lucide-react";
import { StoryFormData } from "@/app/dashboard/create/page";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PremiumFeatureAlert } from "@/components/premium-feature-alert";
import { useUpgradeModal } from "@/hooks/useUpgradeModal";
import { BackgroundMusic } from "@/lib/services/background-music-service";

interface BackgroundMusicStepProps {
  formData: StoryFormData;
  updateFormData: (field: keyof StoryFormData, value: any) => void;
  errors: { [key: string]: string };
  isSubscriber: boolean;
}

// Get icon based on music category
const getCategoryIcon = (category: string) => {
  switch (category?.toLowerCase()) {
    case 'peaceful':
    case 'relaxing':
      return <Waves className="h-5 w-5" />;
    case 'magical':
    case 'fantasy':
      return <Star className="h-5 w-5" />;
    case 'soft':
    case 'gentle':
      return <Wind className="h-5 w-5" />;
    case 'rain':
    case 'nature':
      return <CloudRain className="h-5 w-5" />;
    default:
      return <Volume2 className="h-5 w-5" />;
  }
};

// Get color based on music category
const getMoodColor = (category: string) => {
  switch (category?.toLowerCase()) {
    case 'peaceful':
      return 'blue';
    case 'magical':
      return 'purple';
    case 'soft':
      return 'green';
    case 'soothing':
      return 'cyan';
    case 'calming':
      return 'indigo';
    default:
      return 'blue';
  }
};

export function BackgroundMusicStep({ 
  formData, 
  updateFormData, 
  isSubscriber 
}: BackgroundMusicStepProps) {
  const [musicOptions, setMusicOptions] = useState<BackgroundMusic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const { openModal } = useUpgradeModal();
  
  // Audio reference for playing music
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Fetch background music options on component mount
  useEffect(() => {
    const fetchMusicOptions = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/background-music');
        
        if (!response.ok) {
          throw new Error(`Error fetching background music: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          setMusicOptions(data.data);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('Failed to fetch background music:', err);
        setError('Failed to load background music options');
        
        // Fallback music options
        setMusicOptions([
          {
            id: "calming",
            name: "Gentle Lullaby",
            description: "Soft piano melody perfect for sleeping",
            storage_path: "background-music/gentle-lullaby.mp3",
            duration: 180,
            category: "calming",
            is_premium: false
          },
          {
            id: "peaceful",
            name: "Ocean Waves",
            description: "Soothing ocean sounds with gentle background melody",
            storage_path: "background-music/ocean-waves.mp3",
            duration: 240,
            category: "peaceful",
            is_premium: false
          },
          {
            id: "soft",
            name: "Dreamy Night",
            description: "Ethereal ambient music with soft synths",
            storage_path: "background-music/dreamy-night.mp3",
            duration: 210,
            category: "soft",
            is_premium: true
          },
          {
            id: "magical",
            name: "Starlight Dreams",
            description: "Magical twinkling sounds with gentle harp",
            storage_path: "background-music/starlight-dreams.mp3",
            duration: 195,
            category: "magical",
            is_premium: true
          },
          {
            id: "soothing",
            name: "Rainfall",
            description: "Gentle rain with soft piano in background",
            storage_path: "background-music/rainfall.mp3",
            duration: 220,
            category: "soothing",
            is_premium: false
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMusicOptions();
    
    // Initialize audio element
    audioRef.current = new Audio();
    
    // Cleanup audio on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);
  
  // Handle selecting music
  const handleMusicChange = (value: string) => {
    if (isSubscriber) {
      // Stop any playing audio
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlaying(null);
      
      // Find the selected option to get its ID
      const selectedMusic = musicOptions.find(option => option.id === value);
      if (selectedMusic) {
        // Use the actual UUID
        updateFormData("backgroundMusic", selectedMusic.id);
        console.log(`Selected background music: ${selectedMusic.name} (${selectedMusic.id})`);
      } else {
        // Fallback to the value directly
        updateFormData("backgroundMusic", value);
        console.log(`Selected background music with ID: ${value}`);
      }
    } else {
      // If not a subscriber, open the upgrade modal
      openModal("Background Music");
    }
  };
  
  // Function to get URL for streaming from Supabase storage
  const getBackgroundMusicStreamUrl = (path: string): string => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return '';
    
    // Construct storage URL
    return `${supabaseUrl}/storage/v1/object/public/${path}`;
  };

  // Handle play/pause 
  const togglePlay = (id: string, storagePath: string) => {
    if (!isSubscriber) {
      // If not a subscriber, open the upgrade modal
      openModal("Background Music");
      return;
    }
    
    if (playing === id) {
      // Stop playing
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlaying(null);
    } else {
      // Stop any current audio
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      // Get the full URL from the storage path
      const fullUrl = getBackgroundMusicStreamUrl(storagePath);
      
      // Start playing the selected track
      if (audioRef.current) {
        audioRef.current.src = fullUrl;
        audioRef.current.volume = 0.5; // Set volume to 50%
        audioRef.current.loop = true; // Loop the audio
        
        // Play and handle errors
        audioRef.current.play().catch(err => {
          console.error('Error playing audio:', err);
          setPlaying(null);
        });
        
        setPlaying(id);
        
        // Handle audio ending
        audioRef.current.onended = () => {
          setPlaying(null);
        };
      }
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Background Music</h3>
            <p className="text-gray-400">
              Choose background music for your story narration
            </p>
          </div>
          
          {!isSubscriber && (
            <Badge className="bg-amber-900/60 text-amber-300">
              <Lock className="h-3 w-3 mr-1" />
              Premium Feature
            </Badge>
          )}
        </div>
      </div>
      
      {!isSubscriber ? (
        // Subscriber-only message using our enhanced component
        <PremiumFeatureAlert 
          variant="banner"
          featureName="Background Music"
          message="Enhance your stories with calming background music to create the perfect bedtime atmosphere."
        />
      ) : loading ? (
        // Loading state
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
          <span className="ml-3 text-gray-400">Loading music options...</span>
        </div>
      ) : error ? (
        // Error state
        <Alert variant="destructive" className="bg-red-900/20 border-red-800">
          <AlertDescription className="text-red-300">
            {error} - Please try refreshing the page.
          </AlertDescription>
        </Alert>
      ) : (
        // Music selection for subscribers
        <RadioGroup 
          value={formData.backgroundMusic} 
          onValueChange={handleMusicChange}
          className="grid gap-4"
        >
          {musicOptions.map((option) => {
            const icon = getCategoryIcon(option.category);
            const color = getMoodColor(option.category);
            
            return (
              <div key={option.id}>
                <RadioGroupItem 
                  value={option.id} 
                  id={`music-${option.id}`} 
                  className="peer sr-only"
                />
                <Label
                  htmlFor={`music-${option.id}`}
                  className={cn(
                    "flex items-center rounded-md border-2 border-gray-800 bg-gray-800/50 p-4 hover:bg-gray-800 hover:text-white peer-data-[state=checked]:border-indigo-500 peer-data-[state=checked]:bg-indigo-900/20 peer-data-[state=checked]:text-indigo-300 cursor-pointer transition-all"
                  )}
                >
                  <div className={`bg-${color}-900/40 rounded-full p-2 mr-4 text-${color}-400`}>
                    {icon}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-medium text-base mb-0.5">{option.name}</h4>
                    <p className="text-xs text-gray-400">
                      {option.description || `${option.category} music for a relaxing atmosphere`}
                    </p>
                  </div>
                  
                  <Button
                    size="icon"
                    variant="ghost"
                    className={cn(
                      "rounded-full h-8 w-8",
                      playing === option.id ? "bg-indigo-900/50 text-indigo-300" : "text-gray-400"
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      togglePlay(option.id, option.storage_path);
                    }}
                  >
                    {playing === option.id ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                </Label>
              </div>
            );
          })}
        </RadioGroup>
      )}
      
      {/* Music note */}
      <Alert className="bg-gray-800 border-gray-700">
        <MusicIcon className="h-4 w-4 text-gray-400" />
        <AlertDescription className="text-gray-300">
          Background music plays softly during narration to enhance the story experience.
          {isSubscriber && " Click the play button to preview each track."}
        </AlertDescription>
      </Alert>
    </div>
  );
}