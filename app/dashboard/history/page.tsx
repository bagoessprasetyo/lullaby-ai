"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { DashboardNavbar } from "@/components/dashboard/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  Clock,
  Play,
  Calendar as CalendarIcon,
  BarChart,
  Search,
  TrendingUp,
  RotateCcw,
  Award,
  Activity,
  Sparkles,
  ThumbsUp,
  Star,
} from "lucide-react";
import { formatDuration } from "@/lib/format-duration";

// Types for history data
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

type ListeningStats = {
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
  };
};

// Mock data generator
const generateMockHistoryData = () => {
  const storyTitles = [
    "Emma's Magical Forest Adventure",
    "The Dragon's Secret",
    "Journey to the Moon",
    "Dinosaur Discovery",
    "Underwater Kingdom",
    "Space Explorers",
  ];
  
  const today = new Date();
  const plays: StoryPlay[] = [];
  
  // Generate random plays for the last 30 days
  for (let i = 0; i < 30; i++) {
    const daysAgo = i;
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    
    // Some days have multiple plays, some have none
    const playsOnDay = Math.random() > 0.3 ? Math.floor(Math.random() * 3) + 1 : 0;
    
    for (let j = 0; j < playsOnDay; j++) {
      const storyIndex = Math.floor(Math.random() * storyTitles.length);
      const completed = Math.random() > 0.2;
      const progress = completed ? 100 : Math.floor(Math.random() * 80) + 10;
      
      plays.push({
        id: `play-${i}-${j}`,
        storyId: `story-${storyIndex}`,
        storyTitle: storyTitles[storyIndex],
        coverImage: `https://source.unsplash.com/random/300x300?bedtime,story&sig=${i}-${j}`,
        playedAt: new Date(date),
        duration: Math.floor(Math.random() * 300) + 60, // 1-6 minutes
        completed,
        progress: progress,
      });
    }
  }
  
  // Sort by most recent first
  plays.sort((a, b) => b.playedAt.getTime() - a.playedAt.getTime());
  
  // Calculate stats
  const stats: ListeningStats = {
    totalPlays: plays.length,
    totalDuration: plays.reduce((sum, play) => sum + play.duration, 0),
    averagePerDay: plays.length / 30,
    currentStreak: 3, // Mock value
    longestStreak: 7, // Mock value
    mostPlayedStory: {
      id: "story-0",
      title: storyTitles[0],
      coverImage: "https://source.unsplash.com/random/300x300?bedtime,forest&sig=1",
      playCount: 8,
    },
  };
  
  return { plays, stats };
};

