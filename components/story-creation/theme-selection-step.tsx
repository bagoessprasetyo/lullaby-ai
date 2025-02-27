"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  AlertCircle, 
  Sparkles, 
  BookOpen, 
  Rocket, 
  Wand2, 
  GraduationCap, 
  Moon 
} from "lucide-react";
import { StoryFormData } from "@/app/dashboard/create/page";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useUpgradeModal } from "@/hooks/useUpgradeModal";

interface ThemeSelectionStepProps {
  formData: StoryFormData;
  updateFormData: (field: keyof StoryFormData, value: any) => void;
  errors: { [key: string]: string };
  isSubscriber: boolean;
}

type ThemeOption = {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  premiumOnly?: boolean;
};

export function ThemeSelectionStep({ 
  formData, 
  updateFormData, 
  errors,
  isSubscriber 
}: ThemeSelectionStepProps) {
  const { openModal } = useUpgradeModal();
  
  const handleThemeChange = (value: string) => {
    // For premium-only themes, open upgrade modal if not a subscriber
    if ((value === "educational" || value === "customized") && !isSubscriber) {
      openModal("Story Themes");
      return;
    }
    
    updateFormData("theme", value);
  };
  
  const themeOptions: ThemeOption[] = [
    {
      id: "adventure",
      label: "Adventure",
      description: "Exciting journeys and discoveries in magical worlds",
      icon: <Rocket className="h-5 w-5" />,
      color: "blue"
    },
    {
      id: "fantasy",
      label: "Fantasy",
      description: "Magical realms with enchanted creatures and spells",
      icon: <Wand2 className="h-5 w-5" />,
      color: "purple"
    },
    {
      id: "bedtime",
      label: "Calming Bedtime",
      description: "Gentle stories designed for peaceful sleep and sweet dreams",
      icon: <Moon className="h-5 w-5" />,
      color: "indigo"
    },
    {
      id: "educational",
      label: "Educational",
      description: "Learn valuable lessons while enjoying a fun story",
      icon: <GraduationCap className="h-5 w-5" />,
      color: "green",
      premiumOnly: true
    },
    {
      id: "customized",
      label: "Fully Customized",
      description: "Complete creative freedom with advanced AI storytelling",
      icon: <Sparkles className="h-5 w-5" />,
      color: "amber",
      premiumOnly: true
    },
  ];
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-2">Story Theme</h3>
        <p className="text-gray-400">
          Choose a theme for your story to set the tone and style
        </p>
      </div>
      
      <RadioGroup 
        value={formData.theme || "adventure"} 
        onValueChange={handleThemeChange}
        className="grid gap-4"
      >
        {themeOptions.map((theme) => (
          <div key={theme.id}>
            <RadioGroupItem 
              value={theme.id} 
              id={`theme-${theme.id}`} 
              className="peer sr-only"
              disabled={theme.premiumOnly && !isSubscriber}
            />
            <Label
              htmlFor={`theme-${theme.id}`}
              className={cn(
                "flex items-center rounded-md border-2 border-gray-800 bg-gray-800/50 p-4 hover:bg-gray-800 hover:text-white peer-data-[state=checked]:border-indigo-500 peer-data-[state=checked]:text-indigo-300 cursor-pointer transition-all",
                theme.premiumOnly && !isSubscriber && "opacity-60 cursor-not-allowed"
              )}
            >
              <div className={`bg-${theme.color}-900/40 rounded-full p-2 mr-4 text-${theme.color}-400`}>
                {theme.icon}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center">
                  <h4 className="font-medium text-base mb-0.5">{theme.label}</h4>
                  {theme.premiumOnly && !isSubscriber && (
                    <Badge className="ml-2 bg-amber-900/60 text-amber-300">Premium</Badge>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  {theme.description}
                </p>
              </div>
            </Label>
          </div>
        ))}
      </RadioGroup>
      
      {/* Error message */}
      {errors.theme && (
        <Alert variant="destructive" className="bg-red-900/20 border-red-800">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-300">
            {errors.theme}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Theme description */}
      <Alert className="bg-gray-800 border-gray-700">
        <BookOpen className="h-4 w-4 text-gray-400" />
        <AlertDescription className="text-gray-300">
          The selected theme influences the story's style, setting, and vocabulary to create the perfect mood.
        </AlertDescription>
      </Alert>
    </div>
  );
}