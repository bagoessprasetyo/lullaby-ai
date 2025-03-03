"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PlusCircle, Clock, Book, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DashboardNavbar } from "@/components/dashboard/navbar";
import { getRecentStories, getStoryCount, Story } from "@/lib/services/story-service";
import { ClientDate } from "@/components/client-date";
import { FormattedDuration } from "../formatted-date";

interface DashboardContentProps {
  initialStories: Story[];
  initialStoryCount: number;
  userName: string;
  userId: string;
}

export function DashboardContent({ 
  initialStories, 
  initialStoryCount, 
  userName,
  userId
}: DashboardContentProps) {
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>(initialStories);
  const [storyCount, setStoryCount] = useState(initialStoryCount);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted after hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

//   const refreshDashboardData = async () => {
//     console.log('Refreshing dashboard data');
//     setIsLoading(true);
//     try {
//       const recentStories = await getRecentStories(userId);
//       const count = await getStoryCount(userId);
      
//       console.log('userId:', userId);
//       console.log('Recent stories after refresh:', recentStories);
      
//       setStories(recentStories);
//       setStoryCount(count);
//     } catch (error) {
//       console.error("Error refreshing dashboard data:", error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

  // Return a loading skeleton during SSR and initial client render
  if (!isMounted) {
    return (
      <>
        <DashboardNavbar />
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <div className="mb-10">
            <div className="h-12 bg-gray-800/30 rounded animate-pulse w-1/3"></div>
            <div className="h-6 bg-gray-800/30 rounded animate-pulse w-2/3 mt-2"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-gray-900 rounded-xl p-6 h-64 animate-pulse"
              ></div>
            ))}
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
          </header>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-gray-900 rounded-xl p-6 h-64 animate-pulse"
                ></div>
              ))}
            </div>
          ) : stories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {stories.map((story) => (
                <div 
                  key={story.id}
                  className="bg-gray-900 rounded-xl p-6 border border-gray-800 cursor-pointer hover:border-gray-700 transition-all"
                  onClick={() => router.push(`/dashboard/stories/${story.id}`)}
                >
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
                    <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded">
                      {/* Use the client-safe duration component */}
                      <FormattedDuration seconds={story.duration || 0} />
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mb-4">
                    Created on <ClientDate date={story.created_at} format="short" />
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-gray-700 hover:bg-gray-800"
                  >
                    <Clock className="h-3.5 w-3.5 mr-1.5" />
                    Listen Now
                  </Button>
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
              {isLoading ? (
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