// app/dashboard/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { DashboardNavbar } from "@/components/dashboard/navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ImagePlus, 
  Users, 
  Mic, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UploadAndThemeStep } from "@/components/story-creation/upload-and-theme-step";
import { StoryDetailsStep } from "@/components/story-creation/story-details-step";
import { NarrationSettingsStep } from "@/components/story-creation/narration-settings-step";
// Import our enhanced review step - we're directly replacing the old one
import { ReviewStep } from "@/components/story-creation/review-step";
import { AsyncStoryGenerator } from "@/components/story-creation/async-generator";
import { useSubscription } from "@/hooks/useSubscription";
import { QuickStartTemplates } from "@/components/story-creation/quick-start-templates";

// Types for our form data
export type StoryFormData = {
  images: File[];
  characters: { name: string; description: string }[];
  theme: string;
  duration: "short" | "medium" | "long";
  backgroundMusic: string;
  language: string;
  voice: string;
  isGenerating: boolean;
};

// Initial form data
const initialFormData: StoryFormData = {
  images: [],
  characters: [{ name: "", description: "" }],
  theme: "adventure",
  duration: "short",
  backgroundMusic: "calming",
  language: "english",
  voice: "ai-1",
  isGenerating: false
};

// Define the new streamlined steps
const steps = [
  { 
    id: "upload-theme", 
    label: "Upload & Theme", 
    icon: <ImagePlus className="h-4 w-4" />,
    description: "Upload photos and select a theme"
  },
  { 
    id: "story-details", 
    label: "Story Details", 
    icon: <Users className="h-4 w-4" />,
    description: "Define characters and story length"
  },
  { 
    id: "narration", 
    label: "Narration Settings", 
    icon: <Mic className="h-4 w-4" />,
    description: "Choose language, voice, and music"
  },
  { 
    id: "review", 
    label: "Review & Create", 
    icon: <Sparkles className="h-4 w-4" />,
    description: "Review your story and generate"
  }
];

export default function StoryCreationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<StoryFormData>(initialFormData);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // Use our subscription hook that uses server action
  const { features, isSubscriber, isLoading: subscriptionLoading } = useSubscription();
  
  // Simplified validation that handles all fields in each step
  const validateStep = () => {
    const newErrors: { [key: string]: string } = {};
    
    switch (currentStep) {
      case 0: // Upload & Theme
        if (formData.images.length === 0) {
          newErrors.images = "Please upload at least one image";
        } else if (formData.images.length > 5) {
          newErrors.images = "Maximum 5 images allowed";
        }
        
        if (!formData.theme) {
          newErrors.theme = "Please select a theme for your story";
        }
        
        // Check premium themes
        if (features && 
            (formData.theme === "educational" || formData.theme === "customized") && 
            !features.features.educational_themes) {
          newErrors.theme = "Educational and customized themes require a premium subscription";
        }
        break;
        
      case 1: // Story Details (Characters & Duration)
        const emptyCharacters = formData.characters.filter(
          (character) => character.name.trim() === ""
        );
        if (emptyCharacters.length > 0) {
          newErrors.characters = "Please fill in all character names";
        }
        
        if (features && 
            formData.duration === "long" && 
            !features.features.long_stories) {
          newErrors.duration = "Long stories are available for subscribers only";
        }
        break;
        
      case 2: // Narration Settings (Language, Voice, Music)
        if (features && 
            formData.backgroundMusic && 
            !features.features.background_music) {
          newErrors.backgroundMusic = "Background music requires a premium subscription";
        }
        
        if (features && 
            formData.voice && 
            formData.voice.startsWith("custom-") && 
            !features.features.custom_voices) {
          newErrors.voice = "Custom voices require a premium subscription";
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const updateFormData = (field: keyof StoryFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleGenerateStory = () => {
    if (validateStep()) {
      // Set generating state
      updateFormData("isGenerating", true);
    }
  };
  
  const handleResetGeneration = () => {
    updateFormData("isGenerating", false);
  };

  // Show loading state while session or subscription data is loading
  if (status === "loading" || subscriptionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Determine step progress percentage
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  return (
    <>
      <DashboardNavbar />
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Create a Story</h1>
            <p className="text-gray-400">
              Transform your photos into magical bedtime stories
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <QuickStartTemplates 
              updateFormData={updateFormData}
              setFormData={setFormData}
              initialFormData={initialFormData}
            />
          </div>
        </div>
        
        {!formData.isGenerating && (
          <>
            {/* Progress Indicators */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-400 flex items-center gap-2">
                  <span className="font-medium text-white">{steps[currentStep].label}</span>
                  <span>• {Math.round(progressPercentage)}% complete</span>
                </div>
                {!isSubscriber && (
                  <div className="flex items-center gap-1 text-xs text-amber-400">
                    <AlertCircle className="h-3 w-3" />
                    <span>Some features require subscription</span>
                  </div>
                )}
              </div>
              
              {/* Progress bar */}
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              
              {/* Step circles */}
              <div className="relative flex justify-between mt-2">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex flex-col items-center">
                    <div 
                      className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all",
                        currentStep === index 
                          ? "border-indigo-500 bg-indigo-900/50 text-indigo-300" 
                          : index < currentStep 
                          ? "border-gray-500 bg-gray-700 text-gray-200" 
                          : "border-gray-700 bg-gray-800 text-gray-500"
                      )}
                    >
                      {step.icon}
                    </div>
                    <span className="text-xs mt-1 text-gray-400 hidden md:block">
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        
        <div className="my-8">
          <Card className="bg-gray-900 border-gray-800 p-6">
            {formData.isGenerating ? (
              <AsyncStoryGenerator 
                formData={formData}
                onReset={handleResetGeneration}
              />
            ) : (
              <>
                {/* Step Content */}
                <div className="min-h-[400px]">
                  {currentStep === 0 && (
                    <UploadAndThemeStep 
                      formData={formData}
                      updateFormData={updateFormData}
                      errors={errors}
                      isSubscriber={isSubscriber}
                    />
                  )}
                  
                  {currentStep === 1 && (
                    <StoryDetailsStep 
                      formData={formData}
                      updateFormData={updateFormData}
                      errors={errors}
                      isSubscriber={isSubscriber}
                    />
                  )}
                  
                  {currentStep === 2 && (
                    <NarrationSettingsStep 
                      formData={formData}
                      updateFormData={updateFormData}
                      errors={errors}
                      isSubscriber={isSubscriber}
                    />
                  )}
                  
                  {currentStep === 3 && (
                    <ReviewStep 
                      formData={formData}
                      updateFormData={updateFormData}
                      isSubscriber={isSubscriber}
                      onGenerateStory={handleGenerateStory}
                    />
                  )}
                </div>
                
                {/* Navigation Buttons */}
                <div className="flex items-center justify-between mt-8">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 0 || formData.isGenerating}
                    className="border-gray-700"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                  
                  {currentStep < steps.length - 1 ? (
                    <Button 
                      onClick={handleNext}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      Next
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleGenerateStory}
                      disabled={formData.isGenerating}
                      className="text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      {formData.isGenerating ? (
                        <>
                          <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Generating Story...
                        </>
                      ) : (
                        <>
                          <Sparkles className="text-white mr-2 h-4 w-4" />
                          Generate Story
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}