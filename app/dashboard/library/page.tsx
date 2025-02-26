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

// Mock data for stories
export type Story = {
  id: string;
  title: string;
  coverImage: string;
  duration: number; // in seconds
  language: string;
  createdAt: Date;
  isFavorite: boolean;
  thumbnail: string;
  backgroundMusic?: string;
  characters: { name: string; description?: string }[];
  tags: string[];
};

// Function to generate mock stories (in a real app, this would be an API call)
const generateMockStories = (count: number): Story[] => {
  const languages = ["english", "french", "japanese", "indonesian"];
  const titles = [
    "The Magical Forest Adventure",
    "Journey to the Moon",
    "Sammy's Birthday Surprise",
    "The Friendly Dragon",
    "Lost in the Ocean",
    "Space Explorers",
    "The Enchanted Garden",
    "Dinosaur Discovery",
    "The Brave Little Mouse",
    "Underwater Kingdom"
  ];
  const backgroundMusic = ["calming", "soft", "peaceful", "soothing", "magical"];
  
  return Array.from({ length: count }).map((_, i) => ({
    id: `story-${i + 1}`,
    title: titles[Math.floor(Math.random() * titles.length)],
    coverImage: `https://source.unsplash.com/random/300x300?bedtime,story&sig=${i}`,
    duration: Math.floor(Math.random() * 300) + 60, // 1-6 minutes
    language: languages[Math.floor(Math.random() * languages.length)],
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000), // Last 30 days
    isFavorite: Math.random() > 0.7,
    thumbnail: `https://source.unsplash.com/random/100x100?bedtime,children&sig=${i}`,
    backgroundMusic: backgroundMusic[Math.floor(Math.random() * backgroundMusic.length)],
    characters: [
      { name: "Emma", description: "A curious 8-year-old girl" },
      { name: "Max", description: "Emma's pet dog" }
    ],
    tags: ["bedtime", "adventure", Math.random() > 0.5 ? "fantasy" : "animals"]
  }));
};

export default function LibraryPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterLanguage, setFilterLanguage] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState("all");
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Simulating data fetching
  useEffect(() => {
    const fetchStories = async () => {
      setIsLoading(true);
      // In a real app, this would be an API call
      setTimeout(() => {
        // Generate 0-10 stories to show empty state sometimes for demo
        const storyCount = Math.floor(Math.random() * 11);
        setStories(generateMockStories(storyCount));
        setIsLoading(false);
      }, 1500);
    };

    fetchStories();
  }, []);

  // Filter and sort stories based on current criteria
  const filteredStories = stories
    .filter((story) => {
      // Search filter
      if (searchQuery && !story.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Language filter
      if (filterLanguage && story.language !== filterLanguage) {
        return false;
      }
      
      // Tab filter
      if (currentTab === "favorites" && !story.isFavorite) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sorting
      switch (sortBy) {
        case "newest":
          return b.createdAt.getTime() - a.createdAt.getTime();
        case "oldest":
          return a.createdAt.getTime() - b.createdAt.getTime();
        case "longest":
          return b.duration - a.duration;
        case "shortest":
          return a.duration - b.duration;
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "title-desc":
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

  const toggleFavorite = (id: string) => {
    setStories((prevStories) =>
      prevStories.map((story) =>
        story.id === id ? { ...story, isFavorite: !story.isFavorite } : story
      )
    );
  };

  const handleDeleteStory = (id: string) => {
    setStories((prevStories) => prevStories.filter((story) => story.id !== id));
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
            className="bg-indigo-600 hover:bg-indigo-700 flex-shrink-0"
          >
            <Plus className="mr-2 h-4 w-4" />
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
                          filterLanguage === "english" && "bg-gray-800 text-indigo-300"
                        )}
                        onClick={() => setFilterLanguage("english")}
                      >
                        <span>English 🇺🇸</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className={cn(
                          "cursor-pointer",
                          filterLanguage === "french" && "bg-gray-800 text-indigo-300"
                        )}
                        onClick={() => setFilterLanguage("french")}
                      >
                        <span>French 🇫🇷</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className={cn(
                          "cursor-pointer",
                          filterLanguage === "japanese" && "bg-gray-800 text-indigo-300"
                        )}
                        onClick={() => setFilterLanguage("japanese")}
                      >
                        <span>Japanese 🇯🇵</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className={cn(
                          "cursor-pointer",
                          filterLanguage === "indonesian" && "bg-gray-800 text-indigo-300"
                        )}
                        onClick={() => setFilterLanguage("indonesian")}
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
                  {stories.length === 0 ? (
                    <EmptyLibrary />
                  ) : filteredStories.length === 0 ? (
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
                      {filteredStories.map((story) => (
                        <StoryCard
                          key={story.id}
                          story={story}
                          onToggleFavorite={() => toggleFavorite(story.id)}
                          onDelete={() => handleDeleteStory(story.id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {filteredStories.map((story) => (
                        <StoryListItem
                          key={story.id}
                          story={story}
                          onToggleFavorite={() => toggleFavorite(story.id)}
                          onDelete={() => handleDeleteStory(story.id)}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="favorites" className="pt-2">
                  {stories.filter(s => s.isFavorite).length === 0 ? (
                    <FavoriteStories />
                  ) : filteredStories.length === 0 ? (
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
                      {filteredStories.map((story) => (
                        <StoryCard
                          key={story.id}
                          story={story}
                          onToggleFavorite={() => toggleFavorite(story.id)}
                          onDelete={() => handleDeleteStory(story.id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {filteredStories.map((story) => (
                        <StoryListItem
                          key={story.id}
                          story={story}
                          onToggleFavorite={() => toggleFavorite(story.id)}
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
        {!isLoading && stories.length > 0 && (
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