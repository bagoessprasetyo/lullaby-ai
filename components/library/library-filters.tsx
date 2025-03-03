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
  
  // Update URL with new search params
  const updateSearchParams = (params: Record<string, string | null>) => {
    setIsSearching(true);
    
    const url = new URL(window.location.href);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value === null) {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, value);
      }
    });
    
    startTransition(() => {
      router.push(url.pathname + url.search);
      setTimeout(() => setIsSearching(false), 300); // A slight delay to avoid UI flicker
    });
  };
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    updateSearchParams({ tab: value });
  };
  
  // Handle view mode change
  const handleViewModeChange = (mode: "grid" | "list") => {
    updateSearchParams({ view: mode });
  };
  
  // Handle search query change
  const handleSearch = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    updateSearchParams({ q: search.length > 0 ? search : null });
  };

  // Clear search
  const handleClearSearch = () => {
    setSearch('');
    updateSearchParams({ q: null });
    // Focus the search input after clearing
    setTimeout(() => searchInputRef.current?.focus(), 10);
  };
  
  // Handle sort change
  const handleSortChange = (value: string) => {
    updateSearchParams({ sort: value });
  };
  
  // Handle language filter change
  const handleLanguageChange = (value: string | null) => {
    updateSearchParams({ language: value });
  };
  
  // Update local search state if URL param changes
  useEffect(() => {
    setSearch(searchQuery);
  }, [searchQuery]);
  
  // Auto-search when debounced search changes (only if non-empty)
  useEffect(() => {
    if (debouncedSearch !== searchQuery && debouncedSearch.length > 0) {
      handleSearch();
    }
  }, [debouncedSearch]);
  
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
              className="bg-indigo-600 hover:bg-indigo-700 hidden md:flex"
              disabled={isSearching}
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
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