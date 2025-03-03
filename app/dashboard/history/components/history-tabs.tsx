"use client";

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Calendar, 
  CalendarIcon, 
  BarChart, 
  Search,
  Activity 
} from "lucide-react";
import { ActivityTimeline } from "@/components/history/activity-timeline";
import { CalendarHeatmap } from "@/components/history/calendar-heatmap";
import { StoryStatistics } from "@/components/history/history-listening-statistics";
import { PlayHistoryEntry, CalendarData } from "@/lib/services/history-service";
import { LoadingState } from "@/components/ui/loading-state";

interface HistoryTabsProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  filterPeriod: string;
  setFilterPeriod: (period: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  playHistory: PlayHistoryEntry[];
  calendarData: CalendarData | null;
  router: AppRouterInstance;
  isLoading: boolean;
  userId: string;
  listeningPatterns: {
    hourlyDistribution: {hour: number, count: number}[];
    weekdayDistribution: {day: string, count: number}[];
  } | null;
}

export function HistoryTabs({
  currentTab,
  setCurrentTab,
  filterPeriod,
  setFilterPeriod,
  searchQuery,
  setSearchQuery,
  playHistory,
  calendarData,
  router,
  isLoading,
  userId,
  listeningPatterns
}: HistoryTabsProps) {
  return (
    <Tabs defaultValue="timeline" value={currentTab} onValueChange={setCurrentTab}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <TabsList className="bg-gray-900/70 border border-gray-800 p-1">
          <TabsTrigger
            value="timeline"
            className="data-[state=active]:bg-gray-800 data-[state=active]:text-white"
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Activity Timeline
          </TabsTrigger>
          <TabsTrigger
            value="calendar"
            className="data-[state=active]:bg-gray-800 data-[state=active]:text-white"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Calendar View
          </TabsTrigger>
          <TabsTrigger
            value="stats"
            className="data-[state=active]:bg-gray-800 data-[state=active]:text-white"
          >
            <BarChart className="h-4 w-4 mr-2" />
            Insights
          </TabsTrigger>
        </TabsList>
        
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input 
              placeholder="Search stories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-gray-900 border-gray-700 w-full md:w-[200px]"
            />
          </div>
          
          <Select 
            value={filterPeriod} 
            onValueChange={setFilterPeriod}
          >
            <SelectTrigger className="w-[180px] bg-gray-900 border-gray-700">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-800">
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <TabsContent value="timeline" className="pt-2">
        {/* Activity Timeline */}
        <Card className="bg-gray-900/50 border border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center text-lg">
              <Activity className="h-5 w-5 mr-2 text-indigo-400" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-6">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500 mb-2"></div>
                <p className="text-gray-400">Loading activity data...</p>
              </div>
            ) : playHistory.length > 0 ? (
              <ActivityTimeline 
                plays={playHistory} 
                onResume={(storyId) => router.push(`/dashboard/stories/${storyId}?resume=true`)}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">No activity data found for the selected period.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="calendar" className="pt-2">
        {/* Calendar Heatmap */}
        {isLoading ? (
          <Card className="bg-gray-900/50 border border-gray-800">
            <CardContent className="p-6 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
              <p className="text-gray-400">Loading calendar data...</p>
            </CardContent>
          </Card>
        ) : calendarData ? (
          <CalendarHeatmap 
            data={calendarData}
            timeRange={filterPeriod === 'all' ? 'all' : filterPeriod === '7days' || filterPeriod === '30days' ? '6months' : 'year'} 
          />
        ) : (
          <Card className="bg-gray-900/50 border border-gray-800">
            <CardContent className="p-6 text-center">
              <p className="text-gray-400">No calendar data available for the selected period.</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>
      
      <TabsContent value="stats" className="pt-2">
        {/* Statistics and Insights */}
        {isLoading ? (
          <Card className="bg-gray-900/50 border border-gray-800">
            <CardContent className="p-6 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
              <p className="text-gray-400">Loading statistics data...</p>
            </CardContent>
          </Card>
        ) : (
          <StoryStatistics 
            timeframe={filterPeriod as 'week' | 'month' | 'year' | 'all'} 
            listeningPatterns={listeningPatterns}
            userId={userId}
          />
        )}
      </TabsContent>
    </Tabs>
  );
}