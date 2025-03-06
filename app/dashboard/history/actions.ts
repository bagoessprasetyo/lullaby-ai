'use server';

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth.config";; // Adjust path as needed
import { 
  getListeningStats, 
  getPlayHistory, 
  getCalendarData,
  getListeningPatterns,
  PlayHistoryEntry,
  ListeningStats,
  CalendarData
} from "@/lib/services/history-service";

// Server action to fetch play history
export async function fetchPlayHistory(
  timeRange: '7days' | '30days' | '90days' | 'all', 
  searchQuery: string = ''
): Promise<{ history: PlayHistoryEntry[], count: number }> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  
  if (!userId) {
    return { history: [], count: 0 };
  }
  
  try {
    return await getPlayHistory(userId, { timeRange, searchQuery });
  } catch (error) {
    console.error("Error fetching play history:", error);
    return { history: [], count: 0 };
  }
}

// Server action to fetch listening stats
export async function fetchListeningStats(
  timeRange: '7days' | '30days' | '90days' | 'all'
): Promise<ListeningStats | null> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  
  if (!userId) {
    return null;
  }
  
  try {
    return await getListeningStats(userId, timeRange);
  } catch (error) {
    console.error("Error fetching listening stats:", error);
    return null;
  }
}

// Server action to fetch calendar data
export async function fetchCalendarData(
  timeRange: '6months' | 'year' | 'all'
): Promise<CalendarData | null> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  
  if (!userId) {
    return null;
  }
  
  try {
    return await getCalendarData(userId, timeRange);
  } catch (error) {
    console.error("Error fetching calendar data:", error);
    return null;
  }
}

// Server action to fetch listening patterns
export async function fetchListeningPatterns(
  timeRange: '7days' | '30days' | '90days' | 'all'
): Promise<{
  hourlyDistribution: {hour: number, count: number}[];
  weekdayDistribution: {day: string, count: number}[];
} | null> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  
  if (!userId) {
    return null;
  }
  
  try {
    return await getListeningPatterns(userId, timeRange);
  } catch (error) {
    console.error("Error fetching listening patterns:", error);
    return null;
  }
}