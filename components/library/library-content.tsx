// components/library/library-content.tsx
import { EmptyLibrary } from "@/components/library/empty-library";
import { FavoriteStories } from "@/components/library/favorite-stories";
import { StoryGrid } from "@/components/library/story-grid";
import { StoryList } from "@/components/library/story-list";
import { getStoriesWithFilters } from "@/lib/services/story-service";
import { Search } from "lucide-react";

// Ensure no caching for this component
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

interface LibraryContentProps {
  userId: string;
  currentTab: string;
  viewMode: "grid" | "list";
  searchQuery: string;
  filterLanguage: string | null;
  sortBy: string;
}

export async function LibraryContent({
  userId,
  currentTab,
  viewMode,
  searchQuery,
  filterLanguage,
  sortBy,
}: LibraryContentProps) {
  // Log parameters to help with debugging
  console.log('LibraryContent rendering with params:', {
    userId, currentTab, viewMode, searchQuery, filterLanguage, sortBy
  });

  // Fetch stories based on filters with no-store to prevent caching
  const { stories, count } = await getStoriesWithFilters(userId, {
    filterLanguage,
    isFavorite: currentTab === "favorites" ? true : null,
    searchQuery,
    sortBy,
  });

  // If no stories in the library at all
  if (count === 0 && currentTab === "all" && !searchQuery && !filterLanguage) {
    return <EmptyLibrary />;
  }

  // If no favorite stories
  if (count === 0 && currentTab === "favorites" && !searchQuery && !filterLanguage) {
    return <FavoriteStories />;
  }

  // If no stories match the current filters
  if (stories.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-900/50 border border-gray-800 rounded-xl">
        <div className="bg-gray-800/70 rounded-full p-3 inline-flex mb-4">
          <Search className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          No stories found
        </h3>
        <p className="text-gray-400 max-w-md mx-auto">
          {searchQuery ? (
            <>
              We couldn't find any stories matching "<strong>{searchQuery}</strong>".
              Try adjusting your search or filters.
            </>
          ) : (
            <>
              We couldn't find any stories matching your current filters.
              Try adjusting your filters.
            </>
          )}
        </p>
      </div>
    );
  }

  // Format story data for components
  const formattedStories = stories.map((story) => ({
    id: story.id,
    title: story.title,
    coverImage:
      story.images && story.images.length > 0
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${story.images[0].storage_path}`
        : "https://via.placeholder.com/300x300?text=No+Image",
    duration: story.duration || 0,
    language: story.language || "en",
    createdAt: new Date(story.created_at),
    isFavorite: story.is_favorite,
    thumbnail:
      story.images && story.images.length > 0
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${story.images[0].storage_path}`
        : "https://via.placeholder.com/100x100?text=No+Image",
    backgroundMusic: "", // Could be fetched if needed
    characters: [], // Could be fetched if needed
    tags: [], // Could be fetched if needed
  }));

  // Return either grid or list view based on viewMode
  return viewMode === "grid" ? (
    <StoryGrid stories={formattedStories} />
  ) : (
    <StoryList stories={formattedStories} />
  );
}