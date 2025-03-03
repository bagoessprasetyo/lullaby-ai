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
import { CalendarData } from "@/lib/services/history-service";

interface CalendarHeatmapProps {
  data: CalendarData;
  timeRange?: "6months" | "year" | "all";
}

const getIntensityColor = (count: number, maxCount: number) => {
  if (count === 0) return "bg-gray-800";
  
  const intensity = count / maxCount;
  
  if (intensity <= 0.25) return "bg-indigo-900";
  if (intensity <= 0.5) return "bg-indigo-800";
  if (intensity <= 0.75) return "bg-indigo-700";
  return "bg-indigo-500";
};

export function CalendarHeatmap({ data, timeRange = "year" }: CalendarHeatmapProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [tooltipDay, setTooltipDay] = useState<{date: Date, count: number} | null>(null);
  
  // Ensure selected month/year is within the data range when data changes
  useEffect(() => {
    if (data && data.days.length > 0) {
      const oldestDate = data.days[0].date;
      const newestDate = data.days[data.days.length - 1].date;
      
      const currentSelectedDate = new Date(selectedYear, selectedMonth, 1);
      
      // If selected date is outside the range, set it to the newest date
      if (currentSelectedDate < oldestDate || currentSelectedDate > newestDate) {
        setSelectedMonth(newestDate.getMonth());
        setSelectedYear(newestDate.getFullYear());
      }
    }
  }, [data]);
  
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
    if (!data) return [];
    
    return data.days.filter(day => {
      return day.date.getMonth() === selectedMonth && day.date.getFullYear() === selectedYear;
    });
  };
  
  // Create grid layout for month view
  const generateMonthGrid = () => {
    if (!data) return [];
    
    const monthDays = getMonthDays();
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    const firstDayOfWeek = firstDay.getDay(); // 0 for Sunday, 1 for Monday, etc.
    
    // Create array for days of month with empty slots for days before month start
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const totalCells = firstDayOfWeek + daysInMonth;
    const rows = Math.ceil(totalCells / 7);
    
    const grid = [];
    let dayCounter = 1;
    
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
            d.date.getDate() === dayCounter
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
  
  // Get streak information from the data
  const getStreakInfo = () => {
    if (!data || data.days.length === 0) return { current: 0, longest: 0 };
    
    // Sort days by date (newest first)
    const sortedDays = [...data.days].sort((a, b) => 
      b.date.getTime() - a.date.getTime()
    );
    
    // Check current streak (consecutive days from today)
    let currentStreak = 0;
    
    // Start with today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if today has activity
    const todayData = sortedDays.find(day => {
      const dayDate = new Date(day.date);
      dayDate.setHours(0, 0, 0, 0);
      return dayDate.getTime() === today.getTime();
    });
    
    if (todayData && todayData.count > 0) {
      currentStreak = 1;
      
      // Check previous days
      let currentDate = new Date(today);
      let dayOffset = 1;
      let streakBroken = false;
      
      while (!streakBroken) {
        // Get previous day
        currentDate = new Date(today);
        currentDate.setDate(today.getDate() - dayOffset);
        currentDate.setHours(0, 0, 0, 0);
        
        // Check if this day has activity
        const dayData = sortedDays.find(day => {
          const dayDate = new Date(day.date);
          dayDate.setHours(0, 0, 0, 0);
          return dayDate.getTime() === currentDate.getTime();
        });
        
        if (dayData && dayData.count > 0) {
          currentStreak++;
          dayOffset++;
        } else {
          streakBroken = true;
        }
      }
    } else {
      // Check if yesterday has activity (supporting current streak being from yesterday)
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      const yesterdayData = sortedDays.find(day => {
        const dayDate = new Date(day.date);
        dayDate.setHours(0, 0, 0, 0);
        return dayDate.getTime() === yesterday.getTime();
      });
      
      if (yesterdayData && yesterdayData.count > 0) {
        currentStreak = 1;
        
        // Check days before yesterday
        let currentDate = new Date(yesterday);
        let dayOffset = 1;
        let streakBroken = false;
        
        while (!streakBroken) {
          // Get previous day
          currentDate = new Date(yesterday);
          currentDate.setDate(yesterday.getDate() - dayOffset);
          currentDate.setHours(0, 0, 0, 0);
          
          // Check if this day has activity
          const dayData = sortedDays.find(day => {
            const dayDate = new Date(day.date);
            dayDate.setHours(0, 0, 0, 0);
            return dayDate.getTime() === currentDate.getTime();
          });
          
          if (dayData && dayData.count > 0) {
            currentStreak++;
            dayOffset++;
          } else {
            streakBroken = true;
          }
        }
      }
    }
    
    // Find longest streak
    let longestStreak = 0;
    let currentLongest = 0;
    let previousDate: Date | null = null;
    
    // Sort days by date (oldest first)
    const chronologicalDays = [...data.days].sort((a, b) => 
      a.date.getTime() - b.date.getTime()
    ).filter(day => day.count > 0); // Only days with activity
    
    // Iterate through days and find consecutive days
    chronologicalDays.forEach(day => {
      const currentDate = new Date(day.date);
      currentDate.setHours(0, 0, 0, 0);
      
      if (previousDate === null) {
        // First active day
        currentLongest = 1;
      } else {
        // Check if dates are consecutive
        const prevDate = new Date(previousDate);
        prevDate.setDate(prevDate.getDate() + 1);
        prevDate.setHours(0, 0, 0, 0);
        
        if (currentDate.getTime() === prevDate.getTime()) {
          // Consecutive day
          currentLongest++;
        } else {
          // Break in streak
          longestStreak = Math.max(longestStreak, currentLongest);
          currentLongest = 1;
        }
      }
      
      previousDate = currentDate;
    });
    
    // Check if the last streak is the longest
    longestStreak = Math.max(longestStreak, currentLongest);
    
    return { current: currentStreak, longest: longestStreak };
  };
  
  const monthGrid = generateMonthGrid();
  const totalMonthActivity = getMonthActivity();
  const { current: currentStreak, longest: longestStreak } = getStreakInfo();
  
  const today = new Date();
  const isCurrentMonth = selectedMonth === today.getMonth() && selectedYear === today.getFullYear();
  const canGoForward = !isCurrentMonth;
  
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
              disabled={!canGoForward}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data ? (
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
                                getIntensityColor(day.count, data.maxCount)
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