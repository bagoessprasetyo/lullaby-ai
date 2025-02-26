"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  AlertCircle,
  Globe,
  Languages
} from "lucide-react";
import { StoryFormData } from "@/app/dashboard/create/page";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface LanguageStepProps {
  formData: StoryFormData;
  updateFormData: (field: keyof StoryFormData, value: any) => void;
  errors: { [key: string]: string };
}

type LanguageOption = {
  id: string;
  label: string;
  nativeName: string;
  flag: string;
};

export function LanguageStep({ 
  formData, 
  updateFormData, 
  errors 
}: LanguageStepProps) {
  const handleLanguageChange = (value: string) => {
    updateFormData("language", value);
  };
  
  const languageOptions: LanguageOption[] = [
    {
      id: "english",
      label: "English",
      nativeName: "English",
      flag: "🇺🇸"
    },
    {
      id: "french",
      label: "French",
      nativeName: "Français",
      flag: "🇫🇷"
    },
    {
      id: "japanese",
      label: "Japanese",
      nativeName: "日本語",
      flag: "🇯🇵"
    },
    {
      id: "indonesian",
      label: "Indonesian",
      nativeName: "Bahasa Indonesia",
      flag: "🇮🇩"
    }
  ];
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-2">Story Language</h3>
        <p className="text-gray-400">
          Choose the language for your story narration
        </p>
      </div>
      
      <RadioGroup 
        value={formData.language} 
        onValueChange={handleLanguageChange}
        className="grid gap-4 md:grid-cols-2"
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
      <Alert className="bg-gray-800 border-gray-700">
        <Globe className="h-4 w-4 text-gray-400" />
        <AlertDescription className="text-gray-300">
          The story text and narration will be generated in your selected language.
        </AlertDescription>
      </Alert>
      
      {/* Error Message */}
      {errors.language && (
        <Alert variant="destructive" className="bg-red-900/20 border-red-800">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-300">
            {errors.language}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}