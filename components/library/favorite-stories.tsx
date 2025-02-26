"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { BookMarked, ArrowLeft } from "lucide-react";

export function FavoriteStories() {
  const router = useRouter();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center py-20 bg-gray-900/50 border border-gray-800 rounded-xl"
    >
      <div className="max-w-md mx-auto">
        <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-900/30 text-amber-400">
          <BookMarked className="h-8 w-8" />
        </div>
        
        <h2 className="text-2xl font-semibold mb-3 text-white">
          No favorite stories yet
        </h2>
        
        <p className="text-gray-400 mx-auto mb-8 max-w-md">
          Mark your favorite stories with the star icon to easily find them later.
          Favorite stories appear here for quick access.
        </p>
        
        <Button
          onClick={() => router.push("/dashboard/library")}
          variant="outline"
          className="border-gray-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to All Stories
        </Button>
        
        <div className="mt-10 bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-center mx-auto max-w-sm">
          <h4 className="text-white font-medium mb-1">How to favorite stories:</h4>
          <ul className="text-sm text-gray-400 text-left space-y-2 mt-2">
            <li className="flex items-center gap-2">
              <div className="flex-shrink-0 w-5 h-5 bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-xs text-white">1</span>
              </div>
              <span>Open any story from your library</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="flex-shrink-0 w-5 h-5 bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-xs text-white">2</span>
              </div>
              <span>Click the three-dot menu on a story card</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="flex-shrink-0 w-5 h-5 bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-xs text-white">3</span>
              </div>
              <span>Select "Add to Favorites"</span>
            </li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
}