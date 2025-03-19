// Fix for components/story-creation/narration-settings-step.tsx

import { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertCircle, 
  Lock, 
  Play, 
  Pause, 
  Sparkles, 
  User, 
  Volume2,
  Globe,
  MusicIcon,
  Wind,
  Waves,
  CloudRain,
  Star,
  Loader2
} from "lucide-react";
import { StoryFormData } from "@/app/dashboard/create/page";
import { cn } from "@/lib/utils";
import { useUpgradeModal } from "@/hooks/useUpgradeModal";
import { VoiceRecorder } from "./voice-recorder";

interface NarrationSettingsStepProps {
  formData: StoryFormData;
  updateFormData: (field: keyof StoryFormData, value: any) => void;
  errors: { [key: string]: string };
  isSubscriber: boolean;
}

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
  is_premium?: boolean;
}

// Language options
type LanguageOption = {
  id: string;
  label: string;
  nativeName: string;
  flag: string;
};

// Mock voice profiles for demo
const mockVoiceProfiles = [
  { 
    id: 'voice-1', 
    name: 'Mom', 
    createdAt: new Date('2023-10-15'), 
    lastUsed: new Date('2023-11-20'),
    duration: 37, // seconds
    audioUrl: '/voice-samples/mom.mp3'
  },
  { 
    id: 'voice-2', 
    name: 'Dad', 
    createdAt: new Date('2023-09-05'), 
    lastUsed: new Date('2023-11-15'),
    duration: 42, // seconds
    audioUrl: '/voice-samples/dad.mp3'
  }
];

// Background music options
type MusicOption = {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
};

