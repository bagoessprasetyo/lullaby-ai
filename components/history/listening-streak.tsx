"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles,
  Calendar,
  Trophy,
  Flame,
  Check,
  X
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getStreakHistory, getLastListenedDate } from "@/lib/services/history-service";

interface ListeningStreakProps {
  currentStreak: number;
  longestStreak: number;
  lastListenedDate?: Date | null;
  streakHistory?: boolean[]; // Array of last 7 days (true = listened, false = not listened)
  userId?: string;
  className?: string;
}

export function ListeningStreak({
  currentStreak = 0,
  longestStreak = 0,
  lastListenedDate = null,
  streakHistory,
  userId,
  className,
}: ListeningStreakProps) {
  const [animateStreak, setAnimateStreak] = useState(false);
  const [loadedStreakHistory, setLoadedStreakHistory] = useState<boolean[]>([]);
  const [loadedLastListenedDate, setLoadedLastListenedDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Load streak history and last listened date if not provided
  useEffect(() => {
    const loadData = async () => {
      if (!userId) return;
      
      if (!streakHistory || !lastListenedDate) {
        setIsLoading(true);
        
        try {
          // Load streak history
          if (!streakHistory) {
            const history = await getStreakHistory(userId);
            setLoadedStreakHistory(history);
          }
          
          // Load last listened date
          if (!lastListenedDate) {
            const date = await getLastListenedDate(userId);
            setLoadedLastListenedDate(date);
          }
        } catch (error) {
          console.error("Error loading streak data:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    loadData();
  }, [userId, streakHistory, lastListenedDate]);
  
  // Animate streak counter on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateStreak(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Determine if streak is active today
  const isStreakActiveToday = () => {
    const date = lastListenedDate || loadedLastListenedDate;
    if (!date) return false;
    
    const today = new Date();
    const lastListened = new Date(date);
    
    return (
      today.getDate() === lastListened.getDate() &&
      today.getMonth() === lastListened.getMonth() &&
      today.getFullYear() === lastListened.getFullYear()
    );
  };
  
  const streakActiveToday = isStreakActiveToday();
  
  // Calculate streak percentage for the progress bar
  const streakPercentage = Math.min((currentStreak / 10) * 100, 100);
  
  // Generate encouragement message based on streak
  const getEncouragementMessage = () => {
    if (currentStreak === 0) return "Start your streak today!";
    if (currentStreak === 1) return "Great start! Day 1 of your streak.";
    if (currentStreak < 3) return "Keep going! You're building momentum.";
    if (currentStreak < 5) return "Awesome! You're developing a habit.";
    if (currentStreak < 7) return "Impressive! Almost a week straight!";
    if (currentStreak < 10) return "Amazing dedication!";
    if (currentStreak < 14) return "Phenomenal! Your child is loving this routine!";
    if (currentStreak < 21) return "Extraordinary commitment!";
    return "Legendary dedication! You're a bedtime story champion!";
  };
  
  // Get weekday names in order (today at the end)
  const getDayNames = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date().getDay();
    
    // Create array from 6 days ago to today
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const index = (today - i + 7) % 7;
      result.push(days[index]);
    }
    
    return result;
  };
  
  const dayNames = getDayNames();
  const history = streakHistory || loadedStreakHistory;
  
  return (
    <div className={cn("space-y-6", className)}>
      <Card className="bg-gray-900 border-gray-800 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-amber-500" />
              <h3 className="text-lg font-medium text-white">Listening Streak</h3>
            </div>
            
            {currentStreak >= 7 && (
              <Badge className="bg-amber-900/50 text-amber-300">
                <Flame className="h-3 w-3 mr-1" />
                On Fire!
              </Badge>
            )}
          </div>
          
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-amber-500 to-red-500 rounded-full p-4">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: animateStreak ? 1 : 0.8, opacity: animateStreak ? 1 : 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Flame className="h-8 w-8 text-white" />
                </motion.div>
              </div>
              
              <div>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <h2 className="text-3xl font-bold text-white">
                    {currentStreak} {currentStreak === 1 ? "Day" : "Days"}
                  </h2>
                </motion.div>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="text-sm text-gray-400"
                >
                  Current Streak
                </motion.p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Trophy className="h-4 w-4 text-amber-500" />
                <span className="text-xl font-bold text-white">{longestStreak}</span>
              </div>
              <p className="text-sm text-gray-400">Longest Streak</p>
            </div>
          </div>
          
          <div className="space-y-2 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Streak Progress</span>
              <span className="text-sm text-gray-400">
                {currentStreak < 10 ? `${currentStreak}/10 days` : "10+ days"}
              </span>
            </div>
            
            <div className="relative">
              <Progress value={streakPercentage} className="h-2" />
              {streakPercentage >= 100 && (
                <div className="absolute -right-1 -top-1">
                  <motion.div
                    initial={{ rotate: 0 }}
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, repeatType: "loop" }}
                  >
                    <Trophy className="h-5 w-5 text-amber-500" />
                  </motion.div>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span className="text-white font-medium">{getEncouragementMessage()}</span>
            </div>
            
            <p className="text-sm text-gray-400">
              {streakActiveToday
                ? "You've already listened to a story today. Come back tomorrow to continue your streak!"
                : "Listen to a story today to keep your streak going!"}
            </p>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 text-sm text-gray-400">Loading streak history...</span>
            </div>
          ) : history && history.length > 0 ? (
            <div>
              <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-400" />
                Last 7 Days
              </h4>
              
              <div className="grid grid-cols-7 gap-1">
                {history.map((active, index) => (
                  <div key={index} className="flex flex-col items-center gap-1">
                    <div 
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        active 
                          ? "bg-gradient-to-br from-amber-500 to-red-500 text-white"
                          : "bg-gray-800 text-gray-500"
                      )}
                    >
                      {active ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    </div>
                    <span className="text-xs text-gray-400">{dayNames[index]}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-sm text-gray-400">
                Start listening to build your streak history!
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}