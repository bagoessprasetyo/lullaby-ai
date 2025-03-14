"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { 
  PlusCircle, Clock, Book, RefreshCw, History, Heart, 
  Moon, Settings, ChevronRight, Play, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Story } from "@/types/story";
import { PlayHistoryEntry } from "@/lib/services/history-service";
import { ClientDate } from "@/components/client-date";
import { WelcomeBack } from "./welcome-back";

interface MobileDashboardProps {
  userName: string;
  stories: Story[];
  favorites: Story[];
  playHistory: PlayHistoryEntry[];
  streakDays: number;
  lastVisit?: Date | string | null;
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
}

export function MobileDashboard({
  userName,
  stories,
  favorites,
  playHistory,
  streakDays,
  lastVisit = null,
  isLoading = false,
  onRefresh,
  className = ""
}: MobileDashboardProps) {
  const router = useRouter();
  const [showWelcome, setShowWelcome] = useState(true);
  
  // Helper function to get theme color
  const getThemeColor = (theme: string) => {
    switch (theme) {
      case 'adventure': return 'from-blue-600/20 to-indigo-600/20 border-blue-600/30';
      case 'fantasy': return 'from-purple-600/20 to-pink-600/20 border-purple-600/30';
      case 'bedtime': return 'from-indigo-600/20 to-blue-600/20 border-indigo-600/30';
      case 'educational': return 'from-green-600/20 to-emerald-600/20 border-green-600/30';
      default: return 'from-gray-700/20 to-gray-600/20 border-gray-700';
    }
  };
  
  // Helper to check if it's evening time (for bedtime recommendations)
  const isEveningTime = () => {
    const hour = new Date().getHours();
    return hour >= 18 && hour <= 23;
  };

  // Empty state
  if (stories.length === 0 && !isLoading) {
    return (
      <div className={`p-4 ${className}`}>
        <WelcomeBack 
          userName={userName}
          lastVisit={lastVisit}
          className="mb-6"
        />
        
        <div className="text-center py-16 bg-gray-900/50 rounded-xl border border-gray-800">
          <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-900/30 text-indigo-400">
            <Book className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-semibold mb-2 text-white">
            Create your first story
          </h2>
          <p className="text-gray-400 max-w-md mx-auto mb-6">
            Turn your favorite photos into magical bedtime tales
          </p>
          <Button
            onClick={() => router.push("/dashboard/create")}
            className="bg-indigo-600 hover:bg-indigo-700 px-6 text-white"
          >
            <PlusCircle className="mr-2 h-4 w-4 text-white" />
            Create Story
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 ${className}`}>
      {/* Welcome Banner */}
      {showWelcome && (
        <WelcomeBack 
          userName={userName}
          lastVisit={lastVisit}
          className="mb-6"
          onDismiss={() => setShowWelcome(false)}
        />
      )}
      
      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-lg font-medium text-white mb-3">Quick Actions</h2>
        <div className="grid grid-cols-4 gap-3">
          <Button 
            variant="outline" 
            className="flex flex-col items-center justify-center h-20 bg-indigo-600 hover:bg-indigo-700 text-white border-0"
            onClick={() => router.push("/dashboard/create")}
          >
            <PlusCircle className="h-6 w-6 mb-1" />
            <span className="text-xs">Create</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex flex-col items-center justify-center h-20 bg-gray-800 hover:bg-gray-700 border-gray-700"
            onClick={() => router.push("/dashboard/library")}
          >
            <Book className="h-6 w-6 mb-1" />
            <span className="text-xs">Library</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex flex-col items-center justify-center h-20 bg-gray-800 hover:bg-gray-700 border-gray-700"
            onClick={() => router.push("/dashboard/history")}
          >
            <History className="h-6 w-6 mb-1" />
            <span className="text-xs">History</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex flex-col items-center justify-center h-20 bg-gray-800 hover:bg-gray-700 border-gray-700"
            onClick={() => router.push("/dashboard/settings")}
          >
            <Settings className="h-6 w-6 mb-1" />
            <span className="text-xs">Settings</span>
          </Button>
        </div>
      </div>
      
      {/* Continue Listening */}
      {playHistory.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-medium text-white">Continue Listening</h2>
            <Button
              variant="link"
              size="sm"
              className="text-gray-400 px-0"
              onClick={() => router.push("/dashboard/history")}
            >
              See all
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          <Card className="bg-gray-900/80 border-gray-800">
            <CardContent className="p-3">
              {playHistory.slice(0, 2).map((item) => (
                <div 
                  key={item.id}
                  className="flex items-center py-3 border-b border-gray-800 last:border-0"
                  onClick={() => router.push(`/dashboard/stories/${item.storyId}?autoplay=true`)}
                >
                  <div className="relative h-14 w-14 rounded overflow-hidden flex-shrink-0">
                    <Image 
                      src={item.coverImage} 
                      alt={item.storyTitle}
                      fill
                      className="object-cover"
                    />
                    
                    {/* Progress indicator */}
                    {item.progress !== undefined && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
                        <div 
                          className="h-full bg-indigo-500" 
                          style={{width: `${item.progress}%`}} 
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-3 flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-white truncate">
                      {item.storyTitle}
                    </h3>
                    <p className="text-xs text-gray-400">
                      Last played <ClientDate date={item.playedAt} format="relative" />
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.progress ? `${item.progress}% complete` : 'Not started'}
                    </p>
                  </div>
                  
                  <Button size="icon" variant="ghost" className="flex-shrink-0 text-gray-400">
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Streak & Stats */}
      <div className="mb-6">
        <h2 className="text-lg font-medium text-white mb-3">Your Progress</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 rounded-xl p-4 border border-indigo-800/30 text-center">
            <div className="text-2xl font-bold text-white mb-1">{streakDays}</div>
            <div className="flex items-center justify-center text-sm text-gray-300">
              <Calendar className="h-4 w-4 mr-1 text-indigo-400" />
              Day Streak
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 rounded-xl p-4 border border-indigo-800/30 text-center">
            <div className="text-2xl font-bold text-white mb-1">{playHistory.length}</div>
            <div className="flex items-center justify-center text-sm text-gray-300">
              <Clock className="h-4 w-4 mr-1 text-indigo-400" />
              Stories Played
            </div>
          </div>
        </div>
      </div>
      
      {/* Favorites */}
      {favorites.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-medium text-white">Favorites</h2>
            <Button
              variant="link"
              size="sm"
              className="text-gray-400 px-0"
              onClick={() => router.push("/dashboard/library?favorites=true")}
            >
              See all
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          <ScrollArea className="pb-4 -mx-4 px-4">
            <div className="flex space-x-4">
              {favorites.map((story) => (
                <div
                  key={story.id}
                  className="flex-shrink-0 w-44"
                  onClick={() => router.push(`/dashboard/stories/${story.id}`)}
                >
                  <div className="relative w-full h-28 rounded-t-lg overflow-hidden">
                    <Image 
                      src={story.coverImage || `/images/theme-${story.theme || 'adventure'}.jpg`} 
                      alt={story.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <Heart className="h-4 w-4 fill-pink-500 text-pink-500" />
                    </div>
                  </div>
                  <div className="p-3 bg-gray-900 rounded-b-lg border-t-0 border border-gray-800">
                    <h3 className="text-sm font-medium text-white truncate mb-1">
                      {story.title}
                    </h3>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-400 truncate">
                        {story.theme && story.theme.charAt(0).toUpperCase() + story.theme.slice(1)}
                      </p>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-400">
                        <Play className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}
      
      {/* Bedtime Stories (only show in evening) */}
      {isEveningTime() && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-medium text-white flex items-center">
              <Moon className="mr-2 h-4 w-4 text-indigo-400" />
              Bedtime Stories
            </h2>
          </div>
          
          <ScrollArea className="pb-4 -mx-4 px-4">
            <div className="flex space-x-4">
              {stories
                .filter(story => story.theme === 'bedtime')
                .slice(0, 5)
                .map((story) => (
                  <div
                    key={story.id}
                    className="flex-shrink-0 w-44"
                    onClick={() => router.push(`/dashboard/stories/${story.id}`)}
                  >
                    <div className="relative w-full h-28 rounded-t-lg overflow-hidden">
                      <Image 
                        src={story.coverImage || `/images/theme-bedtime.jpg`} 
                        alt={story.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-3 bg-gray-900 rounded-b-lg border-t-0 border border-gray-800">
                      <h3 className="text-sm font-medium text-white truncate mb-1">
                        {story.title}
                      </h3>
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-400 truncate">
                          Perfect for bedtime
                        </p>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-400">
                          <Play className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}
      
      {/* All Stories */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium text-white">All Stories</h2>
          <Button
            variant="link"
            size="sm"
            className="text-gray-400 px-0"
            onClick={() => router.push("/dashboard/library")}
          >
            See all
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        
        <div className="space-y-3">
          {stories.slice(0, 4).map((story) => (
            <motion.div
              key={story.id}
              className={`bg-gradient-to-r ${getThemeColor(story.theme || 'adventure')} p-4 rounded-lg border flex items-center`}
              onClick={() => router.push(`/dashboard/stories/${story.id}`)}
              whileTap={{ scale: 0.98 }}
            >
              <div className="mr-3 flex-shrink-0 relative w-12 h-12 rounded overflow-hidden">
                <Image 
                  src={story.coverImage || `/images/theme-${story.theme || 'adventure'}.jpg`} 
                  alt={story.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-white truncate">
                  {story.title}
                </h3>
                <p className="text-xs text-gray-300 truncate">
                  {story.theme && story.theme.charAt(0).toUpperCase() + story.theme.slice(1)} • Created <ClientDate date={story.created_at} format="short" />
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0 ml-1 text-gray-300"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/dashboard/stories/${story.id}?autoplay=true`);
                }}
              >
                <Play className="h-4 w-4" />
              </Button>
            </motion.div>
          ))}
          
          {stories.length > 4 && (
            <Button 
              variant="outline" 
              className="w-full border-gray-700"
              onClick={() => router.push("/dashboard/library")}
            >
              View all {stories.length} stories
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}