"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  PlusCircle, Play, Heart, Moon, Star, 
  History, Mic, Calendar, Clock, Sparkles, 
  Settings
} from "lucide-react";
import { motion } from "framer-motion";

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
  primary?: boolean;
  new?: boolean;
  disabled?: boolean;
}

interface QuickActionsProps {
  lastPlayedStory?: {
    id: string;
    title: string;
    progress?: number;
  } | null;
  userPreferences?: Record<string, any>;
  favoritesCount?: number;
  subscriptionTier?: string;
  onActionClick?: (action: string) => void;
}

// Individual action button component
export function ActionButton({ 
  icon, 
  label, 
  onClick, 
  href, 
  primary = false,
  new: isNew = false,
  disabled = false
}: QuickActionProps) {
  const router = useRouter();
  
  const handleClick = () => {
    if (disabled) return;
    
    if (onClick) {
      onClick();
    } else if (href) {
      router.push(href);
    }
  };
  
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.03 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={handleClick}
      className={`relative h-auto py-4 px-4 rounded-xl flex flex-col items-center justify-center gap-2 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${
        primary 
          ? "bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white" 
          : "bg-gray-800/70 hover:bg-gray-700/70 border border-gray-700 text-white"
      }`}
    >
      {isNew && (
        <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
          NEW
        </span>
      )}
      <div className={`${primary ? "text-white" : "text-indigo-400"}`}>
        {icon}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </motion.button>
  );
}

// Helper function to determine if it's evening time
const isEveningTime = () => {
  const hour = new Date().getHours();
  return hour >= 17 && hour <= 23; // 5pm to 11pm
};

// Helper to determine if it's morning
const isMorningTime = () => {
  const hour = new Date().getHours();
  return hour >= 5 && hour <= 10; // 5am to 10am
};

export function QuickActions({ 
  lastPlayedStory, 
  userPreferences = {}, 
  favoritesCount = 0,
  subscriptionTier = 'free',
  onActionClick
}: QuickActionsProps) {
  const router = useRouter();
  const [isEvening, setIsEvening] = useState(false);
  const [isMorning, setIsMorning] = useState(false);

  // Features based on subscription tier
  const hasCustomVoices = subscriptionTier !== 'free';
  
  // Update time of day on mount
  useEffect(() => {
    setIsEvening(isEveningTime());
    setIsMorning(isMorningTime());
    
    // Check every hour
    const interval = setInterval(() => {
      setIsEvening(isEveningTime());
      setIsMorning(isMorningTime());
    }, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Track dashboard interaction
  const trackAction = (action: string) => {
    if (onActionClick) {
      onActionClick(action);
    }
  };

  return (
    <div className="bg-gradient-to-r from-indigo-900/20 to-purple-900/20 rounded-xl p-4 mb-8">
      <h3 className="text-lg font-medium text-white mb-3">Quick Actions</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {/* Create Story - Always Primary */}
        <ActionButton 
          icon={<PlusCircle className="h-5 w-5" />} 
          label="Create Story" 
          href="/dashboard/create" 
          primary={true}
          onClick={() => trackAction('create_story')}
        />
        
        {/* Continue Story - If available */}
        {lastPlayedStory && (
          <ActionButton 
            icon={<Play className="h-5 w-5" />} 
            label="Continue Story" 
            onClick={() => {
              trackAction('continue_story');
              router.push(`/dashboard/stories/${lastPlayedStory.id}?autoplay=true`);
            }}
          />
        )}
        
        {/* Time-specific suggestions */}
        {isEvening && (
          <ActionButton 
            icon={<Moon className="h-5 w-5" />} 
            label="Bedtime Stories" 
            onClick={() => {
              trackAction('bedtime_stories');
              router.push('/dashboard/library?theme=bedtime');
            }}
          />
        )}
        
        {isMorning && (
          <ActionButton 
            icon={<Star className="h-5 w-5" />} 
            label="Morning Stories" 
            onClick={() => {
              trackAction('morning_stories');
              router.push('/dashboard/library?theme=educational');
            }}
          />
        )}
        
        {/* Favorites - If user has favorites */}
        {favoritesCount > 0 && (
          <ActionButton 
            icon={<Heart className="h-5 w-5" />} 
            label="Favorites" 
            onClick={() => {
              trackAction('view_favorites');
              router.push('/dashboard/library?favorites=true');
            }}
          />
        )}
        
        {/* History */}
        <ActionButton 
          icon={<History className="h-5 w-5" />} 
          label="History" 
          onClick={() => {
            trackAction('view_history');
            router.push('/dashboard/history');
          }}
        />
        
        {/* Schedule Stories - Premium Feature */}
        <ActionButton 
          icon={<Calendar className="h-5 w-5" />} 
          label="Schedule" 
          onClick={() => {
            trackAction('schedule_stories');
            if (subscriptionTier === 'free') {
              router.push('/dashboard/subscription');
            } else {
              router.push('/dashboard/schedule');
            }
          }}
          new={subscriptionTier !== 'free'}
          disabled={subscriptionTier === 'free'}
        />
        
        {/* Voice Settings */}
        <ActionButton 
          icon={<Mic className="h-5 w-5" />} 
          label={hasCustomVoices ? "Voice Profiles" : "Voice Settings"} 
          onClick={() => {
            trackAction('voice_settings');
            router.push('/dashboard/settings/voice');
          }}
        />
        
        {/* Bedtime Reminders - For families */}
        {subscriptionTier === 'family' && (
          <ActionButton 
            icon={<Clock className="h-5 w-5" />} 
            label="Bedtime Reminder" 
            onClick={() => {
              trackAction('bedtime_reminder');
              router.push('/dashboard/settings/reminders');
            }}
          />
        )}
        
        {/* Theme Editor - Premium Feature */}
        {subscriptionTier !== 'free' && (
          <ActionButton 
            icon={<Sparkles className="h-5 w-5" />} 
            label="Theme Editor" 
            onClick={() => {
              trackAction('theme_editor');
              router.push('/dashboard/themes');
            }}
          />
        )}
        
        {/* Settings */}
        <ActionButton 
          icon={<Settings className="h-5 w-5" />} 
          label="Settings" 
          onClick={() => {
            trackAction('settings');
            router.push('/dashboard/settings');
          }}
        />
      </div>
    </div>
  );
}