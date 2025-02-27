// app/dashboard/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, PlusCircle, Clock, Book } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardNavbar } from "@/components/dashboard/navbar";
import { getRecentStories, getStoryCount, Story } from "@/lib/services/story-service";
import { formatDuration } from "@/lib/format-duration";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  console.log(session);
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([]);
  const [storyCount, setStoryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("Auth Status:", status);
    console.log("Session:", session);
    console.log("User ID:", session?.user?.id);
    const fetchData = async () => {
      if (session?.user?.id) {
        setIsLoading(true);
        try {
          // Fetch stories from Supabase
          const recentStories = await getRecentStories(session.user.id);
          const count = await getStoryCount(session.user.id);
          
          setStories(recentStories);
          setStoryCount(count);
        } catch (error) {
          console.error("Error fetching dashboard data:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    if (status === "authenticated") {
      fetchData();
    }
  }, [session, status]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
          <p className="text-gray-400">Loading your stories...</p>
        </div>
      </div>
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
          <header className="mb-10">
            <h1 className="text-3xl font-bold text-white mb-2">
              Hello, {session?.user?.name?.split(" ")[0] || "there"}!
            </h1>
            <p className="text-gray-400">
              Your personal story library and creation dashboard
            </p>
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
                      {formatDuration(story.duration || 0)}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mb-4">
                    Created on {new Date(story.created_at).toLocaleDateString()}
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
                className="bg-indigo-600 hover:bg-indigo-700 px-6"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
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
                      <span className="text-gray-400">{new Date(stories[0].created_at).toLocaleDateString()}</span>
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