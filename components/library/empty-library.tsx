"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus, Sparkles } from "lucide-react";

export function EmptyLibrary() {
  const router = useRouter();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center py-20 bg-gray-900/50 border border-gray-800 rounded-xl"
    >
      <div className="max-w-md mx-auto">
        <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-900/30 text-indigo-400">
          <BookOpen className="h-8 w-8" />
        </div>
        
        <h2 className="text-2xl font-semibold mb-3 text-white">
          Your story library is empty
        </h2>
        
        <p className="text-gray-400 mx-auto mb-8 max-w-md">
          Create your first magical bedtime story by uploading photos and 
          letting our AI transform them into an enchanting tale.
        </p>
        
        <Button
          onClick={() => router.push("/dashboard/create")}
          className="bg-indigo-600 hover:bg-indigo-700 px-6 text-white"
          size="lg"
        >
          <Plus className="mr-2 h-4 w-4 text-white" />
          Create Your First Story
        </Button>
        
        <div className="mt-10 max-w-sm mx-auto">
          <div className="flex items-center gap-2 mb-2 text-sm text-indigo-300">
            <Sparkles className="h-4 w-4" />
            <h3 className="font-medium">Here's how it works:</h3>
          </div>
          
          <ul className="text-left text-sm space-y-3">
            <li className="flex gap-2">
              <div className="flex-shrink-0 w-5 h-5 bg-indigo-900/50 rounded-full flex items-center justify-center text-xs text-indigo-300 font-medium">
                1
              </div>
              <span className="text-gray-300">
                Upload photos of your family, pets, or favorite toys
              </span>
            </li>
            <li className="flex gap-2">
              <div className="flex-shrink-0 w-5 h-5 bg-indigo-900/50 rounded-full flex items-center justify-center text-xs text-indigo-300 font-medium">
                2
              </div>
              <span className="text-gray-300">
                Add characters and choose story settings
              </span>
            </li>
            <li className="flex gap-2">
              <div className="flex-shrink-0 w-5 h-5 bg-indigo-900/50 rounded-full flex items-center justify-center text-xs text-indigo-300 font-medium">
                3
              </div>
              <span className="text-gray-300">
                Our AI transforms your photos into a personalized bedtime story
              </span>
            </li>
            <li className="flex gap-2">
              <div className="flex-shrink-0 w-5 h-5 bg-indigo-900/50 rounded-full flex items-center justify-center text-xs text-indigo-300 font-medium">
                4
              </div>
              <span className="text-gray-300">
                Play the story with narration and background music
              </span>
            </li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
}