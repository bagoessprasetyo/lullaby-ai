"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Play, 
  RotateCcw, 
  ThumbsUp,
  Search
} from "lucide-react";
import { formatDuration } from "@/lib/format-duration";
import { PlayHistoryEntry } from "@/lib/services/history-service";

interface ActivityTimelineProps {
  plays: PlayHistoryEntry[];
  onResume?: (storyId: string) => void;
}

export function ActivityTimeline({ 
  plays, 
  onResume 
}: ActivityTimelineProps) {
  const router = useRouter();
  
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
  
  // Group plays by date for better display
  const groupedPlays: { [key: string]: PlayHistoryEntry[] } = plays.reduce((acc, play) => {
    const dateKey = formatDate(play.playedAt);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(play);
    return acc;
  }, {} as { [key: string]: PlayHistoryEntry[] });
  
  // Convert grouped plays to array for rendering
  const groupedPlaysArray = Object.entries(groupedPlays).map(([date, plays]) => ({
    date,
    plays
  }));
  
  // Sort by most recent date first
  groupedPlaysArray.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA;
  });
  
  const handleResume = (storyId: string) => {
    if (onResume) {
      onResume(storyId);
    } else {
      router.push(`/dashboard/stories/${storyId}?resume=true`);
    }
  };
  
  if (plays.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-900/50 border border-gray-800 rounded-xl">
        <div className="bg-gray-800/70 rounded-full p-3 inline-flex mb-4">
          <Search className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No activity found</h3>
        <p className="text-gray-400 max-w-md mx-auto">
          We couldn't find any listening activity matching your current filters.
          Try adjusting your search or time period.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {groupedPlaysArray.map(({ date, plays }) => (
        <div key={date}>
          <div className="mb-4 sticky top-0 z-10 bg-gray-900/95 py-2">
            <Badge className="bg-gray-800 text-gray-300 font-normal text-sm">
              {date}
            </Badge>
          </div>
          
          <div className="space-y-6">
            {plays.map((play, index) => (
              <div 
                key={play.id}
                className="relative pl-8 pb-6"
                style={{
                  borderLeft: index === plays.length - 1 ? 'none' : '1px dashed rgb(75, 85, 99)',
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
                          <span className="text-gray-400">{formatTime(play.playedAt)}</span>
                          <span className="text-gray-500">•</span>
                          <span className="text-gray-400">{formatDuration(play.duration)}</span>
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
                    </div>
                  </div>
                  
                  {!play.completed && play.progress && (
                    <div className="mt-3">
                      <Progress value={play.progress} className="h-1.5 mb-2" />
                      <div className="flex justify-end">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-gray-700 text-xs flex items-center"
                          onClick={() => handleResume(play.storyId)}
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
        </div>
      ))}
    </div>
  );
}