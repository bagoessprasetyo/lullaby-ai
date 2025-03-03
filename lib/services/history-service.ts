// lib/services/history-service.ts
import { getAdminClient, supabase } from '@/lib/supabase';

export type PlayHistory = {
  id: string;
  user_id: string;
  story_id: string;
  played_at: string;
  completed: boolean;
  progress_percentage: number;
  story?: {
    title: string;
    duration: number;
    language: string;
    theme?: string;
    images: {
      storage_path: string;
    }[];
  };
};

// Format used for components displaying play history entries
export type PlayHistoryEntry = {
  id: string;
  storyId: string;
  storyTitle: string;
  coverImage: string;
  playedAt: Date;
  duration: number; // in seconds
  completed: boolean;
  progress?: number; // 0-100
  language?: string;
  theme?: string;
};

export type ListeningStats = {
  totalPlays: number;
  totalDuration: number; // in seconds
  averagePerDay: number;
  currentStreak: number;
  longestStreak: number;
  mostPlayedStory: {
    id: string;
    title: string;
    coverImage: string;
    playCount: number;
  } | null;
};

export type ActivityDay = {
  date: Date;
  count: number;
};

export type CalendarData = {
  maxCount: number;
  days: ActivityDay[];
};

/**
 * Get play history for a user with optional filtering
 */
export async function getPlayHistory(
  userId: string,
  options: {
    timeRange?: '7days' | '30days' | '90days' | 'all';
    storyId?: string;
    searchQuery?: string;
    completed?: boolean;
    limit?: number;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<{ history: PlayHistoryEntry[], count: number }> {
  const {
    timeRange = '30days',
    storyId,
    searchQuery,
    completed,
    limit = 100,
    page = 1,
    pageSize = 20
  } = options;

  try {

    const client = typeof window === 'undefined' ? getAdminClient() : supabase;
    
    let query = client
      .from('play_history')
      .select(`
        *,
        story:stories(
          id,
          title,
          duration,
          language,
          theme,
          images(storage_path)
        )
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('played_at', { ascending: false });

    // Apply time filter
    if (timeRange !== 'all') {
      const now = new Date();
      let startDate = new Date();
      
      if (timeRange === '7days') {
        startDate.setDate(now.getDate() - 7);
      } else if (timeRange === '30days') {
        startDate.setDate(now.getDate() - 30);
      } else if (timeRange === '90days') {
        startDate.setDate(now.getDate() - 90);
      }
      
      query = query.gte('played_at', startDate.toISOString());
    }

    // Filter by story if provided
    if (storyId) {
      query = query.eq('story_id', storyId);
    }

    // Filter by completion status if specified
    if (completed !== undefined) {
      query = query.eq('completed', completed);
    }

    // Apply search query to story title if provided
    if (searchQuery && searchQuery.trim()) {
      query = query.textSearch('story.title', searchQuery, {
        config: 'english',
        type: 'websearch'
      });
    }

    // Apply limit or pagination
    if (limit && !pageSize) {
      query = query.limit(limit);
    } else {
      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;
    console.log('play historuyyyyy', data)
    if (error) {
      console.error("Error fetching play history:", error);
      return { history: [], count: 0 };
    }

    // Transform to PlayHistoryEntry format
    const formattedHistory: PlayHistoryEntry[] = (data as PlayHistory[]).map(entry => {
      const storyData = entry.story as any;
      const defaultCoverImage = "https://via.placeholder.com/300x300?text=No+Image";
      
      // Get cover image from the first image if available
      let coverImage = defaultCoverImage;
      if (storyData && storyData.images && storyData.images.length > 0) {
        coverImage = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${storyData.images[0].storage_path}`;
      }
      
      return {
        id: entry.id,
        storyId: entry.story_id,
        storyTitle: storyData?.title || 'Unknown Story',
        coverImage,
        playedAt: new Date(entry.played_at),
        duration: storyData?.duration || 0,
        completed: entry.completed,
        progress: entry.progress_percentage,
        language: storyData?.language,
        theme: storyData?.theme
      };
    });
    
    return {
      history: formattedHistory,
      count: count || 0
    };
  } catch (error) {
    console.error("Error in getPlayHistory:", error);
    return { history: [], count: 0 };
  }
}

