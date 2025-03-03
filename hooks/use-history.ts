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
  ListeningStats,
  PlayHistoryEntry,
  getCalendarData,
  CalendarData
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
  const [plays, setPlays] = useState<PlayHistoryEntry[]>([]);
  const [stats, setStats] = useState<ListeningStats | null>(null);
  const [calendarData, setCalendarData] = useState<{date: string, count: number, duration: number}[]>([]);
  const [calendarHeatmapData, setCalendarHeatmapData] = useState<CalendarData | null>(null);
  const [streak, setStreak] = useState({
    currentStreak: 0,
    longestStreak: 0,
    lastListenedDate: null as string | null,
    streakHistory: [] as boolean[]
  });
  const [listeningPatterns, setListeningPatterns] = useState({
    hourlyDistribution: [] as {hour: number, count: number}[],
    weekdayDistribution: [] as {day: string, count: number}[]
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
        timeRange: filterPeriod, // Updated from timeframe to timeRange
        searchQuery: searchQuery,
      });
      
      setPlays(history);
      setTotalCount(count);
      
      // Get listening stats if viewing stats tab
      if (currentTab === "stats") {
        const stats = await getListeningStats(session.user.id, filterPeriod);
        setStats(stats);
        
        // Get listening patterns
        const patterns = await getListeningPatterns(session.user.id, filterPeriod);
        setListeningPatterns(patterns);
      }
      
      // Get calendar data if viewing calendar tab
      if (currentTab === "calendar") {
        // Use getPlayHistoryByDay for the old calendar format
        const calTimeframe = filterPeriod === '7days' ? '30days' : 
                            filterPeriod === 'all' ? '365days' : filterPeriod;
        const oldCalendarData = await getPlayHistoryByDay(session.user.id, calTimeframe as any);
        setCalendarData(oldCalendarData);
        
        // Use new getCalendarData for the heatmap view
        const heatmapTimeRange = filterPeriod === '7days' || filterPeriod === '30days' ? '6months' :
                                filterPeriod === '90days' ? 'year' : 'all';
        const heatmapData = await getCalendarData(session.user.id, heatmapTimeRange as '6months' | 'year' | 'all');
        setCalendarHeatmapData(heatmapData);
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
    calendarHeatmapData,
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