export default function HistoryPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [currentTab, setCurrentTab] = useState("timeline");
  const [filterPeriod, setFilterPeriod] = useState("30days");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [historyData, setHistoryData] = useState<{ plays: StoryPlay[], stats: ListeningStats } | null>(null);

  // Simulating data fetching
  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      // In a real app, this would be an API call
      setTimeout(() => {
        const data = generateMockHistoryData();
        setHistoryData(data);
        setIsLoading(false);
      }, 1500);
    };

    fetchHistory();
  }, []);

  // Filter plays based on search and period
  const getFilteredPlays = () => {
    if (!historyData) return [];
    
    let filtered = [...historyData.plays];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        play => play.storyTitle.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply time period filter
    const today = new Date();
    switch (filterPeriod) {
      case "7days":
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        filtered = filtered.filter(play => play.playedAt >= sevenDaysAgo);
        break;
      case "30days":
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        filtered = filtered.filter(play => play.playedAt >= thirtyDaysAgo);
        break;
      case "90days":
        const ninetyDaysAgo = new Date(today);
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        filtered = filtered.filter(play => play.playedAt >= ninetyDaysAgo);
        break;
      default:
        break;
    }
    
    return filtered;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };
  
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(date);
  };

  if (status === "loading" || isLoading) {
    return (
      <>
        <DashboardNavbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
            <p className="text-gray-400">Loading your history...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardNavbar />
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
                  {historyData?.stats.totalPlays || 0}
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
                  {formatDuration(historyData?.stats.totalDuration || 0)}
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
                  {historyData?.stats.currentStreak || 0} days
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
                  {historyData?.stats.longestStreak || 0} days
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="mb-8">
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
                  {getFilteredPlays().length === 0 ? (
                    <div className="text-center py-8">
                      <div className="bg-gray-800/70 rounded-full p-3 inline-flex mb-4">
                        <Search className="h-6 w-6 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-white mb-2">No activities found</h3>
                      <p className="text-gray-400 max-w-md mx-auto">
                        We couldn't find any story activities matching your filters.
                        Try adjusting your search or time period.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {getFilteredPlays().map((play, index) => (
                        <div 
                          key={play.id}
                          className="relative pl-8 pb-6"
                          style={{
                            borderLeft: index === getFilteredPlays().length - 1 ? 'none' : '1px dashed rgb(75, 85, 99)',
                            marginLeft: '0.5rem'
                          }}
                        >
                          <div className="absolute left-0 top-0 w-4 h-4 rounded-full bg-indigo-900 border-2 border-indigo-500"></div>
                          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-md overflow-hidden">
                                  <img 
                                    src={play.coverImage} 
                                    alt={play.storyTitle}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div>
                                  <h4 
                                    className="font-medium text-white cursor-pointer hover:text-indigo-400 transition-colors"
                                    onClick={() => router.push(`/dashboard/stories/${play.storyId}`)}
                                  >
                                    {play.storyTitle}
                                  </h4>
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="text-gray-400">{formatDate(play.playedAt)}</span>
                                    <span className="text-gray-600">•</span>
                                    <span className="text-gray-400">{formatTime(play.playedAt)}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex flex-col items-end">
                                {play.completed ? (
                                  <Badge className="bg-green-900/50 text-green-300">
                                    <ThumbsUp className="h-3 w-3 mr-1" />
                                    Completed
                                  </Badge>
                                ) : (
                                  <Badge className="bg-amber-900/50 text-amber-300">
                                    {play.progress}% Complete
                                  </Badge>
                                )}
                                <span className="text-xs text-gray-500 mt-1">
                                  {formatDuration(play.duration)}
                                </span>
                              </div>
                            </div>
                            
                            {!play.completed && (
                              <div className="mt-3">
                                <Progress value={play.progress} className="h-1.5 mb-2" />
                                <div className="flex justify-end">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="border-gray-700 text-xs flex items-center"
                                    onClick={() => router.push(`/dashboard/stories/${play.storyId}?resume=true`)}
                                  >
                                    <RotateCcw className="h-3 w-3 mr-1" />
                                    Resume
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="calendar" className="pt-2">
              {/* Calendar Heatmap */}
              <Card className="bg-gray-900/50 border border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center text-lg">
                    <Calendar className="h-5 w-5 mr-2 text-indigo-400" />
                    Activity Calendar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="py-4">
                    {/* This would be a calendar heatmap component */}
                    <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6 min-h-[300px] flex items-center justify-center">
                      {/* In a real app, use a proper calendar heatmap component */}
                      <div className="text-center">
                        <Calendar className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-400">
                          Calendar view will display your listening patterns over time
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          Darker colors indicate more listening activity on those days
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm bg-indigo-900/30"></div>
                      <span className="text-xs text-gray-400">Less</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm bg-indigo-800"></div>
                      <span className="text-xs text-gray-400"></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm bg-indigo-700"></div>
                      <span className="text-xs text-gray-400"></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm bg-indigo-600"></div>
                      <span className="text-xs text-gray-400"></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm bg-indigo-500"></div>
                      <span className="text-xs text-gray-400">More</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="stats" className="pt-2">
              {/* Statistics and Insights */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-gray-900/50 border border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center text-lg">
                      <Star className="h-5 w-5 mr-2 text-amber-400" />
                      Most Listened
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {historyData?.stats.mostPlayedStory ? (
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden">
                          <img 
                            src={historyData.stats.mostPlayedStory.coverImage} 
                            alt={historyData.stats.mostPlayedStory.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-grow">
                          <h4 className="font-medium text-white mb-1">
                            {historyData.stats.mostPlayedStory.title}
                          </h4>
                          <div className="flex items-center gap-3">
                            <Badge className="bg-amber-900/40 text-amber-300">
                              <Play className="h-3 w-3 mr-1" />
                              {historyData.stats.mostPlayedStory.playCount} plays
                            </Badge>
                            <span className="text-sm text-gray-400">
                              Your child's favorite story
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-gray-400">No story data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-900/50 border border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center text-lg">
                      <TrendingUp className="h-5 w-5 mr-2 text-green-400" />
                      Listening Streak
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400">Current Streak</p>
                          <p className="text-2xl font-bold text-white">
                            {historyData?.stats.currentStreak || 0} days
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Longest Streak</p>
                          <p className="text-2xl font-bold text-white">
                            {historyData?.stats.longestStreak || 0} days
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
                        <div className="flex items-center justify-center gap-2 mb-3">
                          <Badge className="bg-green-900/40 text-green-300">
                            <Sparkles className="h-3 w-3 mr-1" />
                            {historyData?.stats.currentStreak === 0 ? "Start a streak!" : "Keep it going!"}
                          </Badge>
                        </div>
                        <p className="text-center text-sm text-gray-400">
                          {historyData?.stats.currentStreak === 0 
                            ? "Listen to a story today to start your streak"
                            : "You've listened to stories for " + historyData?.stats.currentStreak + " days in a row"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-900/50 border border-gray-800 lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center text-lg">
                      <BarChart className="h-5 w-5 mr-2 text-indigo-400" />
                      Listening Patterns
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6 h-64 flex items-center justify-center">
                      {/* In a real app, this would be a chart component */}
                      <div className="text-center">
                        <BarChart className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-400">
                          Listening pattern visualization would go here
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          Shows when your child listens to stories most often
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}