/**
 * Record a new play history entry
 */
export async function recordPlayStart(
  userId: string, 
  storyId: string
) {
  const client = typeof window === 'undefined' ? getAdminClient() : supabase;
  const { data, error } = await client
    .from('play_history')
    .insert({
      user_id: userId,
      story_id: storyId,
      played_at: new Date().toISOString(),
      completed: false,
      progress_percentage: 0
    })
    .select()
    .single();

  if (error) {
    console.error("Error recording play start:", error);
    return null;
  }

  // Also increment the play count on the story
  await client
    .from('stories')
    .update({ play_count: client.rpc('increment') })
    .eq('id', storyId);

  return data;
}

/**
 * Update play progress
 */
export async function updatePlayProgress(
  playId: string,
  progressPercentage: number,
  completed: boolean = false
) {
  const client = typeof window === 'undefined' ? getAdminClient() : supabase;
  const { data, error } = await client
    .from('play_history')
    .update({
      progress_percentage: progressPercentage,
      completed: completed
    })
    .eq('id', playId)
    .select()
    .single();

  if (error) {
    console.error("Error updating play progress:", error);
    return null;
  }

  return data;
}

/**
 * Get listening statistics for a user
 */
export async function getListeningStats(
  userId: string,
  timeRange: '7days' | '30days' | '90days' | 'all' = '30days'
): Promise<ListeningStats> {
  try {
    // Get plays count
    const client = typeof window === 'undefined' ? getAdminClient() : supabase;
    const playsQuery = client
      .from('play_history')
      .select('id', { count: 'exact' })
      .eq('user_id', userId);

    // Apply time filter
    if (timeRange !== 'all') {
      const now = new Date();
      let startDate = new Date();
      
      if (timeRange === '7days') {
        startDate.setDate(now.getDate() - 7);
      } else if (timeRange === '30days') {
        startDate.setDate(now.getDate() - 30);
      } else if (timeRange === '90days') {
        startDate.setDate(now.getDate() - 90);
      }
      
      playsQuery.gte('played_at', startDate.toISOString());
    }

    const { count: totalPlays, error: countError } = await playsQuery;

    if (countError) {
      console.error("Error counting plays:", countError);
      return {
        totalPlays: 0,
        totalDuration: 0,
        averagePerDay: 0,
        currentStreak: 0,
        longestStreak: 0,
        mostPlayedStory: null
      };
    }

    // Calculate total duration (need to join with stories table)
    const { data: playsWithDuration, error: durationError } = await client
      .from('play_history')
      .select(`
        id,
        played_at,
        progress_percentage,
        completed,
        stories(id, duration)
      `)
      .eq('user_id', userId);

    if (durationError) {
      console.error("Error fetching play durations:", durationError);
    }

    // Calculate total listening time based on progress percentage and story duration
    let totalDuration = 0;
    if (playsWithDuration) {
      totalDuration = playsWithDuration.reduce((sum, play) => {
        // Handle stories properly based on whether it's an array or object
        const storyData = Array.isArray(play.stories) ? play.stories[0] : play.stories;
        const storyDuration = storyData?.duration || 0;
        
        // If completed, count full duration, otherwise use progress percentage
        const playDuration = play.completed 
          ? storyDuration 
          : (storyDuration * (play.progress_percentage / 100));
        
        return sum + playDuration;
      }, 0);
    }

    // Find most played story using the optimized approach
    const { data: playCountsByStory, error: groupError } = await client
      .from('play_history')
      .select('story_id, stories(id, title, images(storage_path))')
      .eq('user_id', userId)
      .order('story_id', { ascending: true });

    if (groupError) {
      console.error("Error fetching play counts by story:", groupError);
    }

    // Count plays per story
    const storyPlayCounts: {[storyId: string]: {count: number, title: string, image?: string}} = {};
    if (playCountsByStory) {
      playCountsByStory.forEach(play => {
        if (!storyPlayCounts[play.story_id]) {
          const storyData = play.stories as any;
          const imagePath = storyData?.images && storyData.images.length > 0 
            ? storyData.images[0].storage_path
            : null;
          
          storyPlayCounts[play.story_id] = {
            count: 0,
            title: storyData?.title || 'Unknown Story',
            image: imagePath
          };
        }
        storyPlayCounts[play.story_id].count++;
      });
    }
    
    // Find the story with the most plays
    let mostPlayedStory = null;
    let topCount = 0;
    let topStoryId = '';
    
    Object.entries(storyPlayCounts).forEach(([storyId, data]) => {
      if (data.count > topCount) {
        topCount = data.count;
        topStoryId = storyId;
        
        const imagePath = data.image 
          ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${data.image}`
          : "https://via.placeholder.com/300x300?text=No+Image";
        
        mostPlayedStory = {
          id: storyId,
          title: data.title,
          coverImage: imagePath,
          playCount: data.count
        };
      }
    });

    // Calculate average plays per day
    const timeInDays = timeRange === '7days' ? 7 : 
                      timeRange === '30days' ? 30 : 
                      timeRange === '90days' ? 90 : 
                      // If "all", use days since first play or 30 as fallback
                      30; 

    const averagePerDay = totalPlays ? (totalPlays / timeInDays) : 0;

    // Get streak information
    const { currentStreak, longestStreak } = await getUserStreak(userId);

    return {
      totalPlays: totalPlays || 0,
      totalDuration,
      averagePerDay,
      currentStreak,
      longestStreak,
      mostPlayedStory
    };
  } catch (error) {
    console.error("Error calculating listening stats:", error);
    return {
      totalPlays: 0,
      totalDuration: 0,
      averagePerDay: 0,
      currentStreak: 0,
      longestStreak: 0,
      mostPlayedStory: null
    };
  }
}

/**
 * Get play history grouped by day for calendar view
 */
export async function getPlayHistoryByDay(
  userId: string,
  timeframe: '30days' | '90days' | '365days' = '30days'
) {
  // Calculate the start date based on timeframe
  const now = new Date();
  let startDate = new Date();
  const client = typeof window === 'undefined' ? getAdminClient() : supabase;
  
  if (timeframe === '30days') {
    startDate.setDate(now.getDate() - 30);
  } else if (timeframe === '90days') {
    startDate.setDate(now.getDate() - 90);
  } else {
    startDate.setDate(now.getDate() - 365);
  }

  // Get all plays in the timeframe
  const { data, error } = await client
    .from('play_history')
    .select(`
      id,
      played_at,
      completed,
      stories(duration)
    `)
    .eq('user_id', userId)
    .gte('played_at', startDate.toISOString())
    .order('played_at', { ascending: true });

  if (error) {
    console.error("Error fetching play history by day:", error);
    return [];
  }

  // Group plays by day
  const playsByDay: { [date: string]: { count: number, duration: number } } = {};
  
  data?.forEach(play => {
    // Format date as YYYY-MM-DD
    const playDate = new Date(play.played_at);
    const dateKey = playDate.toISOString().split('T')[0];
    
    if (!playsByDay[dateKey]) {
      playsByDay[dateKey] = { count: 0, duration: 0 };
    }
    
    playsByDay[dateKey].count += 1;
    
    // Add duration if available
    const storyDuration = play.stories?.[0]?.duration || 0;
    const playDuration = play.completed 
      ? storyDuration 
      : (storyDuration * 0.5); // Estimate half duration if not completed
      
    playsByDay[dateKey].duration += playDuration;
  });

  // Convert to array format
  return Object.entries(playsByDay).map(([date, stats]) => ({
    date,
    count: stats.count,
    duration: stats.duration
  }));
}

/**
 * Generate calendar heatmap data for user's listening activity
 */
export async function getCalendarData(
  userId: string,
  timeRange: '6months' | 'year' | 'all' = 'year'
): Promise<CalendarData> {
  try {
    // Determine date range
    const endDate = new Date();
    const startDate = new Date();
    const client = typeof window === 'undefined' ? getAdminClient() : supabase;
    
    if (timeRange === '6months') {
      startDate.setMonth(startDate.getMonth() - 6);
    } else if (timeRange === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    } else {
      // For 'all', go back 2 years as default
      startDate.setFullYear(startDate.getFullYear() - 2);
    }
    
    // Query play history within date range
    const { data, error } = await client
      .from('play_history')
      .select('played_at')
      .eq('user_id', userId)
      .gte('played_at', startDate.toISOString())
      .lte('played_at', endDate.toISOString());
    
    if (error) throw error;
    
    // Count activities per day
    const dayCounts = new Map<string, number>();
    
    data?.forEach(entry => {
      const date = new Date(entry.played_at);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      if (dayCounts.has(dateStr)) {
        dayCounts.set(dateStr, dayCounts.get(dateStr)! + 1);
      } else {
        dayCounts.set(dateStr, 1);
      }
    });
    
    // Generate complete date range
    const days: ActivityDay[] = [];
    let currentDate = new Date(startDate);
    let maxCount = 0;
    
    while (currentDate <= endDate) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      const count = dayCounts.get(dateStr) || 0;
      
      days.push({
        date: new Date(currentDate),
        count
      });
      
      maxCount = Math.max(maxCount, count);
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return { maxCount, days };
  } catch (error) {
    console.error("Error generating calendar data:", error);
    return { maxCount: 0, days: [] };
  }
}

/**
 * Calculate user streak information
 */
export async function getUserStreak(userId: string) {
  try {
    const client = typeof window === 'undefined' ? getAdminClient() : supabase;
    // Get all play history dates, sorted by date
    const { data, error } = await client
      .from('play_history')
      .select('played_at')
      .eq('user_id', userId)
      .order('played_at', { ascending: false });

    if (error) {
      console.error("Error fetching play history for streak:", error);
      return { currentStreak: 0, longestStreak: 0, lastListenedDate: null, streakHistory: [] as boolean[] };
    }

    // Convert to array of dates (YYYY-MM-DD strings)
    const playDates = data?.map(play => {
      const date = new Date(play.played_at);
      return date.toISOString().split('T')[0];
    }) || [];

    // Remove duplicates (we only care if they played on a given day, not how many times)
    const uniqueDates = [...new Set(playDates)];
    
    if (uniqueDates.length === 0) {
      return { currentStreak: 0, longestStreak: 0, lastListenedDate: null, streakHistory: [] as boolean[] };
    }

    // Sort dates in descending order (newest first)
    uniqueDates.sort((a, b) => b.localeCompare(a));

    // Calculate current streak
    let currentStreak = 1; // Start with 1 for the most recent day
    let longestStreak = 1;
    let streakDates = [uniqueDates[0]]; // Keep track of dates in current streak
    
    // Check if most recent play was today
    const today = new Date().toISOString().split('T')[0];
    const hasPlayedToday = uniqueDates[0] === today;
    
    // If not played today, check if played yesterday to continue streak
    if (!hasPlayedToday) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (uniqueDates[0] !== yesterdayStr) {
        // If not played yesterday, streak is broken
        currentStreak = 0;
      }
    }

    // Calculate longest streak by looking for consecutive days
    let tempStreak = 1;
    for (let i = 0; i < uniqueDates.length - 1; i++) {
      const currentDate = new Date(uniqueDates[i]);
      const nextDate = new Date(uniqueDates[i + 1]);
      
      // Check if dates are consecutive (difference of 1 day)
      const diffDays = Math.round((currentDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        tempStreak++;
        
        // If this is part of the current streak, add to streakDates
        if (i < currentStreak) {
          streakDates.push(uniqueDates[i + 1]);
        }
      } else {
        // Streak broken
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    
    // Update longest streak with the last tempStreak value
    longestStreak = Math.max(longestStreak, tempStreak);
    
    // Create a boolean array for the past 7 days (true if listened, false if not)
    const past7Days: boolean[] = [];
    const today2 = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const checkDate = new Date();
      checkDate.setDate(today2.getDate() - i);
      const checkDateStr = checkDate.toISOString().split('T')[0];
      
      past7Days.push(uniqueDates.includes(checkDateStr));
    }

    return {
      currentStreak,
      longestStreak,
      lastListenedDate: uniqueDates[0],
      streakHistory: past7Days
    };
  } catch (error) {
    console.error("Error calculating user streak:", error);
    return { currentStreak: 0, longestStreak: 0, lastListenedDate: null, streakHistory: [] as boolean[] };
  }
}

/**
 * Get last 7 days of listening activity for streak display
 */
export async function getStreakHistory(userId: string): Promise<boolean[]> {
  try {
    const { streakHistory } = await getUserStreak(userId);
    return streakHistory;
  } catch (error) {
    console.error('Error getting streak history:', error);
    return [false, false, false, false, false, false, false]; // Default to no activity
  }
}

/**
 * Get the most recent listening date
 */
export async function getLastListenedDate(userId: string): Promise<Date | null> {
  try {
    const client = typeof window === 'undefined' ? getAdminClient() : supabase;
    const { data, error } = await client
      .from('play_history')
      .select('played_at')
      .eq('user_id', userId)
      .order('played_at', { ascending: false })
      .limit(1);
    
    if (error) throw error;
    
    return data && data.length > 0 ? new Date(data[0].played_at) : null;
  } catch (error) {
    console.error('Error getting last listened date:', error);
    return null;
  }
}

/**
 * Get listening patterns by time of day and day of week
 */
export async function getListeningPatterns(
  userId: string,
  timeRange: '7days' | '30days' | '90days' | 'all' = '30days'
) {
  try {
    const client = typeof window === 'undefined' ? getAdminClient() : supabase;
    // Apply time filter to query
    let query = client
      .from('play_history')
      .select('played_at')
      .eq('user_id', userId);
    
    if (timeRange !== 'all') {
      const now = new Date();
      let startDate = new Date();
      
      if (timeRange === '7days') {
        startDate.setDate(now.getDate() - 7);
      } else if (timeRange === '30days') {
        startDate.setDate(now.getDate() - 30);
      } else if (timeRange === '90days') {
        startDate.setDate(now.getDate() - 90);
      }
      
      query = query.gte('played_at', startDate.toISOString());
    }
    
    const { data, error } = await query;

    if (error) {
      console.error("Error fetching listening patterns:", error);
      return { 
        hourlyDistribution: [],
        weekdayDistribution: []
      };
    }

    // Initialize counters
    const hourlyDistribution: { [hour: number]: number } = {};
    const weekdayDistribution: { [day: string]: number } = {
      'Sunday': 0,
      'Monday': 0,
      'Tuesday': 0,
      'Wednesday': 0,
      'Thursday': 0,
      'Friday': 0,
      'Saturday': 0
    };

    // Count plays by hour and day
    data?.forEach(play => {
      const playDate = new Date(play.played_at);
      const hour = playDate.getHours();
      const dayIndex = playDate.getDay(); // 0 = Sunday, 6 = Saturday
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const day = dayNames[dayIndex];
      
      // Add to hourly distribution
      if (!hourlyDistribution[hour]) {
        hourlyDistribution[hour] = 0;
      }
      hourlyDistribution[hour] += 1;
      
      // Add to weekday distribution
      weekdayDistribution[day] += 1;
    });

    // Format for return
    const hourlyDistributionArray = Object.entries(hourlyDistribution)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .filter(item => item.count > 0) // Only include hours with plays
      .sort((a, b) => a.hour - b.hour);

    const weekdayDistributionArray = Object.entries(weekdayDistribution)
      .map(([day, count]) => ({ day, count }));

    return {
      hourlyDistribution: hourlyDistributionArray,
      weekdayDistribution: weekdayDistributionArray
    };
  } catch (error) {
    console.error("Error getting listening patterns:", error);
    return { 
      hourlyDistribution: [],
      weekdayDistribution: []
    };
  }
}