// components/dashboard/story-categorization.tsx
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ChevronRight, Compass, Moon, Sparkles, GraduationCap, Heart, Clock } from "lucide-react";
import { StoriesGrid } from "./stories-grid";
import { StoriesCarousel } from "./stories-carousel";
import { Story } from "@/types/story";
import { historyEntriesToStories } from "@/lib/utils/story-utils";

interface StoryCategoryProps {
  allStories: Story[];
  favoriteStories?: Story[];
  recentlyPlayedStories?: Story[];
  className?: string;
}

// Helper function to categorize stories by theme
function categorizeStoriesByTheme(stories: Story[]): Record<string, Story[]> {
  return stories.reduce((acc: Record<string, Story[]>, story) => {
    const theme = story.theme || 'other';
    if (!acc[theme]) {
      acc[theme] = [];
    }
    acc[theme].push(story);
    return acc;
  }, {});
}

// Helper function to categorize stories by creation date
function categorizeStoriesByDate(stories: Story[]): Record<string, Story[]> {
  const today = new Date();
  const oneDay = 24 * 60 * 60 * 1000;
  const oneWeek = 7 * oneDay;
  const oneMonth = 30 * oneDay;
  
  const categories: Record<string, Story[]> = {
    'Today': [],
    'This Week': [],
    'This Month': [],
    'Older': []
  };
  
  stories.forEach(story => {
    const creationDate = new Date(story.created_at);
    const timeDiff = today.getTime() - creationDate.getTime();
    
    if (timeDiff < oneDay) {
      categories['Today'].push(story);
    } else if (timeDiff < oneWeek) {
      categories['This Week'].push(story);
    } else if (timeDiff < oneMonth) {
      categories['This Month'].push(story);
    } else {
      categories['Older'].push(story);
    }
  });
  
  // Remove empty categories
  Object.keys(categories).forEach(key => {
    if (categories[key].length === 0) {
      delete categories[key];
    }
  });
  
  return categories;
}

// Get icon for theme category
function getThemeIcon(theme: string) {
  switch (theme.toLowerCase()) {
    case 'adventure':
      return <Compass className="mr-2 h-4 w-4 text-blue-400" />;
    case 'fantasy':
      return <Sparkles className="mr-2 h-4 w-4 text-purple-400" />;
    case 'bedtime':
      return <Moon className="mr-2 h-4 w-4 text-indigo-400" />;
    case 'educational':
      return <GraduationCap className="mr-2 h-4 w-4 text-green-400" />;
    default:
      return null;
  }
}

// Helper to capitalize first letter
const capitalizeFirst = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export function StoryCategorization({
  allStories,
  favoriteStories = [],
  recentlyPlayedStories = [],
  className = ""
}: StoryCategoryProps) {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState("all");
  
  // Memoize the categorized stories
  const storiesByTheme = useMemo(() => 
    categorizeStoriesByTheme(allStories), [allStories]);
  
  const storiesByDate = useMemo(() => 
    categorizeStoriesByDate(allStories), [allStories]);
  
  // Sort themes by story count
  const sortedThemes = useMemo(() => 
    Object.entries(storiesByTheme)
      .sort((a, b) => b[1].length - a[1].length), 
    [storiesByTheme]);
    
  // Convert recently played history entries to proper Story objects
  const formattedRecentlyPlayed = useMemo(() => 
    recentlyPlayedStories && recentlyPlayedStories.length > 0 
      ? historyEntriesToStories(recentlyPlayedStories as any)
      : [], 
    [recentlyPlayedStories]);
  
  // Empty state
  if (allStories.length === 0) {
    return (
      <div className={`text-center py-20 bg-gray-900/50 rounded-xl border border-gray-800 ${className}`}>
        <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-900/30 text-indigo-400">
          <Compass className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-semibold mb-2 text-white">
          Embark on your first story adventure
        </h2>
        <p className="text-gray-400 max-w-md mx-auto mb-6">
          Create personalized bedtime tales from your favorite memories.
        </p>
        <Button
          onClick={() => router.push("/dashboard/create")}
          className="bg-indigo-600 hover:bg-indigo-700 px-6 text-white"
        >
          Create Your First Story
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      <Tabs 
        defaultValue="all" 
        value={currentTab}
        onValueChange={setCurrentTab}
      >
        {/* Fix: Remove extra closing brace and properly nest children */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Your Library</h2>
          <TabsList className="bg-gray-800 border border-gray-700">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="favorites">
              <Heart className="h-3.5 w-3.5 mr-1" />
              Favorites
            </TabsTrigger>
            <TabsTrigger value="themes">Themes</TabsTrigger>
            <TabsTrigger value="recent">
              <Clock className="h-3.5 w-3.5 mr-1" />
              Recent
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Rest of TabsContent components remain unchanged */}
        <TabsContent value="all" className="mt-0">
          <StoriesGrid stories={allStories} />
        </TabsContent>
        
        <TabsContent value="favorites" className="mt-0">
          {favoriteStories.length > 0 ? (
            <StoriesGrid stories={favoriteStories} />
          ) : (
            <div className="text-center py-10 bg-gray-900/50 rounded-xl border border-gray-800">
              <Heart className="h-10 w-10 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No favorites yet</h3>
              <p className="text-gray-400 mb-6">Mark stories as favorites to easily find them here</p>
              <Button 
                variant="outline"
                onClick={() => setCurrentTab("all")}
                className="border-gray-700"
              >
                Browse All Stories
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="themes" className="mt-0">
          <div className="space-y-8">
            {sortedThemes.map(([theme, stories]) => (
              <div key={theme}>
                <h3 className="text-lg font-medium text-white mb-3 flex items-center">
                  {getThemeIcon(theme)}
                  {capitalizeFirst(theme)} Stories
                </h3>
                <StoriesCarousel stories={stories} />
              </div>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="recent" className="mt-0">
          <div className="space-y-8">
            {Object.entries(storiesByDate).map(([timeframe, stories]) => (
              <div key={timeframe}>
                <h3 className="text-lg font-medium text-white mb-3 flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-indigo-400" />
                  {timeframe}
                </h3>
                {stories.length > 4 ? (
                  <>
                    <StoriesCarousel stories={stories} />
                    <div className="mt-2 text-right">
                      <Button 
                        variant="link" 
                        size="sm"
                        className="text-indigo-400 hover:text-indigo-300"
                        onClick={() => router.push('/dashboard/library?timeframe=' + encodeURIComponent(timeframe.toLowerCase()))}
                      >
                        See all {stories.length} stories 
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <StoriesGrid stories={stories} />
                )}
              </div>
            ))}
            
            {/* Recently Played Section */}
            {recentlyPlayedStories && recentlyPlayedStories.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-white mb-3 flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-indigo-400" />
                  Recently Played
                </h3>
                <StoriesCarousel stories={formattedRecentlyPlayed} />
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}