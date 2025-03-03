"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, BarChart3 } from "lucide-react";
import { fetchListeningPatterns } from "@/app/dashboard/history/actions";

interface ListeningPatternsData {
  hourlyDistribution: {hour: number, count: number}[];
  weekdayDistribution: {day: string, count: number}[];
}

interface StoryStatisticsProps {
  timeframe: 'week' | 'month' | 'year' | 'all';
  listeningPatterns?: ListeningPatternsData | null;
  userId?: string;
}

export function StoryStatistics({ 
  timeframe,
  listeningPatterns: initialPatterns,
  userId 
}: StoryStatisticsProps) {
  const [listeningPatterns, setListeningPatterns] = useState<ListeningPatternsData | null>(initialPatterns || null);
  const [isLoading, setIsLoading] = useState(!initialPatterns);
  const [error, setError] = useState<string | null>(null);

  // Convert timeframe to server action format
  const getTimeRange = (timeframe: string) => {
    switch (timeframe) {
      case 'week': return '7days';
      case 'month': return '30days';
      case 'year': return '90days';
      default: return 'all';
    }
  };

  // If patterns weren't provided, fetch them
  useEffect(() => {
    if (!userId) return;
    
    // If we already have patterns for this timeframe, don't fetch again
    if (initialPatterns && !isLoading) return;
    
    console.log('StoryStatistics: Fetching patterns for timeframe:', timeframe);
    
    const fetchPatterns = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const timeRange = getTimeRange(timeframe);
        
        // Use server action
        const patterns = await fetchListeningPatterns(timeRange);
        
        console.log('StoryStatistics: Received patterns:', {
          received: !!patterns,
          hourlyData: patterns?.hourlyDistribution?.length || 0,
          weekdayData: patterns?.weekdayDistribution?.length || 0,
        });
        
        if (patterns) {
          setListeningPatterns(patterns);
        } else {
          setError("No listening data available for this time period.");
        }
      } catch (error) {
        console.error("Error fetching listening patterns:", error);
        setError("Failed to load listening insights. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPatterns();
  }, [timeframe, userId, initialPatterns, isLoading]);

  // Helper to determine the maximum value for scaling
  const getMaxValue = (data: {count: number}[]) => {
    return Math.max(...data.map(item => item.count), 1);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gray-900/50 border border-gray-800">
          <CardContent className="p-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
            <p className="text-gray-400">Loading listening patterns...</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border border-gray-800">
          <CardContent className="p-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mb-4"></div>
            <p className="text-gray-400">Loading day patterns...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-gray-900/50 border border-gray-800">
        <CardContent className="p-6 text-center">
          <p className="text-gray-400">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!listeningPatterns) {
    return (
      <Card className="bg-gray-900/50 border border-gray-800">
        <CardContent className="p-6 text-center">
          <p className="text-gray-400">No listening data available for this time period.</p>
        </CardContent>
      </Card>
    );
  }

  // Make sure data is properly sorted
  const sortedHourlyData = [...listeningPatterns.hourlyDistribution].sort((a, b) => a.hour - b.hour);
  
  // Sort weekday data to start with Monday
  const weekdayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const sortedWeekdayData = [...listeningPatterns.weekdayDistribution].sort((a, b) => {
    return weekdayOrder.indexOf(a.day) - weekdayOrder.indexOf(b.day);
  });

  // Get maximum values for scaling
  const maxHourlyCount = getMaxValue(sortedHourlyData);
  const maxWeekdayCount = getMaxValue(sortedWeekdayData);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Time of Day Listening */}
      <Card className="bg-gray-900/50 border border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center text-lg">
            <Clock className="h-5 w-5 mr-2 text-indigo-400" />
            Listening Hours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {/* Visualization of hourly distribution */}
            <div className="flex h-full items-end space-x-1">
              {sortedHourlyData.map((item) => {
                const percentage = Math.max(
                  5,
                  (item.count / maxHourlyCount) * 100
                );
                
                // Format hour for display (12-hour format)
                const hourDisplay = item.hour % 12 === 0 ? 12 : item.hour % 12;
                const amPm = item.hour < 12 ? 'am' : 'pm';
                
                return (
                  <div 
                    key={item.hour} 
                    className="flex-1 flex flex-col items-center"
                  >
                    <div 
                      className="w-full bg-indigo-700/80 rounded-t-sm hover:bg-indigo-600 transition-colors"
                      style={{ height: `${percentage}%` }}
                    ></div>
                    <div className="text-xs text-gray-400 mt-2 whitespace-nowrap">
                      {hourDisplay}{amPm}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {item.count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Day of Week Listening */}
      <Card className="bg-gray-900/50 border border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center text-lg">
            <BarChart3 className="h-5 w-5 mr-2 text-green-400" />
            Listening Days
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {/* Visualization of weekday distribution */}
            <div className="flex h-full items-end space-x-2">
              {sortedWeekdayData.map((item) => {
                const percentage = Math.max(
                  5,
                  (item.count / maxWeekdayCount) * 100
                );
                
                return (
                  <div 
                    key={item.day} 
                    className="flex-1 flex flex-col items-center"
                  >
                    <div 
                      className="w-full bg-green-700/80 rounded-t-sm hover:bg-green-600 transition-colors"
                      style={{ height: `${percentage}%` }}
                    ></div>
                    <div className="text-xs text-gray-400 mt-2">
                      {item.day.substring(0, 3)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {item.count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}