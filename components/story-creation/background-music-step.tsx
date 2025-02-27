"use client";

import { useState } from "react";
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
  Star
} from "lucide-react";
import { StoryFormData } from "@/app/dashboard/create/page";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PremiumFeatureAlert } from "@/components/premium-feature-alert";
import { useUpgradeModal } from "@/hooks/useUpgradeModal";


interface BackgroundMusicStepProps {
  formData: StoryFormData;
  updateFormData: (field: keyof StoryFormData, value: any) => void;
  errors: { [key: string]: string };
  isSubscriber: boolean;
}

type MusicOption = {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
};

export function BackgroundMusicStep({ 
  formData, 
  updateFormData, 
  isSubscriber 
}: BackgroundMusicStepProps) {
  const [playing, setPlaying] = useState<string | null>(null);
  const { openModal } = useUpgradeModal();
  
  const handleMusicChange = (value: string) => {
    if (isSubscriber) {
      updateFormData("backgroundMusic", value);
    } else {
      // If not a subscriber, open the upgrade modal
      openModal("Background Music");
    }
  };
  
  const togglePlay = (id: string) => {
    if (isSubscriber) {
      if (playing === id) {
        setPlaying(null);
      } else {
        setPlaying(id);
      }
    } else {
      // If not a subscriber, open the upgrade modal
      openModal("Background Music");
    }
  };
  
  const musicOptions: MusicOption[] = [
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
      ) : (
        // Music selection for subscribers
        <RadioGroup 
          value={formData.backgroundMusic} 
          onValueChange={handleMusicChange}
          className="grid gap-4"
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
                  "flex items-center rounded-md border-2 border-gray-800 bg-gray-800/50 p-4 hover:bg-gray-800 hover:text-white peer-data-[state=checked]:border-indigo-500 peer-data-[state=checked]:bg-indigo-900/20 peer-data-[state=checked]:text-indigo-300 cursor-pointer transition-all"
                )}
              >
                <div className={`bg-${option.color}-900/40 rounded-full p-2 mr-4 text-${option.color}-400`}>
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
                    playing === option.id ? "bg-indigo-900/50 text-indigo-300" : "text-gray-400"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    togglePlay(option.id);
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
          ))}
        </RadioGroup>
      )}
      
      {/* Music note */}
      <Alert className="bg-gray-800 border-gray-700">
        <MusicIcon className="h-4 w-4 text-gray-400" />
        <AlertDescription className="text-gray-300">
          Background music plays softly during narration to enhance the story experience.
        </AlertDescription>
      </Alert>
    </div>
  );
}