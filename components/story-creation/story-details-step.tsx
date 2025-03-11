// components/story-creation/story-details-step.tsx
"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Trash2,
  AlertCircle,
  UserIcon,
  Clock,
  Timer,
  Sparkles,
  Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { StoryFormData } from "@/app/dashboard/create/page";
import { useUpgradeModal } from "@/hooks/useUpgradeModal";
import { cn } from "@/lib/utils";
import { LivePreview } from "./live-preview";

interface StoryDetailsStepProps {
  formData: StoryFormData;
  updateFormData: (field: keyof StoryFormData, value: any) => void;
  errors: { [key: string]: string };
  isSubscriber: boolean;
}

export function StoryDetailsStep({ 
  formData, 
  updateFormData, 
  errors,
  isSubscriber 
}: StoryDetailsStepProps) {
  const { openModal } = useUpgradeModal();
  
  // Character methods
  const addCharacter = () => {
    if (formData.characters.length < 5) {
      const updatedCharacters = [
        ...formData.characters,
        { name: "", description: "" }
      ];
      updateFormData("characters", updatedCharacters);
    }
  };

  const removeCharacter = (index: number) => {
    if (formData.characters.length > 1) {
      const updatedCharacters = [...formData.characters];
      updatedCharacters.splice(index, 1);
      updateFormData("characters", updatedCharacters);
    }
  };

  const updateCharacter = (index: number, field: "name" | "description", value: string) => {
    const updatedCharacters = [...formData.characters];
    updatedCharacters[index][field] = value;
    updateFormData("characters", updatedCharacters);
  };
  
  // Duration methods
  const handleDurationChange = (value: "short" | "medium" | "long") => {
    if (value === "long" && !isSubscriber) {
      openModal("Story Duration");
      return;
    }
    updateFormData("duration", value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-2">Story Details</h3>
        <p className="text-gray-400">
          Define your characters and select the story length
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Characters Section */}
        <div className="space-y-4 md:border-r md:border-gray-800 md:pr-5">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-white text-lg flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-indigo-400" />
              Characters
            </h4>
            
            {formData.characters.length < 5 && (
              <Button
                variant="outline"
                size="sm"
                onClick={addCharacter}
                className="border-dashed border-gray-700 hover:border-indigo-500 hover:bg-indigo-900/20 hover:text-indigo-400"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Character
              </Button>
            )}
          </div>
          
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {formData.characters.map((character, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                  transition={{ duration: 0.2 }}
                  className="bg-gray-800/50 rounded-lg border border-gray-700 p-3"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <div className="bg-indigo-900/40 rounded-full p-1">
                        <UserIcon className="h-3.5 w-3.5 text-indigo-400" />
                      </div>
                      <span className="text-sm font-medium text-gray-300">
                        Character {index + 1}
                      </span>
                    </div>
                    
                    {formData.characters.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-gray-500 hover:text-red-400 hover:bg-red-900/20"
                        onClick={() => removeCharacter(index)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label htmlFor={`name-${index}`} className="text-sm text-gray-300">
                        Name
                      </Label>
                      <Input
                        id={`name-${index}`}
                        value={character.name}
                        onChange={(e) => updateCharacter(index, "name", e.target.value)}
                        placeholder="Enter character name"
                        className="bg-gray-900 border-gray-700 h-8 text-sm"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor={`description-${index}`} className="text-sm text-gray-300">
                        Description (Optional)
                      </Label>
                      <Textarea
                        id={`description-${index}`}
                        value={character.description}
                        onChange={(e) => updateCharacter(index, "description", e.target.value)}
                        placeholder="Describe the character briefly"
                        className="bg-gray-900 border-gray-700 min-h-[60px] text-sm"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          {errors.characters && (
            <Alert variant="destructive" className="bg-red-900/20 border-red-800">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">
                {errors.characters}
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        {/* Duration Section */}
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-white text-lg flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-400" />
              Story Duration
            </h4>
            <p className="text-sm text-gray-400 mt-1">
              Choose how long you'd like your story to be
            </p>
          </div>
          
          <RadioGroup 
            value={formData.duration} 
            onValueChange={handleDurationChange}
            className="space-y-3"
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
                className="flex items-start p-3 rounded-md border-2 border-gray-800 bg-gray-800/50 hover:bg-gray-800 hover:text-white peer-data-[state=checked]:border-indigo-500 peer-data-[state=checked]:bg-indigo-900/20 peer-data-[state=checked]:text-indigo-300 cursor-pointer transition-all"
              >
                <div className="bg-blue-900/40 rounded-full p-2 mr-3">
                  <Clock className="h-4 w-4 text-blue-400" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-base">Short Story</h4>
                    <Badge className="bg-blue-900/50 text-blue-300 hover:bg-blue-900/50">
                      1 min
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Quick bedtime story for younger children
                  </p>
                </div>
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
                className="flex items-start p-3 rounded-md border-2 border-gray-800 bg-gray-800/50 hover:bg-gray-800 hover:text-white peer-data-[state=checked]:border-indigo-500 peer-data-[state=checked]:bg-indigo-900/20 peer-data-[state=checked]:text-indigo-300 cursor-pointer transition-all"
              >
                <div className="bg-indigo-900/40 rounded-full p-2 mr-3">
                  <Timer className="h-4 w-4 text-indigo-400" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-base">Medium Story</h4>
                    <Badge className="bg-indigo-900/50 text-indigo-300 hover:bg-indigo-900/50">
                      3 mins
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Balanced story with more details and development
                  </p>
                </div>
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
                className={cn(
                  "flex items-start p-3 rounded-md border-2 border-gray-800 bg-gray-800/50 hover:bg-gray-800 hover:text-white peer-data-[state=checked]:border-indigo-500 peer-data-[state=checked]:bg-indigo-900/20 peer-data-[state=checked]:text-indigo-300 transition-all",
                  !isSubscriber ? "opacity-75 cursor-not-allowed" : "cursor-pointer"
                )}
              >
                <div className="bg-purple-900/40 rounded-full p-2 mr-3">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-base">
                      Long Story
                      {!isSubscriber && " (Premium)"}
                    </h4>
                    <div className="flex gap-1 items-center">
                      {!isSubscriber && (
                        <Lock className="h-3 w-3 text-amber-400" />
                      )}
                      <Badge className="bg-purple-900/50 text-purple-300 hover:bg-purple-900/50">
                        5+ mins
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Immersive story with rich details and deeper plot
                  </p>
                </div>
              </Label>
            </div>
          </RadioGroup>
          
          {errors.duration && (
            <Alert variant="destructive" className="bg-red-900/20 border-red-800">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">
                {errors.duration}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Premium Note */}
          {!isSubscriber && (
            <Alert className="bg-amber-900/20 border-amber-800">
              <AlertCircle className="h-4 w-4 text-amber-400" />
              <AlertDescription className="text-amber-300">
                Long stories (5+ minutes) are available for subscribers only. 
                <Button 
                  onClick={() => openModal("Story Duration")} 
                  variant="link" 
                  className="text-amber-400 h-auto p-0 ml-1"
                >
                  Upgrade
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
      
      {/* Live Preview */}
      {formData.images.length > 0 && formData.characters[0]?.name && (
        <div className="mt-5">
          <LivePreview formData={formData} className="mb-4" />
        </div>
      )}
      
      {/* Character Tips */}
      <div className="bg-gray-800/50 rounded-lg p-3 text-sm mt-3">
        <h4 className="font-medium text-gray-300 mb-1 text-sm">Tips:</h4>
        <ul className="list-disc list-inside text-gray-400 space-y-0.5 text-xs">
          <li>Add details to make characters more vivid and relatable</li>
          <li>Consider adding character relationships to create a better story</li>
          <li>Shorter stories work best for younger children with shorter attention spans</li>
        </ul>
      </div>
    </div>
  );
}