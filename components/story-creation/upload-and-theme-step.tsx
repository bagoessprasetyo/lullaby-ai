// components/story-creation/upload-and-theme-step.tsx
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  Plus, 
  AlertCircle,
  BookOpen, 
  Rocket, 
  Wand2, 
  GraduationCap, 
  Moon, 
  Sparkles 
} from "lucide-react";
import { motion } from "framer-motion";
import { StoryFormData } from "@/app/dashboard/create/page";
import { useUpgradeModal } from "@/hooks/useUpgradeModal";
import { ImageAnalyzer } from "./image-analyzer";

interface UploadAndThemeStepProps {
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

export function UploadAndThemeStep({ 
  formData, 
  updateFormData, 
  errors,
  isSubscriber 
}: UploadAndThemeStepProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { openModal } = useUpgradeModal();
  
  // Handle theme selection
  const handleThemeChange = (value: string) => {
    // For premium-only themes, open upgrade modal if not a subscriber
    if ((value === "educational" || value === "customized") && !isSubscriber) {
      openModal("Story Themes");
      return;
    }
    
    updateFormData("theme", value);
  };
  
  // Theme options
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
  
  // File upload handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };
  
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };
  
  const handleFiles = (files: FileList) => {
    const validFiles: File[] = [];
    const maxFiles = 5;
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    // Convert FileList to array to use some array methods
    const fileArray = Array.from(files);
    
    // Filter valid image files and limit to 5 files
    for (let i = 0; i < Math.min(fileArray.length, maxFiles); i++) {
      const file = fileArray[i];
      
      // Check if file is an image
      if (file.type.startsWith('image/')) {
        // Check file size
        if (file.size <= maxSize) {
          validFiles.push(file);
        } else {
          console.warn(`File ${file.name} exceeds the 5MB size limit`);
        }
      } else {
        console.warn(`File ${file.name} is not an image`);
      }
    }
    
    // Combine with existing images, but limit to 5 total
    const combinedFiles = [...formData.images, ...validFiles].slice(0, maxFiles);
    updateFormData('images', combinedFiles);
    
    // Automatically suggest a theme based on the images
    // This is a placeholder - in a real app, you'd use AI to analyze images
    if (!formData.theme && validFiles.length > 0) {
      updateFormData('theme', 'adventure');
    }
  };
  
  const removeImage = (index: number) => {
    const updatedImages = [...formData.images];
    updatedImages.splice(index, 1);
    updateFormData('images', updatedImages);
  };

  // Suggest a theme based on images (placeholder logic)
  const suggestedTheme = formData.images.length > 0 ? "adventure" : null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-2">Upload Photos & Choose Theme</h3>
        <p className="text-gray-400">
          Upload up to 5 photos and select a theme for your story
        </p>
      </div>
      
      {/* Drag & Drop Area - taking less space now */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-all ${
          dragActive 
            ? "border-indigo-500 bg-indigo-500/10" 
            : "border-gray-700 hover:border-gray-500"
        } ${formData.images.length > 0 ? 'h-auto' : 'h-40'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {formData.images.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="mb-2 rounded-full bg-gray-800 p-2">
              <Upload className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-sm text-gray-300 mb-1">
              Drag photos here, or click to browse
            </p>
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileInput}
            />
            <Button 
              variant="outline"
              className="mt-2 border-gray-700 text-sm py-1"
              onClick={() => fileInputRef.current?.click()}
            >
              Browse Files
            </Button>
          </div>
        ) : (
          // Images Preview
          <div className="space-y-3">
            <div className="grid grid-cols-5 gap-2">
              {formData.images.map((image, index) => (
                <motion.div 
                  key={`${image.name}-${index}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative group"
                >
                  <div className="aspect-square rounded-lg overflow-hidden border border-gray-700 bg-gray-800">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Uploaded image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </motion.div>
              ))}
              {formData.images.length < 5 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="aspect-square rounded-lg flex flex-col items-center justify-center border border-dashed border-gray-700 bg-gray-800 hover:bg-gray-700 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Plus className="h-5 w-5 mb-1 text-gray-400" />
                  <span className="text-xs text-gray-500">Add More</span>
                </motion.button>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {formData.images.length} of 5 photos selected
              </p>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileInput}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Upload Error Message */}
      {errors.images && (
        <Alert variant="destructive" className="bg-red-900/20 border-red-800">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-300">
            {errors.images}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Theme Suggestion - only show if we have images */}
      {suggestedTheme && !formData.theme && (
        <Alert className="bg-indigo-900/20 border-indigo-800">
          <Sparkles className="h-4 w-4 text-indigo-400" />
          <AlertDescription className="text-indigo-300">
            Based on your photos, we suggest an <strong>Adventure</strong> theme!
          </AlertDescription>
        </Alert>
      )}
      {formData.images.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-800">
            <ImageAnalyzer
              images={formData.images}
              formData={formData}
              updateFormData={updateFormData}
              isSubscriber={isSubscriber}
            />
          </div>
      )}
      {/* Theme Selection */}
      <div className="mt-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-white mb-1">Story Theme</h3>
            <p className="text-sm text-gray-400">
              Choose a theme to set the tone and style
            </p>
          </div>
        </div>
        
        <RadioGroup 
          value={formData.theme || "adventure"} 
          onValueChange={handleThemeChange}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
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
                  "flex flex-col h-full rounded-md border-2 border-gray-800 bg-gray-800/50 p-3 hover:bg-gray-800 hover:text-white peer-data-[state=checked]:border-indigo-500 peer-data-[state=checked]:text-indigo-300 cursor-pointer transition-all",
                  theme.premiumOnly && !isSubscriber && "opacity-60 cursor-not-allowed"
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className={`bg-${theme.color}-900/40 rounded-full p-2 text-${theme.color}-400`}>
                    {theme.icon}
                  </div>
                  
                  {theme.premiumOnly && !isSubscriber && (
                    <Badge className="bg-amber-900/60 text-amber-300">Premium</Badge>
                  )}
                </div>
                <h4 className="font-medium text-base mb-1">{theme.label}</h4>
                <p className="text-xs text-gray-400">
                  {theme.description}
                </p>
              </Label>
            </div>
          ))}
        </RadioGroup>
        
        {/* Theme error message */}
        {errors.theme && (
          <Alert variant="destructive" className="bg-red-900/20 border-red-800 mt-3">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300">
              {errors.theme}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}