"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Clock, Activity, Award } from "lucide-react";
import { formatDuration } from "@/lib/format-duration";
import { 
  ListeningStats,
  PlayHistoryEntry,
  CalendarData,
} from "@/lib/services/history-service";
import { HistoryTabs } from "./components/history-tabs";
import { LoadingState } from "@/components/ui/loading-state";
import { 
  fetchPlayHistory, 
  fetchListeningStats, 
  fetchCalendarData
} from "./actions";
import { fetchListeningPatterns } from "./debug-action"; 

interface HistoryPageContentProps {
  initialPlayHistory: PlayHistoryEntry[];
  initialListeningStats: ListeningStats | null;
  totalCount: number;
  userId: string | null;
}

export function HistoryPageContent({
  initialPlayHistory,
  initialListeningStats,
  totalCount: initialTotalCount,
  userId
}: HistoryPageContentProps) {
  const router = useRouter();
  
  // Track previous values for comparison
  const prevFilterPeriodRef = useRef('30days');
  const prevSearchQueryRef = useRef('');
  
  // If no userId is provided, redirect to login
  useEffect(() => {
    if (!userId) {
      router.push("/login?callbackUrl=/dashboard/history");
    }
  }, [userId, router]);
  
  // State management
  const [currentTab, setCurrentTab] = useState("timeline");
  const [filterPeriod, setFilterPeriod] = useState("30days");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Tab-specific loading states
  const [isMainLoading, setIsMainLoading] = useState(false);
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  
  const [playHistory, setPlayHistory] = useState<PlayHistoryEntry[]>(initialPlayHistory);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [listeningStats, setListeningStats] = useState<ListeningStats | null>(initialListeningStats);
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [listeningPatterns, setListeningPatterns] = useState<{
    hourlyDistribution: {hour: number, count: number}[];
    weekdayDistribution: {day: string, count: number}[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Track if this is the initial render
  const [isInitialRender, setIsInitialRender] = useState(true);
  
  // Update refs when filter period or search query changes
  useEffect(() => {
    prevFilterPeriodRef.current = filterPeriod;
  }, [filterPeriod]);
  
  useEffect(() => {
    prevSearchQueryRef.current = searchQuery;
  }, [searchQuery]);
  
  // Fetch main data when filters change
  useEffect(() => {
    // Skip if no user ID
    if (!userId) return;
    
    // On initial render, use the data provided from the server
    // Only fetch if filter parameters have changed from initial values
    const shouldFetch = !isInitialRender || 
      filterPeriod !== '30days' || 
      searchQuery !== '';
    
    if (!shouldFetch) {
      setIsInitialRender(false);
      return;
    }
    
    console.log('Fetching main data due to filter change:', { 
      filterPeriod, 
      searchQuery, 
      isInitialRender 
    });
    
    const loadHistoryData = async () => {
      setIsMainLoading(true);
      setError(null);
      
      try {
        // Convert period to proper timeRange format
        const timeRange = filterPeriod === 'all' ? 'all' : `${filterPeriod}` as '7days' | '30days' | '90days' | 'all';
        
        // Use server actions instead of direct API calls
        const [historyResult, statsResult] = await Promise.all([
          fetchPlayHistory(timeRange, searchQuery),
          fetchListeningStats(timeRange)
        ]);
        
        console.log('Received history data:', { 
          historyCount: historyResult?.history?.length, 
          statsReceived: !!statsResult 
        });
        
        if (historyResult) {
          setPlayHistory(historyResult.history);
          setTotalCount(historyResult.count);
        }
        
        if (statsResult) {
          setListeningStats(statsResult);
        }
      } catch (error) {
        console.error("Error fetching history data:", error);
        setError("Failed to load history data. Please try again later.");
      } finally {
        setIsMainLoading(false);
        setIsInitialRender(false);
      }
    };

    loadHistoryData();
  }, [userId, filterPeriod, searchQuery, isInitialRender]);

  // Fetch calendar data when switching to calendar tab
  useEffect(() => {
    if (!userId || currentTab !== "calendar") return;
    
    // Determine if we need to fetch new data
    const filterChanged = filterPeriod !== prevFilterPeriodRef.current;
    const noData = !calendarData;
    
    if (!noData && !filterChanged && !isInitialRender) {
      console.log('Skipping calendar fetch - data exists and filters unchanged');
      return;
    }
    
    console.log('Fetching calendar data:', { 
      filterPeriod, 
      filterChanged,
      noData
    });
    
    const loadCalendarData = async () => {
      setIsCalendarLoading(true);
      try {
        let calRange: '6months' | 'year' | 'all' = 'year';
        if (filterPeriod === '90days' || filterPeriod === '7days') {
          calRange = '6months';
        } else if (filterPeriod === 'all') {
          calRange = 'all';
        }
        
        console.log(`Fetching calendar data with range: ${calRange}`);
        
        // Use server action with the correct parameter
        const calData = await fetchCalendarData(calRange);
        
        console.log('Received calendar data:', { 
          received: !!calData,
          dataPoints: calData ? Object.keys(calData).length : 0
        });
        
        if (calData) {
          setCalendarData(calData);
        } else {
          console.warn('No calendar data received from server action');
        }
      } catch (error) {
        console.error("Error fetching calendar data:", error);
        setError("Failed to load calendar data. Please try again later.");
      } finally {
        setIsCalendarLoading(false);
      }
    };
    
    loadCalendarData();
  }, [currentTab, userId, filterPeriod, isInitialRender]);

  // Fetch listening patterns when switching to stats tab
  useEffect(() => {
    if (!userId || currentTab !== "stats") return;
    
    // Determine if we need to fetch new data
    const filterChanged = filterPeriod !== prevFilterPeriodRef.current;
    const noData = !listeningPatterns;
    
    if (!noData && !filterChanged && !isInitialRender) {
      console.log('Skipping patterns fetch - data exists and filters unchanged');
      return;
    }
    
    console.log('Fetching patterns data:', { 
      filterPeriod, 
      filterChanged,
      noData
    });
    
    const loadPatternsData = async () => {
      setIsStatsLoading(true);
      try {
        const timeRange = filterPeriod === 'all' ? 'all' : `${filterPeriod}` as '7days' | '30days' | '90days' | 'all';
        
        console.log(`Fetching patterns with range: ${timeRange}`);
        
        // Use server action
        const patterns = await fetchListeningPatterns(timeRange);
        
        console.log('Received patterns data:', { 
          received: !!patterns,
          hourlyPoints: patterns?.hourlyDistribution?.length || 0,
          weekdayPoints: patterns?.weekdayDistribution?.length || 0
        });
        
        if (patterns) {
          setListeningPatterns(patterns);
        } else {
          console.warn('No patterns data received from server action');
        }
      } catch (error) {
        console.error("Error fetching listening patterns:", error);
        setError("Failed to load listening patterns. Please try again later.");
      } finally {
        setIsStatsLoading(false);
      }
    };
    
    loadPatternsData();
  }, [currentTab, userId, filterPeriod, isInitialRender]);

  // Determine overall loading state
  const isLoading = 
    (currentTab === "timeline" && isMainLoading) ||
    (currentTab === "calendar" && isCalendarLoading) ||
    (currentTab === "stats" && isStatsLoading);

  if (!userId) {
    return <LoadingState message="Redirecting to login..." />;
  }

  // Tab-specific loading conditions
  if (currentTab === "timeline" && isMainLoading && !playHistory.length) {
    return <LoadingState message="Loading timeline data..." />;
  }
  
  if (currentTab === "calendar" && isCalendarLoading && !calendarData) {
    return <LoadingState message="Loading calendar data..." />;
  }
  
  if (currentTab === "stats" && isStatsLoading && !listeningPatterns) {
    return <LoadingState message="Loading listening patterns..." />;
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Listening History</h1>
          <p className="text-gray-400">
            Track your story activity and listening patterns
          </p>
        </div>
      </div>
      
      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4 flex items-center">
            <div className="bg-indigo-900/30 p-2 rounded-full mr-4">
              <Play className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Plays</p>
              <p className="text-xl font-bold text-white">
                {listeningStats?.totalPlays || 0}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4 flex items-center">
            <div className="bg-green-900/30 p-2 rounded-full mr-4">
              <Clock className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Listening Time</p>
              <p className="text-xl font-bold text-white">
                {formatDuration(listeningStats?.totalDuration || 0)}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4 flex items-center">
            <div className="bg-amber-900/30 p-2 rounded-full mr-4">
              <Activity className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Current Streak</p>
              <p className="text-xl font-bold text-white">
                {listeningStats?.currentStreak || 0} days
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4 flex items-center">
            <div className="bg-purple-900/30 p-2 rounded-full mr-4">
              <Award className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Longest Streak</p>
              <p className="text-xl font-bold text-white">
                {listeningStats?.longestStreak || 0} days
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-lg mb-6">
          <p>{error}</p>
        </div>
      )}
      
      <HistoryTabs
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        filterPeriod={filterPeriod}
        setFilterPeriod={setFilterPeriod}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        playHistory={playHistory}
        calendarData={calendarData}
        router={router}
        isLoading={isLoading}
        userId={userId}
        listeningPatterns={listeningPatterns}
      />
    </div>
  );
}