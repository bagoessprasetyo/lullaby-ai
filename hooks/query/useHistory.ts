// hooks/query/useHistory.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';
import {
  getPlayHistory,
  getListeningStats,
  getPlayHistoryByDay,
  getUserStreak,
  getListeningPatterns,
  recordPlayStart,
  updatePlayProgress,
  getCalendarData
} from '@/lib/services/history-service';

// Key factory for React Query cache
const historyKeys = {
  all: ['history'] as const,
  playHistory: (userId: string, options?: any) => [...historyKeys.all, 'playHistory', userId, options] as const,
  stats: (userId: string, timeRange?: string) => [...historyKeys.all, 'stats', userId, timeRange] as const,
  byDay: (userId: string, timeframe?: string) => [...historyKeys.all, 'byDay', userId, timeframe] as const,
  streak: (userId: string) => [...historyKeys.all, 'streak', userId] as const,
  patterns: (userId: string, timeRange?: string) => [...historyKeys.all, 'patterns', userId, timeRange] as const,
  calendar: (userId: string, timeRange?: string) => [...historyKeys.all, 'calendar', userId, timeRange] as const,
};

// Hook to fetch play history with filters
export function usePlayHistory(options: {
  timeRange?: '7days' | '30days' | '90days' | 'all';
  storyId?: string;
  searchQuery?: string;
  completed?: boolean;
  limit?: number;
  page?: number;
  pageSize?: number;
} = {}) {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: historyKeys.playHistory(userId || '', options),
    queryFn: () => getPlayHistory(userId || '', options),
    enabled: !!userId,
    placeholderData: undefined, // Keep previous data while fetching new data (pagination)
  });
}

// Hook to fetch listening stats
export function useListeningStats(timeRange: '7days' | '30days' | '90days' | 'all' = '30days') {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: historyKeys.stats(userId || '', timeRange),
    queryFn: () => getListeningStats(userId || '', timeRange),
    enabled: !!userId,
  });
}

// Hook to fetch play history by day for calendar view
export function usePlayHistoryByDay(timeframe: '30days' | '90days' | '365days' = '30days') {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: historyKeys.byDay(userId || '', timeframe),
    queryFn: () => getPlayHistoryByDay(userId || '', timeframe),
    enabled: !!userId,
  });
}

// Hook to fetch calendar heatmap data
export function useCalendarData(timeRange: '6months' | 'year' | 'all' = 'year') {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: historyKeys.calendar(userId || '', timeRange),
    queryFn: () => getCalendarData(userId || '', timeRange),
    enabled: !!userId,
  });
}

// Hook to fetch user streak information
export function useUserStreak() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: historyKeys.streak(userId || ''),
    queryFn: () => getUserStreak(userId || ''),
    enabled: !!userId,
    // Refresh every hour to keep streak updated
    refetchInterval: 60 * 60 * 1000,
  });
}

// Hook to fetch listening patterns
export function useListeningPatterns(timeRange: '7days' | '30days' | '90days' | 'all' = '30days') {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: historyKeys.patterns(userId || '', timeRange),
    queryFn: () => getListeningPatterns(userId || '', timeRange),
    enabled: !!userId,
  });
}

// Mutation hook to record play start
export function useRecordPlayStart() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  return useMutation({
    mutationFn: ({ storyId }: { storyId: string }) => 
      recordPlayStart(userId || '', storyId),
    onSuccess: () => {
      // Invalidate related queries
      if (userId) {
        queryClient.invalidateQueries({ queryKey: historyKeys.all });
      }
    },
  });
}

// Mutation hook to update play progress
export function useUpdatePlayProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      playId, 
      progressPercentage, 
      completed = false 
    }: { 
      playId: string; 
      progressPercentage: number; 
      completed?: boolean 
    }) => updatePlayProgress(playId, progressPercentage, completed),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: historyKeys.all });
    },
  });
}

// Combined hook to provide all history functionality
export function useHistory() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const [filterPeriod, setFilterPeriod] = useState<'7days' | '30days' | '90days' | 'all'>('30days');
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTab, setCurrentTab] = useState("timeline");
  
  // Use React Query hooks based on current state
  const {
    data: playsData = { history: [], count: 0 },
    isLoading: isLoadingPlays,
    refetch: refetchPlays
  } = usePlayHistory({
    timeRange: filterPeriod,
    searchQuery,
  });
  
  const {
    data: stats,
    isLoading: isLoadingStats,
    refetch: refetchStats
  } = useListeningStats(filterPeriod);
  
  const {
    data: calendarData = [],
    isLoading: isLoadingCalendar,
    refetch: refetchCalendar
  } = usePlayHistoryByDay(
    filterPeriod === '7days' ? '30days' : 
    filterPeriod === 'all' ? '365days' : filterPeriod as any
  );
  
  const {
    data: calendarHeatmapData,
    isLoading: isLoadingHeatmap,
    refetch: refetchHeatmap
  } = useCalendarData(
    filterPeriod === '7days' || filterPeriod === '30days' ? '6months' :
    filterPeriod === '90days' ? 'year' : 'all'
  );
  
  const {
    data: streakData = { currentStreak: 0, longestStreak: 0, lastListenedDate: null, streakHistory: [] },
    isLoading: isLoadingStreak,
    refetch: refetchStreak
  } = useUserStreak();
  
  const {
    data: patternsData = { hourlyDistribution: [], weekdayDistribution: [] },
    isLoading: isLoadingPatterns,
    refetch: refetchPatterns
  } = useListeningPatterns(filterPeriod);
  
  // Function to refresh all history data
  const refreshHistory = useCallback(() => {
    refetchPlays();
    refetchStats();
    refetchCalendar();
    refetchHeatmap();
    refetchStreak();
    refetchPatterns();
  }, [refetchPlays, refetchStats, refetchCalendar, refetchHeatmap, refetchStreak, refetchPatterns]);
  
  // Fetch appropriate data when tab or filters change
  useEffect(() => {
    if (status === 'authenticated') {
      if (currentTab === 'stats') {
        refetchStats();
        refetchPatterns();
      } else if (currentTab === 'calendar') {
        refetchCalendar();
        refetchHeatmap();
      }
      
      // Always fetch streak data
      refetchStreak();
    }
  }, [currentTab, filterPeriod, searchQuery, status, 
      refetchStats, refetchPatterns, refetchCalendar, refetchHeatmap, refetchStreak]);
  
  const isLoading = isLoadingPlays || isLoadingStats || isLoadingCalendar || 
                   isLoadingHeatmap || isLoadingStreak || isLoadingPatterns;
  
  return {
    isLoading,
    plays: (playsData as { history: any[] }).history,
    stats,
    calendarData,
    calendarHeatmapData,
    streak: {
      currentStreak: streakData.currentStreak,
      longestStreak: streakData.longestStreak,
      lastListenedDate: streakData.lastListenedDate,
      streakHistory: streakData.streakHistory
    },
    listeningPatterns: patternsData,
    totalCount: (playsData as { count: number }).count,
    filterPeriod,
    setFilterPeriod,
    searchQuery,
    setSearchQuery,
    currentTab,
    setCurrentTab,
    refreshHistory
  };
}