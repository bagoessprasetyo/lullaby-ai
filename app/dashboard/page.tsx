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
import { getPlayHistory, getListeningStats, getUserStreak, getListeningPatterns } from "@/lib/services/history-service";
import { getUserPreferences } from "@/lib/services/user-service"; // You'll need to create this
import { FinalDashboard } from '@/components/dashboard/final-dashboard';

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
  let subscriptionFeatures = {};
  let favoriteStories = [];
  let playHistory = { history: [] };
  let listeningStats = { totalPlays: 0, totalDuration: 0, currentStreak: 0, longestStreak: 0, averagePerDay: 0, mostPlayedStory: null };
  let streakData = { currentStreak: 0, longestStreak: 0, lastListenedDate: null, streakHistory: [] };
  let listeningPatterns = { hourlyDistribution: [], weekdayDistribution: [] };
  let userPreferences = {};
  
  try {
    [
      recentStories, 
      storyCount, 
      subscriptionFeatures, 
      favoriteStories,
      playHistory,
      listeningStats,
      streakData,
      listeningPatterns,
      userPreferences
    ] = await Promise.all([
      getRecentStories(session.user.id, 5),
      getStoryCount(session.user.id),
      getSubscriptionFeatures(),
      getFavoriteStories(session.user.id, 4).then(data => {
        console.log(`Dashboard: Successfully fetched ${data.length} favorite stories`);
        return data;
      }).catch(error => {
        console.error(`Dashboard: Error fetching favorite stories: ${error}`);
        return [];
      }),
      getPlayHistory(session.user.id, { timeRange: '30days', limit: 5 }),
      getListeningStats(session.user.id),
      getUserStreak(session.user.id),
      getListeningPatterns(session.user.id),
      getUserPreferences(session.user.id).catch(() => ({})) // Fallback to empty object if not found
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
          initialPlayHistory={playHistory?.history || []}
          initialListeningStats={listeningStats}
          initialStreakData={streakData}
          initialListeningPatterns={listeningPatterns}
          initialUserPreferences={userPreferences}
        />
      </Suspense>
    </QueryProvider>
  );
}