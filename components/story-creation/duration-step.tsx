"use client";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  AlertCircle,
  Clock,
  Lock,
  Timer,
  Sparkles
} from "lucide-react";
import { StoryFormData } from "@/app/dashboard/create/page";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useUpgradeModal } from "@/hooks/useUpgradeModal";

interface DurationStepProps {
  formData: StoryFormData;
  updateFormData: (field: keyof StoryFormData, value: any) => void;
  errors: { [key: string]: string };
  isSubscriber: boolean;
}

export function DurationStep({ 
  formData, 
  updateFormData, 
  errors,
  isSubscriber 
}: DurationStepProps) {
  const handleDurationChange = (value: "short" | "medium" | "long") => {
    updateFormData("duration", value);
  };
  
  // Fix: Only call useUpgradeModal once
  const { openModal, isOpen } = useUpgradeModal();
  
  // You can log the state if needed
  console.log("Modal state:", { isOpen });
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-2">Story Duration</h3>
        <p className="text-gray-400">
          Choose how long you'd like your story to be
        </p>
      </div>
      
      <RadioGroup 
        value={formData.duration} 
        onValueChange={handleDurationChange}
        className="grid gap-4 md:grid-cols-3"
      >
        {/* Short Story Option */}
        <div>
          <RadioGroupItem 
            value="short" 
            id="duration-short" 
            className="peer sr-only"
          />
          <Label
            htmlFor="duration-short"
            className="flex flex-col h-full rounded-md border-2 border-gray-800 bg-gray-800/50 p-4 hover:bg-gray-800 hover:text-white peer-data-[state=checked]:border-indigo-500 peer-data-[state=checked]:bg-indigo-900/20 peer-data-[state=checked]:text-indigo-300 cursor-pointer transition-all"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="bg-blue-900/40 rounded-full p-2">
                <Clock className="h-5 w-5 text-blue-400" />
              </div>
              <Badge className="bg-blue-900/50 text-blue-300 hover:bg-blue-900/50">
                1 min
              </Badge>
            </div>
            <h4 className="font-medium text-base mb-1">Short Story</h4>
            <p className="text-xs text-gray-400">
              A quick bedtime story perfect for busy nights or younger children with shorter attention spans.
            </p>
          </Label>
        </div>
        
        {/* Medium Story Option */}
        <div>
          <RadioGroupItem 
            value="medium" 
            id="duration-medium" 
            className="peer sr-only"
          />
          <Label
            htmlFor="duration-medium"
            className="flex flex-col h-full rounded-md border-2 border-gray-800 bg-gray-800/50 p-4 hover:bg-gray-800 hover:text-white peer-data-[state=checked]:border-indigo-500 peer-data-[state=checked]:bg-indigo-900/20 peer-data-[state=checked]:text-indigo-300 cursor-pointer transition-all"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="bg-indigo-900/40 rounded-full p-2">
                <Timer className="h-5 w-5 text-indigo-400" />
              </div>
              <Badge className="bg-indigo-900/50 text-indigo-300 hover:bg-indigo-900/50">
                3 mins
              </Badge>
            </div>
            <h4 className="font-medium text-base mb-1">Medium Story</h4>
            <p className="text-xs text-gray-400">
              A balanced story with more details and character development. Ideal for most bedtime routines.
            </p>
          </Label>
        </div>
        
        {/* Long Story Option */}
        <div>
          <RadioGroupItem 
            value="long" 
            id="duration-long" 
            className="peer sr-only"
            disabled={!isSubscriber}
          />
          <Label
            htmlFor="duration-long"
            className={`flex flex-col h-full rounded-md border-2 border-gray-800 bg-gray-800/50 p-4 hover:bg-gray-800 hover:text-white peer-data-[state=checked]:border-indigo-500 peer-data-[state=checked]:bg-indigo-900/20 peer-data-[state=checked]:text-indigo-300 transition-all ${!isSubscriber ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="bg-purple-900/40 rounded-full p-2">
                <Sparkles className="h-5 w-5 text-purple-400" />
              </div>
              <div className="flex gap-2 items-center">
                {!isSubscriber && (
                  <Lock className="h-3 w-3 text-amber-400" />
                )}
                <Badge className="bg-purple-900/50 text-purple-300 hover:bg-purple-900/50">
                  5+ mins
                </Badge>
              </div>
            </div>
            <h4 className="font-medium text-base mb-1">
              Long Story
              {!isSubscriber && " (Premium)"}
            </h4>
            <p className="text-xs text-gray-400">
              An immersive story with rich details, deeper plot, and character development for a complete bedtime experience.
            </p>
          </Label>
        </div>
      </RadioGroup>
      
      {/* Error Message */}
      {errors.duration && (
        <Alert variant="destructive" className="bg-red-900/20 border-red-800">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-300">
            {errors.duration}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Subscription Note */}
      {!isSubscriber && (
        <Alert className="bg-amber-900/20 border-amber-800">
          <AlertCircle className="h-4 w-4 text-amber-400" />
          <AlertDescription className="text-amber-300">
            Long stories (5+ minutes) are available for subscribers only. 
            <Button onClick={() => openModal("Story Duration")} variant="link" className="text-amber-400 h-auto p-0 ml-1">
              Upgrade to Premium
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}