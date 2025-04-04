"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import {
  Search,
  BookOpen,
  Grid,
  List,
  Calendar,
  Clock,
  SlidersHorizontal,
  ChevronDown,
  BookMarked,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LibraryFiltersProps {
  currentTab: string;
  viewMode: "grid" | "list";
  searchQuery: string;
  filterLanguage: string | null;
  sortBy: string;
}

// Helper function for debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function LibraryFilters({
  currentTab,
  viewMode,
  searchQuery,
  filterLanguage,
  sortBy,
}: LibraryFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Local state for controlled inputs
  const [search, setSearch] = useState(searchQuery);
  const [isSearching, setIsSearching] = useState(false);
  
  // Debounced search value for automatic search
  const debouncedSearch = useDebounce(search, 500);
  
  // Update URL with new search params - improved version
  const updateSearchParams = (params: Record<string, string | null>) => {
    setIsSearching(true);
    
    // Create a new URL object to work with
    const url = new URL(window.location.href);
    
    // Track if we're clearing the search
    const isClearingSearch = params.q === null && searchQuery !== '';
    
    // Update URL parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value === null) {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, value);
      }
    });
    
    // Use startTransition to avoid UI jank
    startTransition(() => {
      // Use replace instead of push for smoother experience when clearing
      if (isClearingSearch) {
        // Force a hard navigation when clearing search to ensure data refresh
        window.location.href = `${pathname}?${url.searchParams.toString()}`;
        return;
      } else {
        router.push(`${pathname}?${url.searchParams.toString()}`, { scroll: false });
      }
      
      // Delay turning off the loading state to ensure the UI has time to update
      setTimeout(() => setIsSearching(false), 500);
    });
  };
  
  // Handle search query change - improved version
  // const handleSearch = (e?: React.FormEvent) => {
  //   if (e) {
  //     e.preventDefault();
  //   }
    
  //   // Cancel any pending search operations
  //   setIsSearching(true);
    
  //   // Ensure search is triggered even when clearing the input
  //   if (search.length === 0) {
  //     updateSearchParams({ q: null });
  //   } else {
  //     updateSearchParams({ q: search });
  //   }
  // };

  // Clear search - improved version
  const handleClearSearch = () => {
    // First update local state
    setSearch('');
    setIsSearching(true);
    
    // Create new URL with all current params except 'q'
    const newParams = new URLSearchParams(window.location.search);
    newParams.delete('q');
    
    // Force a hard navigation to ensure data refresh
    window.location.href = `${pathname}?${newParams.toString()}`;
  };
  
  // Handle tab change
  // const handleTabChange = (value: string) => {
  //   updateSearchParams({ tab: value });
  // };
  
  // // Handle view mode change
  // const handleViewModeChange = (mode: "grid" | "list") => {
  //   updateSearchParams({ view: mode });
  // };
  
  // Modify the handleSearch function to use the same approach as other filters
  const handleSearch = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    // Cancel any pending search operations
    setIsSearching(true);
    
    // Create new URL with updated search parameter
    const newParams = new URLSearchParams(window.location.search);
    
    // Ensure search is triggered even when clearing the input
    if (search.length === 0) {
      newParams.delete('q');
    } else {
      newParams.set('q', search);
    }
    
    // Force a hard navigation to ensure data refresh
    window.location.href = `${pathname}?${newParams.toString()}`;
  };
  
  // Update the auto-search effect to be more conservative
  useEffect(() => {
    // Only trigger search if the debounced value is different from URL
    // and has at least 2 characters (to avoid excessive searches)
    if (debouncedSearch !== searchQuery && 
        (debouncedSearch.length >= 2 || debouncedSearch.length === 0)) {
      handleSearch();
    }
  }, [debouncedSearch, searchQuery]);
  
  // Handle sort change
  const handleSortChange = (value: string) => {
    setIsSearching(true);
    // Create new URL with updated sort parameter
    const newParams = new URLSearchParams(window.location.search);
    newParams.set('sort', value);
    
    // Force a hard navigation to ensure data refresh
    window.location.href = `${pathname}?${newParams.toString()}`;
  };
  
  // Handle language filter change
  const handleLanguageChange = (value: string | null) => {
    setIsSearching(true);
    // Create new URL with updated language parameter
    const newParams = new URLSearchParams(window.location.search);
    if (value === null) {
      newParams.delete('language');
    } else {
      newParams.set('language', value);
    }
    
    // Force a hard navigation to ensure data refresh
    window.location.href = `${pathname}?${newParams.toString()}`;
  };
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setIsSearching(true);
    // Create new URL with updated tab parameter
    const newParams = new URLSearchParams(window.location.search);
    newParams.set('tab', value);
    
    // Force a hard navigation to ensure data refresh
    window.location.href = `${pathname}?${newParams.toString()}`;
  };
  
  // Handle view mode change
  const handleViewModeChange = (mode: "grid" | "list") => {
    setIsSearching(true);
    // Create new URL with updated view parameter
    const newParams = new URLSearchParams(window.location.search);
    newParams.set('view', mode);
    
    // Force a hard navigation to ensure data refresh
    window.location.href = `${pathname}?${newParams.toString()}`;
  };
  
  // Update local search state if URL param changes - improved version
  useEffect(() => {
    // Only update if there's a mismatch to avoid loops
    if (search !== searchQuery) {
      setSearch(searchQuery || '');
    }
  }, [searchQuery, pathname]);
  
  // Auto-search when debounced search changes - improved version
  useEffect(() => {
    // Only trigger search if the debounced value is different from URL
    // or we're explicitly clearing the search
    if (debouncedSearch !== searchQuery || (search === '' && searchQuery)) {
      handleSearch();
    }
  }, [debouncedSearch, searchQuery]);
  
  return (
    <div className="mb-8">
      <Tabs defaultValue={currentTab} value={currentTab} onValueChange={handleTabChange}>
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

          <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
            <div className="relative w-full md:w-auto flex-1 min-w-[200px]">
              <div className="relative flex items-center">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search stories..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-16 bg-gray-900 border-gray-700 w-full"
                  disabled={isSearching}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                />
                {search && (
                  <div className="absolute right-2 flex items-center gap-2">
                    {isSearching ? (
                      <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                    ) : (
                      <button 
                        type="button" 
                        onClick={handleClearSearch}
                        className="p-1 rounded-full hover:bg-gray-800"
                      >
                        <X className="h-4 w-4 text-gray-400" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <Button
              type="submit"
              onClick={() => handleSearch()}
              className="bg-indigo-600 hover:bg-indigo-700 hidden md:flex text-white"
              disabled={isSearching}
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin text-white" />
              ) : (
                <Search className="h-4 w-4 mr-2 text-white" />
              )}
              Search
            </Button>

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
                    onClick={() => handleSortChange("newest")}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>Newest First</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={cn(
                      "cursor-pointer",
                      sortBy === "oldest" && "bg-gray-800 text-indigo-300"
                    )}
                    onClick={() => handleSortChange("oldest")}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>Oldest First</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={cn(
                      "cursor-pointer",
                      sortBy === "longest" && "bg-gray-800 text-indigo-300"
                    )}
                    onClick={() => handleSortChange("longest")}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    <span>Longest First</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={cn(
                      "cursor-pointer",
                      sortBy === "shortest" && "bg-gray-800 text-indigo-300"
                    )}
                    onClick={() => handleSortChange("shortest")}
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
                    onClick={() => handleLanguageChange(null)}
                  >
                    <span>All Languages</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={cn(
                      "cursor-pointer",
                      filterLanguage === "en" && "bg-gray-800 text-indigo-300"
                    )}
                    onClick={() => handleLanguageChange("en")}
                  >
                    <span>English 🇺🇸</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={cn(
                      "cursor-pointer",
                      filterLanguage === "fr" && "bg-gray-800 text-indigo-300"
                    )}
                    onClick={() => handleLanguageChange("fr")}
                  >
                    <span>French 🇫🇷</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={cn(
                      "cursor-pointer",
                      filterLanguage === "ja" && "bg-gray-800 text-indigo-300"
                    )}
                    onClick={() => handleLanguageChange("ja")}
                  >
                    <span>Japanese 🇯🇵</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={cn(
                      "cursor-pointer",
                      filterLanguage === "id" && "bg-gray-800 text-indigo-300"
                    )}
                    onClick={() => handleLanguageChange("id")}
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
                onClick={() => handleViewModeChange("grid")}
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
                onClick={() => handleViewModeChange("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Tabs>
    </div>
  );
}