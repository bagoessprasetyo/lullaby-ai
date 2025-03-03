// app/dashboard/stories/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { DashboardNavbar } from "@/components/dashboard/navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Plus,
  Search,
  SlidersHorizontal,
  Heart,
  Calendar,
  Clock,
  ChevronDown,
  X,
  Filter,
  PlayCircle
} from "lucide-react";
import { Story } from "@/types/story";
import { formatDuration } from "@/lib/format-duration";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { createApiServices } from "@/lib/api/apiService";
import Link from "next/link";

export default function StoriesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const apiServices = createApiServices(session);
  
  // State for stories and pagination
  const [stories, setStories] = useState<Story[]>([]);
  const [totalStories, setTotalStories] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [theme, setTheme] = useState<string>("");
  const [language, setLanguage] = useState<string>("");
  const [isFavorite, setIsFavorite] = useState<boolean | null>(null);
  const [sortBy, setSortBy] = useState("newest");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(12);
  
  // Audio player state
  const [playingStoryId, setPlayingStoryId] = useState<string | null>(null);

  // Effect to load URL parameters
  useEffect(() => {
    const page = searchParams.get("page");
    const query = searchParams.get("q");
    const themeParam = searchParams.get("theme");
    const langParam = searchParams.get("lang");
    const favParam = searchParams.get("favorite");
    const sort = searchParams.get("sort");
    
    if (page) setCurrentPage(parseInt(page));
    if (query) setSearchQuery(query);
    if (themeParam) setTheme(themeParam);
    if (langParam) setLanguage(langParam);
    if (favParam) setIsFavorite(favParam === "true");
    if (sort) setSortBy(sort);
  }, [searchParams]);
  
  // Effect to load stories
  useEffect(() => {
    const loadStories = async () => {
      if (!session) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Prepare filter params
        const offset = (currentPage - 1) * limit;
        const orderBy = sortMapping[sortBy] || "created_at:desc";
        
        // Call API
        const response = await apiServices.story.getStories({
          limit,
          offset,
          theme: theme || undefined,
          language: language || undefined,
          isFavorite: isFavorite === null ? undefined : isFavorite,
          search: searchQuery || undefined,
          orderBy
        });
        
        if (response.success) {
          setStories(response.stories);
          setTotalStories(response.total);
        } else {
          setError("Failed to load stories");
        }
      } catch (error) {
        console.error("Error loading stories:", error);
        setError("An error occurred while loading stories. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadStories();
  }, [session, currentPage, limit, theme, language, isFavorite, searchQuery, sortBy, apiServices.story]);
  
  // Sort options mapping
  const sortMapping: Record<string, string> = {
    "newest": "created_at:desc",
    "oldest": "created_at:asc",
    "longest": "duration:desc",
    "shortest": "duration:asc",
    "title-asc": "title:asc",
    "title-desc": "title:desc",
    "most-played": "play_count:desc"
  };
  
  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    updateUrl();
  };
  
  // Handle filter changes
  const applyFilters = () => {
    setCurrentPage(1);
    updateUrl();
  };
  
  // Reset filters
  const resetFilters = () => {
    setTheme("");
    setLanguage("");
    setIsFavorite(null);
    setSortBy("newest");
    setCurrentPage(1);
    updateUrl();
  };
  
  // Update URL with current filters
  const updateUrl = () => {
    const params = new URLSearchParams();
    
    if (currentPage > 1) params.set("page", currentPage.toString());
    if (searchQuery) params.set("q", searchQuery);
    if (theme) params.set("theme", theme);
    if (language) params.set("lang", language);
    if (isFavorite !== null) params.set("favorite", isFavorite.toString());
    if (sortBy !== "newest") params.set("sort", sortBy);
    
    const queryString = params.toString();
    router.push(`/dashboard/stories${queryString ? `?${queryString}` : ''}`);
  };
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateUrl();
  };
  
  // Toggle story playback
  const togglePlayStory = (storyId: string) => {
    if (playingStoryId === storyId) {
      setPlayingStoryId(null);
    } else {
      setPlayingStoryId(storyId);
      // In a real app, play the audio
    }
  };
  
  // Toggle favorite status
  const toggleFavorite = async (storyId: string, currentFavorite: boolean) => {
    try {
      const response = await apiServices.story.toggleFavorite(storyId, !currentFavorite);
      
      if (response.success) {
        // Update the story in the list
        setStories(stories.map(story => 
          story.id === storyId 
            ? { ...story, is_favorite: !currentFavorite } 
            : story
        ));
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };
  
  // Calculate total pages
  const totalPages = Math.ceil(totalStories / limit);
  
  // Check if filters are active
  const hasActiveFilters = theme || language || isFavorite !== null || sortBy !== "newest";
  
  return (
    <>
      <DashboardNavbar />
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Your Stories</h1>
            <p className="text-gray-400">
              Browse and manage your generated stories
            </p>
          </div>
          
          <Button
            onClick={() => router.push("/dashboard/create")}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New Story
          </Button>
        </div>
        
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search stories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-900 border-gray-800"
              />
            </div>
          </form>
          
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-gray-800">
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Sort
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-900 border-gray-800">
                <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-800" />
                <DropdownMenuItem 
                  className={sortBy === "newest" ? "bg-indigo-900/20 text-indigo-300" : ""}
                  onClick={() => {setSortBy("newest"); updateUrl();}}
                >
                  Newest First
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className={sortBy === "oldest" ? "bg-indigo-900/20 text-indigo-300" : ""}
                  onClick={() => {setSortBy("oldest"); updateUrl();}}
                >
                  Oldest First
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className={sortBy === "title-asc" ? "bg-indigo-900/20 text-indigo-300" : ""}
                  onClick={() => {setSortBy("title-asc"); updateUrl();}}
                >
                  Title (A-Z)
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className={sortBy === "title-desc" ? "bg-indigo-900/20 text-indigo-300" : ""}
                  onClick={() => {setSortBy("title-desc"); updateUrl();}}
                >
                  Title (Z-A)
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className={sortBy === "longest" ? "bg-indigo-900/20 text-indigo-300" : ""}
                  onClick={() => {setSortBy("longest"); updateUrl();}}
                >
                  Longest First
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className={sortBy === "shortest" ? "bg-indigo-900/20 text-indigo-300" : ""}
                  onClick={() => {setSortBy("shortest"); updateUrl();}}
                >
                  Shortest First
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className={sortBy === "most-played" ? "bg-indigo-900/20 text-indigo-300" : ""}
                  onClick={() => {setSortBy("most-played"); updateUrl();}}
                >
                  Most Played
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="border-gray-800 relative">
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                  {hasActiveFilters && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-indigo-500 rounded-full" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-gray-950 border-gray-800">
                <SheetHeader>
                  <SheetTitle className="text-white">Filter Stories</SheetTitle>
                  <SheetDescription>
                    Customize which stories are displayed.
                  </SheetDescription>
                </SheetHeader>
                
                <div className="space-y-6 py-6">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-300">Theme</h4>
                    <Select value={theme} onValueChange={setTheme}>
                      <SelectTrigger className="bg-gray-900 border-gray-800">
                        <SelectValue placeholder="All themes" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-800">
                        <SelectItem value="">All themes</SelectItem>
                        <SelectItem value="adventure">Adventure</SelectItem>
                        <SelectItem value="fantasy">Fantasy</SelectItem>
                        <SelectItem value="bedtime">Bedtime</SelectItem>
                        <SelectItem value="educational">Educational</SelectItem>
                        <SelectItem value="customized">Customized</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-300">Language</h4>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger className="bg-gray-900 border-gray-800">
                        <SelectValue placeholder="All languages" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-800">
                        <SelectItem value="">All languages</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="ja">Japanese</SelectItem>
                        <SelectItem value="id">Indonesian</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-300">Favorites</h4>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="favorites-only" 
                        checked={isFavorite === true}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setIsFavorite(true);
                          } else {
                            setIsFavorite(null);
                          }
                        }}
                      />
                      <label
                        htmlFor="favorites-only"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-300"
                      >
                        Favorites only
                      </label>
                    </div>
                  </div>
                </div>
                
                <SheetFooter className="flex-row justify-between">
                  <Button
                    variant="ghost"
                    onClick={resetFilters}
                    className="text-gray-400"
                  >
                    Reset Filters
                  </Button>
                  <SheetClose asChild>
                    <Button 
                      onClick={applyFilters}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      Apply Filters
                    </Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
            
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="icon"
                onClick={resetFilters}
                className="text-gray-400 hover:text-white hover:bg-gray-800"
                title="Clear filters"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Active filters display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mb-6">
            {theme && (
              <Badge variant="outline" className="flex gap-1 items-center border-gray-700">
                Theme: {theme.charAt(0).toUpperCase() + theme.slice(1)}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => {setTheme(""); updateUrl();}}
                />
              </Badge>
            )}
            
            {language && (
              <Badge variant="outline" className="flex gap-1 items-center border-gray-700">
                Language: {language.toUpperCase()}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => {setLanguage(""); updateUrl();}}
                />
              </Badge>
            )}
            
            {isFavorite === true && (
              <Badge variant="outline" className="flex gap-1 items-center border-gray-700">
                Favorites only
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => {setIsFavorite(null); updateUrl();}}
                />
              </Badge>
            )}
            
            {sortBy !== "newest" && (
              <Badge variant="outline" className="flex gap-1 items-center border-gray-700">
                Sort: {sortBy.replace("-", " ").split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => {setSortBy("newest"); updateUrl();}}
                />
              </Badge>
            )}
          </div>
        )}
        
        {/* Stories grid */}
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-800 rounded-md p-4 text-center text-red-300">
            <p>{error}</p>
            <Button 
              variant="outline"
              className="mt-4 border-red-800 hover:bg-red-900/20"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        ) : stories.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="bg-gray-900 rounded-full p-4 mb-4">
              <Search className="h-8 w-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No stories found</h3>
            <p className="text-gray-400 mb-6 max-w-md">
              {searchQuery || hasActiveFilters 
                ? "No stories match your current filters. Try adjusting your search or filters." 
                : "You haven't created any stories yet. Get started by creating your first story!"}
            </p>
            {(searchQuery || hasActiveFilters) ? (
              <Button 
                variant="outline"
                className="border-gray-800 hover:bg-gray-800"
                onClick={resetFilters}
              >
                Clear Filters
              </Button>
            ) : (
              <Button 
                onClick={() => router.push("/dashboard/create")}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create First Story
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story) => (
              <Card 
                key={story.id} 
                className="bg-gray-900 border-gray-800 overflow-hidden hover:border-gray-700 transition-all cursor-pointer group"
              >
                <Link href={`/dashboard/stories/${story.id}`} className="block">
                  {/* Story Thumbnail */}
                  <div className="aspect-video relative overflow-hidden">
                    {story.images && story.images.length > 0 && (
                      <img
                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${story.images[0].storage_path}`}
                        alt={story.title}
                        className="object-cover w-full h-full transition-transform group-hover:scale-105"
                      />
                    )}
                    
                    {/* Duration Badge */}
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(story.duration || 0)}
                    </div>
                    
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                      <div className="rounded-full bg-indigo-500/80 p-3">
                        <PlayCircle className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </div>
                </Link>
                
                {/* Story Details */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <Link href={`/dashboard/stories/${story.id}`} className="block">
                      <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">{story.title}</h3>
                    </Link>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 ${story.is_favorite ? 'text-red-500 hover:text-red-600' : 'text-gray-500 hover:text-gray-300'}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFavorite(story.id, story.is_favorite);
                      }}
                    >
                      <Heart className="h-4 w-4" fill={story.is_favorite ? "currentColor" : "none"} />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(story.created_at).toLocaleDateString()}
                    </span>
                    
                    <span className="flex items-center gap-1">
                      <Badge className="h-4 text-[10px] bg-gray-800 text-gray-300 hover:bg-gray-800">
                        {story.theme.charAt(0).toUpperCase() + story.theme.slice(1)}
                      </Badge>
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        
        {/* Pagination */}
        {!isLoading && stories.length > 0 && totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                
                {[...Array(totalPages)].map((_, index) => {
                  const page = index + 1;
                  // Show current page, first, last, and pages around current
                  if (
                    page === 1 || 
                    page === totalPages || 
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => handlePageChange(page)}
                          isActive={page === currentPage}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                  
                  // Show ellipsis for skipped pages
                  if (
                    (page === 2 && currentPage > 3) || 
                    (page === totalPages - 1 && currentPage < totalPages - 2)
                  ) {
                    return (
                      <PaginationItem key={page}>
                        <span className="px-4 py-2 text-gray-500">...</span>
                      </PaginationItem>
                    );
                  }
                  
                  return null;
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </>
  );
}