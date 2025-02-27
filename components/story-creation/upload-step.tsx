"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  Plus, 
  AlertCircle 
} from "lucide-react";
import { motion } from "framer-motion";
import { StoryFormData } from "@/app/dashboard/create/page";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UploadStepProps {
  formData: StoryFormData;
  updateFormData: (field: keyof StoryFormData, value: any) => void;
  errors: { [key: string]: string };
}

export function UploadStep({ formData, updateFormData, errors }: UploadStepProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
          // You could add specific error handling for file size here
          console.warn(`File ${file.name} exceeds the 5MB size limit`);
        }
      } else {
        // You could add specific error handling for non-image files here
        console.warn(`File ${file.name} is not an image`);
      }
    }
    
    // Combine with existing images, but limit to 5 total
    const combinedFiles = [...formData.images, ...validFiles].slice(0, maxFiles);
    updateFormData('images', combinedFiles);
  };
  
  const removeImage = (index: number) => {
    const updatedImages = [...formData.images];
    updatedImages.splice(index, 1);
    updateFormData('images', updatedImages);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-2">Upload Photos</h3>
        <p className="text-gray-400">
          Upload up to 5 photos to create your story. We'll use these to generate a unique story.
        </p>
      </div>
      
      {/* Drag & Drop Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 transition-all ${
          dragActive 
            ? "border-indigo-500 bg-indigo-500/10" 
            : "border-gray-700 hover:border-gray-500"
        } ${formData.images.length > 0 ? 'pb-4' : 'h-48'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {formData.images.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="mb-4 rounded-full bg-gray-800 p-3">
              <Upload className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-300 mb-2">
              Drag and drop your photos here, or click to browse
            </p>
            <p className="text-xs text-gray-500">
              Supports: JPG, PNG, GIF (max 5MB each)
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
              className="mt-4 border-gray-700"
              onClick={() => fileInputRef.current?.click()}
            >
              Browse Files
            </Button>
          </div>
        ) : (
          // Images Preview
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
                  <Plus className="h-6 w-6 mb-1 text-gray-400" />
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
              <Button 
                variant="outline"
                size="sm"
                className="border-gray-700 text-xs"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="h-3 w-3 mr-1" />
                Browse More
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Error Message */}
      {errors.images && (
        <Alert variant="destructive" className="bg-red-900/20 border-red-800">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-300">
            {errors.images}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Tips */}
      <div className="bg-gray-800/50 rounded-lg p-4 text-sm">
        <h4 className="font-medium text-gray-300 mb-2">Tips for great stories:</h4>
        <ul className="list-disc list-inside text-gray-400 space-y-1">
          <li>Choose clear, well-lit photos</li>
          <li>Include photos with people, animals, or interesting objects</li>
          <li>Select photos that tell a sequence or have a theme</li>
          <li>Make sure main characters are visible in at least one photo</li>
        </ul>
      </div>
    </div>
  );
}