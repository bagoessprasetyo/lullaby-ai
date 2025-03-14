"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, BookOpen, Clock, Calendar, Star, Crown, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserListeningMilestones } from "@/lib/services/usage-tracking-service";

interface MilestoneTrackerProps {
  userId: string;
  className?: string;
  isLoading?: boolean;
  // For static rendering or testing
  initialMilestones?: {
    totalStoriesListened: number;
    totalMinutesListened: number;
    longestStreak: number;
    nextMilestone: {
      type: 'stories' | 'minutes' | 'streak';
      current: number;
      target: number;
      progress: number;
    } | null;
  };
}

// Helper to determine icon for milestone type
const getMilestoneIcon = (type: 'stories' | 'minutes' | 'streak') => {
  switch (type) {
    case 'stories': return <BookOpen className="h-5 w-5 text-indigo-400" />;
    case 'minutes': return <Clock className="h-5 w-5 text-green-400" />;
    case 'streak': return <Calendar className="h-5 w-5 text-amber-400" />;
    default: return <Star className="h-5 w-5 text-indigo-400" />;
  }
};

// Helper to format the milestone text
const getMilestoneText = (type: 'stories' | 'minutes' | 'streak', current: number, target: number) => {
  switch (type) {
    case 'stories':
      return `Listen to ${target} stories (${current}/${target})`;
    case 'minutes':
      return `Listen for ${target} minutes (${current}/${target})`;
    case 'streak':
      return `Maintain a ${target}-day streak (${current}/${target})`;
    default:
      return `Progress: ${current}/${target}`;
  }
};

// Achievement badges that can be earned
const ACHIEVEMENTS = [
  { id: 'first_story', title: 'First Story', description: 'Listened to your first story', icon: <BookOpen className="h-5 w-5 text-white" />, requiredStories: 1 },
  { id: 'story_explorer', title: 'Story Explorer', description: 'Listened to 10 different stories', icon: <Trophy className="h-5 w-5 text-white" />, requiredStories: 10 },
  { id: 'story_enthusiast', title: 'Story Enthusiast', description: 'Listened to 25 different stories', icon: <Star className="h-5 w-5 text-white" />, requiredStories: 25 },
  { id: 'bedtime_routine', title: 'Bedtime Routine', description: 'Listened for 7 days in a row', icon: <Calendar className="h-5 w-5 text-white" />, requiredStreak: 7 },
  { id: 'dedicated_listener', title: 'Dedicated Listener', description: 'Listened for 14 days in a row', icon: <Crown className="h-5 w-5 text-white" />, requiredStreak: 14 },
  { id: 'time_traveler', title: 'Time Traveler', description: 'Listened for over 60 minutes', icon: <Clock className="h-5 w-5 text-white" />, requiredMinutes: 60 },
  { id: 'story_master', title: 'Story Master', description: 'Listened for over 300 minutes', icon: <TrendingUp className="h-5 w-5 text-white" />, requiredMinutes: 300 },
];

