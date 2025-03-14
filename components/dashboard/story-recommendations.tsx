"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { Play, Sparkles, Clock, RefreshCw, ChevronRight, Moon, Sun, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Story } from "@/types/story";
import { Skeleton } from "@/components/ui/skeleton";

interface Recommendation {
  story: Story;
  reason: string;
  confidence: number;
}

interface StoryRecommendationsProps {
  userId: string;
  stories: Story[];
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
}

// Helper function to get time of day
const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' | 'night' => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

// Helper function to get time-appropriate theme
const getTimeAppropriateTheme = (timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'): string => {
  switch (timeOfDay) {
    case 'morning': return 'educational';
    case 'afternoon': return 'adventure';
    case 'evening': return 'fantasy';
    case 'night': return 'bedtime';
    default: return 'adventure';
  }
};

// Helper to get icon for recommendation reason
const getReasonIcon = (reason: string) => {
  if (reason.includes('morning')) return <Sun className="h-4 w-4 text-yellow-400" />;
  if (reason.includes('evening')) return <Moon className="h-4 w-4 text-indigo-400" />;
  if (reason.includes('bedtime')) return <Moon className="h-4 w-4 text-blue-400" />;
  if (reason.includes('favorites')) return <Sparkles className="h-4 w-4 text-pink-400" />;
  if (reason.includes('Recently')) return <Clock className="h-4 w-4 text-green-400" />;
  if (reason.includes('theme')) return <Sparkles className="h-4 w-4 text-purple-400" />;
  return <Zap className="h-4 w-4 text-indigo-400" />;
};

export function StoryRecommendations({
  userId,
  stories,
  isLoading = false,
  onRefresh,
  className = ""
}: StoryRecommendationsProps) {
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'night'>('morning');
  
  // Generate recommendations whenever stories change
  useEffect(() => {
    if (stories.length === 0) return;
    
    const currentTimeOfDay = getTimeOfDay();
    setTimeOfDay(currentTimeOfDay);
    
    // In a real implementation, this would be an API call to the backend
    // that uses the user's history and preferences to generate recommendations
    generateRecommendations(stories, currentTimeOfDay);
  }, [stories]);
  
  // Function to generate personalized recommendations
  const generateRecommendations = (allStories: Story[], currentTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'night') => {
    // Start with an empty array of recommendations
    const newRecommendations: Recommendation[] = [];
    
    // Clone the stories array to avoid modifying the original
    const availableStories = [...allStories];
    
    // 1. First, try to find a time-appropriate story
    const timeAppropriateTheme = getTimeAppropriateTheme(currentTimeOfDay);
    const timeAppropriateStories = availableStories.filter(s => s.theme === timeAppropriateTheme);
    
    if (timeAppropriateStories.length > 0) {
      // Pick a random story from the time-appropriate ones
      const randomIndex = Math.floor(Math.random() * timeAppropriateStories.length);
      const selectedStory = timeAppropriateStories[randomIndex];
      
      // Add it to recommendations with a time-based reason
      newRecommendations.push({
        story: selectedStory,
        reason: currentTimeOfDay === 'morning' 
          ? 'Perfect for a morning listen' 
          : currentTimeOfDay === 'night'
            ? 'Perfect for bedtime'
            : `Great for ${currentTimeOfDay} listening`,
        confidence: 0.9
      });
      
      // Remove it from available stories
      const index = availableStories.findIndex(s => s.id === selectedStory.id);
      if (index !== -1) availableStories.splice(index, 1);
    }
    
    // 2. Next, try to find favorite stories
    const favoriteStories = availableStories.filter(s => s.is_favorite);
    
    if (favoriteStories.length > 0) {
      // Pick a random favorite
      const randomIndex = Math.floor(Math.random() * favoriteStories.length);
      const selectedStory = favoriteStories[randomIndex];
      
      // Add it to recommendations
      newRecommendations.push({
        story: selectedStory,
        reason: 'From your favorites',
        confidence: 0.85
      });
      
      // Remove it from available stories
      const index = availableStories.findIndex(s => s.id === selectedStory.id);
      if (index !== -1) availableStories.splice(index, 1);
    }
    
    // 3. Add a recently created story if available
    if (availableStories.length > 0) {
      // Sort by creation date descending
      availableStories.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      const recentStory = availableStories[0];
      const creationDate = new Date(recentStory.created_at);
      const now = new Date();
      const daysDifference = Math.floor((now.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDifference < 7) {
        // Add it to recommendations
        newRecommendations.push({
          story: recentStory,
          reason: 'Recently created story',
          confidence: 0.8
        });
        
        // Remove it from available stories
        availableStories.shift();
      }
    }
    
    // 4. Fill remaining slots with random stories
    while (newRecommendations.length < 3 && availableStories.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableStories.length);
      const selectedStory = availableStories[randomIndex];
      
      // Add it to recommendations with a generic reason
      newRecommendations.push({
        story: selectedStory,
        reason: 'Recommended for you',
        confidence: 0.7
      });
      
      // Remove it from available stories
      availableStories.splice(randomIndex, 1);
    }
    
    // Update state with the new recommendations
    setRecommendations(newRecommendations);
  };
  
  // Handle refresh button click
  const handleRefresh = () => {
    // Refresh recommendations
    const currentTimeOfDay = getTimeOfDay();
    setTimeOfDay(currentTimeOfDay);
    generateRecommendations(stories, currentTimeOfDay);
    
    // Call the parent refresh function if provided
    if (onRefresh) {
      onRefresh();
    }
  };
  
  // No stories available
  if (stories.length === 0 && !isLoading) {
    return null;
  }

  return (
    <Card className={`bg-gray-900/50 border-gray-800 overflow-hidden ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium text-white flex items-center">
          <Sparkles className="mr-2 h-5 w-5 text-indigo-400" />
          Recommended for You
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleRefresh}
          className="text-gray-400 hover:text-white h-8 w-8 p-0"
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="sr-only">{isLoading ? 'Refreshing...' : 'Refresh'}</span>
        </Button>
      </CardHeader>
      
      <CardContent className="p-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-16 w-16 rounded-md" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-9 w-9 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <motion.div
                key={`${rec.story.id}-${index}`}
                className="flex items-center p-2 rounded-lg hover:bg-gray-800/50 cursor-pointer transition-colors"
                onClick={() => router.push(`/dashboard/stories/${rec.story.id}`)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="relative h-16 w-16 rounded-md overflow-hidden mr-3">
                  <Image 
                    src={rec.story.coverImage || `/images/theme-${rec.story.theme || 'adventure'}.jpg`} 
                    alt={rec.story.title}
                    fill
                    className="object-cover"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-white truncate">{rec.story.title}</h4>
                  <p className="text-xs text-gray-400 flex items-center">
                    {getReasonIcon(rec.reason)}
                    <span className="ml-1">{rec.reason}</span>
                  </p>
                </div>
                
                <Button
                  variant="outline"
                  size="icon"
                  className="flex-shrink-0 h-8 w-8 border-gray-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/dashboard/stories/${rec.story.id}?autoplay=true`);
                  }}
                >
                  <Play className="h-4 w-4" />
                </Button>
              </motion.div>
            ))}
            
            <div className="pt-2 text-center">
              <Button 
                variant="link" 
                onClick={() => router.push('/dashboard/library')}
                className="text-indigo-400 hover:text-indigo-300"
              >
                View all stories
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}