"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardNavbar } from "@/components/dashboard/navbar";
import { useRecentStories, useStoryCount } from "@/hooks/query/useStories";
import { Story } from "@/types/story";
import { SubscriptionFeatures } from "@/types/subscription";
import { PlayHistoryEntry } from "@/lib/services/history-service";

// Import our custom components
import { QuickActions } from "./quick-actions";
import { ListeningInsights } from "./listening-insights";
import { StoryCategorization } from "./story-categorization";
import { trackDashboardInteraction } from "@/lib/services/user-service";
import { historyEntriesToStories } from "@/lib/utils/story-utils";

interface DashboardContentProps {
  userName: string;
  initialStories?: Story[];
  initialStoryCount?: number;
  initialSubscriptionFeatures?: SubscriptionFeatures | null;
  initialUserPreferences?: any;
  initialFavoriteStories?: Story[];
  initialPlayHistory?: PlayHistoryEntry[];
  initialStreakData?: {
    currentStreak: number;
    longestStreak: number;
    lastListenedDate: string | null;
    streakHistory: boolean[];
  };
  initialListeningPatterns?: {
    hourlyDistribution: { hour: number; count: number }[];
    weekdayDistribution: { day: string; count: number }[];
  };
  initialListeningStats?: {
    totalPlays: number;
    totalDuration: number;
    averagePerDay: number;
    mostPlayedStory?: {
      id: string;
      title: string;
      coverImage: string;
      playCount: number;
    } | null;
  };
}

