"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  ArrowRight,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types for the heatmap data
type ActivityDay = {
  date: Date;
  count: number;
};

type CalendarData = {
  maxCount: number;
  days: ActivityDay[];
};

interface CalendarHeatmapProps {
  timeRange?: "6months" | "year" | "all";
}

// Function to generate mock data
const generateMockCalendarData = (timeRange: "6months" | "year" | "all" = "year"): CalendarData => {
  const today = new Date();
  const days: ActivityDay[] = [];
  let maxCount = 0;
  
  // Determine number of days based on time range
  let daysToGenerate = 365; // Default for a year
  if (timeRange === "6months") {
    daysToGenerate = 182;
  } else if (timeRange === "all") {
    daysToGenerate = 365 * 2; // Mock 2 years for "all"
  }
  
  // Patterns to make the data more realistic
  const regularPatterns = [
    { day: 6, probability: 0.8 }, // Saturday - high probability
    { day: 0, probability: 0.7 }, // Sunday - high probability
    { day: 1, probability: 0.4 }, // Monday - medium probability
    { day: 2, probability: 0.4 }, // Tuesday - medium probability
    { day: 3, probability: 0.4 }, // Wednesday - medium probability
    { day: 4, probability: 0.5 }, // Thursday - medium probability
    { day: 5, probability: 0.6 }, // Friday - medium-high probability
  ];
  
  // Special date ranges for increased activity
  const specialRanges = [
    { start: new Date(today.getFullYear(), 11, 20), end: new Date(today.getFullYear(), 11, 31), factor: 1.5 }, // Christmas
    { start: new Date(today.getFullYear(), 6, 1), end: new Date(today.getFullYear(), 7, 31), factor: 1.3 }, // Summer
    { start: new Date(today.getFullYear(), 2, 15), end: new Date(today.getFullYear(), 3, 15), factor: 1.2 }, // Spring Break
  ];
  
  // Generate data for each day, going backwards from today
  for (let i = 0; i < daysToGenerate; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Base probability derived from day of week
    const dayOfWeek = date.getDay();
    const pattern = regularPatterns.find(p => p.day === dayOfWeek);
    const baseProbability = pattern ? pattern.probability : 0.3;
    
    // Check if date falls in special range
    let activityFactor = 1;
    for (const range of specialRanges) {
      if (date >= range.start && date <= range.end) {
        activityFactor = range.factor;
        break;
      }
    }
    
    // Additional random factor for natural variation
    const randomFactor = 0.7 + (Math.random() * 0.6); // 0.7 to 1.3
    
    // Calculate final probability
    const finalProbability = baseProbability * activityFactor * randomFactor;
    
    // Determine activity count (0-4)
    let count = 0;
    if (Math.random() < finalProbability) {
      // If activity happens, determine intensity
      if (Math.random() < 0.2) {
        count = 4; // High intensity
      } else if (Math.random() < 0.4) {
        count = 3; // Medium-high intensity
      } else if (Math.random() < 0.6) {
        count = 2; // Medium intensity
      } else {
        count = 1; // Low intensity
      }
    }
    
    // Add "streak" periods - consecutive days with activity
    if (i > 0 && days[0]?.count > 0 && Math.random() < 0.7) {
      count = Math.max(1, Math.floor(days[0].count * (0.8 + Math.random() * 0.4)));
    }
    
    // Update max count if needed
    maxCount = Math.max(maxCount, count);
    
    days.push({ date, count });
  }
  
  // Sort by date from oldest to newest
  days.sort((a, b) => a.date.getTime() - b.date.getTime());
  
  return { maxCount, days };
};

const getIntensityColor = (count: number, maxCount: number) => {
  if (count === 0) return "bg-gray-800";
  
  const intensity = count / maxCount;
  
  if (intensity <= 0.25) return "bg-indigo-900";
  if (intensity <= 0.5) return "bg-indigo-800";
  if (intensity <= 0.75) return "bg-indigo-700";
  return "bg-indigo-500";
};