export function MilestoneTracker({
  userId,
  className = "",
  isLoading: externalLoading = false,
  initialMilestones
}: MilestoneTrackerProps) {
  const [isLoading, setIsLoading] = useState(externalLoading || !initialMilestones);
  const [milestones, setMilestones] = useState(initialMilestones || {
    totalStoriesListened: 0,
    totalMinutesListened: 0,
    longestStreak: 0,
    nextMilestone: null
  });
  const [earnedAchievements, setEarnedAchievements] = useState<string[]>([]);
  const [showNewAchievement, setShowNewAchievement] = useState(false);
  const [newAchievement, setNewAchievement] = useState<typeof ACHIEVEMENTS[0] | null>(null);
  
  // Load milestone data
  useEffect(() => {
    if (!userId || initialMilestones) return;
    
    const fetchMilestones = async () => {
      try {
        setIsLoading(true);
        const data = await getUserListeningMilestones(userId);
        setMilestones({
          totalStoriesListened: Number(data.totalStoriesListened),
          totalMinutesListened: Number(data.totalMinutesListened),
          longestStreak: Number(data.longestStreak),
          nextMilestone: data.nextMilestone ? {
            type: data.nextMilestone.type as 'stories' | 'minutes' | 'streak',
            current: Number(data.nextMilestone.current),
            target: Number(data.nextMilestone.target),
            progress: Number(data.nextMilestone.progress)
          } : null
        });
        
        // Calculate earned achievements
        const earned = ACHIEVEMENTS.filter(achievement => {
          if (achievement.requiredStories && data.totalStoriesListened >= achievement.requiredStories) {
            return true;
          }
          if (achievement.requiredStreak && data.longestStreak >= achievement.requiredStreak) {
            return true;
          }
          if (achievement.requiredMinutes && data.totalMinutesListened >= achievement.requiredMinutes) {
            return true;
          }
          return false;
        }).map(a => a.id);
        
        // Check local storage for previously seen achievements
        const previouslyEarned = localStorage.getItem(`achievements_${userId}`) || '[]';
        const previousEarned = JSON.parse(previouslyEarned) as string[];
        
        // Find new achievements
        const newEarned = earned.filter(id => !previousEarned.includes(id));
        
        // If there's a new achievement, show it
        if (newEarned.length > 0) {
          const achievementToShow = ACHIEVEMENTS.find(a => a.id === newEarned[0]) || null;
          if (achievementToShow) {
            setNewAchievement(achievementToShow);
            setShowNewAchievement(true);
            
            // Update local storage
            localStorage.setItem(`achievements_${userId}`, JSON.stringify([...previousEarned, ...newEarned]));
          }
        }
        
        setEarnedAchievements(earned);
      } catch (error) {
        console.error('Error fetching milestones:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMilestones();
  }, [userId, initialMilestones]);
  
  // Dismiss achievement notification
  const dismissAchievement = () => {
    setShowNewAchievement(false);
    setNewAchievement(null);
  };
  
  // Calculate earned achievement count for display
  const earnedCount = earnedAchievements.length;
  const totalAchievements = ACHIEVEMENTS.length;
  
  return (
    <Card className={`bg-gray-900/50 border-gray-800 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Trophy className="mr-2 h-5 w-5 text-amber-400" />
          Achievements & Milestones
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <div className="flex gap-2 pt-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-10 rounded-full" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* New Achievement Notification */}
            {showNewAchievement && newAchievement && (
              <motion.div 
                className="bg-gradient-to-r from-indigo-900/80 to-purple-900/80 rounded-lg p-4 mb-4 relative overflow-hidden"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-400 to-purple-400" />
                
                <div className="flex items-center">
                  <div className="bg-gradient-to-br from-indigo-600 to-purple-600 w-12 h-12 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    {newAchievement.icon}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white">Achievement Unlocked!</h4>
                    <p className="text-indigo-200 font-medium">{newAchievement.title}</p>
                    <p className="text-gray-300 text-sm">{newAchievement.description}</p>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={dismissAchievement}
                    className="text-gray-300 hover:text-white"
                  >
                    Dismiss
                  </Button>
                </div>
              </motion.div>
            )}
            
            {/* Progress Stats */}
            <div className="grid grid-cols-3 gap-2 text-center mb-4">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-2xl font-bold text-white">{milestones.totalStoriesListened}</p>
                <p className="text-xs text-gray-400">Stories</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-2xl font-bold text-white">{milestones.totalMinutesListened}</p>
                <p className="text-xs text-gray-400">Minutes</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-2xl font-bold text-white">{milestones.longestStreak}</p>
                <p className="text-xs text-gray-400">Day Streak</p>
              </div>
            </div>
            
            {/* Next Milestone */}
            {milestones.nextMilestone ? (
              <div className="bg-gray-800/30 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  {getMilestoneIcon(milestones.nextMilestone.type)}
                  <h4 className="text-sm font-medium text-white ml-2">Next Milestone</h4>
                </div>
                
                <p className="text-xs text-gray-300 mb-2">
                  {getMilestoneText(
                    milestones.nextMilestone.type,
                    milestones.nextMilestone.current,
                    milestones.nextMilestone.target
                  )}
                </p>
                
                <Progress
                  value={milestones.nextMilestone.progress * 100}
                  className={
                    milestones.nextMilestone.type === 'stories'
                      ? 'bg-indigo-500'
                      : milestones.nextMilestone.type === 'minutes'
                        ? 'bg-green-500'
                        : 'bg-amber-500'
                  }
                />
              </div>
            ) : (
              <div className="bg-gray-800/30 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-400">
                  Start listening to stories to unlock milestones!
                </p>
              </div>
            )}
            
            {/* Achievements */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-white">Achievements</h4>
                <span className="text-xs text-gray-400">{earnedCount} of {totalAchievements}</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {ACHIEVEMENTS.map((achievement) => {
                  const isEarned = earnedAchievements.includes(achievement.id);
                  
                  return (
                    <div 
                      key={achievement.id}
                      className={`w-10 h-10 rounded-full flex items-center justify-center relative ${
                        isEarned 
                          ? 'bg-gradient-to-br from-indigo-600 to-purple-600' 
                          : 'bg-gray-800'
                      }`}
                      title={`${achievement.title}: ${achievement.description}`}
                    >
                      {isEarned ? (
                        achievement.icon
                      ) : (
                        <div className="text-gray-500 opacity-50">
                          {achievement.icon}
                        </div>
                      )}
                      
                      {!isEarned && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 17v.01" stroke="#888" />
                            <path d="M12 14v-4" stroke="#888" />
                            <circle cx="12" cy="12" r="10" stroke="#555" />
                          </svg>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </CardContent>
      
      <CardFooter className="pt-0">
        <Button 
          variant="link" 
          className="text-indigo-400 hover:text-indigo-300 w-full"
          onClick={() => window.open('/dashboard/achievements', '_blank')}
        >
          View all achievements
        </Button>
      </CardFooter>
    </Card>
  );
}