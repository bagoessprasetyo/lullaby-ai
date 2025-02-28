// hooks/use-history.ts
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  getPlayHistory, 
  getListeningStats, 
  getPlayHistoryByDay,
  getUserStreak,
  getListeningPatterns,
  PlayHistory,
  ListeningStats
} from "@/lib/services/history-service";

type StoryPlay = {
  id: string;
  storyId: string;
  storyTitle: string;
  coverImage: string;
  playedAt: Date;
  duration: number; // in seconds
  completed: boolean;
  progress?: number; // 0-100
};

type TimeframeOption = '7days' | '30days' | '90days' | 'all';

export function useHistory() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [plays, setPlays] = useState<StoryPlay[]>([]);
  const [stats, setStats] = useState<ListeningStats | null>(null);
  const [calendarData, setCalendarData] = useState<{date: string, count: number, duration: number}[]>([]);
  const [streak, setStreak] = useState({
    currentStreak: 0,
    longestStreak: 0,
    lastListenedDate: null as string | null,
    streakHistory: [] as boolean[]
  });
  const [listeningPatterns, setListeningPatterns] = useState({
    hourly: [] as {hour: number, count: number}[],
    weekly: [] as {day: number, name: string, count: number}[]
  });
  const [totalCount, setTotalCount] = useState(0);
  const [filterPeriod, setFilterPeriod] = useState<TimeframeOption>('30days');
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTab, setCurrentTab] = useState("timeline");
  const [error, setError] = useState<string | null>(null);

  // Function to refresh all history data
  const refreshHistory = async () => {
    if (!session?.user?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get play history
      const { history, count } = await getPlayHistory(session.user.id, {
        timeframe: filterPeriod,
        searchQuery: searchQuery,
      });
      
      // Transform to UI format
      const formattedPlays: StoryPlay[] = history.map(play => {
        // Extract image URL from story
        const images = play.story?.images || [];
        const imagePath = images.length > 0 
          ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${images[0].storage_path}`
          : "https://via.placeholder.com/300x300?text=No+Image";
        
        return {
          id: play.id,
          storyId: play.story_id,
          storyTitle: play.story?.title || "Unknown Story",
          coverImage: imagePath,
          playedAt: new Date(play.played_at),
          duration: play.story?.duration || 0,
          completed: play.completed,
          progress: play.progress_percentage
        };
      });
      
      setPlays(formattedPlays);
      setTotalCount(count);
      
      // Get listening stats if viewing stats tab
      if (currentTab === "stats") {
        const stats = await getListeningStats(session.user.id, filterPeriod);
        setStats(stats);
        
        // Get listening patterns
        const patterns = await getListeningPatterns(session.user.id);
        setListeningPatterns(patterns);
      }
      
      // Get calendar data if viewing calendar tab
      if (currentTab === "calendar") {
        const calTimeframe = filterPeriod === '7days' ? '30days' : 
                            filterPeriod === 'all' ? '365days' : filterPeriod;
        const calendarData = await getPlayHistoryByDay(session.user.id, calTimeframe as any);
        setCalendarData(calendarData);
      }
      
      // Get streak data in any case (shown on all tabs)
      const streakData = await getUserStreak(session.user.id);
      setStreak({
        currentStreak: streakData.currentStreak,
        longestStreak: streakData.longestStreak,
        lastListenedDate: streakData.lastListenedDate,
        streakHistory: streakData.streakHistory || []
      });
      
    } catch (err) {
      console.error("Error fetching history data:", err);
      setError("Failed to load history data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (status === "authenticated") {
      refreshHistory();
    }
  }, [session, status, filterPeriod, searchQuery, currentTab]);

  // Get filtered plays based on search and period
  const getFilteredPlays = () => {
    return plays;
  };

  return {
    isLoading,
    plays: getFilteredPlays(),
    stats,
    calendarData,
    streak,
    listeningPatterns,
    totalCount,
    filterPeriod,
    setFilterPeriod,
    searchQuery,
    setSearchQuery,
    currentTab,
    setCurrentTab,
    error,
    refreshHistory
  };
}