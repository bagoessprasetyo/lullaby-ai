"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Cloud, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientDate } from "@/components/client-date";

interface WelcomeBackProps {
  userName: string;
  lastVisit?: Date | string | null;
  dismissable?: boolean;
  className?: string;
  onDismiss?: () => void;
}

// Helper to determine greeting based on time of day
const getTimeBasedGreeting = (): string => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 22) return "Good evening";
  return "Good night";
};

// Helper to get time-appropriate icon
const getTimeBasedIcon = () => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) return <Sun className="h-5 w-5 text-yellow-400" />;
  if (hour >= 12 && hour < 17) return <Sun className="h-5 w-5 text-amber-400" />;
  if (hour >= 17 && hour < 22) return <Moon className="h-5 w-5 text-indigo-400" />;
  return <Moon className="h-5 w-5 text-blue-400" />;
};

// Helper to determine personalized message based on last visit
const getPersonalizedMessage = (lastVisit: Date | string | null): string => {
  if (!lastVisit) return "Welcome to your bedtime story dashboard!";
  
  // Convert to Date if string
  const lastVisitDate = typeof lastVisit === 'string' ? new Date(lastVisit) : lastVisit;
  const now = new Date();
  
  // Calculate days difference
  const dayDiff = Math.floor((now.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (dayDiff < 1) return "Welcome back for more stories today!";
  if (dayDiff === 1) return "It's been a day since your last story. Welcome back!";
  if (dayDiff < 7) return `It's been ${dayDiff} days since your last visit. We missed you!`;
  if (dayDiff < 30) return "It's been a while! Welcome back to your stories.";
  return "Welcome back! We're so happy to see you again.";
};

export function WelcomeBack({
  userName,
  lastVisit = null,
  dismissable = true,
  className = "",
  onDismiss
}: WelcomeBackProps) {
  const [visible, setVisible] = useState(true);
  const [greeting, setGreeting] = useState("");
  const [timeIcon, setTimeIcon] = useState<React.ReactNode>(null);
  const [message, setMessage] = useState("");
  
  useEffect(() => {
    // Set greeting and icon based on time of day
    setGreeting(getTimeBasedGreeting());
    setTimeIcon(getTimeBasedIcon());
    
    // Set personalized message based on last visit
    setMessage(getPersonalizedMessage(lastVisit));
    
    // Update greeting every hour
    const interval = setInterval(() => {
      setGreeting(getTimeBasedGreeting());
      setTimeIcon(getTimeBasedIcon());
    }, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [lastVisit]);
  
  const handleDismiss = () => {
    setVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };
  
  // Get first name only
  const firstName = userName.split(' ')[0];
  
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={`relative bg-gradient-to-r from-indigo-900/30 to-purple-900/30 rounded-xl p-4 border border-indigo-800/50 ${className}`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0, margin: 0 }}
          transition={{ duration: 0.3 }}
        >
          {dismissable && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 text-gray-400 hover:text-white"
              onClick={handleDismiss}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Dismiss</span>
            </Button>
          )}
          
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-4">
              <div className="bg-gradient-to-br from-indigo-600/50 to-purple-600/50 w-12 h-12 rounded-full flex items-center justify-center">
                {timeIcon}
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-white flex items-center">
                {greeting}, {firstName}!
                <Sparkles className="h-4 w-4 text-yellow-400 ml-1" />
              </h2>
              
              <p className="text-gray-300 text-sm">
                {message}
                {lastVisit && (
                  <span className="text-gray-400 ml-1 text-xs">
                    Last visit: <ClientDate date={lastVisit} format="relative" />
                  </span>
                )}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}