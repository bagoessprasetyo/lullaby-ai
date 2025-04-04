"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMediaQuery } from "@/hooks/use-media-query";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardNavbar } from "@/components/dashboard/navbar";
import { useRecentStories, useStoryCount, useFavoriteStories } from "@/hooks/query/useStories";
import { Story } from "@/types/story";
import { SubscriptionFeatures } from "@/types/subscription";
import { PlayHistoryEntry } from "@/lib/services/history-service";
import { trackDashboardInteraction } from "@/lib/services/usage-tracking-service";

// Import custom components
import { Suspense } from 'react';
import { ListeningInsights } from "./listening-insights";
import { StoryCategorization } from "./story-categorization";
import { StoryRecommendations } from "./story-recommendations";
import { MilestoneTracker } from "./milestone-tracker";
import { WelcomeBack } from "./welcome-back";
import { MobileDashboard } from "./mobile-dashboard";
import { EnhancedSearchBar } from "./enhanced-search";
import { ListeningInsightsSkeleton } from './listening-insights-skeleton';
import { historyEntriesToStories } from "@/lib/utils/story-utils";

// Define interface for component props
interface FinalDashboardProps {
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
  initialLastVisit?: string | null;
}

export function FinalDashboard({ 
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
  },
  initialLastVisit = null
}: FinalDashboardProps) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [insightsTimeRange, setInsightsTimeRange] = useState<'7days' | '30days' | '90days' | 'all'>('30days');
  const [showWelcome, setShowWelcome] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState({});
  
  // Check if viewport is mobile
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  // Use React Query data with initial values
  const { 
    data: stories = initialStories, 
    isLoading: isLoadingStories,
    isError: hasStoriesError, 
    error: storiesError,
    refetch: refetchStories
  } = useRecentStories({
    initialData: initialStories.length > 0 ? initialStories : undefined,
  });
  
  const { 
    data: storyCount = initialStoryCount,
    isLoading: isLoadingCount,
    refetch: refetchCount
  } = useStoryCount({
    initialData: initialStoryCount > 0 ? initialStoryCount : undefined,
  });
  
  const {
    data: favoriteStories = initialFavoriteStories,
    isLoading: isLoadingFavorites,
    isError: hasFavoritesError,
    error: favoritesError,
    refetch: refetchFavorites
  } = useFavoriteStories({
    initialData: initialFavoriteStories?.length > 0 ? initialFavoriteStories : undefined,
  });
  
  // Debug log for favorites 
  console.log('Dashboard favorites data:', {
    fromHook: favoriteStories?.length || 0,
    initialData: initialFavoriteStories?.length || 0,
    isLoading: isLoadingFavorites,
    isError: hasFavoritesError,
    errorMessage: favoritesError instanceof Error ? favoritesError.message : null
  });

  // State for other data that would normally be fetched with React Query
  const [playHistory, setPlayHistory] = useState(initialPlayHistory);
  const [streakData, setStreakData] = useState(initialStreakData);
  const [listeningPatterns, setListeningPatterns] = useState(initialListeningPatterns);
  const [listeningStats, setListeningStats] = useState(initialListeningStats);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  
  // Get user subscription tier
  const subscriptionTier = initialSubscriptionFeatures?.subscription_tier || 'free';
  
  // Last login date
  const lastVisit = initialLastVisit ? new Date(initialLastVisit) : null;
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

  // Function to refresh all dashboard data
  const refreshDashboardData = async () => {
    // Refresh stories data
    await Promise.all([
      refetchStories(),
      refetchCount(),
      refetchFavorites()
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
    // Track this interaction
    trackDashboardInteraction(
      initialUserPreferences?.id || 'anonymous',
      'change_timerange',
      { range }
    ).catch(console.error);
    
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
  
  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Track search
    if (query.length > 2) {
      trackDashboardInteraction(
        initialUserPreferences?.id || 'anonymous',
        'search',
        { query }
      ).catch(console.error);
    }
  };
  
  // Handle filter changes
  const handleFilterApply = (filters: any) => {
    setSearchFilters(filters);
    // Track filter usage
    trackDashboardInteraction(
      initialUserPreferences?.id || 'anonymous',
      'apply_filters',
      { filters }
    ).catch(console.error);
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

  // Use mobile layout for small screens
  if (isMobile) {
    return (
      <>
        <DashboardNavbar />
        <MobileDashboard
          userName={userName}
          stories={stories}
          favorites={favoriteStories}
          playHistory={playHistory}
          streakDays={streakData.currentStreak}
          lastVisit={lastVisit}
          isLoading={isLoadingStories || isLoadingCount || isLoadingFavorites || isLoadingInsights}
          onRefresh={refreshDashboardData}
        />
      </>
    );
  }

  // Desktop dashboard layout
  return (
    <>
      <DashboardNavbar />
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* // Update the EnhancedSearchBar implementation in the header section */}
          <header className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Hello, {userName.split(" ")[0] || "there"}!
              </h1>
              <p className="text-gray-400">
                Your personal story library and creation dashboard
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <EnhancedSearchBar
                allStories={stories || []}
                recentSearches={[]}
                isLoading={isLoadingStories}
                className="w-full sm:w-64 md:w-80"
                onSearch={handleSearch}
                onFilterApply={handleFilterApply}
              />
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
            </div>
          </header>

          {/* Welcome Back Banner - only show for returning users with a last visit date */}
          {showWelcome && lastVisit && (
            <WelcomeBack
              userName={userName}
              lastVisit={lastVisit}
              className="mb-6"
              onDismiss={() => setShowWelcome(false)}
            />
          )}

          {/* Quick Actions */}
          {/* <QuickActions
            lastPlayedStory={lastPlayedStory}
            userPreferences={initialUserPreferences}
            favoritesCount={favoriteStories.length}
            subscriptionTier={subscriptionTier}
            onActionClick={handleActionClick}
          /> */}
          
          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Left column - 2/3 width */}
            <div className="lg:col-span-2 space-y-6">
              {/* Story Categorization */}
              <StoryCategorization
                allStories={stories}
                favoriteStories={favoriteStories}
                recentlyPlayedStories={historyEntriesToStories(
                    playHistory
                  )}
              />
            </div>
            
            {/* Right column - 1/3 width */}
            <div className="space-y-6">
              {/* Recommendations */}
              <StoryRecommendations
                userId={initialUserPreferences?.id || 'anonymous'}
                stories={stories}
                isLoading={isLoadingStories}
                onRefresh={refreshDashboardData}
              />
              
              {/* Listening Insights with Suspense */}
              <Suspense fallback={<ListeningInsightsSkeleton />}>
                <ListeningInsights
                  stats={listeningStats}
                  streak={streakData}
                  listeningPatterns={listeningPatterns}
                  isLoading={isLoadingInsights}
                  onRefresh={refreshDashboardData}
                  timeRange={insightsTimeRange}
                  onTimeRangeChange={handleTimeRangeChange}
                />
              </Suspense>
              
              {/* Milestone Tracker */}
              {/* <MilestoneTracker
                userId={initialUserPreferences?.id || 'anonymous'}
                isLoading={isLoadingInsights}
                initialMilestones={{
                  totalStoriesListened: listeningStats.totalPlays,
                  totalMinutesListened: Math.floor(listeningStats.totalDuration / 60),
                  longestStreak: streakData.longestStreak,
                  nextMilestone: {
                    type: 'stories',
                    current: listeningStats.totalPlays,
                    target: listeningStats.totalPlays < 10 ? 10 : 
                            listeningStats.totalPlays < 25 ? 25 : 
                            listeningStats.totalPlays < 50 ? 50 : 100,
                    progress: listeningStats.totalPlays < 10 ? listeningStats.totalPlays / 10 :
                             listeningStats.totalPlays < 25 ? listeningStats.totalPlays / 25 :
                             listeningStats.totalPlays < 50 ? listeningStats.totalPlays / 50 : 
                             listeningStats.totalPlays / 100
                  }
                }}
              /> */}
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