export function NarrationSettingsStep({ 
  formData, 
  updateFormData, 
  errors,
  isSubscriber 
}: NarrationSettingsStepProps) {
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("language");
  // Use the useUpgradeModal hook for displaying the upgrade modal
  const { openModal } = useUpgradeModal();
  
  // ElevenLabs voices state
  const [voices, setVoices] = useState<Voice[]>([]);
  const [isLoadingVoices, setIsLoadingVoices] = useState(true);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  
  // Fetch ElevenLabs voices
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        console.log('Fetching voices from API...');
        setIsLoadingVoices(true);
        setVoiceError(null);
        
        const response = await fetch('/api/voices');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch voices: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Voice data received:', data);
        
        if (data.success === false) {
          throw new Error(data.error || 'Failed to fetch voices');
        }
        
        // Mark premium voices
        const voicesWithPremiumFlag = data.voices.map((voice: Voice) => ({
          ...voice,
          is_premium: voice.category === 'premium' || 
                     (voice.labels && voice.labels.use_case === 'storytelling')
        }));
        
        // Filter voices based on subscription and language
        const languageCodeMap: Record<string, string> = {
          'english': 'en',
          'indonesian': 'id'
        };
        
        const currentLanguageCode = languageCodeMap[formData.language] || 'en';
        
        const filteredVoices = voicesWithPremiumFlag.filter((voice: Voice) => {
          // For free users, exclude premium voices
          if (!isSubscriber && voice.is_premium) {
            return false;
          }
          
          // Base filter for appropriate voices
          const baseFilter = voice.category === 'professional' || 
                 (voice.labels && (
                   voice.labels.accent === 'American' || 
                   voice.labels.description === 'storyteller' ||
                   voice.labels.use_case === 'storytelling'
                 ));
                 
          // Don't apply language filter for English as most voices are in English
          if (formData.language === "english") {
            return baseFilter;
          }
          
          // For non-English languages, try to find matching voices
          // Since language is not defined in VoiceLabel type, we'll check accent or description
          return baseFilter && voice.labels && (
            voice.labels.accent?.toLowerCase().includes(currentLanguageCode) ||
            voice.labels.description?.toLowerCase().includes(currentLanguageCode)
          );
        });
        
        setVoices(filteredVoices);
        
        // Check if current voice is valid for this user's subscription
        const currentVoiceIsValid = 
          formData.voice && 
          !formData.voice.startsWith('voice-') && // Not a custom voice
          filteredVoices.some((v: { voice_id: string; }) => v.voice_id === formData.voice);
        
        // Auto-select first voice if none is selected or current is invalid
        if (!currentVoiceIsValid && filteredVoices.length > 0) {
          console.log('Auto-selecting first valid voice:', filteredVoices[0].voice_id);
          updateFormData("voice", filteredVoices[0].voice_id);
        }
      } catch (err) {
        console.error('Error fetching voices:', err);
        setVoiceError(err instanceof Error ? err.message : 'Failed to fetch voices');
      } finally {
        setIsLoadingVoices(false);
      }
    };

    // Load voices when on language tab, since that now includes voice selection
    if (activeTab === "language") {
      fetchVoices();
    }
    
    // Cleanup function to stop any playing audio
    return () => {
      if (audioRef) {
        audioRef.pause();
        audioRef.src = '';
      }
    };
  }, [activeTab, formData.voice, formData.language, updateFormData, isSubscriber]);
  
  // Language options
  const languageOptions: LanguageOption[] = [
    {
      id: "english",
      label: "English",
      nativeName: "English",
      flag: "🇺🇸"
    },
    {
      id: "indonesian",
      label: "Indonesian",
      nativeName: "Bahasa Indonesia",
      flag: "🇮🇩"
    }
  ];
  
  // Music options
  const musicOptions: MusicOption[] = [
    {
      id: "none", // Add a none option for free users
      label: "No Music",
      description: "Story narration without background music",
      icon: <Volume2 className="h-5 w-5" />,
      color: "gray"
    },
    {
      id: "calming",
      label: "Calming",
      description: "Gentle piano melodies for a peaceful bedtime atmosphere",
      icon: <Volume2 className="h-5 w-5" />,
      color: "blue"
    },
    {
      id: "soft",
      label: "Soft",
      description: "Subtle ambient sounds with light musical elements",
      icon: <Wind className="h-5 w-5" />,
      color: "indigo"
    },
    {
      id: "peaceful",
      label: "Peaceful",
      description: "Tranquil nature sounds mixed with soft instruments",
      icon: <Waves className="h-5 w-5" />,
      color: "green"
    },
    {
      id: "soothing",
      label: "Soothing",
      description: "Rain and gentle thunder sounds for deep relaxation",
      icon: <CloudRain className="h-5 w-5" />,
      color: "purple"
    },
    {
      id: "magical",
      label: "Magical",
      description: "Enchanting melodies with fantasy-like sound elements",
      icon: <Star className="h-5 w-5" />,
      color: "amber"
    },
  ];
  
  // Handlers
  const handleLanguageChange = (value: string) => {
    updateFormData("language", value);
  };
  
  const handleVoiceChange = (value: string) => {
    // If it's a custom voice and user is not a subscriber, show upgrade modal
    if ((value.startsWith('voice-') || value.startsWith('custom-')) && !isSubscriber) {
      openModal("Custom Voice Profiles");
      return;
    }
    
    // If it's a premium voice and user is not a subscriber, show upgrade modal
    const selectedVoice = voices.find(v => v.voice_id === value);
    if (selectedVoice?.is_premium && !isSubscriber) {
      openModal("Premium Voices");
      return;
    }
    
    updateFormData("voice", value);
  };
  
  const handleMusicChange = (value: string) => {
    // Only allow free users to select "none" - otherwise show upgrade modal
    if (value !== "none" && !isSubscriber) {
      openModal("Background Music");
      return;
    }
    updateFormData("backgroundMusic", value);
  };
  
  // Set default to "none" for free users if not already set
  useEffect(() => {
    if (!isSubscriber && !formData.backgroundMusic) {
      updateFormData("backgroundMusic", "none");
    }
  }, [isSubscriber, formData.backgroundMusic, updateFormData]);
  
  // Function to play voice sample from ElevenLabs
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
  
  // Function to play custom voice profiles
  const togglePlayCustomVoice = (id: string) => {
    // Simulated playback for custom voices
    if (currentlyPlaying === id) {
      setCurrentlyPlaying(null);
    } else {
      setCurrentlyPlaying(id);
      // Auto stop after 3 seconds
      setTimeout(() => setCurrentlyPlaying(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-2">Narration Settings</h3>
        <p className="text-gray-400">
          Choose language, voice, and background music for your story
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="language" className="flex items-center gap-1">
            <Globe className="h-3.5 w-3.5 mr-1" />
            Language & Voice
          </TabsTrigger>
          <TabsTrigger value="music" className="flex items-center gap-1">
            <MusicIcon className="h-3.5 w-3.5 mr-1" />
            Music
            {!isSubscriber && <Lock className="h-2.5 w-2.5 ml-1 text-amber-400" />}
          </TabsTrigger>
        </TabsList>
        
        {/* Language & Voice Section */}
        <TabsContent value="language" className="space-y-6 mt-0">
          <div>
            <h4 className="font-medium text-white flex items-center gap-2 mb-2">
              <Globe className="h-4 w-4 text-indigo-400" />
              Select Language
            </h4>
            
            <RadioGroup 
              value={formData.language} 
              onValueChange={handleLanguageChange}
              className="grid grid-cols-2 gap-3"
            >
              {languageOptions.map((language) => (
                <div key={language.id}>
                  <RadioGroupItem 
                    value={language.id} 
                    id={`language-${language.id}`} 
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`language-${language.id}`}
                    className={cn(
                      "flex items-center rounded-md border-2 border-gray-800 bg-gray-800/50 p-4 hover:bg-gray-800 hover:text-white peer-data-[state=checked]:border-indigo-500 peer-data-[state=checked]:bg-indigo-900/20 peer-data-[state=checked]:text-indigo-300 cursor-pointer transition-all"
                    )}
                  >
                    <div className="text-3xl mr-4" aria-hidden="true">
                      {language.flag}
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-base mb-0.5">{language.label}</h4>
                      <p className="text-xs text-gray-400">
                        {language.nativeName}
                      </p>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
            
            {/* Language note */}
            <Alert className="bg-gray-800 border-gray-700 mt-3">
              <Globe className="h-4 w-4 text-gray-400" />
              <AlertDescription className="text-gray-300">
                The story text and narration will be generated in your selected language.
              </AlertDescription>
            </Alert>
            
            {errors.language && (
              <Alert variant="destructive" className="bg-red-900/20 border-red-800 mt-3">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-300">
                  {errors.language}
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          {/* Voice Selection - moved from voice tab */}
          <div className="pt-2 border-t border-gray-800">
            <h4 className="font-medium text-white flex items-center gap-2 mb-3">
              <Volume2 className="h-4 w-4 text-indigo-400" />
              Voice Selection
            </h4>
            
            <RadioGroup 
              value={formData.voice} 
              onValueChange={handleVoiceChange}
              className="space-y-4"
            >
              {/* AI Voices */}
              <div className="space-y-2">
                <h5 className="text-sm text-gray-300 flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                  AI Narration Voices
                </h5>
                
                {isLoadingVoices ? (
                  <div className="flex items-center justify-center p-6 bg-gray-800/50 rounded-lg">
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-500 mr-2" />
                    <span className="text-gray-400">Loading voices...</span>
                  </div>
                ) : voiceError ? (
                  <Alert className="bg-red-900/20 border-red-800">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-300">
                      {voiceError}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {voices.length > 0 ? (
                      voices.map((voice) => (
                        <div key={voice.voice_id} className="bg-gray-800/50 rounded-md p-3 flex items-start space-x-2">
                          <RadioGroupItem 
                            value={voice.voice_id} 
                            id={voice.voice_id} 
                            className="mt-1"
                            // Disabled if premium voice and user is not a subscriber
                            disabled={voice.is_premium && !isSubscriber}
                          />
                          <div className="grid gap-1 w-full">
                            <Label 
                              htmlFor={voice.voice_id} 
                              className="flex justify-between font-medium cursor-pointer"
                            >
                              <span>{voice.name}</span>
                              <div className="flex items-center">
                                {voice.is_premium && !isSubscriber && (
                                  <Badge className="mr-2 bg-amber-900/60 text-amber-300">
                                    <Lock className="h-2.5 w-2.5 mr-0.5" />
                                    Premium
                                  </Badge>
                                )}
                                <span className="text-gray-400 text-sm">
                                  {voice.labels?.accent}
                                </span>
                              </div>
                            </Label>
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-muted-foreground">
                                {voice.labels?.description || voice.description || 'Storytelling voice'}
                              </p>
                              
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className={cn(
                                  "h-7 w-7",
                                  currentlyPlaying === voice.voice_id ? "text-indigo-400" : "text-gray-400"
                                )}
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (voice.is_premium && !isSubscriber) {
                                    openModal("Premium Voices");
                                  } else {
                                    playVoiceSample(voice.voice_id);
                                  }
                                }}
                              >
                                {currentlyPlaying === voice.voice_id ? (
                                  <Pause className="h-3.5 w-3.5" />
                                ) : (
                                  <Play className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 p-4 text-center bg-gray-800/50 rounded-lg">
                        <p className="text-gray-400">No voices available</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Custom Voice Profiles */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm text-gray-300 flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-indigo-400" />
                    Your Voice Profiles
                  </h5>
                  
                  {!isSubscriber && (
                    <Badge className="bg-amber-900/60 text-amber-300">
                      <Lock className="h-3 w-3 mr-1" />
                      Premium Feature
                    </Badge>
                  )}
                </div>
                
                {!isSubscriber ? (
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-400 mb-3">
                      Upgrade to Premium to use your own voice for story narration
                    </p>
                    <Button 
                      onClick={() => openModal("Custom Voice Profiles")}
                      variant="outline" 
                      className="bg-amber-900/30 text-amber-300 border-amber-800 hover:bg-amber-900/50"
                      size="sm"
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                      Upgrade to Premium
                    </Button>
                  </div>
                ) : mockVoiceProfiles.length === 0 ? (
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-400 mb-3">
                      You haven't created any voice profiles yet
                    </p>
                    <VoiceRecorder 
                      onSave={(voiceData) => {
                        console.log('Voice profile saved:', voiceData);
                        // In a real implementation, you would upload this to your backend
                        // and then add it to the voice profiles list
                        alert('Voice profile created successfully!');
                      }}
                      isSubscriber={isSubscriber}
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mockVoiceProfiles.map((profile) => (
                      <div 
                        key={profile.id} 
                        className={cn(
                          "flex items-center space-x-3 p-3 border rounded-lg",
                          formData.voice === profile.id 
                            ? "bg-indigo-900/20 border-indigo-800" 
                            : "bg-gray-800/50 border-gray-700 hover:bg-gray-800"
                        )}
                      >
                        <RadioGroupItem 
                          value={profile.id} 
                          id={profile.id} 
                          className="mt-0"
                        />
                        
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-indigo-900/50 text-indigo-300">
                            {profile.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <Label 
                            htmlFor={profile.id} 
                            className="font-medium cursor-pointer"
                          >
                            {profile.name}
                          </Label>
                        </div>
                        
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-8 w-8",
                            currentlyPlaying === profile.id ? "text-indigo-400" : "text-gray-400"
                          )}
                          onClick={(e) => {
                            e.preventDefault();
                            togglePlayCustomVoice(profile.id);
                          }}
                        >
                          {currentlyPlaying === profile.id ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Add Voice Recorder for existing profiles */}
                {isSubscriber && mockVoiceProfiles.length > 0 && (
                  <div className="mt-3 text-right">
                    <VoiceRecorder 
                      onSave={(voiceData) => {
                        console.log('Voice profile saved:', voiceData);
                        // In a real implementation, you would upload this to your backend
                        // and then add it to the voice profiles list
                        alert('Voice profile created successfully!');
                      }}
                      isSubscriber={isSubscriber}
                    />
                  </div>
                )}
              </div>
            </RadioGroup>
            
            {errors.voice && (
              <Alert variant="destructive" className="bg-red-900/20 border-red-800 mt-3">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-300">
                  {errors.voice}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </TabsContent>
        
        
        {/* Background Music Section */}
        <TabsContent value="music" className="space-y-4 mt-0">
          {!isSubscriber ? (
            <div className="rounded-lg border border-amber-800/60 bg-amber-900/20 p-4 space-y-3 text-center">
              <div className="mx-auto rounded-full bg-amber-900/30 w-12 h-12 flex items-center justify-center mb-1">
                <Lock className="h-5 w-5 text-amber-300" />
              </div>
              <h4 className="text-amber-300 font-medium">Premium Feature</h4>
              <p className="text-amber-200/80 text-sm">
                Enhance your stories with calming background music to create the perfect bedtime atmosphere.
              </p>
              <Button 
                onClick={() => openModal("Background Music")}
                className="bg-amber-600 hover:bg-amber-700 text-white border-none mt-2"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Upgrade to Premium
              </Button>
            </div>
          ) : (
            <RadioGroup 
              value={formData.backgroundMusic || "none"} 
              onValueChange={handleMusicChange}
              className="grid gap-3"
            >
              {musicOptions.map((option) => (
                <div key={option.id}>
                  <RadioGroupItem 
                    value={option.id} 
                    id={`music-${option.id}`} 
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`music-${option.id}`}
                    className={cn(
                      "flex items-center rounded-md border-2 border-gray-800 bg-gray-800/50 p-3 hover:bg-gray-800 hover:text-white peer-data-[state=checked]:border-indigo-500 peer-data-[state=checked]:bg-indigo-900/20 peer-data-[state=checked]:text-indigo-300 cursor-pointer transition-all",
                      option.id === "none" && "opacity-80" // Lower opacity for "none" option
                    )}
                  >
                    <div className={`bg-${option.color}-900/40 rounded-full p-2 mr-3 text-${option.color}-400`}>
                      {option.icon}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-medium text-base mb-0.5">{option.label}</h4>
                      <p className="text-xs text-gray-400">
                        {option.description}
                      </p>
                    </div>
                    
                    <Button
                      size="icon"
                      variant="ghost"
                      className={cn(
                        "rounded-full h-8 w-8",
                        currentlyPlaying === option.id ? "bg-indigo-900/50 text-indigo-300" : "text-gray-400"
                      )}
                      onClick={(e) => {
                        e.preventDefault();
                        togglePlayCustomVoice(option.id);
                      }}
                    >
                      {currentlyPlaying === option.id ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
          
          {errors.backgroundMusic && (
            <Alert variant="destructive" className="bg-red-900/20 border-red-800">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">
                {errors.backgroundMusic}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Music note */}
          <Alert className="bg-gray-800 border-gray-700">
            <MusicIcon className="h-4 w-4 text-gray-400" />
            <AlertDescription className="text-gray-300">
              Background music plays softly during narration to enhance the story experience.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
      
      {/* Voice sample preview */}
      {currentlyPlaying && (
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-white">Playing Sample</h4>
            <Progress value={45} className="h-1.5 w-24" />
          </div>
          
          <p className="text-sm text-gray-300 italic mb-1">
            "Once upon a time, in a magical forest..."
          </p>
        </div>
      )}
      
    </div>
  );
}