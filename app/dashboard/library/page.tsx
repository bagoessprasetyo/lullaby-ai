// app/dashboard/library/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { DashboardNavbar } from "@/components/dashboard/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { motion } from "framer-motion";
import {
  Search,
  BookOpen,
  Plus,
  Grid,
  List,
  Calendar,
  Clock,
  SlidersHorizontal,
  ChevronDown,
  BookMarked,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StoryCard } from "@/components/library/story-card";
import { StoryListItem } from "@/components/library/story-list-item";
import { EmptyLibrary } from "@/components/library/empty-library";
import { FavoriteStories } from "@/components/library/favorite-stories";
import { RecentStories } from "@/components/library/recent-stories";
import { Story } from "@/types/story"; 
import { getStoriesWithFilters, toggleStoryFavorite, deleteStory } from "@/lib/services/story-service";

export default function LibraryPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterLanguage, setFilterLanguage] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState("all");
  const [stories, setStories] = useState<Story[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStories = async () => {
      if (!session?.user?.id) return;
      
      setIsLoading(true);
      try {
        const { stories, count } = await getStoriesWithFilters(
          session.user.id,
          {
            filterLanguage,
            isFavorite: currentTab === "favorites" ? true : null,
            searchQuery,
            sortBy
          }
        );
        
        setStories(stories);
        setTotalCount(count);
      } catch (error) {
        console.error("Error fetching stories:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchStories();
    }
  }, [session, status, currentTab, filterLanguage, sortBy, searchQuery]);

  const handleToggleFavorite = async (storyId: string, currentFavorite: boolean) => {
    try {
      const updatedStory = await toggleStoryFavorite(storyId, !currentFavorite);
      
      if (updatedStory) {
        // Update local state
        setStories(prevStories => 
          prevStories.map(story => 
            story.id === storyId 
              ? {...story, is_favorite: !currentFavorite} 
              : story
          )
        );
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    if (window.confirm("Are you sure you want to delete this story? This action cannot be undone.")) {
      try {
        const success = await deleteStory(storyId);
        
        if (success) {
          // Remove from local state
          setStories(prevStories => prevStories.filter(story => story.id !== storyId));
          setTotalCount(prev => prev - 1);
        }
      } catch (error) {
        console.error("Error deleting story:", error);
      }
    }
  };

  const getLanguageName = (code: string) => {
    switch (code) {
      case "en": return "English";
      case "fr": return "French";
      case "ja": return "Japanese";
      case "id": return "Indonesian";
      default: return code;
    }
  };

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
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Your Stories</h1>
            <p className="text-gray-400">
              Browse, play, and manage your bedtime stories
            </p>
          </div>
          
          <Button
            onClick={() => router.push("/dashboard/create")}
            className="bg-indigo-600 hover:bg-indigo-700 flex-shrink-0 text-white"
          >
            <Plus className="mr-2 h-4 w-4 text-white" />
            Create New Story
          </Button>
        </div>
        
        <div className="mb-8">
          <Tabs defaultValue="all" value={currentTab} onValueChange={setCurrentTab}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <TabsList className="bg-gray-900/70 border border-gray-800 p-1">
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:bg-gray-800 data-[state=active]:text-white"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  All Stories
                </TabsTrigger>
                <TabsTrigger
                  value="favorites"
                  className="data-[state=active]:bg-gray-800 data-[state=active]:text-white"
                >
                  <BookMarked className="h-4 w-4 mr-2" />
                  Favorites
                </TabsTrigger>
              </TabsList>
              
              <div className="flex items-center gap-2">
                <div className="relative w-full md:w-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input 
                    placeholder="Search stories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-gray-900 border-gray-700 w-full md:w-[200px] lg:w-[300px]"
                  />
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="border-gray-700">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Filters
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-gray-900 border-gray-800">
                    <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-800" />
                    <DropdownMenuGroup>
                      <DropdownMenuItem 
                        className={cn(
                          "cursor-pointer",
                          sortBy === "newest" && "bg-gray-800 text-indigo-300"
                        )}
                        onClick={() => setSortBy("newest")}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>Newest First</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className={cn(
                          "cursor-pointer",
                          sortBy === "oldest" && "bg-gray-800 text-indigo-300"
                        )}
                        onClick={() => setSortBy("oldest")}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>Oldest First</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className={cn(
                          "cursor-pointer",
                          sortBy === "longest" && "bg-gray-800 text-indigo-300"
                        )}
                        onClick={() => setSortBy("longest")}
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        <span>Longest First</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className={cn(
                          "cursor-pointer",
                          sortBy === "shortest" && "bg-gray-800 text-indigo-300"
                        )}
                        onClick={() => setSortBy("shortest")}
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        <span>Shortest First</span>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    
                    <DropdownMenuSeparator className="bg-gray-800" />
                    <DropdownMenuLabel>Language</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-800" />
                    <DropdownMenuGroup>
                      <DropdownMenuItem 
                        className={cn(
                          "cursor-pointer",
                          filterLanguage === null && "bg-gray-800 text-indigo-300"
                        )}
                        onClick={() => setFilterLanguage(null)}
                      >
                        <span>All Languages</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className={cn(
                          "cursor-pointer",
                          filterLanguage === "en" && "bg-gray-800 text-indigo-300"
                        )}
                        onClick={() => setFilterLanguage("en")}
                      >
                        <span>English 🇺🇸</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className={cn(
                          "cursor-pointer",
                          filterLanguage === "fr" && "bg-gray-800 text-indigo-300"
                        )}
                        onClick={() => setFilterLanguage("fr")}
                      >
                        <span>French 🇫🇷</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className={cn(
                          "cursor-pointer",
                          filterLanguage === "ja" && "bg-gray-800 text-indigo-300"
                        )}
                        onClick={() => setFilterLanguage("ja")}
                      >
                        <span>Japanese 🇯🇵</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className={cn(
                          "cursor-pointer",
                          filterLanguage === "id" && "bg-gray-800 text-indigo-300"
                        )}
                        onClick={() => setFilterLanguage("id")}
                      >
                        <span>Indonesian 🇮🇩</span>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <div className="flex bg-gray-900 border border-gray-700 rounded-md overflow-hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "rounded-none h-9 w-9",
                      viewMode === "grid" && "bg-gray-800 text-white"
                    )}
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "rounded-none h-9 w-9",
                      viewMode === "list" && "bg-gray-800 text-white"
                    )}
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="bg-gray-900 rounded-xl p-6 h-64 animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <>
                <TabsContent value="all" className="pt-2">
                  {totalCount === 0 ? (
                    <EmptyLibrary />
                  ) : stories.length === 0 ? (
                    <div className="text-center py-16 bg-gray-900/50 border border-gray-800 rounded-xl">
                      <div className="bg-gray-800/70 rounded-full p-3 inline-flex mb-4">
                        <Search className="h-6 w-6 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">No stories found</h3>
                      <p className="text-gray-400 max-w-md mx-auto">
                        We couldn't find any stories matching your current filters.
                        Try adjusting your search or filters.
                      </p>
                    </div>
                  ) : viewMode === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {stories.map((story) => (
                        <StoryCard
                          key={story.id}
                          story={{
                            id: story.id,
                            title: story.title,
                            coverImage: story.images && story.images.length > 0 
                              ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${story.images[0].storage_path}`
                              : "https://via.placeholder.com/300x300?text=No+Image",
                            duration: story.duration || 0,
                            language: story.language || "en",
                            createdAt: new Date(story.created_at),
                            isFavorite: story.is_favorite,
                            thumbnail: story.images && story.images.length > 0 
                              ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${story.images[0].storage_path}` 
                              : "https://via.placeholder.com/100x100?text=No+Image",
                            backgroundMusic: "", // TODO: Get from backend if needed
                            characters: [], // TODO: Get from backend if needed
                            tags: [], // TODO: Get from backend if needed
                          }}
                          onToggleFavorite={() => handleToggleFavorite(story.id, story.is_favorite)}
                          onDelete={() => handleDeleteStory(story.id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {stories.map((story) => (
                        <StoryListItem
                          key={story.id}
                          story={{
                            id: story.id,
                            title: story.title,
                            coverImage: story.images && story.images.length > 0 
                              ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${story.images[0].storage_path}`
                              : "https://via.placeholder.com/300x300?text=No+Image",
                            duration: story.duration || 0,
                            language: story.language || "en",
                            createdAt: new Date(story.created_at),
                            isFavorite: story.is_favorite,
                            thumbnail: story.images && story.images.length > 0 
                              ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${story.images[0].storage_path}` 
                              : "https://via.placeholder.com/100x100?text=No+Image",
                            backgroundMusic: "", // TODO: Get from backend if needed
                            characters: [], // TODO: Get from backend if needed
                            tags: [], // TODO: Get from backend if needed
                          }}
                          onToggleFavorite={() => handleToggleFavorite(story.id, story.is_favorite)}
                          onDelete={() => handleDeleteStory(story.id)}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="favorites" className="pt-2">
                  {stories.filter(s => s.is_favorite).length === 0 ? (
                    <FavoriteStories />
                  ) : stories.length === 0 ? (
                    <div className="text-center py-16 bg-gray-900/50 border border-gray-800 rounded-xl">
                      <div className="bg-gray-800/70 rounded-full p-3 inline-flex mb-4">
                        <Search className="h-6 w-6 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">No favorite stories found</h3>
                      <p className="text-gray-400 max-w-md mx-auto">
                        We couldn't find any favorite stories matching your current filters.
                        Try adjusting your search or filters.
                      </p>
                    </div>
                  ) : viewMode === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {stories.map((story) => (
                        <StoryCard
                          key={story.id}
                          story={{
                            id: story.id,
                            title: story.title,
                            coverImage: story.images && story.images.length > 0 
                              ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${story.images[0].storage_path}`
                              : "https://via.placeholder.com/300x300?text=No+Image",
                            duration: story.duration || 0,
                            language: story.language || "en",
                            createdAt: new Date(story.created_at),
                            isFavorite: story.is_favorite,
                            thumbnail: story.images && story.images.length > 0 
                              ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${story.images[0].storage_path}` 
                              : "https://via.placeholder.com/100x100?text=No+Image",
                            backgroundMusic: "", // TODO: Get from backend if needed
                            characters: [], // TODO: Get from backend if needed
                            tags: [], // TODO: Get from backend if needed
                          }}
                          onToggleFavorite={() => handleToggleFavorite(story.id, story.is_favorite)}
                          onDelete={() => handleDeleteStory(story.id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {stories.map((story) => (
                        <StoryListItem
                          key={story.id}
                          story={{
                            id: story.id,
                            title: story.title,
                            coverImage: story.images && story.images.length > 0 
                              ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${story.images[0].storage_path}`
                              : "https://via.placeholder.com/300x300?text=No+Image",
                            duration: story.duration || 0,
                            language: story.language || "en",
                            createdAt: new Date(story.created_at),
                            isFavorite: story.is_favorite,
                            thumbnail: story.images && story.images.length > 0 
                              ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${story.images[0].storage_path}` 
                              : "https://via.placeholder.com/100x100?text=No+Image",
                            backgroundMusic: "", // TODO: Get from backend if needed
                            characters: [], // TODO: Get from backend if needed
                            tags: [], // TODO: Get from backend if needed
                          }}
                          onToggleFavorite={() => handleToggleFavorite(story.id, story.is_favorite)}
                          onDelete={() => handleDeleteStory(story.id)}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
        
        {/* Recent Stories Section (only shown when there are stories) */}
        {!isLoading && totalCount > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
              <Sparkles className="mr-2 h-5 w-5 text-indigo-400" />
              Recently Played
            </h2>
            <RecentStories stories={stories.slice(0, 3)} />
          </div>
        )}
      </div>
    </>
  );
}