"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  BarChart,
  Clock,
  Calendar,
  Star,
  Play,
  TrendingUp,
  PieChart as PieChartIcon,
  MoveVertical
} from "lucide-react";
import { formatDuration } from "@/lib/format-duration";

// Types for statistics data
type StatisticsData = {
  totalPlays: number;
  totalDuration: number; // in seconds
  averageListeningTime: number; // in seconds
  totalStories: number;
  completionRate: number; // percentage
  mostActiveDay: string;
  mostActiveHour: number;
  popularTags: { name: string; count: number }[];
  topStories: {
    id: string;
    title: string;
    coverImage: string;
    playCount: number;
    duration: number;
  }[];
  weekdayDistribution: { day: string; count: number }[];
  hourlyDistribution: { hour: number; count: number }[];
};

interface StoryStatisticsProps {
  timeframe?: "week" | "month" | "year" | "all";
}

export function StoryStatistics({ timeframe = "month" }: StoryStatisticsProps) {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Mock data - in a real application, this would come from an API
  const mockStatistics: StatisticsData = {
    totalPlays: 42,
    totalDuration: 9360, // 2 hours 36 minutes
    averageListeningTime: 223, // 3 minutes 43 seconds
    totalStories: 15,
    completionRate: 87,
    mostActiveDay: "Saturday",
    mostActiveHour: 20, // 8PM
    popularTags: [
      { name: "adventure", count: 18 },
      { name: "animals", count: 14 },
      { name: "fantasy", count: 12 },
      { name: "bedtime", count: 9 },
      { name: "nature", count: 6 }
    ],
    topStories: [
      {
        id: "story-1",
        title: "Emma's Magical Forest Adventure",
        coverImage: "https://source.unsplash.com/random/300x300?forest,magic&sig=1",
        playCount: 8,
        duration: 240
      },
      {
        id: "story-2",
        title: "The Dragon's Secret",
        coverImage: "https://source.unsplash.com/random/300x300?dragon&sig=2",
        playCount: 6,
        duration: 320
      },
      {
        id: "story-3",
        title: "Journey to the Moon",
        coverImage: "https://source.unsplash.com/random/300x300?moon,space&sig=3",
        playCount: 5,
        duration: 180
      }
    ],
    weekdayDistribution: [
      { day: "Monday", count: 3 },
      { day: "Tuesday", count: 5 },
      { day: "Wednesday", count: 4 },
      { day: "Thursday", count: 6 },
      { day: "Friday", count: 7 },
      { day: "Saturday", count: 10 },
      { day: "Sunday", count: 7 }
    ],
    hourlyDistribution: [
      { hour: 17, count: 4 }, // 5PM
      { hour: 18, count: 6 }, // 6PM
      { hour: 19, count: 9 }, // 7PM
      { hour: 20, count: 12 }, // 8PM
      { hour: 21, count: 8 }, // 9PM
      { hour: 22, count: 3 } // 10PM
    ]
  };
  
  const formatHour = (hour: number) => {
    return new Date(2000, 0, 1, hour, 0, 0).toLocaleTimeString([], { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true
    });
  };
  
  const getTimeframeLabel = () => {
    switch (timeframe) {
      case "week": return "this week";
      case "month": return "this month";
      case "year": return "this year";
      case "all": return "all time";
      default: return "this month";
    }
  };
  
  // Function to generate SVG chart bar visualization
  const generateBarChart = (data: { label: string; value: number }[], maxHeight = 100) => {
    const maxValue = Math.max(...data.map(d => d.value));
    
    return (
      <div className="flex items-end h-40 gap-1 mt-4">
        {data.map((item, index) => {
          const heightPercentage = (item.value / maxValue) * 100;
          const barHeight = (heightPercentage / 100) * maxHeight;
          
          return (
            <div key={index} className="flex flex-col items-center justify-end flex-1">
              <div 
                className="w-full bg-indigo-500/80 rounded-t-sm hover:bg-indigo-400 transition-colors relative group"
                style={{ height: `${barHeight}%` }}
              >
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {item.value}
                </div>
              </div>
              <span className="text-xs text-gray-400 mt-1 truncate w-full text-center">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-900/70 border border-gray-800 p-1">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-gray-800 data-[state=active]:text-white"
          >
            <BarChart className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="patterns"
            className="data-[state=active]:bg-gray-800 data-[state=active]:text-white"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Listening Patterns
          </TabsTrigger>
          <TabsTrigger
            value="stories"
            className="data-[state=active]:bg-gray-800 data-[state=active]:text-white"
          >
            <Star className="h-4 w-4 mr-2" />
            Top Stories
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-4 space-y-6">
          <Card className="bg-gray-900/50 border border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center text-lg">
                <BarChart className="h-5 w-5 mr-2 text-indigo-400" />
                Listening Overview {getTimeframeLabel()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                  <div className="text-sm text-gray-400">Total Plays</div>
                  <div className="text-2xl font-bold text-white mt-1">
                    {mockStatistics.totalPlays}
                  </div>
                </div>
                
                <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                  <div className="text-sm text-gray-400">Total Time</div>
                  <div className="text-2xl font-bold text-white mt-1">
                    {formatDuration(mockStatistics.totalDuration)}
                  </div>
                </div>
                
                <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                  <div className="text-sm text-gray-400">Avg. Listen Time</div>
                  <div className="text-2xl font-bold text-white mt-1">
                    {formatDuration(mockStatistics.averageListeningTime)}
                  </div>
                </div>
                
                <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                  <div className="text-sm text-gray-400">Completion Rate</div>
                  <div className="text-2xl font-bold text-white mt-1">
                    {mockStatistics.completionRate}%
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <h4 className="font-medium text-white mb-2 flex items-center">
                  <Star className="h-4 w-4 mr-2 text-amber-400" />
                  Most Popular Tags
                </h4>
                <div className="flex flex-wrap gap-2">
                  {mockStatistics.popularTags.map((tag, index) => (
                    <Badge key={index} className="bg-indigo-900/50 text-indigo-300">
                      {tag.name} ({tag.count})
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="patterns" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gray-900/50 border border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center text-lg">
                  <Calendar className="h-5 w-5 mr-2 text-indigo-400" />
                  Day of Week Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {generateBarChart(
                  mockStatistics.weekdayDistribution.map(item => ({
                    label: item.day.substring(0, 3),
                    value: item.count
                  }))
                )}
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900/50 border border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center text-lg">
                  <Clock className="h-5 w-5 mr-2 text-indigo-400" />
                  Hourly Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {generateBarChart(
                  mockStatistics.hourlyDistribution.map(item => ({
                    label: formatHour(item.hour),
                    value: item.count
                  }))
                )}
              </CardContent>
            </Card>
          </div>
          
          <Card className="bg-gray-900/50 border border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center text-lg">
                <MoveVertical className="h-5 w-5 mr-2 text-indigo-400" />
                Key Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="mt-1">
                    <div className="bg-indigo-900/40 p-1 rounded-full">
                      <Clock className="h-4 w-4 text-indigo-400" />
                    </div>
                  </div>
                  <div>
                    <h5 className="font-medium text-white">Peak Listening Time</h5>
                    <p className="text-sm text-gray-400">
                      Most stories are listened to at <span className="text-indigo-300 font-medium">8:00 PM</span> in the evening. 
                      This suggests stories are part of the bedtime routine.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="mt-1">
                    <div className="bg-amber-900/40 p-1 rounded-full">
                      <Calendar className="h-4 w-4 text-amber-400" />
                    </div>
                  </div>
                  <div>
                    <h5 className="font-medium text-white">Weekend Preference</h5>
                    <p className="text-sm text-gray-400">
                      Listening activity increases by <span className="text-amber-300 font-medium">42%</span> on weekends, 
                      with Saturday being the most active day.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="mt-1">
                    <div className="bg-green-900/40 p-1 rounded-full">
                      <TrendingUp className="h-4 w-4 text-green-400" />
                    </div>
                  </div>
                  <div>
                    <h5 className="font-medium text-white">Consistent Habits</h5>
                    <p className="text-sm text-gray-400">
                      Your child listens to stories at a consistent time each day,
                      which is great for establishing bedtime routines.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stories" className="mt-4 space-y-6">
          <Card className="bg-gray-900/50 border border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center text-lg">
                <Star className="h-5 w-5 mr-2 text-amber-400" />
                Most Listened Stories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockStatistics.topStories.map((story, index) => (
                  <div 
                    key={story.id}
                    className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700"
                  >
                    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-gray-700 rounded-full text-white font-bold">
                      {index + 1}
                    </div>
                    
                    <div className="flex-shrink-0 w-12 h-12 rounded-md overflow-hidden">
                      <img 
                        src={story.coverImage} 
                        alt={story.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-grow min-w-0">
                      <h5 className="font-medium text-white truncate">
                        {story.title}
                      </h5>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span className="flex items-center">
                          <Play className="h-3 w-3 mr-1" />
                          {story.playCount} times
                        </span>
                        <span className="opacity-60">•</span>
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDuration(story.duration)}
                        </span>
                      </div>
                    </div>
                    
                    <Badge className="bg-amber-900/50 text-amber-300 flex-shrink-0">
                      <Star className="h-3 w-3 mr-1" />
                      Favorite
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900/50 border border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center text-lg">
                <PieChartIcon className="h-5 w-5 mr-2 text-indigo-400" />
                Content Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6 h-64 flex items-center justify-center">
                {/* In a real app, this would be a chart component */}
                <div className="text-center">
                  <PieChartIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">
                    Content preference visualization would go here
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Showing distribution of story categories
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}