export function DashboardContent({ 
  userName,
  initialStories = [],
  initialStoryCount = 0,
  initialSubscriptionFeatures = null,
  initialUserPreferences = {},
  initialFavoriteStories = [],
  initialPlayHistory = [],
  initialStreakData = {
    currentStreak: 0,
    longestStreak: 0,
    lastListenedDate: null,
    streakHistory: [false, false, false, false, false, false, false]
  },
  initialListeningPatterns = {
    hourlyDistribution: [],
    weekdayDistribution: []
  },
  initialListeningStats = {
    totalPlays: 0,
    totalDuration: 0,
    averagePerDay: 0,
    mostPlayedStory: null
  }
}: DashboardContentProps) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [insightsTimeRange, setInsightsTimeRange] = useState<'7days' | '30days' | '90days' | 'all'>('30days');
  
  // Use the initial data to populate the query cache
  const { 
    data: stories = initialStories, 
    isLoading: isLoadingStories,
    isError: hasStoriesError, 
    error: storiesError,
    refetch: refetchStories
  } = useRecentStories({
    initialData: initialStories.length > 0 ? initialStories : undefined,
  });
  
  // Also use initial data for story count
  const { 
    data: storyCount = initialStoryCount,
    isLoading: isLoadingCount,
    refetch: refetchCount
  } = useStoryCount({
    initialData: initialStoryCount > 0 ? initialStoryCount : undefined,
  });

  // State for other data that would normally be fetched with React Query
  const [favoriteStories, setFavoriteStories] = useState(initialFavoriteStories);
  const [playHistory, setPlayHistory] = useState(initialPlayHistory);
  const [streakData, setStreakData] = useState(initialStreakData);
  const [listeningPatterns, setListeningPatterns] = useState(initialListeningPatterns);
  const [listeningStats, setListeningStats] = useState(initialListeningStats);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  
  // Extract subscription tier
  const subscriptionTier = initialSubscriptionFeatures?.subscription_tier || 'free';
  console.log('initialUserPreferences ',initialUserPreferences)
  console.log('USEEERRRNAAAMEEEE ',userName)
  // Set mounted after hydration to avoid SSR/client hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    
    // Track dashboard view for personalization
    if (typeof window !== 'undefined') {
      trackDashboardInteraction(
        initialUserPreferences?.id || 'anonymous', 
        'dashboard_view'
      ).catch(console.error);
    }
  }, [initialUserPreferences?.id]);

  // Refresh all dashboard data
  const refreshDashboardData = async () => {
    // Refresh stories data
    await Promise.all([
      refetchStories(),
      refetchCount(),
    ]);
    
    // Mock refresh for other data
    setIsLoadingInsights(true);
    setTimeout(() => {
      setIsLoadingInsights(false);
    }, 1000);
  };
  
  // Handle insights time range change
  const handleTimeRangeChange = (range: '7days' | '30days' | '90days' | 'all') => {
    setInsightsTimeRange(range);
    // This would normally trigger a refetch with the new range
    setIsLoadingInsights(true);
    setTimeout(() => {
      setIsLoadingInsights(false);
    }, 800);
  };
  
  // Track quick action clicks
  const handleActionClick = (action: string) => {
    if (typeof window !== 'undefined') {
      trackDashboardInteraction(
        initialUserPreferences?.id || 'anonymous',
        action
      ).catch(console.error);
    }
  };

  // During hydration, use a simplified version based on the initial data
  if (!isMounted) {
    return (
      <>
        <DashboardNavbar />
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <header className="mb-10">
            <h1 className="text-3xl font-bold text-white mb-2">
              Hello, {userName.split(" ")[0] || "there"}!
            </h1>
            <p className="text-gray-400">
              Your personal story library and creation dashboard
            </p>
          </header>
          {/* Loading state handled by parent Suspense component */}
        </div>
      </>
    );
  }

  // Handle error state
  if (hasStoriesError) {
    return (
      <>
        <DashboardNavbar />
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <div className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2 text-white">
              Error Loading Dashboard
            </h2>
            <p className="text-gray-400 mb-4">
              {storiesError instanceof Error ? storiesError.message : "Failed to load your stories."}
            </p>
            <Button onClick={refreshDashboardData}>
              <RefreshCw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </div>
        </div>
      </>
    );
  }

  // Get the last played story for quick actions
  const lastPlayedStory = playHistory.length > 0 ? {
    id: playHistory[0].storyId,
    title: playHistory[0].storyTitle,
    progress: playHistory[0].progress || 0
  } : null;

  return (
    <>
      <DashboardNavbar />
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <header className="mb-10 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Hello, {userName.split(" ")[0] || "there"}!
              </h1>
              <p className="text-gray-400">
                Your personal story library and creation dashboard
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshDashboardData}
              disabled={isLoadingStories || isLoadingCount || isLoadingInsights}
              className="border-gray-700 hover:bg-gray-800"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingStories || isLoadingCount || isLoadingInsights ? 'animate-spin' : ''}`} />
              {isLoadingStories || isLoadingCount || isLoadingInsights ? 'Refreshing...' : 'Refresh'}
            </Button>
          </header>

          {/* Quick Actions */}
          <QuickActions
            lastPlayedStory={lastPlayedStory}
            userPreferences={initialUserPreferences}
            favoritesCount={favoriteStories.length}
            subscriptionTier={subscriptionTier}
            onActionClick={handleActionClick}
          />

          {/* Main Content in Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            {/* Listening Insights - 1/3 width */}
            <div className="lg:col-span-1">
              <ListeningInsights
                stats={listeningStats}
                streak={streakData}
                listeningPatterns={listeningPatterns}
                isLoading={isLoadingInsights}
                onRefresh={refreshDashboardData}
                timeRange={insightsTimeRange}
                onTimeRangeChange={handleTimeRangeChange}
              />
            </div>
            
            {/* Story Categorization - 2/3 width */}
            <div className="lg:col-span-2">
              <StoryCategorization
                allStories={stories}
                favoriteStories={favoriteStories}
                recentlyPlayedStories={historyEntriesToStories(
                  playHistory
                )}
              />
            </div>
          </div>

          {/* Empty State - Only show if no stories */}
          {stories.length === 0 && (
            <div className="text-center py-20 bg-gray-900/50 rounded-xl border border-gray-800 mt-10">
              <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-900/30 text-indigo-400">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="32" 
                  height="32" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2 text-white">
                Create your first bedtime story
              </h2>
              <p className="text-gray-400 max-w-md mx-auto mb-6">
                Upload photos and let our AI transform your precious moments into magical tales.
              </p>
              <Button
                onClick={() => router.push("/dashboard/create")}
                className="bg-indigo-600 hover:bg-indigo-700 px-6 text-white"
              >
                Create New Story
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
}