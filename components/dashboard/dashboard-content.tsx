"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PlusCircle, Clock, Book, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DashboardNavbar } from "@/components/dashboard/navbar";
import { ClientDate } from "@/components/client-date";
import { FormattedDuration } from "@/components/formatted-date";
import { useRecentStories, useStoryCount } from "@/hooks/query/useStories";
import { StoryThumbnail } from "@/components/story/story-thumbnail";
import { Story } from "@/types/story";
import { SubscriptionFeatures } from "@/types/subscription";

interface DashboardContentProps {
  userName: string;
  initialStories?: Story[];
  initialStoryCount?: number;
  initialSubscriptionFeatures?: SubscriptionFeatures | null;
}

export function DashboardContent({ 
  userName,
  initialStories = [],
  initialStoryCount = 0,
  initialSubscriptionFeatures = null
}: DashboardContentProps) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  
  // Use the initial data to populate the query cache
  const { 
    data: stories = initialStories, 
    isLoading: isLoadingStories,
    isError: hasStoriesError, 
    error: storiesError,
    refetch: refetchStories
  } = useRecentStories({
    initialData: initialStories.length > 0 ? initialStories : undefined,
  });
  
  // Also use initial data for story count
  const { 
    data: storyCount = initialStoryCount,
    isLoading: isLoadingCount,
    refetch: refetchCount
  } = useStoryCount({
    initialData: initialStoryCount > 0 ? initialStoryCount : undefined,
  });

  // Set mounted after hydration to avoid SSR/client hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const refreshDashboardData = async () => {
    await Promise.all([
      refetchStories(),
      refetchCount()
    ]);
  };

  // During hydration, use a simplified version based on the initial data
  // This prevents hydration mismatches and layout shifts
  if (!isMounted) {
    return (
      <>
        <DashboardNavbar />
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <header className="mb-10">
            <h1 className="text-3xl font-bold text-white mb-2">
              Hello, {userName.split(" ")[0] || "there"}!
            </h1>
            <p className="text-gray-400">
              Your personal story library and creation dashboard
            </p>
          </header>
          
          {initialStories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
              {initialStories.map((story) => (
                <div 
                  key={story.id}
                  className="bg-gray-900 rounded-xl p-6 border border-gray-800 relative overflow-hidden"
                >
                  {/* Static content from initial data */}
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {story.title}
                  </h3>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 bg-gray-900 rounded-xl border border-gray-800 flex items-center justify-center">
              <p className="text-gray-400">Loading stories...</p>
            </div>
          )}
        </div>
      </>
    );
  }

  // Handle error state
  if (hasStoriesError) {
    return (
      <>
        <DashboardNavbar />
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <div className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2 text-white">
              Error Loading Dashboard
            </h2>
            <p className="text-gray-400 mb-4">
              {storiesError instanceof Error ? storiesError.message : "Failed to load your stories."}
            </p>
            <Button onClick={refreshDashboardData}>
              <RefreshCw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardNavbar />
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <header className="mb-10 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Hello, {userName.split(" ")[0] || "there"}!
              </h1>
              <p className="text-gray-400">
                Your personal story library and creation dashboard
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshDashboardData}
              disabled={isLoadingStories || isLoadingCount}
              className="border-gray-700 hover:bg-gray-800"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingStories || isLoadingCount ? 'animate-spin' : ''}`} />
              {isLoadingStories || isLoadingCount ? 'Refreshing...' : 'Refresh'}
            </Button>
          </header>

          {stories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
              {stories.map((story: Story) => (
                <div 
                  key={story.id}
                  className="bg-gray-900 rounded-xl p-6 border border-gray-800 cursor-pointer hover:border-gray-700 transition-all relative overflow-hidden group"
                  onClick={() => router.push(`/dashboard/stories/${story.id}`)}
                >
                  {/* Use StoryThumbnail for consistent, optimized image display */}
                  <div className="absolute inset-0 opacity-10 group-hover:opacity-15 transition-opacity">
                    <StoryThumbnail 
                      story={story}
                      showTitle={false}
                      aspectRatio="landscape"
                    />
                  </div>
                  
                  <div className="relative z-10">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {story.title}
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded">
                        {story.language === 'en' ? 'English' : 
                         story.language === 'fr' ? 'French' : 
                         story.language === 'ja' ? 'Japanese' : 
                         story.language === 'id' ? 'Indonesian' : story.language}
                      </span>
                      {story.duration && (
                        <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded">
                          <FormattedDuration seconds={story.duration} />
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mb-4">
                      Created on <ClientDate date={story.created_at} format="short" />
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-gray-700 hover:bg-gray-800"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering the parent onClick
                        router.push(`/dashboard/stories/${story.id}?autoplay=true`);
                      }}
                    >
                      <Clock className="h-3.5 w-3.5 mr-1.5" />
                      Listen Now
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-gray-900/50 rounded-xl border border-gray-800">
              <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-900/30 text-indigo-400">
                <Book className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-semibold mb-2 text-white">
                Create your first bedtime story
              </h2>
              <p className="text-gray-400 max-w-md mx-auto mb-6">
                Upload photos and let our AI transform your precious moments into magical tales.
              </p>
              <Button
                onClick={() => router.push("/dashboard/create")}
                className="bg-indigo-600 hover:bg-indigo-700 px-6 text-white"
              >
                <PlusCircle className="mr-2 h-4 w-4 text-white" />
                Create New Story
              </Button>
            </div>
          )}

          <div className="mt-12">
            <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
              <Clock className="mr-2 h-5 w-5 text-indigo-400" />
              Recent Activity
            </h2>
            <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
              {isLoadingStories || isLoadingCount ? (
                <div className="h-32 animate-pulse bg-gray-800 rounded-lg"></div>
              ) : storyCount > 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-300">
                    You have created {storyCount} {storyCount === 1 ? 'story' : 'stories'} so far!
                  </p>
                  {stories.length > 0 && (
                    <p className="text-gray-400 mt-2">
                      Your most recent story: <span className="text-indigo-400">{stories[0].title}</span> 
                      <span className="text-gray-500"> • </span>
                      <ClientDate date={stories[0].created_at} format="short" className="text-gray-400" />
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">
                  Your story creation activity will appear here.
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}