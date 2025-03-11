// Server Component - No "use client" directive
import { Suspense } from "react";
import { DashboardNavbar } from "@/components/dashboard/navbar";
import { HistoryPageContent } from "./history-page-content";
import { LoadingState } from "@/components/ui/loading-state";
import { 
  getListeningStats,
  getPlayHistory,
  ListeningStats,
  PlayHistoryEntry
} from "@/lib/services/history-service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth.config";

export default async function HistoryPage() {
  // Get the session on the server side
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  
  // If no user is logged in, we'll handle this in the client component
  // This allows us to redirect through the client-side router
  if (!userId) {
    return (
      <>
        <DashboardNavbar />
        <HistoryPageContent
          initialPlayHistory={[]}
          initialListeningStats={null}
          totalCount={0}
          userId={null}
        />
      </>
    );
  }
  
  // Server-side data fetching for initial load
  // Default to 30 days filter
  const timeRange = '30days';
  
  // Fetch initial data in parallel
  const [historyData, statsData] = await Promise.all([
    getPlayHistory(userId, { timeRange, searchQuery: '' }),
    getListeningStats(userId, timeRange)
  ]);
  
  return (
    <>
      <DashboardNavbar />
      <Suspense fallback={<LoadingState message="Loading your history..." />}>
        <HistoryPageContent
          initialPlayHistory={historyData.history}
          initialListeningStats={statsData}
          totalCount={historyData.count}
          userId={userId}
        />
      </Suspense>
    </>
  );
}