// lib/services/history-service.ts
import { supabase } from '@/lib/supabase';

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
    images: {
      storage_path: string;
    }[];
  };
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

/**
 * Get play history for a user with optional filtering
 */
export async function getPlayHistory(
  userId: string,
  options: {
    timeframe?: '7days' | '30days' | '90days' | 'all';
    storyId?: string;
    searchQuery?: string;
    completed?: boolean;
    page?: number;
    pageSize?: number;
  } = {}
) {
  const {
    timeframe = '30days',
    storyId,
    searchQuery,
    completed,
    page = 1,
    pageSize = 20
  } = options;

  let query = supabase
    .from('play_history')
    .select(`
      *,
      story:stories(
        title,
        duration,
        language,
        images(storage_path)
      )
    `, { count: 'exact' })
    .eq('user_id', userId)
    .order('played_at', { ascending: false });

  // Apply time filter
  if (timeframe !== 'all') {
    const now = new Date();
    let startDate = new Date();
    
    if (timeframe === '7days') {
      startDate.setDate(now.getDate() - 7);
    } else if (timeframe === '30days') {
      startDate.setDate(now.getDate() - 30);
    } else if (timeframe === '90days') {
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

  // Apply search query to story title
  if (searchQuery && searchQuery.trim()) {
    // This requires a join with the stories table, which we're already doing
    query = query.filter('story.title', 'ilike', `%${searchQuery}%`);
  }

  // Apply pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching play history:", error);
    return { history: [], count: 0 };
  }

  return {
    history: data as PlayHistory[],
    count: count || 0
  };
}

/**
 * Record a new play history entry
 */
export async function recordPlayStart(
  userId: string, 
  storyId: string
) {
  const { data, error } = await supabase
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
  await supabase
    .from('stories')
    .update({ play_count: supabase.rpc('increment') })
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
  const { data, error } = await supabase
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
  timeframe: '7days' | '30days' | '90days' | 'all' = '30days'
): Promise<ListeningStats> {
  // Get plays count
  const playsQuery = supabase
    .from('play_history')
    .select('id', { count: 'exact' })
    .eq('user_id', userId);

  // Apply time filter
  if (timeframe !== 'all') {
    const now = new Date();
    let startDate = new Date();
    
    if (timeframe === '7days') {
      startDate.setDate(now.getDate() - 7);
    } else if (timeframe === '30days') {
      startDate.setDate(now.getDate() - 30);
    } else if (timeframe === '90days') {
      startDate.setDate(now.getDate() - 90);
    }
    
    playsQuery.gte('played_at', startDate.toISOString());
  }

  const { count: totalPlays } = await playsQuery;

  // Calculate total duration (need to join with stories table)
  const { data: playsWithDuration } = await supabase
    .from('play_history')
    .select(`
      id,
      played_at,
      progress_percentage,
      completed,
      stories(duration)
    `)
    .eq('user_id', userId);

  // Calculate total listening time based on progress percentage and story duration
  let totalDuration = 0;
  if (playsWithDuration) {
    totalDuration = playsWithDuration.reduce((sum, play) => {
      const storyDuration = play.stories?.[0]?.duration || 0;
      // If completed, count full duration, otherwise use progress percentage
      const playDuration = play.completed 
        ? storyDuration 
        : (storyDuration * (play.progress_percentage / 100));
      
      return sum + playDuration;
    }, 0);
  }

  // Find most played story
  // Instead of using group, we'll fetch all play history and count them in JavaScript
  const { data: allPlays } = await supabase
    .from('play_history')
    .select('story_id')
    .eq('user_id', userId);
  
  // Count plays per story
  const storyPlayCounts: {[storyId: string]: number} = {};
  allPlays?.forEach(play => {
    if (!storyPlayCounts[play.story_id]) {
      storyPlayCounts[play.story_id] = 0;
    }
    storyPlayCounts[play.story_id]++;
  });
  
  // Find the story with the most plays
  let topStoryId = null;
  let topCount = 0;
  
  Object.entries(storyPlayCounts).forEach(([storyId, count]) => {
    if (count > topCount) {
      topCount = count;
      topStoryId = storyId;
    }
  });
  
  // Get details of the top story
  let mostPlayedStory = null;
  if (topStoryId) {
    const { data: storyData } = await supabase
      .from('stories')
      .select('id, title, images(storage_path)')
      .eq('id', topStoryId)
      .single();
    
    if (storyData) {
      const imagePath = storyData.images && storyData.images.length > 0 
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${storyData.images[0].storage_path}`
        : "https://via.placeholder.com/300x300?text=No+Image";
      
      mostPlayedStory = {
        id: storyData.id,
        title: storyData.title || 'Unknown Story',
        coverImage: imagePath,
        playCount: topCount
      };
    }
  }

  // Calculate average plays per day
  const timeInDays = timeframe === '7days' ? 7 : 
                     timeframe === '30days' ? 30 : 
                     timeframe === '90days' ? 90 : 
                     // If "all", use days since first play or 30 as fallback
                     30; 

  const averagePerDay = totalPlays ? (totalPlays / timeInDays) : 0;

  // Calculate streaks
  // This is complex and would require a more detailed algorithm
  // For now, we'll return placeholder values
  // In a real implementation, you'd analyze the play dates to find consecutive days
  const currentStreak = 3; // Placeholder
  const longestStreak = 7; // Placeholder

  return {
    totalPlays: totalPlays || 0,
    totalDuration,
    averagePerDay,
    currentStreak,
    longestStreak,
    mostPlayedStory
  };
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
  
  if (timeframe === '30days') {
    startDate.setDate(now.getDate() - 30);
  } else if (timeframe === '90days') {
    startDate.setDate(now.getDate() - 90);
  } else {
    startDate.setDate(now.getDate() - 365);
  }

  // Get all plays in the timeframe
  const { data, error } = await supabase
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
 * Calculate user streak information
 */
export async function getUserStreak(userId: string) {
  // Get all play history dates, sorted by date
  const { data, error } = await supabase
    .from('play_history')
    .select('played_at')
    .eq('user_id', userId)
    .order('played_at', { ascending: false });

  if (error) {
    console.error("Error fetching play history for streak:", error);
    return { currentStreak: 0, longestStreak: 0, lastListenedDate: null };
  }

  // Convert to array of dates (YYYY-MM-DD strings)
  const playDates = data?.map(play => {
    const date = new Date(play.played_at);
    return date.toISOString().split('T')[0];
  }) || [];

  // Remove duplicates (we only care if they played on a given day, not how many times)
  const uniqueDates = [...new Set(playDates)];
  
  if (uniqueDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastListenedDate: null };
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
}

/**
 * Get listening patterns by time of day and day of week
 */
export async function getListeningPatterns(userId: string) {
  const { data, error } = await supabase
    .from('play_history')
    .select('played_at')
    .eq('user_id', userId);

  if (error) {
    console.error("Error fetching listening patterns:", error);
    return { hourly: [], weekly: [] };
  }

  // Initialize counters
  const hourlyDistribution: { [hour: number]: number } = {};
  const weekdayDistribution: { [day: number]: number } = {};

  // Initialize all hours and days with 0
  for (let i = 0; i < 24; i++) {
    hourlyDistribution[i] = 0;
  }
  
  for (let i = 0; i < 7; i++) {
    weekdayDistribution[i] = 0;
  }

  // Count plays by hour and day
  data?.forEach(play => {
    const playDate = new Date(play.played_at);
    const hour = playDate.getHours();
    const day = playDate.getDay(); // 0 = Sunday, 6 = Saturday
    
    hourlyDistribution[hour] += 1;
    weekdayDistribution[day] += 1;
  });

  // Convert to arrays
  const hourly = Object.entries(hourlyDistribution)
    .map(([hour, count]) => ({ hour: parseInt(hour), count }))
    .filter(item => item.count > 0); // Only include hours with plays

  const weekly = Object.entries(weekdayDistribution)
    .map(([day, count]) => ({ 
      day: parseInt(day), 
      count,
      name: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][parseInt(day)]
    }));

  return { hourly, weekly };
}