"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  Activity,
  Clock,
  Calendar,
  ChevronRight,
  RefreshCw,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ClientDate } from "@/components/client-date";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  YAxis
} from "recharts";

import { TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

interface ListeningInsightsProps {
  stats?: {
    totalPlays: number;
    totalDuration: number;
    averagePerDay: number;
    mostPlayedStory?: {
      id: string;
      title: string;
      coverImage: string;
      playCount: number;
    } | null;
  };
  streak?: {
    currentStreak: number;
    longestStreak: number;
    lastListenedDate: string | null;
    streakHistory: boolean[];
  };
  listeningPatterns?: {
    hourlyDistribution: { hour: number; count: number }[];
    weekdayDistribution: { day: string; count: number }[];
  };
  calendarData?: {
    date: string;
    count: number;
    duration: number;
  }[];
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
  timeRange?: '7days' | '30days' | '90days' | 'all';
  onTimeRangeChange?: (timeRange: '7days' | '30days' | '90days' | 'all') => void;
}

// Helper function to format minutes
const formatMinutes = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

// Helper to get the day name
const getDayName = (dayIndex: number): string => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[dayIndex % 7];
};

// Component for listening streak visualization
const StreakCalendar = ({ streakHistory }: { streakHistory: boolean[] }) => {
  const today = new Date();
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  
  return (
    <div className="flex justify-center space-x-1 mb-4">
      {streakHistory.map((active, i) => {
        // Calculate the date for this position
        const dayDate = new Date(today);
        dayDate.setDate(today.getDate() - (6 - i));
        
        // Check if it's today
        const isToday = i === 6;
        
        return (
          <div 
            key={i}
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              active 
                ? isToday 
                  ? 'bg-indigo-500 text-white ring-2 ring-indigo-300 ring-opacity-50' 
                  : 'bg-indigo-600 text-white'
                : isToday
                  ? 'bg-gray-800 text-gray-400 ring-2 ring-gray-700 ring-opacity-50'
                  : 'bg-gray-800 text-gray-500'
            }`}
            title={`${getDayName(dayDate.getDay())}: ${active ? 'Listened' : 'No activity'}`}
          >
            {days[i]}
          </div>
        );
      })}
    </div>
  );
};

// Time of day activity heatmap
const HourlyActivityChart = ({ 
  hourlyDistribution,
  maxValue = 10
}: { 
  hourlyDistribution: { hour: number; count: number }[],
  maxValue?: number
}) => {
  return (
    <div className="h-16 flex items-end space-x-0.5">
      {Array.from({ length: 24 }).map((_, hour) => {
        const hourData = hourlyDistribution.find(h => h.hour === hour);
        const count = hourData?.count || 0;
        const height = maxValue ? Math.max((count / maxValue) * 100, 5) : 5;
        
        // Determine time period for styling
        const isEvening = hour >= 18 && hour <= 23;
        const isNight = hour >= 0 && hour <= 5;
        const isMorning = hour >= 6 && hour <= 11;
        const isAfternoon = hour >= 12 && hour <= 17;
        
        let barColor = "bg-indigo-600";
        if (isEvening) barColor = "bg-indigo-700";
        if (isNight) barColor = "bg-indigo-900";
        if (isMorning) barColor = "bg-indigo-500";
        if (isAfternoon) barColor = "bg-indigo-600";
        
        return (
          <div 
            key={hour}
            className={`flex-1 ${barColor} rounded-t-sm relative group`}
            style={{ 
              height: `${height}%`,
              opacity: maxValue ? 0.3 + (count / maxValue) * 0.7 : 0.3
            }}
          >
            {/* Tooltip on hover */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-auto min-w-20 bg-gray-800 text-white text-xs rounded py-1 px-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {hour === 0 ? '12am' : hour === 12 ? '12pm' : hour > 12 ? `${hour-12}pm` : `${hour}am`}
              <br />
              {count} {count === 1 ? 'story' : 'stories'}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export function ListeningInsights({
  stats = {
    totalPlays: 0,
    totalDuration: 0,
    averagePerDay: 0,
    mostPlayedStory: null
  },
  streak = {
    currentStreak: 0,
    longestStreak: 0,
    lastListenedDate: null,
    streakHistory: [false, false, false, false, false, false, false]
  },
  listeningPatterns = {
    hourlyDistribution: [],
    weekdayDistribution: []
  },
  calendarData = [],
  isLoading = false,
  onRefresh,
  className = "",
  timeRange = '30days',
  onTimeRangeChange
}: ListeningInsightsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Calculate max count for the hourly chart
  const maxCount = Math.max(
    ...listeningPatterns.hourlyDistribution.map(h => h.count || 0),
    1
  );
  
  // Format data for weekly distribution chart
  const weekdayData = [...listeningPatterns.weekdayDistribution];
  
  // Sort weekday data to start with Monday
  weekdayData.sort((a, b) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days.indexOf(a.day) - days.indexOf(b.day);
  });
  
  // Format data for calendar view
  const formattedCalendarData = calendarData.map(day => ({
    date: new Date(day.date).toLocaleDateString(),
    count: day.count,
    duration: Math.round(day.duration / 60) // Convert to minutes
  }));

  // Handle refresh click
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };
  
  // Handle time range change
  const handleTimeRangeChange = (range: '7days' | '30days' | '90days' | 'all') => {
    if (onTimeRangeChange) {
      onTimeRangeChange(range);
    }
  };

  return (
    <Card className={`bg-gray-900/50 border-gray-800 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium text-white flex items-center">
          <Activity className="mr-2 h-5 w-5 text-indigo-400" />
          Listening Insights
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Tabs 
            value={timeRange} 
            onValueChange={(value: string) => handleTimeRangeChange(value as any)}
            className="mr-2"
          >
            <TabsList className="h-8 bg-gray-800 border border-gray-700">
              <TabsTrigger value="7days" className="text-xs h-6 px-2">Week</TabsTrigger>
              <TabsTrigger value="30days" className="text-xs h-6 px-2">Month</TabsTrigger>
              <TabsTrigger value="90days" className="text-xs h-6 px-2">3 Months</TabsTrigger>
              <TabsTrigger value="all" className="text-xs h-6 px-2">All</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefresh}
            className="text-gray-400 hover:text-white h-8 w-8 p-0"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="sr-only">{isLoading ? 'Refreshing...' : 'Refresh'}</span>
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pb-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-gray-800/50 border border-gray-700 mb-4">
            <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
            <TabsTrigger value="patterns" className="flex-1">Patterns</TabsTrigger>
            <TabsTrigger value="trends" className="flex-1">Trends</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-0 space-y-4">
            {/* Key Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">Total Stories</p>
                <p className="text-2xl font-bold text-white">{stats.totalPlays || 0}</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">Total Time</p>
                <p className="text-2xl font-bold text-white">
                  {formatMinutes(Math.floor((stats.totalDuration || 0) / 60))}
                </p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">Current Streak</p>
                <p className="text-2xl font-bold text-white">{streak.currentStreak || 0}</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">Stories/Day</p>
                <p className="text-2xl font-bold text-white">{stats.averagePerDay.toFixed(1)}</p>
              </div>
            </div>
            
            {/* Streak Calendar */}
            <div className="bg-gray-800/30 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-400 mb-3 text-center">Your Week</h4>
              <StreakCalendar streakHistory={streak.streakHistory} />
              
              {streak.currentStreak > 0 ? (
                <p className="text-center text-sm text-indigo-400">
                  {streak.currentStreak} day streak! {streak.currentStreak >= streak.longestStreak ? "That's a new record!" : `Keep going for your record of ${streak.longestStreak} days!`}
                </p>
              ) : (
                <p className="text-center text-sm text-gray-400">
                  Listen to a story today to start your streak!
                </p>
              )}
            </div>
            
            {/* Most Played Story */}
            {stats.mostPlayedStory && (
              <div className="bg-gray-800/30 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-400 mb-3">Most Played Story</h4>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 relative rounded overflow-hidden flex-shrink-0">
                    <Image 
                      src={stats.mostPlayedStory.coverImage || '/images/placeholder.jpg'} 
                      alt={stats.mostPlayedStory.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {stats.mostPlayedStory.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      Played {stats.mostPlayedStory.playCount} times
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-shrink-0 border-gray-700"
                    onClick={() => router.push(`/dashboard/stories/${stats.mostPlayedStory?.id}`)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
          
          {/* Patterns Tab */}
          <TabsContent value="patterns" className="mt-0 space-y-4">
            {/* Time of Day Chart */}
            <div className="bg-gray-800/30 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-400 mb-3">Listening by Time of Day</h4>
              <HourlyActivityChart 
                hourlyDistribution={listeningPatterns.hourlyDistribution} 
                maxValue={maxCount}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>12am</span>
                <span>6am</span>
                <span>12pm</span>
                <span>6pm</span>
                <span>12am</span>
              </div>
              
              {/* Best listening time insights */}
              {listeningPatterns.hourlyDistribution.length > 0 && (
                <div className="mt-4 flex items-start">
                  <Clock className="h-4 w-4 text-indigo-400 mt-0.5 mr-2" />
                  <p className="text-xs text-gray-400">
                    You listen to stories most often 
                    <span className="text-indigo-400 font-medium ml-1">
                      {(() => {
                        const bestHour = [...listeningPatterns.hourlyDistribution].sort((a, b) => b.count - a.count)[0]?.hour;
                        if (bestHour === undefined) return "in the evenings";
                        
                        const formattedHour = bestHour === 0 ? '12am' : 
                                             bestHour === 12 ? '12pm' : 
                                             bestHour > 12 ? `${bestHour-12}pm` : 
                                             `${bestHour}am`;
                        
                        return `around ${formattedHour}`;
                      })()}
                    </span>.
                  </p>
                </div>
              )}
            </div>
            
            {/* Day of Week Chart */}
            <div className="bg-gray-800/30 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-400 mb-3">Listening by Day of Week</h4>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekdayData}>
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tickFormatter={(day: string) => day.substring(0, 3)}
                      tick={{ fill: '#9CA3AF' }}
                    />
                    <Tooltip 
                        content={(props: TooltipProps<ValueType, NameType>) => {
                            if (!props.payload || props.payload.length === 0) return null;
                            return (
                            <div className="bg-gray-800 p-2 rounded-md border border-gray-700">
                                <p className="text-white">
                                {props.payload[0]?.payload?.day}: {props.payload[0]?.value} stories
                                </p>
                            </div>
                            );
                        }}
                    />

                    <Bar 
                      dataKey="count" 
                      fill="#6366F1" 
                      radius={[4, 4, 0, 0]} 
                      animationDuration={1000}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* Best day insights */}
              {weekdayData.length > 0 && (
                <div className="mt-2 flex items-start">
                  <Calendar className="h-4 w-4 text-indigo-400 mt-0.5 mr-2" />
                  <p className="text-xs text-gray-400">
                    Your most active day is
                    <span className="text-indigo-400 font-medium ml-1">
                      {weekdayData.sort((a, b) => b.count - a.count)[0]?.day || 'the weekend'}
                    </span>.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Trends Tab */}
          <TabsContent value="trends" className="mt-0 space-y-4">
            {formattedCalendarData.length > 0 ? (
              <>
                {/* Listening Trend Chart */}
                <div className="bg-gray-800/30 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-3">Listening Trend</h4>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={formattedCalendarData}>
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false}
                          tick={{ fill: '#9CA3AF' }}
                          tickFormatter={(date: string | number | Date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false}
                          tick={{ fill: '#9CA3AF' }}
                          width={30}
                        />
                        <Tooltip 
                        content={(props: TooltipProps<ValueType, NameType>) => {
                            if (!props.payload || props.payload.length === 0) return null;
                            return (
                            <div className="bg-gray-800 p-2 rounded-md border border-gray-700">
                                <p className="text-white text-xs mb-1">
                                    {new Date(props.payload?.[0]?.payload.date).toLocaleDateString()}
                                </p>
                                <p className="text-indigo-300 text-xs">
                                    Stories: {props.payload?.[0]?.value}
                                </p>
                                <p className="text-green-300 text-xs">
                                    Minutes: {props.payload?.[1]?.value}
                                </p>
                            </div>
                            );
                        }}
                        />
                        <Line 
                          type="monotone"
                          dataKey="count"
                          stroke="#6366F1"
                          strokeWidth={2}
                          dot={{ r: 2 }}
                          activeDot={{ r: 4 }}
                          animationDuration={1000}
                        />
                        <Line 
                          type="monotone"
                          dataKey="duration"
                          stroke="#4ADE80"
                          strokeWidth={2}
                          dot={{ r: 2 }}
                          activeDot={{ r: 4 }}
                          animationDuration={1000}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Trend insights */}
                  <div className="mt-2 flex items-start">
                    <TrendingUp className="h-4 w-4 text-indigo-400 mt-0.5 mr-2" />
                    <p className="text-xs text-gray-400">
                      {(() => {
                        if (formattedCalendarData.length < 2) return "Start listening more to see your trends!";
                        
                        // Calculate trend
                        const firstCount = formattedCalendarData[0].count;
                        const lastCount = formattedCalendarData[formattedCalendarData.length - 1].count;
                        const change = lastCount - firstCount;
                        
                        if (change > 2) return "Your listening is trending upward. Great job!";
                        if (change < -2) return "Your listening has been decreasing recently.";
                        return "Your listening has been consistent lately.";
                      })()}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-gray-800/30 rounded-lg p-6 text-center">
                <AlertCircle className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                <h4 className="text-sm font-medium text-gray-300 mb-1">Not enough data</h4>
                <p className="text-xs text-gray-400">
                  Listen to more stories to see your trends and patterns!
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="pt-0">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-indigo-400 hover:text-indigo-300 w-full"
          onClick={() => router.push('/dashboard/history')}
        >
          View detailed history
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}