export function CalendarHeatmap({ timeRange = "year" }: CalendarHeatmapProps) {
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [tooltipDay, setTooltipDay] = useState<ActivityDay | null>(null);
  
  // Generate mock data
  useEffect(() => {
    setCalendarData(generateMockCalendarData(timeRange));
  }, [timeRange]);
  
  // Get month name
  const getMonthName = (monthIndex: number) => {
    return new Date(2000, monthIndex, 1).toLocaleString("default", { month: "long" });
  };
  
  // Move to previous month
  const prevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };
  
  // Move to next month
  const nextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };
  
  // Format date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(date);
  };
  
  // Get days for the selected month
  const getMonthDays = () => {
    if (!calendarData) return [];
    
    return calendarData.days.filter(day => {
      return day.date.getMonth() === selectedMonth && day.date.getFullYear() === selectedYear;
    });
  };
  
  // Create grid layout for month view
  const generateMonthGrid = () => {
    if (!calendarData) return [];
    
    const monthDays = getMonthDays();
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    const firstDayOfWeek = firstDay.getDay(); // 0 for Sunday, 1 for Monday, etc.
    
    // Create array for days of month with empty slots for days before month start
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const totalCells = firstDayOfWeek + daysInMonth;
    const rows = Math.ceil(totalCells / 7);
    
    const grid = [];
    let dayCounter = 1;
    let dayIndex = 0;
    
    for (let row = 0; row < rows; row++) {
      const weekRow = [];
      
      for (let col = 0; col < 7; col++) {
        if ((row === 0 && col < firstDayOfWeek) || dayCounter > daysInMonth) {
          // Empty cell before month starts or after month ends
          weekRow.push(null);
        } else {
          // Find the activity for this day
          const currentDate = new Date(selectedYear, selectedMonth, dayCounter);
          const dayData = monthDays.find(d => 
            d.date.getDate() === dayCounter &&
            d.date.getMonth() === selectedMonth &&
            d.date.getFullYear() === selectedYear
          );
          
          weekRow.push({
            date: currentDate,
            count: dayData ? dayData.count : 0
          });
          
          dayCounter++;
        }
      }
      
      grid.push(weekRow);
    }
    
    return grid;
  };
  
  // Get total activity for selected month
  const getMonthActivity = () => {
    const monthDays = getMonthDays();
    return monthDays.reduce((sum, day) => sum + day.count, 0);
  };
  
  // Get streak information
  const getStreakInfo = () => {
    if (!calendarData) return { current: 0, longest: 0 };
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    // Sort by date from newest to oldest
    const sortedDays = [...calendarData.days].sort((a, b) => b.date.getTime() - a.date.getTime());
    
    // Check if today has activity
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayActivity = sortedDays.find(day => 
      day.date.getTime() === today.getTime()
    );
    
    if (todayActivity && todayActivity.count > 0) {
      currentStreak = 1;
      tempStreak = 1;
      
      // Check previous days
      for (let i = 1; i < sortedDays.length; i++) {
        const currentDate = sortedDays[i].date;
        const prevDate = sortedDays[i-1].date;
        
        // Check if dates are consecutive
        const timeDiff = prevDate.getTime() - currentDate.getTime();
        const dayDiff = timeDiff / (1000 * 3600 * 24);
        
        if (dayDiff === 1 && sortedDays[i].count > 0) {
          tempStreak++;
          
          // Only update current streak if we're dealing with recent days
          if (i < 30) {
            currentStreak = tempStreak;
          }
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = sortedDays[i].count > 0 ? 1 : 0;
        }
      }
      
      // Final check for longest streak
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      // Find most recent streak
      for (let i = 0; i < sortedDays.length - 1; i++) {
        if (sortedDays[i].count > 0) {
          tempStreak++;
          
          // Check if next day is consecutive
          const currentDate = sortedDays[i].date;
          const nextDate = sortedDays[i+1].date;
          
          const timeDiff = currentDate.getTime() - nextDate.getTime();
          const dayDiff = timeDiff / (1000 * 3600 * 24);
          
          if (dayDiff !== 1) {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 0;
          }
        }
      }
      
      // Final check for longest streak
      longestStreak = Math.max(longestStreak, tempStreak);
    }
    
    return { current: currentStreak, longest: longestStreak };
  };
  
  const { current: currentStreak, longest: longestStreak } = getStreakInfo();
  const monthGrid = generateMonthGrid();
  const totalMonthActivity = getMonthActivity();
  
  const today = new Date();
  const isCurrentMonth = selectedMonth === today.getMonth() && selectedYear === today.getFullYear();
  
  return (
    <div className="space-y-6">
      <Card className="bg-gray-900/50 border border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center text-lg">
            <Calendar className="h-5 w-5 mr-2 text-indigo-400" />
            Listening Calendar
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 w-8 p-0 border-gray-700"
              onClick={prevMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-24 text-center text-sm text-gray-300">
              {getMonthName(selectedMonth)} {selectedYear}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 w-8 p-0 border-gray-700"
              onClick={nextMonth}
              disabled={isCurrentMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {calendarData ? (
            <div className="space-y-6">
              {/* Calendar grid */}
              <div className="select-none">
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-xs text-center text-gray-500">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="space-y-1">
                  {monthGrid.map((week, weekIndex) => (
                    <div key={weekIndex} className="grid grid-cols-7 gap-1">
                      {week.map((day, dayIndex) => {
                        if (!day) {
                          return <div key={`empty-${weekIndex}-${dayIndex}`} className="h-9 rounded-md"></div>;
                        }
                        
                        const isToday = day.date.toDateString() === today.toDateString();
                        
                        return (
                          <div 
                            key={`day-${weekIndex}-${dayIndex}`}
                            className={cn(
                              "relative h-9 rounded-md flex items-center justify-center cursor-default",
                              isToday ? "ring-1 ring-indigo-500" : ""
                            )}
                            onMouseEnter={() => setTooltipDay(day)}
                            onMouseLeave={() => setTooltipDay(null)}
                          >
                            <div
                              className={cn(
                                "w-7 h-7 rounded-md flex items-center justify-center",
                                getIntensityColor(day.count, calendarData.maxCount)
                              )}
                            >
                              <span className={cn(
                                "text-xs",
                                day.count > 0 ? "text-white" : "text-gray-500"
                              )}>
                                {day.date.getDate()}
                              </span>
                            </div>
                            
                            {/* Tooltip */}
                            {tooltipDay?.date.toDateString() === day.date.toDateString() && (
                              <motion.div 
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 whitespace-nowrap bg-gray-800 text-white text-xs rounded px-2 py-1 mb-1"
                              >
                                <div>{formatDate(day.date)}</div>
                                <div className="font-medium text-center">
                                  {day.count === 0 ? 'No activity' : `${day.count} ${day.count === 1 ? 'story' : 'stories'}`}
                                </div>
                              </motion.div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Month stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-3 flex flex-col items-center justify-center">
                  <div className="text-sm text-gray-400">Stories This Month</div>
                  <div className="text-xl font-bold text-white mt-1">
                    {totalMonthActivity}
                  </div>
                </div>
                
                <div className="bg-gray-800/50 rounded-lg p-3 flex flex-col items-center justify-center">
                  <div className="text-sm text-gray-400">Current Streak</div>
                  <div className="text-xl font-bold text-white mt-1">
                    {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
                  </div>
                </div>
                
                <div className="bg-gray-800/50 rounded-lg p-3 flex flex-col items-center justify-center">
                  <div className="text-sm text-gray-400">Longest Streak</div>
                  <div className="text-xl font-bold text-white mt-1">
                    {longestStreak} {longestStreak === 1 ? 'day' : 'days'}
                  </div>
                </div>
              </div>
              
              {/* Legend */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-gray-500" />
                  <span className="text-xs text-gray-500">Activity Level</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm bg-gray-800"></div>
                  <div className="w-3 h-3 rounded-sm bg-indigo-900"></div>
                  <div className="w-3 h-3 rounded-sm bg-indigo-800"></div>
                  <div className="w-3 h-3 rounded-sm bg-indigo-700"></div>
                  <div className="w-3 h-3 rounded-sm bg-indigo-500"></div>
                  <div className="flex items-center gap-1.5">
                    <ArrowRight className="h-3 w-3 text-gray-500" />
                    <span className="text-xs text-gray-500">More active</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}