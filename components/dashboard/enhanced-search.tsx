"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, X, Book, Clock, Tags, RefreshCw,
  MoonStar, Compass, Sparkles, GraduationCap, Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

import { Story } from "@/types/story";
import Image from "next/image";
import { ClientDate } from "@/components/client-date";

interface SearchBarProps {
  allStories: Story[];
  recentSearches?: string[];
  isLoading?: boolean;
  className?: string;
  onSearch?: (query: string) => void;
  onFilterApply?: (filters: SearchFilters) => void;
}

interface SearchFilters {
  language?: string;
  theme?: string;
  favorites?: boolean;
  dateRange?: 'today' | 'week' | 'month' | 'all';
}

export function EnhancedSearchBar({
  allStories,
  recentSearches = [],
  isLoading = false,
  className = "",
  onSearch,
  onFilterApply
}: SearchBarProps) {
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<Story[]>([]);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const commandRef = useRef<React.ElementRef<typeof Command>>(null);
  
  // Initialize recent searches from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedSearches = localStorage.getItem('recentSearches');
        if (savedSearches) {
          setRecentQueries(JSON.parse(savedSearches));
        } else if (recentSearches.length > 0) {
          setRecentQueries(recentSearches);
        }
      } catch (error) {
        console.error('Error loading recent searches:', error);
        setRecentQueries(recentSearches);
      }
    }
  }, [recentSearches]);
  
  // Handle clicks outside the search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Fix the type checking for commandRef.current
      if (commandRef.current && commandRef.current instanceof Object && 'element' in commandRef.current) {
        const element = commandRef.current.element;
        if (element instanceof HTMLElement && !element.contains(event.target as Node)) {
          setShowSearchResults(false);
        }
      } else if (commandRef.current && !commandRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  // Filter and search stories based on query and filters - optimized
  const performSearch = useCallback(() => {
    if (!searchQuery.trim() && Object.keys(filters).length === 0) {
      setSearchResults([]);
      return;
    }
    
    // Check if allStories is available and valid
    if (!Array.isArray(allStories) || allStories.length === 0) {
      setSearchResults([]);
      return;
    }
    
    let results = [...allStories];
    
    // Apply text search if query exists
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      results = results.filter(story => 
        story.title?.toLowerCase().includes(query)
      );
    }
    
    // Apply filters with null/undefined checks
    if (filters.language) {
      results = results.filter(story => story?.language === filters.language);
    }
    
    if (filters.theme) {
      results = results.filter(story => story?.theme === filters.theme);
    }
    
    if (filters.favorites) {
      results = results.filter(story => story?.is_favorite === true);
    }
    
    if (filters.dateRange) {
      const now = new Date();
      let cutoffDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          cutoffDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'all':
        default:
          cutoffDate = new Date(0); // Beginning of time
          break;
      }
      
      results = results.filter(story => 
        story?.created_at && new Date(story.created_at) >= cutoffDate
      );
    }
    
    setSearchResults(results);
  }, [searchQuery, filters, allStories]);
  
  // Update search results when query or filters change
  useEffect(() => {
    performSearch();
  }, [searchQuery, filters, performSearch]);
  
  // Update active filters text display
  useEffect(() => {
    const newActiveFilters: string[] = [];
    
    if (filters.language) {
      newActiveFilters.push(
        filters.language === 'en' ? 'English' : 
        filters.language === 'fr' ? 'French' : 
        filters.language === 'ja' ? 'Japanese' : 
        filters.language === 'id' ? 'Indonesian' : 
        filters.language
      );
    }
    
    if (filters.theme) {
      newActiveFilters.push(
        filters.theme.charAt(0).toUpperCase() + filters.theme.slice(1)
      );
    }
    
    if (filters.favorites) {
      newActiveFilters.push('Favorites');
    }
    
    if (filters.dateRange) {
      newActiveFilters.push(
        filters.dateRange === 'today' ? 'Today' :
        filters.dateRange === 'week' ? 'This Week' :
        filters.dateRange === 'month' ? 'This Month' :
        'All Time'
      );
    }
    
    setActiveFilters(newActiveFilters);
  }, [filters]);
  
  // Handle search input change - improved
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Only show results if there's a query or active filters
    if (value.trim() || Object.keys(filters).length > 0) {
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
    
    if (onSearch) {
      onSearch(value);
    }
  };
  
  // Handle search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (searchQuery.trim()) {
      // Save to recent searches if not already there
      if (!recentQueries.includes(searchQuery.trim())) {
        const updatedRecent = [searchQuery.trim(), ...recentQueries].slice(0, 5);
        setRecentQueries(updatedRecent);
        
        // Save to localStorage
        localStorage.setItem('recentSearches', JSON.stringify(updatedRecent));
      }
      
      // Navigate to library with search query
      router.push(`/dashboard/library?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearchResults(false);
    }
  };
  
  // Handle clicking a search result
  const handleResultClick = (storyId: string) => {
    router.push(`/dashboard/stories/${storyId}`);
    setShowSearchResults(false);
  };
  
  // Handle filter changes - improved
  const applyFilter = (type: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters };
    
    // Toggle boolean filters
    if (type === 'favorites') {
      newFilters[type] = !newFilters[type];
      if (!newFilters[type]) {
        delete newFilters[type];
      }
    } 
    // Toggle other filters (replace or remove if same)
    else {
      if (newFilters[type] === value) {
        delete newFilters[type];
      } else {
        newFilters[type] = value;
      }
    }
    
    setFilters(newFilters);
    
    // Show search results if we have filters, even without a query
    if (Object.keys(newFilters).length > 0 || searchQuery.trim()) {
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
    
    if (onFilterApply) {
      onFilterApply(newFilters);
    }
  };
  
  // Clear all filters - improved
  const clearFilters = () => {
    setFilters({});
    
    // Hide results if there's no search query
    if (!searchQuery.trim()) {
      setShowSearchResults(false);
    }
    
    if (onFilterApply) {
      onFilterApply({});
    }
  };
  
  // Get icon for theme
  const getThemeIcon = (theme: string) => {
    switch (theme) {
      case 'adventure': return <Compass className="h-4 w-4 text-blue-400 mr-2" />;
      case 'fantasy': return <Sparkles className="h-4 w-4 text-purple-400 mr-2" />;
      case 'bedtime': return <MoonStar className="h-4 w-4 text-indigo-400 mr-2" />;
      case 'educational': return <GraduationCap className="h-4 w-4 text-green-400 mr-2" />;
      default: return <Book className="h-4 w-4 text-gray-400 mr-2" />;
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          
          <Input
            ref={searchRef}
            type="search"
            placeholder="Search stories..."
            className="pl-10 pr-10 bg-gray-900 border-gray-700 focus-visible:ring-indigo-500 w-full"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => setShowSearchResults(true)}
          />
          
          {/* Filter Dropdown */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-gray-400 hover:text-gray-300 mr-1"
                onClick={() => {
                  setSearchQuery("");
                  searchRef.current?.focus();
                }}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Clear</span>
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${Object.keys(filters).length > 0 ? 'text-indigo-400' : 'text-gray-500'}`}
                >
                  <Tags className="h-4 w-4" />
                  <span className="sr-only">Filters</span>
                  
                  {/* Filter badge */}
                  {Object.keys(filters).length > 0 && (
                    <span className="absolute top-0 right-0 h-2 w-2 bg-indigo-500 rounded-full" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Filters</DropdownMenuLabel>
                
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs text-gray-500">Language</DropdownMenuLabel>
                  
                  <DropdownMenuItem 
                    onClick={() => applyFilter('language', 'en')}
                    className={filters.language === 'en' ? 'bg-indigo-500/10 text-indigo-400' : ''}
                  >
                    English
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    onClick={() => applyFilter('language', 'fr')}
                    className={filters.language === 'fr' ? 'bg-indigo-500/10 text-indigo-400' : ''}
                  >
                    French
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    onClick={() => applyFilter('language', 'ja')}
                    className={filters.language === 'ja' ? 'bg-indigo-500/10 text-indigo-400' : ''}
                  >
                    Japanese
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    onClick={() => applyFilter('language', 'id')}
                    className={filters.language === 'id' ? 'bg-indigo-500/10 text-indigo-400' : ''}
                  >
                    Indonesian
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs text-gray-500">Theme</DropdownMenuLabel>
                  
                  <DropdownMenuItem 
                    onClick={() => applyFilter('theme', 'adventure')}
                    className={filters.theme === 'adventure' ? 'bg-indigo-500/10 text-indigo-400' : ''}
                  >
                    <Compass className="mr-2 h-4 w-4" />
                    Adventure
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    onClick={() => applyFilter('theme', 'fantasy')}
                    className={filters.theme === 'fantasy' ? 'bg-indigo-500/10 text-indigo-400' : ''}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Fantasy
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    onClick={() => applyFilter('theme', 'bedtime')}
                    className={filters.theme === 'bedtime' ? 'bg-indigo-500/10 text-indigo-400' : ''}
                  >
                    <MoonStar className="mr-2 h-4 w-4" />
                    Bedtime
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    onClick={() => applyFilter('theme', 'educational')}
                    className={filters.theme === 'educational' ? 'bg-indigo-500/10 text-indigo-400' : ''}
                  >
                    <GraduationCap className="mr-2 h-4 w-4" />
                    Educational
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs text-gray-500">Time Period</DropdownMenuLabel>
                  
                  <DropdownMenuItem 
                    onClick={() => applyFilter('dateRange', 'today')}
                    className={filters.dateRange === 'today' ? 'bg-indigo-500/10 text-indigo-400' : ''}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Today
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    onClick={() => applyFilter('dateRange', 'week')}
                    className={filters.dateRange === 'week' ? 'bg-indigo-500/10 text-indigo-400' : ''}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    This Week
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    onClick={() => applyFilter('dateRange', 'month')}
                    className={filters.dateRange === 'month' ? 'bg-indigo-500/10 text-indigo-400' : ''}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    This Month
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={() => applyFilter('favorites', true)}
                  className={filters.favorites ? 'bg-indigo-500/10 text-indigo-400' : ''}
                >
                  <Heart className="mr-2 h-4 w-4" />
                  Favorites Only
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  disabled={Object.keys(filters).length === 0}
                  className="w-full justify-start text-gray-400 hover:text-white"
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear All Filters
                </Button>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </form>
        
        {/* Active filters display - improved */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {activeFilters.map((filter, index) => (
              <div 
                key={index}
                className="bg-indigo-900/20 text-indigo-300 text-xs px-2 py-1 rounded-full border border-indigo-800/50 flex items-center"
              >
                {filter}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 text-indigo-300 hover:text-white p-0"
                  onClick={() => {
                    // Find which filter this is and remove it
                    if (filter === 'Favorites') {
                      applyFilter('favorites', false);
                    } else if (['English', 'French', 'Japanese', 'Indonesian'].includes(filter)) {
                      applyFilter('language', filters.language);
                    } else if (['Adventure', 'Fantasy', 'Bedtime', 'Educational'].includes(filter)) {
                      applyFilter('theme', filters.theme);
                    } else if (['Today', 'This Week', 'This Month', 'All Time'].includes(filter)) {
                      applyFilter('dateRange', filters.dateRange);
                    }
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-gray-400 hover:text-white px-2 py-0 h-6"
              onClick={clearFilters}
            >
              Clear All
            </Button>
          </div>
        )}
      </div>
      
      {/* Search Results Dropdown - improved */}
      <AnimatePresence>
        {showSearchResults && (
          <motion.div
            className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border border-gray-700 bg-gray-900 shadow-lg"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            <Command ref={commandRef} className="bg-transparent border-none shadow-none">
              <CommandInput 
                placeholder="Type to search..." 
                value={searchQuery}
                onValueChange={setSearchQuery}
                className="border-b border-gray-700"
              />
              <CommandList className="max-h-80">
                <div className="py-2">
                {isLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <RefreshCw className="h-6 w-6 text-gray-400 animate-spin" />
                    <span className="ml-2 text-gray-400">Searching stories...</span>
                  </div>
                ) : searchQuery.trim() || Object.keys(filters).length > 0 ? (
                  <>
                    {/* Search Results */}
                    {searchResults.length > 0 ? (
                      <CommandGroup heading="Results">
                        {searchResults.map((story) => (
                          <CommandItem
                            key={story.id}
                            onSelect={() => handleResultClick(story.id)}
                            className="flex items-center py-2 px-2 cursor-pointer"
                          >
                            <div className="relative w-10 h-10 rounded overflow-hidden mr-3 flex-shrink-0">
                              {story.coverImage || (story.images && story.images.length > 0) ? (
                                <Image
                                  src={story.coverImage || 
                                    (story.images && story.images.length > 0 && story.images[0].storage_path ?
                                      (story.images[0].storage_path.includes('cloudinary.com') ? 
                                        story.images[0].storage_path :
                                        `https://res.cloudinary.com/dcx38wpwa/image/upload/v1741976467/story-app-stories/${story.images[0].storage_path.split('/').pop()}`) :
                                      `/images/theme-${story.theme || 'adventure'}.jpg`)}
                                  alt={story.title}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                getThemeIcon(story.theme || 'adventure')
                              )}
                            </div>
                            <div className="overflow-hidden">
                              <div className="font-medium text-white truncate">{story.title}</div>
                              <div className="text-xs text-gray-400 flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                <ClientDate date={story.created_at} format="short" />
                                {story.is_favorite && <Heart className="h-3 w-3 ml-2 fill-pink-500 text-pink-500" />}
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                        {searchResults.length > 5 && (
                          <div className="px-2 py-1.5 text-center">
                            <Button
                              variant="link"
                              size="sm"
                              className="text-indigo-400 hover:text-indigo-300 text-xs"
                              onClick={() => {
                                router.push(`/dashboard/library?q=${encodeURIComponent(searchQuery.trim())}`);
                                setShowSearchResults(false);
                              }}
                            >
                              See all {searchResults.length} results
                            </Button>
                          </div>
                        )}
                      </CommandGroup>
                    ) : (
                      <CommandEmpty className="py-6 text-center text-gray-400">
                        No stories found matching your search
                      </CommandEmpty>
                    )}
                  </>
                ) : (
                  <>
                    {/* Recent Searches */}
                    {recentQueries.length > 0 && (
                      <CommandGroup heading="Recent Searches">
                        {recentQueries.map((query, index) => (
                          <CommandItem
                            key={index}
                            onSelect={() => {
                              setSearchQuery(query);
                              searchRef.current?.focus();
                              performSearch();
                            }}
                            className="flex items-center cursor-pointer"
                          >
                            <Clock className="h-4 w-4 mr-2 text-gray-400" />
                            <span>{query}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                    
                    {/* Navigation Suggestions */}
                    <CommandGroup heading="Quick Navigation">
                      <CommandItem
                        onSelect={() => router.push("/dashboard/library")}
                        className="cursor-pointer"
                      >
                        <Book className="h-4 w-4 mr-2 text-indigo-400" />
                        <span>View All Stories</span>
                      </CommandItem>
                      <CommandItem
                        onSelect={() => router.push("/dashboard/create")}
                        className="cursor-pointer"
                      >
                        <Sparkles className="h-4 w-4 mr-2 text-purple-400" />
                        <span>Create New Story</span>
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
                </div>
              </CommandList>
            </Command>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}