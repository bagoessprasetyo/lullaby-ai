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
  AlertCircle,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UploadAndThemeStep } from "@/components/story-creation/upload-and-theme-step";
import { StoryDetailsStep } from "@/components/story-creation/story-details-step";
import { NarrationSettingsStep } from "@/components/story-creation/narration-settings-step";
// Import our enhanced review step - we're directly replacing the old one
import { ReviewStep } from "@/components/story-creation/review-step";
import { EnhancedStoryGenerator } from "@/components/story-creation/async-generator";
import { useSubscription } from "@/hooks/useSubscription";
import { QuickStartTemplates } from "@/components/story-creation/quick-start-templates";
import { motion } from "framer-motion";

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
  const [generationTrigger, setGenerationTrigger] = useState(0);
  
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
      // Trigger generation after a short delay to ensure component has mounted
      setTimeout(() => {
        setGenerationTrigger(prev => prev + 1);
      }, 200);
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
            {/* Progress Indicators - Enhanced for Mobile */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                <div className="flex items-center">
                  <motion.div 
                    key={currentStep}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-2"
                  >
                    <div className="bg-indigo-900/40 p-1.5 rounded-full text-indigo-300">
                      {steps[currentStep].icon}
                    </div>
                    <span className="font-medium text-white text-base">{steps[currentStep].label}</span>
                  </motion.div>
                  <span className="text-xs text-gray-400 ml-3">Step {currentStep + 1} of {steps.length}</span>
                </div>
                
                {!isSubscriber && (
                  <div className="flex items-center gap-1 text-xs text-amber-400 mt-1 sm:mt-0 px-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    <span>Premium features available with subscription</span>
                  </div>
                )}
              </div>
              
              {/* Progress bar */}
              <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full"
                  initial={{ width: `${((currentStep) / steps.length) * 100}%` }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />
              </div>
              
              {/* Interactive Step circles */}
              <div className="relative flex justify-between mt-4 items-center">
                {/* Connecting line */}
                <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-800 -z-10"></div>
                
                {steps.map((step, index) => (
                  <div key={step.id} className="flex flex-col items-center">
                    <motion.div 
                      whileHover={index <= currentStep ? { scale: 1.1 } : {}}
                      className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all cursor-pointer",
                        currentStep === index 
                          ? "border-indigo-500 bg-indigo-900/60 text-indigo-300 shadow-md shadow-indigo-800/20" 
                          : index < currentStep 
                          ? "border-indigo-400 bg-indigo-800/50 text-indigo-300" 
                          : "border-gray-700 bg-gray-800 text-gray-500"
                      )}
                      onClick={() => {
                        // Only allow moving to steps that are completed or current
                        if (index <= currentStep) {
                          setCurrentStep(index);
                        }
                      }}
                    >
                      {index < currentStep ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        step.icon
                      )}
                    </motion.div>
                    
                    <span className={cn(
                      "text-xs mt-2 transition-colors",
                      currentStep === index
                        ? "text-indigo-300 font-medium"
                        : index < currentStep
                        ? "text-gray-300"
                        : "text-gray-500"
                    )}>
                      {step.label}
                    </span>
                    
                    {/* Step description - only visible on desktop */}
                    <span className="text-xs text-gray-500 mt-1 hidden md:block max-w-[100px] text-center">
                      {step.description}
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
              <EnhancedStoryGenerator 
                formData={formData}
                onReset={handleResetGeneration}
                autoGenerate={false}
                triggerGeneration={generationTrigger}
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
                
                {/* Navigation Buttons - Enhanced for Mobile */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900/90 backdrop-blur-sm border-t border-gray-800 flex items-center justify-between md:static md:bg-transparent md:backdrop-blur-none md:border-0 md:mt-8 md:p-0 z-10">
                  <div className="w-1/2 pr-2">
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={currentStep === 0 || formData.isGenerating}
                      className="border-gray-700 w-full h-12 md:h-auto md:w-auto flex items-center justify-center"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      <span className="block">Previous</span>
                    </Button>
                  </div>
                  
                  <div className="w-1/2 pl-2">
                    {currentStep < steps.length - 1 ? (
                      <Button 
                        onClick={handleNext}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white w-full h-12 md:h-auto md:w-auto flex items-center justify-center"
                      >
                        <span className="block">Next</span>
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleGenerateStory}
                        disabled={formData.isGenerating}
                        className="text-white bg-indigo-600 hover:bg-indigo-700 w-full h-12 md:h-auto md:w-auto flex items-center justify-center"
                      >
                        {formData.isGenerating ? (
                          <>
                            <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            <span className="block">Generating...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="text-white mr-2 h-4 w-4" />
                            <span className="block">Generate</span>
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Add spacing at the bottom to prevent content from being hidden behind the fixed navigation on mobile */}
                <div className="h-20 md:hidden"></div>
              </>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}