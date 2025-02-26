"use client";

import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  AlertCircle, 
  Lock, 
  Play, 
  Pause, 
  Sparkles, 
  User, 
  Volume2,
  VolumeX
} from "lucide-react";
import { StoryFormData } from "@/app/dashboard/create/page";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface VoiceSelectionStepProps {
  formData: StoryFormData;
  updateFormData: (field: keyof StoryFormData, value: any) => void;
  errors: { [key: string]: string };
  isSubscriber: boolean;
}

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

// Mock AI voices
const aiVoices = [
  { id: 'ai-1', name: 'Emily', gender: 'female', style: 'Gentle' },
  { id: 'ai-2', name: 'James', gender: 'male', style: 'Warm' },
  { id: 'ai-3', name: 'Lily', gender: 'female', style: 'Playful' },
  { id: 'ai-4', name: 'Michael', gender: 'male', style: 'Calm' },
];

export function VoiceSelectionStep({ 
  formData, 
  updateFormData, 
  errors,
  isSubscriber 
}: VoiceSelectionStepProps) {
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState(formData.voice || 'ai-1');
  
  const togglePlayVoice = (id: string) => {
    if (currentlyPlaying === id) {
      setCurrentlyPlaying(null);
      // Stop playback
    } else {
      setCurrentlyPlaying(id);
      // Start playback
      setTimeout(() => setCurrentlyPlaying(null), 3000); // Auto stop after 3 seconds
    }
  };
  
  const handleVoiceChange = (value: string) => {
    setSelectedVoice(value);
    updateFormData("voice", value);
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-2">Narration Voice</h3>
        <p className="text-gray-400">
          Choose the voice that will narrate your story
        </p>
      </div>
      
      <RadioGroup 
        value={selectedVoice} 
        onValueChange={handleVoiceChange}
        className="space-y-4"
      >
        <div className="space-y-2">
          <h4 className="font-medium text-white flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-indigo-400" />
            AI Narration Voices
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {aiVoices.map((voice) => (
              <div key={voice.id} className="flex items-start space-x-2">
                <RadioGroupItem 
                  value={voice.id} 
                  id={voice.id} 
                  className="mt-1"
                />
                <div className="grid gap-1.5 w-full">
                  <Label 
                    htmlFor={voice.id} 
                    className="flex justify-between font-medium cursor-pointer"
                  >
                    <span>{voice.name}</span>
                    <span className="text-gray-400 text-sm">{voice.gender}</span>
                  </Label>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {voice.style} storytelling style
                    </p>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-7 w-7",
                        currentlyPlaying === voice.id ? "text-indigo-400" : "text-gray-400"
                      )}
                      onClick={(e) => {
                        e.preventDefault();
                        togglePlayVoice(voice.id);
                      }}
                    >
                      {currentlyPlaying === voice.id ? (
                        <Pause className="h-3.5 w-3.5" />
                      ) : (
                        <Play className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Custom Voice Profiles Section */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-white flex items-center gap-2">
              <User className="h-4 w-4 text-indigo-400" />
              Your Voice Profiles
            </h4>
            
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
                variant="outline" 
                className="bg-amber-900/30 text-amber-300 border-amber-800 hover:bg-amber-900/50"
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
              <Button 
                variant="outline" 
                className="border-gray-700"
              >
                <User className="h-3.5 w-3.5 mr-1.5" />
                Create Voice Profile
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {mockVoiceProfiles.map((profile) => (
                <div 
                  key={profile.id} 
                  className={cn(
                    "flex items-center space-x-3 p-3 border rounded-lg",
                    selectedVoice === profile.id 
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
                      togglePlayVoice(profile.id);
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
        </div>
      </RadioGroup>
      
      {/* Error message */}
      {errors.voice && (
        <Alert variant="destructive" className="bg-red-900/20 border-red-800">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-300">
            {errors.voice}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Voice sample */}
      <div className="bg-gray-800/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-white">Voice Sample</h4>
          
          {currentlyPlaying && (
            <Progress 
              value={45} 
              className="h-1.5 w-24"
            />
          )}
        </div>
        
        <p className="text-sm text-gray-300 italic mb-3">
          "Once upon a time, in a magical forest, there lived a curious little girl named Emma..."
        </p>
        
        <Button 
          variant="outline" 
          size="sm"
          className="border-gray-700"
          onClick={() => togglePlayVoice(selectedVoice)}
        >
          {currentlyPlaying === selectedVoice ? (
            <>
              <Pause className="h-3.5 w-3.5 mr-1.5" />
              Stop Sample
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 mr-1.5" />
              Play Voice Sample
            </>
          )}
        </Button>
      </div>
    </div>
  );
}