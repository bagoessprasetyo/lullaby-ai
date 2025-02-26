"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { DashboardNavbar } from "@/components/dashboard/navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { 
  ImagePlus, 
  Users, 
  Timer, 
  Music, 
  Languages, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft,
  Lock,
  AlertCircle,
  Mic
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UploadStep } from "@/components/story-creation/upload-step";
import { CharactersStep } from "@/components/story-creation/characters-step";
import { DurationStep } from "@/components/story-creation/duration-step";
import { BackgroundMusicStep } from "@/components/story-creation/background-music-step";
import { LanguageStep } from "@/components/story-creation/language-step";
import { VoiceSelectionStep } from "@/components/story-creation/voice-selection-step";
import { ReviewStep } from "@/components/story-creation/review-step";
import { 
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

// Types for our form data
export type StoryFormData = {
  images: File[];
  characters: { name: string; description: string }[];
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
  duration: "short",
  backgroundMusic: "calming",
  language: "english",
  voice: "ai-1",
  isGenerating: false
};

// Define steps
const steps = [
  { id: "upload", label: "Upload Photos", icon: <ImagePlus className="h-4 w-4" /> },
  { id: "characters", label: "Characters", icon: <Users className="h-4 w-4" /> },
  { id: "duration", label: "Duration", icon: <Timer className="h-4 w-4" /> },
  { id: "music", label: "Background Music", icon: <Music className="h-4 w-4" />, 
    requiresSubscription: true },
  { id: "language", label: "Language", icon: <Languages className="h-4 w-4" /> },
  { id: "voice", label: "Voice", icon: <Mic className="h-4 w-4" /> },
  { id: "review", label: "Review & Create", icon: <Sparkles className="h-4 w-4" /> }
];

export default function StoryCreationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<StoryFormData>(initialFormData);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubscriber, setIsSubscriber] = useState(false); // In reality, fetch this from user data

  useEffect(() => {
    // In a real app, you would check user subscription status here
    // For this demo, we'll just simulate it
    if (session?.user) {
      // Mock check - in reality, fetch from your database
      setIsSubscriber(false); // Set to true to simulate a subscriber
    }
  }, [session]);

  const validateStep = () => {
    const newErrors: { [key: string]: string } = {};
    
    switch (currentStep) {
      case 0: // Upload Photos
        if (formData.images.length === 0) {
          newErrors.images = "Please upload at least one image";
        } else if (formData.images.length > 5) {
          newErrors.images = "Maximum 5 images allowed";
        }
        break;
        
      case 1: // Characters
        const emptyCharacters = formData.characters.filter(
          (character) => character.name.trim() === ""
        );
        if (emptyCharacters.length > 0) {
          newErrors.characters = "Please fill in all character names";
        }
        break;
        
      case 3: // Background Music (for subscribers only)
        if (!isSubscriber) {
          // No validation needed, we'll show a message in the UI
        }
        break;
        
      case 4: // Duration
        if (formData.duration === "long" && !isSubscriber) {
          newErrors.duration = "Long stories are available for subscribers only";
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
      
      // In a real app, you would send the data to your API here
      setTimeout(() => {
        // Simulate API response
        router.push("/dashboard/stories/new-story");
      }, 3000);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <DashboardNavbar />
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create a Story</h1>
          <p className="text-gray-400">
            Transform your photos into magical bedtime stories
          </p>
        </div>
        
        {/* Progress Indicators */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-400">
              Step {currentStep + 1} of {steps.length}
            </div>
            {!isSubscriber && (
              <div className="flex items-center gap-1 text-xs text-amber-400">
                <AlertCircle className="h-3 w-3" />
                <span>Some features require subscription</span>
              </div>
            )}
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-1 bg-gray-800 rounded-full"></div>
            </div>
            <div className="relative flex justify-between">
              {steps.map((step, index) => (
                <div 
                  key={step.id} 
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all",
                    currentStep === index 
                      ? "border-indigo-500 bg-indigo-900/50 text-indigo-300" 
                      : index < currentStep 
                      ? "border-gray-500 bg-gray-700 text-gray-200" 
                      : "border-gray-700 bg-gray-800 text-gray-500"
                  )}
                >
                  {step.requiresSubscription && !isSubscriber ? (
                    <Lock className="h-3 w-3" />
                  ) : (
                    step.icon
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="my-8">
          <Card className="bg-gray-900 border-gray-800 p-6">
            {/* Step Content */}
            <div className="min-h-[400px]">
              {currentStep === 0 && (
                <UploadStep 
                  formData={formData}
                  updateFormData={updateFormData}
                  errors={errors}
                />
              )}
              
              {currentStep === 1 && (
                <CharactersStep 
                  formData={formData}
                  updateFormData={updateFormData}
                  errors={errors}
                />
              )}
              
              {currentStep === 2 && (
                <DurationStep 
                  formData={formData}
                  updateFormData={updateFormData}
                  errors={errors}
                  isSubscriber={isSubscriber}
                />
              )}
              
              {currentStep === 3 && (
                <BackgroundMusicStep 
                  formData={formData}
                  updateFormData={updateFormData}
                  errors={errors}
                  isSubscriber={isSubscriber}
                />
              )}
              
              {currentStep === 4 && (
                <LanguageStep 
                  formData={formData}
                  updateFormData={updateFormData}
                  errors={errors}
                />
              )}
              
              {currentStep === 5 && (
                <VoiceSelectionStep 
                  formData={formData}
                  updateFormData={updateFormData}
                  errors={errors}
                  isSubscriber={isSubscriber}
                />
              )}
              
              {currentStep === 6 && (
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
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {formData.isGenerating ? (
                    <>
                      <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Generating Story...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Story
                    </>
                  )}
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}