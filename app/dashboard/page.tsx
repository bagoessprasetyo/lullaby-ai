// app/dashboard/page.tsx
import { Suspense } from 'react';
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth.config";
import { redirect } from "next/navigation";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { QueryProvider } from "@/lib/providers/query-provider";
import { getRecentStories, getStoryCount, getFavoriteStories } from "@/lib/services/story-service";
import { getSubscriptionFeatures } from "@/app/actions/subscriptions";
import { DashboardSkeleton } from "@/components/skeletons/dashboard-skeleton";
import { getPlayHistory, getListeningStats, getUserStreak, getListeningPatterns, PlayHistoryEntry } from "@/lib/services/history-service";
import { getUserPreferences } from "@/lib/services/user-service"; // You'll need to create this
import { FinalDashboard } from '@/components/dashboard/final-dashboard';
import { SubscriptionFeatures } from '@/types/subscription';

export default async function DashboardPage() {
  // Get server-side session
  const session = await getServerSession(authOptions);

  // Redirect to home if not authenticated
  if (!session?.user?.id) {
    redirect("/");
  }

  // Pre-fetch critical data in parallel for initial render
  // Log session id for debugging
  console.log(`Dashboard: Fetching data for user ${session.user.id}`);
  
  let recentStories = [];
  let storyCount = 0;
  let subscriptionFeatures: SubscriptionFeatures = { 
    success: false,
    subscription_tier: 'free',
    features: {
      story_limit: 0,
      long_stories: false,
      background_music: false,
      custom_voices: 0,
      educational_themes: false,
      custom_characters: false,
      story_series: false,
      exclusive_themes: false,
      unlimited_storage: false,
      max_images: 0
    }
  };
  let favoriteStories = [];
  let playHistory: { history: PlayHistoryEntry[] } = { history: [] }; // Add explicit type
  let listeningStats: {
    totalPlays: number;
    totalDuration: number;
    currentStreak: number;
    longestStreak: number;
    averagePerDay: number;
    mostPlayedStory: { id: string; title: string; coverImage: string; playCount: number } | null;
  } = { 
    totalPlays: 0,
    totalDuration: 0,
    currentStreak: 0,
    longestStreak: 0,
    averagePerDay: 0,
    mostPlayedStory: null 
  };
  let streakData: {
    currentStreak: number;
    longestStreak: number;
    lastListenedDate: string | null;
    streakHistory: boolean[];
  } = { 
    currentStreak: 0, 
    longestStreak: 0, 
    lastListenedDate: null, 
    streakHistory: [] 
  };
  let listeningPatterns: {
    hourlyDistribution: { hour: number; count: number }[];
    weekdayDistribution: { day: string; count: number }[];
  } = { 
    hourlyDistribution: [], 
    weekdayDistribution: [] 
  };
  let userPreferences = {};
  
  try {
    
    [
      recentStories, 
      storyCount, 
      subscriptionFeatures,
      favoriteStories
    ] = await Promise.all([
      getRecentStories(session.user.id, 5),
      getStoryCount(session.user.id),
      getSubscriptionFeatures()
        .catch(error => {
          console.error(`Dashboard: Error fetching subscription features: ${error}`);
          return {
            success: false,
            tier: 'free',
            subscription_tier: 'free',
            features: {
              story_limit: 3,
              long_stories: false,
              background_music: false,
              custom_voices: 0,
              educational_themes: false,
              custom_characters: false,
              story_series: false,
              exclusive_themes: false,
              unlimited_storage: false,
              max_images: 5
            }
          };
        }),
      getFavoriteStories(session.user.id, 4).then(data => {
        console.log(`Dashboard: Successfully fetched ${data.length} favorite stories`);
        return data;
      }).catch(error => {
        console.error(`Dashboard: Error fetching favorite stories: ${error}`);
        return [];
      })
    ]);
    
    // Then fetch secondary metrics in parallel after initial render
    [
      playHistory,
      listeningStats,
      streakData,
      listeningPatterns,
      // userPreferences
    ] = await Promise.all([
      getPlayHistory(session.user.id, { timeRange: '30days', limit: 5 }),
      getListeningStats(session.user.id),
      getUserStreak(session.user.id),
      getListeningPatterns(session.user.id),
      // getUserPreferences(session.user.id).catch(() => ({}))
    ]);
  } catch (error) {
    console.error(`Dashboard: Error fetching data: ${error}`);
  }

  return (
    <QueryProvider>
      <Suspense fallback={<DashboardSkeleton userName={session.user.name || ""} />}>
        <FinalDashboard 
          userName={session.user.name || ""}
          initialStories={recentStories}
          initialStoryCount={storyCount}
          initialSubscriptionFeatures={subscriptionFeatures}
          initialFavoriteStories={favoriteStories}
          initialPlayHistory={playHistory.history} // Remove optional chaining since we have explicit type
          initialListeningStats={listeningStats}
          initialStreakData={streakData}
          initialListeningPatterns={listeningPatterns}
          // initialUserPreferences={userPreferences}
        />
      </Suspense>
    </QueryProvider>
  );
}